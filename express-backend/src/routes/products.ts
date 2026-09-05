import { Router, Response } from 'express';
import multer from 'multer';
import * as XLSX from 'xlsx';
import { supabase } from '../config/supabase';
import { AuthRequest, authMiddleware, requireRole } from '../middleware/auth';
import {
  PACK_UNIT_OPTIONS,
  enrichProductPackFields,
  packUnitPayloadFromInput,
  resolvePackUnitLabel,
  toSupabaseProductRow,
} from '../utils/packUnit';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

const EXCEL_COLUMNS = [
  "name", "city", "mrp", "price", "wholesaler_price", "available",
  "primary_category", "secondary_category", "brand", "company", "unit",
  "quantity_value", "quantity_unit", "stock", "gst", "description",
  "short_description", "image_url", "video_url", "place", "search_keywords",
  "featured", "todays_deal", "best_seller", "is_veg"
];

// Helper to convert excel cell values to boolean
function parseBool(val: any, defaultVal = false): boolean {
  if (val === undefined || val === null) return defaultVal;
  if (typeof val === 'boolean') return val;
  const s = String(val).trim().toLowerCase();
  if (s === '') return defaultVal;
  return ['yes', 'y', 'true', '1', 'live'].includes(s);
}

// 1. GET /all: Consumer Catalog (with city pricing overrides)
// 1. GET /all: Consumer Catalog (location-aware, based on city and area)
router.get('/all', async (req, res) => {
  const area_name = (req.query.area_name as string) || (req.query.area as string);
  const { city, category, secondary, q, limit, deals, pincode } = req.query;
  const limitVal = parseInt(limit as string) || 100;
  const dealsOnly = deals === '1' || deals === 'true';

  const applyDealsFilter = (products: any[]) => {
    if (!dealsOnly) return products;
    return products
      .filter(
        (p) =>
          (p.discount_percent && p.discount_percent > 0) ||
          p.featured ||
          p.todays_deal ||
          p.best_seller ||
          (parseFloat(p.mrp) > parseFloat(p.price)),
      )
      .sort((a, b) => {
        const da = a.discount_percent || 0;
        const db = b.discount_percent || 0;
        return db - da;
      })
      .slice(0, limitVal);
  };

  try {
    // If location credentials are not provided, fallback to the old PostgreSQL pricing override behaviour
    if (!city || !area_name) {
      let query = supabase
        .from('products')
        .select(`
          *,
          product_city_prices (
            city_name,
            mrp,
            price,
            wholesaler_price,
            is_live
          )
        `)
        .eq('available', true);

      if (category) {
        query = query.eq('primary_category', category);
      }
      if (secondary) {
        query = query.eq('secondary_category', secondary);
      }
      if (q) {
        query = query.or(`name.ilike.%${q}%,brand.ilike.%${q}%,primary_category.ilike.%${q}%`);
      }

      const { data: products, error } = await query.limit(limitVal);

      if (error) {
        return res.status(500).json({ success: false, error: error.message });
      }

      const out: any[] = [];
      const targetCity = city ? String(city).trim() : '';

      for (const p of products || []) {
        const cityPrices = p.product_city_prices || [];
        const cp = cityPrices.find((c: any) => c.city_name.toLowerCase() === targetCity.toLowerCase());

        let mrp = parseFloat(p.mrp);
        let price = parseFloat(p.price);
        let isLive = true;

        if (cp) {
          if (!cp.is_live) {
            isLive = false;
          } else {
            mrp = parseFloat(cp.mrp) || mrp;
            price = parseFloat(cp.price) || price;
          }
        } else if (targetCity && cityPrices.length > 0) {
          const fallback = cityPrices.find((c: any) => c.is_live && parseFloat(c.price) > 0);
          if (fallback) {
            mrp = parseFloat(fallback.mrp) || mrp;
            price = parseFloat(fallback.price) || price;
          }
        }

        if (isLive) {
          out.push(enrichProductPackFields({
            id: p.id,
            shop_id: p.shop_id,
            name: p.name,
            sku: p.sku,
            brand: p.brand,
            company: p.company,
            primary_category: p.primary_category,
            secondary_category: p.secondary_category,
            short_description: p.short_description,
            description: p.description,
            place: p.place,
            image_url: p.image_url,
            quantity_value: p.quantity_value,
            quantity_unit: p.quantity_unit,
            unit: p.unit,
            mrp,
            price,
            is_veg: p.is_veg,
            featured: p.featured,
            todays_deal: p.todays_deal,
            best_seller: p.best_seller,
            discount_percent: mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0,
            you_save: mrp > price ? parseFloat((mrp - price).toFixed(2)) : 0,
          }));
        }
      }
      return res.json({ success: true, products: applyDealsFilter(out) });
    }

    const { fetchProductsForLocation } = require('../services/shopCatalog');
    const catalog = await fetchProductsForLocation({
      city: String(city),
      areaName: String(area_name),
      pincode: pincode ? String(pincode) : undefined,
      category: category as string | undefined,
      secondary: secondary as string | undefined,
      q: q as string | undefined,
      limit: limitVal,
    });

    return res.json({
      success: true,
      products: applyDealsFilter(catalog.products),
      shop_id: catalog.shopId,
      shop_name: catalog.shopName,
    });

  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message || 'Server error' });
  }
});

// 1.2 GET /search: Search Consumer Catalog (location-aware when city + area provided)
router.get('/search', async (req, res) => {
  const area_name = (req.query.area_name as string) || (req.query.area as string);
  const { q, category, limit, city, pincode } = req.query;
  const limitVal = parseInt(limit as string) || 50;

  try {
    if (city && area_name) {
      const { fetchProductsForLocation } = require('../services/shopCatalog');
      const catalog = await fetchProductsForLocation({
        city: String(city),
        areaName: String(area_name),
        pincode: pincode ? String(pincode) : undefined,
        category: category as string | undefined,
        q: q as string | undefined,
        limit: limitVal,
      });

      return res.json({
        success: true,
        products: catalog.products,
        shop_id: catalog.shopId,
        shop_name: catalog.shopName,
      });
    }

    const { searchProductsWithIntelligence } = require('../utils/intelligentSearch');
    let query = supabase.from('products').select('*').eq('available', true);

    if (category) {
      query = query.eq('primary_category', category);
    }

    const { data: products, error } = await query.limit(Math.max(limitVal, 100));
    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }

    const out = (products || []).map((p: any) => {
      const mrp = parseFloat(p.mrp) || 0;
      const price = parseFloat(p.price) || 0;
      return enrichProductPackFields({
        id: p.id,
        shop_id: p.shop_id || null,
        name: p.name,
        sku: p.sku,
        brand: p.brand,
        company: p.company,
        primary_category: p.primary_category,
        secondary_category: p.secondary_category,
        description: p.description,
        short_description: p.short_description,
        place: p.place,
        image_url: p.image_url,
        mrp,
        price,
        discount_percent: mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0,
        stock: p.stock || 50,
        unit: p.unit,
        is_veg: p.is_veg,
        featured: p.featured,
        todays_deal: p.todays_deal,
        best_seller: p.best_seller,
        you_save: mrp > price ? parseFloat((mrp - price).toFixed(2)) : 0,
      });
    });

    if (q && String(q).trim()) {
      const ranked = searchProductsWithIntelligence(out, String(q).trim(), category as string | undefined);
      return res.json({ success: true, products: ranked.slice(0, limitVal) });
    }

    return res.json({ success: true, products: out.slice(0, limitVal) });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message || 'Server error' });
  }
});

// 1.4 GET /pack-units: Standard pack unit options (Super Admin + Merchant + Customer)
router.get('/pack-units', (_req, res) => {
  return res.json({ success: true, pack_units: PACK_UNIT_OPTIONS });
});

// 1.5 GET /master: Fetch all master catalogue products (Merchant & Admin use)
router.get('/master', async (req, res) => {
  try {
    const { data: products, error } = await supabase
      .from('products')
      .select('*')
      .eq('available', true)
      .order('name', { ascending: true });

    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }

    return res.json({
      success: true,
      products: (products || []).map((p: any) => enrichProductPackFields(p)),
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message || 'Server error' });
  }
});

// 1.8 GET /categories: Admin-configured category tiles + product category names
router.get('/categories', async (req, res) => {
  try {
    const { readDb } = require('../config/localDb');
    const db = readDb();
    const adminCategories = db.categories || [];

    const { data: products, error } = await supabase
      .from('products')
      .select('primary_category')
      .eq('available', true);

    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }

    const productCategoryNames = Array.from(
      new Set((products || []).map((p: any) => String(p.primary_category || '').trim()).filter(Boolean)),
    ).sort((a, b) => a.localeCompare(b));

    const categoriesFull = adminCategories.map((c: { id: string; name: string; image_url?: string }) => {
      const subcategories = (db.subcategories || [])
        .filter((s: any) => s.category_id === c.id && s.active !== false)
        .sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0) || a.name.localeCompare(b.name))
        .map((s: any) => ({
          id: s.id,
          name: s.name,
          image_url: s.image_url || undefined,
        }));

      return {
        id: c.id,
        name: c.name,
        image_url: c.image_url || undefined,
        subcategories,
      };
    });

    const categories =
      categoriesFull.length > 0
        ? categoriesFull.map((c: any) => c.name)
        : productCategoryNames;

    return res.json({
      success: true,
      categories,
      categoriesFull,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message || 'Server error' });
  }
});

// 2. GET /excel-template: Download template sheet
router.get('/excel-template', authMiddleware, requireRole(['admin', 'super_admin']), (req, res) => {
  const wb = XLSX.utils.book_new();
  
  // Headers + Sample rows to guide the admin
  const samples = [
    EXCEL_COLUMNS,
    [
      "Aashirvaad Shudh Chakki Atta 10kg", "Mumbai", 499.00, 449.00, 380.00, "yes",
      "Atta & Rice", "Atta", "Aashirvaad", "ITC", "10 Kg",
      10, "kg", 100, 5, "100% whole wheat chakki atta.", "Whole wheat atta",
      "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&q=80", "", "MP, India", "atta, flour, wheat",
      "yes", "no", "yes", "yes"
    ],
    [
      "Aashirvaad Shudh Chakki Atta 10kg", "Pune", 499.00, 439.00, 380.00, "yes",
      "Atta & Rice", "Atta", "Aashirvaad", "ITC", "10 Kg",
      10, "kg", 100, 5, "100% whole wheat chakki atta.", "Whole wheat atta",
      "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&q=80", "", "MP, India", "atta, flour, wheat",
      "yes", "no", "yes", "yes"
    ]
  ];

  const ws = XLSX.utils.aoa_to_sheet(samples);
  XLSX.utils.book_append_sheet(wb, ws, "MonthlyGrocery SKUs");

  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  
  res.setHeader('Content-Disposition', 'attachment; filename="monthlygrocery-template.xlsx"');
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  return res.send(buf);
});

// 3. POST /import-excel: Bulk-import products
router.post('/import-excel', authMiddleware, requireRole(['admin', 'super_admin']), upload.single('file'), async (req: AuthRequest, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, error: 'No file uploaded' });
  }

  try {
    // Check if the current user has a shop
    const { data: shop, error: shopError } = await supabase
      .from('shops')
      .select('*')
      .eq('owner_id', req.user!.id)
      .maybeSingle();

    if (shopError || !shop) {
      return res.status(400).json({ success: false, error: 'Merchant shop not found. Please setup a shop first.' });
    }

    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet) as any[];

    let created = 0;
    let updated = 0;
    const errors: any[] = [];

    for (let idx = 0; idx < rows.length; idx++) {
      const row = rows[idx];
      const name = String(row.name || '').trim();
      const sku = String(row.sku || '').trim() || `SKU-${Date.now()}-${idx}`;
      const city = String(row.city || '').trim();

      if (!name) {
        errors.push({ row: idx + 2, error: 'Name field is blank' });
        continue;
      }

      try {
        // Try to find if product already exists by name
        let { data: product, error: findError } = await supabase
          .from('products')
          .select('*')
          .eq('sku', sku)
          .maybeSingle();

        const packFromExcel = packUnitPayloadFromInput(
          row.quantity_value,
          row.quantity_unit,
          String(row.unit || '').trim(),
        );

        const productData = {
          shop_id: shop.id,
          name,
          sku,
          barcode: String(row.barcode || '').trim() || null,
          primary_category: String(row.primary_category || 'Other').trim(),
          secondary_category: String(row.secondary_category || '').trim() || null,
          brand: String(row.brand || '').trim() || null,
          company: String(row.company || '').trim() || null,
          description: String(row.description || '').trim() || null,
          short_description: String(row.short_description || '').trim() || null,
          place: String(row.place || '').trim() || null,
          image_url: String(row.image_url || '').trim() || null,
          mrp: parseFloat(row.mrp) || 0.00,
          price: parseFloat(row.price) || 0.00,
          stock: parseInt(row.stock) || 0,
          quantity_value: packFromExcel.quantity_value,
          quantity_unit: packFromExcel.quantity_unit,
          unit: packFromExcel.unit || String(row.unit || '').trim() || 'units',
          available: parseBool(row.available, true),
          is_veg: parseBool(row.is_veg, true),
          featured: parseBool(row.featured, false),
          todays_deal: parseBool(row.todays_deal, false),
          best_seller: parseBool(row.best_seller, false),
        };

        let productId = '';

        if (product) {
          // Update product info
          const { data: updatedProduct, error: updateError } = await supabase
            .from('products')
            .update(toSupabaseProductRow(productData))
            .eq('id', product.id)
            .select()
            .single();

          if (updateError) throw updateError;
          productId = product.id;
          updated++;
        } else {
          // Insert new product
          const { data: newProduct, error: insertError } = await supabase
            .from('products')
            .insert(toSupabaseProductRow(productData))
            .select()
            .single();

          if (insertError) throw insertError;
          productId = newProduct.id;
          created++;
        }

        // Add or update city price overrides if city name is provided
        if (city) {
          const cityPriceData = {
            product_id: productId,
            city_name: city,
            mrp: parseFloat(row.mrp) || 0.00,
            price: parseFloat(row.price) || 0.00,
            wholesaler_price: parseFloat(row.wholesaler_price) || 0.00,
            is_live: parseBool(row.available, true),
          };

          const { error: cityPriceError } = await supabase
            .from('product_city_prices')
            .upsert(cityPriceData, { onConflict: 'product_id,city_name' });

          if (cityPriceError) throw cityPriceError;
        }

      } catch (err: any) {
        errors.push({ row: idx + 2, error: err.message || 'Row import failed' });
      }
    }

    return res.json({
      success: true,
      rows_processed: rows.length,
      created,
      updated,
      errors: errors.slice(0, 20)
    });

  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message || 'Server error during import' });
  }
});

// 4. POST /mine: Create a single product manually
router.post('/mine', authMiddleware, requireRole(['admin', 'super_admin']), async (req: AuthRequest, res) => {
  const data = req.body;

  try {
    const { data: shop, error: shopError } = await supabase
      .from('shops')
      .select('*')
      .eq('owner_id', req.user!.id)
      .maybeSingle();

    if (shopError || !shop) {
      return res.status(400).json({ success: false, error: 'Merchant shop not found.' });
    }

    const newProduct = {
      shop_id: shop.id,
      name: data.name,
      sku: data.sku || `SKU-${Date.now()}`,
      barcode: data.barcode || null,
      primary_category: data.primary_category,
      secondary_category: data.secondary_category || null,
      brand: data.brand || null,
      company: data.company || null,
      description: data.description || null,
      short_description: data.short_description || null,
      place: data.place || null,
      image_url: data.image_url || null,
      mrp: parseFloat(data.mrp) || 0.00,
      price: parseFloat(data.price) || 0.00,
      stock: parseInt(data.stock) || 0,
      unit: data.unit || 'units',
      available: data.available !== false,
      is_veg: data.is_veg !== false,
      featured: !!data.featured,
      todays_deal: !!data.todays_deal,
      best_seller: !!data.best_seller,
    };

    const { data: product, error } = await supabase
      .from('products')
      .insert(toSupabaseProductRow(newProduct))
      .select()
      .single();

    if (error) {
      return res.status(400).json({ success: false, error: error.message });
    }

    return res.json({ success: true, product });

  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message || 'Server error' });
  }
});

// 3.5 POST /create: Create a new Master catalog product (Super Admin only)
router.post('/create', authMiddleware, requireRole(['super_admin']), async (req: AuthRequest, res) => {
  try {
    // Get the platform's master shop (first approved shop)
    const { data: shops } = await supabase
      .from('shops')
      .select('id')
      .eq('status', 'approved')
      .limit(1);

    const shopId = shops && shops.length > 0 ? shops[0].id : null;
    
    if (!shopId) {
      return res.status(400).json({ success: false, error: 'No approved shop found. Please create a merchant shop first.' });
    }

    const { name, sku, brand, company, description, short_description, mrp, price, primary_category, image_url, unit, quantity_value, quantity_unit, available, is_veg } = req.body;
    
    if (!name || !sku || !primary_category) {
      return res.status(400).json({ success: false, error: 'Name, SKU, and Category are required.' });
    }

    const packFields = packUnitPayloadFromInput(quantity_value ?? unit, quantity_unit, unit);

    const newProduct = {
      shop_id: shopId,
      name,
      sku,
      brand: brand || null,
      company: company || null,
      description: description || null,
      short_description: short_description || null,
      mrp: parseFloat(mrp) || 0,
      price: parseFloat(price) || 0,
      primary_category,
      image_url: image_url || null,
      quantity_value: packFields.quantity_value,
      quantity_unit: packFields.quantity_unit,
      unit: packFields.unit || unit || 'units',
      available: available ?? true,
      is_veg: is_veg ?? true
    };

    const { data: product, error } = await supabase
      .from('products')
      .insert(toSupabaseProductRow(newProduct))
      .select()
      .single();

    if (error) {
      return res.status(400).json({ success: false, error: error.message });
    }

    return res.json({ success: true, product });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message || 'Server error' });
  }
});

// 5. GET /mine: Retrieve all products belonging to the active merchant's shop
router.get('/mine', authMiddleware, requireRole(['admin', 'super_admin']), async (req: AuthRequest, res) => {
  try {
    const { data: shop, error: shopError } = await supabase
      .from('shops')
      .select('*')
      .eq('owner_id', req.user!.id)
      .maybeSingle();

    if (shopError || !shop) {
      return res.status(400).json({ success: false, error: 'Merchant shop not found.' });
    }

    const { data: products, error } = await supabase
      .from('products')
      .select('*')
      .eq('shop_id', shop.id)
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(400).json({ success: false, error: error.message });
    }

    return res.json({ success: true, products: products || [] });

  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message || 'Server error' });
  }
});

// 6. PUT /:product_id: Update product price, stock, and availability
router.put('/:product_id', authMiddleware, requireRole(['admin', 'super_admin']), async (req: AuthRequest, res) => {
  const { product_id } = req.params;
  const data = req.body;

  try {
    const { data: shop, error: shopError } = await supabase
      .from('shops')
      .select('*')
      .eq('owner_id', req.user!.id)
      .maybeSingle();

    if (shopError || !shop) {
      return res.status(400).json({ success: false, error: 'Merchant shop not found.' });
    }

    // Verify the product belongs to this merchant
    const { data: product, error: findError } = await supabase
      .from('products')
      .select('*')
      .eq('id', product_id)
      .eq('shop_id', shop.id)
      .maybeSingle();

    if (findError || !product) {
      return res.status(404).json({ success: false, error: 'Product not found or access denied.' });
    }

    const updatedData = {
      name: data.name !== undefined ? data.name : product.name,
      sku: data.sku !== undefined ? data.sku : product.sku,
      barcode: data.barcode !== undefined ? data.barcode : product.barcode,
      primary_category: data.primary_category !== undefined ? data.primary_category : product.primary_category,
      secondary_category: data.secondary_category !== undefined ? data.secondary_category : product.secondary_category,
      brand: data.brand !== undefined ? data.brand : product.brand,
      company: data.company !== undefined ? data.company : product.company,
      description: data.description !== undefined ? data.description : product.description,
      short_description: data.short_description !== undefined ? data.short_description : product.short_description,
      place: data.place !== undefined ? data.place : product.place,
      image_url: data.image_url !== undefined ? data.image_url : product.image_url,
      mrp: data.mrp !== undefined ? parseFloat(data.mrp) : product.mrp,
      price: data.price !== undefined ? parseFloat(data.price) : product.price,
      stock: data.stock !== undefined ? parseInt(data.stock) : product.stock,
      unit: data.unit !== undefined ? data.unit : product.unit,
      available: data.available !== undefined ? !!data.available : product.available,
      is_veg: data.is_veg !== undefined ? !!data.is_veg : product.is_veg,
      featured: data.featured !== undefined ? !!data.featured : product.featured,
      todays_deal: data.todays_deal !== undefined ? !!data.todays_deal : product.todays_deal,
      best_seller: data.best_seller !== undefined ? !!data.best_seller : product.best_seller,
    };

    const { data: updatedProduct, error: updateError } = await supabase
      .from('products')
      .update(toSupabaseProductRow(updatedData))
      .eq('id', product_id)
      .select()
      .single();

    if (updateError) {
      return res.status(400).json({ success: false, error: updateError.message });
    }

    return res.json({ success: true, product: updatedProduct });

  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message || 'Server error' });
  }
});

// 6.5 PUT /master/:product_id: Update master catalog product details (Super Admin only)
router.put('/master/:product_id', authMiddleware, requireRole(['super_admin']), async (req: AuthRequest, res) => {
  const { product_id } = req.params;
  const data = req.body;

  try {
    const { data: product, error: findError } = await supabase
      .from('products')
      .select('*')
      .eq('id', product_id)
      .maybeSingle();

    if (findError || !product) {
      return res.status(404).json({ success: false, error: 'Product not found.' });
    }

    let quantity_value = product.quantity_value;
    let quantity_unit = product.quantity_unit;
    let unitLabel = product.unit;

    if (data.quantity_value !== undefined || data.quantity_unit !== undefined || data.unit !== undefined) {
      const packFields = packUnitPayloadFromInput(
        data.quantity_value !== undefined ? data.quantity_value : quantity_value,
        data.quantity_unit !== undefined ? data.quantity_unit : quantity_unit,
        data.unit !== undefined ? data.unit : unitLabel,
      );
      quantity_value = packFields.quantity_value;
      quantity_unit = packFields.quantity_unit;
      unitLabel = packFields.unit || unitLabel;
    }

    const updatedData = {
      name: data.name !== undefined ? data.name : product.name,
      sku: data.sku !== undefined ? data.sku : product.sku,
      brand: data.brand !== undefined ? data.brand : product.brand,
      company: data.company !== undefined ? data.company : product.company,
      description: data.description !== undefined ? data.description : product.description,
      short_description: data.short_description !== undefined ? data.short_description : product.short_description,
      mrp: data.mrp !== undefined ? parseFloat(data.mrp) : product.mrp,
      price: data.price !== undefined ? parseFloat(data.price) : product.price,
      primary_category: data.primary_category !== undefined ? data.primary_category : product.primary_category,
      secondary_category: data.secondary_category !== undefined ? data.secondary_category : product.secondary_category,
      image_url: data.image_url !== undefined ? data.image_url : product.image_url,
      quantity_value,
      quantity_unit,
      unit: unitLabel,
      available: data.available !== undefined ? !!data.available : product.available,
      is_veg: data.is_veg !== undefined ? !!data.is_veg : product.is_veg,
    };

    const { data: updatedProduct, error: updateError } = await supabase
      .from('products')
      .update(toSupabaseProductRow(updatedData))
      .eq('id', product_id)
      .select()
      .single();

    if (updateError) {
      return res.status(400).json({ success: false, error: updateError.message });
    }

    return res.json({ success: true, product: updatedProduct });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message || 'Server error' });
  }
});

// 7. DELETE /master/:product_id: Delete a product from master catalog (Super Admin only)
router.delete('/master/:product_id', authMiddleware, requireRole(['super_admin']), async (req: AuthRequest, res) => {
  const { product_id } = req.params;

  try {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', product_id);

    if (error) {
      return res.status(400).json({ success: false, error: error.message });
    }

    // Cascade delete mappings in local shop products db
    const { readDb, writeDb } = require('../config/localDb');
    const db = readDb();
    db.shop_products = db.shop_products.filter((sp: any) => sp.product_id !== product_id);
    writeDb(db);

    return res.json({ success: true, message: 'Product deleted successfully from catalog' });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message || 'Server error' });
  }
});

// 8. GET /coupons: Retrieve all active coupons
router.get('/coupons/all', async (req, res) => {
  try {
    const { readDb } = require('../config/localDb');
    const db = readDb();
    const activeCoupons = (db.coupons || []).filter((c: any) => c.active === true);
    return res.json({ success: true, coupons: activeCoupons });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message || 'Server error' });
  }
});

// 9. POST /coupons/validate: Validate coupon code against min order requirements
router.post('/coupons/validate', async (req, res) => {
  const { code, cart_total } = req.body;
  if (!code) {
    return res.status(400).json({ success: false, error: 'Coupon code is required' });
  }
  const total = parseFloat(cart_total) || 0;

  try {
    const { readDb } = require('../config/localDb');
    const db = readDb();
    const coupon = (db.coupons || []).find(
      (c: any) => c.code.toUpperCase() === String(code).trim().toUpperCase() && c.active === true
    );

    if (!coupon) {
      return res.status(400).json({ success: false, error: 'Invalid or expired coupon code' });
    }

    if (total < coupon.min_order) {
      return res.status(400).json({
        success: false,
        error: `This coupon requires a minimum order total of ₹${coupon.min_order}. Current total: ₹${total.toFixed(2)}`
      });
    }

    let discount = 0;
    if (coupon.discount_type === 'flat') {
      discount = coupon.value;
    } else {
      discount = Math.round((total * coupon.value) / 100);
    }

    return res.json({
      success: true,
      coupon: {
        code: coupon.code,
        discount_type: coupon.discount_type,
        value: coupon.value,
        discount_amount: discount
      }
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message || 'Server error' });
  }
});

// 12. POST /upload-image: Upload image directly to Supabase Storage bucket
router.post('/upload-image', authMiddleware, requireRole(['admin', 'super_admin']), upload.single('image'), async (req: AuthRequest, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ success: false, error: 'No image file uploaded' });
  }

  try {
    const fileExt = req.file.originalname.split('.').pop() || 'png';
    const fileName = `prod_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
    const filePath = `products/${fileName}`;

    // Upload to Supabase storage bucket 'product-images'
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(filePath, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: true
      });

    if (uploadError) {
      return res.status(500).json({ success: false, error: uploadError.message });
    }

    const { data: publicUrlData } = supabase.storage
      .from('product-images')
      .getPublicUrl(filePath);

    return res.json({
      success: true,
      image_url: publicUrlData.publicUrl
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message || 'Image upload failed' });
  }
});

export default router;

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
import {
  parseProductMedia,
  formatProductDescriptionWithMedia,
  enrichProductWithMedia,
} from '../utils/productMedia';
import { getMerchantShopForUser } from '../services/shopResolution';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 } // Up to 25MB for high-res images / PNGs
});

const EXCEL_COLUMNS = [
  "sku",
  "name",
  "brand",
  "company",
  "family_key",
  "primary_category",
  "secondary_category",
  "quantity_value",
  "quantity_unit",
  "unit",
  "mrp",
  "price",
  "wholesaler_price",
  "gst",
  "stock",
  "city",
  "primary_image_url",
  "image_url_2",
  "image_url_3",
  "image_url_4",
  "additional_images",
  "video_url",
  "short_description",
  "description",
  "ingredients",
  "shelf_life",
  "storage_instructions",
  "fssai_license",
  "country_of_origin",
  "barcode",
  "is_veg",
  "featured",
  "todays_deal",
  "best_seller",
  "search_keywords",
  "available"
];

// Helper to convert excel cell values to boolean
function parseBool(val: any, defaultVal = false): boolean {
  if (val === undefined || val === null) return defaultVal;
  if (typeof val === 'boolean') return val;
  const s = String(val).trim().toLowerCase();
  if (s === '') return defaultVal;
  return ['yes', 'y', 'true', '1', 'live'].includes(s);
}

// Helper to extract normalized product family key
export function getProductFamilyKey(p: any): string {
  if (p?.family_key && typeof p.family_key === 'string' && p.family_key.trim()) {
    return p.family_key.trim().toLowerCase();
  }
  const brand = String(p.brand || '').trim().toLowerCase();
  const rawName = String(p.name || '')
    .replace(/\s*\d+(\.\d+)?\s*(kg|g|l|ml|pcs|pack|units|dozen|ltr|gm|litre)\b.*/i, '')
    .trim()
    .toLowerCase();
  return `${brand}::${rawName}`;
}

export function groupProductsByFamily(products: any[], dealsOnly = false, limitVal = 100): any[] {
  if (!Array.isArray(products) || products.length === 0) return [];

  const familyMap = new Map<string, any[]>();

  for (const p of products) {
    const key = getProductFamilyKey(p);
    if (!familyMap.has(key)) {
      familyMap.set(key, []);
    }
    familyMap.get(key)!.push(p);
  }

  const groupedList: any[] = [];

  for (const [, siblings] of familyMap.entries()) {
    // 1. Extract family-level media fallback (from any sibling that has images or video)
    const familyImages: string[] = [];
    let familyVideoUrl: string | null = null;

    for (const s of siblings) {
      const parsed = parseProductMedia(s);
      if (familyImages.length === 0 && Array.isArray(parsed.images) && parsed.images.length > 0) {
        familyImages.push(...parsed.images);
      }
      if (!familyVideoUrl && parsed.video_url) {
        familyVideoUrl = parsed.video_url;
      }
    }

    const fullVariants = siblings.map((s) => {
      const media = parseProductMedia(s);
      const finalImages = media.images && media.images.length > 0 ? media.images : familyImages;
      const finalImageUrl = media.primary_image_url || (familyImages.length > 0 ? familyImages[0] : '');
      const finalVideoUrl = media.video_url || familyVideoUrl;

      return {
        id: s.id,
        shop_id: s.shop_id,
        name: s.name,
        sku: s.sku,
        brand: s.brand,
        company: s.company,
        primary_category: s.primary_category,
        secondary_category: s.secondary_category,
        unit: s.unit || s.pack_label,
        quantity_value: s.quantity_value,
        quantity_unit: s.quantity_unit,
        mrp: s.mrp,
        price: s.price,
        stock: s.stock,
        available: s.available !== false,
        discount_percent: s.discount_percent || 0,
        image_url: finalImageUrl,
        images: finalImages,
        video_url: finalVideoUrl,
        description: media.clean_description,
        is_veg: s.is_veg,
        featured: s.featured,
        todays_deal: s.todays_deal,
        best_seller: s.best_seller,
        you_save: s.you_save || 0,
      };
    });

    const dealSiblings = dealsOnly
      ? siblings.filter(
          (p) =>
            (p.discount_percent && p.discount_percent > 0) ||
            p.featured ||
            p.todays_deal ||
            p.best_seller ||
            parseFloat(p.mrp) > parseFloat(p.price),
        )
      : siblings;

    if (dealsOnly && dealSiblings.length === 0) {
      continue;
    }

    const candidateSiblings = dealSiblings.length > 0 ? dealSiblings : siblings;

    const sorted = [...candidateSiblings].sort((a, b) => {
      const da = a.discount_percent || 0;
      const db = b.discount_percent || 0;
      if (db !== da) return db - da;

      const pa = parseFloat(a.price) || 0;
      const pb = parseFloat(b.price) || 0;
      return pa - pb;
    });

    const rep = sorted[0];
    const repMedia = parseProductMedia(rep);
    const repImages = repMedia.images && repMedia.images.length > 0 ? repMedia.images : familyImages;
    const repImageUrl = repMedia.primary_image_url || (familyImages.length > 0 ? familyImages[0] : '');
    const repVideoUrl = repMedia.video_url || familyVideoUrl;

    groupedList.push({
      ...rep,
      image_url: repImageUrl,
      images: repImages,
      video_url: repVideoUrl,
      description: repMedia.clean_description,
      variants: fullVariants,
      variant_count: siblings.length,
    });
  }

  if (dealsOnly) {
    groupedList.sort((a, b) => (b.discount_percent || 0) - (a.discount_percent || 0));
  }

  return groupedList.slice(0, limitVal);
}

// 1. GET /all: Consumer Catalog (location-aware, based on city and area)
router.get('/all', async (req, res) => {
  const area_name = (req.query.area_name as string) || (req.query.area as string);
  const { city, category, secondary, q, limit, deals, pincode, raw, group } = req.query;
  const limitVal = parseInt(limit as string) || 100;
  const dealsOnly = deals === '1' || deals === 'true';
  const shouldGroup = raw !== 'true' && group !== 'false';

  const applyDealsFilter = (products: any[]) => {
    if (shouldGroup) {
      return groupProductsByFamily(products, dealsOnly, limitVal);
    }
    if (!dealsOnly) return products.slice(0, limitVal);
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
        products: groupProductsByFamily(catalog.products, false, limitVal),
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
      return res.json({ success: true, products: groupProductsByFamily(ranked, false, limitVal) });
    }

    return res.json({ success: true, products: groupProductsByFamily(out, false, limitVal) });
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

    // Build family image map
    const familyMediaMap = new Map<string, { images: string[]; video_url: string | null }>();
    (products || []).forEach((p: any) => {
      const key = getProductFamilyKey(p);
      const media = parseProductMedia(p);
      if (!familyMediaMap.has(key)) {
        familyMediaMap.set(key, { images: [], video_url: null });
      }
      const existing = familyMediaMap.get(key)!;
      if (existing.images.length === 0 && media.images.length > 0) {
        existing.images = media.images;
      }
      if (!existing.video_url && media.video_url) {
        existing.video_url = media.video_url;
      }
    });

    const enriched = (products || []).map((p: any) => {
      const withPack = enrichProductPackFields(p);
      const media = parseProductMedia(withPack);
      const key = getProductFamilyKey(p);
      const family = familyMediaMap.get(key);
      const finalImages = media.images && media.images.length > 0 ? media.images : (family?.images || []);
      const finalImageUrl = media.primary_image_url || (family?.images?.[0] || '');
      const finalVideoUrl = media.video_url || family?.video_url || null;

      return {
        ...withPack,
        image_url: finalImageUrl,
        images: finalImages,
        video_url: finalVideoUrl,
        description: media.clean_description,
      };
    });

    return res.json({
      success: true,
      products: enriched,
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
    ).sort((a: any, b: any) => String(a).localeCompare(String(b)));


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

// 2. GET /excel-template: Download professional multi-sheet template
router.get('/excel-template', authMiddleware, requireRole(['admin', 'super_admin']), (req, res) => {
  const wb = XLSX.utils.book_new();

  // 1. Sheet 1: SKU Catalog Data with realistic sample demonstration rows
  const samples = [
    EXCEL_COLUMNS,
    // Sample A: Single Unit Standalone Product (1 Unit only)
    [
      "MG-MAG-70G", "Maggi 2-Minute Masala Instant Noodles 70g", "Maggi", "Nestle India", "maggi-masala-noodles",
      "Packaged Food", "Instant Noodles", 70, "g", "70 g",
      14.00, 13.00, 10.50, 5, 250, "Mumbai",
      "https://images.unsplash.com/photo-1612927601601-6638404737ce?w=600&q=80",
      "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=600&q=80",
      "", "", "", "",
      "India's favorite 2-Minute Masala Noodles with authentic blend of spices",
      "• Authentic blend of 10 choicest spices • Quick & easy 2-minute cooking • Made with quality ingredients",
      "Wheat Flour (Maida), Palm Oil, Salt, Spices & Condiments", "9 Months from packaging",
      "Store in a cool, dry and hygienic place", "10012011000168", "India", "8901058852410",
      "yes", "yes", "no", "yes", "maggi, noodles, 2 minute, instant noodles, snack, masala", "yes"
    ],
    // Sample B1: Multi-Unit Product Family Variant 1 (500 ml)
    [
      "MG-OIL-FORT-500ML", "Fortune Sunlite Refined Sunflower Oil 500ml", "Fortune", "Adani Wilmar", "fortune-sunflower-oil",
      "Cooking Essentials", "Edible Oils", 500, "ml", "500 ml",
      90.00, 78.00, 68.00, 5, 60, "Mumbai",
      "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600&q=80",
      "https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=600&q=80",
      "", "", "", "",
      "Light and healthy refined sunflower oil rich in natural Vitamin E",
      "• Rich in natural Vitamin E • Absorbs less oil in food • Promotes a healthy heart",
      "Refined Sunflower Oil, Vitamin A & Vitamin D", "9 Months",
      "Store in a dry place away from direct sunlight", "10013021000540", "India", "8906007281012",
      "yes", "yes", "yes", "yes", "fortune, oil, sunflower oil, refined oil, cooking oil, tel", "yes"
    ],
    // Sample B2: Multi-Unit Product Family Variant 2 (1 Litre)
    [
      "MG-OIL-FORT-1L", "Fortune Sunlite Refined Sunflower Oil 1L Pouch", "Fortune", "Adani Wilmar", "fortune-sunflower-oil",
      "Cooking Essentials", "Edible Oils", 1, "L", "1 L",
      175.00, 149.00, 132.00, 5, 120, "Mumbai",
      "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600&q=80",
      "https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=600&q=80",
      "", "", "", "",
      "Light and healthy refined sunflower oil rich in natural Vitamin E",
      "• Rich in natural Vitamin E • Absorbs less oil in food • Promotes a healthy heart",
      "Refined Sunflower Oil, Vitamin A & Vitamin D", "9 Months",
      "Store in a dry place away from direct sunlight", "10013021000540", "India", "8906007281029",
      "yes", "yes", "yes", "yes", "fortune, oil, sunflower oil, refined oil, cooking oil, tel", "yes"
    ],
    // Sample B3: Multi-Unit Product Family Variant 3 (5 Litre Jar)
    [
      "MG-OIL-FORT-5L", "Fortune Sunlite Refined Sunflower Oil 5L Jar", "Fortune", "Adani Wilmar", "fortune-sunflower-oil",
      "Cooking Essentials", "Edible Oils", 5, "L", "5 L",
      850.00, 730.00, 645.00, 5, 30, "Mumbai",
      "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600&q=80",
      "https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=600&q=80",
      "", "", "", "",
      "Light and healthy refined sunflower oil rich in natural Vitamin E",
      "• Easy pour jar handle • Rich in natural Vitamin E • High smoke point",
      "Refined Sunflower Oil, Vitamin A & Vitamin D", "9 Months",
      "Store in a dry place away from direct sunlight", "10013021000540", "India", "8906007281036",
      "yes", "no", "no", "yes", "fortune, oil, sunflower oil, 5l jar, refined oil, cooking oil", "yes"
    ],
    // Sample C: Staples Atta 10 kg
    [
      "MG-ATT-AASH-10KG", "Aashirvaad Superior MP Shudh Chakki Atta 10kg", "Aashirvaad", "ITC Limited", "aashirvaad-mp-atta",
      "Atta, Flours & Grains", "Chakki Atta", 10, "kg", "10 kg",
      499.00, 439.00, 380.00, 0, 150, "Mumbai",
      "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&q=80",
      "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&q=80",
      "", "", "", "",
      "100% pure whole wheat chakki atta with 0% maida",
      "• 100% whole wheat grains • Soft rotis up to 6 hours • Rich in dietary fiber",
      "100% Whole Wheat Grain", "3 Months",
      "Store in an airtight container in a cool, dry place", "10012031000085", "India", "8901030384721",
      "yes", "yes", "no", "yes", "atta, gehu, wheat, flour, aashirwad, chakki atta, roti", "yes"
    ]
  ];

  const ws = XLSX.utils.aoa_to_sheet(samples);
  XLSX.utils.book_append_sheet(wb, ws, "SKU_Catalog_Data");

  // 2. Sheet 2: Guidelines and Documentation
  const guidelines = [
    ["MonthlyGrocery Bulk SKU Loader Guidelines & Field Reference"],
    [""],
    ["Topic", "Guideline / Rule"],
    ["1-Unit vs Multi-Unit Products", "Each physical pack size is 1 row in Excel. For products with multiple units (e.g., 500g, 1kg, 5kg), give them the SAME 'family_key'. The customer mobile app will automatically display interactive pack size selector buttons."],
    ["Single Unit Product", "If a product only comes in 1 size (e.g. 70g noodles), fill 1 row with its unit. No extra buttons will appear."],
    ["Multi-Angle Photos", "Provide Front photo in 'primary_image_url'. Provide Back / Nutrition photo in 'image_url_2', Side photo in 'image_url_3', etc. The app will render a full swipeable carousel."],
    ["Photo Inheritance", "For multi-unit variants sharing the same 'family_key', images given on the primary pack size will automatically display for all sibling sizes unless a variant specifies its own unique image."],
    ["Mandatory Fields", "sku, name, brand, primary_category, quantity_value, quantity_unit, unit, mrp, price, stock, primary_image_url"],
    ["Pricing Columns", "mrp = Maximum Printed Price | price = MonthlyGrocery Customer Selling Price | wholesaler_price = Merchant procurement cost"],
    ["Units Allowed", "kg, g, L, ml, pcs, pack, dozen"],
    ["Boolean Fields", "Use 'yes' or 'no' for available, is_veg, featured, todays_deal, best_seller"]
  ];
  const wsGuide = XLSX.utils.aoa_to_sheet(guidelines);
  XLSX.utils.book_append_sheet(wb, wsGuide, "Instructions_&_Guidelines");

  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  
  res.setHeader('Content-Disposition', 'attachment; filename="monthlygrocery-template.xlsx"');
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  return res.send(buf);
});

// 3. POST /import-excel: Bulk-import products with full multi-angle media, specs & variants
router.post('/import-excel', authMiddleware, requireRole(['admin', 'super_admin']), upload.single('file'), async (req: AuthRequest, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, error: 'No file uploaded' });
  }

  try {
    // 1. Determine active merchant shop or fallback to master approved shop
    let shopId: string | null = null;
    const { data: userShop } = await supabase
      .from('shops')
      .select('id')
      .eq('owner_id', req.user!.id)
      .maybeSingle();

    if (userShop && userShop.id) {
      shopId = userShop.id;
    } else {
      const { data: approvedShops } = await supabase
        .from('shops')
        .select('id')
        .eq('status', 'approved')
        .limit(1);

      if (approvedShops && approvedShops.length > 0) {
        shopId = approvedShops[0].id;
      } else {
        const { data: anyShops } = await supabase
          .from('shops')
          .select('id')
          .limit(1);
        if (anyShops && anyShops.length > 0) {
          shopId = anyShops[0].id;
        }
      }
    }

    if (!shopId) {
      return res.status(400).json({
        success: false,
        error: 'No merchant shop found. Please create or approve a merchant shop before importing catalog items.'
      });
    }

    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rawRows = XLSX.utils.sheet_to_json(sheet) as any[];

    if (!Array.isArray(rawRows) || rawRows.length === 0) {
      return res.status(400).json({ success: false, error: 'The uploaded spreadsheet is empty.' });
    }

    let created = 0;
    let updated = 0;
    const errors: any[] = [];

    for (let idx = 0; idx < rawRows.length; idx++) {
      const rawRow = rawRows[idx];

      // Normalize row keys to lowercase for foolproof column matching
      const row: Record<string, any> = {};
      Object.keys(rawRow).forEach((k) => {
        row[k.trim().toLowerCase()] = rawRow[k];
      });

      const name = String(row.name || '').trim();
      const sku = String(row.sku || '').trim() || `SKU-${Date.now()}-${idx + 1}`;
      const city = String(row.city || '').trim();

      if (!name) {
        errors.push({ row: idx + 2, error: 'Product name is missing or blank' });
        continue;
      }

      try {
        // Collect all multi-angle photo URLs
        const images: string[] = [];
        const primaryImg = String(row.primary_image_url || row.image_url || row.image_url_1 || '').trim();
        if (primaryImg) images.push(primaryImg);

        const img2 = String(row.image_url_2 || row.image_angle_back || '').trim();
        if (img2 && !images.includes(img2)) images.push(img2);

        const img3 = String(row.image_url_3 || row.image_angle_side || '').trim();
        if (img3 && !images.includes(img3)) images.push(img3);

        const img4 = String(row.image_url_4 || row.image_angle_extra || '').trim();
        if (img4 && !images.includes(img4)) images.push(img4);

        const addlImages = String(row.additional_images || '').trim();
        if (addlImages) {
          if (addlImages.startsWith('[') && addlImages.endsWith(']')) {
            try {
              const parsed = JSON.parse(addlImages);
              if (Array.isArray(parsed)) {
                parsed.forEach((u) => {
                  const clean = String(u).trim();
                  if (clean && !images.includes(clean)) images.push(clean);
                });
              }
            } catch {}
          } else {
            addlImages.split(',').forEach((u) => {
              const clean = u.trim();
              if (clean && !images.includes(clean)) images.push(clean);
            });
          }
        }

        const videoUrl = String(row.video_url || '').trim() || null;

        // Merge description with rich specifications (Ingredients, Shelf Life, Storage, FSSAI)
        let descText = String(row.description || '').trim();
        const specBullets: string[] = [];
        if (row.ingredients && String(row.ingredients).trim()) {
          specBullets.push(`• Ingredients: ${String(row.ingredients).trim()}`);
        }
        if (row.shelf_life && String(row.shelf_life).trim()) {
          specBullets.push(`• Shelf Life: ${String(row.shelf_life).trim()}`);
        }
        if (row.storage_instructions && String(row.storage_instructions).trim()) {
          specBullets.push(`• Storage: ${String(row.storage_instructions).trim()}`);
        }
        if (row.fssai_license && String(row.fssai_license).trim()) {
          specBullets.push(`• FSSAI Lic No: ${String(row.fssai_license).trim()}`);
        }
        if (row.country_of_origin && String(row.country_of_origin).trim()) {
          specBullets.push(`• Country of Origin: ${String(row.country_of_origin).trim()}`);
        }

        if (specBullets.length > 0) {
          descText = descText ? `${descText}\n\n${specBullets.join('\n')}` : specBullets.join('\n');
        }

        const formattedDescription = formatProductDescriptionWithMedia(descText, images, videoUrl);

        // Normalize pack unit fields
        const packFromExcel = packUnitPayloadFromInput(
          row.quantity_value,
          row.quantity_unit,
          String(row.unit || '').trim(),
        );

        const mrpVal = parseFloat(row.mrp) || 0.00;
        const priceVal = parseFloat(row.price) || mrpVal;

        const productData: any = {
          shop_id: shopId,
          name,
          sku,
          barcode: String(row.barcode || '').trim() || null,
          primary_category: String(row.primary_category || 'Other').trim(),
          secondary_category: String(row.secondary_category || '').trim() || null,
          brand: String(row.brand || '').trim() || null,
          company: String(row.company || '').trim() || null,
          description: formattedDescription || null,
          short_description: String(row.short_description || '').trim() || null,
          place: String(row.place || '').trim() || null,
          image_url: images.length > 0 ? images[0] : null,
          mrp: mrpVal,
          price: priceVal,
          stock: parseInt(row.stock) >= 0 ? parseInt(row.stock) : 100,
          quantity_value: packFromExcel.quantity_value,
          quantity_unit: packFromExcel.quantity_unit,
          unit: packFromExcel.unit || String(row.unit || '').trim() || 'units',
          available: parseBool(row.available, true),
          is_veg: parseBool(row.is_veg, true),
          featured: parseBool(row.featured, false),
          todays_deal: parseBool(row.todays_deal, false),
          best_seller: parseBool(row.best_seller, false),
        };

        // Check if product already exists by SKU
        const { data: existingProduct } = await supabase
          .from('products')
          .select('id')
          .eq('sku', sku)
          .maybeSingle();

        let productId = '';

        if (existingProduct && existingProduct.id) {
          const { error: updateError } = await supabase
            .from('products')
            .update(toSupabaseProductRow(productData))
            .eq('id', existingProduct.id);

          if (updateError) throw updateError;
          productId = existingProduct.id;
          updated++;
        } else {
          const { data: newProduct, error: insertError } = await supabase
            .from('products')
            .insert(toSupabaseProductRow(productData))
            .select('id')
            .single();

          if (insertError) throw insertError;
          productId = newProduct.id;
          created++;
        }

        // Add / Update city pricing overrides if city name is provided
        if (city && productId) {
          const cityPriceData = {
            product_id: productId,
            city_name: city,
            mrp: mrpVal,
            price: priceVal,
            wholesaler_price: parseFloat(row.wholesaler_price) || 0.00,
            is_live: parseBool(row.available, true),
          };

          const { error: cityPriceError } = await supabase
            .from('product_city_prices')
            .upsert(cityPriceData, { onConflict: 'product_id,city_name' });

          if (cityPriceError) throw cityPriceError;
        }
      } catch (err: any) {
        errors.push({ row: idx + 2, sku, error: err.message || 'Row import failed' });
      }
    }

    return res.json({
      success: true,
      rows_processed: rawRows.length,
      created,
      updated,
      errors: errors.slice(0, 30)
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

    const {
      name,
      sku,
      brand,
      company,
      description,
      short_description,
      mrp,
      price,
      primary_category,
      secondary_category,
      image_url,
      images,
      video_url,
      unit,
      quantity_value,
      quantity_unit,
      available,
      is_veg,
    } = req.body;
    
    if (!name || !sku || !primary_category) {
      return res.status(400).json({ success: false, error: 'Name, SKU, and Category are required.' });
    }

    const packFields = packUnitPayloadFromInput(quantity_value ?? unit, quantity_unit, unit);
    const media = parseProductMedia({ image_url, images, video_url });
    const formattedDescription = formatProductDescriptionWithMedia(description, media.images, media.video_url);

    const newProduct = {
      shop_id: shopId,
      name,
      sku,
      brand: brand || null,
      company: company || null,
      description: formattedDescription || null,
      short_description: short_description || null,
      mrp: parseFloat(mrp) || 0,
      price: parseFloat(price) || 0,
      primary_category,
      secondary_category: secondary_category || null,
      image_url: media.primary_image_url || null,
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

    return res.json({ success: true, product: enrichProductWithMedia(enrichProductPackFields(product)) });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message || 'Server error' });
  }
});

// 5. GET /mine: Retrieve all products belonging to the active merchant's shop
router.get('/mine', authMiddleware, requireRole(['admin', 'super_admin']), async (req: AuthRequest, res) => {
  try {
    const shop = await getMerchantShopForUser({
      id: req.user!.id,
      role: req.user!.role,
      mobile: (req.user as any)?.mobile || (req.user as any)?.phone,
    });

    if (!shop) {
      return res.status(400).json({ success: false, error: 'Merchant shop not found.', shop_not_found: true });
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
    const shop = await getMerchantShopForUser({
      id: req.user!.id,
      role: req.user!.role,
      mobile: (req.user as any)?.mobile || (req.user as any)?.phone,
    });

    if (!shop) {
      return res.status(400).json({ success: false, error: 'Merchant shop not found.', shop_not_found: true });
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

    const media = parseProductMedia({
      image_url: data.image_url !== undefined ? data.image_url : product.image_url,
      images: data.images !== undefined ? data.images : undefined,
      video_url: data.video_url !== undefined ? data.video_url : undefined,
      description: product.description,
    });
    const formattedDescription = formatProductDescriptionWithMedia(
      data.description !== undefined ? data.description : media.clean_description,
      data.images !== undefined ? data.images : media.images,
      data.video_url !== undefined ? data.video_url : media.video_url,
    );

    const updatedData = {
      name: data.name !== undefined ? data.name : product.name,
      sku: data.sku !== undefined ? data.sku : product.sku,
      brand: data.brand !== undefined ? data.brand : product.brand,
      company: data.company !== undefined ? data.company : product.company,
      description: formattedDescription,
      short_description: data.short_description !== undefined ? data.short_description : product.short_description,
      mrp: data.mrp !== undefined ? parseFloat(data.mrp) : product.mrp,
      price: data.price !== undefined ? parseFloat(data.price) : product.price,
      primary_category: data.primary_category !== undefined ? data.primary_category : product.primary_category,
      secondary_category: data.secondary_category !== undefined ? data.secondary_category : product.secondary_category,
      image_url: media.primary_image_url || null,
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

    return res.json({ success: true, product: enrichProductWithMedia(enrichProductPackFields(updatedProduct)) });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message || 'Server error' });
  }
});

// 7. DELETE /master/:product_id: Delete a product from master catalog (Super Admin only)
router.delete('/master/:product_id', authMiddleware, requireRole(['super_admin']), async (req: AuthRequest, res) => {
  const { product_id } = req.params;

  try {
    // 1. Delete associated city pricing records
    try {
      await supabase
        .from('product_city_prices')
        .delete()
        .eq('product_id', product_id);
    } catch (_ignore) {}

    // 2. Cascade delete mappings in local shop products db
    try {
      const { readDb, writeDb } = require('../config/localDb');
      const db = readDb();
      if (Array.isArray(db.shop_products)) {
        db.shop_products = db.shop_products.filter((sp: any) => sp.product_id !== product_id);
        writeDb(db);
      }
    } catch (_ignore) {}

    // 3. Attempt hard delete from PostgreSQL
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', product_id);

    if (error) {
      // If foreign key constraint violation (e.g. product is referenced in order_items of past customer orders)
      if (
        error.code === '23503' ||
        error.message?.includes('foreign key constraint') ||
        error.message?.includes('order_items')
      ) {
        // Soft delete: mark product as unavailable and stock 0 so it disappears from catalogues and search without corrupting order history
        const { error: archiveError } = await supabase
          .from('products')
          .update({
            available: false,
            stock: 0,
          })
          .eq('id', product_id);

        if (archiveError) {
          return res.status(400).json({ success: false, error: archiveError.message });
        }

        return res.json({
          success: true,
          message: 'Product is linked to past order history. It has been archived and removed from active catalogue.',
          archived: true,
        });
      }

      return res.status(400).json({ success: false, error: error.message });
    }

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
    const { error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(filePath, req.file.buffer, {
        contentType: req.file.mimetype || (fileExt === 'svg' ? 'image/svg+xml' : 'image/png'),
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
      image_url: publicUrlData.publicUrl,
      url: publicUrlData.publicUrl,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message || 'Image upload failed' });
  }
});

// 13. POST /upload-media: Upload multiple images/media directly to Supabase Storage
router.post('/upload-media', authMiddleware, requireRole(['admin', 'super_admin']), upload.array('files', 10), async (req: AuthRequest, res: Response) => {
  const files = (req.files as Express.Multer.File[]) || [];
  if (files.length === 0) {
    return res.status(400).json({ success: false, error: 'No media files uploaded' });
  }

  try {
    const uploadedUrls: string[] = [];

    for (const file of files) {
      const fileExt = file.originalname.split('.').pop() || 'png';
      const fileName = `prod_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
      const filePath = `products/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file.buffer, {
          contentType: file.mimetype || (fileExt === 'svg' ? 'image/svg+xml' : 'image/png'),
          upsert: true,
        });

      if (!uploadError) {
        const { data: publicUrlData } = supabase.storage
          .from('product-images')
          .getPublicUrl(filePath);
        uploadedUrls.push(publicUrlData.publicUrl);
      }
    }

    return res.json({
      success: true,
      urls: uploadedUrls,
      images: uploadedUrls,
      image_url: uploadedUrls[0] || '',
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message || 'Media upload failed' });
  }
});

export default router;

import { Router } from 'express';
import { AuthRequest, authMiddleware, requireRole } from '../middleware/auth';
import { readDb, writeDb, ServiceableLocation, PromotionalBanner, FranchiseRequest, ShopProduct } from '../config/localDb';
import { supabase } from '../config/supabase';

const router = Router();

// ==========================================
// 1. Serviceable Locations (Geographical Zones)
// ==========================================

// GET /locations: Retrieve all serviceable zones (Public)
router.get('/locations', async (req, res) => {
  try {
    const db = readDb();
    return res.json({ success: true, locations: db.serviceable_locations });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /locations: Add or Update a zone (Super Admin only)
router.post('/locations', authMiddleware, requireRole(['super_admin']), async (req: AuthRequest, res) => {
  const { id, city, area_name, pincode, is_serviceable, shop_id } = req.body;

  if (!city || !area_name || !pincode) {
    return res.status(400).json({ success: false, error: 'City, Area name, and PIN code are required' });
  }

  try {
    const db = readDb();
    
    if (id) {
      // Update existing
      db.serviceable_locations = db.serviceable_locations.map(loc => 
        loc.id === id ? { ...loc, city, area_name, pincode, is_serviceable: is_serviceable !== false, shop_id: shop_id || null } : loc
      );
    } else {
      // Add new
      const newLoc: ServiceableLocation = {
        id: `loc-${Date.now()}`,
        city,
        area_name,
        pincode,
        is_serviceable: is_serviceable !== false,
        shop_id: shop_id || null
      };
      db.serviceable_locations.push(newLoc);
    }

    writeDb(db);
    return res.json({ success: true, locations: db.serviceable_locations });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /locations/:id: Delete a zone (Super Admin only)
router.delete('/locations/:id', authMiddleware, requireRole(['super_admin']), async (req: AuthRequest, res) => {
  const { id } = req.params;

  try {
    const db = readDb();
    db.serviceable_locations = db.serviceable_locations.filter(loc => loc.id !== id);
    writeDb(db);
    return res.json({ success: true, locations: db.serviceable_locations });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});


// ==========================================
// 2. Promotional Banners (Festive campaigns)
// ==========================================

// GET /banners: Retrieve active banners (Public)
router.get('/banners', async (req, res) => {
  try {
    const db = readDb();
    const activeBanners = db.promotional_banners.filter(b => b.active);
    return res.json({ success: true, banners: activeBanners });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /banners/all: Retrieve all banners including inactive ones (Super Admin only)
router.get('/banners/all', authMiddleware, requireRole(['super_admin']), async (req: AuthRequest, res) => {
  try {
    const db = readDb();
    return res.json({ success: true, banners: db.promotional_banners });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /banners: Add or Update a banner (Super Admin only)
router.post('/banners', authMiddleware, requireRole(['super_admin']), async (req: AuthRequest, res) => {
  const { id, title, image_url, action_link, active } = req.body;

  if (!title || !image_url) {
    return res.status(400).json({ success: false, error: 'Title and Image URL are required' });
  }

  try {
    const db = readDb();

    if (id) {
      // Update
      db.promotional_banners = db.promotional_banners.map(b => 
        b.id === id ? { ...b, title, image_url, action_link: action_link || '', active: active !== false } : b
      );
    } else {
      // Add new
      const newBanner: PromotionalBanner = {
        id: `banner-${Date.now()}`,
        title,
        image_url,
        action_link: action_link || '',
        active: active !== false
      };
      db.promotional_banners.push(newBanner);
    }

    writeDb(db);
    return res.json({ success: true, banners: db.promotional_banners });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /banners/:id: Delete a banner (Super Admin only)
router.delete('/banners/:id', authMiddleware, requireRole(['super_admin']), async (req: AuthRequest, res) => {
  const { id } = req.params;

  try {
    const db = readDb();
    db.promotional_banners = db.promotional_banners.filter(b => b.id !== id);
    writeDb(db);
    return res.json({ success: true, banners: db.promotional_banners });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});


// ==========================================
// 3. Franchise Requests (Partnership Leads)
// ==========================================

// GET /franchise: List all partnership inquiries (Super Admin only)
router.get('/franchise', authMiddleware, requireRole(['super_admin']), async (req: AuthRequest, res) => {
  try {
    const db = readDb();
    return res.json({ success: true, requests: db.franchise_requests });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /franchise: Submit a new inquiry (Public)
router.post('/franchise', async (req, res) => {
  const { name, phone, email, city, message } = req.body;

  if (!name || !phone || !city) {
    return res.status(400).json({ success: false, error: 'Name, phone number, and city are required' });
  }

  try {
    const db = readDb();
    const newReq: FranchiseRequest = {
      id: `req-${Date.now()}`,
      name,
      phone,
      email: email || '',
      city,
      message: message || '',
      created_at: new Date().toISOString()
    };
    db.franchise_requests.push(newReq);
    writeDb(db);
    return res.json({ success: true, message: 'Franchise inquiry submitted successfully' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// 4. Master Cities & Areas Manager
// ==========================================

// GET /cities: Get all registered cities (Public)
router.get('/cities', async (req, res) => {
  try {
    const db = readDb();
    return res.json({ success: true, cities: db.cities || [] });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /cities: Add a new city (Super Admin only)
router.post('/cities', authMiddleware, requireRole(['super_admin']), async (req: AuthRequest, res) => {
  const { name } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ success: false, error: 'City name is required' });
  }

  try {
    const db = readDb();
    // Check if city name already exists (case-insensitive)
    const exists = db.cities.some(c => c.name.toLowerCase() === name.trim().toLowerCase());
    if (exists) {
      return res.status(400).json({ success: false, error: 'City is already registered' });
    }

    const newCity = {
      id: `city-${Date.now()}`,
      name: name.trim()
    };
    db.cities.push(newCity);
    writeDb(db);
    return res.json({ success: true, cities: db.cities });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /cities/:id: Delete a city and its areas (Super Admin only)
router.delete('/cities/:id', authMiddleware, requireRole(['super_admin']), async (req: AuthRequest, res) => {
  const { id } = req.params;
  try {
    const db = readDb();
    db.cities = db.cities.filter(c => c.id !== id);
    // Cascade delete areas belonging to this city
    db.areas = db.areas.filter(a => a.city_id !== id);
    writeDb(db);
    return res.json({ success: true, cities: db.cities });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /areas: Get all areas (Public)
router.get('/areas', async (req, res) => {
  try {
    const db = readDb();
    return res.json({ success: true, areas: db.areas || [] });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /areas: Add a new area/locality under a city (Super Admin only)
router.post('/areas', authMiddleware, requireRole(['super_admin']), async (req: AuthRequest, res) => {
  const { city_id, name } = req.body;
  if (!city_id || !name || !name.trim()) {
    return res.status(400).json({ success: false, error: 'City ID and Area name are required' });
  }

  try {
    const db = readDb();
    // Verify city exists
    const cityExists = db.cities.some(c => c.id === city_id);
    if (!cityExists) {
      return res.status(400).json({ success: false, error: 'Invalid City ID' });
    }

    // Check if area already exists in this city (case-insensitive)
    const exists = db.areas.some(a => a.city_id === city_id && a.name.toLowerCase() === name.trim().toLowerCase());
    if (exists) {
      return res.status(400).json({ success: false, error: 'Area/locality is already registered under this city' });
    }

    const newArea = {
      id: `area-${Date.now()}`,
      city_id,
      name: name.trim()
    };
    db.areas.push(newArea);
    writeDb(db);
    return res.json({ success: true, areas: db.areas });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /areas/:id: Delete an area (Super Admin only)
router.delete('/areas/:id', authMiddleware, requireRole(['super_admin']), async (req: AuthRequest, res) => {
  const { id } = req.params;
  try {
    const db = readDb();
    db.areas = db.areas.filter(a => a.id !== id);
    writeDb(db);
    return res.json({ success: true, areas: db.areas });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Helper to get merchant's shop_id from Supabase
async function getMerchantShopId(userId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('shops')
    .select('id')
    .eq('owner_id', userId)
    .maybeSingle();
  if (error || !data) return null;
  return data.id;
}

// ==========================================
// 5. Merchant SKU Selection & Request Endpoints
// ==========================================

// GET /shop-products: Get list of shop products and their request statuses (Merchant only)
router.get('/shop-products', authMiddleware, requireRole(['admin', 'super_admin']), async (req: AuthRequest, res) => {
  try {
    const shopId = await getMerchantShopId(req.user!.id);
    if (!shopId) {
      return res.status(404).json({ success: false, error: 'Merchant shop not found' });
    }
    const db = readDb();
    const shopProds = db.shop_products.filter(sp => sp.shop_id === shopId);
    
    if (shopProds.length === 0) {
      return res.json({ success: true, shop_products: [] });
    }

    // Fetch product details from Supabase
    const productIds = shopProds.map(sp => sp.product_id);
    const { data: products, error } = await supabase
      .from('products')
      .select('id, name, sku, brand, primary_category, image_url, mrp')
      .in('id', productIds);

    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }

    const joined = shopProds.map(sp => {
      const p = products?.find((prod: any) => prod.id === sp.product_id);
      return {
        ...sp,
        name: p?.name || 'Unknown Product',
        sku: p?.sku || '',
        brand: p?.brand || '',
        primary_category: p?.primary_category || '',
        image_url: p?.image_url || '',
        mrp: p?.mrp || 0
      };
    });

    return res.json({ success: true, shop_products: joined });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /shop-products/request: Merchant requests a Master SKU (Merchant only)
router.post('/shop-products/request', authMiddleware, requireRole(['admin', 'super_admin']), async (req: AuthRequest, res) => {
  const { product_id } = req.body;
  if (!product_id) {
    return res.status(400).json({ success: false, error: 'Product ID is required' });
  }

  try {
    const shopId = await getMerchantShopId(req.user!.id);
    if (!shopId) {
      return res.status(404).json({ success: false, error: 'Merchant shop not found' });
    }

    // Verify product exists in Supabase Master catalogue
    const { data: masterProduct, error: pError } = await supabase
      .from('products')
      .select('id, price, mrp')
      .eq('id', product_id)
      .maybeSingle();

    if (pError || !masterProduct) {
      return res.status(404).json({ success: false, error: 'Master product not found in central catalogue' });
    }

    const db = readDb();
    
    // Check if already requested or mapped
    const existing = db.shop_products.find(sp => sp.shop_id === shopId && sp.product_id === product_id);
    if (existing) {
      return res.status(400).json({ success: false, error: `SKU already has status: ${existing.status}` });
    }

    const newShopProduct: ShopProduct = {
      id: `sp-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      shop_id: shopId,
      product_id: product_id,
      selling_price: parseFloat(masterProduct.price) || 0,
      discount_percentage: Math.max(0, Math.round(((parseFloat(masterProduct.mrp) - parseFloat(masterProduct.price)) / parseFloat(masterProduct.mrp)) * 100)) || 0,
      stock: 0,
      available: false,
      status: 'approved'
    };

    db.shop_products.push(newShopProduct);
    writeDb(db);

    return res.json({ success: true, message: 'SKU added to your shop inventory successfully', shop_product: newShopProduct });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /shop-products/configure: Merchant updates price/stock for approved SKU (Merchant only)
router.post('/shop-products/configure', authMiddleware, requireRole(['admin', 'super_admin']), async (req: AuthRequest, res) => {
  const { product_id, selling_price, discount_percentage, stock, available } = req.body;
  if (!product_id) {
    return res.status(400).json({ success: false, error: 'Product ID is required' });
  }

  try {
    const shopId = await getMerchantShopId(req.user!.id);
    if (!shopId) {
      return res.status(404).json({ success: false, error: 'Merchant shop not found' });
    }

    const db = readDb();
    const spIndex = db.shop_products.findIndex(sp => sp.shop_id === shopId && sp.product_id === product_id);
    
    if (spIndex === -1) {
      return res.status(404).json({ success: false, error: 'Product not mapped or requested yet for your shop' });
    }

    const sp = db.shop_products[spIndex];
    if (sp.status !== 'approved') {
      return res.status(403).json({ success: false, error: 'SKU is pending Super Admin approval. You cannot configure it yet.' });
    }

    // Update values
    if (selling_price !== undefined) sp.selling_price = parseFloat(selling_price) || 0;
    if (discount_percentage !== undefined) sp.discount_percentage = parseInt(discount_percentage) || 0;
    if (stock !== undefined) sp.stock = parseInt(stock) || 0;
    if (available !== undefined) sp.available = !!available;

    db.shop_products[spIndex] = sp;
    writeDb(db);

    return res.json({ success: true, message: 'SKU configuration updated successfully', shop_product: sp });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /new-product-requests: Merchant suggests a brand new product to be added to Master Catalogue (Merchant only)
router.post('/new-product-requests', authMiddleware, requireRole(['admin', 'super_admin']), async (req: AuthRequest, res) => {
  const { name, category, brand, unit, mrp } = req.body;
  if (!name || !category || !unit || !mrp) {
    return res.status(400).json({ success: false, error: 'Name, Category, Unit, and MRP are required' });
  }

  try {
    const shopId = await getMerchantShopId(req.user!.id);
    if (!shopId) {
      return res.status(404).json({ success: false, error: 'Merchant shop not found' });
    }

    const db = readDb();
    const newRequest = {
      id: `req-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      shop_id: shopId,
      name: name.trim(),
      category: category.trim(),
      brand: brand ? brand.trim() : 'Unbranded',
      unit: unit.trim(),
      mrp: parseFloat(mrp) || 0,
      status: 'pending' as const,
      created_at: new Date().toISOString()
    };

    db.new_product_requests.push(newRequest);
    writeDb(db);

    return res.json({ success: true, message: 'New product request submitted to Super Admin successfully', request: newRequest });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /sku-requests: Super Admin lists all pending SKU creation requests (Super Admin only)
router.get('/sku-requests', authMiddleware, requireRole(['super_admin']), async (req: AuthRequest, res) => {
  try {
    const db = readDb();
    const pendingRequests = db.new_product_requests.filter(req => req.status === 'pending');
    if (pendingRequests.length === 0) {
      return res.json({ success: true, requests: [] });
    }

    // Fetch shop names
    const shopIds = pendingRequests.map(r => r.shop_id);
    const { data: shops, error: sError } = await supabase
      .from('shops')
      .select('id, shop_name')
      .in('id', shopIds);

    if (sError) {
      return res.status(500).json({ success: false, error: sError.message });
    }

    const requestsJoined = pendingRequests.map(r => {
      const s = shops?.find((sh: any) => sh.id === r.shop_id);
      return {
        id: r.id,
        shop_name: s?.shop_name || 'Unknown Shop',
        product_name: r.name,
        category: r.category,
        brand: r.brand || 'Unbranded',
        mrp: r.mrp,
        unit: r.unit
      };
    });

    return res.json({ success: true, requests: requestsJoined });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /sku-requests/:id/status: Super Admin Approves / Rejects a pending SKU request (Super Admin only)
router.post('/sku-requests/:id/status', authMiddleware, requireRole(['super_admin']), async (req: AuthRequest, res) => {
  const { id } = req.params;
  const { status } = req.body;
  if (!status || !['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ success: false, error: 'Invalid status value' });
  }

  try {
    const db = readDb();
    const reqIndex = db.new_product_requests.findIndex(r => r.id === id);
    
    if (reqIndex === -1) {
      return res.status(404).json({ success: false, error: 'SKU request not found' });
    }

    const request = db.new_product_requests[reqIndex];
    request.status = status;

    if (status === 'approved') {
      // 1. Insert product into Supabase Master Catalogue products table
      const skuCode = `SUGGEST-${Date.now().toString().slice(-6)}`;
      const { data: product, error: insertError } = await supabase
        .from('products')
        .insert({
          shop_id: request.shop_id,
          name: request.name,
          sku: skuCode,
          primary_category: request.category,
          brand: request.brand || 'Unbranded',
          mrp: request.mrp,
          price: request.mrp, // Initial master price matches MRP
          unit: request.unit,
          available: true,
          is_veg: true
        })
        .select()
        .single();

      if (insertError) {
        return res.status(500).json({ success: false, error: `Failed to insert product: ${insertError.message}` });
      }

      // 2. Map this approved product to the merchant shop directly with approved status so they can configure it
      db.shop_products.push({
        id: `sp-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        shop_id: request.shop_id,
        product_id: product.id,
        selling_price: request.mrp,
        discount_percentage: 0,
        stock: 0,
        available: false,
        status: 'approved'
      });
    }

    writeDb(db);
    return res.json({ success: true, message: `SKU request ${status} successfully` });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// 6. Category Management CRUD Endpoints
// ==========================================

// GET /categories: Get list of all master categories (Public)
router.get('/categories', async (req, res) => {
  try {
    const db = readDb();
    return res.json({ success: true, categories: db.categories || [] });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /categories: Create a new category (Super Admin only)
router.post('/categories', authMiddleware, requireRole(['super_admin']), async (req: AuthRequest, res) => {
  const { name } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ success: false, error: 'Category name is required' });
  }

  try {
    const db = readDb();
    const normalized = name.trim();
    
    // Check for duplicate category name
    const exists = db.categories.some(c => c.name.toLowerCase() === normalized.toLowerCase());
    if (exists) {
      return res.status(400).json({ success: false, error: 'Category already exists' });
    }

    const newCat = {
      id: `cat-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      name: normalized
    };

    db.categories.push(newCat);
    writeDb(db);

    return res.json({ success: true, message: 'Category added successfully', categories: db.categories });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /categories/:id: Delete a category (Super Admin only)
router.delete('/categories/:id', authMiddleware, requireRole(['super_admin']), async (req: AuthRequest, res) => {
  const { id } = req.params;

  try {
    const db = readDb();
    const exists = db.categories.some(c => c.id === id);
    if (!exists) {
      return res.status(404).json({ success: false, error: 'Category not found' });
    }

    db.categories = db.categories.filter(c => c.id !== id);
    writeDb(db);

    return res.json({ success: true, message: 'Category deleted successfully', categories: db.categories });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// 7. Shop Inventory Direct Assignment Endpoints (Super Admin)
// ==========================================

// GET /shop-inventory/:shop_id: Get inventory for a specific shop (Super Admin only)
router.get('/shop-inventory/:shop_id', authMiddleware, requireRole(['super_admin']), async (req: AuthRequest, res) => {
  const { shop_id } = req.params;
  try {
    const db = readDb();
    const shopProducts = db.shop_products.filter((sp: any) => sp.shop_id === shop_id);
    
    if (shopProducts.length === 0) {
      return res.json({ success: true, shop_products: [] });
    }

    const productIds = shopProducts.map((sp: any) => sp.product_id);
    const { data: products, error } = await supabase
      .from('products')
      .select('*')
      .in('id', productIds);

    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }

    const joined = shopProducts.map((sp: any) => {
      const p = products?.find((prod: any) => prod.id === sp.product_id);
      return {
        ...sp,
        product_name: p?.name || 'Unknown Product',
        sku: p?.sku || 'N/A',
        brand: p?.brand || 'N/A',
        mrp: p?.mrp || 0
      };
    });

    return res.json({ success: true, shop_products: joined });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /shop-inventory/:shop_id/assign: Directly map a product to a shop (Super Admin only)
router.post('/shop-inventory/:shop_id/assign', authMiddleware, requireRole(['super_admin']), async (req: AuthRequest, res) => {
  const { shop_id } = req.params;
  const { product_id, selling_price, discount_percentage, stock } = req.body;

  if (!product_id || selling_price === undefined) {
    return res.status(400).json({ success: false, error: 'Product ID and Selling Price are required' });
  }

  try {
    const db = readDb();
    // Check if already mapped
    const exists = db.shop_products.some((sp: any) => sp.shop_id === shop_id && sp.product_id === product_id);
    if (exists) {
      return res.status(400).json({ success: false, error: 'Product is already assigned to this shop' });
    }

    const newShopProduct = {
      id: `sp-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      shop_id,
      product_id,
      selling_price: parseFloat(selling_price) || 0,
      discount_percentage: parseFloat(discount_percentage) || 0,
      stock: parseInt(stock) || 100,
      available: true,
      status: 'approved' as const
    };

    db.shop_products.push(newShopProduct);
    writeDb(db);

    return res.json({ success: true, message: 'Product assigned to shop successfully', shop_product: newShopProduct });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /shop-inventory/:id: Delete a shop product mapping (Super Admin only)
router.delete('/shop-inventory/:id', authMiddleware, requireRole(['super_admin']), async (req: AuthRequest, res) => {
  const { id } = req.params;
  try {
    const db = readDb();
    const exists = db.shop_products.some((sp: any) => sp.id === id);
    if (!exists) {
      return res.status(404).json({ success: false, error: 'Mapping not found' });
    }

    db.shop_products = db.shop_products.filter((sp: any) => sp.id !== id);
    writeDb(db);

    return res.json({ success: true, message: 'Product unassigned from shop successfully' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// 8. Super Admin Coupons Management
// ==========================================

// GET /coupons: Get all coupons (Admin)
router.get('/coupons', authMiddleware, requireRole(['super_admin', 'admin']), async (req, res) => {
  try {
    const db = readDb();
    return res.json({ success: true, coupons: db.coupons || [] });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /coupons: Create or Update coupon
router.post('/coupons', authMiddleware, requireRole(['super_admin']), async (req: AuthRequest, res) => {
  const { code, discount_type, discount_value, min_order_value, max_discount, description, is_active } = req.body;
  if (!code || !discount_type || discount_value === undefined) {
    return res.status(400).json({ success: false, error: 'Code, discount type, and discount value are required' });
  }

  try {
    const db = readDb();
    if (!db.coupons) db.coupons = [];

    const existingIndex = db.coupons.findIndex(c => c.code.toUpperCase() === code.trim().toUpperCase());
    const couponObj: any = {
      id: existingIndex >= 0 ? db.coupons[existingIndex].id : `cpn-${Date.now()}`,
      code: code.trim().toUpperCase(),
      discount_type: discount_type as 'percentage' | 'flat',
      discount_value: parseFloat(discount_value) || 0,
      value: parseFloat(discount_value) || 0,
      min_order_value: parseFloat(min_order_value) || 0,
      min_order: parseFloat(min_order_value) || 0,
      max_discount: max_discount ? parseFloat(max_discount) : undefined,
      description: description?.trim() || `Get ${discount_value}${discount_type === 'percentage' ? '%' : '₹'} off on your order`,
      is_active: is_active !== false,
      active: is_active !== false,
      created_at: existingIndex >= 0 ? db.coupons[existingIndex].created_at : new Date().toISOString()
    };

    if (existingIndex >= 0) {
      db.coupons[existingIndex] = couponObj;
    } else {
      db.coupons.push(couponObj);
    }

    writeDb(db);
    return res.json({ success: true, message: 'Coupon saved successfully', coupon: couponObj, coupons: db.coupons });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /coupons/:id: Delete coupon
router.delete('/coupons/:id', authMiddleware, requireRole(['super_admin']), async (req: AuthRequest, res) => {
  const { id } = req.params;
  try {
    const db = readDb();
    if (!db.coupons) db.coupons = [];
    db.coupons = db.coupons.filter(c => c.id !== id && c.code !== id);
    writeDb(db);
    return res.json({ success: true, message: 'Coupon deleted successfully', coupons: db.coupons });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// 9. Central Orders Lifecycle Management
// ==========================================

// GET /orders/all: View all orders across all stores
router.get('/orders/all', authMiddleware, requireRole(['super_admin', 'admin']), async (req: AuthRequest, res) => {
  try {
    const db = readDb();
    let ordersQuery = supabase
      .from('orders')
      .select('*, order_items(*, products(*)), shops(name, city, area_name), profiles(name, mobile)')
      .order('created_at', { ascending: false });

    const { data: orders, error } = await ordersQuery;

    if (error) {
      const localOrders = (db as any).orders || [];
      return res.json({ success: true, orders: localOrders });
    }

    return res.json({ success: true, orders: orders || [] });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /orders/:id/status: Update order status
router.patch('/orders/:id/status', authMiddleware, requireRole(['super_admin', 'admin']), async (req: AuthRequest, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const validStatuses = ['pending', 'confirmed', 'packing', 'out_for_delivery', 'delivered', 'cancelled'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ success: false, error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
  }

  try {
    const { data, error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return res.status(400).json({ success: false, error: error.message });
    }

    return res.json({ success: true, message: `Order status updated to ${status}`, order: data });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

export default router;

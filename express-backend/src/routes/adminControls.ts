import { Router } from 'express';
import { AuthRequest, authMiddleware, requireRole } from '../middleware/auth';
import { readDb, writeDb, ServiceableLocation, PromotionalBanner, FranchiseRequest } from '../config/localDb';

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

export default router;

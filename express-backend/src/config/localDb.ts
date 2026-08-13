import fs from 'fs';
import path from 'path';

const DB_PATH = path.join(__dirname, '../../data/db.json');

export interface ServiceableLocation {
  id: string;
  city: string;
  area_name: string;
  pincode: string;
  is_serviceable: boolean;
  shop_id: string | null;
}

export interface PromotionalBanner {
  id: string;
  title: string;
  image_url: string;
  action_link: string;
  active: boolean;
}

export interface FranchiseRequest {
  id: string;
  name: string;
  phone: string;
  email: string;
  city: string;
  message: string;
  created_at: string;
}

interface LocalDbSchema {
  serviceable_locations: ServiceableLocation[];
  promotional_banners: PromotionalBanner[];
  franchise_requests: FranchiseRequest[];
}

const defaultDb: LocalDbSchema = {
  serviceable_locations: [
    // Seed default areas from mobile app configurations
    { id: 'loc-1', city: 'Mumbai', area_name: 'Andheri West', pincode: '400053', is_serviceable: true, shop_id: null },
    { id: 'loc-2', city: 'Mumbai', area_name: 'Bandra West', pincode: '400050', is_serviceable: true, shop_id: null },
    { id: 'loc-3', city: 'Mumbai', area_name: 'Powai', pincode: '400076', is_serviceable: true, shop_id: null },
    { id: 'loc-4', city: 'Mumbai', area_name: 'Juhu', pincode: '400049', is_serviceable: true, shop_id: null },
    { id: 'loc-5', city: 'Pune', area_name: 'Baner', pincode: '411045', is_serviceable: true, shop_id: null },
    { id: 'loc-6', city: 'Pune', area_name: 'Kothrud', pincode: '411038', is_serviceable: true, shop_id: null },
    { id: 'loc-7', city: 'Pune', area_name: 'Hinjawadi Phase 1', pincode: '411057', is_serviceable: true, shop_id: null }
  ],
  promotional_banners: [
    {
      id: 'banner-1',
      title: 'Monthly Super Saver: Flat 10% Off on Staples!',
      image_url: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&q=80',
      action_link: 'CategoryProducts?category=Atta%20%26%20Rice',
      active: true
    },
    {
      id: 'banner-2',
      title: 'Free Delivery on Orders Over ₹3,000',
      image_url: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&q=80',
      action_link: 'Cart',
      active: true
    }
  ],
  franchise_requests: []
};

// Initialize db.json file if not exists
export function initDb() {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify(defaultDb, null, 2), 'utf-8');
  }
}

// Read database
export function readDb(): LocalDbSchema {
  initDb();
  try {
    const data = fs.readFileSync(DB_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Failed to read local JSON database, returning defaults:', err);
    return defaultDb;
  }
}

// Write database
export function writeDb(data: LocalDbSchema) {
  initDb();
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to write local JSON database:', err);
  }
}

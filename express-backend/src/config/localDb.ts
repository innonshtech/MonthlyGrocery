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
  kind?: 'image' | 'promo';
  subtitle?: string;
  body?: string;
  cta_text?: string;
}

export interface HomeScreenConfig {
  delivering_label: string;
  location_prefix: string;
  choose_location_label: string;
  delivery_pill_text: string;
  search_placeholder: string;
  mmg_label: string;
  mmg_title: string;
  mmg_subtitle: string;
  categories_title: string;
  categories_see_all: string;
  deals_title: string;
  deals_see_all: string;
  loading_deals_label: string;
  empty_deals_label: string;
  reorder_title: string;
  reorder_subtitle_template: string;
  reorder_cta_label: string;
  first_basket_title: string;
  first_basket_subtitle: string;
  first_basket_cta_label: string;
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

export interface AreaNotifyRequest {
  id: string;
  city: string;
  area_name: string;
  phone?: string;
  created_at: string;
}

export interface City {
  id: string;
  name: string;
  region?: string;
}

export interface Area {
  id: string;
  city_id: string;
  name: string;
}

export interface ShopProduct {
  id: string;
  shop_id: string;
  product_id: string;
  selling_price: number;
  discount_percentage: number;
  stock: number;
  available: boolean;
  status: 'pending' | 'approved' | 'rejected';
}

export interface Category {
  id: string;
  name: string;
  image_url?: string;
}

export interface Coupon {
  id: string;
  code: string;
  discount_type: 'flat' | 'percentage';
  discount_value?: number;
  value?: number;
  min_order_value?: number;
  min_order?: number;
  max_discount?: number;
  description?: string;
  is_active?: boolean;
  active?: boolean;
  created_at?: string;
}

export interface NewProductRequest {
  id: string;
  shop_id: string;
  name: string;
  category: string;
  brand?: string;
  unit: string;
  mrp: number;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

export interface DeliverySlotConfig {
  shop_id: string;
  window_id: string;
  date: string;
  max_capacity: number;
  is_closed: boolean;
  is_recommended: boolean;
}

export interface UserAddressRecord {
  id: string;
  consumer_id: string;
  tag: string;
  flat: string;
  street: string;
  landmark?: string;
  pincode: string;
  phone: string;
  isDefault?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface OnboardingEmojiChip {
  emoji: string;
  size: number;
  left: number;
  top: number;
}

export interface OnboardingSplashConfig {
  tagline: string;
  footnote: string;
  emoji_chips: OnboardingEmojiChip[];
}

export interface ValueIntroSlideConfig {
  id: string;
  order: number;
  category: string;
  title: string;
  subtitle: string;
  badge_label?: string;
  badge_left?: number;
  badge_top?: number;
  secondary_badge_label?: string;
  secondary_badge_left?: number;
  secondary_badge_top?: number;
  show_skip: boolean;
  gradient_start: string;
  gradient_end: string;
  center_emoji?: string;
  center_size?: number;
  emoji_chips: OnboardingEmojiChip[];
}

export interface ValueIntroMetaConfig {
  final_cta_label: string;
  load_error_title: string;
  load_error_subtitle: string;
  retry_label: string;
  skip_to_login_label: string;
}

export interface OnboardingConfig {
  splash: OnboardingSplashConfig;
  value_intro_slides: ValueIntroSlideConfig[];
  value_intro_meta?: ValueIntroMetaConfig;
  phone_entry?: PhoneEntryConfig;
  otp_verification?: OtpVerificationConfig;
  city_selection?: CitySelectionConfig;
  area_selection?: AreaSelectionConfig;
  profile_setup?: ProfileSetupConfig;
}

export interface CitySelectionConfig {
  title: string;
  subtitle: string;
  detect_title: string;
  detect_subtitle: string;
  search_placeholder: string;
  section_label: string;
  empty_search_message: string;
  load_error_message: string;
  detect_unavailable_message: string;
  retry_label: string;
}

export interface AreaSelectionConfig {
  title: string;
  serving_prefix: string;
  change_label: string;
  search_placeholder: string;
  section_label: string;
  serviceable_subtitle: string;
  coming_soon_subtitle: string;
  coming_soon_badge: string;
  load_error_message: string;
  retry_label: string;
  missing_city_message: string;
  choose_city_button_label: string;
  unserviceable_title: string;
  unserviceable_subtitle_template: string;
  notify_button_label: string;
  notify_success_message: string;
  notify_error_message: string;
  choose_different_label: string;
}

export interface ProfileSetupConfig {
  title: string;
  subtitle: string;
  name_label: string;
  name_placeholder: string;
  email_label: string;
  email_placeholder: string;
  submit_label: string;
  name_required_title: string;
  name_required_message: string;
  photo_unavailable_message: string;
  load_error_message: string;
  retry_label: string;
  save_error_message: string;
}

export interface PhoneEntryConfig {
  title: string;
  subtitle: string;
  country_flag: string;
  country_code: string;
  phone_placeholder: string;
  continue_label: string;
  guest_label: string;
  terms_text: string;
  invalid_phone_error: string;
  load_error_message: string;
  retry_label: string;
}

export interface OtpVerificationConfig {
  title: string;
  subtitle_prefix: string;
  edit_label: string;
  verify_label: string;
  incomplete_error: string;
  invalid_otp_error: string;
  resend_timer_label: string;
  resend_label: string;
  resend_seconds: number;
}

interface LocalDbSchema {
  serviceable_locations: ServiceableLocation[];
  promotional_banners: PromotionalBanner[];
  franchise_requests: FranchiseRequest[];
  area_notify_requests?: AreaNotifyRequest[];
  cities: City[];
  areas: Area[];
  shop_products: ShopProduct[];
  categories: Category[];
  coupons: Coupon[];
  new_product_requests: NewProductRequest[];
  delivery_slot_configs?: DeliverySlotConfig[];
  user_addresses?: UserAddressRecord[];
  onboarding?: OnboardingConfig;
  home_screen?: HomeScreenConfig;
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
    { id: 'loc-7', city: 'Pune', area_name: 'Hinjawadi Phase 1', pincode: '411057', is_serviceable: true, shop_id: null },
    { id: 'loc-8', city: 'Bengaluru', area_name: 'Koramangala', pincode: '560034', is_serviceable: true, shop_id: null },
    { id: 'loc-9', city: 'Bengaluru', area_name: 'Indiranagar', pincode: '560038', is_serviceable: true, shop_id: null },
    { id: 'loc-10', city: 'Delhi NCR', area_name: 'Connaught Place', pincode: '110001', is_serviceable: true, shop_id: null },
    { id: 'loc-11', city: 'Delhi NCR', area_name: 'Noida Sec-62', pincode: '201309', is_serviceable: true, shop_id: null },
    { id: 'loc-12', city: 'Hyderabad', area_name: 'Gachibowli', pincode: '500032', is_serviceable: true, shop_id: null },
    { id: 'loc-13', city: 'Pune', area_name: 'Aundh', pincode: '411007', is_serviceable: true, shop_id: null },
    { id: 'loc-14', city: 'Pune', area_name: 'Viman Nagar', pincode: '411014', is_serviceable: true, shop_id: null },
    { id: 'loc-15', city: 'Pune', area_name: 'Hadapsar', pincode: '411028', is_serviceable: false, shop_id: null },
  ],
  promotional_banners: [
    {
      id: 'banner-promo-monthly',
      kind: 'promo',
      title: 'MONTHLY SAVINGS SALE',
      subtitle: 'Up to ₹500 off',
      body: 'on your full monthly basket',
      cta_text: 'Grab deals',
      image_url: '',
      action_link: 'OffersCoupons',
      active: true,
    },
    {
      id: 'banner-1',
      kind: 'image',
      title: 'Monthly Super Saver: Flat 10% Off on Staples!',
      image_url: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&q=80',
      action_link: 'CategoryProducts?category=Atta%20%26%20Rice',
      active: true,
    },
    {
      id: 'banner-2',
      kind: 'image',
      title: 'Free Delivery on Orders Over ₹3,000',
      image_url: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&q=80',
      action_link: 'Cart',
      active: true,
    },
  ],
  franchise_requests: [],
  cities: [
    { id: 'city-1', name: 'Mumbai', region: 'Maharashtra' },
    { id: 'city-2', name: 'Pune', region: 'Maharashtra' },
    { id: 'city-3', name: 'Bengaluru', region: 'Karnataka' },
    { id: 'city-4', name: 'Delhi NCR', region: 'NCR' },
    { id: 'city-5', name: 'Hyderabad', region: 'Telangana' },
  ],
  areas: [
    { id: 'area-1', city_id: 'city-1', name: 'Andheri West' },
    { id: 'area-2', city_id: 'city-1', name: 'Bandra West' },
    { id: 'area-3', city_id: 'city-1', name: 'Powai' },
    { id: 'area-4', city_id: 'city-1', name: 'Juhu' },
    { id: 'area-5', city_id: 'city-2', name: 'Baner' },
    { id: 'area-6', city_id: 'city-2', name: 'Kothrud' },
    { id: 'area-7', city_id: 'city-2', name: 'Hinjawadi Phase 1' },
    { id: 'area-8', city_id: 'city-3', name: 'Koramangala' },
    { id: 'area-9', city_id: 'city-3', name: 'Indiranagar' },
    { id: 'area-10', city_id: 'city-4', name: 'Connaught Place' },
    { id: 'area-11', city_id: 'city-4', name: 'Noida Sec-62' },
    { id: 'area-12', city_id: 'city-5', name: 'Gachibowli' },
  ],
  shop_products: [],
  categories: [
    { id: 'cat-1', name: 'Atta & Rice', image_url: 'https://xlnebedclqcmgfbfqkbm.supabase.co/storage/v1/object/public/product-images/products/aashirvaad_atta_10kg.png' },
    { id: 'cat-2', name: 'Oils & Ghee', image_url: 'https://xlnebedclqcmgfbfqkbm.supabase.co/storage/v1/object/public/product-images/products/amul_pure_ghee_1l.png' },
    { id: 'cat-3', name: 'Dals & Pulses' },
    { id: 'cat-4', name: 'Spices & Masala', image_url: 'https://xlnebedclqcmgfbfqkbm.supabase.co/storage/v1/object/public/product-images/products/tata_salt_lite_1kg.png' },
    { id: 'cat-5', name: 'Dry Fruits' },
    { id: 'cat-6', name: 'Snacks' },
    { id: 'cat-7', name: 'Beverages' },
    { id: 'cat-8', name: 'Biscuits' },
    { id: 'cat-9', name: 'Cleaning' },
    { id: 'cat-10', name: 'Personal Care' },
    { id: 'cat-11', name: 'Home & Kitchen' },
    { id: 'cat-12', name: 'Baby Care' }
  ],
  coupons: [
    { id: 'cp-1', code: 'GROCERY10', discount_type: 'percentage', value: 10, min_order: 500, active: true },
    { id: 'cp-2', code: 'WELCOME50', discount_type: 'flat', value: 50, min_order: 300, active: true },
    { id: 'cp-3', code: 'SUPER300', discount_type: 'flat', value: 300, min_order: 2500, active: true }
  ],
  new_product_requests: [],
  onboarding: {
    splash: {
      tagline: 'Plan once · Order monthly · Save more',
      footnote: 'from your neighbourhood store',
      emoji_chips: [
        { emoji: '🍚', size: 66, left: 84, top: 210 },
        { emoji: '🫒', size: 62, left: 226, top: 102 },
        { emoji: '🍎', size: 60, left: 318, top: 224 },
        { emoji: '🥬', size: 68, left: 60, top: 498 },
        { emoji: '🍞', size: 64, left: 270, top: 536 },
        { emoji: '🥕', size: 62, left: 140, top: 618 },
      ],
    },
    value_intro_slides: [
      {
        id: 'value-intro-1',
        order: 1,
        category: 'MONTHLY BASKET',
        title: 'Plan your whole month in one go',
        subtitle:
          'Add everything your home needs for the month, order once, and skip the weekly grocery runs.',
        badge_label: 'Save ₹340/mo',
        badge_left: 250,
        badge_top: 176,
        show_skip: true,
        gradient_start: '#E4F3EA',
        gradient_end: '#C6E9D3',
        center_emoji: '🍚',
        center_size: 88,
        emoji_chips: [
          { emoji: '🫒', size: 70, left: 74, top: 116 },
          { emoji: '🥬', size: 78, left: 258, top: 104 },
          { emoji: '🫘', size: 68, left: 72, top: 244 },
          { emoji: '🍎', size: 66, left: 286, top: 236 },
          { emoji: '🍞', size: 72, left: 214, top: 286 },
        ],
      },
      {
        id: 'value-intro-2',
        order: 2,
        category: 'REORDER',
        title: 'Copy last month in one tap',
        subtitle:
          'Your last basket, ready to go. Tweak what you need and check out in seconds.',
        badge_label: '1-tap reorder',
        badge_left: 232,
        badge_top: 182,
        show_skip: true,
        gradient_start: '#E7EEFB',
        gradient_end: '#D3DFF6',
        center_emoji: '📋',
        center_size: 112,
        emoji_chips: [
          { emoji: '🍚', size: 66, left: 58, top: 112 },
          { emoji: '🫒', size: 64, left: 272, top: 116 },
          { emoji: '🫘', size: 64, left: 66, top: 266 },
          { emoji: '🥬', size: 68, left: 264, top: 260 },
        ],
      },
      {
        id: 'value-intro-3',
        order: 3,
        category: 'BEST VALUE',
        title: 'Save more on every order',
        subtitle:
          'We compare and pick the lowest area price for you, so your monthly basket always costs less.',
        badge_label: '20% OFF',
        badge_left: 250,
        badge_top: 120,
        secondary_badge_label: 'Lowest price',
        secondary_badge_left: 60,
        secondary_badge_top: 268,
        show_skip: false,
        gradient_start: '#FDEFD3',
        gradient_end: '#FBE7B6',
        center_emoji: '💰',
        center_size: 112,
        emoji_chips: [
          { emoji: '🫒', size: 64, left: 74, top: 116 },
          { emoji: '🍚', size: 64, left: 262, top: 262 },
        ],
      },
    ],
    value_intro_meta: {
      final_cta_label: 'Get started',
      load_error_title: 'Could not load intro slides',
      load_error_subtitle: 'Check that the backend is running, then try again.',
      retry_label: 'Retry',
      skip_to_login_label: 'Continue to login',
    },
    phone_entry: {
      title: 'Enter your mobile number',
      subtitle: "We'll send a one-time code to verify it's you.",
      country_flag: '🇮🇳',
      country_code: '+91',
      phone_placeholder: '98765 43210',
      continue_label: 'Continue',
      guest_label: 'Browse as a guest',
      terms_text: 'By continuing you agree to our Terms & Privacy Policy.',
      invalid_phone_error: 'Enter a valid 10-digit mobile number.',
      load_error_message: 'Could not load login screen. Check that the backend is running.',
      retry_label: 'Retry',
    },
    otp_verification: {
      title: 'Verify your number',
      subtitle_prefix: 'Enter the code sent to',
      edit_label: 'Edit',
      verify_label: 'Verify',
      incomplete_error: 'Please enter the complete 6-digit code.',
      invalid_otp_error: 'Incorrect code. Please check and try again.',
      resend_timer_label: 'Resend code in',
      resend_label: 'Resend code',
      resend_seconds: 28,
    },
    city_selection: {
      title: 'Choose your city',
      subtitle: 'We deliver monthly groceries in these cities.',
      detect_title: 'Use my current location',
      detect_subtitle: 'Find your city automatically',
      search_placeholder: 'Search for your city',
      section_label: 'POPULAR CITIES',
      empty_search_message: 'No city found matching your search.',
      load_error_message: 'Could not load cities. Check that the backend is running.',
      detect_unavailable_message:
        'Location detection is not available. Please select your city from the list.',
      retry_label: 'Retry',
    },
    area_selection: {
      title: 'Select your area',
      serving_prefix: 'Serving',
      change_label: 'Change',
      search_placeholder: 'Search your area or pincode',
      section_label: 'AREAS WE DELIVER TO',
      serviceable_subtitle: '4-hour windows · daily',
      coming_soon_subtitle: 'Launching next month',
      coming_soon_badge: 'Coming soon',
      load_error_message: 'Could not load areas. Check that the backend is running.',
      retry_label: 'Retry',
      missing_city_message: 'Please choose a city first.',
      choose_city_button_label: 'Choose city',
      unserviceable_title: "We're not here yet",
      unserviceable_subtitle_template:
        "MonthlyGrocery doesn't deliver to {area}, {city} just yet — but we're expanding fast.",
      notify_button_label: "Notify me when you're live",
      notify_success_message: "We'll notify you when we start delivering in your area.",
      notify_error_message: 'Could not save your request. Please try again.',
      choose_different_label: 'Choose a different area',
    },
    profile_setup: {
      title: 'What should we call you?',
      subtitle: "We'll use this to personalise your monthly grocery.",
      name_label: 'YOUR NAME',
      name_placeholder: 'Your full name',
      email_label: 'EMAIL (OPTIONAL)',
      email_placeholder: 'your.email@example.com',
      submit_label: 'Start shopping',
      name_required_title: 'Name required',
      name_required_message: 'Please enter your name to personalize your monthly grocery.',
      photo_unavailable_message: 'Profile photo upload is not available yet.',
      load_error_message: 'Could not load profile setup. Check that the backend is running.',
      retry_label: 'Retry',
      save_error_message: 'Could not save your profile. Please try again.',
    },
  },
  home_screen: {
    delivering_label: 'DELIVERING TO',
    location_prefix: 'Home ·',
    choose_location_label: 'Choose delivery area',
    delivery_pill_text: 'Planned monthly delivery · 4-hour window',
    search_placeholder: 'Search atta, rice, oil…',
    mmg_label: 'MY MONTHLY GROCERY',
    mmg_title: 'Build your month in one tap',
    mmg_subtitle: 'A smart basket from what your home buys',
    categories_title: 'Shop by category',
    categories_see_all: 'See all',
    deals_title: 'Deals of the month',
    deals_see_all: 'See all',
    loading_deals_label: 'Loading deals…',
    empty_deals_label: 'No deals available in your area right now.',
    reorder_title: 'Reorder last month',
    reorder_subtitle_template: '{count} items · ₹{total}',
    reorder_cta_label: 'Reorder',
    first_basket_title: 'Build your first basket',
    first_basket_subtitle: 'Curated essentials for your home',
    first_basket_cta_label: 'Start',
  },
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
    const db = JSON.parse(data);
    // Backward compatibility auto backfill
    if (!db.cities) db.cities = defaultDb.cities;
    if (!db.areas) db.areas = defaultDb.areas;
    if (!db.shop_products) db.shop_products = defaultDb.shop_products;
    if (!db.categories) db.categories = defaultDb.categories;
    if (!db.new_product_requests) db.new_product_requests = [];
    if (!db.delivery_slot_configs) db.delivery_slot_configs = [];
    if (!db.user_addresses) db.user_addresses = [];
    if (!db.coupons) {
      db.coupons = defaultDb.coupons;
      fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf-8');
    }
    if (!db.onboarding) {
      db.onboarding = defaultDb.onboarding;
      fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf-8');
    } else if (!db.onboarding.phone_entry) {
      db.onboarding.phone_entry = defaultDb.onboarding!.phone_entry;
      fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf-8');
    } else if (!db.onboarding.otp_verification) {
      db.onboarding.otp_verification = defaultDb.onboarding!.otp_verification;
      fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf-8');
    } else if (!db.onboarding.city_selection) {
      db.onboarding.city_selection = defaultDb.onboarding!.city_selection;
      fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf-8');
    } else if (!db.onboarding.area_selection) {
      db.onboarding.area_selection = defaultDb.onboarding!.area_selection;
      fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf-8');
    } else if (!db.onboarding.profile_setup) {
      db.onboarding.profile_setup = defaultDb.onboarding!.profile_setup;
      fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf-8');
    } else if (!db.onboarding.value_intro_meta) {
      db.onboarding.value_intro_meta = defaultDb.onboarding!.value_intro_meta;
      fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf-8');
    }
    if (!db.home_screen) {
      db.home_screen = defaultDb.home_screen;
      fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf-8');
    }
    if (!db.area_notify_requests) db.area_notify_requests = [];
    // Backfill city regions from defaults when missing
    if (db.cities?.length) {
      let citiesUpdated = false;
      db.cities = db.cities.map((city: City) => {
        if (!city.region) {
          const match = defaultDb.cities.find(
            (c) => c.name.toLowerCase() === city.name.toLowerCase(),
          );
          if (match?.region) {
            citiesUpdated = true;
            return { ...city, region: match.region };
          }
        }
        return city;
      });
      if (citiesUpdated) {
        fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf-8');
      }
    }
    return db;
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

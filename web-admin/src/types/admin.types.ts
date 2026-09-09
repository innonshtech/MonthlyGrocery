export interface Shop {
  id: string;
  shop_name: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  state_name?: string | null;
  district_name?: string | null;
  city?: string | null;
  profiles: {
    name: string;
    phone: string;
  };
}

export interface AdminState {
  id: string;
  name: string;
}

export interface AdminDistrict {
  id: string;
  state_id: string;
  name: string;
}

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
  load_error_message: string;
  retry_label: string;
  location_required_deals_label: string;
}

export interface SearchScreenConfig {
  search_placeholder: string;
  popular_searches_label: string;
  products_section_label: string;
  empty_title_template: string;
  empty_subtitle: string;
  location_required_message: string;
  choose_location_label: string;
  load_error_message: string;
  retry_label: string;
}

export interface CategoriesScreenConfig {
  title: string;
  search_placeholder: string;
  section_grocery_label: string;
  section_snacks_label: string;
  section_household_label: string;
  section_default_label: string;
  empty_message: string;
  load_error_message: string;
  retry_label: string;
}

export interface CategoryProductsScreenConfig {
  search_placeholder_template: string;
  items_count_template: string;
  sort_label: string;
  sub_category_all_label: string;
  empty_message: string;
  deals_title: string;
  location_required_message: string;
  choose_location_label: string;
  load_error_message: string;
  retry_label: string;
  view_cart_label: string;
  cart_item_label: string;
  cart_items_template: string;
  add_button_label: string;
  filter_sheet_title: string;
  filter_sort_section_label: string;
  filter_sort_relevance: string;
  filter_sort_price_low: string;
  filter_sort_price_high: string;
  filter_sort_discount: string;
  filter_pack_section_label: string;
  filter_clear_label: string;
  filter_apply_label: string;
}

export interface ProductDetailScreenConfig {
  delivery_window_label: string;
  highlights_section_label: string;
  add_to_cart_label: string;
  unit_price_suffix_template: string;
  not_found_message: string;
  location_required_message: string;
  choose_location_label: string;
  load_error_message: string;
  retry_label: string;
}

export interface CartScreenConfig {
  title: string;
  cart_item_label: string;
  cart_items_template: string;
  empty_title: string;
  empty_message: string;
  start_shopping_label: string;
  reorder_last_month_label: string;
  save_basket_label: string;
  apply_coupon_label: string;
  coupon_applied_template: string;
  bill_details_title: string;
  bill_item_total_label: string;
  bill_savings_label: string;
  bill_delivery_fee_label: string;
  bill_delivery_fee_value: string;
  bill_coupon_discount_label: string;
  bill_to_pay_label: string;
  sticky_to_pay_label: string;
  proceed_to_pay_label: string;
  below_min_title_template: string;
  below_min_footnote_template: string;
  savings_banner_template: string;
  add_more_checkout_template: string;
  min_order_alert_template: string;
  empty_preview_image_1: string;
  empty_preview_image_2: string;
  load_error_message: string;
  retry_label: string;
}

export interface OffersCouponsScreenConfig {
  title: string;
  manual_code_placeholder: string;
  manual_apply_label: string;
  available_section_label: string;
  expires_template: string;
  list_apply_label: string;
  empty_message: string;
  load_error_message: string;
  retry_label: string;
  min_order_alert_title: string;
  min_order_alert_template: string;
  invalid_coupon_alert_title: string;
  apply_failed_fallback: string;
  connection_error_title: string;
  connection_error_message: string;
  unlock_offer_template: string;
  audience_new_guideline: string;
  audience_loyal_guideline: string;
  audience_all_guideline: string;
  usage_limit_template: string;
}

export interface FranchiseRequest {
  id: string;
  name: string;
  phone: string;
  email?: string;
  city: string;
  message?: string;
  status?: 'new' | 'contacted' | 'converted' | 'rejected';
  investment_budget?: string;
  created_at: string;
}

export interface PlatformOrder {
  id: string;
  total_amount: string;
  status: string;
  created_at: string;
  shop_id: string;
  delivery_address?: string;
  order_items?: any[];
  shops: {
    shop_name: string;
  };
  profiles: {
    name: string;
    phone: string;
  };
}

export interface City {
  id: string;
  name: string;
}

export interface Area {
  id: string;
  city_id: string;
  name: string;
  pincode?: string;
}

export type TabType =
  | 'shops'
  | 'locations'
  | 'analytics'
  | 'banners'
  | 'home-screen'
  | 'franchise'
  | 'bulk-loader'
  | 'cities-areas'
  | 'sku-requests'
  | 'categories-admin'
  | 'master-catalog'
  | 'coupons-admin'
  | 'orders-admin';

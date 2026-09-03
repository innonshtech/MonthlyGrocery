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

export interface OrdersScreenConfig {
  title: string;
  guest_title: string;
  guest_subtitle: string;
  guest_cta_label: string;
  empty_title: string;
  empty_message: string;
  empty_cta_label: string;
  past_orders_section_label: string;
  active_arriving_template: string;
  track_button_label: string;
  items_count_template: string;
  reorder_button_label: string;
  delivered_status_template: string;
  delivery_otp_label: string;
  status_out_for_delivery: string;
  status_confirmed: string;
  status_packed: string;
  load_error_message: string;
  retry_label: string;
  reorder_success_title: string;
  reorder_success_message_template: string;
  reorder_keep_browsing_label: string;
  reorder_view_cart_label: string;
  reorder_error_message: string;
  error_alert_title: string;
  default_product_name: string;
}

export interface MonthlyGroceryHubScreenConfig {
  title: string;
  hero_badge: string;
  hero_title: string;
  hero_subtitle: string;
  hero_savings_template: string;
  card_one_click_title: string;
  card_one_click_subtitle: string;
  card_copy_title: string;
  card_copy_subtitle_template: string;
  card_copy_empty_subtitle: string;
  card_saved_title: string;
  card_saved_subtitle_template: string;
  card_saved_empty_subtitle: string;
  card_build_title: string;
  card_build_soon_badge: string;
  card_build_subtitle: string;
  load_error_message: string;
  retry_label: string;
  metrics_error_message: string;
  no_last_order_title: string;
  no_last_order_message: string;
}

export interface OneClickCartScreenConfig {
  title: string;
  generating_title: string;
  generating_subtitle: string;
  insight_title_template: string;
  insight_subtitle_template: string;
  items_count_template: string;
  add_all_label: string;
  add_all_success_title: string;
  add_all_success_message_template: string;
  keep_browsing_label: string;
  view_cart_label: string;
  empty_title: string;
  empty_message: string;
  empty_cta_label: string;
  no_location_title: string;
  no_location_message: string;
  load_error_message: string;
  retry_label: string;
  unavailable_label: string;
  source_months: number;
  section_label_overrides: Record<string, string>;
}

export interface CopyLastMonthScreenConfig {
  title: string;
  insight_title_template: string;
  insight_subtitle_template: string;
  changes_all_good_message: string;
  changes_both_template: string;
  changes_repriced_only_template: string;
  changes_unavailable_only_template: string;
  available_count_template: string;
  add_to_cart_label: string;
  add_success_title: string;
  add_success_message_template: string;
  keep_browsing_label: string;
  view_cart_label: string;
  empty_title: string;
  empty_message: string;
  empty_cta_label: string;
  no_location_title: string;
  no_location_message: string;
  load_error_message: string;
  retry_label: string;
  unavailable_label: string;
  view_similar_label: string;
  was_price_template: string;
}

export interface SavedBasketsScreenConfig {
  title: string;
  new_basket_label: string;
  items_summary_template: string;
  add_to_cart_label: string;
  add_success_title: string;
  add_success_message_template: string;
  keep_browsing_label: string;
  view_cart_label: string;
  empty_title: string;
  empty_message: string;
  empty_cta_label: string;
  save_sheet_title: string;
  save_sheet_subtitle: string;
  basket_name_label: string;
  default_basket_name_template: string;
  items_will_save_template: string;
  save_basket_button_label: string;
  success_title: string;
  success_message_template: string;
  view_saved_baskets_label: string;
  done_label: string;
  empty_cart_title: string;
  empty_cart_message: string;
  no_location_title: string;
  no_location_message: string;
  unavailable_skip_message: string;
  load_error_message: string;
  retry_label: string;
  preview_name_count: number;
}

export interface EditProfileScreenConfig {
  title: string;
  change_photo_label: string;
  change_photo_alert_title: string;
  change_photo_alert_message: string;
  full_name_label: string;
  full_name_placeholder: string;
  phone_label: string;
  verified_label: string;
  email_label: string;
  email_placeholder: string;
  delete_account_label: string;
  save_button_label: string;
  name_required_title: string;
  name_required_message: string;
  save_success_title: string;
  save_success_message: string;
  save_error_message: string;
  load_error_message: string;
  retry_label: string;
}

export interface SavedAddressesScreenConfig {
  title: string;
  select_title: string;
  empty_title: string;
  empty_message: string;
  add_address_label: string;
  deliver_button_label: string;
  default_badge_label: string;
  select_alert_title: string;
  select_alert_message: string;
  load_error_message: string;
  retry_label: string;
}

export interface AddAddressScreenConfig {
  add_title: string;
  edit_title: string;
  flat_label: string;
  flat_placeholder: string;
  street_label: string;
  street_placeholder: string;
  landmark_label: string;
  landmark_placeholder: string;
  pincode_label: string;
  pincode_placeholder: string;
  phone_label: string;
  phone_placeholder: string;
  save_as_label: string;
  tag_home_key: string;
  tag_home_label: string;
  tag_work_key: string;
  tag_work_label: string;
  tag_other_key: string;
  tag_other_label: string;
  default_tag_key: string;
  save_button_label: string;
  saving_button_label: string;
  login_required_title: string;
  login_required_message: string;
  incomplete_title: string;
  incomplete_message: string;
  save_error_title: string;
  load_error_message: string;
  retry_label: string;
}

export interface MyCouponsScreenConfig {
  title: string;
  banner_title: string;
  banner_subtitle: string;
  section_label: string;
  expires_template: string;
  list_copy_label: string;
  empty_message: string;
  copy_alert_title: string;
  copy_alert_message_template: string;
  copy_alert_go_cart_label: string;
  copy_alert_ok_label: string;
  load_error_message: string;
  retry_label: string;
  audience_new_guideline: string;
  audience_loyal_guideline: string;
  audience_all_guideline: string;
  usage_limit_template: string;
}

export interface HelpSupportFaqItem {
  id: string;
  question: string;
  answer?: string;
  answer_template?: string;
}

export interface HelpSupportScreenConfig {
  title: string;
  chat_title: string;
  chat_subtitle: string;
  call_title: string;
  call_subtitle: string;
  phone_number: string;
  whatsapp_phone: string;
  whatsapp_message: string;
  chat_fallback_alert_title: string;
  chat_fallback_alert_message: string;
  call_fallback_alert_title: string;
  call_fallback_alert_message: string;
  call_fallback_message_template: string;
  faq_section_label: string;
  faqs: HelpSupportFaqItem[];
  delivery_areas_answer_template: string;
  load_error_message: string;
  retry_label: string;
}

export interface DeleteAccountItem {
  id: string;
  label: string;
}

export interface DeleteAccountScreenConfig {
  title: string;
  warning_text: string;
  section_label: string;
  deleted_items: DeleteAccountItem[];
  active_orders_warning: string;
  agreement_label: string;
  delete_button_label: string;
  cancel_label: string;
  agreement_required_title: string;
  agreement_required_message: string;
  delete_error_message: string;
  success_title: string;
  success_subtitle: string;
  success_active_orders_note: string;
  success_back_home_label: string;
  load_error_message: string;
  retry_label: string;
}

export interface SystemStateVariantConfig {
  title: string;
  subtitle: string;
  subtitle_template?: string;
  primary_button_label: string;
  secondary_button_label?: string;
}

export interface SystemStatesScreenConfig {
  offline: SystemStateVariantConfig;
  unserviceable: SystemStateVariantConfig & {
    notify_success_message: string;
    notify_error_message: string;
  };
  error: SystemStateVariantConfig;
  maintenance: SystemStateVariantConfig;
  load_error_message: string;
  retry_label: string;
}

export interface AccountScreenConfig {
  title: string;
  edit_label: string;
  savings_header: string;
  savings_since_template: string;
  menu_saved_addresses: string;
  menu_my_coupons: string;
  menu_help_support: string;
  menu_about_terms: string;
  logout_label: string;
  guest_title: string;
  guest_subtitle: string;
  guest_login_label: string;
  guest_delivery_area_label: string;
  guest_delivery_area_template: string;
  guest_no_area_label: string;
  about_alert_title: string;
  about_alert_message: string;
  logout_sheet_title: string;
  logout_sheet_subtitle: string;
  logout_cancel_label: string;
  logout_confirm_label: string;
  load_error_message: string;
  retry_label: string;
  metrics_error_message: string;
}

export interface OrderTrackingScreenConfig {
  title: string;
  out_for_delivery_banner: string;
  arriving_template: string;
  subtitle: string;
  delivery_otp_label: string;
  delivery_otp_subtitle: string;
  timeline_confirmed: string;
  timeline_packed: string;
  timeline_dispatched: string;
  timeline_out_for_delivery: string;
  timeline_delivered: string;
  timeline_pending_time: string;
  timeline_expected_template: string;
  delivery_partner_label: string;
  view_summary_title: string;
  view_summary_subtitle_template: string;
  help_title: string;
  help_subtitle: string;
  load_error_message: string;
  retry_label: string;
}

export interface OrderDetailScreenConfig {
  title: string;
  items_section_template: string;
  items_not_delivered_template: string;
  qty_template: string;
  delivery_details_section_label: string;
  delivered_to_label: string;
  delivery_window_label: string;
  paid_via_label: string;
  paid_via_template: string;
  bill_details_title: string;
  bill_item_total_label: string;
  bill_coupon_template: string;
  bill_savings_label: string;
  bill_delivery_fee_label: string;
  bill_delivery_fee_value: string;
  bill_total_paid_label: string;
  reorder_button_label: string;
  invoice_label: string;
  get_help_label: string;
  status_timeline_section_label: string;
  active_arriving_template: string;
  status_out_for_delivery: string;
  status_confirmed: string;
  status_packed: string;
  timeline_confirmed: string;
  timeline_packed: string;
  timeline_dispatched: string;
  timeline_out_for_delivery: string;
  timeline_delivered: string;
  timeline_pending_time: string;
  timeline_expected_template: string;
  delivery_otp_label: string;
  delivery_otp_subtitle: string;
  delivery_partner_label: string;
  delivered_status_label: string;
  delivered_on_template: string;
  cancelled_status_label: string;
  cancelled_on_template: string;
  cancelled_by_you_label: string;
  cancelled_by_support_label: string;
  reorder_cancelled_button_label: string;
  cancelled_help_label: string;
  cancel_order_label: string;
  cancel_order_confirm_title: string;
  cancel_order_confirm_message: string;
  cancel_order_confirm_yes: string;
  cancel_order_confirm_no: string;
  cancel_order_error_message: string;
  refund_initiated_template: string;
  refund_eta_message: string;
  load_error_message: string;
  retry_label: string;
  reorder_success_title: string;
  reorder_success_message_template: string;
  reorder_keep_browsing_label: string;
  reorder_view_cart_label: string;
  reorder_error_message: string;
  error_alert_title: string;
  default_product_name: string;
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

export interface AdminState {
  id: string;
  name: string;
}

export interface AdminDistrict {
  id: string;
  state_id: string;
  name: string;
}

export interface ShopTerritory {
  shop_id: string;
  state_id: string;
  state_name: string;
  district_id: string;
  district_name: string;
  city: string;
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
  quantity_value?: number;
  quantity_unit?: string;
  mrp: number;
  short_description?: string;
  description?: string;
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
  states: AdminState[];
  districts: AdminDistrict[];
  shop_territories: ShopTerritory[];
  shop_products: ShopProduct[];
  categories: Category[];
  coupons: Coupon[];
  new_product_requests: NewProductRequest[];
  delivery_slot_configs?: DeliverySlotConfig[];
  user_addresses?: UserAddressRecord[];
  onboarding?: OnboardingConfig;
  home_screen?: HomeScreenConfig;
  search_screen?: SearchScreenConfig;
  categories_screen?: CategoriesScreenConfig;
  category_products_screen?: CategoryProductsScreenConfig;
  product_detail_screen?: ProductDetailScreenConfig;
  cart_screen?: CartScreenConfig;
  offers_coupons_screen?: OffersCouponsScreenConfig;
  orders_screen?: OrdersScreenConfig;
  order_tracking_screen?: OrderTrackingScreenConfig;
  order_detail_screen?: OrderDetailScreenConfig;
  monthly_grocery_hub_screen?: MonthlyGroceryHubScreenConfig;
  one_click_cart_screen?: OneClickCartScreenConfig;
  copy_last_month_screen?: CopyLastMonthScreenConfig;
  saved_baskets_screen?: SavedBasketsScreenConfig;
  account_screen?: AccountScreenConfig;
  edit_profile_screen?: EditProfileScreenConfig;
  saved_addresses_screen?: SavedAddressesScreenConfig;
  add_address_screen?: AddAddressScreenConfig;
  my_coupons_screen?: MyCouponsScreenConfig;
  help_support_screen?: HelpSupportScreenConfig;
  delete_account_screen?: DeleteAccountScreenConfig;
  system_states_screen?: SystemStatesScreenConfig;
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
  states: [
    { id: 'state-mh', name: 'Maharashtra' },
    { id: 'state-ka', name: 'Karnataka' },
    { id: 'state-jh', name: 'Jharkhand' },
    { id: 'state-dl', name: 'Delhi NCR' },
    { id: 'state-gj', name: 'Gujarat' },
  ],
  districts: [
    { id: 'dist-pune', state_id: 'state-mh', name: 'Pune' },
    { id: 'dist-mumbai', state_id: 'state-mh', name: 'Mumbai' },
    { id: 'dist-thane', state_id: 'state-mh', name: 'Thane' },
    { id: 'dist-nashik', state_id: 'state-mh', name: 'Nashik' },
    { id: 'dist-bengaluru', state_id: 'state-ka', name: 'Bengaluru Urban' },
    { id: 'dist-mysuru', state_id: 'state-ka', name: 'Mysuru' },
    { id: 'dist-ranchi', state_id: 'state-jh', name: 'Ranchi' },
    { id: 'dist-dhanbad', state_id: 'state-jh', name: 'Dhanbad' },
    { id: 'dist-new-delhi', state_id: 'state-dl', name: 'New Delhi' },
    { id: 'dist-gb-nagar', state_id: 'state-dl', name: 'Gautam Buddh Nagar' },
    { id: 'dist-ahmedabad', state_id: 'state-gj', name: 'Ahmedabad' },
    { id: 'dist-surat', state_id: 'state-gj', name: 'Surat' },
  ],
  shop_territories: [],
  shop_products: [],
  categories: [
    {
      id: 'cat-1',
      name: 'Atta & Rice',
      image_url: 'https://xlnebedclqcmgfbfqkbm.supabase.co/storage/v1/object/public/product-images/products/aashirvaad_atta_10kg.png',
    },
    {
      id: 'cat-2',
      name: 'Oils & Ghee',
      image_url: 'https://xlnebedclqcmgfbfqkbm.supabase.co/storage/v1/object/public/product-images/products/fortune_mustard_oil_5l.png',
    },
    {
      id: 'cat-3',
      name: 'Dals & Pulses',
      image_url: 'https://xlnebedclqcmgfbfqkbm.supabase.co/storage/v1/object/public/product-images/products/daawat_basmati_rice_5kg.png',
    },
    {
      id: 'cat-4',
      name: 'Spices & Masala',
      image_url: 'https://xlnebedclqcmgfbfqkbm.supabase.co/storage/v1/object/public/product-images/products/everest_garam_masala_100g.png',
    },
    {
      id: 'cat-5',
      name: 'Dry Fruits',
      image_url: 'https://xlnebedclqcmgfbfqkbm.supabase.co/storage/v1/object/public/product-images/products/cadbury_bournvita_1kg.png',
    },
    {
      id: 'cat-6',
      name: 'Snacks',
      image_url: 'https://xlnebedclqcmgfbfqkbm.supabase.co/storage/v1/object/public/product-images/products/maggi_masala_noodles_12pack.png',
    },
    {
      id: 'cat-7',
      name: 'Beverages',
      image_url: 'https://xlnebedclqcmgfbfqkbm.supabase.co/storage/v1/object/public/product-images/products/tata_tea_gold_500g.png',
    },
    {
      id: 'cat-8',
      name: 'Biscuits',
      image_url: 'https://xlnebedclqcmgfbfqkbm.supabase.co/storage/v1/object/public/product-images/products/tata_salt_lite_1kg.png',
    },
    {
      id: 'cat-9',
      name: 'Cleaning',
      image_url: 'https://xlnebedclqcmgfbfqkbm.supabase.co/storage/v1/object/public/product-images/products/surf_excel_detergent_3kg.png',
    },
    {
      id: 'cat-10',
      name: 'Personal Care',
      image_url: 'https://xlnebedclqcmgfbfqkbm.supabase.co/storage/v1/object/public/product-images/products/amul_pure_ghee_1l.png',
    },
    {
      id: 'cat-11',
      name: 'Home & Kitchen',
      image_url: 'https://xlnebedclqcmgfbfqkbm.supabase.co/storage/v1/object/public/product-images/products/lizol_floor_cleaner_2l.png',
    },
    {
      id: 'cat-12',
      name: 'Baby Care',
      image_url: 'https://xlnebedclqcmgfbfqkbm.supabase.co/storage/v1/object/public/product-images/products/cadbury_bournvita_1kg.png',
    },
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
    load_error_message: 'Could not load home screen. Check that the backend is running.',
    retry_label: 'Retry',
    location_required_deals_label: 'Choose your delivery area to see deals from your local store.',
  },
  search_screen: {
    search_placeholder: 'Search atta, rice, oil…',
    popular_searches_label: 'POPULAR SEARCHES',
    products_section_label: 'PRODUCTS',
    empty_title_template: 'No results for "{query}"',
    empty_subtitle: 'Try another search term or check spelling',
    location_required_message: 'Choose your delivery area to search products from your local store.',
    choose_location_label: 'Choose delivery area',
    load_error_message: 'Could not load search screen. Check that the backend is running.',
    retry_label: 'Retry',
  },
  categories_screen: {
    title: 'All categories',
    search_placeholder: 'Search "atta", "rice", "oil"…',
    section_grocery_label: 'GROCERY & KITCHEN',
    section_snacks_label: 'SNACKS & BEVERAGES',
    section_household_label: 'HOUSEHOLD & CARE',
    section_default_label: 'GROCERY & KITCHEN',
    empty_message: 'No categories match your search',
    load_error_message: 'Could not load categories. Check that the backend is running.',
    retry_label: 'Retry',
  },
  category_products_screen: {
    search_placeholder_template: 'Search in {category}',
    items_count_template: '{category} · {count} items',
    sort_label: 'Sort',
    sub_category_all_label: 'All',
    empty_message: 'No products found',
    deals_title: 'Deals of the month',
    location_required_message: 'Choose your delivery area to see products from your local store.',
    choose_location_label: 'Choose delivery area',
    load_error_message: 'Could not load products. Check that the backend is running.',
    retry_label: 'Retry',
    view_cart_label: 'View cart',
    cart_item_label: '1 item',
    cart_items_template: '{count} items',
    add_button_label: 'ADD',
    filter_sheet_title: 'Sort & filter',
    filter_sort_section_label: 'SORT BY',
    filter_sort_relevance: 'Relevance',
    filter_sort_price_low: 'Price — Low to High',
    filter_sort_price_high: 'Price — High to Low',
    filter_sort_discount: 'Discount — High to Low',
    filter_pack_section_label: 'PACK SIZE',
    filter_clear_label: 'Clear all',
    filter_apply_label: 'Apply',
  },
  product_detail_screen: {
    delivery_window_label: 'Delivered in your planned 4-hour window',
    highlights_section_label: 'HIGHLIGHTS',
    add_to_cart_label: 'Add to cart',
    unit_price_suffix_template: '{unit} · incl. taxes',
    not_found_message: 'Product not found or unavailable in your area.',
    location_required_message: 'Choose your delivery area to see product details and prices.',
    choose_location_label: 'Choose delivery area',
    load_error_message: 'Could not load product. Check that the backend is running.',
    retry_label: 'Retry',
  },
  cart_screen: {
    title: 'Your cart',
    cart_item_label: '1 item',
    cart_items_template: '{count} items',
    empty_title: 'Your cart is empty',
    empty_message: 'Add your monthly essentials and they’ll show up here.',
    start_shopping_label: 'Start shopping',
    reorder_last_month_label: 'Reorder last month’s basket',
    save_basket_label: 'Save this cart as a basket',
    apply_coupon_label: 'Apply coupon',
    coupon_applied_template: '{code} applied · ₹{discount} saved',
    bill_details_title: 'Bill details',
    bill_item_total_label: 'Item total (MRP)',
    bill_savings_label: 'Savings',
    bill_delivery_fee_label: 'Delivery fee',
    bill_delivery_fee_value: 'FREE',
    bill_coupon_discount_label: 'Coupon discount',
    bill_to_pay_label: 'To pay',
    sticky_to_pay_label: 'TO PAY',
    proceed_to_pay_label: 'Proceed to pay',
    below_min_title_template: 'Add ₹{amount} more to check out',
    below_min_footnote_template: 'You’re at ₹{current} of the ₹{minimum} monthly minimum order',
    savings_banner_template: 'You\'re saving ₹{savings} on this order 🎉',
    add_more_checkout_template: 'Add ₹{amount} more',
    min_order_alert_template: 'Please add ₹{amount} more to reach the ₹{minimum} minimum order value.',
    empty_preview_image_1: '',
    empty_preview_image_2: '',
    load_error_message: 'Could not load cart screen. Check that the backend is running.',
    retry_label: 'Retry',
  },
  offers_coupons_screen: {
    title: 'Offers & coupons',
    manual_code_placeholder: 'Enter coupon code',
    manual_apply_label: 'Apply',
    available_section_label: 'AVAILABLE FOR YOU',
    expires_template: 'Expires {date}',
    list_apply_label: 'APPLY',
    empty_message: 'No offers available right now.',
    load_error_message: 'Could not load offers screen. Check that the backend is running.',
    retry_label: 'Retry',
    min_order_alert_title: 'Minimum Order Not Met',
    min_order_alert_template: 'Add ₹{amount} more to your basket to apply code {code}.',
    invalid_coupon_alert_title: 'Invalid Coupon',
    apply_failed_fallback: 'Failed to apply coupon.',
    connection_error_title: 'Error',
    connection_error_message: 'Connection error while applying coupon.',
    unlock_offer_template: 'Add items worth ₹{amount} more to unlock this offer',
    audience_new_guideline: 'Welcome Offer: Valid on first order only.',
    audience_loyal_guideline: 'Loyalty Offer: Valid for returning customers.',
    audience_all_guideline: 'Valid for all customers.',
    usage_limit_template: 'Limit: Max {limit} uses per account.',
  },
  orders_screen: {
    title: 'Your orders',
    guest_title: 'Sign in to see your orders',
    guest_subtitle: 'View deliveries and reorder your monthly baskets once you sign in.',
    guest_cta_label: 'Continue with phone number',
    empty_title: 'No orders yet',
    empty_message: 'Once you place your monthly grocery order, you can track it right here.',
    empty_cta_label: 'Start monthly shopping',
    past_orders_section_label: 'PAST ORDERS',
    active_arriving_template: 'Arriving {slot}',
    track_button_label: 'Details',
    delivery_otp_label: 'Delivery OTP',
    items_count_template: '{count} items',
    reorder_button_label: 'Reorder',
    delivered_status_template: 'Delivered · {date}',
    status_out_for_delivery: 'Out for delivery',
    status_confirmed: 'Order confirmed',
    status_packed: 'Packed',
    load_error_message: 'Could not load orders. Check that the backend is running.',
    retry_label: 'Retry',
    reorder_success_title: 'Basket reordered',
    reorder_success_message_template: 'Added {count} items from {order_id} to your cart.',
    reorder_keep_browsing_label: 'Keep browsing',
    reorder_view_cart_label: 'View cart',
    reorder_error_message: 'Could not reorder items at this moment.',
    error_alert_title: 'Something went wrong',
    default_product_name: 'Grocery item',
  },
  order_tracking_screen: {
    title: 'Track order',
    out_for_delivery_banner: 'OUT FOR DELIVERY',
    arriving_template: 'Arriving {slot}',
    subtitle: 'Your whole monthly order, in one trip',
    delivery_otp_label: 'DELIVERY OTP',
    delivery_otp_subtitle: 'Share this with your delivery partner',
    timeline_confirmed: 'Order confirmed',
    timeline_packed: 'Packed at your store',
    timeline_dispatched: 'Dispatched',
    timeline_out_for_delivery: 'Out for delivery',
    timeline_delivered: 'Delivered',
    timeline_pending_time: 'Pending',
    timeline_expected_template: 'Expected by {time}',
    delivery_partner_label: 'Your delivery partner',
    view_summary_title: 'View order summary',
    view_summary_subtitle_template: '{count} items · {amount}',
    help_title: 'Need help with this order?',
    help_subtitle: 'Chat with support',
    load_error_message: 'Could not load order tracking. Check that the backend is running.',
    retry_label: 'Retry',
  },
  order_detail_screen: {
    title: 'Order details',
    items_section_template: '{count} ITEMS',
    items_not_delivered_template: '{count} ITEMS · NOT DELIVERED',
    qty_template: 'Qty {qty}',
    delivery_details_section_label: 'DELIVERY DETAILS',
    delivered_to_label: 'Delivered to',
    delivery_window_label: 'Delivery window',
    paid_via_label: 'Paid via',
    paid_via_template: '{method} · {amount}',
    bill_details_title: 'BILL DETAILS',
    bill_item_total_label: 'Item total (MRP)',
    bill_coupon_template: 'Coupon ({code})',
    bill_savings_label: 'Savings',
    bill_delivery_fee_label: 'Delivery fee',
    bill_delivery_fee_value: 'FREE',
    bill_total_paid_label: 'Total paid',
    reorder_button_label: 'Reorder this basket',
    invoice_label: 'Invoice',
    get_help_label: 'Get help',
    status_timeline_section_label: 'ORDER STATUS',
    active_arriving_template: 'Arriving {slot}',
    status_out_for_delivery: 'Out for delivery',
    status_confirmed: 'Order confirmed',
    status_packed: 'Packed',
    timeline_confirmed: 'Order confirmed',
    timeline_packed: 'Packed at your store',
    timeline_dispatched: 'Dispatched',
    timeline_out_for_delivery: 'Out for delivery',
    timeline_delivered: 'Delivered',
    timeline_pending_time: 'Pending',
    timeline_expected_template: 'Expected by {time}',
    delivery_otp_label: 'Delivery OTP',
    delivery_otp_subtitle: 'Share this with your delivery partner',
    delivery_partner_label: 'Your delivery partner',
    delivered_status_label: 'Delivered',
    delivered_on_template: 'On {datetime} · {order_id}',
    cancelled_status_label: 'Order cancelled',
    cancelled_on_template: 'Cancelled on {datetime} · {cancelled_by}',
    cancelled_by_you_label: 'by you',
    cancelled_by_support_label: 'by support',
    reorder_cancelled_button_label: 'Reorder these items',
    cancelled_help_label: 'Need help with this order?',
    cancel_order_label: 'Cancel order',
    cancel_order_confirm_title: 'Cancel this order?',
    cancel_order_confirm_message:
      'You can cancel anytime before your store starts packing this monthly basket.',
    cancel_order_confirm_yes: 'Yes, cancel',
    cancel_order_confirm_no: 'Keep order',
    cancel_order_error_message: 'Could not cancel this order. It may have already started packing.',
    refund_initiated_template: 'Refund of {amount} initiated',
    refund_eta_message: 'Refund timeline depends on your payment method.',
    load_error_message: 'Could not load order details. Check that the backend is running.',
    retry_label: 'Retry',
    reorder_success_title: 'Reorder successful',
    reorder_success_message_template: 'Added {count} items to your cart.',
    reorder_keep_browsing_label: 'Keep browsing',
    reorder_view_cart_label: 'View cart',
    reorder_error_message: 'Could not reorder items at this moment.',
    error_alert_title: 'Something went wrong',
    default_product_name: 'Grocery item',
  },
  monthly_grocery_hub_screen: {
    title: 'My Monthly Grocery',
    hero_badge: 'PLAN ONCE · SAVE MORE',
    hero_title: 'Your whole month, sorted in one tap',
    hero_subtitle: 'Smart baskets built from what your home actually buys — reorder in seconds.',
    hero_savings_template: '₹{amount} saved this month',
    card_one_click_title: 'One-click monthly cart',
    card_one_click_subtitle: 'Auto-build this month’s basket from what you usually buy',
    card_copy_title: 'Copy last month’s basket',
    card_copy_subtitle_template: 'Recreate your {month} order · {count} items',
    card_copy_empty_subtitle: 'Reorder from your most recent monthly order',
    card_saved_title: 'Saved baskets',
    card_saved_subtitle_template: '{count} baskets ready to reorder',
    card_saved_empty_subtitle: 'Save baskets to reorder faster',
    card_build_title: 'Build from your list',
    card_build_soon_badge: 'SOON',
    card_build_subtitle: 'Type, snap a photo, or say it aloud',
    load_error_message: 'Could not load monthly grocery hub. Check that the backend is running.',
    retry_label: 'Retry',
    metrics_error_message: 'Could not load your savings and order summary.',
    no_last_order_title: 'No past order yet',
    no_last_order_message: 'Place your first monthly grocery order to copy it next time.',
  },
  one_click_cart_screen: {
    title: 'Your monthly basket',
    generating_title: 'Building your basket',
    generating_subtitle: 'Looking at what your home buys every month…',
    insight_title_template: 'Built from your last {months} months',
    insight_subtitle_template: '{count} essentials your home buys every month',
    items_count_template: '{count} items',
    add_all_label: 'Add all to cart',
    add_all_success_title: 'Monthly basket added',
    add_all_success_message_template: 'Added {count} items to your cart.',
    keep_browsing_label: 'Keep browsing',
    view_cart_label: 'View cart',
    empty_title: 'No monthly pattern yet',
    empty_message:
      'Place a few monthly orders and we will auto-build a basket from what your home buys.',
    empty_cta_label: 'Start shopping',
    no_location_title: 'Choose delivery area',
    no_location_message: 'Select your city and area to load live store prices for your basket.',
    load_error_message: 'Could not build your monthly basket. Please try again.',
    retry_label: 'Retry',
    unavailable_label: 'Unavailable at your store',
    source_months: 3,
    section_label_overrides: {
      'Atta & Rice': 'STAPLES',
      'Dals & Pulses': 'STAPLES',
      'Cooking Essentials': 'STAPLES',
      'Oils & Ghee': 'TEA, OILS & DAIRY',
      'Tea & Coffee': 'TEA, OILS & DAIRY',
      'Dairy Staples': 'TEA, OILS & DAIRY',
      'Beverages': 'TEA, OILS & DAIRY',
      'Cleaning & Home': 'HOUSEHOLD',
      'Personal Care': 'HOUSEHOLD',
    },
  },
  copy_last_month_screen: {
    title: 'Copy last month',
    insight_title_template: 'Your basket from {month}',
    insight_subtitle_template: '{count} items · delivered {date}',
    changes_all_good_message: 'All items match your last order — prices and stock verified',
    changes_both_template:
      'A few things changed — {repriced} repriced, {unavailable} now unavailable',
    changes_repriced_only_template: '{repriced} items updated with today’s prices',
    changes_unavailable_only_template: '{unavailable} items now unavailable',
    available_count_template: '{count} available',
    add_to_cart_label: 'Add to cart',
    add_success_title: 'Previous basket copied',
    add_success_message_template: 'Added {count} items to your cart.',
    keep_browsing_label: 'Keep browsing',
    view_cart_label: 'View cart',
    empty_title: 'No previous orders yet',
    empty_message:
      'Once you complete your first monthly grocery order, you can recreate that basket here in one tap.',
    empty_cta_label: 'Start shopping',
    no_location_title: 'Choose delivery area',
    no_location_message: 'Select your city and area to verify live store prices for your last order.',
    load_error_message: 'Could not load your last order basket. Please try again.',
    retry_label: 'Retry',
    unavailable_label: 'Unavailable',
    view_similar_label: 'View similar',
    was_price_template: 'was ₹{amount}',
  },
  saved_baskets_screen: {
    title: 'Saved baskets',
    new_basket_label: '+ New',
    items_summary_template: '{count} items · {preview}',
    add_to_cart_label: 'Add to cart',
    add_success_title: 'Basket added',
    add_success_message_template: 'Added items from "{name}" to your cart.',
    keep_browsing_label: 'Keep browsing',
    view_cart_label: 'View cart',
    empty_title: 'No saved baskets yet',
    empty_message:
      'Save your current cart or a past order as a basket to reorder in one tap next month.',
    empty_cta_label: 'Start shopping',
    save_sheet_title: 'Save as a basket',
    save_sheet_subtitle: 'Reuse these items next month in one tap.',
    basket_name_label: 'BASKET NAME',
    default_basket_name_template: 'Monthly basket · {month}',
    items_will_save_template: '{count} items · {amount} will be saved',
    save_basket_button_label: 'Save basket',
    success_title: 'Saved to your baskets',
    success_message_template: '“{name}” is ready to reorder anytime.',
    view_saved_baskets_label: 'View saved baskets',
    done_label: 'Done',
    empty_cart_title: 'Cart is empty',
    empty_cart_message: 'Add items to your cart before saving a basket.',
    no_location_title: 'Choose delivery area',
    no_location_message: 'Select your city and area to add baskets with live store prices.',
    unavailable_skip_message: 'Some items were unavailable and were skipped.',
    load_error_message: 'Could not load saved baskets screen. Please try again.',
    retry_label: 'Retry',
    preview_name_count: 4,
  },
  edit_profile_screen: {
    title: 'Edit profile',
    change_photo_label: 'Change photo',
    change_photo_alert_title: 'Change photo',
    change_photo_alert_message: 'Photo upload is coming soon.',
    full_name_label: 'Full name',
    full_name_placeholder: 'Enter full name',
    phone_label: 'Phone number',
    verified_label: 'Verified',
    email_label: 'Email (optional)',
    email_placeholder: 'Enter email address',
    delete_account_label: 'Delete account',
    save_button_label: 'Save changes',
    name_required_title: 'Required',
    name_required_message: 'Please enter your full name.',
    save_success_title: 'Profile updated',
    save_success_message: 'Your profile details have been saved successfully!',
    save_error_message: 'Could not save your profile. Please try again.',
    load_error_message: 'Could not load edit profile screen. Please try again.',
    retry_label: 'Retry',
  },
  saved_addresses_screen: {
    title: 'Saved addresses',
    select_title: 'Select delivery address',
    empty_title: 'No saved addresses yet',
    empty_message: 'Add your delivery address to continue checkout.',
    add_address_label: 'Add a new address',
    deliver_button_label: 'Deliver to this address',
    default_badge_label: 'DEFAULT',
    select_alert_title: 'Select an address',
    select_alert_message: 'Please choose a delivery address to continue.',
    load_error_message: 'Could not load saved addresses. Please try again.',
    retry_label: 'Retry',
  },
  add_address_screen: {
    add_title: 'Add address',
    edit_title: 'Edit address',
    flat_label: 'FLAT / HOUSE NO.',
    flat_placeholder: 'Enter flat or house number',
    street_label: 'AREA / LOCALITY',
    street_placeholder: 'Enter area, locality, and city',
    landmark_label: 'LANDMARK (OPTIONAL)',
    landmark_placeholder: 'Near hospital, school, etc.',
    pincode_label: 'PINCODE',
    pincode_placeholder: '6-digit pincode',
    phone_label: 'PHONE',
    phone_placeholder: '10-digit mobile',
    save_as_label: 'SAVE AS',
    tag_home_key: 'Home',
    tag_home_label: 'Home',
    tag_work_key: 'Work',
    tag_work_label: 'Work',
    tag_other_key: 'Other',
    tag_other_label: 'Other',
    default_tag_key: 'Home',
    save_button_label: 'Save address',
    saving_button_label: 'Saving…',
    login_required_title: 'Login required',
    login_required_message: 'Please log in to save your delivery address.',
    incomplete_title: 'Incomplete details',
    incomplete_message: 'Please fill flat/house, area/locality, and pincode.',
    save_error_title: 'Error',
    load_error_message: 'Could not load add address screen. Please try again.',
    retry_label: 'Retry',
  },
  my_coupons_screen: {
    title: 'My coupons',
    banner_title: 'Monthly Savings Club',
    banner_subtitle:
      'Use these coupons at checkout to unlock guaranteed monthly discounts on pantry staples.',
    section_label: 'AVAILABLE OFFERS',
    expires_template: 'Expires on {date}',
    list_copy_label: 'COPY',
    empty_message: 'No offers available right now.',
    copy_alert_title: 'Coupon copied',
    copy_alert_message_template:
      'Promo code "{code}" is ready. You can paste it during checkout.',
    copy_alert_go_cart_label: 'Go to cart',
    copy_alert_ok_label: 'OK',
    load_error_message: 'Could not load my coupons screen. Please try again.',
    retry_label: 'Retry',
    audience_new_guideline: 'Welcome Offer: Valid on first order only.',
    audience_loyal_guideline: 'Loyalty Offer: Valid for returning customers.',
    audience_all_guideline: 'Valid for all customers.',
    usage_limit_template: 'Limit: Max {limit} uses per account.',
  },
  help_support_screen: {
    title: 'Help & support',
    chat_title: 'Chat with us',
    chat_subtitle: 'Avg reply: < 5 min',
    call_title: 'Call us',
    call_subtitle: '7:00 AM - 10:00 PM daily',
    phone_number: '+918830480015',
    whatsapp_phone: '918830480015',
    whatsapp_message: 'Hi MonthlyGrocery Support',
    chat_fallback_alert_title: 'Support chat',
    chat_fallback_alert_message: 'Could not open WhatsApp. Please try again later.',
    call_fallback_alert_title: 'Helpline',
    call_fallback_alert_message: 'Could not start a phone call on this device.',
    call_fallback_message_template: 'Call our support team at {phone} ({hours}).',
    faq_section_label: 'FREQUENTLY ASKED QUESTIONS',
    delivery_areas_answer_template:
      'We currently deliver across {areas} with expanding coverage across Maharashtra.',
    faqs: [
      {
        id: 'faq-delivery',
        question: 'Where do you deliver?',
        answer_template: '{delivery_areas}',
      },
      {
        id: 'faq-min-order',
        question: 'How does the ₹2,000 minimum work?',
        answer:
          'To provide direct-from-brand wholesale pricing, maximum savings, and free scheduled doorstep delivery, all monthly baskets require a minimum value of ₹2,000.',
      },
      {
        id: 'faq-edit-cancel',
        question: 'Can I edit or cancel a placed order?',
        answer:
          'Yes, you can edit item quantities or cancel your order anytime before the local hub begins packing your basket.',
      },
      {
        id: 'faq-baskets',
        question: 'How do subscriptions & baskets work?',
        answer:
          'You can tap "Save as a basket" on any active cart to create a reusable template. Next month, open Saved Baskets and reorder in one tap with verified live rates.',
      },
      {
        id: 'faq-slots',
        question: 'Delivery slots and timing',
        answer:
          'We offer planned 3-hour delivery windows: Morning (7:00 AM - 10:00 AM), Afternoon (12:00 PM - 3:00 PM), and Evening (6:00 PM - 9:00 PM).',
      },
    ],
    load_error_message: 'Could not load help & support. Please try again.',
    retry_label: 'Retry',
  },
  delete_account_screen: {
    title: 'Delete account',
    warning_text:
      'This permanently deletes your MonthlyGrocery account and all your saved data. This action cannot be undone.',
    section_label: 'WHAT WILL BE DELETED:',
    deleted_items: [
      { id: 'item-orders', label: 'Order history & tracking' },
      { id: 'item-baskets', label: 'Saved monthly baskets' },
      { id: 'item-addresses', label: 'Saved addresses' },
      { id: 'item-coupons', label: 'Coupons & rewards' },
    ],
    active_orders_warning:
      'Any active orders will be delivered before your account is closed.',
    agreement_label: 'I understand this is permanent and cannot be undone',
    delete_button_label: 'Delete my account',
    cancel_label: 'Cancel',
    agreement_required_title: 'Required',
    agreement_required_message: 'Please check the confirmation box to proceed.',
    delete_error_message: 'Could not delete your account. Please try again.',
    success_title: 'Your account has been deleted',
    success_subtitle:
      'Your MonthlyGrocery account and all your associated data have been permanently removed. We\'re sorry to see you go — you\'re always welcome back!',
    success_active_orders_note: 'Active orders (if any) will still be delivered.',
    success_back_home_label: 'Back to Home',
    load_error_message: 'Could not load delete account screen. Please try again.',
    retry_label: 'Retry',
  },
  system_states_screen: {
    offline: {
      title: "You're offline",
      subtitle: 'Check your internet connection and try again.',
      primary_button_label: 'Retry',
    },
    unserviceable: {
      title: "We're not here yet",
      subtitle_template:
        "MonthlyGrocery doesn't deliver to {area} yet, but we're expanding fast.",
      subtitle: '',
      primary_button_label: "Notify me when you're live",
      secondary_button_label: 'Change area',
      notify_success_message:
        "We've saved your request. You'll be the first to know when MonthlyGrocery begins deliveries in your area.",
      notify_error_message: 'Could not save your request. Please try again.',
    },
    error: {
      title: 'Something went wrong',
      subtitle: 'We hit a snag on our end. Please try again in a moment.',
      primary_button_label: 'Try again',
      secondary_button_label: 'Go to home',
    },
    maintenance: {
      title: 'Back in a bit',
      subtitle:
        "We're doing some quick upkeep to serve you better. Please check back shortly.",
      primary_button_label: 'Retry',
    },
    load_error_message: 'Could not load system state screen. Please try again.',
    retry_label: 'Retry',
  },
  account_screen: {
    title: 'Account',
    edit_label: 'Edit',
    savings_header: 'SAVED WITH MONTHLYGROCERY',
    savings_since_template: 'since you joined in {month}',
    menu_saved_addresses: 'Saved addresses',
    menu_my_coupons: 'My coupons',
    menu_help_support: 'Help & support',
    menu_about_terms: 'About & terms',
    logout_label: 'Log out',
    guest_title: 'You’re browsing as a guest',
    guest_subtitle:
      'Log in to track orders, save your monthly baskets, and check out faster.',
    guest_login_label: 'Log in or sign up',
    guest_delivery_area_label: 'Delivery area',
    guest_delivery_area_template: '{area}, {city}',
    guest_no_area_label: 'Choose your delivery area',
    about_alert_title: 'MonthlyGrocery',
    about_alert_message: 'Version 1.0.0 · Your monthly grocery savings platform.',
    logout_sheet_title: 'Log out of MonthlyGrocery?',
    logout_sheet_subtitle:
      'You can log back in anytime with your phone number to access your saved monthly baskets and order history.',
    logout_cancel_label: 'Cancel',
    logout_confirm_label: 'Log out',
    load_error_message: 'Could not load account screen. Please try again.',
    retry_label: 'Retry',
    metrics_error_message: 'Could not load your savings summary.',
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
    if (!db.states) db.states = defaultDb.states;
    if (!db.districts) db.districts = defaultDb.districts;
    if (!db.shop_territories) db.shop_territories = [];
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
    } else {
      const homePatch: Partial<HomeScreenConfig> = {};
      if (!db.home_screen.load_error_message) homePatch.load_error_message = defaultDb.home_screen!.load_error_message;
      if (!db.home_screen.retry_label) homePatch.retry_label = defaultDb.home_screen!.retry_label;
      if (!db.home_screen.location_required_deals_label) {
        homePatch.location_required_deals_label = defaultDb.home_screen!.location_required_deals_label;
      }
      if (Object.keys(homePatch).length > 0) {
        db.home_screen = { ...db.home_screen, ...homePatch };
        fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf-8');
      }
    }
    if (!db.search_screen) {
      db.search_screen = defaultDb.search_screen;
      fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf-8');
    }
    if (!db.categories_screen) {
      db.categories_screen = defaultDb.categories_screen;
      fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf-8');
    }
    if (!db.category_products_screen) {
      db.category_products_screen = defaultDb.category_products_screen;
      fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf-8');
    }
    if (!db.product_detail_screen) {
      db.product_detail_screen = defaultDb.product_detail_screen;
      fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf-8');
    }
    if (!db.cart_screen) {
      db.cart_screen = defaultDb.cart_screen;
      fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf-8');
    }
    if (!db.offers_coupons_screen) {
      db.offers_coupons_screen = defaultDb.offers_coupons_screen;
      fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf-8');
    }
    if (!db.orders_screen) {
      db.orders_screen = defaultDb.orders_screen;
      fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf-8');
    }
    if (!db.order_tracking_screen) {
      db.order_tracking_screen = defaultDb.order_tracking_screen;
      fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf-8');
    }
    if (!db.order_detail_screen) {
      db.order_detail_screen = defaultDb.order_detail_screen;
      fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf-8');
    }
    if (!db.monthly_grocery_hub_screen) {
      db.monthly_grocery_hub_screen = defaultDb.monthly_grocery_hub_screen;
      fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf-8');
    }
    if (!db.one_click_cart_screen) {
      db.one_click_cart_screen = defaultDb.one_click_cart_screen;
      fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf-8');
    }
    if (!db.copy_last_month_screen) {
      db.copy_last_month_screen = defaultDb.copy_last_month_screen;
      fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf-8');
    }
    if (!db.saved_baskets_screen) {
      db.saved_baskets_screen = defaultDb.saved_baskets_screen;
      fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf-8');
    }
    if (!db.account_screen) {
      db.account_screen = defaultDb.account_screen;
      fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf-8');
    }
    if (!db.edit_profile_screen) {
      db.edit_profile_screen = defaultDb.edit_profile_screen;
      fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf-8');
    }
    if (!db.saved_addresses_screen) {
      db.saved_addresses_screen = defaultDb.saved_addresses_screen;
      fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf-8');
    }
    if (!db.add_address_screen) {
      db.add_address_screen = defaultDb.add_address_screen;
      fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf-8');
    }
    if (!db.my_coupons_screen) {
      db.my_coupons_screen = defaultDb.my_coupons_screen;
      fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf-8');
    }
    if (!db.help_support_screen) {
      db.help_support_screen = defaultDb.help_support_screen;
      fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf-8');
    }
    if (!db.delete_account_screen) {
      db.delete_account_screen = defaultDb.delete_account_screen;
      fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf-8');
    }
    if (!db.system_states_screen) {
      db.system_states_screen = defaultDb.system_states_screen;
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

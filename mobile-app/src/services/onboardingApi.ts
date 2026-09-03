import { API_BASE } from '../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const VALUE_INTRO_SEEN_KEY = '@value_intro_seen';

export async function hasSeenValueIntro(): Promise<boolean> {
  return (await AsyncStorage.getItem(VALUE_INTRO_SEEN_KEY)) === 'true';
}

export async function markValueIntroSeen(): Promise<void> {
  await AsyncStorage.setItem(VALUE_INTRO_SEEN_KEY, 'true');
}

/** In-memory flag so intro is not shown twice in the same JS session (e.g. fast refresh). */
let valueIntroCompletedThisSession = false;

export function hasCompletedValueIntroThisSession(): boolean {
  return valueIntroCompletedThisSession;
}

export async function markValueIntroCompletedThisSession(): Promise<void> {
  valueIntroCompletedThisSession = true;
  await markValueIntroSeen();
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

export async function fetchOnboardingConfig(): Promise<OnboardingConfig | null> {
  try {
    const res = await fetch(`${API_BASE}/admin/onboarding`);
    const data = await res.json();
    if (!res.ok || !data.success || !data.onboarding) {
      return null;
    }
    return data.onboarding as OnboardingConfig;
  } catch {
    return null;
  }
}

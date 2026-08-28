import { API_BASE } from '../config/api';

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

export function formatHelpTemplate(
  template: string,
  vars: Record<string, string>,
): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => vars[key] ?? '');
}

export function buildWhatsAppUrl(phone: string, message: string): string {
  const digits = phone.replace(/\D/g, '');
  const text = encodeURIComponent(message);
  return `https://wa.me/${digits}?text=${text}`;
}

export function buildTelUrl(phone: string): string {
  const trimmed = phone.trim();
  if (trimmed.startsWith('+')) return `tel:${trimmed}`;
  const digits = trimmed.replace(/\D/g, '');
  return `tel:+${digits}`;
}

export async function fetchHelpSupportScreenConfig(): Promise<HelpSupportScreenConfig | null> {
  try {
    const res = await fetch(`${API_BASE}/admin/help-support-screen`);
    const data = await res.json();
    if (res.ok && data.success && data.help_support) {
      return data.help_support as HelpSupportScreenConfig;
    }
    return null;
  } catch {
    return null;
  }
}

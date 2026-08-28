import { API_BASE } from '../config/api';

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

export function formatSystemStateTemplate(
  template: string,
  vars: Record<string, string>,
): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => vars[key] ?? '');
}

export async function fetchSystemStatesScreenConfig(): Promise<SystemStatesScreenConfig | null> {
  try {
    const res = await fetch(`${API_BASE}/admin/system-states-screen`);
    const data = await res.json();
    if (res.ok && data.success && data.system_states) {
      return data.system_states as SystemStatesScreenConfig;
    }
    return null;
  } catch {
    return null;
  }
}

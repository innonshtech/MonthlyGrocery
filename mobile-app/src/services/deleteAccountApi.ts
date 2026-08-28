import { API_BASE } from '../config/api';

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

export async function fetchDeleteAccountScreenConfig(): Promise<DeleteAccountScreenConfig | null> {
  try {
    const res = await fetch(`${API_BASE}/admin/delete-account-screen`);
    const data = await res.json();
    if (res.ok && data.success && data.delete_account) {
      return data.delete_account as DeleteAccountScreenConfig;
    }
    return null;
  } catch {
    return null;
  }
}

export async function deleteAccount(token: string): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/auth/account`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      return { success: false, error: data.error || 'Failed to delete account' };
    }
    return { success: true };
  } catch {
    return { success: false, error: 'Network error' };
  }
}

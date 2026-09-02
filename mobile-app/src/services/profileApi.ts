import { API_BASE } from '../config/api';
import { formatDisplayPhone } from './accountApi';

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

export interface ProfileUser {
  id: string;
  mobile: string;
  name: string;
  role: string;
  email?: string;
}

export interface UpdateProfileResult {
  success: boolean;
  user?: ProfileUser;
  error?: string;
}

export async function fetchEditProfileScreenConfig(): Promise<EditProfileScreenConfig | null> {
  try {
    const res = await fetch(`${API_BASE}/admin/edit-profile-screen`);
    const data = await res.json();
    if (res.ok && data.success && data.edit_profile) {
      return data.edit_profile as EditProfileScreenConfig;
    }
    return null;
  } catch {
    return null;
  }
}

export async function fetchProfile(token: string): Promise<ProfileUser | null> {
  try {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (res.ok && data.success && data.user) {
      return data.user as ProfileUser;
    }
    return null;
  } catch {
    return null;
  }
}

export async function updateProfile(
  token: string,
  name: string,
  email?: string,
): Promise<UpdateProfileResult> {
  try {
    const res = await fetch(`${API_BASE}/auth/profile`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        name: name.trim(),
        email: email?.trim() || undefined,
      }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      return { success: false, error: data.error || 'Failed to update profile' };
    }
    return { success: true, user: data.user };
  } catch {
    return { success: false, error: 'Network error' };
  }
}

export async function uploadAvatar(
  token: string,
  base64Image: string,
  mimeType?: string,
): Promise<{ success: boolean; avatar_url?: string; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/auth/upload-avatar`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        base64Image,
        mimeType: mimeType || 'image/jpeg',
      }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      return { success: false, error: data.error || 'Failed to upload photo' };
    }
    return { success: true, avatar_url: data.avatar_url };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Network error' };
  }
}

export { formatDisplayPhone };

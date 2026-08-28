import { API_BASE } from '../config/api';

export interface UpdateProfileResult {
  success: boolean;
  user?: {
    id: string;
    mobile: string;
    name: string;
    role: string;
  };
  error?: string;
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

const getApiBase = () => {
  const envUrl = (process.env.NEXT_PUBLIC_API_URL || 'https://monthly-grocery-rust.vercel.app/api').trim().replace(/\/+$/, '');
  return envUrl.endsWith('/api') ? envUrl : `${envUrl}/api`;
};

export const API_BASE = getApiBase();

export function clearAdminSession() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('@admin_token');
  localStorage.removeItem('@admin_user');
}

export function redirectToLogin(message?: string) {
  if (typeof window === 'undefined') return;
  clearAdminSession();
  if (message) {
    sessionStorage.setItem('@admin_login_notice', message);
  }
  if (!window.location.pathname.startsWith('/login')) {
    window.location.href = '/login';
  }
}

export async function apiFetch(path: string, options: RequestInit = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('@admin_token') : null;

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> | undefined),
  };

  if (options.body && !headers['Content-Type'] && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  if (token && !headers.Authorization) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
    });
  } catch (err: any) {
    throw new Error(`Cannot reach API server at ${API_BASE}. ${err?.message || ''}`);
  }

  const text = await response.text();
  let data: any = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      if (!response.ok) {
        throw new Error(`Server error (${response.status}): ${text.slice(0, 150)}`);
      }
      throw new Error('Invalid JSON response format from server');
    }
  }

  if (response.status === 401) {
    redirectToLogin('Your session expired or was created on a different server. Please log in again.');
    throw new Error(data?.error || 'Unauthorized: Invalid or expired token');
  }

  if (!response.ok) {
    throw new Error(data?.error || `Request failed (${response.status})`);
  }

  return data ?? { success: true };
}

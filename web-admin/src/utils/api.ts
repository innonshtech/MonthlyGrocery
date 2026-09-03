export const API_BASE = 'http://localhost:8001/api';

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

  if (options.body && !headers['Content-Type']) {
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
  } catch {
    throw new Error('Cannot reach API server. Is express-backend running on port 8001?');
  }

  const text = await response.text();
  let data: any = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error('Invalid response from server');
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

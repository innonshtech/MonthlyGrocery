const getApiBase = () => {
  if (typeof window !== 'undefined' && window.location.protocol === 'https:') {
    // If the browser is on HTTPS, never call plain HTTP directly to prevent browser mixed content block
    if (!process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_URL.startsWith('http://') || process.env.NEXT_PUBLIC_API_URL === '/backend-api') {
      return '/backend-api';
    }
  }

  if (process.env.NEXT_PUBLIC_API_URL) {
    const envUrl = process.env.NEXT_PUBLIC_API_URL.trim().replace(/\/+$/, '');
    return envUrl.endsWith('/api') || envUrl.endsWith('/backend-api') ? envUrl : `${envUrl}/api`;
  }
  // Use Next.js rewrite proxy by default to avoid HTTPS-to-HTTP mixed content blocks
  return '/backend-api';
};

export const API_BASE = getApiBase();

/**
 * Safely resolves image URLs to avoid browser HTTPS mixed-content blocks.
 * Converts plain http backend image links to /backend-api/uploads/ proxy URLs.
 */
export function resolveImageUrl(rawUrl?: string | null): string {
  if (!rawUrl) return '';
  const url = String(rawUrl).trim();
  if (!url) return '';

  // Local assets (e.g., /ever-logo.png, /hero-couple.png)
  if (url.startsWith('/') && !url.startsWith('/api/uploads') && !url.startsWith('/uploads')) {
    return url;
  }

  // Data / Blob URLs
  if (url.startsWith('data:') || url.startsWith('blob:')) {
    return url;
  }

  // Backend /api/uploads/ or /uploads/ paths
  if (url.includes('/api/uploads/')) {
    const afterUploads = url.split('/api/uploads/')[1];
    return `/backend-api/uploads/${afterUploads}`;
  }
  if (url.includes('/uploads/')) {
    const afterUploads = url.split('/uploads/')[1];
    return `/backend-api/uploads/${afterUploads}`;
  }

  // EC2 HTTP IP URLs
  if (url.startsWith('http://13.233.159.143/api/')) {
    return url.replace('http://13.233.159.143/api/', '/backend-api/');
  }
  if (url.startsWith('http://13.233.159.143/')) {
    return url.replace('http://13.233.159.143/', '/backend-api/');
  }

  return url;
}


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

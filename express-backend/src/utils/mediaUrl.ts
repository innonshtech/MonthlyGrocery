import type { Request } from 'express';

const DEFAULT_BUCKET = process.env.AWS_S3_BUCKET_NAME || 'monthly-grocery-media-prod';

/** Base URL for image links returned to apps (must match mobile API_BASE host). */
export function getClientMediaOrigin(req: Request): string {
  const fromEnv = process.env.PUBLIC_API_URL?.trim();
  if (fromEnv) {
    return fromEnv.replace(/\/api\/?$/i, '');
  }
  const protoHeader = req.headers['x-forwarded-proto'];
  const proto =
    (typeof protoHeader === 'string' ? protoHeader.split(',')[0] : req.protocol) || 'http';
  const host =
    (typeof req.headers['x-forwarded-host'] === 'string'
      ? req.headers['x-forwarded-host'].split(',')[0]
      : req.get('host')) || 'localhost:8001';
  return `${proto}://${host}`;
}

export function extractS3ObjectKey(url: string): string | null {
  const trimmed = url.trim();
  if (!trimmed) return null;

  try {
    const parsed = new URL(trimmed);
    const host = parsed.hostname.toLowerCase();
    if (!host.includes('amazonaws.com')) return null;

    const pathKey = decodeURIComponent(parsed.pathname.replace(/^\/+/, ''));
    if (host.startsWith(`${DEFAULT_BUCKET.toLowerCase()}.`)) {
      return pathKey || null;
    }
    if (pathKey.startsWith(`${DEFAULT_BUCKET}/`)) {
      return pathKey.slice(DEFAULT_BUCKET.length + 1) || null;
    }
    return pathKey || null;
  } catch {
    return null;
  }
}

/**
 * Turn private S3 URLs into same-origin /api/uploads/... so the app can load images via backend proxy.
 */
export function resolveClientMediaUrl(
  raw: string | undefined | null,
  req: Request,
): string {
  const url = String(raw || '').trim();
  if (!url) return '';

  const origin = getClientMediaOrigin(req);

  if (url.startsWith('/api/uploads/')) {
    return `${origin}${url}`;
  }
  if (url.startsWith('/uploads/')) {
    return `${origin}/api${url}`;
  }

  const s3Key = extractS3ObjectKey(url);
  if (s3Key) {
    return `${origin}/api/uploads/${s3Key.split('/').map(encodeURIComponent).join('/')}`;
  }

  return url;
}

/** Rewrite product / catalog image fields for mobile (private S3 → /api/uploads proxy). */
export function mapProductMediaForClient(product: any, req: Request): any {
  if (!product || typeof product !== 'object') return product;

  const out = { ...product };

  if (out.image_url) {
    out.image_url = resolveClientMediaUrl(out.image_url, req);
  }
  if (Array.isArray(out.images)) {
    out.images = out.images
      .map((u: string) => resolveClientMediaUrl(u, req))
      .filter((u: string) => Boolean(u));
  }
  if (Array.isArray(out.variants)) {
    out.variants = out.variants.map((v: any) => mapProductMediaForClient(v, req));
  }

  return out;
}

export function mapProductsMediaForClient(products: any[], req: Request): any[] {
  if (!Array.isArray(products)) return [];
  return products.map((p) => mapProductMediaForClient(p, req));
}

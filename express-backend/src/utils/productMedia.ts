/**
 * Utility for parsing and formatting product media (multiple images, SVGs, and video URLs)
 * with 100% backward compatibility and zero database migration friction.
 */

export interface ProductMediaPayload {
  image_url?: string | null;
  images?: string[] | null;
  video_url?: string | null;
}

export function parseProductMedia(product: any): {
  primary_image_url: string;
  images: string[];
  video_url: string | null;
  clean_description: string;
} {
  const images: string[] = [];
  let video_url: string | null = null;
  let clean_description = String(product?.description || '');

  // 1. Check direct video_url
  if (product?.video_url && typeof product.video_url === 'string') {
    video_url = product.video_url.trim();
  }

  // 2. Check embedded media JSON in description
  if (product?.description && typeof product.description === 'string') {
    const match = product.description.match(/<!--media:(\{.*?\})-->/);
    if (match) {
      try {
        const meta = JSON.parse(match[1]);
        if (Array.isArray(meta.images)) {
          meta.images.forEach((img: string) => {
            if (img && typeof img === 'string' && !images.includes(img.trim())) {
              images.push(img.trim());
            }
          });
        }
        if (meta.video_url && !video_url) {
          video_url = String(meta.video_url).trim();
        }
      } catch (_err) {}
      clean_description = clean_description.replace(/<!--media:\{.*?\}-->/g, '').trim();
    }
  }

  // 3. Check direct images array
  if (Array.isArray(product?.images)) {
    product.images.forEach((img: any) => {
      if (typeof img === 'string' && img.trim() && !images.includes(img.trim())) {
        images.push(img.trim());
      }
    });
  }

  // 4. Check image_url (comma-separated, JSON array, or single URL)
  if (product?.image_url && typeof product.image_url === 'string') {
    const raw = product.image_url.trim();
    if (raw.startsWith('[') && raw.endsWith(']')) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          parsed.forEach((img: any) => {
            if (typeof img === 'string' && img.trim() && !images.includes(img.trim())) {
              images.push(img.trim());
            }
          });
        }
      } catch (_err) {}
    } else {
      const parts = raw.split(',').map((s: string) => s.trim()).filter((s: string) => Boolean(s));
      parts.forEach((p: string) => {
        if (!images.includes(p)) {
          images.push(p);
        }
      });
    }
  }

  const primary_image_url = images.length > 0 ? images[0] : (product?.image_url || '');

  return {
    primary_image_url,
    images: images.length > 0 ? images : (primary_image_url ? [primary_image_url] : []),
    video_url,
    clean_description,
  };
}

export function formatProductDescriptionWithMedia(
  rawDescription: string | null | undefined,
  images?: string[] | null,
  video_url?: string | null,
): string {
  let cleanDesc = String(rawDescription || '').replace(/<!--media:\{.*?\}-->/g, '').trim();
  const meta: any = {};
  if (Array.isArray(images) && images.length > 0) {
    meta.images = images.map((i) => String(i).trim()).filter(Boolean);
  }
  if (video_url && typeof video_url === 'string' && video_url.trim()) {
    meta.video_url = video_url.trim();
  }

  if (Object.keys(meta).length > 0) {
    cleanDesc = cleanDesc ? `${cleanDesc}\n<!--media:${JSON.stringify(meta)}-->` : `<!--media:${JSON.stringify(meta)}-->`;
  }
  return cleanDesc;
}

export function enrichProductWithMedia<T extends Record<string, any>>(product: T): T & {
  image_url: string;
  images: string[];
  video_url: string | null;
  description: string;
} {
  if (!product) return product as any;
  const media = parseProductMedia(product);
  return {
    ...product,
    image_url: media.primary_image_url,
    images: media.images,
    video_url: media.video_url,
    description: media.clean_description,
  };
}

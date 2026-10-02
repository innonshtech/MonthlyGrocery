import fs from 'fs';
import path from 'path';
import { Request, Response, NextFunction } from 'express';
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';

const UPLOADS_ROOT = path.join(__dirname, '../../uploads');
const BUCKET = process.env.AWS_S3_BUCKET_NAME || 'monthly-grocery-media-prod';

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'ap-south-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

function contentTypeFromKey(key: string): string {
  const ext = path.extname(key).toLowerCase();
  if (ext === '.png') return 'image/png';
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
  if (ext === '.webp') return 'image/webp';
  if (ext === '.svg') return 'image/svg+xml';
  if (ext === '.pdf') return 'application/pdf';
  return 'application/octet-stream';
}

/**
 * Serves files from disk when present; otherwise streams from private S3 (category/product PNGs).
 */
export async function uploadsProxyMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const rel = decodeURIComponent(String(req.path || '').replace(/^\/+/, ''));
  if (!rel || rel.includes('..')) {
    next();
    return;
  }

  const localPath = path.join(UPLOADS_ROOT, rel);
  if (fs.existsSync(localPath) && fs.statSync(localPath).isFile()) {
    next();
    return;
  }

  try {
    const cmd = new GetObjectCommand({ Bucket: BUCKET, Key: rel });
    const s3Res = await s3Client.send(cmd);
    res.setHeader('Content-Type', s3Res.ContentType || contentTypeFromKey(rel));
    res.setHeader('Cache-Control', 'public, max-age=86400');
    if (s3Res.ContentLength) {
      res.setHeader('Content-Length', String(s3Res.ContentLength));
    }
    const body = s3Res.Body as NodeJS.ReadableStream | undefined;
    if (!body) {
      res.status(404).end();
      return;
    }
    body.pipe(res);
  } catch {
    next();
  }
}

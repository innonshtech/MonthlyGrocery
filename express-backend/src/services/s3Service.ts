import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import path from 'path';
import fs from 'fs';

const AWS_REGION = process.env.AWS_REGION || 'ap-south-1';
const AWS_S3_BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || 'monthly-grocery-media-prod';

const s3Client = new S3Client({
  region: AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

/**
 * Upload a raw buffer to AWS S3 bucket and cache locally on disk.
 * Returns public S3 URL.
 */
export async function uploadBufferToS3(
  buffer: Buffer,
  key: string,
  contentType: string = 'image/png'
): Promise<string> {
  const cleanKey = key.replace(/^\/+/, '');
  
  // 1. Save to local disk cache as backup
  try {
    const localPath = path.join(__dirname, '../../uploads', cleanKey);
    const dir = path.dirname(localPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(localPath, buffer);
  } catch (fsErr) {
    console.warn('[S3 Service] Local disk cache write warning:', fsErr);
  }

  // 2. Upload to AWS S3 with public-read ACL
  try {
    const putCommand = new PutObjectCommand({
      Bucket: AWS_S3_BUCKET_NAME,
      Key: cleanKey,
      Body: buffer,
      ContentType: contentType,
      ACL: 'public-read',
    });
    await s3Client.send(putCommand);
    console.log(`[S3 Service] Successfully uploaded ${cleanKey} with public-read to S3 bucket ${AWS_S3_BUCKET_NAME}`);
  } catch (s3Err: any) {
    console.warn(`[S3 Service] S3 upload with ACL failed (${s3Err.message}), retrying without ACL...`);
    try {
      const fallbackPut = new PutObjectCommand({
        Bucket: AWS_S3_BUCKET_NAME,
        Key: cleanKey,
        Body: buffer,
        ContentType: contentType,
      });
      await s3Client.send(fallbackPut);
      console.log(`[S3 Service] Successfully uploaded ${cleanKey} to S3 bucket ${AWS_S3_BUCKET_NAME}`);
    } catch (fallbackErr: any) {
      console.error(`[S3 Service] S3 fallback upload error for ${cleanKey}:`, fallbackErr.message);
    }
  }

  // 3. Return direct AWS S3 Public URL
  return `https://${AWS_S3_BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com/${cleanKey}`;
}

/**
 * Upload a single multer file to AWS S3 under a specific folder (e.g., 'categories', 'products').
 */
export async function uploadMulterFileToS3(
  file: Express.Multer.File,
  folder: string = 'categories'
): Promise<string> {
  const fileExt = file.originalname.split('.').pop()?.toLowerCase() || 'png';
  const cleanExt = fileExt === 'jpeg' ? 'jpg' : fileExt;
  const fileName = `${folder}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${cleanExt}`;
  const s3Key = `${folder}/${fileName}`;

  let contentType = file.mimetype || 'image/png';
  if (cleanExt === 'png') contentType = 'image/png';
  else if (cleanExt === 'jpg') contentType = 'image/jpeg';
  else if (cleanExt === 'webp') contentType = 'image/webp';
  else if (cleanExt === 'svg') contentType = 'image/svg+xml';

  return uploadBufferToS3(file.buffer, s3Key, contentType);
}

/**
 * Upload multiple multer files to AWS S3 in parallel.
 */
export async function uploadMultipleMulterFilesToS3(
  files: Express.Multer.File[],
  folder: string = 'products'
): Promise<string[]> {
  const uploadPromises = files.map((file) => uploadMulterFileToS3(file, folder));
  return Promise.all(uploadPromises);
}

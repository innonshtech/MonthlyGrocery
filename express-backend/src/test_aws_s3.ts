import { S3Client, ListObjectsV2Command, PutObjectCommand } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const s3 = new S3Client({
  region: process.env.AWS_REGION || 'ap-south-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

async function testS3() {
  const bucket = process.env.AWS_S3_BUCKET_NAME;
  console.log(`Testing S3 connection to bucket: ${bucket}...`);
  try {
    const putCmd = new PutObjectCommand({
      Bucket: bucket,
      Key: 'health-check.txt',
      Body: 'Monthly Grocery AWS S3 Health Check - OK',
      ContentType: 'text/plain',
    });
    await s3.send(putCmd);
    console.log("Successfully wrote test file to S3!");

    const listCmd = new ListObjectsV2Command({
      Bucket: bucket,
      MaxKeys: 5,
    });
    const res = await s3.send(listCmd);
    console.log(`Successfully listed bucket! Object count: ${res.KeyCount}`);
    console.log("S3 CONNECTIVITY & PERMISSIONS VERIFIED 100%!");
  } catch (err: any) {
    console.error("S3 Test Failed:", err.message);
    process.exit(1);
  }
}

testS3();

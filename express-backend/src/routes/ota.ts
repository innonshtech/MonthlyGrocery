import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import multer from 'multer';

const router = express.Router();

const OTA_STORAGE_DIR = path.join(__dirname, '../../ota_storage/android');
const MANIFEST_PATH = path.join(OTA_STORAGE_DIR, 'manifest.json');
const BUNDLE_PATH = path.join(OTA_STORAGE_DIR, 'index.android.bundle');

// Ensure directory exists
if (!fs.existsSync(OTA_STORAGE_DIR)) {
  fs.mkdirSync(OTA_STORAGE_DIR, { recursive: true });
}

// Helper to read manifest
function getManifest(): {
  latestVersion: string;
  publishedAt: string;
  changelog: string;
  bundleUrl: string;
  fileSizeBytes: number;
} | null {
  if (!fs.existsSync(MANIFEST_PATH) || !fs.existsSync(BUNDLE_PATH)) {
    return null;
  }
  try {
    const raw = fs.readFileSync(MANIFEST_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

// Multer storage for uploaded bundle
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, OTA_STORAGE_DIR);
  },
  filename: (_req, _file, cb) => {
    cb(null, 'staging.bundle');
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 30 * 1024 * 1024 }, // 30 MB max
});

/**
 * 1. Check for updates
 * GET /api/ota/check?platform=android&currentVersion=v1.0.0
 */
router.get('/check', (req: Request, res: Response) => {
  const { currentVersion, platform = 'android' } = req.query;

  if (platform !== 'android') {
    return res.json({
      success: true,
      updateAvailable: false,
      message: 'OTA is currently configured for Android',
    });
  }

  const manifest = getManifest();
  if (!manifest) {
    return res.json({
      success: true,
      updateAvailable: false,
      message: 'No OTA bundle published yet',
    });
  }

  const isUpToDate = currentVersion && String(currentVersion).trim() === manifest.latestVersion;

  return res.json({
    success: true,
    updateAvailable: !isUpToDate,
    latestVersion: manifest.latestVersion,
    bundleUrl: `/api/ota/bundle/latest`,
    changelog: manifest.changelog || 'UI and bug improvements',
    publishedAt: manifest.publishedAt,
    fileSizeBytes: manifest.fileSizeBytes,
  });
});

/**
 * 2. Download the latest bundle
 * GET /api/ota/bundle/latest
 */
router.get('/bundle/latest', (_req: Request, res: Response) => {
  if (!fs.existsSync(BUNDLE_PATH)) {
    return res.status(404).json({ error: 'No bundle available' });
  }

  res.setHeader('Content-Type', 'application/javascript');
  res.setHeader('Content-Disposition', 'attachment; filename="index.android.bundle"');
  return res.sendFile(BUNDLE_PATH);
});

/**
 * 3. Publish a new OTA bundle
 * POST /api/ota/publish
 * Header: x-ota-key: <OTA_DEPLOY_KEY>
 * Form-data: bundle (file), version (string), changelog (optional string)
 */
router.post('/publish', upload.single('bundle'), (req: Request, res: Response) => {
  const otaKey = req.headers['x-ota-key'];
  const expectedKey = process.env.OTA_DEPLOY_KEY || 'monthly-grocery-ota-secret-key';

  if (!otaKey || otaKey !== expectedKey) {
    // Delete staging if uploaded unauthorized
    const stagingPath = path.join(OTA_STORAGE_DIR, 'staging.bundle');
    if (fs.existsSync(stagingPath)) fs.unlinkSync(stagingPath);
    return res.status(401).json({ error: 'Unauthorized: Invalid OTA deploy key' });
  }

  const stagingPath = path.join(OTA_STORAGE_DIR, 'staging.bundle');
  if (!fs.existsSync(stagingPath)) {
    return res.status(400).json({ error: 'No bundle file uploaded' });
  }

  const version = req.body.version || `v${Date.now()}`;
  const changelog = req.body.changelog || 'Instant UI update';

  try {
    // Atomically move staging to bundle path
    if (fs.existsSync(BUNDLE_PATH)) fs.unlinkSync(BUNDLE_PATH);
    fs.renameSync(stagingPath, BUNDLE_PATH);

    const stats = fs.statSync(BUNDLE_PATH);
    const manifest = {
      latestVersion: String(version),
      publishedAt: new Date().toISOString(),
      changelog: String(changelog),
      bundleUrl: `/api/ota/bundle/latest`,
      fileSizeBytes: stats.size,
    };

    fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2), 'utf-8');

    console.log(`[OTA] Published new bundle version ${version} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);

    return res.json({
      success: true,
      message: 'OTA bundle published successfully',
      manifest,
    });
  } catch (err: any) {
    console.error('[OTA] Publish error:', err);
    return res.status(500).json({ error: 'Failed to save OTA bundle', details: err.message });
  }
});

export default router;

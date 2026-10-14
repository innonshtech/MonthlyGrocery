import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import multer from 'multer';

const router = express.Router();

type PlatformType = 'android' | 'ios';

const OTA_BASE_DIR = path.join(__dirname, '../../ota_storage');
const STAGING_DIR = path.join(OTA_BASE_DIR, 'staging');

// Ensure base directories exist
for (const sub of ['android', 'ios', 'staging']) {
  const p = path.join(OTA_BASE_DIR, sub);
  if (!fs.existsSync(p)) {
    fs.mkdirSync(p, { recursive: true });
  }
}

function normalizePlatform(p?: any): PlatformType {
  const clean = String(p || 'android').toLowerCase().trim();
  return clean === 'ios' ? 'ios' : 'android';
}

function getPlatformConfig(platform: PlatformType) {
  const dir = path.join(OTA_BASE_DIR, platform);
  const bundleFilename = platform === 'ios' ? 'main.jsbundle' : 'index.android.bundle';
  return {
    platform,
    dir,
    manifestPath: path.join(dir, 'manifest.json'),
    bundlePath: path.join(dir, bundleFilename),
    bundleFilename,
  };
}

// Helper to read manifest for a specific platform
function getManifest(platform: PlatformType): {
  platform: PlatformType;
  latestVersion: string;
  publishedAt: string;
  changelog: string;
  bundleUrl: string;
  fileSizeBytes: number;
} | null {
  const { manifestPath, bundlePath } = getPlatformConfig(platform);
  if (!fs.existsSync(manifestPath) || !fs.existsSync(bundlePath)) {
    return null;
  }
  try {
    const raw = fs.readFileSync(manifestPath, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

// Multer storage for uploaded bundle staged in staging directory
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, STAGING_DIR);
  },
  filename: (_req, _file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `staging-${unique}.bundle`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 40 * 1024 * 1024 }, // 40 MB max
});

/**
 * 1. Check for updates
 * GET /api/ota/check?platform=android&currentVersion=v1.0.0
 * GET /api/ota/check?platform=ios&currentVersion=v1.0.0
 */
router.get('/check', (req: Request, res: Response) => {
  const platform = normalizePlatform(req.query.platform);
  const currentVersion = req.query.currentVersion;

  const manifest = getManifest(platform);
  if (!manifest) {
    return res.json({
      success: true,
      updateAvailable: false,
      message: `No OTA bundle published yet for ${platform}`,
    });
  }

  const isUpToDate = currentVersion && String(currentVersion).trim() === manifest.latestVersion;

  return res.json({
    success: true,
    platform,
    updateAvailable: !isUpToDate,
    latestVersion: manifest.latestVersion,
    bundleUrl: `/api/ota/bundle/latest?platform=${platform}`,
    changelog: manifest.changelog || 'UI and bug improvements',
    publishedAt: manifest.publishedAt,
    fileSizeBytes: manifest.fileSizeBytes,
  });
});

/**
 * 2. Download the latest bundle
 * GET /api/ota/bundle/latest?platform=android
 * GET /api/ota/bundle/latest?platform=ios
 */
router.get('/bundle/latest', (req: Request, res: Response) => {
  const platform = normalizePlatform(req.query.platform);
  const { bundlePath, bundleFilename } = getPlatformConfig(platform);

  if (!fs.existsSync(bundlePath)) {
    return res.status(404).json({ error: `No bundle available for ${platform}` });
  }

  res.setHeader('Content-Type', 'application/javascript');
  res.setHeader('Content-Disposition', `attachment; filename="${bundleFilename}"`);
  return res.sendFile(bundlePath);
});

/**
 * 3. Status check for all platforms
 * GET /api/ota/status
 */
router.get('/status', (_req: Request, res: Response) => {
  const android = getManifest('android');
  const ios = getManifest('ios');
  return res.json({
    success: true,
    android: android || { active: false, message: 'No bundle published' },
    ios: ios || { active: false, message: 'No bundle published' },
  });
});

/**
 * 4. Publish a new OTA bundle
 * POST /api/ota/publish
 * Header: x-ota-key: <OTA_DEPLOY_KEY>
 * Form-data: bundle (file), platform ('android' | 'ios'), version (string), changelog (optional string)
 */
router.post('/publish', upload.single('bundle'), (req: Request, res: Response) => {
  const otaKey = req.headers['x-ota-key'];
  const expectedKey = process.env.OTA_DEPLOY_KEY || 'monthly-grocery-ota-secret-key';

  const stagingFile = req.file?.path;

  if (!otaKey || otaKey !== expectedKey) {
    if (stagingFile && fs.existsSync(stagingFile)) {
      try { fs.unlinkSync(stagingFile); } catch {}
    }
    return res.status(401).json({ error: 'Unauthorized: Invalid OTA deploy key' });
  }

  if (!stagingFile || !fs.existsSync(stagingFile)) {
    return res.status(400).json({ error: 'No bundle file uploaded' });
  }

  const platform = normalizePlatform(req.body.platform || req.query.platform);
  const { dir, manifestPath, bundlePath } = getPlatformConfig(platform);

  const version = req.body.version || `v${Date.now()}`;
  const changelog = req.body.changelog || 'Instant UI update';

  try {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Atomically replace existing bundle
    if (fs.existsSync(bundlePath)) {
      fs.unlinkSync(bundlePath);
    }
    fs.renameSync(stagingFile, bundlePath);

    const stats = fs.statSync(bundlePath);
    const manifest = {
      platform,
      latestVersion: String(version),
      publishedAt: new Date().toISOString(),
      changelog: String(changelog),
      bundleUrl: `/api/ota/bundle/latest?platform=${platform}`,
      fileSizeBytes: stats.size,
    };

    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8');

    console.log(`[OTA] Published new ${platform} bundle version ${version} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);

    return res.json({
      success: true,
      message: `OTA bundle for ${platform} published successfully`,
      manifest,
    });
  } catch (err: any) {
    if (stagingFile && fs.existsSync(stagingFile)) {
      try { fs.unlinkSync(stagingFile); } catch {}
    }
    console.error(`[OTA] Publish error (${platform}):`, err);
    return res.status(500).json({ error: 'Failed to save OTA bundle', details: err.message });
  }
});

export default router;

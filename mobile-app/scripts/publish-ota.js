#!/usr/bin/env node

/**
 * MonthlyGrocery Self-Hosted Multi-Platform OTA Publish Script
 * 
 * Supports both Android and iOS Over-The-Air JavaScript bundle deployments.
 * 
 * Usage:
 *   node scripts/publish-ota.js [version] [changelog] [--platform=android|ios|all] [--server=url]
 * 
 * Examples:
 *   npm run ota:publish                                      # Bundles & publishes for BOTH Android and iOS
 *   npm run ota:publish -- --platform=android                # Android only
 *   npm run ota:publish -- --platform=ios                    # iOS only
 *   npm run ota:publish -- 1.0.3 "Fresh grocery icons"       # Custom version & changelog
 *   npm run ota:publish -- --server=local                    # Test against local backend (http://localhost:8001)
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const BUILD_DIR = path.join(ROOT_DIR, 'build-ota');

// Parse CLI args
const args = process.argv.slice(2);
let serverUrl = 'http://13.233.159.143'; // Default to live AWS EC2
let version = `v${Date.now()}`;
let changelog = 'UI improvements and bug fixes';
let targetPlatform = 'android'; // Safe default: deploys Android (use --platform=all or --platform=ios for iOS)

for (const arg of args) {
  if (arg.startsWith('--server=')) {
    const val = arg.split('=')[1];
    serverUrl = val === 'local' ? 'http://localhost:8001' : val;
  } else if (arg.startsWith('--platform=')) {
    const val = arg.split('=')[1].toLowerCase().trim();
    if (['android', 'ios', 'all'].includes(val)) {
      targetPlatform = val;
    } else {
      console.warn(`⚠️ Unknown platform "${val}". Defaulting to "all".`);
    }
  } else if (!arg.startsWith('--')) {
    if (version.startsWith('v') && version.length > 10) {
      version = arg;
    } else {
      changelog = arg;
    }
  }
}

console.log('\n========================================');
console.log('🚀 MonthlyGrocery OTA Publisher (Multi-Platform)');
console.log('========================================');
console.log(`📦 Version    : ${version}`);
console.log(`📝 Changelog  : ${changelog}`);
console.log(`📱 Platform   : ${targetPlatform.toUpperCase()}`);
console.log(`🌐 Target EC2 : ${serverUrl}\n`);

// Ensure build directory exists
if (!fs.existsSync(BUILD_DIR)) {
  fs.mkdirSync(BUILD_DIR, { recursive: true });
}

/**
 * Bundle and upload a single platform
 */
async function publishPlatform(platform) {
  const isIos = platform === 'ios';
  const bundleFilename = isIos ? 'main.jsbundle' : 'index.android.bundle';
  const bundleFilePath = path.join(BUILD_DIR, bundleFilename);

  console.log(`\n----------------------------------------`);
  console.log(`⚙️  [${platform.toUpperCase()}] Compiling React Native JavaScript bundle...`);
  console.log(`----------------------------------------`);

  try {
    execSync(
      `npx @react-native-community/cli bundle --platform ${platform} --dev false --entry-file index.js --bundle-output "${bundleFilePath}" --assets-dest "${BUILD_DIR}"`,
      {
        cwd: ROOT_DIR,
        stdio: 'inherit',
      }
    );
  } catch (err) {
    console.error(`\n❌ [${platform.toUpperCase()}] Bundle compilation failed!`);
    throw err;
  }

  if (!fs.existsSync(bundleFilePath)) {
    throw new Error(`[${platform.toUpperCase()}] Bundle file ${bundleFilename} was not generated!`);
  }

  const stats = fs.statSync(bundleFilePath);
  const sizeMb = (stats.size / 1024 / 1024).toFixed(2);
  console.log(`✅ [${platform.toUpperCase()}] Bundle created successfully! Size: ${sizeMb} MB`);

  console.log(`⏳ [${platform.toUpperCase()}] Uploading to backend (${serverUrl}/api/ota/publish)...`);

  const fileBuffer = fs.readFileSync(bundleFilePath);
  const blob = new Blob([fileBuffer], { type: 'application/javascript' });

  const formData = new FormData();
  formData.append('bundle', blob, bundleFilename);
  formData.append('platform', platform);
  formData.append('version', version);
  formData.append('changelog', changelog);

  const targetEndpoint = `${serverUrl.replace(/\/+$/, '')}/api/ota/publish`;

  const res = await fetch(targetEndpoint, {
    method: 'POST',
    headers: {
      'x-ota-key': process.env.OTA_DEPLOY_KEY || 'monthly-grocery-ota-secret-key',
    },
    body: formData,
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || `HTTP ${res.status}: ${JSON.stringify(data)}`);
  }

  console.log(`🎉 [${platform.toUpperCase()}] Published successfully!`);
  console.log(`   Latest Version : ${data.manifest?.latestVersion || version}`);
  console.log(`   Bundle URL     : ${data.manifest?.bundleUrl}`);
  return data;
}

async function run() {
  const platformsToRun = targetPlatform === 'all' ? ['android', 'ios'] : [targetPlatform];

  try {
    for (const p of platformsToRun) {
      await publishPlatform(p);
    }

    console.log('\n========================================');
    console.log('✨ ALL OTA UPDATES PUBLISHED SUCCESSFULLY!');
    console.log('========================================');
    console.log(`🏷️ Version  : ${version}`);
    console.log(`📱 Platforms: ${platformsToRun.map(p => p.toUpperCase()).join(' & ')}`);
    console.log(`⚡ Impact   : Both Android & iOS customers will automatically download this update when launching the app!\n`);
  } catch (err) {
    console.error('\n❌ OTA Publish failed:', err.message);
    console.log('\n👉 Tip: Verify that backend is running and /api/ota/publish is accessible.');
    console.log(`   You can test locally using: npm run ota:publish -- --server=local\n`);
    process.exit(1);
  }
}

run();


#!/usr/bin/env node

/**
 * MonthlyGrocery Self-Hosted OTA Publish Script
 * 
 * Usage:
 *   node scripts/publish-ota.js [version] [changelog] [--server=url]
 * 
 * Examples:
 *   npm run ota:publish
 *   npm run ota:publish -- 1.0.2 "Lively emerald green header UI"
 *   npm run ota:publish -- --server=http://localhost:8001
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const BUILD_DIR = path.join(ROOT_DIR, 'build-ota');
const BUNDLE_FILE = path.join(BUILD_DIR, 'index.android.bundle');

// Parse CLI args
const args = process.argv.slice(2);
let serverUrl = 'http://13.233.159.143'; // Default to live AWS EC2
let version = `v${Date.now()}`;
let changelog = 'UI improvements and bug fixes';

for (const arg of args) {
  if (arg.startsWith('--server=')) {
    const val = arg.split('=')[1];
    serverUrl = val === 'local' ? 'http://localhost:8001' : val;
  } else if (!arg.startsWith('--')) {
    if (version.startsWith('v') && version.length > 10) {
      version = arg;
    } else {
      changelog = arg;
    }
  }
}

console.log('\n========================================');
console.log('🚀 MonthlyGrocery Self-Hosted OTA Publisher');
console.log('========================================');
console.log(`📦 Version    : ${version}`);
console.log(`📝 Changelog  : ${changelog}`);
console.log(`🌐 Target EC2 : ${serverUrl}\n`);

// 1. Ensure build directory exists
if (!fs.existsSync(BUILD_DIR)) {
  fs.mkdirSync(BUILD_DIR, { recursive: true });
}

// 2. Generate React Native Production Bundle
console.log('⏳ Step 1/3: Compiling React Native JavaScript bundle...');
try {
  execSync(
    `npx @react-native-community/cli bundle --platform android --dev false --entry-file index.js --bundle-output "${BUNDLE_FILE}" --assets-dest "${BUILD_DIR}"`,
    {
      cwd: ROOT_DIR,
      stdio: 'inherit',
    }
  );
} catch (err) {
  console.error('\n❌ Bundle compilation failed! Check your React Native code for errors.');
  process.exit(1);
}

if (!fs.existsSync(BUNDLE_FILE)) {
  console.error('\n❌ Bundle output file was not created!');
  process.exit(1);
}

const stats = fs.statSync(BUNDLE_FILE);
const sizeMb = (stats.size / 1024 / 1024).toFixed(2);
console.log(`\n✅ Bundle successfully created! File size: ${sizeMb} MB`);

// 3. Upload to EC2 Backend
console.log(`\n⏳ Step 2/3: Uploading bundle to AWS EC2 (${serverUrl}/api/ota/publish)...`);

async function uploadBundle() {
  const fileBuffer = fs.readFileSync(BUNDLE_FILE);
  const blob = new Blob([fileBuffer], { type: 'application/javascript' });

  const formData = new FormData();
  formData.append('bundle', blob, 'index.android.bundle');
  formData.append('version', version);
  formData.append('changelog', changelog);

  const targetEndpoint = `${serverUrl.replace(/\/+$/, '')}/api/ota/publish`;

  try {
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

    console.log('\n========================================');
    console.log('🎉 OTA UPDATE PUBLISHED SUCCESSFULLY!');
    console.log('========================================');
    console.log(`🏷️ Active Version : ${data.manifest?.latestVersion || version}`);
    console.log(`📅 Published At   : ${data.manifest?.publishedAt || new Date().toISOString()}`);
    console.log(`⚡ Impact: Every customer who opens the app will now automatically receive this UI update without re-installing!\n`);
  } catch (err) {
    console.error(`\n❌ Failed to upload bundle to ${targetEndpoint}:`, err.message);
    console.log('\n👉 Tip: Make sure your EC2 backend is running and /api/ota/publish is accessible.');
    console.log(`   You can also publish locally using: npm run ota:publish -- --server=local\n`);
    process.exit(1);
  }
}

uploadBundle();

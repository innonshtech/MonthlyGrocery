import { NativeModules, Platform } from 'react-native';
import { API_BASE } from '../config/api';

const { OtaUpdateModule } = NativeModules;

export interface OtaCheckResult {
  success: boolean;
  updateAvailable: boolean;
  latestVersion?: string;
  bundleUrl?: string;
  changelog?: string;
  message?: string;
}

export interface CurrentBundleInfo {
  version: string;
  isOtaActive: boolean;
  bundleSizeBytes: number;
}

/**
 * Get current bundle version on device
 */
export async function getCurrentBundleInfo(): Promise<CurrentBundleInfo> {
  if (Platform.OS !== 'android' || !OtaUpdateModule) {
    return { version: 'base-apk', isOtaActive: false, bundleSizeBytes: 0 };
  }
  try {
    return await OtaUpdateModule.getCurrentBundleInfo();
  } catch {
    return { version: 'base-apk', isOtaActive: false, bundleSizeBytes: 0 };
  }
}

/**
 * Check backend for new OTA releases and automatically install if available
 */
export async function checkAndApplyOtaUpdate(options: {
  autoRestart?: boolean;
  onUpdateDownloaded?: (version: string, changelog?: string) => void;
} = {}): Promise<{ updated: boolean; version?: string; changelog?: string }> {
  if (Platform.OS !== 'android' || !OtaUpdateModule) {
    return { updated: false };
  }

  try {
    const current = await getCurrentBundleInfo();
    const checkUrl = `${API_BASE}/ota/check?platform=android&currentVersion=${encodeURIComponent(current.version)}`;

    const res = await fetch(checkUrl);
    if (!res.ok) return { updated: false };

    const data: OtaCheckResult = await res.json();
    if (!data.success || !data.updateAvailable || !data.bundleUrl || !data.latestVersion) {
      return { updated: false };
    }

    // Resolve full bundle URL if relative
    let fullBundleUrl = data.bundleUrl;
    if (fullBundleUrl.startsWith('/')) {
      const baseUrl = API_BASE.replace(/\/api\/?$/, '');
      fullBundleUrl = `${baseUrl}${data.bundleUrl}`;
    }

    console.log(`[OTA] New bundle found: ${data.latestVersion}. Downloading in background...`);

    // Download and stage native bundle
    await OtaUpdateModule.downloadAndInstallBundle(fullBundleUrl, data.latestVersion);

    console.log(`[OTA] Bundle ${data.latestVersion} successfully installed.`);

    if (options.onUpdateDownloaded) {
      options.onUpdateDownloaded(data.latestVersion, data.changelog);
    }

    if (options.autoRestart) {
      OtaUpdateModule.restartApp();
    }

    return {
      updated: true,
      version: data.latestVersion,
      changelog: data.changelog,
    };
  } catch (err) {
    console.warn('[OTA] Check/Download failed:', err);
    return { updated: false };
  }
}

/**
 * Restart the app to apply the newly downloaded bundle immediately
 */
export function restartAppForOta() {
  if (Platform.OS === 'android' && OtaUpdateModule?.restartApp) {
    OtaUpdateModule.restartApp();
  }
}

// Base directory tracking layout for Android External Storage mapping
export const HYBRID_APP_ROOT = 'Documents/MyHybridMobile';
export const WEB_ASSET_DIR = `${HYBRID_APP_ROOT}/www`;

/**
 * Resolves the correct base applications scan directory path.
 * @param {boolean} isNative - Whether the system is running inside the Android container.
 * @returns {string} The path string to look for child apps.
 */
export function getAppsDirectory(isNative) {
  // If native Android, scan from the external SD/sandbox layout. 
  // If standard browser, look straight into your local workspace folder structure.
  return isNative ? `${WEB_ASSET_DIR}/src/apps` : 'src/apps';
}


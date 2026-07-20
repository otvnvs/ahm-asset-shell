import { androidFs } from './backends/androidFs.js';
import { webFs } from './backends/webFs.js';

let memoizedEnvironment = null;

export async function detectEnvironment() {
  if (memoizedEnvironment !== null) return memoizedEnvironment;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1200);
    // Web: resolves to static api/environment.json
    // AHM: Java server responds to /api/environment.json the same as /api/environment
    const response = await fetch('/api/environment.json', { method: 'GET', signal: controller.signal });
    clearTimeout(timeoutId);
    if (response.ok) {
      const data = await response.json();
      if (data.environment === 'android-hybrid') {
        memoizedEnvironment = 'android-hybrid';
        return memoizedEnvironment;
      }
    }
  } catch (e) {
    // timeout or network error — fall through to web default
  }

  memoizedEnvironment = 'web';
  return memoizedEnvironment;
}

export async function isAndroidHybrid() {
  return (await detectEnvironment()) === 'android-hybrid';
}

// Deprecated: use isAndroidHybrid() instead
export async function isNativeAndroidEnvironment() {
  return isAndroidHybrid();
}

async function getBackend() {
  return (await isAndroidHybrid()) ? androidFs : webFs;
}

export const fsApi = {
  async getWebRoot()                            { return (await getBackend()).getWebRoot(); },
  async listDirectory(path = '')                { return (await getBackend()).listDirectory(path); },
  async readFile(path)                          { return (await getBackend()).readFile(path); },
  async writeFile(path, content)                { return (await getBackend()).writeFile(path, content); },
  async createDirectory(path)                   { return (await getBackend()).createDirectory(path); },
  async deleteItem(path)                        { return (await getBackend()).deleteItem(path); },
  async deletePath(path, recursive = true)      { return (await getBackend()).deletePath(path, recursive); },
  async zipArchive(sourcePath, targetZipPath)   { return (await getBackend()).zipArchive(sourcePath, targetZipPath); },
  async unzipArchive(zip, dir, strip = 0)       { return (await getBackend()).unzipArchive(zip, dir, strip); },
  async downloadFile(url, path)                 { return (await getBackend()).downloadFile(url, path); }
};

import { mockFileSystem } from './mock.js';

// PERFORMANCE OPTIMIZATION: Memoize context check state to prevent duplicate bridge pings
let memoizedIsNative = null;

// FIXED SYNTAX: Changed 'public async function' to 'export async function'
export async function isNativeAndroidEnvironment() {
  if (memoizedIsNative !== null) return memoizedIsNative;

  try {
    console.log('[Telemetry:FS] Auditing container environment targets...');
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1200);
    
    const response = await fetch('/api/app/device-status', { 
      method: 'GET', 
      signal: controller.signal 
    });
    
    clearTimeout(timeoutId);
    if (!response.ok) {
      memoizedIsNative = false;
      return false;
    }
    
    const data = await response.json();
    memoizedIsNative = data.status === 'active';
    console.log('[Telemetry:FS] Environment verification complete. Native Android =', memoizedIsNative);
    return memoizedIsNative;
  } catch (e) {
    memoizedIsNative = false;
    return false;
  }
}

export const fsApi = {
  async listDirectory(path = '') {
    const isNative = await isNativeAndroidEnvironment();
    if (!isNative) return mockFileSystem.list(path);

    console.log('[Telemetry:FS] listDirectory -> ' + path);
    const res = await fetch('/api/fs/list?path=' + encodeURIComponent(path), { method: 'GET' });
    if (!res.ok) throw new Error('API operation failed: ' + res.statusText);
    return res.json();
  },

  async readFile(path) {
    const isNative = await isNativeAndroidEnvironment();
    if (!isNative) return mockFileSystem.read(path);

    console.log('[Telemetry:FS] readFile -> ' + path);
    const res = await fetch('/api/fs/read?path=' + encodeURIComponent(path), { method: 'GET' });
    if (!res.ok) throw new Error('Failed to load file contents: ' + res.statusText);
    return res.text();
  },

//  async writeFile(path, content) {
//    const isNative = await isNativeAndroidEnvironment();
//    if (!isNative) return mockFileSystem.write(path, content);
//
//    console.log('[Telemetry:FS] writeFile -> ' + path + ' (' + content.length + ' bytes)');
//    const res = await fetch('/api/fs/write?path=' + encodeURIComponent(path), {
//      method: 'POST',
//      headers: { 'Content-Type': 'text/plain' },
//      body: content
//    });
//    if (!res.ok) throw new Error('API operation failed: ' + res.statusText);
//    return res.json();
//  },
	async writeFile(path, content) {
	  const isNative = await isNativeAndroidEnvironment();
	  if (!isNative) return mockFileSystem.write(path, content);

	  // Send content as a parameter string payload mapping
	  const targetUrl = '/api/fs/write?path=' + encodeURIComponent(path) + '&content=' + encodeURIComponent(content);
	  const res = await fetch(targetUrl, { method: 'POST' });
	  if (!res.ok) throw new Error('API operation failed: ' + res.statusText);
	  return res.json();
	},

  async createDirectory(path) {
    const isNative = await isNativeAndroidEnvironment();
    if (!isNative) return mockFileSystem.mkdir(path);

    console.log('[Telemetry:FS] createDirectory -> ' + path);
    const res = await fetch('/api/fs/mkdir?path=' + encodeURIComponent(path) + '&recursive=true', { method: 'POST' });
    if (!res.ok) throw new Error('API operation failed: ' + res.statusText);
    return res.json();
  },

  async deleteItem(path) {
    const isNative = await isNativeAndroidEnvironment();
    if (!isNative) return mockFileSystem.delete(path);

    console.log('[Telemetry:FS] deleteItem -> ' + path);
    const res = await fetch('/api/fs/delete?path=' + encodeURIComponent(path) + '&recursive=true', { method: 'DELETE' });
    if (!res.ok) throw new Error('API operation failed: ' + res.statusText);
    return res.json();
  }
};


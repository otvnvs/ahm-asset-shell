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
    /**
     * Queries the native JVM server layer to determine the active web root path modifier string.
     */
    async getWebRoot() {
        const isNative = await isNativeAndroidEnvironment();
        if (!isNative) {
            return { relativeModifier: '', absolutePath: 'src/apps' };
        }
        
        try {
            const response = await fetch('/api/fs/webroot', { method: 'GET' });
            if (!response.ok) throw new Error(`Server returned error status code: ${response.status}`);
            const data = await response.json();
            return data.web_root_path;
        } catch (err) {
            console.error("Failed to dynamically fetch web root context metrics:", err.message);
            throw(err);
        }
    },
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
  },

  async zipArchive(sourcePath, targetZipPath) {
	const targetUrl = '/api/arc/zip';
	const response = await fetch(targetUrl, {
	  method: 'POST',
	  headers: {
		'Content-Type': 'application/json',
		'Accept': 'application/json'
	  },
	  body: JSON.stringify({
		sourcePath: sourcePath,
		targetZipPath: targetZipPath
	  })
	});

	if (!response.ok) {
	  const errData = await response.json().catch(() => ({ message: 'Compression runtime error' }));
	  throw new Error(errData.message || 'Native zip compression failure');
	}
	return await response.json();
  },

//  async unzipArchive(zipPath, targetDirectory) {
//	const targetUrl = '/api/arc/unzip';
//	const response = await fetch(targetUrl, {
//	  method: 'POST',
//	  headers: {
//		'Content-Type': 'application/json',
//		'Accept': 'application/json'
//	  },
//	  body: JSON.stringify({
//		zipPath: zipPath,
//		targetDirectory: targetDirectory
//	  })
//	});
//
//	if (!response.ok) {
//	  const errData = await response.json().catch(() => ({ message: 'Extraction runtime error' }));
//	  throw new Error(errData.message || 'Native zip extraction failure');
//	}
//	return await response.json();
//  },
  async unzipArchive(zipPath, targetDirectory, stripComponents = 0) {
    const targetUrl = '/api/arc/unzip';
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        zipPath: zipPath,
        targetDirectory: targetDirectory,
        stripComponents: stripComponents
      })
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({ message: 'Extraction runtime error' }));
      throw new Error(errData.message || 'Native zip extraction failure');
    }
    return await response.json();
  },


  /**
   * Invokes the native Java path deletion mechanism.
   */
  async deletePath(path, recursive = true) {
	const response = await fetch(`/api/fs/delete?path=${encodeURIComponent(path)}&recursive=${recursive}`, {
	  method: 'DELETE'
	});
	if (!response.ok) throw new Error('Failed to clean path target file resource');
	return await response.json();
  },
  async downloadFile(url, path) {
	// 1. Build the safe string address using explicit URL encoding components
	const targetUrl = `/api/net/download` +
	  `?url=${encodeURIComponent(url)}` +
	  `&path=${encodeURIComponent(path)}`;

	// 2. Execute as a GET request so no body stream data is lost
	const response = await fetch(targetUrl, {
	  method: 'GET',
	  headers: {
		'Accept': 'application/json'
	  }
	});

	if (!response.ok) {
	  const err = await response.json().catch(() => ({ message: 'Native download pipeline dropped' }));
	  throw new Error(err.message || `Download endpoint returned status: ${response.status}`);
	}
	return await response.json();
  }
};


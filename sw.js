// Service worker for OPFS-backed applet persistence.
// Intercepts fetch requests for /src/apps/* paths and serves them from OPFS
// if the file was written there by opfsInstaller.js.
// All other requests pass through to the network unchanged.
// No shell asset caching — that belongs to the PWA/offline phase (deferred).
//
// VITE DEV MODE: .vue files and any request with a query string (e.g. ?t= for
// HMR) pass through to Vite. Non-SFC applets (vue-dist/dom-module/iframe) no
// longer rely on SW interception — appLoader.js reads OPFS directly and creates
// blob URLs. The SW remains for SFC applet source fetches and any direct
// /src/apps/* GET requests that don't carry a query string.

const OPFS_APP_PREFIX = '/src/apps/';

let isViteDev = false;

self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'VITE_DEV') {
    isViteDev = true;
  }
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  if (event.request.method !== 'GET' || !url.pathname.startsWith(OPFS_APP_PREFIX)) {
    return;
  }

  // In Vite dev mode, .vue files must pass through to Vite for server-side
  // transformation.
  if (isViteDev && url.pathname.endsWith('.vue')) {
    return;
  }

  // Any query string (e.g. ?import, ?t= HMR) means Vite/network should handle
  // the request — OPFS files are always requested without a query string.
  if (url.search) {
    return;
  }

  event.respondWith(tryOpfs(url.pathname, event.request));
});

async function tryOpfs(pathname, request) {
  try {
    // OPFS path: strip leading slash → "src/apps/recorder/index.vue"
    const opfsPath = pathname.replace(/^\//, '');
    const content = await opfsRead(opfsPath);
    if (content !== null) {
      // Determine a basic Content-Type from the extension.
      const ext = opfsPath.split('.').pop();
      const mime = ext === 'vue' ? 'text/plain'
                 : ext === 'js'  ? 'application/javascript'
                 : ext === 'mjs' ? 'application/javascript'
                 : ext === 'css' ? 'text/css'
                 : ext === 'json' ? 'application/json'
                 : ext === 'html' ? 'text/html'
                 : 'text/plain';
      return new Response(content, {
        status: 200,
        headers: { 'Content-Type': mime }
      });
    }
  } catch (_) { /* OPFS unavailable or error — fall through */ }

  // Not in OPFS — fetch from network.
  return fetch(request);
}

// Minimal inline OPFS reader (service workers cannot import ES modules in all browsers).
async function opfsRead(path) {
  if (!('storage' in self && 'getDirectory' in self.storage)) return null;
  try {
    const parts = path.split('/');
    let dir = await self.storage.getDirectory();
    for (const seg of parts.slice(0, -1)) {
      dir = await dir.getDirectoryHandle(seg);
    }
    const fh = await dir.getFileHandle(parts[parts.length - 1]);
    const file = await fh.getFile();
    return await file.text();
  } catch (_) {
    return null;
  }
}

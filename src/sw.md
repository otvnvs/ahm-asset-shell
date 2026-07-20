# `sw.js` — Service Worker for OPFS-Backed Applet Persistence

## Purpose

The service worker intercepts `fetch()` requests for paths under `/src/apps/` and serves them from the Origin Private File System (OPFS) when the file was previously written there by `opfsInstaller.js`. All other requests pass through to the network unchanged.

This makes OPFS-persisted applets load transparently on page reload without changing the SFC loader, `getFile`, or any applet source code.

## Scope and Registration

Registered from `src/main.sfc.js` and `src/main.js` with:

```js
await navigator.serviceWorker.register('/sw.js', { scope: '/' });
await navigator.serviceWorker.ready;
```

- Scope is `/` so it can intercept any `/src/apps/{id}/...` request.
- Registration is skipped entirely in AHM mode (`isAndroidHybrid()` returns `true`) because AHM has its own Java server handling `/api/fs/*` and other endpoints.
- Boot code waits for `navigator.serviceWorker.ready` before mounting the app, so the SW is active before any applet fetch can occur.

## Lifecycle

```js
self.addEventListener('install',  (event) => event.waitUntil(self.skipWaiting()));
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));
```

- `skipWaiting()` — activate the new SW immediately.
- `clients.claim()` — take control of existing pages so the first load is intercepted.

## Fetch Interception Strategy

```js
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  if (event.request.method !== 'GET' || !url.pathname.startsWith('/src/apps/')) {
    return;
  }

  // In Vite dev mode, .vue files pass through to Vite for server-side transformation.
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
```

A request is intercepted only when **all** of these are true:

1. Method is `GET`.
2. Pathname starts with `/src/apps/`.
3. Not a `.vue` file in Vite dev mode (those need Vite's server-side transformation).
4. URL has **no query string** (skips Vite `?import`, `?t=...`, and HMR requests).

### Vite Dev Mode

In Vite dev mode, `.vue` files and any request carrying a query string pass through to Vite. Non-SFC applets (`vue-dist`, `dom-module`, `iframe`) no longer rely on SW interception — `appLoader.js` reads OPFS/memory content directly via `combinedFsRead` and creates blob URLs for dynamic imports. The SW still serves compiled `.js`/`.css`/`.html` files from OPFS for direct `/src/apps/*` GET requests without query strings.

The Vite entry (`src/main.js`) tells the SW that it is in Vite dev mode:

```js
navigator.serviceWorker.controller?.postMessage({ type: 'VITE_DEV' });
```

This causes the SW to pass `.vue` files through to Vite for server-side transformation while still serving compiled assets from OPFS.

### OPFS Lookup

For intercepted requests, the SW:

1. Strips the leading slash from the pathname → `src/apps/{id}/...`.
2. Reads that path from OPFS using an inline `opfsRead()` implementation.
3. If found, returns a `Response` with a basic `Content-Type` derived from the file extension.
4. If not found, falls through to `fetch(request)` so disk-based applets, vendor files, and 404s behave normally.

## Why OPFS Is Read Inline

Service workers cannot reliably import ES modules in all browsers. The SW therefore contains its own minimal `opfsRead()` helper that duplicates the logic in `src/lib/opfs.js`.

## What Is Not Cached

This SW intentionally does **not** cache shell assets (`index.html`, `lib/vue/...`, etc.). That belongs to the deferred PWA/offline phase.

## Security Notes

- Only paths under `/src/apps/` are intercepted.
- Only `GET` requests are intercepted.
- OPFS is origin-scoped; the SW can only read files written by this origin.

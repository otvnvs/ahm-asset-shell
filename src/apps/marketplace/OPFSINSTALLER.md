# `opfsInstaller.js` — OPFS-Backed Applet Install for Browser Environments

## Purpose

Installs and uninstalls applets in browser environments (SFC browser and Vite browser) by downloading source files from `raw.githubusercontent.com` and writing them to the Origin Private File System (OPFS). Once installed, the service worker (`sw.js`) serves those files on subsequent page loads, so applets survive reloads.

AHM never uses this module; AHM continues to use the disk-based `installer.js` / `uninstaller.js` path.

## Why This Exists

The previous in-memory installer (`memoryInstaller.js`) stored applet files in a `Map` on `window`. That worked for the current session but was lost on page reload. OPFS provides a persistent, origin-scoped, hierarchical filesystem that maps directly to the existing path-based model.

## Install Flow

```
opfsInstall(app, shellCompiler, router, onProgress)
  │
  ├─ fetchFileList(app)        → read app.json["files"] from raw CDN; fall back to GitHub tree API
  ├─ downloadRawFile() ×N      → fetch every listed file in parallel
  ├─ opfsWrite() ×N            → write files under src/apps/{id}/
  ├─ readManifest()            → load src/apps/apps-installed.json
  ├─ writeManifest()           → append descriptor for the new app
  └─ router.addRoute(...)      → register route so the app opens immediately
```

## Uninstall Flow

```
opfsUninstall(app, router)
  │
  ├─ opfsDelete(src/apps/{id}) → remove the applet directory tree
  ├─ readManifest()            → load installed-apps manifest
  ├─ writeManifest()           → remove the app descriptor
  └─ router.removeRoute(...)   → unregister route
```

## Exports

| Export | Description |
|--------|-------------|
| `opfsInstall(app, shellCompiler, router, onProgress)` | Downloads files, writes to OPFS, updates manifest, registers route. |
| `opfsUninstall(app, router)` | Deletes OPFS files, updates manifest, removes route. |
| `getOpfsInstalledApps()` | Returns the array of installed app descriptors from `src/apps/apps-installed.json`. |
| `isOpfsInstalled(id)` | Returns `true` if the app id is present in the manifest. |
| `isOpfsAvailable()` | Returns the OPFS capability guard result. |

## File List Source

`fetchFileList(app)` tries the static manifest first to avoid GitHub API rate limits:

```js
// 1. Read app.json from raw.githubusercontent.com
const manifestRaw = await downloadRawFile(app.fullName, app.branch, 'app.json');
const manifest = JSON.parse(manifestRaw);
if (Array.isArray(manifest.files) && manifest.files.length > 0) {
  return manifest.files;
}

// 2. Fall back to the GitHub tree API
const tree = await fetchRepositoryTree(app.fullName, app.branch);
return tree.filter(entry => entry.type === 'blob').map(entry => entry.path);
```

Each applet repo must therefore include an `app.json` with a `files` array, e.g.:

```json
{
  "name": "Modem",
  "svgContent": "<path d='M3 10v4 ...'/>",
  "files": [
    "index.vue",
    "lib/modem/index.js",
    "components/ModemControlPanel.vue"
  ]
}
```

## Installed Apps Manifest

Path in OPFS: `src/apps/apps-installed.json`

This manifest stores one descriptor per installed app:

```js
{
  id: 'modem',
  name: 'Modem',
  route: '/apps/modem',
  svgContent: '<path .../>',
  entryFile: './src/apps/modem/index.vue'
}
```

`scanForApps()` in `src/lib/shell/index.js` reads this manifest directly so icons reappear immediately on boot, before the marketplace applet has run.

## Fallback to In-Memory Install

If OPFS is unavailable (`isOpfsAvailable()` returns `false`), `marketplace/index.vue` falls back to `memoryInstaller.js`. That path is session-only but keeps the app functional on older WebViews.

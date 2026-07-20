# `memoryInstaller.js` — In-Memory Applet Install for Web/Vite Mode

## Purpose

Provides install and uninstall for web and Vite dev mode where no writable filesystem is available. All applet files are downloaded from GitHub into a `Map` and served directly to `vue3-sfc-loader` at runtime. Nothing is written to disk — the applet lives for the current browser session only.

## Why This Exists

`installer.js` uses `fsApi.downloadFile`, `fsApi.unzipArchive`, and `fsApi.createDirectory`, which all throw `NotSupportedInWebMode` in the web backend. An alternative path is needed that bypasses the filesystem entirely.

## How It Works

```
memoryInstall(app, shellCompiler, router, onProgress)
  │
  ├─ fetchFileList()         → read app.json["files"] from raw CDN; fall back to GitHub tree API
  ├─ downloadRawFile() ×N    → fetch all blobs in parallel
  ├─ memoryFs.set(path, content) for each file
  ├─ router.addRoute(...)    → register route via shellCompiler
  └─ memoryAppMeta.set(id, descriptor) → so launcher grid shows the icon
```

## Exports

| Export | Description |
|--------|-------------|
| `memoryInstall(app, shellCompiler, router, onProgress)` | Downloads all files, registers route, stores metadata. |
| `memoryUninstall(app, router)` | Clears all files and metadata, removes route. |
| `memoryFsRead(path)` | Returns cached file content string or `null`. Passed to `createSfcOptions` as the memory hook. |
| `isMemoryInstalled(id)` | Returns `true` if the app is currently in memory. |
| `getMemoryInstalledApps()` | Returns array of app descriptors `{id, name, route, svgContent, entryFile}`. `scanForApps()` merges these so icons appear in the launcher grid. |

## Launcher Integration

`marketplace/index.vue` tries OPFS first and falls back to `memoryInstaller.js` when OPFS is unavailable. Once installed in memory, `scanForApps()` in `shell/index.js` merges `getMemoryInstalledApps()` so icons appear on the home screen within the next poll cycle (≤3.5s) or immediately on the HMR `applet-list-changed` event in Vite dev mode.

## Implementation Notes

### Two-Worlds Problem (SFC Browser Mode)

In SFC/runtime mode, `sfcBootstrap.js` and `sfcLoaderOptions.js` are loaded as native ES modules by the browser. But `marketplace/index.vue` and its imports (including `memoryInstaller.js`) are evaluated by `vue3-sfc-loader` in an isolated JS context — a separate module instance with its own variable scope.

If `memoryFs` were a plain module-level `Map`, writes from the marketplace's instance would be invisible to reads from the native instance used by `sfcLoaderOptions.getFile`. The applet files would be downloaded but the SFC loader would never find them, falling through to a network fetch that 404s.

**Fix:** `memoryFs` and `memoryAppMeta` are stored on `window.__memoryFs` and `window.__memoryAppMeta`. Both module worlds share the same `window` object, so writes from the marketplace are immediately visible to the SFC loader. `memoryFsRead` always reads from `window.__memoryFs` directly for the same reason.

- **Session only** — all installed files are lost on page reload. The router catch-all in `router/index.js` redirects to `/home` if a reloaded URL points to a gone in-memory app.
- **OPFS fallback** — `marketplace/index.vue` uses `opfsInstaller.js` when OPFS is available; this module is only reached on browsers without OPFS support.
- **AHM unaffected** — `isHybrid` is checked in `marketplace/index.vue` before calling this module; AHM always uses the disk-based `installer.js` path.

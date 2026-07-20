# Project Analysis

## Overview

This project is an **Android hybrid mobile shell** built with Vue 3. It acts as a runtime launcher and container for decentralized single-file component (SFC) "applets" that can be installed, uninstalled, and executed dynamically.

The codebase supports three execution modes:

1. **Vite build/dev mode** — standard compiled SPA for development (`src/main.js`, `vite.config.js`). Entry: `index.vite.html`.
2. **Runtime SFC mode** — loads Vue and compiles `.vue` files directly in the browser using `vue3-sfc-loader`, enabling on-device applet installation without a rebuild. Entry: `index.html` / `index.sfc.html`.
3. **Android Hybrid Mobile (AHM)** — either of the above modes running inside the AHM wrapper, which provides `/api/fs/*`, `/api/arc/*`, `/api/net/download`, and `/api/environment` endpoints.

---

## Directory Structure

```
.
├── index.html              # Runtime SFC mode entry
├── index.sfc.html          # Alternate SFC entry (same content as index.html)
├── index.vite.html         # Vite dev entry
├── sw.js                   # Service worker: serves /src/apps/* from OPFS
├── api/
│   └── environment.json    # Static env marker for web mode: { "environment": "web" }
├── vite.config.js          # Build config: SPA fallback, rename, applet-watcher plugins
├── src/
│   ├── Main.vue            # Root layout, provides globalState
│   ├── main.js             # Vite bootstrap
│   ├── main.sfc.js         # Runtime SFC bootstrap
│   ├── sfcBootstrap.js     # vue3-sfc-loader setup and dynamic route registration
│   ├── router/index.js     # Hash router + registerDynamicApps() + catch-all guard
│   ├── views/home/         # App launcher grid (polls scanForApps every 3.5s)
│   ├── lib/
│   │   ├── env.js               # isViteDev() utility
│   │   ├── opfs.js              # Origin Private File System utility wrapper
│   │   ├── fsRead.js            # Shared combinedFsRead (OPFS first, memory fallback)
│   │   ├── appLoader.js         # Pluggable applet loader registry (sfc/vue-dist/dom-module/iframe)
│   │   ├── viteLoader.js        # Glob-first + sfc-loader fallback component loader
│   │   ├── sfcLoaderOptions.js  # Shared vue3-sfc-loader options factory
│   │   ├── shell/
│   │   │   ├── index.js    # scanForApps() + launcher integration
│   │   │   ├── state.js    # Reactive shellState
│   │   │   └── constants.js
│   │   └── fs/
│   │       ├── index.js         # detectEnvironment(), isAndroidHybrid(), fsApi router
│   │       ├── README.md
│   │       └── backends/
│   │           ├── androidFs.js # /api/fs/* fetch calls
│   │           └── webFs.js     # static fetch + apps.json
│   └── apps/
│       ├── apps.json            # Static manifest for web-mode listDirectory
│       ├── marketplace/
│       │   ├── index.vue        # GitHub app store applet
│       │   ├── api.js           # GitHub API fetch helpers
│       │   ├── installer.js     # AHM disk install (download + unzip via fsApi)
│       │   ├── uninstaller.js   # AHM disk uninstall (delete via fsApi)
│       │   ├── memoryInstaller.js # Web/Vite in-memory fallback (no OPFS)
│       │   ├── opfsInstaller.js   # Web/Vite OPFS install (persistent)
│       │   └── cache.js         # localStorage cache for marketplace index
│       └── about/               # Static info applet
├── lib/                    # Vendor builds (Vue, vue-router, vue3-sfc-loader)
└── scripts/                # Deployment and lifecycle shell helpers
```

---

## Execution Mode Differences

| Feature | Vite dev | SFC browser | AHM |
|---------|----------|-------------|-----|
| Applet discovery | `import.meta.glob` at startup | `scanForApps()` via webFs | `scanForApps()` via androidFs |
| Pre-existing applet loading | Vite lazy chunk | `loadModule()` | `loadModule()` |
| Runtime applet loading | `appLoader.js` dispatch (sfc / vue-dist / dom-module / iframe) | `appLoader.js` dispatch | `appLoader.js` dispatch |
| Marketplace install | OPFS (`opfsInstaller.js`) | OPFS (`opfsInstaller.js`) | Disk (`installer.js`) |
| Marketplace uninstall | OPFS (`opfsUninstall`) | OPFS (`opfsUninstall`) | Disk (`uninstaller.js`) |
| Installed app persists reload | Yes (OPFS + service worker) | Yes (OPFS + service worker) | Yes |
| HMR applet-list event | Yes (`applet-watcher` plugin) | No | No |

---

## Core Components

### Bootstrapping

- **`src/main.js`** — Vite bootstrap. Uses `import.meta.glob` to discover pre-existing applets, merges OPFS-installed applets via `getOpfsInstalledApps()`, and registers dynamic routes for both **before** `app.mount()`. Creates a `viteLoader` (glob-first, sfc-loader fallback) wired into `appLoader.js`. Calls `router.isReady().then(replace)` to force re-navigation so hard-refreshed deep URLs resolve correctly. Provides `shellCompiler` (the app-aware loader) via `app.provide`.
- **`src/main.sfc.js`** — Runtime SFC bootstrap. Applies stylesheet, calls `bootstrapSfcApp()`, provides `shellCompiler` (the app-aware loader).
- **`src/sfcBootstrap.js`** — Configures `vue3-sfc-loader` via `createSfcOptions`, creates the app-aware loader from `appLoader.js`, scans apps, registers dynamic routes. Uses `combinedFsRead` from `fsRead.js` as the file reader for the SFC loader (OPFS first, in-memory fallback). Sets `window.__ahmVue__` and `window.__ahmVueRouter__` for compiled applet Vue singleton sharing.

### Routing

`src/router/index.js` — hash-history router. `registerDynamicApps(appsList, componentLoader)` adds applet routes and a catch-all `/:pathMatch(.*)*` redirect to `/home` as the last route, so unknown routes (e.g. a reloaded in-memory app) land on the launcher rather than a blank page.

### Environment Detection & Filesystem

`src/lib/fs/index.js`:
- `detectEnvironment()` — fetches `/api/environment.json` with 1200ms timeout; memoized.
- `isAndroidHybrid()` — convenience async boolean.
- `fsApi` — delegates all operations to `androidFs` or `webFs` via `getBackend()`.

### Component Loading

- **`src/lib/appLoader.js`** — Pluggable loader registry. `createAppLoader(context)` returns `loadAppComponent(app)`, which dispatches on `app.type` (`sfc`, `vue-dist`, `dom-module`, `iframe`). Built-in factories cover the current applet technologies; new types can be registered at runtime via `registerAppLoader(type, factory)`. Non-SFC loaders read files from OPFS/memory via `combinedFsRead` and create blob URLs for dynamic imports, bypassing the service worker entirely. Blob URLs are revoked after import or on component unmount to prevent leaks.
- **`src/lib/sfcLoaderOptions.js`** — `createSfcOptions(moduleCache, fsRead?)` factory. Shared by both SFC boot and Vite fallback. Checks `fsRead` (typically `combinedFsRead` from `fsRead.js`) before fetching over the network.
- **`src/lib/viteLoader.js`** — `createViteLoader(globMap)`. Serves known paths from the Vite glob map; falls back to `vue3-sfc-loader` for runtime-installed paths. Initialises sfc-loader options lazily with `combinedFsRead` wired in.
- **`src/lib/fsRead.js`** — Shared `combinedFsRead(key)` helper. Reads from OPFS first (persisted across reloads), then falls back to the in-memory store. Used by `sfcBootstrap.js`, `viteLoader.js`, and `appLoader.js` so the OPFS/memory lookup logic lives in one place.
- **`lib/vue-shim.js` & `lib/vue-router-shim.js`** — Window-backed shims that expose the shell's Vue and Vue Router singletons to dynamically imported compiled applets via the import map. This guarantees `vue-dist` applets share the same Vue instance as the shell.

### App Scanning

`src/lib/shell/index.js` — `scanForApps()` reads `src/apps/` via `fsApi`, parses each `app.json`, and merges OPFS-persisted apps from `getOpfsInstalledApps()`. It preserves `type`, `entry`, `files`, and `params` from each manifest so the correct loader is used after a reload.

### In-Memory Install (Fallback)

`src/apps/marketplace/memoryInstaller.js` — session-only fallback used when OPFS is unavailable. Downloads applet files into a `Map` keyed by virtual path. `marketplace/index.vue` tries OPFS first and silently falls back to this module on browsers without OPFS support.

### OPFS Install

`src/apps/marketplace/opfsInstaller.js` — primary install path for browser environments. Downloads files listed in `app.json["files"]` from `raw.githubusercontent.com`, writes them to OPFS under `src/apps/{id}/`, and updates `src/apps/apps-installed.json`. On subsequent loads the service worker serves these files, so installed applets survive page reloads.

### Service Worker

`sw.js` — registered at `/` scope from both `src/main.js` and `src/main.sfc.js` (but skipped in AHM mode). It intercepts `GET` requests for `/src/apps/*` URLs with no query string, reads the matching path from OPFS, and returns a `Response` with the correct MIME type. If the file is not in OPFS, the request falls through to the network. In Vite dev mode, `.vue` files pass through to Vite (which transforms them server-side) and any request with a query string (e.g. `?import`, `?t=` for HMR) also passes through. Non-SFC applets (`vue-dist`, `dom-module`, `iframe`) no longer rely on SW fetch interception — `appLoader.js` reads OPFS/memory content directly via `combinedFsRead` and creates blob URLs for dynamic imports. The SW still serves SFC applet source fetches and any direct `/src/apps/*` GET requests without query strings.

### Marketplace Applet

`src/apps/marketplace/index.vue`:
- Scan button and install/uninstall available in all modes.
- **AHM**: uses `installer.js` / `uninstaller.js` (disk-based via `fsApi`). Button label: "Install".
- **Web/Vite**: uses `opfsInstaller.js`, falling back to `memoryInstaller.js` if OPFS is unavailable. Button label: "Install" / "Load".
- A **"Use live GitHub API"** checkbox lets the user bypass the static `marketplace.json` and scan GitHub search directly (subject to rate limits).
- All `app.json` manifests fetched in parallel during scan.

### Launcher UI

`src/views/home/index.vue` — renders the app grid, polls `scanForApps` every 3.5s only in AHM mode (gated behind `isHybrid`), listens for `applet-list-changed` HMR event in Vite dev mode for immediate grid refresh. Browser mode refreshes on mount and after install/HMR. Long-press uninstall gated to AHM only.

### Global State

`src/lib/shell/state.js` — reactive `shellState` with readonly state, mutation actions, computed getters, and runtime compiler factory.

---

## Completed Missions

### 1. Dual-Environment Support (Steps 1–12) ✓
The shell now runs in all three modes. Environment detected via `/api/environment.json`. `fsApi` routes between `androidFs` and `webFs` backends. Marketplace install/scan gated appropriately per environment.

### 2. Vite Dynamic Applet Loading (Steps A–G) ✓
Vite dev mode supports runtime applet loading via `viteLoader.js` (sfc-loader fallback), in-memory install via `memoryInstaller.js`, HMR launcher refresh via `applet-watcher` Vite plugin, and correct deep-URL handling on hard refresh via `router.isReady().then(replace)`.

A key implementation detail: `vue3-sfc-loader` evaluates `.vue` and `.js` files in an isolated JS context separate from the native ES module world. Module-level variables (Maps, callbacks) are not shared between the two worlds. All shared state (`memoryFs`, `memoryAppMeta`, `memoryAppsSource`) is therefore stored on `window` so both worlds always access the same data. The `combinedFsRead` helper in `src/lib/fsRead.js` consolidates the OPFS + memory reader logic shared by `sfcBootstrap.js`, `viteLoader.js`, and `appLoader.js`.

**Verified test matrix:**
| Scenario | Vite Browser | SFC Browser | SFC AHM |
|----------|-------------|-------------|---------|
| Pre-existing applets open | ✓ | ✓ | ✓ |
| Hard refresh on pre-existing app URL | ✓ | ✓ | ✓ |
| Install applet via marketplace | ✓ (OPFS) | ✓ (OPFS) | ✓ (disk) |
| Installed applet icon appears in launcher | ✓ | ✓ | ✓ |
| Open installed applet | ✓ | ✓ | ✓ |
| Hard refresh on installed applet URL | ✓ (OPFS) | ✓ (OPFS) | ✓ (persisted) |
| Uninstall applet | ✓ | ✓ | ✓ |
| OPFS unavailable fallback | ✓ (in-memory) | ✓ (in-memory) | N/A |

### 3. Generic Applet Loader Architecture ✓

The applet system now supports multiple runtime technologies side-by-side:

- **`sfc`** (default) — source `.vue` files compiled at runtime by `vue3-sfc-loader`.
- **`vue-dist`** — pre-built ES-module libraries from Vite/Vue projects, loaded via dynamic `import()`.
- **`dom-module`** — arbitrary JS projects that receive a prepared DOM container and optional params via `mount({ containerId, container, params })`.
- **`iframe`** — standalone HTML pages or incompatible stacks rendered full-screen in an `<iframe>`.

Key files:

- `src/lib/appLoader.js` — pluggable loader registry and built-in factories.
- `lib/vue-shim.js` / `lib/vue-router-shim.js` — share the shell's Vue/VueRouter singletons with compiled applets.
- `src/router/index.js` — `registerDynamicApps` now receives an app-aware `(app) => component` loader.
- `src/sfcBootstrap.js` and `src/main.js` — create the app-aware loader and pass it to the router and `shellCompiler` provide.
- `src/apps/marketplace/opfsInstaller.js`, `memoryInstaller.js`, and the AHM install branch in `index.vue` — build full app descriptors (including `type`, `entry`, `files`, `params`) and register routes with the loader.
- `src/lib/shell/index.js` — `scanForApps()` preserves manifest fields so the right loader is used after reload.

A new applet only needs an `app.json` with `"type": "vue-dist"` (or `"dom-module"` / `"iframe"`) and a `files` list; the shell picks the correct loader automatically. Future types can be added by calling `registerAppLoader(type, factory)` without touching the router or installers.

---

## Remaining / Deferred Work

- **SFC cache invalidation** — modified `.vue` files require `Ctrl+R` to update. Workaround in place via keyboard listener. Future: query-string cache busting or router navigation guard re-fetch.
- **Global reactive state machine sub-app integration** — `shellState` exists but sub-app integration is incomplete.
- **PWA / offline shell caching** — the service worker currently only intercepts `/src/apps/*`. Future: cache shell assets (`index.html`, vendor libs, `src/main.sfc.js`) for full offline use.

# Project Roadmap & Todo Tracking (`TODO.md`)

This document tracks upcoming architectural features, optimizations, and technical debt items for our dual-mode hybrid application framework.

---

## Cleanup Mission

Post-implementation cleanup now that the Generic Applet Loader Architecture is verified across Vite Browser, SFC Browser, and SFC AHM.

- [x] **Blob URL lifecycle in `src/lib/appLoader.js`** — blob URLs are revoked after import resolves (`vue-dist`, `dom-module`) or on component unmount (`iframe`). No object-URL leaks on repeated navigation.
- [x] **Dead parameter in `buildIframeSrc`** — removed the unused `entryUrl` argument.
- [x] **Service worker review** — simplified `sw.js` query string handling: any request with a query string passes through. Non-SFC applets now load via blob URLs created by `appLoader.js`, bypassing the SW entirely. SW documentation updated in `sw.md`.
- [x] **Consolidate duplicated `combinedFsRead` helpers** — extracted shared `src/lib/fsRead.js`; `sfcBootstrap.js` and `viteLoader.js` both import from it.
- [x] **Remove leftover debug/state globals** — `window.__sfc_trace__` and `window.sfcLoaderOptions` removed. Remaining intentionally public globals: `window.__ahmVue__`, `window.__ahmVueRouter__`, `window.__memoryFs`, `window.__memoryAppMeta`, `window.__memoryAppsSource`, `window.__opfsAppsSource`.
- [x] **Console noise** — removed `console.log` from `shell/keyboard.js`, `shell/state.js`, `shell/bus.js`. Remaining `console.warn` calls are legitimate error warnings (SW registration, OPFS read, manifest load failures).
- [x] **Documentation refresh** — updated `QODER.md`, `SFCBOOTSTRAP.md`, `SFCLOADEROPTIONS.md`, `VITELOADER.md`, `sw.md`, and `APPLOADER.md` to reflect the blob-URL/SW hybrid strategy, `fsRead.js` consolidation, and removal of `__sfc_trace__`.
- [x] **Sample repos** — no local `./samples/` directory exists; sample applets are GitHub repos listed in `marketplace.json` (30 repos under `otvnvs/ahm-applet-*`). Local cleanup: deleted empty `asdf.txt`, added `dist/` and `*.swp`/`*.swo` to `.gitignore`.
- [x] **Test matrix completion** — verified across Vite Browser, SFC Browser, and SFC AHM: SFC, `vue-dist`, `dom-module`, and `iframe` applets all install from GitHub, persist, and open after reload. See updated test matrices below.
- [x] **Dead code sweep** — removed commented-out code blocks in `src/lib/fs/constants.js`. No orphaned files from the loader refactor remain. Pre-existing orphaned files (`env.js`, `bus.js`, `devtools.js`, `mock.js`, `constants.js`) are part of planned future work or pre-existing utilities, not loader-refactor artifacts.
- [x] **Stop perpetual `app.json` polling in browser mode** — `src/views/home/index.vue` ran `scanForApps()` (which fetches `apps.json` + every `app.json`) every 3.5s even in browser mode. The interval is now gated behind `isHybrid` so it only runs on AHM; browser refreshes on mount and after install/HMR instead. Verified across Vite Browser, SFC Browser, and SFC AHM.

---

## High-Priority Backlog

### 1. Global Reactive State Machine & Sub-App Inter-communication
*   **Description:** Implement an isolated, reactive state synchronization layer that allows decentralized sub-applications (`./src/apps/*`) to securely read and mutate shared global parameters (e.g., user profiles, authentication tokens, global notifications) and dispatch events across app boundaries back to the core shell layout framework.
*   **Target Scope:** `./src/lib/state/`
*   **Dependencies:** Complete lifecycle evaluation of sub-app isolation scopes.

### 2. Live Runtime Component Cache-Invalidation (Scenario 2 & 3 Fixes)
*   **Description:** Address the issue where modified `.vue` component files or missing entry points (stuck on blank views) require a hard application reload to reflect edits made via Termux. Implement a strategy (such as query-string cache busting or programmatic cache purging in router navigation guards) to allow sub-apps to refresh dynamically on entrance without forcing a total container reset.
*   **Target Scope:** `./src/sfcBootstrap.js` and `./src/router/index.js`
*   **Dependencies:** None (Current workaround is pressing `Ctrl + R` via the development keyboard listener).

---

## Dual-Environment Support (Web + Android Hybrid Mobile)

Restore browser compatibility so the shell runs on both a regular static web server and the Android hybrid mobile wrapper. Steps are ordered by dependency.

### Step 1 — Add `/api/environment` endpoint on Android hybrid mobile
- [x] Add `GET /api/environment` to the Android hybrid mobile server returning `{ "environment": "android-hybrid" }`
- [x] Ensure AHM server also responds to `GET /api/environment.json` (client now fetches this path explicitly)

### Step 2 — Add static `api/environment.json` for web
- [x] Create `api/environment.json` at the project root containing `{ "environment": "web" }`

### Step 3 — Implement `detectEnvironment()` in `src/lib/fs/index.js`
- [x] Fetch `GET /api/environment` with a short timeout
- [x] Return `"android-hybrid"` if response contains that value
- [x] Return `"web"` as the default fallback if the request fails or returns `"web"`
- [x] Memoize the result to prevent repeated pings (same as current `memoizedIsNative`)
- [x] Export `isAndroidHybrid()` convenience helper
- [x] Keep `isNativeAndroidEnvironment()` as a deprecated alias so nothing breaks immediately

### Step 4 — Normalize `getWebRoot()` return value
- [x] Ensure `getWebRoot()` always returns a plain string in both environments
- [x] In web mode return `""` (empty string, paths are relative to server root)
- [x] In hybrid mode return the value from `/api/fs/webroot` as a string
- [x] Update all callers that interpolate `webRootModifier` to handle the empty string case cleanly

### Step 5 — Create web filesystem backend (`src/lib/fs/backends/webFs.js`)
- [x] Implement `listDirectory(path)` — fetch `src/apps/apps.json` and return its entries
- [x] Implement `readFile(path)` — `fetch()` the file relative to the server root
- [x] Implement `writeFile()`, `mkdir()`, `deleteItem()`, `deletePath()` — throw a clear `NotSupportedInWebMode` error
- [x] Implement `downloadFile()`, `zipArchive()`, `unzipArchive()` — throw `NotSupportedInWebMode`
- [x] Implement `getWebRoot()` — return `""`

### Step 6 — Create Android filesystem backend (`src/lib/fs/backends/androidFs.js`)
- [x] Move all existing `/api/fs/*`, `/api/arc/*`, `/api/net/download` fetch calls from `src/lib/fs/index.js` into this file
- [x] Export the same function signatures as the web backend

### Step 7 — Refactor `fsApi` in `src/lib/fs/index.js` to route between backends
- [x] Replace inline `isNativeAndroidEnvironment()` branch logic in every `fsApi` method
- [x] Use `detectEnvironment()` to select the correct backend module at runtime
- [x] Keep the public `fsApi` surface identical so no callers need to change

### Step 8 — Add `src/apps/apps.json` static manifest for web mode
- [x] Create `src/apps/apps.json` listing all pre-installed app folder names
- [x] Include `marketplace` and `about` entries matching their `app.json` metadata
- [x] Document that this file must be updated when adding/removing apps in web mode

### Step 9 — Disable marketplace install/uninstall in web mode
- [x] In `src/apps/marketplace/index.vue`, detect web mode via `isAndroidHybrid()`
- [x] Hide or disable the "Scan Remote Repositories" button in web mode
- [x] Show a short informational message explaining install is only available on the Android app
- [x] Hide the uninstall trash button for apps in web mode

### Step 10 — Update `scanForApps()` in `src/lib/shell/index.js`
- [x] Replace direct `fsApi.getWebRoot()` + `fsApi.listDirectory()` + `fsApi.readFile()` sequence
- [x] Ensure it works via the web backend (reads `apps.json` then fetches each `app.json`)
- [x] Ensure it continues to work via the Android backend unchanged

### Step 11 — Clean up dead code and unrelated issues (do alongside other steps)
- [x] Delete root-level `main.sfc.js` (broken import paths, not used by any entry point)
- [x] Remove large commented-out blocks in `src/sfcBootstrap.js`
- [x] Remove large commented-out blocks in `src/apps/marketplace/installer.js`
- [x] Remove large commented-out blocks in `src/lib/shell/index.js`
- [x] Remove large commented-out blocks in `src/lib/fs/index.js`
- [x] Remove debug `console.log` spam in `installer.js` (lines 75-82)
- [x] Replace `true || confirm(...)` in `home/index.vue:152` with real confirmation
- [x] Replace `const confirmEcosystemPurge = true` in `marketplace/index.vue:308` with real confirmation

### Step 12 — Test matrix verification
- [x] Web: `darkhttpd ./ --port 1234` → `localhost:1234/index.html` — launcher loads, static apps open
- [x] Web: `darkhttpd ./ --port 1234` → `localhost:1234/index.sfc.html` — same result
- [x] Web: `npm run serve:sfc` → same checks
- [x] Vite: `npm run start` → `localhost:5173/index.vite.html` — dev build works
- [x] Hybrid: Android wrapper — `/api/environment` detected, fs ops work, marketplace install works

---

## Vite Dynamic Applet Loading

Make Vite dev mode support dynamic applet loading the same way SFC/runtime mode does — applets installed at runtime via the marketplace can be opened without a Vite restart.

**Root problem:** `import.meta.glob` in `src/main.js` is evaluated at Vite startup. Paths not in the static glob map return `undefined` from `viteComponentLoader`, so newly installed applets cannot be opened.

**Solution:** Create a hybrid loader that uses the glob map for known applets and falls back to `vue3-sfc-loader` for runtime-installed ones.

### Step A — Add `isViteDev()` environment utility
- [x] Create `src/lib/env.js` exporting `isViteDev()` — returns `true` when `import.meta.env?.DEV === true`
- [x] Safe for use in SFC/runtime mode (where `import.meta` may be unavailable) via optional chaining

### Step B — Extract shared sfc-loader options
- [x] Create `src/lib/sfcLoaderOptions.js` exporting a `createSfcOptions(moduleCache)` factory
- [x] Move path resolution logic, `getFile`, `addStyle`, `handleModule` out of `sfcBootstrap.js` into this module
- [x] `sfcBootstrap.js` imports and uses `createSfcOptions` — behaviour unchanged for SFC mode

### Step C — Create `src/lib/viteLoader.js`
- [x] Export `createViteLoader(globMap)` returning a `loadComponent(filePath)` async function
- [x] Tries `globMap[filePath]?.()` first (covers pre-existing applets, zero overhead)
- [x] Falls back to `loadModule(filePath, sfcOptions)` from `vue3-sfc-loader` for unknown paths
- [x] Initialises sfc-loader options lazily on first fallback call

### Step D — Update `src/main.js` to use `createViteLoader`
- [x] Import `createViteLoader` from `src/lib/viteLoader.js`
- [x] Replace `viteComponentLoader` closure with `createViteLoader(appModules)`
- [x] Pass the new loader to `registerDynamicApps` and `app.provide('shellCompiler', ...)`

### Step E — Vite plugin: watch for new applet directories (optional HMR)
- [x] Add a Vite plugin in `vite.config.js` that watches `src/apps/*/index.vue`
- [x] On `add` event, send an HMR update so the launcher grid refreshes without a full reload
- [x] Gate behind `command === 'serve'` so it does not affect production builds

### Step F — Test matrix verification
- [x] Vite dev: pre-existing applets (`about`, `marketplace`) open correctly
- [x] Vite dev: pre-existing applets survive hard refresh at their URL
- [x] Vite dev: install a new applet via marketplace → applet appears in launcher
- [x] Vite dev: click newly installed applet → opens without Vite restart
- [x] Vite dev: hard refresh on runtime-installed app URL → redirects to home gracefully
- [x] SFC/web mode: unaffected — all existing behaviour preserved
- [x] AHM: unaffected — all existing behaviour preserved

### Step F+ — Additional work implemented beyond original plan
- [x] In-memory applet install for web/Vite mode (`src/apps/marketplace/memoryInstaller.js`)
- [x] `sfcLoaderOptions.js` accepts optional `memoryFsRead` hook — SFC loader checks memory before network
- [x] URL normalisation in `sfcLoaderOptions.getFile` — strips `http://host` prefix before memoryFs lookup
- [x] Two-worlds fix: `memoryFs`, `memoryAppMeta`, and `memoryAppsSource` stored on `window` so native ES module world and SFC-loader-evaluated world share the same state
- [x] `registerMemoryAppsSource()` in `shell/index.js` — `scanForApps()` merges in-memory apps so launcher grid updates after install
- [x] Parallel `fetchAppManifest` calls in `scanGitHubMarketplace` — all manifests fetched concurrently
- [x] Marketplace scan button and install/uninstall enabled in web/Vite mode (in-memory path)
- [x] Router catch-all `/:pathMatch(.*)*` redirects unknown routes to `/home`
- [x] `router.isReady().then(replace)` in `main.js` forces re-navigation after dynamic routes registered

### Step G — Documentation
- [x] Add `src/lib/VITELOADER.md` documenting the glob-first + sfc-loader fallback strategy
- [x] Add `src/lib/SFCLOADEROPTIONS.md` documenting the shared options module
- [x] Add `src/apps/marketplace/MEMORYINSTALLER.md` documenting in-memory install
- [x] Update `QODER.md` to reflect completed implementation


# Plan: Service Worker + OPFS Persistence

## Goal

Persist runtime-installed applets across page reloads in browser environments (SFC browser and Vite browser) using the Origin Private File System (OPFS) and a service worker. AHM is completely unaffected.

## Background

### Why OPFS + Service Worker

**OPFS** is a browser-native writable filesystem, sandboxed per origin, with no user permission prompt. Files written there survive page reloads and are accessible from both the main thread and service workers.

**Service worker** intercepts `fetch()` requests. When the SFC loader requests `http://localhost:1234/src/apps/recorder/index.vue`, the service worker checks OPFS for the file and responds from there transparently — without any changes to the SFC loader or `getFile`. This supersedes the current `window.__memoryFs` approach and works across page reloads.

### Architecture

```
Install flow (main thread):
  marketplace/index.vue → opfsInstaller.js → OPFS write → apps-installed.json updated

Fetch interception (service worker):
  SFC loader fetch(url) → sw.js intercepts
                              ├─ path in OPFS? → respond from OPFS
                              └─ not in OPFS?  → pass through to network

Launcher grid:
  scanForApps() → merges getOpfsInstalledApps() → disk apps + OPFS apps

Uninstall:
  opfsInstaller.js → delete OPFS files → update apps-installed.json → remove route
```

---

## Steps

### Step A — Create `src/lib/opfs.js`
- [x] OPFS utility module wrapping the File System Access API
- [x] `opfsWrite(path, content)` — write string to OPFS, creating parent directories as needed
- [x] `opfsRead(path)` — read file as string, return `null` if not found
- [x] `opfsDelete(path)` — delete file or directory tree
- [x] `opfsList(path)` — list entries in an OPFS directory
- [x] `opfsExists(path)` — boolean check
- [x] Capability guard: degrade gracefully if `'getDirectory' in navigator.storage === false`

### Step B — Create `src/sw.js` (service worker)
- [x] Intercept `fetch` events for paths under `/src/apps/`
- [x] Check OPFS for the requested file; respond from OPFS if found
- [x] Pass through to network if not found in OPFS
- [x] Standard `install` / `activate` lifecycle (skip-waiting, claim clients)
- [x] No shell asset caching yet — that is the PWA/offline phase (deferred)

### Step C — Register the service worker
- [x] In `src/main.sfc.js`: register SW, await `navigator.serviceWorker.ready` before boot
- [x] In `src/main.js`: register SW guarded by `isAndroidHybrid()` check
- [x] Skip registration entirely if `isAndroidHybrid()` returns true

### Step D — Create `src/apps/marketplace/opfsInstaller.js`
- [x] `opfsInstall(app, onProgress)` — download source files from raw.githubusercontent.com, write to OPFS under `src/apps/{id}/`
- [x] File list from `app.json["files"]` manifest (avoids GitHub API); falls back to tree API
- [x] Update `src/apps/apps-installed.json` in OPFS with the app descriptor after install
- [x] `opfsUninstall(app)` — delete `src/apps/{id}/` from OPFS, remove from `apps-installed.json`
- [x] `getOpfsInstalledApps()` — read `apps-installed.json` from OPFS, return array of app descriptors
- [x] `isOpfsInstalled(id)` — boolean convenience check

### Step E — Update `marketplace/index.vue`
- [x] Branch install: AHM → `installer.js`, browser → `opfsInstaller.js`
- [x] Branch uninstall: AHM → `uninstaller.js`, browser → `opfsInstaller.js`
- [x] Replace `memoryInstall`/`memoryUninstall`/`isMemoryInstalled`/`getMemoryInstalledApps` with OPFS equivalents
- [x] Replace `registerMemoryAppsSource` call with `registerOpfsAppsSource`

### Step F — Update `scanForApps()` in `shell/index.js`
- [x] Replace `window.__memoryAppsSource` with `window.__opfsAppsSource`
- [x] `registerOpfsAppsSource(fn)` stores on `window.__opfsAppsSource`
- [x] `scanForApps()` merges `window.__opfsAppsSource()` results (same pattern as memory source)
- [x] Remove `window.__memoryAppsSource` once OPFS path verified

### Step G — Update `memoryInstaller.js` as OPFS-unavailable fallback
- [x] Check `'getDirectory' in navigator.storage` before using OPFS
- [x] If OPFS unavailable, fall back to `memoryInstall` silently
- [x] `marketplace/index.vue` install branch: try OPFS first, fall back to memory
- [x] Both installers read the file list from `app.json["files"]` before falling back to the GitHub tree API

### Step H — Test matrix verification
- [x] SFC browser: install applet → OPFS written → page reload → SW intercepts → applet loads
- [x] SFC browser: uninstall → OPFS deleted → applet gone after reload
- [x] Vite browser: same as SFC browser
- [x] AHM: completely unaffected — disk install path unchanged, no SW registered
- [x] Browser without OPFS support: falls back to in-memory install

### Step I — Documentation
- [x] Add `src/lib/OPFS.md`
- [x] Add `src/sw.md` (service worker behaviour, scope, fetch interception strategy)
- [x] Add `src/apps/marketplace/OPFSINSTALLER.md`
- [x] Update `QODER.md`
- [x] Update `TODO.md`

### Marketplace Manifest Refresh
- [x] Expand `marketplace.json` from 10 to 30 applet repos using the current `topic:ahm-applet` GitHub search results.
- [x] Add pagination to `fetchMarketplaceRepositories()` so the GitHub fallback returns up to 300 repos instead of the default 30.
- [x] Add `scripts/refresh-marketplace.js` to regenerate `marketplace.json` from GitHub search.
- [x] Add a UI toggle to scan the live GitHub API directly, bypassing the static `marketplace.json`.

### Bug Fix — Vite Browser OPFS Reload
- [x] `src/main.js` now merges OPFS-installed apps with statically discovered apps and registers routes for both, so OPFS-persisted applets can be reopened after a page reload in Vite browser mode.

---

## What This Enables Later (PWA Phase — deferred)

Once the service worker controls the page, full PWA/offline support is an incremental addition:
- Cache shell assets (`index.html`, `lib/vue/...`, `lib/vue3-sfc-loader/...`, `src/main.sfc.js`) on SW `install`
- Add `manifest.json` for home screen installation prompt
- SW already intercepts all fetches — offline shell rendering requires only a cache-first strategy for shell assets

---

## Generic Applet Loader Architecture

Make the shell host multiple applet runtime technologies side-by-side.

### Step 1 — Share Vue / Vue Router singletons
- [x] Create `lib/vue-shim.js` and `lib/vue-router-shim.js` that read from `window.__ahmVue__` and `window.__ahmVueRouter__`
- [x] Set `window.__ahmVue__` and `window.__ahmVueRouter__` in `src/sfcBootstrap.js` and `src/main.js`
- [x] Add import maps for `vue` and `vue-router` to `index.html`, `index.sfc.html`, and `index.vite.html`

### Step 2 — Create pluggable loader registry
- [x] Create `src/lib/appLoader.js`
- [x] Export `registerAppLoader(type, factory)` and `createAppLoader(context)`
- [x] Implement built-in factories: `sfc`, `vue-dist`, `dom-module`, `iframe`
- [x] `vue-dist` dynamically imports the entry module and injects CSS from `app.files`
- [x] `dom-module` prepares a container `<div>` and calls `mount({ containerId, container, params })`
- [x] `iframe` renders the entry HTML full-screen in an `<iframe>`

### Step 3 — Wire loader into bootstraps and router
- [x] Update `src/router/index.js` so `registerDynamicApps` receives an app-aware `(app) => component` loader
- [x] Update `src/sfcBootstrap.js` to create the app-aware loader and pass it to the router and `shellCompiler` provide
- [x] Update `src/main.js` to create the app-aware loader and pass it to the router and `shellCompiler` provide

### Step 4 — Update installers and scanning
- [x] Update `opfsInstaller.js` to build a full descriptor (type/entry/files/params) and register routes with the loader
- [x] Update `memoryInstaller.js` to build a full descriptor and register routes with the loader
- [x] Update AHM install branch in `src/apps/marketplace/index.vue` to read `app.json` and register routes with the loader
- [x] Update `src/lib/shell/index.js` `scanForApps()` to preserve `type`, `entry`, `files`, and `params`

### Step 5 — Documentation and sample
- [x] Update `QODER.md`
- [x] Create `src/apps/marketplace/APPLOADER.md`
- [x] Create hello-world `vue-dist` sample repo instructions (`samples/ahm-applet-hello-lib/`)
- [x] SW fix: in Vite dev mode, SW now serves compiled JS/CSS/HTML from OPFS (only .vue files pass through to Vite), enabling vue-dist/dom-module/iframe applets installed at runtime to load in Vite browser mode
- [x] MIME type fix: SW serves .html files as text/html (was text/plain) for iframe applets
- [x] Test SFC, `vue-dist`, `dom-module`, `iframe`, and AHM paths — verified across Vite Browser, SFC Browser, and SFC AHM (2026-07-16)

---

## Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| SW intercepts fetch rather than patching `getFile` | Transparent — SFC loader and `sfcLoaderOptions.js` unchanged, works for all future applets automatically, removes `window.__memoryFs` hack |
| OPFS over IndexedDB | OPFS is a real hierarchical filesystem — maps directly to the existing path-based model with no schema design needed |
| `apps-installed.json` manifest in OPFS | Avoids enumerating the OPFS tree on every `scanForApps()` call; a single manifest read is fast and reliable |
| Memory fallback for browsers without OPFS | OPFS is supported in all modern browsers (Chrome 86+, Firefox 111+, Safari 15.2+) but graceful degradation keeps the app functional on older WebViews |
| SW not registered on AHM | AHM has its own Java server handling `/api/fs/*` — intercepting those requests would break filesystem operations |

---

## Static Marketplace Manifest + Raw CDN (current dev approach)

Avoid GitHub API rate limits entirely by using a local `marketplace.json` file for applet discovery and downloading source files from `raw.githubusercontent.com`.

**Why this approach:**
- `raw.githubusercontent.com` is CORS-enabled and has no API rate limit
- GitHub archive ZIP downloads are blocked by CORS in the browser
- GitHub API search/tree endpoints are rate-limited

### Step A — Create `marketplace.json`
- [x] Create `marketplace.json` at project root listing applet repos
- [x] Each entry: `{ id, name, owner, fullName, branch }`
- [x] Verify repos and branch names match actual GitHub repos

### Step B — Add per-applet `files.json` manifests
- [x] ~~Each applet repo should contain a `files.json` listing all source files to install~~ — superseded: installers now read the file list from `app.json["files"]` directly
- [x] ~~If `files.json` is missing, the installer falls back to the GitHub tree API~~ — superseded: `app.json["files"]` is the canonical file list; tree API remains as fallback

### Step C — Update `api.js`
- [x] `fetchMarketplaceRepositories()` tries `/marketplace.json` first, then falls back to GitHub search
- [x] Downloads use `raw.githubusercontent.com` (CORS-friendly)
- [x] Tree API kept only as fallback for file listing

### Step D — Update installers
- [x] `opfsInstaller.js` and `memoryInstaller.js` read file list from `files.json`
- [x] Download each file from raw CDN and write to OPFS/memory
- [x] Verify install works in SFC browser
- [x] Verify install works in Vite browser

---

## Marketplace Lazy-Load & Infinite Scroll

Replace bulk GitHub scanning with progressive, paginated loading and intelligent caching.

### Step A — Paginated API layer
- [x] Replace `fetchGitHubMarketplaceRepositories()` (3-page bulk fetch) with `fetchGitHubPage(page, perPage)` (single page at a time)
- [x] Add `sort=updated&order=desc` to surface recently updated applets first
- [x] Return `{ items, hasMore, totalCount }` for pagination control
- [x] Add `enrichReposWithManifests(repos, concurrency = 8)` — worker-pool pattern replacing `Promise.all` on 300 simultaneous manifest fetches
- [x] Add `normalizeStaticEntry(repo)` — normalize `marketplace.json` entries to match GitHub result shape
- [x] Export `fetchLocalMarketplaceManifest()` for independent static manifest loading

### Step B — Page-keyed cache layer
- [x] Restructure cache from flat array to page-keyed store: `{ pages: {1: [...], 2: [...]}, staticEntries: [...], currentPage, hasMore, totalCount, lastScan }`
- [x] New cache key `ahm-applet-marketplace-v2` (old cache ignored, behaves like fresh install)
- [x] Add `load()`, `save(state)`, `getPage(state, page)`, `setPage(state, page, entries)`, `setStaticEntries(state, entries)`, `setPaginationMeta(state, {hasMore, totalCount})`
- [x] Page granularity — each GitHub page cached independently; page 1 can be cached without page 2
- [x] Static entries stored separately for merge-on-load

### Step C — Infinite scroll UI
- [x] Add pagination refs: `currentPage`, `hasMorePages`, `loadingMore`, `totalCount`, `scrollSentinel`, `observer`, `cacheState`
- [x] Add `loadFromCache()` — render cached entries immediately on mount (no scan needed)
- [x] Add `setupInfiniteScroll()` — `IntersectionObserver` with 200px rootMargin triggers `loadNextPage()`
- [x] Add `loadNextPage()` — fetch next GitHub page, enrich manifests, cache, merge into list
- [x] Add `mergeEntries(newEntries, installedIds)` — deduplicate by ID, preserve local-only apps
- [x] Add `makeCard(entry, installedIds, extra)` — standardize card shape with install state
- [x] Add `getInstalledIds()` — check local folders + OPFS/memory installed apps
- [x] Add `buildLocalOnlyApps(localFolderNames, staticEntries)` — surface local-only apps in the grid
- [x] Rewrite `scanGitHubMarketplace()` — fetch static entries, reset state, fetch page 1, enrich, merge
- [x] Add scroll sentinel element in template with loading spinner and "All N applets loaded" message
- [x] Add loaded count indicator: "{{ loadedCount }} of {{ totalCount }} applets"
- [x] Cleanup observer on `onUnmounted()`

### Step D — Marketplace.json merge strategy
- [x] Always show static entries at top (from `marketplace.json`)
- [x] Fetch GitHub pages on demand (scan button / scroll)
- [x] Deduplicate by `id` — static entries win for display name/icon if both have the same repo
- [x] Local-only apps (installed from disk) always shown first
- [x] Order: local-only → static → GitHub page 1 → GitHub page 2 → ...

### Step E — Efficiency improvements
- [x] Paginated API calls — 1 API call per page instead of 3 upfront (saves 2/3 of GitHub search budget on typical visits)
- [x] Batched manifests (concurrency 8) — instead of 300 simultaneous fetches, process in batches of 8 (prevents browser connection pool exhaustion and CDN throttling)
- [x] Instant card rendering — cards appear immediately with repo slug + owner; manifest (name + icon) loads asynchronously and updates in place
- [x] Page-level cache — returning users see cached page 1 instantly; only scroll-triggered pages consume API budget
- [x] `sort=updated&order=desc` — most relevant (recently updated) applets appear first
- [x] Deduplication on merge — static `marketplace.json` entries and GitHub results merged by `fullName`, preventing duplicate cards

### Step F — Test matrix verification
- [x] Empty `marketplace.json` → scan button fetches page 1 → cards appear with basic info → manifests fill in
- [x] Scroll to bottom → page 2 loads → more cards appear
- [x] Refresh page → cached entries render immediately (no scan needed)
- [x] Search filters only loaded entries
- [x] Add entries to `marketplace.json` → they merge with GitHub results, deduplicated
- [x] Install/uninstall from a lazily-loaded card works identically to before
- [x] AHM hybrid install path still works
- [x] Build verification — `npm run dist` passes without errors


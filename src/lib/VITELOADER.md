# `viteLoader.js` — Glob-First + SFC-Loader Fallback

## Purpose

Provides a component loader for Vite dev mode that handles both pre-existing applets (known at build time) and applets installed at runtime after Vite has started.

## Why This Exists

Vite's `import.meta.glob` is evaluated once at startup and produces a static map. Any applet installed via the marketplace after startup has a path not in that map, so a simple `appModules[filePath]?.()` returns `undefined` and the route renders nothing.

## Strategy

```
loadComponent(filePath)
  │
  ├─ filePath in globMap? ──► globMap[filePath]()   (Vite lazy chunk, zero overhead)
  │
  └─ not in globMap? ──────► loadModule(filePath, sfcOptions)
                                        │
                                        └─ vue3-sfc-loader fetches and compiles
                                           the .vue file via fetch(), checking
                                           OPFS/memory first via combinedFsRead
```

## API

```js
import { createViteLoader } from './viteLoader.js';

const loadComponent = createViteLoader(appModules);
// loadComponent('./apps/marketplace/index.vue') → Vite chunk
// loadComponent('./src/apps/recorder/index.vue') → sfc-loader (runtime install)
```

`createViteLoader(globMap)` — takes the `import.meta.glob` result map and returns a `loadComponent(filePath)` function.

## SFC-Loader Options

Options are created lazily on the first fallback call via `createSfcOptions` from `sfcLoaderOptions.js`. The module cache is pre-populated with `vue` and `vue-router` so runtime-compiled components resolve the same instances as the Vite bundle.

`combinedFsRead` from `fsRead.js` is passed as the optional file hook so the SFC loader checks OPFS (persisted) and the in-memory store before hitting the network.

## Used By

- `src/main.js` — passes `createViteLoader(appModules)` as both `shellCompiler` and the `registerDynamicApps` loader.

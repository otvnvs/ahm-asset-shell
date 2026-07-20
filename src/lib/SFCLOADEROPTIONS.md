# `sfcLoaderOptions.js` — Shared SFC Loader Options Factory

## Purpose

Centralises the `vue3-sfc-loader` options object so both SFC/runtime mode (`sfcBootstrap.js`) and Vite fallback mode (`viteLoader.js`) share identical path resolution, file fetching, style injection, and JSON handling behaviour.

## API

```js
import { createSfcOptions } from './sfcLoaderOptions.js';

const options = createSfcOptions(moduleCache, fsRead);
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `moduleCache` | `object` | Pre-populated module cache passed to `vue3-sfc-loader`. Must contain `vue` and `vue-router` entries. |
| `fsRead` | `function\|null` | Optional. Called with a file URL before network fetch. Return the file content string if found in a custom store, or `null` to fall through to fetch. Both SFC and Vite modes pass `combinedFsRead` from `fsRead.js` (OPFS first, then in-memory fallback). |

## Options Provided

| Hook | Behaviour |
|------|-----------|
| `getFile(url)` | Checks `fsRead` first; falls back to `fetch(url)`. Returns `.mjs` type for `.js` files. |
| `addStyle(str)` | Injects a `<style>` tag into `document.head`. |
| `pathResolve({refPath, relPath})` | Resolves relative import paths to absolute `./`-prefixed paths. Handles `vue`/`vue-router` pass-through, `/../` folding, and `/./ `collapse. |
| `handleModule(type, getData, path)` | Parses `.json` files and returns the parsed object. |

## Used By

- `src/sfcBootstrap.js` — SFC/runtime mode boot, passes `combinedFsRead` from `fsRead.js` for OPFS + memory file reading.
- `src/lib/viteLoader.js` — Vite fallback loader, passes the same `combinedFsRead`.

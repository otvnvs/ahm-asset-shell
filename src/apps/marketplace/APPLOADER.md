# Applet Loader Architecture

The shell can host several kinds of applets side-by-side. The loader in `src/lib/appLoader.js` turns an `app.json` descriptor into a Vue route component by dispatching on the descriptor's `type` field.

## `app.json` fields

```json
{
  "name": "Hello Dist",
  "svgContent": "<path d='M12 2L2 22h20L12 2z'/>",
  "type": "vue-dist",
  "entry": "dist/index.js",
  "files": ["app.json", "dist/index.js", "dist/style.css"],
  "params": { "theme": "dark" }
}
```

| Field | Default | Meaning |
|-------|---------|---------|
| `type` | `"sfc"` | Loader selector. One of `sfc`, `vue-dist`, `dom-module`, `iframe`, or any custom registered type. |
| `entry` | `"index.vue"` | Entry path relative to the app root. |
| `files` | — | Files the installer must download. Required for runtime installs. |
| `params` | — | Optional JSON object passed to `dom-module` mount functions. Ignored by other types. |

## Built-in loaders

### `sfc` — runtime single-file components

Source `.vue` files compiled in the browser by `vue3-sfc-loader`. This is the original applet type and remains the default when `type` is omitted.

### `vue-dist` — compiled Vue libraries

A Vite/Vue project built in library mode, externalizing `vue` and `vue-router`:

```js
// vite.config.js
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  build: {
    lib: {
      entry: './src/App.vue',
      name: 'HelloDist',
      fileName: 'index',
      formats: ['es']
    },
    rollupOptions: {
      external: ['vue', 'vue-router']
    }
  }
});
```

The applet's `app.json` points at the built output:

```json
{
  "type": "vue-dist",
  "entry": "dist/index.js",
  "files": ["app.json", "dist/index.js", "dist/style.css"]
}
```

The shell exposes `window.__ahmVue__` and `window.__ahmVueRouter__` and maps bare `vue` / `vue-router` imports to `lib/vue-shim.js` / `lib/vue-router-shim.js`. The compiled applet therefore shares the same Vue singleton as the shell.

### `dom-module` — arbitrary UI projects

A non-Vue project receives a prepared DOM container and optional parameters:

```js
// dist/index.js
export function mount({ containerId, container, params }) {
  container.innerHTML = `<h1>Theme: ${params.theme}</h1>`;
}

export function unmount({ containerId }) {
  // teardown if needed
}
```

```json
{
  "type": "dom-module",
  "entry": "dist/index.js",
  "params": { "theme": "dark" },
  "files": ["app.json", "dist/index.js", "dist/style.css"]
}
```

The shell creates a full-size `<div>`, calls `mount`, injects any CSS listed in `files`, and calls `unmount` when the route leaves.

### `iframe` — standalone pages

For projects that cannot integrate directly with the shell:

```json
{
  "type": "iframe",
  "entry": "dist/index.html",
  "files": ["app.json", "dist/index.html", "dist/app.js", "dist/style.css"]
}
```

The shell renders the entry HTML full-screen in an `<iframe>`.

## Registering custom loaders

New applet technologies can be added without editing the router or installers:

```js
import { registerAppLoader } from './lib/appLoader.js';

registerAppLoader('react-dist', (app, context) => {
  // return a Vue component that hosts the React applet
});
```

## Installer contract

Installers are file-agnostic: they download whatever `app.json["files"]` lists. The only loader-specific change is that installers now build a full app descriptor and pass it to the app-aware loader instead of a single entry path.

## Runtime file loading (blob-URL strategy)

Non-SFC applets (`vue-dist`, `dom-module`, `iframe`) cannot rely on the service worker to serve their files for dynamic `import()` calls, because Vite dev mode adds query strings to import URLs that cause the SW to pass through. Instead, `appLoader.js` reads applet files directly from OPFS or the in-memory store via `combinedFsRead` (from `src/lib/fsRead.js`) and creates blob URLs:

- **`vue-dist`** — creates a blob URL for the entry `.js` file, dynamically imports it, then revokes the blob URL after the import resolves.
- **`dom-module`** — same blob URL pattern; the blob URL is revoked in a `.finally()` after the import resolves. CSS files listed in `app.files` are injected as `<style>` tags.
- **`iframe`** — reads the entry HTML from the store, rewrites relative `src`/`href` attributes to blob URLs for assets listed in `app.files`, strips `crossorigin` attributes, then creates a blob URL for the rewritten HTML. All asset blob URLs are tracked and revoked when the route component unmounts.

SFC applets continue to use `vue3-sfc-loader` with the `combinedFsRead` hook in `sfcLoaderOptions.js`, so they read from OPFS/memory without needing blob URLs.

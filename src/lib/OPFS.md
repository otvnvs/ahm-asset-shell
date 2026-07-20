# `opfs.js` — Origin Private File System Utilities

## Purpose

Thin promise-based wrapper around the browser's [Origin Private File System](https://developer.mozilla.org/en-US/docs/Web/API/File_System_Access_API#origin_private_file_system) (OPFS). It lets the shell read and write a per-origin, sandboxed, persistent filesystem without user permission prompts.

This module is used by:

- `src/apps/marketplace/opfsInstaller.js` — writes installed applet files and the installed-apps manifest.
- `src/sfcBootstrap.js` — reads OPFS files as a fallback before checking the in-memory store.
- `sw.js` — contains its own inline OPFS reader because service workers cannot reliably import ES modules in all browsers.

## Capability Guard

All functions first call `opfsAvailable()`:

```js
export function opfsAvailable() {
  return typeof navigator !== 'undefined' && 'storage' in navigator && 'getDirectory' in navigator.storage;
}
```

If OPFS is unavailable, every function degrades gracefully:

| Function | Behaviour when OPFS unavailable |
|----------|--------------------------------|
| `opfsAvailable()` | `false` |
| `opfsWrite()` | no-op |
| `opfsRead()` | returns `null` |
| `opfsExists()` | returns `false` |
| `opfsDelete()` | no-op |
| `opfsList()` | returns `[]` |

## Path Convention

All paths are slash-separated strings **without a leading slash**, e.g.:

```
src/apps/recorder/index.vue
src/apps/apps-installed.json
```

This matches the URL paths the service worker intercepts (`/src/apps/...`) once the leading slash is stripped.

## Exports

| Export | Description |
|--------|-------------|
| `opfsAvailable()` | Boolean guard. `true` when `navigator.storage.getDirectory` exists. |
| `opfsWrite(path, content)` | Writes `content` (string) to `path`, creating parent directories as needed. |
| `opfsRead(path)` | Reads `path` as text. Returns `null` if the file does not exist or OPFS is unavailable. |
| `opfsExists(path)` | Returns `true` if the file exists. |
| `opfsDelete(path)` | Recursively deletes a directory or file. Silently succeeds if the path does not exist. |
| `opfsList(path)` | Returns an array of entry names in the given directory, or `[]` if missing. |

## Notes

- OPFS is supported in Chrome 86+, Edge 86+, Firefox 111+, and Safari 15.2+.
- Writes are atomic through `createWritable()`.
- OPFS survives page reloads and is shared between the main thread, service workers, and Web Workers on the same origin.

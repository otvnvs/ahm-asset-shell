# File System Layer (`src/lib/fs/`)

This module provides a unified filesystem abstraction (`fsApi`) that works across both runtime environments — regular web browsers and the Android Hybrid Mobile (AHM) wrapper.

---

## Architecture

```
src/lib/fs/
├── index.js              # Environment detection + fsApi router
├── backends/
│   ├── androidFs.js      # Native /api/fs/* endpoint calls (AHM only)
│   └── webFs.js          # Static fetch-based implementation (web browser)
├── constants.js          # Shared path constants
├── mock.js               # Legacy localStorage mock (no longer used by fsApi)
└── README.md             # This file
```

---

## Environment Detection

`index.js` exports three functions:

| Function | Returns | Description |
|---|---|---|
| `detectEnvironment()` | `"android-hybrid"` \| `"web"` | Fetches `/api/environment` with a 1.2s timeout. Returns `"android-hybrid"` if the response matches, otherwise defaults to `"web"`. Result is memoized. |
| `isAndroidHybrid()` | `boolean` | Convenience helper wrapping `detectEnvironment()`. |
| `isNativeAndroidEnvironment()` | `boolean` | Deprecated alias for `isAndroidHybrid()`. |

### `/api/environment` contract

| Environment | Source | Response |
|---|---|---|
| Android Hybrid Mobile | Java server endpoint | `{ "environment": "android-hybrid" }` |
| Web browser | Static file `api/environment.json` | `{ "environment": "web" }` |

---

## `fsApi` — Public Interface

`fsApi` is the only export consumers should use. Every method transparently routes to the correct backend.

| Method | Android Backend | Web Backend |
|---|---|---|
| `getWebRoot()` | `GET /api/fs/webroot` → string | Returns `""` |
| `listDirectory(path)` | `GET /api/fs/list?path=...` | Reads `src/apps/apps.json` |
| `readFile(path)` | `GET /api/fs/read?path=...` | `fetch(path)` |
| `writeFile(path, content)` | `POST /api/fs/write` | Throws `NotSupportedInWebMode` |
| `createDirectory(path)` | `POST /api/fs/mkdir` | Throws `NotSupportedInWebMode` |
| `deleteItem(path)` | `DELETE /api/fs/delete` | Throws `NotSupportedInWebMode` |
| `deletePath(path, recursive)` | `DELETE /api/fs/delete` | Throws `NotSupportedInWebMode` |
| `zipArchive(src, dest)` | `POST /api/arc/zip` | Throws `NotSupportedInWebMode` |
| `unzipArchive(zip, dir, strip)` | `POST /api/arc/unzip` | Throws `NotSupportedInWebMode` |
| `downloadFile(url, path)` | `GET /api/net/download` | Throws `NotSupportedInWebMode` |

---

## Android Hybrid Mobile Endpoints

Documented in full in the Android project. Quick reference:

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/environment` | GET | Environment detection |
| `/api/fs/webroot` | GET | Returns active web root path string |
| `/api/fs/list` | GET | List directory contents |
| `/api/fs/read` | GET | Read file as text |
| `/api/fs/write` | POST | Write file content |
| `/api/fs/mkdir` | POST | Create directory |
| `/api/fs/delete` | DELETE | Delete file or directory |
| `/api/arc/zip` | POST | Create zip archive |
| `/api/arc/unzip` | POST | Extract zip archive |
| `/api/net/download` | GET | Download remote file to device |

---

## Web Backend Notes

`webFs.js` relies on `src/apps/apps.json` for directory listing. This file must be updated manually when applets are added or removed in web mode. See `src/apps/APPS.md` for instructions.

`readFile(path)` fetches the path relative to the server root using the browser's native `fetch()`, so all applet source files must be accessible as static assets.

Write, delete, archive, and download operations are not supported in web mode. Components that call these should guard with `isAndroidHybrid()` before invoking them.

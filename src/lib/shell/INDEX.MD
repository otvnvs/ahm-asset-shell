# Runtime Shell Orchestration Engine (`index.js`)

This module drives the plug-and-play app ecosystem. It scans available applet directories at runtime, parses their manifests, and returns structured definitions consumed by the router and the home launcher.

---

## `scanForApps()`

Asynchronous function that discovers all installed applets and returns a uniform array of app definitions.

### How it works

1. Calls `fsApi.getWebRoot()` to resolve the active path prefix.
2. Builds `appsTargetDir` — `src/apps` on web, or `<webRoot>/src/apps` on AHM.
3. Calls `fsApi.listDirectory(appsTargetDir)` to enumerate subdirectories.
4. For each subdirectory, attempts to read and parse `app.json` via `fsApi.readFile()`.
5. Falls back to an uppercase folder name and the default icon if `app.json` is missing or invalid.

### Backend behaviour

| Environment | `listDirectory` source | `readFile` source |
|---|---|---|
| Web browser | `src/apps/apps.json` static manifest | `fetch()` against server root |
| Android Hybrid Mobile | `GET /api/fs/list` native endpoint | `GET /api/fs/read` native endpoint |

Both paths go through `fsApi` transparently — `scanForApps` has no environment-specific branching.

### Return schema

```json
[
  {
    "id": "marketplace",
    "name": "Marketplace",
    "route": "/apps/marketplace",
    "svgContent": "<circle ...",
    "entryFile": "./src/apps/marketplace/index.vue"
  }
]
```

| Field | Source |
|---|---|
| `id` | Folder name |
| `name` | `app.json` → `name`, or uppercased folder name |
| `route` | `app.json` → `route`, or `/apps/<id>` |
| `svgContent` | `app.json` → `svgContent`, or `DEFAULT_APP_ICON` |
| `entryFile` | Always `./src/apps/<id>/index.vue` |

### Adding a new applet

1. Create `src/apps/<id>/index.vue` and `src/apps/<id>/app.json`.
2. **Web mode only:** add an entry to `src/apps/apps.json`. See `src/apps/APPS.md`.
3. On AHM the native filesystem is scanned directly — no manifest file is required.

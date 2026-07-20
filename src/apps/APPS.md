# Apps Directory (`src/apps/`)

Each subdirectory is a self-contained applet micro-frontend loaded at runtime by the shell via `vue3-sfc-loader`.

## Adding a new applet

1. Create a folder under `src/apps/<id>/`.
2. Add `index.vue` as the entry component.
3. Add `app.json` with at minimum a `name` and `svgContent` field:
   ```json
   { "name": "My App", "svgContent": "<your svg path data>" }
   ```
4. **Web mode only:** add an entry to `apps.json` so the web backend can discover it:
   ```json
   { "path": "src/apps/<id>", "isDirectory": true }
   ```
   On Android Hybrid Mobile this file is not used — the native filesystem is scanned directly.

## `apps.json`

Static directory manifest used exclusively by the web filesystem backend (`webFs.js`). It lists every applet folder that should appear in the launcher when running in a regular browser.

| Field | Type | Description |
|---|---|---|
| `path` | string | Relative path from project root to the applet folder |
| `isDirectory` | boolean | Always `true` for applet entries |

On Android Hybrid Mobile, `apps.json` is ignored — `fsApi.listDirectory()` queries the native `/api/fs/list` endpoint instead.

# Web Filesystem Backend (`webFs.js`)

Implements the `fsApi` interface for regular web browser environments. All read operations use the browser's native `fetch()` against static files served from the project root.

Only loaded when `detectEnvironment()` returns `"web"`. Never imported directly by consumers — use `fsApi` from `../index.js`.

## Method behaviour

| Method | Behaviour |
|---|---|
| `getWebRoot()` | Returns `""` — paths are relative to the server root |
| `listDirectory(path)` | Fetches `src/apps/apps.json` and filters entries whose parent matches `path` |
| `readFile(path)` | `fetch(path)` and returns response text |
| `writeFile()` | Throws `NotSupportedInWebMode` |
| `createDirectory()` | Throws `NotSupportedInWebMode` |
| `deleteItem()` | Throws `NotSupportedInWebMode` |
| `deletePath()` | Throws `NotSupportedInWebMode` |
| `zipArchive()` | Throws `NotSupportedInWebMode` |
| `unzipArchive()` | Throws `NotSupportedInWebMode` |
| `downloadFile()` | Throws `NotSupportedInWebMode` |

## Dependency: `src/apps/apps.json`

`listDirectory` reads this static manifest to discover installed applets. It must be kept in sync with the actual contents of `src/apps/`. See `src/apps/APPS.md` for the format and update instructions.

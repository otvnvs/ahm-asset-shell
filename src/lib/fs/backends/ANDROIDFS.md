# Android Filesystem Backend (`androidFs.js`)

Implements the `fsApi` interface using the Android Hybrid Mobile native server endpoints. All operations are HTTP calls intercepted by the Java `WebViewClient`.

Only loaded when `detectEnvironment()` returns `"android-hybrid"`. Never imported directly by consumers — use `fsApi` from `../index.js`.

## Endpoint mapping

| Method | HTTP call |
|---|---|
| `getWebRoot()` | `GET /api/fs/webroot` |
| `listDirectory(path)` | `GET /api/fs/list?path=<encoded>` |
| `readFile(path)` | `GET /api/fs/read?path=<encoded>` |
| `writeFile(path, content)` | `POST /api/fs/write?path=<encoded>&content=<encoded>` |
| `createDirectory(path)` | `POST /api/fs/mkdir?path=<encoded>&recursive=true` |
| `deleteItem(path)` | `DELETE /api/fs/delete?path=<encoded>&recursive=true` |
| `deletePath(path, recursive)` | `DELETE /api/fs/delete?path=<encoded>&recursive=<bool>` |
| `zipArchive(src, dest)` | `POST /api/arc/zip` (JSON body) |
| `unzipArchive(zip, dir, strip)` | `POST /api/arc/unzip` (JSON body) |
| `downloadFile(url, path)` | `GET /api/net/download?url=<encoded>&path=<encoded>` |

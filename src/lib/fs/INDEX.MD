# Filesystem Integration Controller (`index.js`)

This file serves as the main controller for all file system storage operations. It acts as an environment-aware gateway, automatically routing CRUD calls between the native Android WebView interceptor API and the local browser simulation engine.

## Core Operations

### 1. Native Container Diagnostics
The controller exports an asynchronous environment detection worker (`isNativeAndroidEnvironment`). It pings the mock backend service `/api/app/device-status`:
*   **Success Response:** Confirms the application is running inside the Android WebView shell. Native asset intercept mappings are enabled.
*   **Request Timeout or Failure (404):** Safely falls back to local browser mode with zero system exceptions.

### 2. Dynamic Operation Routing
The exported `fsApi` wrapper object exposes standard filesystem CRUD operations. Every function dynamically targets the validated runtime environment:

*   **`listDirectory(path)`**: Maps to native `GET /api/fs/list` or falls back to simulated single-level folder queries.
*   **`readFile(path)`**: Pulls explicit file contents via native `GET /api/fs/read` or reads data from local mock structures.
*   **`writeFile(path, content)`**: Pushes raw text bodies via `POST /api/fs/write` with custom text headers, or commits to browser storage.
*   **`createDirectory(path)`**: Handles system folder tree instantiation (`POST /api/fs/mkdir?recursive=true`).
*   **`deleteItem(path)`**: Cleans out target folders or explicit documents (`DELETE /api/fs/delete?recursive=true`).

## Structural Dependency Relationships

```
              ┌───────────────────────────┐
              │  Application Logic Layer  │
              └─────────────┬─────────────┘
                            │
              ┌─────────────▼─────────────┐
              │    fsApi (index.js)       │
              └─────────────┬─────────────┘
                            │
             [isNativeAndroidEnvironment?]
                    /               \
                 (Yes)              (No)
                  /                   \
  ┌──────────────▼──────────────┐   ┌──▼────────────────────────┐
  │ Android Interceptor Network │   │  mockFileSystem Module    │
  │     (/api/fs/...)           │   │  (localStorage Sandbox)   │
  └─────────────────────────────┘   └───────────────────────────┘
```

# Runtime Shell Orchestration Engine (`index.js`)

This file drives the plug-and-play app ecosystem. It scans your physical folder structures at runtime, parses any discoverable manifest criteria, and dynamically computes component entry locations for the client-side compiler.

## Core Operations

### 1. Automated Application Discovery
The module exports an asynchronous scanner engine called `scanForApps()`. This engine performs a zero-configuration tree search across your codebase:
1. Calls `fsApi.listDirectory()` on the designated storage path resolved by your filesystem settings.
2. Filters out files to isolate valid application directory boundaries (`item.isDirectory`).

### 2. Zero-Configuration Path Calculation
The scanner completely automates target routing structures. Instead of requiring developers to manually write absolute paths inside a configuration file, the script calculates entry nodes on-the-fly using folder conventions:
* **Calculated File Target Structure:** `./src/apps/[folderName]/index.vue`

### 3. Graceful Manifest De-serialization
The scanner attempts to read the manifest file (`app.json`) inside each application folder:
* **Successful Read:** Parses metadata to hydrate custom application dashboard items, grid labels, and specific router parameters.
* **Fallback Lifecycle Interception:** If a module is missing an explicit `app.json` file, the scanner catches the error gracefully. It populates the dashboard using an uppercase folder name string and applies the default system icon template so that the app remains stable and operational.

## Data Schema Blueprint
The `scanForApps()` method returns a uniform array of app definitions formatted for the dashboard and router registration loops:

```json
[
  {
    "id": "todo",
    "name": "Task Master",
    "route": "/apps/todo",
    "svgContent": "<path d=...",
    "entryFile": "./src/apps/todo/index.vue"
  }
]
```


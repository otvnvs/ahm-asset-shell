# App Marketplace Module (`marketplace`) — Phase 2 (Active Installation)

This applet handles remote application exploration, layout discovery, and on-demand background installation. It pulls uncompiled single-file component (SFC) packages from public code storage and mounts them dynamically into the operational system context using the shared state core.

## Core Architecture & Workflow

```text
  ┌──────────────────┐       ┌──────────────────┐       ┌──────────────────┐
  │  Marketplace UI  │ ────> │  GitHub API Scan │ ────> │  GitHub raw CDN  │
  │  (index.vue)     │       │  (Finds topics)  │       │ (Fetches source) │
  └────────┬─────────┘       └──────────────────┘       └────────┬─────────┘
           │                                                     │
           │           ┌──────────────────────────┐              │
           └─────────► │ fsApi & State Engines    │ ◄────────────┘
                       │ Writes files to disk &   │
                       │ triggers shellBus sync   │
                       └──────────────────────────┘
```

### 1. Public API Discovery & Manifest Extraction
When scanning, the applet queries public endpoints to discover platform-compatible modular packages:
* **Target Query Context:** `GET https://github.com`
* **Deep Asset Hydration:** Executes a secondary asynchronous micro-fetch to read raw properties from `https://githubusercontent.com{owner}/{repo}/{branch}/app.json`. This populates custom visual vectors, labels, and icons dynamically into the browsing catalog grid view.

### 2. State-Driven Installation Lifecycle
When the user triggers the installation pipeline, the applet coordinates multiple platform layers to write code assets directly to disk without restarting the application:
1.  **File Synchronization:** Uses `fsApi.createDirectory` and `fsApi.writeFile` to streams download bytes (`app.json` and `index.vue`) directly onto the device sandbox path (`src/apps/{repoName}`).
2.  **State Registry Update:** Dispatches metadata directly up to the global provider tracking system (`globalState.actions.registerInstalledApp(summary)`) so the button state switches reactively from "Install" to "Open".
3.  **Cross-Module Bus Activation:** Fires a background change event signal using the imported single-instance module emitter (`shellBus.emitRefresh()`).

### 3. Container Route Mounting
The master application shell catches the `shellBus` reactive notification token, runs an automated file configuration sweep, recognizes the fresh directory entry, and registers the navigation pathways natively using `router.addRoute()`.


# Navigation Router Engine (`index.js`)

This module manages the application's global navigation matrix. It configures the default application shell viewpoints and exports an execution gateway (`registerDynamicApps`) to programmatically register uncompiled plug-and-play app modules at runtime.

## Core Operations

### 1. Hash-Based History Management
The router instantiates a clean `vue-router` framework instance configured with Hash History mode via `createWebHashHistory()`. 
* **Hybrid App Optimization:** Hash history is essential for offline Android WebView platforms. It ensures the system can transition between virtual application views internally without triggering real HTTP page reloads on the mock `https://example.com` domain.

### 2. Base Core Routes
Houses the permanent, hardcoded layout routes required to load the master application dashboard viewport:
*   `path: '/'`: Intercepts baseline hits and redirects them immediately to the dashboard.
*   `path: '/home'`: Mounts the static homepage shell view (`./src/views/home/index.vue`).

### 3. Dynamic App Hydration (`registerDynamicApps`)
Exposes a custom named export function designed to register newly scanned child modules on-the-fly. It bridges the gap between your automated filesystem discovery scripts and the layout routing table:

*   **Duplicate Elimination:** Checks if an application ID already exists in the active routing table (`router.hasRoute(id)`). If found, it clears the old layout (`router.removeRoute(id)`) before mapping the new one. This maintains full environment stability during local hot-reloads.
*   **Asynchronous Loader Injection:** Accepts an abstract compiler factory function (`componentLoader`). When a user clicks on an application card, the router invokes this loader to read and compile the raw `.vue` code source string completely on-demand.

## Execution Pattern Diagram

```text
  [ scanForApps() ] ──> Returns list of apps (ID, Route, Entry File)
                             │
                             ▼
  [ registerDynamicApps(apps, componentLoader) ]
                             │
            ┌────────────────┴────────────────┐
            ▼                                 ▼
   [ Route Duplication Check ]       [ router.addRoute() ]
   Removes existing app.id if         Injects path & sets up async
   present to prevent collisions.    SFC compilation on click.
```


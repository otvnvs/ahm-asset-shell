# SFC Bootstrapper Architecture (`sfcBootstrap.js`)

This document outlines the purpose, mechanics, and design patterns of the Single File Component (SFC) dynamic runtime bootstrapper. This module orchestrates in-browser compilation, dependency virtualization, and dynamic route loading inside uncompiled target environments (like local desktop browsers or hybrid Android WebViews).

---

## 1. Functional Overview
The `sfcBootstrap.js` engine enables the application to boot and run directly from raw source files (`.vue`, `.js`, `.css`) without requiring a pre-compilation step (e.g., Vite/Rollup). It relies on `vue3-sfc-loader` to compile Vue Single File Components on-the-fly directly inside the browser.

### Architectural Core Responsibilities:
*   **Dependency Mapping:** Virtualizes standard modules like `vue` and `vue-router` using an internal unified cache framework (`moduleCache`) so uncompiled module imports resolve instantly.
*   **Asset Interception:** Fetches raw file strings asynchronously using native web requests (`fetch`) and extracts content streams for compilation.
*   **Constructable Scoping:** Automatically injects scoped style markers compiled from `.vue` blocks into the active document document head block.
*   **Custom Path Resolution (`pathResolve`):** Translates dynamic and relative module paths (e.g., `../views/home/index.vue` or `vue`) into normalized file locations relative to the running workspace root.
*   **Telemetry Instrumentation:** Tracks and manages performance timelines, dependency topology maps, and network asset payloads within a global debugging store (`window.__sfc_trace__`).

---

## 2. Boot Sequence Flow
1.  **Initialize Instrumentation Stack:** Instantiates tracing models under `window.__sfc_trace__` for real-time performance auditing.
2.  **Inject Router Core:** Loads the global client production bundle for `vue-router` directly into the document header context.
3.  **Construct Cache Mapping:** Pins global references for `vue` and `vue-router` into a shared, isolated module registration bucket.
4.  **Instantiate SFC Loader Module:** Configures retrieval rules, custom regex file sanitizers, and style context appenders.
5.  **Compile Main Shell Components:** Resolves the root viewport layout (`./src/Main.vue`) and standard app routing engine (`./src/router/index.js`).
6.  **Mount Unified Application Layer:** Returns initialization references back to `main.sfc.js` to initialize layout mount parameters (`#app`).

---

## 3. Dynamic App Routing Enhancements (Recent Changes)

### Overview of Changes
To support a modular plug-and-play architecture, the bootstrapper was updated to scan for standalone sub-applications dynamically instead of relying on hardcoded, static routes. This enables decentralized apps (located inside `./src/apps/`) to hook directly into the main shell dashboard automatically.

### Key Implementation Adjustments:
*   **Asynchronous Scan Injection:** Integrated the application shell scanner (`scanForApps`) directly into the router's asynchronous initialization chain.
*   **Decoupled Loader Factory:** Implemented a compiler factory bridge (`(filePath) => loadModule(filePath, options)`) which is passed directly down to the routing engine. This allows the router to compile dynamically injected `.vue` templates at runtime while sharing the exact same cache and instrumentation context as the main shell application.
*   **Hot-Reload & Collision Guarding:** Cleaned routing boundaries to ensure that sub-applications can be scanned, registered, and re-injected on-the-fly via hash state routing parameters without throwing route collisions or crashing active telemetry logging frameworks.


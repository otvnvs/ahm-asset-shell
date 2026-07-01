# Main SFC Application Entry Point (`main.sfc.js`)

This file serves as the absolute entry node when the application runs in uncompiled Single File Component (SFC) mode via `index.sfc.html`. It bridges modern browser specifications with the client-side compilation engine.

## Core Operations

### 1. Style Architecture Injection
The file utilizes modern web specifications to handle styles without a bundling step:
* **CSS Module Scripts:** Imports raw stylesheets using the native browser syntax:
  ```javascript
  import style from './style.css' with { type: 'css' };
  ```
* **Constructable Stylesheets:** Adopts the stylesheet globally into the document context layout to avoid standard element append overhead:
  ```javascript
  document.adoptedStyleSheets = [...document.adoptedStyleSheets, style];
  ```

### 2. Lifecyle Bootstrap Synchronization
Invokes the uncompiled application coordinator (`bootstrapSfcApp`) from `sfcBootstrap.js`. This initialization returns a resolved promise with localized references once the filesystem scan and dynamic routing pools are hydrated.

### 3. Application Mounting
Upon a successful bootstrap lifecycle resolution, the script:
1. Instantiates a clean Vue instance using the root `Main.vue` shell.
2. Injects the initialized, dynamically populated `vue-router` engine.
3. Mounts the application shell straight into the DOM (`#app`).


# Shell Engine Structural Constants (`constants.js`)

This file manages the default structural naming conventions and visual fallbacks used by the plug-and-play application shell subsystem. It establishes strict, system-wide baselines for parsing child modules.

## Configurations

### 1. Application Manifest Name
*   `APP_MANIFEST_FILE`: Hardcoded to `'app.json'`.
*   **Purpose:** Tells the scanner exactly which configuration filename to look for inside each discovered folder to extract application metadata (like `name`, `route`, and `svgContent`).

### 2. Global SVG Icon Fallback
*   `DEFAULT_APP_ICON`: Hardcoded to `'<path d="M4 4h16v16H4z"></path>'`.
*   **Purpose:** Serves as a visual fallback block (a minimal square frame). If a child application folder is missing an `app.json` file or does not specify an `svgContent` string, the dashboard grid uses this placeholder to keep the UI from throwing runtime display errors.


# Filesystem Path Constants (`constants.js`)

This file acts as the single source of truth for the project's spatial path tracking topology. It isolates storage path formats into clear configuration constants, allowing the application to scale across different Android storage locations without breaking code references.

## Key Configurations

### 1. Hardcoded Physical Root Path
Maps the application workspace directory hierarchy inside the Android External Storage filesystem (`Environment.getExternalStorageDirectory()`):
*   `HYBRID_APP_ROOT`: Configured to `'Documents/MyHybridMobile'`.
*   `WEB_ASSET_DIR`: Explicitly maps the production-ready directory layout (`'Documents/MyHybridMobile/www'`).

### 2. Runtime App Discovery Target
Provides a dynamic helper function (`getAppsDirectory`) to resolve the application directory path. It shifts paths automatically depending on the execution context:
*   **Android Native App Mode:** Evaluates to `Documents/MyHybridMobile/www/src/apps`.
*   **Standard Browser Testing Mode:** Evaluates to `src/apps` to accurately mirror your local physical repository trees.

## Reference Blueprint

```javascript
export const HYBRID_APP_ROOT = 'Documents/MyHybridMobile';
export const WEB_ASSET_DIR = `${HYBRID_APP_ROOT}/www`;

export function getAppsDirectory(isNative) {
  return isNative ? `${WEB_ASSET_DIR}/src/apps` : 'src/apps';
}
```


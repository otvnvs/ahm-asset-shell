import { fsApi } from '../../lib/fs/index.js'

/**
 * Purges an application from disk storage and de-registers its memory route maps.
 * @param {Object} app - The application record structure wrapper.
 * @param {string} targetRootDir - Root storage boundary for app installations.
 * @param {Object} router - The active Vue Router instance context handle.
 * @param {Function} onProgress - Milestone feedback event callback.
 */
export async function uninstallRepositoryFromStorage(app, targetRootDir, router, onProgress) {
  // 1. Synthesize target path parameters
  const absoluteTargetFolder = `${targetRootDir}/${app.id}`;

  if (typeof onProgress === 'function') {
    onProgress(20, 'Wiping runtime structures from ecosystem disk...');
  }
  
  // 2. Delete application root directory tree layout recursively off the native storage
  await fsApi.deletePath(absoluteTargetFolder, true);

  if (typeof onProgress === 'function') {
    onProgress(60, 'De-registering reactive compiler sandbox parameters...');
  }

  // 3. Disconnect and remove route maps directly out of the application's memory pool
  if (router && router.hasRoute(app.id)) {
    router.removeRoute(app.id);
  }

  if (typeof onProgress === 'function') {
    onProgress(100, 'Successfully purged!');
  }
}


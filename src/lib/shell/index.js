import { fsApi, isNativeAndroidEnvironment } from '../fs/index.js';
import { getAppsDirectory } from '../fs/constants.js';
import { APP_MANIFEST_FILE, DEFAULT_APP_ICON } from './constants.js';

//export async function scanForApps() {
//  try {
//    const isNative = await isNativeAndroidEnvironment();
//    const appsTargetDir = getAppsDirectory(isNative);
//
//    const response = await fsApi.listDirectory(appsTargetDir);
//    if (!response || !response.files) return [];
//
//    const appDirectories = response.files.filter(item => item.isDirectory);
//    const discoveredApps = [];
//
//    for (const dir of appDirectories) {
//      const folderName = dir.name;
//      const manifestPath = appsTargetDir + '/' + folderName + '/' + APP_MANIFEST_FILE;
//      const computedEntryFile = './src/apps/' + folderName + '/index.vue';
//      const computedDefaultRoute = '/apps/' + folderName;
//
//      try {
//        const manifestRaw = await fsApi.readFile(manifestPath);
//        const manifest = JSON.parse(manifestRaw);
//
//        discoveredApps.push({
//          id: folderName,
//          name: manifest.name || folderName,
//          route: manifest.route || computedDefaultRoute,
//          svgContent: manifest.svgContent || DEFAULT_APP_ICON,
//          entryFile: computedEntryFile
//        });
//      } catch (manifestError) {
//        console.warn('Could not load manifest for app "' + folderName + '":', manifestError.message);
//        
//        discoveredApps.push({
//          id: folderName,
//          name: folderName.toUpperCase(),
//          route: computedDefaultRoute,
//          svgContent: DEFAULT_APP_ICON,
//          entryFile: computedEntryFile
//        });
//      }
//    }
//
//    return discoveredApps;
//  } catch (error) {
//    console.error('Failed to run runtime application shell scan:', error);
//    return [];
//  }
//}

/**
 * Periodically scans the localized runtime filesystems directory to index 
 * available applet micro-frontends and register them with the layout launcher.
 */
export async function scanForApps() {
    try {
        const isNative = await isNativeAndroidEnvironment();
        
        // Fetch the raw relative string modifier primitive directly from the native API layer
        const webRootModifier = await fsApi.getWebRoot(); 

        // ◄ CLEAN UNIFORM ASSEMBLY LAYER: Works flawlessly for Sandbox AND Public tracks!
        const appsTargetDir = `${webRootModifier}/src/apps`;

        console.log('[Shell Launcher Check] Executing runtime applet sweep inside directory path:', appsTargetDir);
        
        const response = await fsApi.listDirectory(appsTargetDir);
        if (!response || !response.files) {
            return [];
        }

        const appDirectories = response.files.filter(item => item.isDirectory);
        const discoveredApps = [];

        for (const dir of appDirectories) {
            const folderName = dir.name;
            const manifestPath = `${appsTargetDir}/${folderName}/${APP_MANIFEST_FILE}`;
            
            // Build the relative import hooks for vue3-sfc-loader compilation engines
            const computedEntryFile = `./src/apps/${folderName}/index.vue`;
            const computedDefaultRoute = `/apps/${folderName}`;

            try {
                const manifestRaw = await fsApi.readFile(manifestPath);
                const manifest = JSON.parse(manifestRaw);
                
                discoveredApps.push({
                    id: folderName,
                    name: manifest.name || folderName,
                    route: manifest.route || computedDefaultRoute,
                    svgContent: manifest.svgContent || DEFAULT_APP_ICON,
                    entryFile: computedEntryFile
                });
            } catch (manifestError) {
                console.warn(`Could not load descriptor manifest for app "${folderName}":`, manifestError.message);
                // Fallback rendering definition tracking parameters safely if app.json parsing fails
                discoveredApps.push({
                    id: folderName,
                    name: folderName.toUpperCase(),
                    route: computedDefaultRoute,
                    svgContent: DEFAULT_APP_ICON,
                    entryFile: computedEntryFile
                });
            }
        }
        return discoveredApps;
    } catch (error) {
        console.error('Failed to run runtime application shell scan:', error);
        return [];
    }
}

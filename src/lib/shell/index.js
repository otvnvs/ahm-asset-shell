import { fsApi } from '../fs/index.js';
import { APP_MANIFEST_FILE, DEFAULT_APP_ICON } from './constants.js';
import { getOpfsInstalledApps, isOpfsAvailable } from '../../apps/marketplace/opfsInstaller.js';

export async function scanForApps() {
    try {
        const webRootModifier = await fsApi.getWebRoot();
        const appsTargetDir = webRootModifier ? `${webRootModifier}/src/apps` : 'src/apps';

        const response = await fsApi.listDirectory(appsTargetDir);
        if (!response || !response.files) {
            return [];
        }

        const appDirectories = response.files.filter(item => item.isDirectory);
        const discoveredApps = [];

        for (const dir of appDirectories) {
            const folderName = dir.name;
            const manifestPath = `${appsTargetDir}/${folderName}/${APP_MANIFEST_FILE}`;
            const computedEntryFile = `./src/apps/${folderName}/index.vue`;
            const computedDefaultRoute = `/apps/${folderName}`;

            try {
                const manifestRaw = await fsApi.readFile(manifestPath);
                const manifest = JSON.parse(manifestRaw);
                const entryFile = manifest.entry
                    ? `./src/apps/${folderName}/${manifest.entry}`
                    : computedEntryFile;
                discoveredApps.push({
                    id: folderName,
                    name: manifest.name || folderName,
                    route: manifest.route || computedDefaultRoute,
                    svgContent: manifest.svgContent || DEFAULT_APP_ICON,
                    type: manifest.type || 'sfc',
                    entryFile,
                    files: manifest.files,
                    params: manifest.params,
                    builtIn: manifest.builtIn === true
                });
            } catch (manifestError) {
                console.warn(`Could not load descriptor manifest for app "${folderName}":`, manifestError.message);
                discoveredApps.push({
                    id: folderName,
                    name: folderName.toUpperCase(),
                    route: computedDefaultRoute,
                    svgContent: DEFAULT_APP_ICON,
                    type: 'sfc',
                    entryFile: computedEntryFile
                });
            }
        }

        // Merge OPFS-installed apps (browser modes), skipping any already on disk.
        // Read directly from OPFS so this works at boot before marketplace mounts.
        if (isOpfsAvailable()) {
            const diskIds = new Set(discoveredApps.map(a => a.id));
            const opfsApps = await getOpfsInstalledApps();
            for (const opfsApp of opfsApps) {
                if (!diskIds.has(opfsApp.id)) discoveredApps.push(opfsApp);
            }
        }

        return discoveredApps;
    } catch (error) {
        console.error('Failed to run runtime application shell scan:', error);
        return [];
    }
}

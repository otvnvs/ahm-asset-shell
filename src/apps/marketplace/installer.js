import { fsApi, isNativeAndroidEnvironment } from '../../lib/fs/index.js'
import { getAppsDirectory } from '../../lib/fs/constants.js';
//export async function installRepositoryToStorage(app, targetRootDir, onProgress) {
//  // 1. Synthesize explicit structural layouts
//  //const githubZipUrl = `https://github.com{app.fullName}/archive/refs/heads/${app.branch}.zip`;
//  const githubZipUrl = `https://github.com/${app.fullName}/archive/refs/heads/${app.branch}.zip`;
//  const tempZipPath = `${targetRootDir}/temp_install_${app.id}.zip`;
//  const absoluteAppDestination = `${targetRootDir}/${app.id}`;
//
//  // Step A: Stream the remote binary archive onto local disk storage
//  if (typeof onProgress === 'function') {
//    onProgress(20, 'Streaming repository zip package from GitHub streams...');
//  }
//  await fsApi.downloadFile(githubZipUrl, tempZipPath);
//
//  // Step B: Ensure the destination application directory exists
//  if (typeof onProgress === 'function') {
//    onProgress(50, 'Arranging workspace filesystem structural layouts...');
//  }
//  await fsApi.createDirectory(absoluteAppDestination);
//
//  // Step C: Native extraction with automatic top-level GitHub folder stripping
//  if (typeof onProgress === 'function') {
//    onProgress(75, 'Extracting source modules directly onto native storage boundaries...');
//  }
//  await fsApi.unzipArchive(tempZipPath, absoluteAppDestination, 1);
//
//  // Step D: Sanitize the storage footprint by deleting the installation cache
//  if (typeof onProgress === 'function') {
//    onProgress(95, 'Running storage cache sanitization loops...');
//  }
//  await fsApi.deletePath(tempZipPath, false);
//}

//export async function installRepositoryToStorage(app, targetRootDir, onProgress) {
//    // 1. Synthesize explicit structural layouts
//    //const githubZipUrl = `https://github.com{app.fullName}/archive/refs/heads/${app.branch}.zip`;
//    const githubZipUrl = `https://github.com/${app.fullName}/archive/refs/heads/${app.branch}.zip`;
//    
//    const isNative = await isNativeAndroidEnvironment();
//    const appsFolderTarget = getAppsDirectory(isNative); // ◄ Now this will execute perfectly!
//    
//    const tempZipPath = `${appsFolderTarget}/temp_install_${app.id}.zip`;
//    const absoluteAppDestination = `${appsFolderTarget}/${app.id}`;
//
//    if (typeof onProgress === 'function') {
//        onProgress(20, 'Streaming repository zip package from GitHub streams...');
//    }
//    await fsApi.downloadFile(githubZipUrl, tempZipPath);
//
//    if (typeof onProgress === 'function') {
//        onProgress(50, 'Arranging workspace filesystem structural layouts...');
//    }
//    await fsApi.createDirectory(absoluteAppDestination);
//
//    if (typeof onProgress === 'function') {
//        onProgress(75, 'Extracting source modules directly onto native storage boundaries...');
//    }
//    await fsApi.unzipArchive(tempZipPath, absoluteAppDestination, 1);
//
//    if (typeof onProgress === 'function') {
//        onProgress(95, 'Running storage cache sanitization loops...');
//    }
//    await fsApi.deletePath(tempZipPath, false);
//}
export async function installRepositoryToStorage(app, appsFolderTarget, onProgress) {
    // Preserves your dynamic custom repository branch template layout string
    const githubZipUrl = `https://github.com/${app.fullName}/archive/refs/heads/${app.branch}.zip`;
    
    // Leverage the dynamic web-root-prefixed path passed explicitly from index.vue
    // Sandbox Mode -> "www/src/apps"
    // Public Mode  -> "Documents/MyHybridMobile/www/src/apps"
    const tempZipPath = `${appsFolderTarget}/temp_install_${app.id}.zip`;
    const absoluteAppDestination = `${appsFolderTarget}/${app.id}`;
    console.log("absoluteAppDestination:"+absoluteAppDestination)
    console.log("absoluteAppDestination:"+absoluteAppDestination)
    console.log("absoluteAppDestination:"+absoluteAppDestination)
    console.log("absoluteAppDestination:"+absoluteAppDestination)
    console.log("absoluteAppDestination:"+absoluteAppDestination)
    console.log("absoluteAppDestination:"+absoluteAppDestination)
    console.log("absoluteAppDestination:"+absoluteAppDestination)
    console.log("absoluteAppDestination:"+absoluteAppDestination)

    if (typeof onProgress === 'function') {
        onProgress(20, 'Streaming repository zip package from GitHub streams...');
    }
    await fsApi.downloadFile(githubZipUrl, tempZipPath);

    if (typeof onProgress === 'function') {
        onProgress(50, 'Arranging workspace filesystem structural layouts...');
    }
    await fsApi.createDirectory(absoluteAppDestination);

    if (typeof onProgress === 'function') {
        onProgress(75, 'Extracting source modules directly onto native storage boundaries...');
    }
    // Decompresses archive file trees relatively, passing N=1 to strip the root wrapper folder layout node
    await fsApi.unzipArchive(tempZipPath, absoluteAppDestination, 1);

    if (typeof onProgress === 'function') {
        onProgress(95, 'Running storage cache sanitization loops...');
    }
    await fsApi.deletePath(tempZipPath, false);
}



//async function replicateDirectoryDataRecursively(source, destination) {
//    await fsApi.createDirectory(destination);
//    const currentDirectoryContents = await fsApi.listDirectory(source);
//    if (currentDirectoryContents && currentDirectoryContents.files) {
//        for (const item of currentDirectoryContents.files) {
//            const nextSource = `${source}/${item.name}`;
//            const nextDest = `${destination}/${item.name}`;
//            if (item.isDirectory) {
//                await replicateDirectoryDataRecursively(nextSource, nextDest);
//            } else {
//                const fileRes = await fetch(`/api/fs/read?path=${encodeURIComponent(nextSource)}`);
//                await fsApi.writeFile(nextDest, fileRes);
//            }
//        }
//    }
//}
async function replicateDirectoryDataRecursively(source, destination) {
    await fsApi.createDirectory(destination);
    const currentDirectoryContents = await fsApi.listDirectory(source);
    if (currentDirectoryContents && currentDirectoryContents.files) {
        for (const item of currentDirectoryContents.files) {
            const nextSource = `${source}/${item.name}`;
            const nextDest = `${destination}/${item.name}`;
            if (item.isDirectory) {
                await replicateDirectoryDataRecursively(nextSource, nextDest);
            } else {
                const fileRes = await fetch(`/api/fs/read?path=${encodeURIComponent(nextSource)}`);
                await fsApi.writeFile(nextDest, fileRes);
            }
        }
    }
}

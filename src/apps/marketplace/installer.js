import { fsApi, isNativeAndroidEnvironment } from '../../lib/fs/index.js'
export async function installRepositoryToStorage(app, targetRootDir, onProgress) {
  // 1. Synthesize explicit structural layouts
  //const githubZipUrl = `https://github.com{app.fullName}/archive/refs/heads/${app.branch}.zip`;
  const githubZipUrl = `https://github.com/${app.fullName}/archive/refs/heads/${app.branch}.zip`;
  const tempZipPath = `${targetRootDir}/temp_install_${app.id}.zip`;
  const absoluteAppDestination = `${targetRootDir}/${app.id}`;

  // Step A: Stream the remote binary archive onto local disk storage
  if (typeof onProgress === 'function') {
    onProgress(20, 'Streaming repository zip package from GitHub streams...');
  }
  await fsApi.downloadFile(githubZipUrl, tempZipPath);

  // Step B: Ensure the destination application directory exists
  if (typeof onProgress === 'function') {
    onProgress(50, 'Arranging workspace filesystem structural layouts...');
  }
  await fsApi.createDirectory(absoluteAppDestination);

  // Step C: Native extraction with automatic top-level GitHub folder stripping
  if (typeof onProgress === 'function') {
    onProgress(75, 'Extracting source modules directly onto native storage boundaries...');
  }
  await fsApi.unzipArchive(tempZipPath, absoluteAppDestination, 1);

  // Step D: Sanitize the storage footprint by deleting the installation cache
  if (typeof onProgress === 'function') {
    onProgress(95, 'Running storage cache sanitization loops...');
  }
  await fsApi.deletePath(tempZipPath, false);
}

/**
 * Recursive structural mapping copier utility logic
 */
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
        //const fileRes = await fetch(`/api/fs/read?path=${encodeURIComponent(nextSource)}`);
        //const textData = await fileRes.text();
        //await fsApi.writeFile(nextDest, textData);
        //  New Clean Loop
        const fileRes = await fetch(`/api/fs/read?path=${encodeURIComponent(nextSource)}`);
        await fsApi.writeFile(nextDest, fileRes);
      }
    }
  }
}


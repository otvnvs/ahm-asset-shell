import { fsApi } from '../../lib/fs/index.js'

export async function installRepositoryToStorage(app, appsFolderTarget, onProgress) {
  const githubZipUrl = `https://github.com/${app.fullName}/archive/refs/heads/${app.branch}.zip`;
  const tempZipPath = `${appsFolderTarget}/temp_install_${app.id}.zip`;
  const absoluteAppDestination = `${appsFolderTarget}/${app.id}`;

  if (typeof onProgress === 'function') onProgress(20, 'Streaming repository zip package from GitHub...');
  await fsApi.downloadFile(githubZipUrl, tempZipPath);

  if (typeof onProgress === 'function') onProgress(50, 'Arranging workspace filesystem structure...');
  await fsApi.createDirectory(absoluteAppDestination);

  if (typeof onProgress === 'function') onProgress(75, 'Extracting source modules onto storage...');
  // N=1 strips the root wrapper folder GitHub adds to zip archives
  await fsApi.unzipArchive(tempZipPath, absoluteAppDestination, 1);

  if (typeof onProgress === 'function') onProgress(95, 'Running storage cache sanitization...');
  await fsApi.deletePath(tempZipPath, false);
}

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
        const fileRes = await fsApi.readFile(nextSource);
        await fsApi.writeFile(nextDest, fileRes);
      }
    }
  }
}

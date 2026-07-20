// In-memory applet installer for web/Vite mode when OPFS is unavailable.
// Downloads files from raw.githubusercontent.com into a Map keyed by virtual path,
// then registers a route whose component is compiled directly from that cache.
//
// memoryFs is stored on window.__memoryFs so it is shared between the native
// ES module world (sfcBootstrap.js / sfcLoaderOptions.js) and the SFC-loader-
// evaluated world (marketplace/index.vue). Both worlds share window, so writes
// from one are visible to reads from the other.

import { downloadRawFile, fetchRepositoryTree } from './api.js';

if (!window.__memoryFs) window.__memoryFs = new Map();
if (!window.__memoryAppMeta) window.__memoryAppMeta = new Map();

const memoryFs = window.__memoryFs;
const memoryAppMeta = window.__memoryAppMeta;

export function isMemoryInstalled(id) {
  return memoryAppMeta.has(id);
}

export function getMemoryInstalledApps() {
  return Array.from(memoryAppMeta.values());
}

export async function memoryInstall(app, shellCompiler, router, onProgress) {
  if (typeof onProgress === 'function') onProgress(10, 'Reading file list...');

  const manifestRaw = await downloadRawFile(app.fullName, app.branch, 'app.json');
  const manifest = JSON.parse(manifestRaw);
  const fileList = Array.isArray(manifest.files) && manifest.files.length > 0
    ? manifest.files
    : (await fetchRepositoryTree(app.fullName, app.branch))
        .filter(entry => entry.type === 'blob').map(entry => entry.path);

  if (typeof onProgress === 'function') onProgress(25, `Downloading ${fileList.length} source files...`);

  await Promise.all(fileList.map(async (path) => {
    const content = await downloadRawFile(app.fullName, app.branch, path);
    memoryFs.set(`./src/apps/${app.id}/${path}`, content);
  }));

  if (typeof onProgress === 'function') onProgress(80, 'Registering component into router...');

  const descriptor = {
    id: app.id,
    name: manifest.name || app.name,
    route: manifest.route || `/apps/${app.id}`,
    svgContent: manifest.svgContent || app.svgContent,
    type: manifest.type || 'sfc',
    entryFile: `./src/apps/${app.id}/${manifest.entry || 'index.vue'}`,
    files: manifest.files,
    params: manifest.params
  };

  if (router.hasRoute(app.id)) router.removeRoute(app.id);
  router.addRoute({
    name: app.id,
    path: descriptor.route,
    component: () => shellCompiler(descriptor)
  });

  memoryAppMeta.set(app.id, descriptor);

  if (typeof onProgress === 'function') onProgress(100, 'Activated!');
}

export function memoryUninstall(app, router) {
  for (const key of memoryFs.keys()) {
    if (key.startsWith(`./src/apps/${app.id}/`)) memoryFs.delete(key);
  }
  memoryAppMeta.delete(app.id);
  if (router.hasRoute(app.id)) router.removeRoute(app.id);
}

// Returns file content from the in-memory store, or null if not found.
// Always reads from window.__memoryFs so both module worlds see the same data.
export function memoryFsRead(path) {
  return window.__memoryFs?.get(path) ?? null;
}

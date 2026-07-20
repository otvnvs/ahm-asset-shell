// OPFS-backed applet installer for browser environments (SFC browser + Vite browser).
// Files are written to the Origin Private File System and served transparently by
// the service worker (sw.js) on subsequent page loads.
// AHM never uses this module.

import { downloadRawFile, fetchRepositoryTree } from './api.js';
import { opfsWrite, opfsRead, opfsDelete, opfsAvailable } from '../../lib/opfs.js';

const MANIFEST_PATH = 'src/apps/apps-installed.json';

async function readManifest() {
  const raw = await opfsRead(MANIFEST_PATH);
  if (!raw) return [];
  try { return JSON.parse(raw); } catch (_) { return []; }
}

async function writeManifest(apps) {
  await opfsWrite(MANIFEST_PATH, JSON.stringify(apps));
}

export function isOpfsAvailable() {
  return opfsAvailable();
}

export async function isOpfsInstalled(id) {
  const apps = await readManifest();
  return apps.some(a => a.id === id);
}

export async function getOpfsInstalledApps() {
  return await readManifest();
}

export async function opfsInstall(app, shellCompiler, router, onProgress) {
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
    // SW intercepts /src/apps/{id}/... — store under that path (no leading slash)
    await opfsWrite(`src/apps/${app.id}/${path}`, content);
  }));

  if (typeof onProgress === 'function') onProgress(80, 'Updating installed apps manifest...');

  const route = `/apps/${app.id}`;
  const descriptor = {
    id: app.id,
    name: manifest.name || app.name,
    route: manifest.route || route,
    svgContent: manifest.svgContent || app.svgContent,
    type: manifest.type || 'sfc',
    entryFile: `./src/apps/${app.id}/${manifest.entry || 'index.vue'}`,
    files: manifest.files,
    params: manifest.params
  };

  const apps = await readManifest();
  const filtered = apps.filter(a => a.id !== app.id);
  filtered.push(descriptor);
  await writeManifest(filtered);

  if (typeof onProgress === 'function') onProgress(90, 'Registering component into router...');

  if (router.hasRoute(app.id)) router.removeRoute(app.id);
  router.addRoute({
    name: app.id,
    path: descriptor.route,
    component: () => shellCompiler(descriptor)
  });

  if (typeof onProgress === 'function') onProgress(100, 'Activated!');
}

export async function opfsUninstall(app, router) {
  await opfsDelete(`src/apps/${app.id}`);

  const apps = await readManifest();
  await writeManifest(apps.filter(a => a.id !== app.id));

  if (router.hasRoute(app.id)) router.removeRoute(app.id);
}

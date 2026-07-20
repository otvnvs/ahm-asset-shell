import * as Vue from 'vue';
import * as VueRouter from 'vue-router';
import Main from './Main.vue';
import router, { registerDynamicApps } from './router/index.js';
import { DEFAULT_APP_ICON } from './lib/shell/constants.js';
import { createViteLoader } from './lib/viteLoader.js';
import { createAppLoader } from './lib/appLoader.js';
import { isAndroidHybrid } from './lib/fs/index.js';
import { isOpfsAvailable, getOpfsInstalledApps } from './apps/marketplace/opfsInstaller.js';

window.__ahmVue__ = Vue;
window.__ahmVueRouter__ = VueRouter;

async function registerSW() {
  if (!('serviceWorker' in navigator)) return;
  if (await isAndroidHybrid()) return;
  try {
    await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    await navigator.serviceWorker.ready;
    // Tell the SW we're running under Vite — it should pass .vue files through
    // to Vite for server-side transformation, but still serve compiled .js/.css/.html
    // from OPFS so runtime-installed vue-dist/dom-module/iframe applets can load.
    navigator.serviceWorker.controller?.postMessage({ type: 'VITE_DEV' });
  } catch (err) {
    console.warn('Service worker registration failed:', err);
  }
}

async function discoverStaticApps() {
  // Discover all applets that have an app.json, regardless of whether they
  // have an index.vue. This covers vue-dist, dom-module, and iframe applets
  // that only ship compiled dist/ output.
  const appManifests = import.meta.glob('./apps/*/app.json', { eager: true });

  return Object.keys(appManifests).map(manifestKey => {
    const id = manifestKey.split('/')[2];
    const manifest = appManifests[manifestKey]?.default || appManifests[manifestKey] || {};
    const entryFile = manifest.entry ? `./src/apps/${id}/${manifest.entry}` : `./src/apps/${id}/index.vue`;
    return {
      id,
      name: manifest.name || id,
      route: manifest.route || `/apps/${id}`,
      svgContent: manifest.svgContent || DEFAULT_APP_ICON,
      type: manifest.type || 'sfc',
      entryFile,
      files: manifest.files,
      params: manifest.params
    };
  });
}

async function discoverOpfsApps() {
  if (!isOpfsAvailable()) return [];
  try {
    return await getOpfsInstalledApps();
  } catch (err) {
    console.warn('Failed to read OPFS installed apps:', err);
    return [];
  }
}

registerSW().then(async () => {
  const app = Vue.createApp(Main);
  app.use(router);

  const staticApps = await discoverStaticApps();
  const opfsApps = await discoverOpfsApps();

  // Merge static and OPFS apps. Static applets take precedence in Vite dev mode
  // so local source edits are not shadowed by an older OPFS copy.
  const staticIds = new Set(staticApps.map(a => a.id));
  const discoveredApps = [
    ...staticApps,
    ...opfsApps.filter(a => !staticIds.has(a.id))
  ];

  // Glob-first loader: serves known applets from the static map, falls back to
  // vue3-sfc-loader for applets installed at runtime after Vite startup.
  const appModules = import.meta.glob('./apps/*/index.vue');
  const loadSfc = createViteLoader(appModules);
  const loadAppComponent = createAppLoader({ loadSfc });
  app.provide('shellCompiler', loadAppComponent);

  // Register dynamic routes before mounting so a hard refresh to a deep URL
  // (e.g. #/apps/marketplace) resolves correctly on the first navigation.
  registerDynamicApps(discoveredApps, loadAppComponent);

  app.mount('#app');

  // Force a fresh navigation after dynamic routes are registered.
  // Without this, Vue Router's initial navigation completes before addRoute
  // makes the new routes visible to the matcher, causing a blank page on refresh.
  router.isReady().then(() => router.replace(router.currentRoute.value.fullPath));

  if (import.meta.hot) {
    window.__vite_hmr_applet__ = (cb) => import.meta.hot.on('applet-list-changed', cb);
  }
});

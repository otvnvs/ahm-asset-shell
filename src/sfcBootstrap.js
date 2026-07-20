import { loadModule } from '../lib/vue3-sfc-loader/vue3-sfc-loader.esm.js';
import * as Vue from '../lib/vue/vue.esm-browser.prod.js';
import { scanForApps } from './lib/shell/index.js';
import { createSfcOptions } from './lib/sfcLoaderOptions.js';
import { createAppLoader } from './lib/appLoader.js';
import { combinedFsRead } from './lib/fsRead.js';

window.__ahmVue__ = Vue;

export async function bootstrapSfcApp() {
  window.Vue = Vue;

  const routerRes = await fetch('./lib/vue-router/vue-router.global.prod.js');
  if (!routerRes.ok) throw new Error("Router failed");

  const routerCode = await routerRes.text();
  const script = document.createElement('script');
  script.textContent = routerCode;
  document.head.appendChild(script);

  const VueRouter = window.VueRouter;
  window.__ahmVueRouter__ = VueRouter;

  const unifiedCache = Object.create(null);
  unifiedCache['vue'] = Vue;
  unifiedCache['vue-router'] = VueRouter;

  const options = createSfcOptions(unifiedCache, combinedFsRead);

  const loadSfc = (filePath) => loadModule(filePath, options);
  const loadAppComponent = createAppLoader({ loadSfc });

  const MainComponent = await loadModule('./src/Main.vue', options);
  let routerModule = null;
  try {
    routerModule = await loadModule('./src/router/index.js', options);
    if (routerModule && routerModule.registerDynamicApps) {
      const discoveredApps = await scanForApps();
      routerModule.registerDynamicApps(discoveredApps, loadAppComponent);
    }
  } catch (err) {
    console.error("Dynamic route initialization failed:", err);
  }
  return {
    createApp: Vue.createApp,
    Main: MainComponent,
    router: routerModule && routerModule.default ? routerModule.default : null,
    compilerFactory: loadAppComponent
  };
}

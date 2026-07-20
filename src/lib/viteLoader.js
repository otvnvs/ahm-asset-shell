import { loadModule } from '../../lib/vue3-sfc-loader/vue3-sfc-loader.esm.js';
import * as Vue from 'vue';
import * as VueRouter from 'vue-router';
import { createSfcOptions } from './sfcLoaderOptions.js';
import { combinedFsRead } from './fsRead.js';

let sfcOptions = null;

function getSfcOptions() {
  if (sfcOptions) return sfcOptions;
  const moduleCache = Object.create(null);
  moduleCache['vue'] = Vue;
  moduleCache['vue-router'] = VueRouter;
  sfcOptions = createSfcOptions(moduleCache, combinedFsRead);
  return sfcOptions;
}

// Returns an async component loader for Vite dev mode.
// Known applets (present at startup) are served from the static glob map — zero overhead.
// Applets installed at runtime fall back to vue3-sfc-loader via fetch().
export function createViteLoader(globMap) {
  return function loadComponent(filePath) {
    if (globMap[filePath]) {
      return globMap[filePath]();
    }
    // Normalize ./src/apps/... → ./apps/... to match Vite glob keys.
    // discoverStaticApps and scanForApps both produce ./src/apps/{id}/index.vue
    // but Vite's import.meta.glob('./apps/*/index.vue') keys are ./apps/{id}/index.vue.
    const normalized = filePath.replace(/^\.\//, '').replace(/^src\//, './');
    if (globMap[normalized]) {
      return globMap[normalized]();
    }
    return loadModule(filePath, getSfcOptions());
  };
}

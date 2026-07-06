//import { loadModule } from '../lib/vue3-sfc-loader/vue3-sfc-loader.esm.js';
//import * as Vue from 'vue';//../lib/vue/vue.esm-browser.prod.js';
//import { scanForApps } from './lib/shell/index.js'; // Preserved layout scanning logic
//
//export async function bootstrapSfcApp() {
//  window.Vue = Vue;
//  window.__sfc_trace__ = { ts: new Date().toISOString(), al: [], ff: {}, dg: {} };
//  const logT = (s, d) => window.__sfc_trace__.al.push({ t: performance.now().toFixed(0), s, d });
//  logT('bi', 'Init stack');
//
//  const routerRes = await fetch('./lib/vue-router/vue-router.global.prod.js');
//  if (!routerRes.ok) throw new Error("Router failed");
//  const routerCode = await routerRes.text();
//  const script = document.createElement('script');
//  script.textContent = routerCode;
//  document.head.appendChild(script);
//
//  const VueRouter = window.VueRouter;
//  const unifiedCache = Object.create(null);
//  unifiedCache['vue'] = Vue;
//  unifiedCache['vue-router'] = VueRouter;
//
//  const options = {
//    moduleCache: unifiedCache,
//    async getFile(url) {
//      logT('gfr', url);
//      const res = await fetch(url);
//      if (!res.ok) throw new Error(`404:${url}`);
//      const content = await res.text();
//      window.__sfc_trace__.ff[url] = { s: 'ok', z: content.length };
//      if (url.endsWith('.js')) {
//        return { getContentData: () => content, type: '.mjs' };
//      }
//      return { getContentData: (asB) => asB ? res.arrayBuffer() : content };
//    },
//    addStyle(styleStr) {
//      const style = document.createElement('style');
//      style.textContent = styleStr;
//      document.head.appendChild(style);
//    },
//    pathResolve({ refPath, relPath }) {
//      if (relPath === '.' || relPath === './') return refPath || './src/';
//      if (relPath === 'vue' || relPath === 'vue-router') return relPath;
//      let resolved = relPath;
//      if (relPath.startsWith('.')) {
//        const base = refPath ? refPath.substring(0, refPath.lastIndexOf('/') + 1) : (relPath.startsWith('./src/') ? './' : './src/');
//        resolved = base + relPath;
//      }
//      resolved = resolved.replace(/\/\.\//g, '/'); // Fixed regex safety
//      if (!resolved.startsWith('./') && !resolved.startsWith('http')) resolved = './' + resolved;
//      const k = refPath || 'root';
//      if (!window.__sfc_trace__.dg[k]) window.__sfc_trace__.dg[k] = [];
//      window.__sfc_trace__.dg[k].push({ q: relPath, r: resolved });
//      logT('psv', `${k}|${relPath}->${resolved}`);
//      return resolved;
//    },
////    async handleModule(type, getContentData, path, options) {
////      return undefined;
////    }
//
//async handleModule(type, getContentData, path, options) {
//  // Catch JSON extensions manually
//  if (path.endsWith('.json')) {
//    const jsonText = await getContentData(false);
//    return JSON.parse(jsonText);
//  }
//  return undefined; 
//}
//
//
//  };
//
//  window.sfcLoaderOptions = options;
//
//  logT('lmv', 'Load Main.vue');
//  const MainComponent = await loadModule('./src/Main.vue', options);
//
//  let routerModule = null;
//  try {
//    logT('lmr', 'Load router');
//    routerModule = await loadModule('./src/router/index.js', options);
//
//	  // LINK COMPILER ACTION: Expose the unified loader context safely to your global state framework
//
//    // DYNAMIC INJECTION: Intercept, scan filesystem, and populate routes at runtime
//    if (routerModule && routerModule.registerDynamicApps) {
//      logT('las', 'Scanning for sub-applications');
//      const discoveredApps = await scanForApps();
//      
//      logT('rda', 'Registering dynamic apps into router module');
//      // Pass the loader factory down so components parse inside the unified cache context
//      routerModule.registerDynamicApps(discoveredApps, (filePath) => loadModule(filePath, options));
//    }
//  } catch (err) {
//    logT('rsk', err.message);
//    console.error("Dynamic route initialization failed:", err);
//  }
//
//  return {
//    createApp: Vue.createApp,
//    Main: MainComponent,
//    router: routerModule && routerModule.default ? routerModule.default : null,
//    // Safely binds the compiler scope factory to the core boot instance
//    compilerFactory: (filePath) => loadModule(filePath, options)
//  };
//}
//--------------------------------------------------------------------------------
import { loadModule } from '../lib/vue3-sfc-loader/vue3-sfc-loader.esm.js';
import * as Vue from 'vue';
import { scanForApps } from './lib/shell/index.js';

export async function bootstrapSfcApp() {
  window.Vue = Vue;
  window.__sfc_trace__ = { ts: new Date().toISOString(), al: [], ff: {}, dg: {} };
  
  const logT = (s, d) => window.__sfc_trace__.al.push({ t: performance.now().toFixed(0), s, d });
  logT('bi', 'Init stack');

  const routerRes = await fetch('./lib/vue-router/vue-router.global.prod.js');
  if (!routerRes.ok) throw new Error("Router failed");
  
  const routerCode = await routerRes.text();
  const script = document.createElement('script');
  script.textContent = routerCode;
  document.head.appendChild(script);
  
  const VueRouter = window.VueRouter;
  const unifiedCache = Object.create(null);
  unifiedCache['vue'] = Vue;
  unifiedCache['vue-router'] = VueRouter;

  const options = {
    moduleCache: unifiedCache,
    async getFile(url) {
      logT('gfr', url);
      const res = await fetch(url);
      if (!res.ok) throw new Error(`404:${url}`);
      const content = await res.text();
      window.__sfc_trace__.ff[url] = { s: 'ok', z: content.length };
      if (url.endsWith('.js')) {
        return {
          getContentData: () => content,
          type: '.mjs'
        };
      }
      return { getContentData: (asB) => asB ? res.arrayBuffer() : content };
    },
    addStyle(styleStr) {
      const style = document.createElement('style');
      style.textContent = styleStr;
      document.head.appendChild(style);
    },
//    pathResolve({ refPath, relPath }) {
//      if (relPath === '.' || relPath === './') return refPath || './src/';
//      if (relPath === 'vue' || relPath === 'vue-router') return relPath;
//      
//      let resolved = relPath;
//      if (relPath.startsWith('.')) {
//        const base = refPath ? refPath.substring(0, refPath.lastIndexOf('/') + 1) : (relPath.startsWith('./src/') ? './' : './src/');
//        resolved = base + relPath;
//      }
//      
//      // 🌟 FIXED THE SYNTAX GLITCH HERE: 
//      // Safely cleans duplicate internal routing periods (e.g., /./ becomes /)
//      resolved = resolved.replace(/\/\.\//g, '/');
//      
//      if (!resolved.startsWith('./') && !resolved.startsWith('http')) {
//        resolved = './' + resolved;
//      }
//      
//      const k = refPath || 'root';
//      if (!window.__sfc_trace__.dg[k]) window.__sfc_trace__.dg[k] = [];
//      window.__sfc_trace__.dg[k].push({ q: relPath, r: resolved });
//      logT('psv', `${k}|${relPath}->${resolved}`);
//      return resolved;
//    },
    pathResolve({ refPath, relPath }) {
      if (relPath === '.' || relPath === './') return refPath || './src/';
      if (relPath === 'vue' || relPath === 'vue-router') return relPath;
      
      let resolved = relPath;
      if (relPath.startsWith('.')) {
        const base = refPath ? refPath.substring(0, refPath.lastIndexOf('/') + 1) : (relPath.startsWith('./src/') ? './' : './src/');
        resolved = base + relPath;
      }
      
      // 🌟 FIXED 1: Safely cleans duplicate internal routing periods (e.g., /./ becomes /)
      resolved = resolved.replace(/\/\.\//g, '/');

      // 🌟 FIXED 2: Folds parent directory climbing paths (e.g., folder/sub/../ becomes folder/)
      // This loops until all dynamic sequential '..' items are cleanly collapsed
      while (resolved.includes('/../')) {
        resolved = resolved.replace(/[^\/]+\/\.\.\//, '');
      }
      
      if (!resolved.startsWith('./') && !resolved.startsWith('http')) {
        resolved = './' + resolved;
      }
      
      const k = refPath || 'root';
      if (!window.__sfc_trace__.dg[k]) window.__sfc_trace__.dg[k] = [];
      window.__sfc_trace__.dg[k].push({ q: relPath, r: resolved });
      logT('psv', `${k}|${relPath}->${resolved}`);
      return resolved;
    },

    async handleModule(type, getContentData, path, options) {
      if (path.endsWith('.json')) {
        const jsonText = await getContentData(false);
        return JSON.parse(jsonText);
      }
      return undefined;
    }
  };

  window.sfcLoaderOptions = options;
  logT('lmv', 'Load Main.vue');
  const MainComponent = await loadModule('./src/Main.vue', options);
  let routerModule = null;
  try {
    logT('lmr', 'Load router');
    routerModule = await loadModule('./src/router/index.js', options);
    if (routerModule && routerModule.registerDynamicApps) {
      logT('las', 'Scanning for sub-applications');
      const discoveredApps = await scanForApps();
      logT('rda', 'Registering dynamic apps into router module');
      routerModule.registerDynamicApps(discoveredApps, (filePath) => loadModule(filePath, options));
    }
  } catch (err) {
    logT('rsk', err.message);
    console.error("Dynamic route initialization failed:", err);
  }
  return {
    createApp: Vue.createApp,
    Main: MainComponent,
    router: routerModule && routerModule.default ? routerModule.default : null,
    compilerFactory: (filePath) => loadModule(filePath, options)
  };
}


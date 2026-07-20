// Factory that produces vue3-sfc-loader options for a given moduleCache.
// Used by sfcBootstrap.js (SFC/runtime mode) and viteLoader.js (Vite fallback).
// Pass an fsRead function to serve files from a custom store before falling back
// to network fetch. fsRead(key) may return a string, null, or a Promise of either.
// Used for in-memory installs (memoryFsRead) and OPFS installs (opfsRead).
export function createSfcOptions(moduleCache, fsRead = null) {
  return {
    moduleCache,

    async getFile(url) {
      // Check custom fs store first (memory or OPFS).
      // The SFC loader passes fully-qualified URLs (http://host/src/apps/...)
      // but store keys are relative paths (./src/apps/...).
      // Strip the origin so the lookup matches.
      if (fsRead) {
        let lookupKey = url;
        try {
          const parsed = new URL(url);
          lookupKey = '.' + parsed.pathname;
        } catch (_) { /* url is already relative */ }
        const cached = await fsRead(lookupKey);
        if (cached !== null) {
          if (url.endsWith('.js')) return { getContentData: () => cached, type: '.mjs' };
          return { getContentData: (asB) => asB ? new TextEncoder().encode(cached).buffer : cached };
        }
      }

      const res = await fetch(url);
      if (!res.ok) throw new Error(`404:${url}`);
      const content = await res.text();
      if (url.endsWith('.js')) {
        return { getContentData: () => content, type: '.mjs' };
      }
      return { getContentData: (asB) => asB ? res.arrayBuffer() : content };
    },

    addStyle(styleStr) {
      const style = document.createElement('style');
      style.textContent = styleStr;
      document.head.appendChild(style);
    },

    pathResolve({ refPath, relPath }) {
      if (relPath === '.' || relPath === './') return refPath || './src/';
      if (relPath === 'vue' || relPath === 'vue-router') return relPath;

      let resolved = relPath;
      if (relPath.startsWith('.')) {
        const base = refPath
          ? refPath.substring(0, refPath.lastIndexOf('/') + 1)
          : (relPath.startsWith('./src/') ? './' : './src/');
        resolved = base + relPath;
      }

      resolved = resolved.replace(/\/\.\//g, '/');

      while (resolved.includes('/../')) {
        resolved = resolved.replace(/[^/]+\/\.\.\//, '');
      }

      if (!resolved.startsWith('./') && !resolved.startsWith('http')) {
        resolved = './' + resolved;
      }

      return resolved;
    },

    async handleModule(type, getContentData, path) {
      if (path.endsWith('.json')) {
        const jsonText = await getContentData(false);
        return JSON.parse(jsonText);
      }
      return undefined;
    }
  };
}

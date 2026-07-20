// Pluggable applet loader registry.
// Turns an app descriptor (from app.json + shell scan) into a Vue route component.
// Built-in types: sfc, vue-dist, dom-module, iframe.

import { h } from 'vue';
import { combinedFsRead } from './fsRead.js';

const loaders = new Map();

export function registerAppLoader(type, factory) {
  loaders.set(type, factory);
}

export function createAppLoader(context) {
  return async function loadAppComponent(app) {
    const type = app.type || 'sfc';
    const factory = loaders.get(type) || loaders.get('sfc');
    if (!factory) {
      throw new Error(`No loader registered for applet type "${type}"`);
    }
    return factory(app, context);
  };
}

function resolveAppPath(app, relativePath) {
  if (relativePath.startsWith('/')) {
    return relativePath;
  }
  if (relativePath.startsWith('./')) {
    return '/' + relativePath.slice(2);
  }
  return `/src/apps/${app.id}/${relativePath}`;
}

// Read a file from runtime stores (OPFS first, then in-memory fallback).
// publicPath is the URL form returned by resolveAppPath, e.g.
// /src/apps/hello-lib/dist/index.js.
async function readFromStore(publicPath) {
  if (!publicPath) return null;
  const key = publicPath.startsWith('/') ? '.' + publicPath : publicPath;
  return combinedFsRead(key);
}

async function createBlobUrl(publicPath, mimeType) {
  const content = await readFromStore(publicPath);
  if (content === null) return null;
  const blob = new Blob([content], { type: mimeType });
  return URL.createObjectURL(blob);
}

async function injectAppCss(app) {
  if (!Array.isArray(app.files)) return;

  for (const file of app.files) {
    if (!file.endsWith('.css')) continue;
    const href = resolveAppPath(app, file);
    const content = await readFromStore(href);
    if (content !== null) {
      const style = document.createElement('style');
      style.textContent = content;
      document.head.appendChild(style);
      continue;
    }

    const selector = `link[rel="stylesheet"][href="${href}"]`;
    if (document.querySelector(selector)) continue;

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    document.head.appendChild(link);
  }
}

async function loadSfcApp(app, context) {
  if (!context.loadSfc) {
    throw new Error('SFC loader not configured in app loader context');
  }
  return context.loadSfc(app.entryFile);
}

async function loadVueDistApp(app) {
  const entryUrl = resolveAppPath(app, app.entryFile);
  const blobUrl = await createBlobUrl(entryUrl, 'application/javascript');
  const module = await import(blobUrl || entryUrl);
  if (blobUrl) URL.revokeObjectURL(blobUrl);
  await injectAppCss(app);
  return module.default || module;
}

function loadDomModuleApp(app) {
  const entryUrl = resolveAppPath(app, app.entryFile);
  let modulePromise = null;

  return {
    data() {
      return {
        containerId: `ahm-app-${app.id}-${Date.now()}`
      };
    },
    async mounted() {
      await injectAppCss(app);
      if (!modulePromise) {
        const blobUrl = await createBlobUrl(entryUrl, 'application/javascript');
        modulePromise = import(blobUrl || entryUrl).finally(() => {
          if (blobUrl) URL.revokeObjectURL(blobUrl);
        });
      }
      const module = await modulePromise;
      const mount = module.mount || module.default;
      if (typeof mount === 'function') {
        mount({
          containerId: this.containerId,
          container: document.getElementById(this.containerId),
          params: app.params || {}
        });
      }
    },
    async beforeUnmount() {
      if (!modulePromise) return;
      const module = await modulePromise;
      if (typeof module.unmount === 'function') {
        module.unmount({ containerId: this.containerId });
      }
    },
    render() {
      return h('div', {
        id: this.containerId,
        style: {
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%'
        }
      });
    }
  };
}

function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normalizePath(path) {
  const parts = path.split('/');
  const out = [];
  for (const part of parts) {
    if (part === '' || part === '.') continue;
    if (part === '..') {
      out.pop();
    } else {
      out.push(part);
    }
  }
  return out.join('/');
}

function getEntryDir(app) {
  let entry = app.entryFile;
  const prefixes = [`./src/apps/${app.id}/`, `/src/apps/${app.id}/`];
  for (const prefix of prefixes) {
    if (entry.startsWith(prefix)) {
      entry = entry.slice(prefix.length);
      break;
    }
  }
  return entry.replace(/[^/]+$/, '');
}

async function buildIframeSrc(app, html) {
  const entryDir = getEntryDir(app);
  const fileSet = new Set(app.files || []);
  const blobUrls = [];

  async function blobFor(relativePath) {
    const publicPath = resolveAppPath(app, relativePath);
    const content = await readFromStore(publicPath);
    if (content === null) return null;
    const ext = relativePath.split('.').pop();
    const mime = ext === 'js' || ext === 'mjs'
      ? 'application/javascript'
      : ext === 'css'
        ? 'text/css'
        : 'text/plain';
    const blob = URL.createObjectURL(new Blob([content], { type: mime }));
    blobUrls.push(blob);
    return blob;
  }

  function resolveRelative(url) {
    if (/^[a-z][a-z0-9+.-]*:/i.test(url)) return null;
    return normalizePath(entryDir + url.replace(/^\.\//, ''));
  }

  const references = new Set();
  html.replace(/(?:src|href)=["']([^"']+)["']/gi, (_, url) => {
    const resolved = resolveRelative(url);
    if (resolved && fileSet.has(resolved)) references.add(url);
  });

  const replacements = {};
  for (const url of references) {
    const resolved = resolveRelative(url);
    const blob = await blobFor(resolved);
    if (blob) replacements[url] = blob;
  }

  let rewritten = html;
  for (const [url, blob] of Object.entries(replacements)) {
    const pattern = new RegExp(`((?:src|href)=["'])${escapeRegex(url)}(["'])`, 'g');
    rewritten = rewritten.replace(pattern, `$1${blob}$2`);
  }

  // Blob URLs are same-origin; strip crossorigin attributes so they don't
  // trigger CORS checks on browsers that are strict about anonymous blob loads.
  rewritten = rewritten.replace(/\scrossorigin(?:=["'][^"']*["'])?/gi, '');

  const src = URL.createObjectURL(new Blob([rewritten], { type: 'text/html' }));
  blobUrls.push(src);
  return {
    src,
    revoke() {
      for (const url of blobUrls) URL.revokeObjectURL(url);
    }
  };
}

async function loadIframeApp(app) {
  const src = resolveAppPath(app, app.entryFile);
  const html = await readFromStore(src);
  let iframeSrc = src;
  let revoke = null;
  if (html !== null) {
    const built = await buildIframeSrc(app, html);
    iframeSrc = built.src;
    revoke = built.revoke;
  }

  return {
    render() {
      return h('iframe', {
        src: iframeSrc,
        style: {
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          border: 'none'
        }
      });
    },
    beforeUnmount() {
      if (revoke) revoke();
    }
  };
}

registerAppLoader('sfc', loadSfcApp);
registerAppLoader('vue-dist', loadVueDistApp);
registerAppLoader('dom-module', loadDomModuleApp);
registerAppLoader('iframe', loadIframeApp);

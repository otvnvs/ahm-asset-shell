import { bootstrapSfcApp } from './sfcBootstrap.js';
import { isAndroidHybrid } from './lib/fs/index.js';
import style from './style.css' with { type: 'css' };
document.adoptedStyleSheets = [...document.adoptedStyleSheets, style];

async function registerSW() {
  if (!('serviceWorker' in navigator)) return;
  if (await isAndroidHybrid()) return;
  try {
    await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    await navigator.serviceWorker.ready;
  } catch (err) {
    console.warn('Service worker registration failed:', err);
  }
}

registerSW().then(() =>
  bootstrapSfcApp().then(({ createApp, Main, router, compilerFactory }) => {
    const app = createApp(Main);
    if (router) app.use(router);
    app.provide('shellCompiler', compilerFactory);
    app.mount('#app');
  })
).catch(err => console.error('App initialization failed:', err));


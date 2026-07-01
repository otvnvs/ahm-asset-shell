import { createRouter, createWebHashHistory } from 'vue-router';
import Home from '../views/home/index.vue';

const routes = [
  { path: '/', redirect: '/home' },
  { name: 'home', path: '/home', component: Home }
];

const router = createRouter({
  history: createWebHashHistory(),
  routes
});

/**
 * Dynamically injects scanned sub-applications into the active router instance.
 * Supports both Vite compile-time paths and sfc-loader runtime resolution.
 * @param {Array} appsList - Array of parsed sub-app definitions from scanForApps()
 * @param {Function} componentLoader - Loader function to compile .vue files on the fly
 */
export function registerDynamicApps(appsList, componentLoader) {
  appsList.forEach(app => {
    // 1. Remove route collision duplication if it was registered during a hot reload
    if (router.hasRoute(app.id)) {
      router.removeRoute(app.id);
    }

    // 2. Add the dynamic route structure to the router instance
    router.addRoute({
      name: app.id,
      path: app.route,
      // The component resolver dynamically fetches and compiles the target entry file
      component: () => componentLoader(app.entryFile)
    });
  });
}

export default router;


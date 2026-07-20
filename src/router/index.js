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

export function registerDynamicApps(appsList, componentLoader) {
  appsList.forEach(app => {
    if (router.hasRoute(app.id)) {
      router.removeRoute(app.id);
    }
    router.addRoute({
      name: app.id,
      path: app.route,
      component: () => componentLoader(app)
    });
  });

  // Catch-all added last so it never shadows any real route.
  // Handles unknown routes (e.g. in-memory app gone after page reload).
  if (router.hasRoute('not-found')) router.removeRoute('not-found');
  router.addRoute({ name: 'not-found', path: '/:pathMatch(.*)*', redirect: '/home' });
}

export default router;


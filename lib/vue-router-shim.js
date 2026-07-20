// Vue Router shim for compiled applets.
// The shell sets window.__ahmVueRouter__ to its Vue Router instance; this
// module re-exports the common Vue Router APIs so that vue-dist applets share
// the same router singleton as the shell.

const _router = () => window.__ahmVueRouter__;

export default new Proxy({}, {
  get: (_, prop) => _router()?.[prop]
});

export const createRouter = (...args) => _router().createRouter(...args);
export const createWebHashHistory = (...args) => _router().createWebHashHistory(...args);
export const createWebHistory = (...args) => _router().createWebHistory(...args);
export const createMemoryHistory = (...args) => _router().createMemoryHistory(...args);
export const useRouter = (...args) => _router().useRouter(...args);
export const useRoute = (...args) => _router().useRoute(...args);
export const RouterLink = () => _router().RouterLink;
export const RouterView = () => _router().RouterView;
export const onBeforeRouteLeave = (...args) => _router().onBeforeRouteLeave(...args);
export const onBeforeRouteUpdate = (...args) => _router().onBeforeRouteUpdate(...args);

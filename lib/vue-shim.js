// Vue shim for compiled applets.
// The shell sets window.__ahmVue__ to its Vue instance; this module re-exports
// the common Vue APIs so that dynamically-imported vue-dist applets share the
// same Vue singleton as the shell in all modes (SFC, Vite dev, AHM).

const _vue = () => window.__ahmVue__;

export default new Proxy({}, {
  get: (_, prop) => _vue()?.[prop]
});

// Core reactivity
export const ref = (...args) => _vue().ref(...args);
export const shallowRef = (...args) => _vue().shallowRef(...args);
export const reactive = (...args) => _vue().reactive(...args);
export const readonly = (...args) => _vue().readonly(...args);
export const shallowReactive = (...args) => _vue().shallowReactive(...args);
export const shallowReadonly = (...args) => _vue().shallowReadonly(...args);
export const computed = (...args) => _vue().computed(...args);
export const watch = (...args) => _vue().watch(...args);
export const watchEffect = (...args) => _vue().watchEffect(...args);
export const watchPostEffect = (...args) => _vue().watchPostEffect(...args);
export const watchSyncEffect = (...args) => _vue().watchSyncEffect(...args);
export const toRef = (...args) => _vue().toRef(...args);
export const toRefs = (...args) => _vue().toRefs(...args);
export const toRaw = (...args) => _vue().toRaw(...args);
export const markRaw = (...args) => _vue().markRaw(...args);
export const unref = (...args) => _vue().unref(...args);
export const isRef = (...args) => _vue().isRef(...args);
export const isReactive = (...args) => _vue().isReactive(...args);
export const isReadonly = (...args) => _vue().isReadonly(...args);
export const isProxy = (...args) => _vue().isProxy(...args);
export const triggerRef = (...args) => _vue().triggerRef(...args);
export const customRef = (...args) => _vue().customRef(...args);
export const effectScope = (...args) => _vue().effectScope(...args);
export const getCurrentScope = (...args) => _vue().getCurrentScope(...args);

// App / component
export const createApp = (...args) => _vue().createApp(...args);
export const createSSRApp = (...args) => _vue().createSSRApp(...args);
export const defineComponent = (...args) => _vue().defineComponent(...args);
export const defineAsyncComponent = (...args) => _vue().defineAsyncComponent(...args);
export const resolveComponent = (...args) => _vue().resolveComponent(...args);
export const resolveDirective = (...args) => _vue().resolveDirective(...args);
export const resolveDynamicComponent = (...args) => _vue().resolveDynamicComponent(...args);
export const getCurrentInstance = (...args) => _vue().getCurrentInstance(...args);
export const nextTick = (...args) => _vue().nextTick(...args);

// Lifecycle
export const onMounted = (...args) => _vue().onMounted(...args);
export const onUnmounted = (...args) => _vue().onUnmounted(...args);
export const onBeforeMount = (...args) => _vue().onBeforeMount(...args);
export const onBeforeUnmount = (...args) => _vue().onBeforeUnmount(...args);
export const onUpdated = (...args) => _vue().onUpdated(...args);
export const onBeforeUpdate = (...args) => _vue().onBeforeUpdate(...args);
export const onErrorCaptured = (...args) => _vue().onErrorCaptured(...args);
export const onActivated = (...args) => _vue().onActivated(...args);
export const onDeactivated = (...args) => _vue().onDeactivated(...args);
export const onRenderTracked = (...args) => _vue().onRenderTracked(...args);
export const onRenderTriggered = (...args) => _vue().onRenderTriggered(...args);

// VNode / render helpers
export const h = (...args) => _vue().h(...args);
export const createVNode = (...args) => _vue().createVNode(...args);
export const cloneVNode = (...args) => _vue().cloneVNode(...args);
export const createElementVNode = (...args) => _vue().createElementVNode(...args);
export const createElementBlock = (...args) => _vue().createElementBlock(...args);
export const createBlock = (...args) => _vue().createBlock(...args);
export const openBlock = (...args) => _vue().openBlock(...args);
export const createTextVNode = (...args) => _vue().createTextVNode(...args);
export const createCommentVNode = (...args) => _vue().createCommentVNode(...args);
export const createStaticVNode = (...args) => _vue().createStaticVNode(...args);
export const renderList = (...args) => _vue().renderList(...args);
export const renderSlot = (...args) => _vue().renderSlot(...args);
export const createSlots = (...args) => _vue().createSlots(...args);
export const toDisplayString = (...args) => _vue().toDisplayString(...args);
export const normalizeClass = (...args) => _vue().normalizeClass(...args);
export const normalizeStyle = (...args) => _vue().normalizeStyle(...args);
export const guardReactiveProps = (...args) => _vue().guardReactiveProps(...args);
export const mergeProps = (...args) => _vue().mergeProps(...args);
export const withDirectives = (...args) => _vue().withDirectives(...args);
export const withModifiers = (...args) => _vue().withModifiers(...args);
export const withKeys = (...args) => _vue().withKeys(...args);
export const withCtx = (...args) => _vue().withCtx(...args);

// Injection
export const provide = (...args) => _vue().provide(...args);
export const inject = (...args) => _vue().inject(...args);

// Built-in components / symbols
export const Fragment = () => _vue().Fragment;
export const Text = () => _vue().Text;
export const Comment = () => _vue().Comment;
export const Static = () => _vue().Static;
export const Teleport = () => _vue().Teleport;
export const Suspense = () => _vue().Suspense;
export const KeepAlive = () => _vue().KeepAlive;
export const Transition = () => _vue().Transition;
export const TransitionGroup = () => _vue().TransitionGroup;
export const BaseTransition = () => _vue().BaseTransition;

// Model / show helpers
export const vModelText = (...args) => _vue().vModelText(...args);
export const vModelCheckbox = (...args) => _vue().vModelCheckbox(...args);
export const vModelRadio = (...args) => _vue().vModelRadio(...args);
export const vModelSelect = (...args) => _vue().vModelSelect(...args);
export const vModelDynamic = (...args) => _vue().vModelDynamic(...args);
export const vShow = (...args) => _vue().vShow(...args);

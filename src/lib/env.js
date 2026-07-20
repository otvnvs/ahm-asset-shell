// Returns true only when running under Vite's dev server.
// Safe in SFC/runtime mode where import.meta.env is not defined.
export function isViteDev() {
  return typeof import.meta !== 'undefined' && import.meta.env?.DEV === true;
}

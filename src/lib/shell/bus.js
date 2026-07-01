//import { ref } from '../../../lib/vue/vue.esm-browser.prod.js';
import { ref } from 'vue'

// Central reactive token tracking cross-module change events
const refreshToken = ref(0);

export const shellBus = {
  /**
   * Dispatches a runtime broadcast event to signal structural file variations.
   */
  emitRefresh() {
    refreshToken.value += 1;
    console.log(`[Shell Bus] Global refresh dispatched. Token incremented to: ${refreshToken.value}`);
  },

  /**
   * Returns the reactive token for the Home View dashboard to monitor.
   * @returns {import('vue').Ref<number>} Reactive counter reference.
   */
  getRefreshToken() {
    return refreshToken;
  }
};


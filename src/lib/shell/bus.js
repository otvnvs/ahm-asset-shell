import { ref } from 'vue'

const refreshToken = ref(0);

export const shellBus = {
  /**
   * Dispatches a runtime broadcast event to signal structural file variations.
   */
  emitRefresh() {
    refreshToken.value += 1;
  },

  /**
   * Returns the reactive token for the Home View dashboard to monitor.
   * @returns {import('vue').Ref<number>} Reactive counter reference.
   */
  getRefreshToken() {
    return refreshToken;
  }
};


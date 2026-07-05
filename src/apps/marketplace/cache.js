const ECOSYSTEM_CACHE_KEY = 'ahm-applet-marketplace';

export const marketplaceCache = {
  /**
   * Retrieves the stored array profile of remote repositories.
   * @returns {Array} An array of cached repository items or an empty list if uninitialized.
   */
  get() {
    try {
      const data = localStorage.getItem(ECOSYSTEM_CACHE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('[Cache Service] Failed parsing marketplace dataset:', error);
      return [];
    }
  },

  /**
   * Overwrites the persistent repository index cache.
   * @param {Array} repositoryList - Array of processed remote apps to preserve.
   */
  set(repositoryList) {
    try {
      if (!Array.isArray(repositoryList)) return;
      localStorage.setItem(ECOSYSTEM_CACHE_KEY, JSON.stringify(repositoryList));
    } catch (error) {
      console.error('[Cache Service] Failed writing structural records to localStorage:', error);
    }
  },

  /**
   * Clears the preserved marketplace ecosystem layout index cache.
   */
  clear() {
    localStorage.removeItem(ECOSYSTEM_CACHE_KEY);
  }
};


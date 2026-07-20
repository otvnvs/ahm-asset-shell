const CACHE_KEY = 'ahm-applet-marketplace-v2';

function emptyState() {
  return { pages: {}, staticEntries: [], lastScan: 0, currentPage: 0, hasMore: false, totalCount: 0 };
}

export const marketplaceCache = {
  load() {
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      const state = raw ? JSON.parse(raw) : null;
      if (!state || !state.pages) return emptyState();
      return state;
    } catch (_) {
      return emptyState();
    }
  },

  save(state) {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(state));
    } catch (_) { /* quota exceeded — silently skip */ }
  },

  getPage(state, page) {
    return state?.pages?.[page] || [];
  },

  setPage(state, page, entries) {
    if (!state.pages) state.pages = {};
    state.pages[page] = entries;
    state.currentPage = Math.max(state.currentPage || 0, page);
    state.lastScan = Date.now();
    this.save(state);
  },

  setStaticEntries(state, entries) {
    state.staticEntries = entries;
    this.save(state);
  },

  setPaginationMeta(state, { hasMore, totalCount }) {
    if (hasMore !== undefined) state.hasMore = hasMore;
    if (totalCount !== undefined) state.totalCount = totalCount;
    this.save(state);
  },

  clear() {
    localStorage.removeItem(CACHE_KEY);
  }
};

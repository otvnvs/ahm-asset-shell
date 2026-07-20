export const marketplaceConfig = {
  // Minimum time (ms) between GitHub API searches when cache is already populated.
  // If the cache was last scanned more recently than this, skip the GitHub API call
  // and use cached data instead. Prevents excessive API usage on repeated visits.
  githubThrottleMs: 5 * 60 * 1000, // 5 minutes

  // Number of results per page from GitHub search API
  pageSize: 5,

  // Concurrency limit for parallel manifest (app.json) fetches per page
  manifestConcurrency: 8,

  // Debounce delay (ms) for search input before triggering a new API search
  searchDebounceMs: 400
}

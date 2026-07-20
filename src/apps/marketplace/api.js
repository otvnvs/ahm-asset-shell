const GITHUB_API_BASE = 'https://api.github.com';
const GITHUB_RAW_BASE = 'https://raw.githubusercontent.com';
const DEFAULT_ICON = '<path d="M4 4h16v16H4z"></path>';

function githubError(response, fallback) {
  if (response.status === 403 || response.status === 429) {
    return new Error('GitHub API rate limit exceeded. Wait a minute and try again.');
  }
  return new Error(`${fallback}: ${response.status} ${response.statusText}`);
}

export async function fetchLocalMarketplaceManifest() {
  const localResponse = await fetch('/marketplace.json');
  if (!localResponse.ok) return null;
  const data = await localResponse.json();
  return Array.isArray(data) ? data : (data.items || []);
}

export async function fetchGitHubPage(page, perPage = 5, searchQuery = '') {
  const query = searchQuery
    ? `topic:ahm-applet ${searchQuery}`
    : 'topic:ahm-applet'
  const url = `${GITHUB_API_BASE}/search/repositories?q=${encodeURIComponent(query)}&per_page=${perPage}&page=${page}&sort=updated&order=desc`
  const response = await fetch(url)
  if (!response.ok) throw githubError(response, 'Network discovery dropped')
  const data = await response.json()
  const items = data.items || []
  const totalCount = data.total_count || 0
  const hasMore = page * perPage < totalCount && items.length === perPage
  return { items, hasMore, totalCount }
}

export async function enrichReposWithManifests(repos, concurrency = 8) {
  const results = [];
  let index = 0;

  async function worker() {
    while (index < repos.length) {
      const i = index++;
      const repo = repos[i];
      const branchName = repo.branch || repo.default_branch || 'main';
      const fullName = repo.full_name || repo.fullName;
      const owner = repo.owner?.login || repo.owner || '';
      const cleanSlug = repo.name.replace('ahm-applet-', '');
      const entry = {
        id: cleanSlug,
        name: cleanSlug,
        owner,
        fullName,
        branch: branchName,
        svgContent: DEFAULT_ICON
      };
      try {
        const manifest = await fetchAppManifest(fullName, branchName);
        if (manifest.name) entry.name = manifest.name;
        if (manifest.svgContent) entry.svgContent = manifest.svgContent;
      } catch (_) { /* keep defaults */ }
      results[i] = entry;
    }
  }

  const workerCount = Math.min(concurrency, repos.length);
  const workers = Array.from({ length: workerCount }, () => worker());
  await Promise.all(workers);
  return results;
}

export function normalizeStaticEntry(repo) {
  const branchName = repo.branch || repo.default_branch || 'main';
  const fullName = repo.full_name || repo.fullName;
  const owner = repo.owner?.login || repo.owner || '';
  const cleanSlug = repo.name?.replace('ahm-applet-', '') || repo.id;
  return {
    id: cleanSlug,
    name: repo.name || cleanSlug,
    owner,
    fullName,
    branch: branchName,
    svgContent: repo.svgContent || DEFAULT_ICON
  };
}

export async function fetchAppManifest(fullName, branch) {
  const response = await fetch(`${GITHUB_RAW_BASE}/${fullName}/${branch}/app.json`);
  if (!response.ok) throw githubError(response, 'Manifest unavailable');
  return await response.json();
}

export async function fetchRepositoryTree(fullName, branch) {
  const response = await fetch(`${GITHUB_API_BASE}/repos/${fullName}/git/trees/${branch}?recursive=1`);
  if (!response.ok) throw githubError(response, 'Failed to read source tree');
  const data = await response.json();
  return data.tree || [];
}

export async function downloadRawFile(fullName, branch, filePath) {
  const response = await fetch(`${GITHUB_RAW_BASE}/${fullName}/${branch}/${filePath}`);
  if (!response.ok) throw githubError(response, `File package stream failed: ${filePath}`);
  return await response.text();
}

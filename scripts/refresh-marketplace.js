// Regenerates marketplace.json from the public GitHub topic search.
// Run with: node scripts/refresh-marketplace.js
//
// This script does not require authentication, but unauthenticated search
// requests are rate-limited by GitHub (10 per minute). If you hit the limit,
// set a GITHUB_TOKEN environment variable.

const fs = require('fs');
const path = require('path');

const TOPIC = 'ahm-applet';
const PREFIX = 'ahm-applet-';
const OUTPUT = path.resolve(__dirname, '..', 'marketplace.json');
const GITHUB_API_BASE = 'https://api.github.com';

async function githubSearch(page = 1) {
  const url = new URL(`${GITHUB_API_BASE}/search/repositories`);
  url.searchParams.set('q', `topic:${TOPIC}`);
  url.searchParams.set('per_page', '100');
  url.searchParams.set('page', String(page));

  const headers = {};
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `token ${process.env.GITHUB_TOKEN}`;
  }

  const response = await fetch(url.toString(), { headers });
  if (!response.ok) {
    throw new Error(`GitHub search failed: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

function toTitleCase(slug) {
  return slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

async function main() {
  const allItems = [];
  let page = 1;

  while (page <= 10) {
    const data = await githubSearch(page);
    const items = data.items || [];
    if (items.length === 0) break;

    for (const item of items) {
      if (item.name && item.name.startsWith(PREFIX)) {
        allItems.push(item);
      }
    }

    if (items.length < 100) break;
    page++;
  }

  const manifest = allItems.map(repo => ({
    id: repo.name.slice(PREFIX.length),
    name: toTitleCase(repo.name.slice(PREFIX.length)),
    owner: repo.owner.login,
    fullName: repo.full_name,
    branch: repo.default_branch || 'main'
  }));

  manifest.sort((a, b) => a.name.localeCompare(b.name));

  fs.writeFileSync(OUTPUT, JSON.stringify(manifest, null, 2) + '\n');
  console.log(`Wrote ${manifest.length} applet repos to ${OUTPUT}`);
}

main().catch(err => {
  console.error(err.message);
  process.exit(1);
});

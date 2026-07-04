//https://github.com/otvnvs/ahm-applet-recorder/archive/refs/heads/main.zip

// src/lib/marketplace/api.js
//https://api.github.com/search/repositories?q=topic:ahm-applet
const GITHUB_API_BASE = 'https://api.github.com';
const RAW_CDN_BASE = 'https://raw.githubusercontent.com';

/**
 * Discovers repositories tagged with the custom applet topic.
 */
export async function fetchMarketplaceRepositories() {
  const searchUrl = `${GITHUB_API_BASE}/search/repositories?q=topic:ahm-applet`;
  const response = await fetch(searchUrl);
  if (!response.ok) throw new Error('Network discovery dropped');
  const data = await response.json();
  return data.items || [];
}

/**
 * Streams a raw app manifest package descriptor.
 */
export async function fetchAppManifest(fullName, branch) {
  const url = `${RAW_CDN_BASE}/${fullName}/${branch}/app.json`;
  const response = await fetch(url);
  if (!response.ok) throw new Error('Manifest unavailable');
  return await response.json();
}

/**
 * Queries GitHub's flat database tree recursively.
 */
export async function fetchRepositoryTree(fullName, branch) {
  const url = `${GITHUB_API_BASE}/repos/${fullName}/git/trees/${branch}?recursive=1`;
  console.log(url)
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to read source tree: ${response.statusText}`);
  const data = await response.json();
  return data.tree || [];
}

/**
 * Downloads a raw string body payload from a target file path.
 */
export async function downloadRawFile(fullName, branch, filePath) {
console.log('downloadRawFile(fullName, branch, filePath):');
  const url = `${RAW_CDN_BASE}/${fullName}/${branch}/${filePath}`;
console.log(url);
  const response = await fetch(url);
  if (!response.ok) throw new Error(`File package stream failed: ${filePath}`);
  return await response.text();
}
//--------------------------------------------------------------------------------
//// src/lib/marketplace/api.js
//const GITHUB_API_BASE = 'https://api.github.com';
//const RAW_CDN_BASE = 'https://raw.githubusercontent.com';
//const CACHE_KEY = 'ahm-applet-marketplace';
//
///**
// * Discovers repositories tagged with the custom applet topic.
// * Falls back to local storage cache if network operations fail.
// * Automatically saves new successful discoveries to cache.
// */
//export async function fetchMarketplaceRepositories() {
//  try {
//    const searchUrl = `${GITHUB_API_BASE}/search/repositories?q=topic:ahm-applet`;
//    const response = await fetch(searchUrl);
//    
//    if (!response.ok) {
//      throw new Error(`GitHub API returned status: ${response.status}`);
//    }
//    
//    const data = await response.json();
//    const repos = data.items || [];
//    
//    return { repos, isCachedData: false };
//  } catch (apiError) {
//    console.warn('Network discovery dropped or rate-limited. Pulling from local cache layer.', apiError);
//    
//    const cachedData = localStorage.getItem(CACHE_KEY);
//    if (cachedData) {
//      // Return parsed array wrapped inside a fallback status object flag
//      return { repos: JSON.parse(cachedData), isCachedData: true };
//    }
//    
//    // Bubble error up if both network and cache fail entirely
//    throw new Error('Application marketplace is unavailable offline (No cache present).');
//  }
//}
//
///**
// * Persists the structured and resolved application data array into cache.
// */
//export function saveMarketplaceCache(resolvedAppsList) {
//  try {
//    localStorage.setItem(CACHE_KEY, JSON.stringify(resolvedAppsList));
//  } catch (err) {
//    console.error('Failed writing workspace blocks to localStorage quota:', err);
//  }
//}
//
///**
// * Hydrates the UI immediately from local cache values on startup.
// */
//export function getInitialMarketplaceCache() {
//  const savedCache = localStorage.getItem(CACHE_KEY);
//  if (!savedCache) return [];
//  try {
//    return JSON.parse(savedCache);
//  } catch (e) {
//    console.error('Failed parsing initial cache structure:', e);
//    return [];
//  }
//}
//
///**
// * Streams a raw app manifest package descriptor.
// */
//export async function fetchAppManifest(fullName, branch) {
//  const url = `${RAW_CDN_BASE}/${fullName}/${branch}/app.json`;
//  const response = await fetch(url);
//  if (!response.ok) throw new Error('Manifest unavailable');
//  return await response.json();
//}
//
///**
// * Queries GitHub's flat database tree recursively.
// */
//export async function fetchRepositoryTree(fullName, branch) {
//  const url = `${GITHUB_API_BASE}/repos/${fullName}/git/trees/${branch}?recursive=1`;
//  const response = await fetch(url);
//  if (!response.ok) throw new Error(`Failed to read source tree: ${response.statusText}`);
//  const data = await response.json();
//  return data.tree || [];
//}
//
///**
// * Downloads a raw string body payload from a target file path.
// */
//export async function downloadRawFile(fullName, branch, filePath) {
//  const url = `${RAW_CDN_BASE}/${fullName}/${branch}/${filePath}`;
//  const response = await fetch(url);
//  if (!response.ok) throw new Error(`File package stream failed: ${filePath}`);
//  return await response.text();
//}
//

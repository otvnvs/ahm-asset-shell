<!--src/views/Marketplace.vue-->
<template>
  <div class="app-container">
    <header class="view-header">
      <button class="back-btn" @click="goHome">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="15 18 9 12 15 6"></polyline>
        </svg>
      </button>
      <h1 class="view-title">App Marketplace</h1>
    </header>

    <main class="content-body">

      <div class="search-zone">
        <div class="search-input-wrapper">
          <svg class="search-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search remote and local applets..."
            class="search-field"
          />
          <button v-if="searchQuery" @click="searchQuery = ''" class="clear-search-btn">
            &times;
          </button>
        </div>
      </div>

      <div v-if="errorMessage" class="error-banner">
        <span>{{ errorMessage }}</span>
        <button @click="errorMessage = ''" class="error-dismiss">&times;</button>
      </div>

      <div class="action-control-zone">
        <div v-if="globalInstallationActive" class="progress-container">
          <div class="progress-header">
            <span class="status-msg">{{globalStatusMessage}}</span>
            <span class="status-percent">{{globalProgressPercent}}%</span>
          </div>
          <div class="progress-track">
            <div class="progress-bar" :style="{ width: globalProgressPercent + '%' }"></div>
          </div>
        </div>
        <div v-if="totalCount > 0" class="scan-meta-row">
          <span class="loaded-count">{{ loadedCount }} of {{ totalCount }} applets</span>
        </div>
      </div>

      <div class="market-grid">
        <div v-for="app in filteredMarketplaceApps" :key="app.id" class="market-card" :class="{
              'card-expanding-progress': app.isInstalling || app.isUninstalling || app.statusError,
              'card-destructive-state': app.isUninstalling
            }">
          <div class="card-main-content">
            <div class="market-icon-frame">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="app-icon" v-html="app.svgContent"></svg>
            </div>
            <div class="market-meta">
              <span class="app-title">{{app.name}}</span>
              <span class="app-developer">by {{app.owner}}</span>
              <span v-if="app.isAlreadyInstalled && !app.isInstalling && !app.isUninstalling" class="installed-tag">Locally Installed</span>
            </div>
            <div class="action-button-group">
              <button v-if="app.isAlreadyInstalled && !app.isInstalling && !app.isUninstalling && !app.builtIn" class="uninstall-btn" @click.stop="handleAppUninstall(app)" title="Uninstall Applet">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="trash-icon">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
              </button>
              <button class="action-btn" :class="{ 'btn-success': app.isInstalled || app.isAlreadyInstalled }" @click="handleAppAction(app)" :disabled="app.isUninstalling || app.isInstalling">
                <span v-if="app.isInstalled || app.isAlreadyInstalled" class="success-content">
                  <svg class="check-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>Open
                </span>
                <span v-else-if="app.isInstalling">Loading...</span>
                <span v-else>{{ isHybrid || isOpfsAvailable() ? 'Install' : 'Load' }}</span>
              </button>
            </div>
          </div>
          <div v-if="app.isInstalling || app.isUninstalling || app.statusError" class="item-progress-zone">
            <div v-if="app.isInstalling || app.isUninstalling" class="item-progress-track">
              <div class="item-progress-bar" :class="{ 'bar-destructive': app.isUninstalling }" :style="{ width: app.progressPercent + '%' }"></div>
            </div>
            <span class="item-status-msg" :class="{ 'text-destructive': app.isUninstalling || app.statusError }">{{app.statusMessage}}</span>
          </div>
        </div>

        <div v-if="loading" class="loading-state">
          <div class="spinner"></div>
          <p>Fetching packages and checking local directories...</p>
        </div>

        <div v-if="(!filteredMarketplaceApps || filteredMarketplaceApps.length === 0) && !loading" class="empty-state">
          <span v-if="searchQuery">No uncompiled applets match your query.</span>
          <span v-else>Tap the scanning interface above to search for uncompiled packages.</span>
        </div>

        <div ref="scrollSentinel" class="scroll-sentinel">
          <div v-if="loadingMore" class="spinner"></div>
          <span v-else-if="!hasMorePages && currentPage > 0" class="end-message">
            All {{ totalCount }} applets loaded
          </span>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, inject } from 'vue'
import { useRouter } from 'vue-router'
import { DEFAULT_APP_ICON } from '../../lib/shell/constants.js'
import { fsApi, isAndroidHybrid } from '../../lib/fs/index.js'
import { fetchGitHubPage, enrichReposWithManifests, fetchLocalMarketplaceManifest, normalizeStaticEntry, fetchAppManifest } from './api.js'
import { installRepositoryToStorage } from './installer.js'
import { uninstallRepositoryFromStorage } from './uninstaller.js'
import { marketplaceCache } from './cache.js'
import { marketplaceConfig } from './config.js'
import { opfsInstall, opfsUninstall, isOpfsInstalled, getOpfsInstalledApps, isOpfsAvailable } from './opfsInstaller.js'
import { memoryInstall, memoryUninstall, isMemoryInstalled, getMemoryInstalledApps } from './memoryInstaller.js'

const router = useRouter()
const loading = ref(false)
const loadingMore = ref(false)
const searchQuery = ref('')
const marketplaceApps = ref([])
const shellCompiler = inject('shellCompiler')
const isHybrid = ref(false)

const currentPage = ref(0)
const hasMorePages = ref(false)
const totalCount = ref(0)
const scrollSentinel = ref(null)
let cacheState = marketplaceCache.load()
let observer = null

const searchResultsCache = new Map()
const errorMessage = ref('')
let errorDismissTimer = null

function showError(msg) {
  errorMessage.value = msg
  clearTimeout(errorDismissTimer)
  errorDismissTimer = setTimeout(() => { errorMessage.value = '' }, 6000)
}

const loadedCount = computed(() => marketplaceApps.value.filter(a => !a.isLocalOnly).length)

const installingApps = computed(() => marketplaceApps.value.filter(app => app.isInstalling))
const globalInstallationActive = computed(() => installingApps.value.length > 0)

const globalProgressPercent = computed(() => {
  const activeList = installingApps.value
  if (activeList.length === 0) return 0
  const totalSum = activeList.reduce((acc, app) => acc + app.progressPercent, 0)
  return Math.floor(totalSum / activeList.length)
})

const globalStatusMessage = computed(() => {
  const activeCount = installingApps.value.length
  return activeCount === 1 ? 'Installing 1 applet...' : `Processing ${activeCount} updates...`
})

const filteredMarketplaceApps = computed(() => {
  if (!searchQuery.value.trim()) return marketplaceApps.value
  const cleanQuery = searchQuery.value.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const fuzzyPattern = new RegExp(cleanQuery.split('').join('.*'), 'i')
  return marketplaceApps.value.filter(app => fuzzyPattern.test(app.name) || fuzzyPattern.test(app.id) || fuzzyPattern.test(app.owner))
})

onMounted(async () => {
  isHybrid.value = await isAndroidHybrid()
  await scanGitHubMarketplace()
  setupInfiniteScroll()
})

onUnmounted(() => {
  if (observer) {
    observer.disconnect()
    observer = null
  }
})

let searchDebounceTimer = null
watch(searchQuery, () => {
  clearTimeout(searchDebounceTimer)
  searchDebounceTimer = setTimeout(() => {
    scanGitHubMarketplace()
  }, marketplaceConfig.searchDebounceMs)
})

const resolveCurrentAppsDirectory = async () => {
  const webRootModifier = await fsApi.getWebRoot();
  return webRootModifier ? `${webRootModifier}/src/apps` : 'src/apps';
};

async function getInstalledIds() {
  const appsTargetDir = await resolveCurrentAppsDirectory()
  const localFsResponse = await fsApi.listDirectory(appsTargetDir)
  const localFolderNames = (localFsResponse && localFsResponse.files)
    ? localFsResponse.files.filter(f => f.isDirectory).map(f => f.name)
    : []
  const browserInstalledApps = isOpfsAvailable() ? await getOpfsInstalledApps() : getMemoryInstalledApps()
  const browserInstalledIds = new Set(browserInstalledApps.map(a => a.id))
  const installedIds = new Set([...localFolderNames, ...browserInstalledIds])
  return { localFolderNames, installedIds }
}

function makeCard(entry, installedIds, extra = {}) {
  return {
    ...entry,
    isAlreadyInstalled: installedIds.has(entry.id),
    isInstalling: false,
    isUninstalling: false,
    statusError: false,
    progressPercent: 0,
    statusMessage: '',
    ...extra
  }
}

async function loadFromCache() {
  cacheState = marketplaceCache.load()
  const { localFolderNames, installedIds } = await getInstalledIds()

  const staticEntries = (cacheState.staticEntries || []).map(e =>
    makeCard(e, installedIds)
  )

  const cachedPages = []
  for (let p = 1; p <= (cacheState.currentPage || 0); p++) {
    const pageEntries = marketplaceCache.getPage(cacheState, p)
    cachedPages.push(...pageEntries)
  }
  const pageCards = cachedPages
    .filter(e => !staticEntries.some(s => s.id === e.id))
    .map(e => makeCard(e, installedIds))

  const localOnlyApps = await buildLocalOnlyApps(localFolderNames, [...staticEntries, ...pageCards])

  currentPage.value = cacheState.currentPage || 0
  hasMorePages.value = cacheState.hasMore || false
  totalCount.value = cacheState.totalCount || 0

  marketplaceApps.value = [...localOnlyApps, ...staticEntries, ...pageCards]
}

async function buildLocalOnlyApps(localFolderNames, remoteEntries) {
  const remoteSlugs = new Set(remoteEntries.map(a => a.id))
  const appsTargetDir = await resolveCurrentAppsDirectory()
  const localOnlyApps = []

  for (const folderName of localFolderNames) {
    if (remoteSlugs.has(folderName)) continue
    let appName = folderName
    let svgIcon = DEFAULT_APP_ICON
    let isBuiltIn = false
    try {
      const rawManifestText = await fsApi.readFile(`${appsTargetDir}/${folderName}/app.json`)
      const manifest = JSON.parse(rawManifestText)
      if (manifest.name) appName = manifest.name
      if (manifest.svgContent) svgIcon = manifest.svgContent
      if (manifest.builtIn === true) isBuiltIn = true
    } catch (_) { /* keep defaults */ }
    localOnlyApps.push(makeCard({
      id: folderName,
      name: appName,
      owner: 'local',
      fullName: `local/${folderName}`,
      branch: 'workspace',
      svgContent: svgIcon,
      builtIn: isBuiltIn
    }, new Set([folderName]), { isLocalOnly: true }))
  }

  return localOnlyApps
}

function mergeEntries(newEntries, installedIds) {
  const localApps = marketplaceApps.value.filter(a => a.isLocalOnly)
  const remoteApps = marketplaceApps.value.filter(a => !a.isLocalOnly)
  const remoteIds = new Set(remoteApps.map(a => a.id))

  for (const entry of newEntries) {
    if (remoteIds.has(entry.id)) continue
    const card = makeCard(entry, installedIds)
    remoteApps.push(card)
    remoteIds.add(entry.id)
  }

  // Promote any isLocalOnly card that now has a remote counterpart
  const promotedLocalIds = new Set(newEntries.map(e => e.id))
  const remainingLocal = localApps.filter(a => !promotedLocalIds.has(a.id))

  marketplaceApps.value = [...remainingLocal, ...remoteApps]
}

function setupInfiniteScroll() {
  observer = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting && hasMorePages.value && !loadingMore.value && !loading.value) {
      loadNextPage()
    }
  }, { rootMargin: '200px' })

  if (scrollSentinel.value) {
    observer.observe(scrollSentinel.value)
  }
}

async function loadNextPage() {
  loadingMore.value = true
  try {
    const nextPage = currentPage.value + 1
    const query = searchQuery.value.trim()
    const { items, hasMore, totalCount: total } = await fetchGitHubPage(nextPage, marketplaceConfig.pageSize, query)
    hasMorePages.value = hasMore
    totalCount.value = total

    const entries = await enrichReposWithManifests(items, marketplaceConfig.manifestConcurrency)

    if (!query) {
      marketplaceCache.setPage(cacheState, nextPage, entries)
      marketplaceCache.setPaginationMeta(cacheState, { hasMore, totalCount: total })
    }

    const { installedIds } = await getInstalledIds()
    mergeEntries(entries, installedIds)
    currentPage.value = nextPage
  } catch (err) {
    console.error('Failed loading next marketplace page:', err)
    hasMorePages.value = false
  } finally {
    loadingMore.value = false
  }
}

const scanGitHubMarketplace = async () => {
  loading.value = true
  try {
    const { localFolderNames, installedIds } = await getInstalledIds()
    const query = searchQuery.value.trim()

    let staticEntries = []
    if (!query) {
      try {
        const local = await fetchLocalMarketplaceManifest()
        if (local && local.length > 0) {
          staticEntries = local.map(normalizeStaticEntry)
        }
      } catch (_) { /* no static manifest */ }
    }

    currentPage.value = 0
    hasMorePages.value = false
    totalCount.value = 0
    marketplaceApps.value = []

    const localOnlyApps = await buildLocalOnlyApps(localFolderNames, staticEntries)
    const staticCards = staticEntries.map(e => makeCard(e, installedIds))

    marketplaceApps.value = [...localOnlyApps, ...staticCards]

    if (!query) {
      marketplaceCache.setStaticEntries(cacheState, staticEntries)

      const cacheIsFresh = cacheState.lastScan && cacheState.currentPage > 0 &&
        (Date.now() - cacheState.lastScan) < marketplaceConfig.githubThrottleMs

      if (cacheIsFresh) {
        await loadFromCache()
        return
      }
    }

    const cachedSearch = searchResultsCache.get(query)
    if (cachedSearch && (Date.now() - cachedSearch.timestamp) < marketplaceConfig.githubThrottleMs) {
      hasMorePages.value = cachedSearch.hasMore
      totalCount.value = cachedSearch.totalCount
      currentPage.value = 1
      mergeEntries(cachedSearch.entries, installedIds)
      return
    }

    const { items, hasMore, totalCount: total } = await fetchGitHubPage(1, marketplaceConfig.pageSize, query)
    hasMorePages.value = hasMore
    totalCount.value = total

    const pageEntries = await enrichReposWithManifests(items, marketplaceConfig.manifestConcurrency)

    if (!query) {
      marketplaceCache.setPage(cacheState, 1, pageEntries)
      marketplaceCache.setPaginationMeta(cacheState, { hasMore, totalCount: total })
    }
    searchResultsCache.set(query, { entries: pageEntries, hasMore, totalCount: total, timestamp: Date.now() })
    currentPage.value = 1

    mergeEntries(pageEntries, installedIds)
  } catch (error) {
    console.error('Marketplace repository scanning failed:', error)
    showError(error.message || 'Marketplace scan failed')
    await loadFromCache()
  } finally {
    loading.value = false
  }
}

const handleAppAction = async (app) => {
  if (app.isLocalOnly || app.isInstalled || app.isAlreadyInstalled) {
    router.push('/apps/' + app.id)
    return
  }

  if (app.isInstalling || app.isUninstalling) return

  app.statusError = false
  app.isInstalling = true
  app.progressPercent = 5
  app.statusMessage = 'Connecting stream allocations...'

  try {
    if (isHybrid.value) {
      const appsTargetDir = await resolveCurrentAppsDirectory()
      await installRepositoryToStorage(app, appsTargetDir, (percent, msg) => {
        app.progressPercent = percent
        app.statusMessage = msg
      })

      let manifest = {}
      try {
        const manifestRaw = await fsApi.readFile(`${appsTargetDir}/${app.id}/app.json`)
        manifest = JSON.parse(manifestRaw)
      } catch (e) {
        console.warn(`Could not read installed manifest for ${app.id}; falling back to SFC defaults`, e.message)
      }

      const descriptor = {
        id: app.id,
        name: manifest.name || app.name,
        route: manifest.route || '/apps/' + app.id,
        svgContent: manifest.svgContent || app.svgContent,
        type: manifest.type || 'sfc',
        entryFile: `./src/apps/${app.id}/${manifest.entry || 'index.vue'}`,
        files: manifest.files,
        params: manifest.params
      }

      if (router.hasRoute(app.id)) router.removeRoute(app.id)
      router.addRoute({
        name: app.id,
        path: descriptor.route,
        component: () => shellCompiler(descriptor)
      })
    } else {
      const installer = isOpfsAvailable() ? opfsInstall : memoryInstall
      await installer(app, shellCompiler, router, (percent, msg) => {
        app.progressPercent = percent
        app.statusMessage = msg
      })
    }

    app.progressPercent = 100
    app.statusMessage = 'Installed'
    app.isAlreadyInstalled = true
    setTimeout(() => { app.isInstalling = false }, 1200)
  } catch (err) {
    console.error(`[Installer error on ${app.id}]:`, err.message)
    app.statusMessage = err.message
    app.statusError = true
    app.isInstalling = false
  }
}

const handleAppUninstall = async (app) => {
  if (app.builtIn) return
  app.isUninstalling = true
  try {
    app.statusMessage = 'Uninstalling...'
    if (isHybrid.value) {
      const appsTargetDir = await resolveCurrentAppsDirectory()
      await uninstallRepositoryFromStorage(app, appsTargetDir, router, (percent, msg) => {
        app.progressPercent = percent
        app.statusMessage = msg
      })
    } else {
      const uninstaller = isOpfsAvailable() ? opfsUninstall : memoryUninstall
      await uninstaller(app, router)
    }

    if (app.isLocalOnly) {
      marketplaceApps.value = marketplaceApps.value.filter(a => a.id !== app.id)
    } else {
      app.isAlreadyInstalled = false
    }
    setTimeout(() => {
      app.isUninstalling = false
      app.progressPercent = 0
      app.statusMessage = ''
    }, 1200)
  } catch (err) {
    console.error(`[Uninstall error on ${app.id}]:`, err.message)
    app.statusMessage = err.message
    app.statusError = true
    app.isUninstalling = false
  }
}

const goHome = () => {
  router.push('/home')
}
</script>

<style scoped>
.app-container {
  min-height: 100vh;
  background-color: #0a0a0c;
  font-family: -apple-system, BlinkMacSystemFont, sans-serif;
  color: #f3f4f6;
}

.view-header {
  display: flex;
  align-items: center;
  padding: 40px 24px 16px 24px;
  border-bottom: 1px solid #16161a;
  position: sticky;
  top: 0;
  z-index: 10;
  background-color: #0a0a0c;
}

.back-btn {
  background: none;
  border: none;
  color: #8e8e93;
  cursor: pointer;
  padding: 0;
  margin-right: 16px;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
}

.back-btn svg {
  width: 20px;
  height: 20px;
}

.view-title {
  margin: 0;
  font-size: 20px;
  font-weight: 500;
}

.content-body {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.error-banner {
  background-color: rgba(255, 69, 58, 0.1);
  border: 1px solid rgba(255, 69, 58, 0.3);
  border-radius: 12px;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 13px;
  color: #ff453a;
  animation: fadeIn 0.2s ease-out;
}

.error-dismiss {
  background: none;
  border: none;
  color: #ff453a;
  font-size: 18px;
  cursor: pointer;
  padding: 0 0 0 12px;
  line-height: 1;
}

.action-control-zone {
  width: 100%;
  min-height: 48px;
  position: relative;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.scan-btn {
  background-color: #ffffff;
  color: #0a0a0c;
  border: none;
  border-radius: 12px;
  height: 48px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  width: 100%;
  box-sizing: border-box;
  transition: opacity 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.scan-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.scan-meta-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.loaded-count {
  font-size: 12px;
  color: #636366;
  white-space: nowrap;
}


.progress-container {
  background-color: #16161a;
  border: 1px solid #242429;
  border-radius: 12px;
  height: 48px;
  padding: 0 16px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 6px;
  box-sizing: border-box;
  width: 100%;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  line-height: 1;
}

.status-msg {
  color: #8e8e93;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 80%;
}

.status-percent {
  font-weight: 600;
  color: #30d158;
}

.progress-track {
  background-color: #0a0a0c;
  border: 1px solid #242429;
  height: 4px;
  border-radius: 2px;
  overflow: hidden;
  width: 100%;
}

.progress-bar {
  background-color: #30d158;
  height: 100%;
  width: 0%;
  transition: width 0.2s ease-out;
}

.market-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
  position: relative;
}

.market-card {
  background-color: #16161a;
  border: 1px solid #242429;
  border-radius: 16px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 0;
  height: 88px;
  box-sizing: border-box;
  overflow: hidden;
  transition: height 0.25s ease, border-color 0.2s ease, background-color 0.2s ease;
}

.market-card.card-expanding-progress {
  height: 122px;
  border-color: #2c2c35;
}

.market-card.card-destructive-state {
  background-color: #1a1112;
  border-color: rgba(255, 69, 58, 0.2);
}

.card-main-content {
  display: flex;
  align-items: center;
  gap: 16px;
  width: 100%;
  height: 56px;
}

.market-icon-frame {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background-color: #0a0a0c;
  border: 1px solid #242429;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.app-icon {
  width: 20px;
  height: 20px;
  color: #ffffff;
}

.market-meta {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-width: 0;
  height: 56px;
}

.app-title {
  font-size: 15px;
  font-weight: 500;
  color: #ffffff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.2;
}

.app-developer {
  font-size: 13px;
  color: #8e8e93;
  line-height: 1.2;
  margin-top: 1px;
}

.installed-tag {
  font-size: 11px;
  color: #30d158;
  background-color: rgba(48, 209, 88, 0.1);
  padding: 2px 6px;
  border-radius: 4px;
  width: max-content;
  margin-top: 4px;
  line-height: 1;
}

.action-button-group {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.action-btn {
  background-color: #242429;
  color: #ffffff;
  border: 1px solid #3a3a3f;
  border-radius: 10px;
  padding: 8px 16px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-success {
  background-color: rgba(48, 209, 88, 0.15);
  color: #30d158;
  border-color: rgba(48, 209, 88, 0.3);
}

.success-content {
  display: flex;
  align-items: center;
  gap: 4px;
}

.check-icon {
  width: 14px;
  height: 14px;
}

.uninstall-btn {
  background: none;
  border: none;
  color: #ff453a;
  cursor: pointer;
  padding: 8px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s;
}

.uninstall-btn:hover {
  background-color: rgba(255, 69, 58, 0.1);
}

.trash-icon {
  width: 16px;
  height: 16px;
}

.item-progress-zone {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-top: 10px;
  width: 100%;
  animation: fadeIn 0.2s ease-out;
}

.item-progress-track {
  background-color: #0a0a0c;
  height: 3px;
  border-radius: 1.5px;
  width: 100%;
  overflow: hidden;
}

.item-progress-bar {
  background-color: #30d158;
  height: 100%;
  width: 0%;
  transition: width 0.1s linear;
}

.item-progress-bar.bar-destructive {
  background-color: #ff453a;
}

.item-status-msg {
  font-size: 11px;
  color: #8e8e93;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.item-status-msg.text-destructive {
  color: #ff453a;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 40px 0;
  color: #8e8e93;
  text-align: center;
  font-size: 14px;
  width: 100%;
}

.spinner {
  width: 24px;
  height: 24px;
  border: 2.5px solid #242429;
  border-top-color: #ffffff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.empty-state {
  text-align: center;
  color: #48484a;
  padding: 40px 24px;
  font-size: 14px;
  line-height: 1.5;
}

.scroll-sentinel {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px 0;
  min-height: 48px;
}

.end-message {
  font-size: 13px;
  color: #48484a;
}

@keyframes spin { to { transform: rotate(360deg); } }
@keyframes fadeIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }

.search-zone {
  width: 100%;
  position: sticky;
  top: 81px;
  z-index: 10;
  padding: 0 0 8px 0;
  background-color: #0a0a0c;
}
.search-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
}
.search-icon-svg {
  position: absolute;
  left: 14px;
  width: 16px;
  height: 16px;
  color: #8e8e93;
  pointer-events: none;
}
.search-field {
  width: 100%;
  height: 44px;
  background-color: #16161a;
  border: 1px solid #242429;
  border-radius: 12px;
  padding: 0 40px;
  color: #ffffff;
  font-size: 14px;
  outline: none;
  box-sizing: border-box;
  transition: border-color 0.2s ease;
}
.search-field:focus {
  border-color: #3a3a3f;
}
.clear-search-btn {
  position: absolute;
  right: 12px;
  background: none;
  border: none;
  color: #8e8e93;
  font-size: 18px;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>

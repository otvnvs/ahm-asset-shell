<!--src/views/Marketplace.vue-->
<!--src/views/Marketplace.vue-->
<template>
  <div class="app-container">
    <!--Component Navigation App Header Layer-->
    <header class="view-header">
      <button class="back-btn" @click="goHome">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="15 18 9 12 15 6"></polyline>
        </svg>
      </button>
      <h1 class="view-title">App Marketplace</h1>
    </header>

    <!--Core Interactive View Context Layout Canvas-->
    <main class="content-body">
      
      <!-- NEW: Dedicated Search Row Layer -->
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

      <!--Interactive Action Control/Progress Indicator Wrapper-->
      <div class="action-control-zone">
        <!--Global Unified Progress Status HUD(Visible when 1+apps are downloading)-->
        <div v-if="globalInstallationActive" class="progress-container">
          <div class="progress-header">
            <span class="status-msg">{{globalStatusMessage}}</span>
            <span class="status-percent">{{globalProgressPercent}}%</span>
          </div>
          <div class="progress-track">
            <div class="progress-bar" :style="{ width: globalProgressPercent + '%' }"></div>
          </div>
        </div>
        <!--Default Search Button Trigger-->
        <button v-else class="scan-btn" @click="scanGitHubMarketplace" :disabled="loading">
          {{loading?'Scanning GitHub Ecosystem...':'Scan Remote Repositories'}}
        </button>
      </div>

      <!--Discovered Remote Application Catalog Grid-->
      <div class="market-grid">
        <!-- CHANGED: Now looping over filteredMarketplaceApps instead of marketplaceApps -->
        <div v-for="app in filteredMarketplaceApps" :key="app.id" class="market-card" :class="{ 
              'card-expanding-progress': app.isInstalling || app.isUninstalling,
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
            <!--Dynamic Side-by-Side Action Layout Slot-->
            <div class="action-button-group">
              <!--Destructive Uninstall Trigger(Only visible for installed,idle applets)-->
              <button v-if="app.isAlreadyInstalled && !app.isInstalling && !app.isUninstalling" class="uninstall-btn" @click.stop="handleAppUninstall(app)" title="Uninstall Applet">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="trash-icon">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
              </button>
              <!--Main Action Trigger-->
              <button class="action-btn" :class="{ 'btn-success': app.isInstalled || app.isAlreadyInstalled }" @click="handleAppAction(app)" :disabled="app.isUninstalling || app.isInstalling">
                <span v-if="app.isInstalled || app.isAlreadyInstalled" class="success-content">
                  <svg class="check-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>Open
                </span>
                <span v-else-if="app.isInstalling">Installing...</span>
                <span v-else>Install</span>
              </button>
            </div>
          </div>
          <!--Individual Item Micro Progress Track Inline Overlay(Shared for Install&Uninstall feedback)-->
          <div v-if="app.isInstalling || app.isUninstalling" class="item-progress-zone">
            <div class="item-progress-track">
              <div class="item-progress-bar" :class="{ 'bar-destructive': app.isUninstalling }" :style="{ width: app.progressPercent + '%' }"></div>
            </div>
            <span class="item-status-msg" :class="{ 'text-destructive': app.isUninstalling }">{{app.statusMessage}}</span>
          </div>
        </div>

        <!--System Processing Data Loading Overlay Display Spinner-->
        <div v-if="loading" class="loading-state">
          <div class="spinner"></div>
          <p>Fetching packages and checking local directories...</p>
        </div>

        <!--Safe-guarded Length Empty State Indicator Fallback-->
        <!-- CHANGED: Checks filteredMarketplaceApps length to provide an accurate query empty state -->
        <div v-if="(!filteredMarketplaceApps || filteredMarketplaceApps.length === 0) && !loading" class="empty-state">
          <span v-if="searchQuery">No uncompiled applets match your query.</span>
          <span v-else>Tap the scanning interface above to search for uncompiled packages.</span>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, inject } from 'vue'
import { useRouter } from 'vue-router'
import { DEFAULT_APP_ICON } from '../../lib/shell/constants.js'
import { fsApi, isNativeAndroidEnvironment } from '../../lib/fs/index.js'
import { getAppsDirectory } from '../../lib/fs/constants.js'
import { fetchMarketplaceRepositories, fetchAppManifest } from './api.js'
import { installRepositoryToStorage } from './installer.js'
import { uninstallRepositoryFromStorage } from './uninstaller.js'
import { marketplaceCache } from './cache.js' // New centralized cache engine helper

const router = useRouter()
const loading = ref(false)
const searchQuery = ref('')
const marketplaceApps = ref([])
const shellCompiler = inject('shellCompiler')
let appsTargetDir = ''

// Global Aggregated Concurrent State Computations
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

// Fuzzy Regex Input Field Search Match Filter Execution
const filteredMarketplaceApps = computed(() => {
  if (!searchQuery.value.trim()) return marketplaceApps.value
  
  const cleanQuery = searchQuery.value.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const fuzzyPattern = new RegExp(cleanQuery.split('').join('.*'), 'i')
  
  return marketplaceApps.value.filter(app => 
    fuzzyPattern.test(app.name) || fuzzyPattern.test(app.id) || fuzzyPattern.test(app.owner)
  )
})

onMounted(async () => {
  const isNative = await isNativeAndroidEnvironment()
  appsTargetDir = getAppsDirectory(isNative)
  await loadEcosystemData()
})

// Combined Cache Loader and Local Workspace Aggregator
const loadEcosystemData = async () => {
  try {
    // 1. Read files directly off local device storage layout
    const localFsResponse = await fsApi.listDirectory(appsTargetDir)
    const localFolderNames = (localFsResponse && localFsResponse.files) 
      ? localFsResponse.files.filter(f => f.isDirectory).map(f => f.name) 
      : []

    // 2. Extract previous remote repository listings out of decentralized cache service
    const remoteApps = marketplaceCache.get()

    // 3. Mark live installation tracking values onto remote apps
    const mappedRemoteApps = remoteApps.map(app => ({
      ...app,
      isAlreadyInstalled: localFolderNames.includes(app.id),
      isInstalling: false,
      isUninstalling: false,
      progressPercent: 0,
      statusMessage: ''
    }))

    // 4. Trace Local-Only Custom Apps (Created on-device or manually side-loaded)
    const remoteSlugs = mappedRemoteApps.map(a => a.id)
    const localOnlyApps = []

    for (const folderName of localFolderNames) {
      if (!remoteSlugs.includes(folderName)) {
        let appName = folderName
        let svgIcon = DEFAULT_APP_ICON
        try {
          const rawManifestText = await fsApi.readFile(`${appsTargetDir}/${folderName}/app.json`)
          const manifest = JSON.parse(rawManifestText)
          if (manifest.name) appName = manifest.name
          if (manifest.svgContent) svgIcon = manifest.svgContent
        } catch (e) {
          console.warn(`No offline manifest layout profile resolved for custom workspace app: ${folderName}`)
        }

        localOnlyApps.push({
          id: folderName,
          name: appName,
          owner: 'local',
          fullName: `local/${folderName}`,
          branch: 'workspace',
          svgContent: svgIcon,
          isInstalled: false,
          isAlreadyInstalled: true,
          isLocalOnly: true,
          isInstalling: false,
          isUninstalling: false,
          progressPercent: 0,
          statusMessage: ''
        })
      }
    }

    // Merge indices completely into a single grid array sheet
    marketplaceApps.value = [...localOnlyApps, ...mappedRemoteApps]
  } catch (err) {
    console.error('Failed synthesizing cached ecosystem index mappings:', err)
  }
}

const scanGitHubMarketplace = async () => {
  loading.value = true
  try {
    const localFsResponse = await fsApi.listDirectory(appsTargetDir)
    const localFolderNames = (localFsResponse && localFsResponse.files) 
      ? localFsResponse.files.filter(f => f.isDirectory).map(f => f.name) 
      : []
    
    const repos = await fetchMarketplaceRepositories()
    const freshRemoteIndex = []
    
    for (const repo of repos) {
      const branchName = repo.default_branch || 'main'
      const cleanSlug = repo.name.replace('ahm-applet-', '')
      let appName = cleanSlug
      let svgIcon = DEFAULT_APP_ICON
      
      try {
        const manifest = await fetchAppManifest(repo.full_name, branchName)
        if (manifest.name) appName = manifest.name
        if (manifest.svgContent) svgIcon = manifest.svgContent
      } catch (err) {
        console.warn(`Skipped manifest descriptor read for ${repo.name}`)
      }
      
      freshRemoteIndex.push({
        id: cleanSlug,
        name: appName,
        owner: repo.owner.login,
        fullName: repo.full_name,
        branch: branchName,
        svgContent: svgIcon
      })
    }

    // Persist remote listings inside designated local cache utility layer
    marketplaceCache.set(freshRemoteIndex)
    
    // Refresh view data states
    await loadEcosystemData()
  } catch (error) {
    console.error('Marketplace repository scanning failed:', error)
    alert('Failed searching GitHub ecosystem networks. Reverting to cached indexes.')
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

  app.isInstalling = true
  app.progressPercent = 5
  app.statusMessage = 'Connecting stream allocations...'
  
  try {
    await installRepositoryToStorage(app, appsTargetDir, (percent, customMessage) => {
      app.progressPercent = percent
      app.statusMessage = customMessage
    })

    app.progressPercent = 90
    app.statusMessage = 'Bootstrapping component context sandboxes...'
    
    const computedDefaultRoute = '/apps/' + app.id
    const computedEntryFile = `./src/apps/${app.id}/index.vue`
    
    if (router.hasRoute(app.id)) {
      router.removeRoute(app.id)
    }
    
    router.addRoute({
      name: app.id,
      path: computedDefaultRoute,
      component: () => shellCompiler(computedEntryFile)
    })
    
    app.progressPercent = 100
    app.statusMessage = 'Activated!'
    app.isAlreadyInstalled = true
    
    setTimeout(() => {
      app.isInstalling = false
    }, 1200)
  } catch (err) {
    console.error(`[Concurrent Installer Intercepted on ${app.id}]:`, err.message)
    alert(`Download pipeline dropped for ${app.name}: ` + err.message)
    app.isInstalling = false
  }
}

const handleAppUninstall = async (app) => {
  const confirmEcosystemPurge = true;//confirm(`Are you sure you want to completely uninstall ${app.name}? This removes all local files permanently.`)
  if (!confirmEcosystemPurge) return

  app.isUninstalling = true
  
  try {
    await uninstallRepositoryFromStorage(app, appsTargetDir, router, (percent, customMessage) => {
      app.progressPercent = percent
      app.statusMessage = customMessage
    })

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
    console.error(`[Ecosystem Uninstallation Transaction Aborted on ${app.id}]:`, err.message)
    alert(`Failed to clean applet assets: ${err.message}`)
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

.action-control-zone {
  width: 100%;
  height: 48px;
  position: relative;
  box-sizing: border-box;
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

/* Subtle amber shift to visually denote file destructive operations are processing */
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

/* Minimalist Low-Profile Trash Button Layout */
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

/* Turns mini tracker red during uninstall loops */
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

@keyframes spin { to { transform: rotate(360deg); } }
@keyframes fadeIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }

/* -------------------------------------------------------------------------------- */
/* search */
/* -------------------------------------------------------------------------------- */
.search-zone {
  width: 100%;
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


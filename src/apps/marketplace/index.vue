<template>
<div class="app-container">
  <header class="view-header">
    <button class="back-btn" @click="goHome">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"></polyline></svg>
    </button>
    <h1 class="view-title">App Marketplace</h1>
  </header>

  <main class="content-body">
    <button class="scan-btn" @click="scanGitHubMarketplace" :disabled="loading || installingId !== null">
      {{ loading ? 'Scanning GitHub Ecosystem...' : 'Scan Remote Repositories' }}
    </button>

    <!-- Global Progress Status HUD -->
    <div v-if="installingId !== null" class="progress-container">
      <div class="progress-header">
        <span class="status-msg">{{ statusMessage }}</span>
        <span class="status-percent">{{ progressPercent }}%</span>
      </div>
      <div class="progress-track">
        <div class="progress-bar" :style="{ width: progressPercent + '%' }"></div>
      </div>
    </div>

    <!-- Discovered Applications Catalog List Grid -->
    <div class="market-grid">
      <div v-for="app in marketplaceApps" :key="app.id" class="market-card">
        <div class="market-icon-frame">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="app-icon" v-html="app.svgContent"></svg>
        </div>
        
        <div class="market-meta">
          <span class="app-title">{{ app.name }}</span>
          <span class="app-developer">by {{ app.owner }}</span>
          <span v-if="app.isAlreadyInstalled && installingId !== app.id" class="installed-tag">Locally Installed</span>
        </div>

        <!-- Dynamic Action Button -->
        <button 
          class="action-btn" 
          :class="{ 'btn-success': app.isInstalled || app.isAlreadyInstalled, 'btn-disabled': installingId !== null && installingId !== app.id }" 
          @click="handleAppAction(app)"
          :disabled="installingId !== null && installingId !== app.id"
        >
          <span v-if="app.isInstalled || app.isAlreadyInstalled" class="success-content">
            <svg class="check-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
            Open
          </span>
          <span v-else-if="installingId === app.id">Installing...</span>
          <span v-else>Install</span>
        </button>
      </div>

      <!-- Loading State Spinner Overlay -->
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Fetching packages and checking local directories...</p>
      </div>

      <!-- Empty State Utility Indicator -->
      <div v-if="marketplaceApps.length === 0 && !loading" class="empty-state">
        Tap the scanning interface above to search for uncompiled packages.
      </div>
    </div>
  </main>
</div>
</template>
<script setup>
import { ref, onMounted, inject } from 'vue'
import { useRouter } from 'vue-router'
import { DEFAULT_APP_ICON } from '../../lib/shell/constants.js'
import { fsApi, isNativeAndroidEnvironment } from '../../lib/fs/index.js'
import { getAppsDirectory } from '../../lib/fs/constants.js'

const router = useRouter()
const loading = ref(false)
const marketplaceApps = ref([])

const installingId = ref(null)
const progressPercent = ref(0)
const statusMessage = ref('')

const shellCompiler = inject('shellCompiler')
let appsTargetDir = ''

onMounted(async () => {
  const isNative = await isNativeAndroidEnvironment()
  appsTargetDir = getAppsDirectory(isNative)
})

const scanGitHubMarketplace = async () => {
  loading.value = true
  marketplaceApps.value = []
  try {
    // 1. Scan local physical drive directory contents [README.md]
    const localFsResponse = await fsApi.listDirectory(appsTargetDir)
    const localFolderNames = (localFsResponse && localFsResponse.files) 
      ? localFsResponse.files.filter(f => f.isDirectory).map(f => f.name)
      : []

    // 2. Query GitHub topic search endpoint
    //const searchUrl = 'https://github.com'
    const searchUrl = 'https://api.github.com/search/repositories?q=topic:ahm-applet'

    const response = await fetch(searchUrl)
    if (!response.ok) throw new Error('Network discovery dropped')
    const data = await response.json()
    const resolvedApps = []
    
    for (const repo of data.items) {
      const branchName = repo.default_branch || 'main'
      const rawManifestUrl = 'https://githubusercontent.com';
      const cleanSlug = repo.name.replace('ahm-applet-','');
      let appName = cleanSlug;
      let svgIcon = DEFAULT_APP_ICON;
      
      try {
        const manifestRes = await fetch(rawManifestUrl)
        if (manifestRes.ok) {
          const manifest = await manifestRes.json()
          if (manifest.name) appName = manifest.name
          if (manifest.svgContent) svgIcon = manifest.svgContent
        }
      } catch (err) {
        console.warn('Skipped manifest read for ' + repo.name)
      }

      // 3. Set the conditional already-installed state
      const isAlreadyInstalled = localFolderNames.includes(cleanSlug)

      resolvedApps.push({
        id: cleanSlug,
        name: appName,
        owner: repo.owner.login,
        fullName: repo.full_name,
        branch: branchName,
        svgContent: svgIcon,
        isInstalled: false,
        isAlreadyInstalled: isAlreadyInstalled
      })
    }
    marketplaceApps.value = resolvedApps
  } catch (error) {
    console.error('Marketplace script compilation error:', error)
  } finally {
    loading.value = false
  }
}
const handleAppAction = async (app) => {
  if (app.isInstalled || app.isAlreadyInstalled) {
    router.push('/apps/' + app.id)
    return
  }

  installingId.value = app.id
  progressPercent.value = 5
  statusMessage.value = 'Connecting to GitHub CDN network streams...'

  try {
    const baseCdnUrl = 'https://raw.githubusercontent.com/'+app.fullName+'/'+app.branch;
    const manifestUrl = baseCdnUrl+'/app.json';
    const indexVueUrl = baseCdnUrl+'/index.vue';

    progressPercent.value = 25
    statusMessage.value = 'Streaming payload chunks for ' + app.name + '...'
    
    const [manifestRes, indexVueRes] = await Promise.all([fetch(manifestUrl), fetch(indexVueUrl)])
    if (!manifestRes.ok) throw new Error('CDN manifest read dropped: '+manifestRes.statusText)
    if (!indexVueRes.ok) throw new Error('CDN view chunk read dropped: '+indexVueRes.statusText)
    
    const manifestText = await manifestRes.text()
    const indexVueText = await indexVueRes.text()

    progressPercent.value = 60
    statusMessage.value = 'Allocating memory blocks and writing files to flash storage...'
    
    const targetFolder = appsTargetDir+'/'+app.id;
    await fsApi.createDirectory(targetFolder)
    await fsApi.writeFile(targetFolder+'/app.json', manifestText)
    await fsApi.writeFile(targetFolder+'/index.vue', indexVueText)

    progressPercent.value = 90
    statusMessage.value = 'Injecting application parameters and compiling views on the fly...'
    
    const computedDefaultRoute = '/apps/'+app.id;
    const computedEntryFile = './src/apps/'+app.id+'/index.vue';
    
    if (router.hasRoute(app.id)) {
      router.removeRoute(app.id);
    }
    
    router.addRoute({
      name: app.id,
      path: computedDefaultRoute,
      component: () => shellCompiler(computedEntryFile)
    });

    progressPercent.value = 100
    statusMessage.value = 'Installation complete! Applet activated successfully.'
    
    app.isAlreadyInstalled = true
    
    setTimeout(() => {
      installingId.value = null
    }, 1200)

  } catch (err) {
    console.error('[Installer] Transaction failure block intercepted:', err.message)
    alert('Download aborted: ' + err.message)
    installingId.value = null
  }
}

const goHome = () => {
  router.push('/home')
}
</script>
<style scoped>
.app-container { min-height: 100vh; background-color: #0a0a0c; font-family: -apple-system, BlinkMacSystemFont, sans-serif; color: #f3f4f6; }
.view-header { display: flex; align-items: center; padding: 40px 24px 16px 24px; border-bottom: 1px solid #16161a; }
.back-btn { background: none; border: none; color: #8e8e93; cursor: pointer; padding: 0; margin-right: 16px; width: 24px; height: 24px; display: flex; align-items: center; }
.back-btn svg { width: 20px; height: 20px; }
.view-title { margin: 0; font-size: 20px; font-weight: 500; }
.content-body { padding: 24px; display: flex; flex-direction: column; gap: 20px; }
.scan-btn { background-color: #ffffff; color: #0a0a0c; border: none; border-radius: 12px; padding: 14px; font-size: 14px; font-weight: 600; cursor: pointer; width: 100%; }

.progress-container { background-color: #16161a; border: 1px solid #242429; border-radius: 14px; padding: 16px; display: flex; flex-direction: column; gap: 10px; }
.progress-header { display: flex; justify-content: space-between; font-size: 12px; }
.status-msg { color: #8e8e93; }
.status-percent { font-weight: 600; color: #30d158; }
.progress-track { background-color: #0a0a0c; border: 1px solid #242429; height: 6px; border-radius: 3px; overflow: hidden; width: 100%; }
.progress-bar { background-color: #30d158; height: 100%; width: 0%; transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1); }

.market-grid { display: flex; flex-direction: column; gap: 12px; }
.market-card { background-color: #16161a; border: 1px solid #242429; border-radius: 16px; padding: 16px; display: flex; align-items: center; gap: 16px; }
.market-icon-frame { width: 48px; height: 48px; border-radius: 12px; background-color: #0a0a0c; border: 1px solid #242429; display: flex; align-items: center; justify-content: center; }
.app-icon { width: 20px; height: 20px; color: #ffffff; }
.market-meta { flex: 1; display: flex; flex-direction: column; gap: 2px; }
.app-title { font-size: 15px; font-weight: 500; }
.app-developer { font-size: 12px; color: #8e8e93; }
.installed-tag { font-size: 10px; color: #ff9500; background-color: rgba(255, 149, 0, 0.12); padding: 2px 6px; border-radius: 4px; width: fit-content; margin-top: 4px; font-weight: 500; }

.action-btn { background-color: #1c1c1e; border: 1px solid #242429; color: #30d158; border-radius: 20px; padding: 6px 14px; font-size: 12px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 4px; transition: all 0.2s ease; }
.action-btn.btn-success { background-color: rgba(48, 209, 88, 0.12); border-color: rgba(48, 209, 88, 0.2); color: #30d158; padding: 6px 12px; }
.action-btn.btn-disabled { opacity: 0.4; cursor: not-allowed; }
.success-content { display: flex; align-items: center; gap: 4px; }
.check-icon { width: 12px; height: 12px; }

.loading-state { text-align: center; color: #8e8e93; font-size: 13px; padding: 40px 0; display: flex; flex-direction: column; align-items: center; gap: 14px; }
.spinner { width: 22px; height: 22px; border: 2px solid #242429; border-top-color: #ffffff; border-radius: 50%; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.empty-state { text-align: center; color: #48484a; font-size: 13px; padding: 40px 20px; }
</style>




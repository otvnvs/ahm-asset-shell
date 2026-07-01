<template>
<div class="mobile-container" @click="closeContextMenu">
  <header class="app-header">
    <h1 class="header-title">Apps</h1>
    <span class="status-dot" :class="{ 'offline': !isNative }"></span>
  </header>

  <main class="app-grid">
    <!-- Touch and Context Interceptors injected directly onto items -->
    <div 
      v-for="app in apps" 
      :key="app.id" 
      class="app-item"
      @touchstart="handleTouchStart($event, app)"
      @touchend="handleTouchEnd($event, app)"
      @mousedown="handleMouseDown($event, app)"
      @mouseup="handleMouseUp($event, app)"
      @contextmenu.prevent="openContextMenu($event, app)"
    >
      <div class="icon-wrapper">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="app-icon" v-html="app.svgContent"></svg>
      </div>
      <span class="app-label">{{ app.name }}</span>
    </div>

    <div v-if="apps.length === 0" class="empty-state">No application bundles found in storage.</div>
  </main>

  <!-- Absolute Positioned Android-Style Context Menu HUD -->
  <div 
    v-if="selectedApp !== null" 
    class="context-menu" 
    :style="{ top: menuY + 'px', left: menuX + 'px' }"
    @click.stop
  >
    <button class="menu-action delete-action" @click="uninstallSelectedApp">
      <svg class="action-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
      Uninstall App
    </button>
  </div>
</div>
</template>
<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { scanForApps } from '../../lib/shell/index.js'
import { isNativeAndroidEnvironment, fsApi } from '../../lib/fs/index.js'
import { getAppsDirectory } from '../../lib/fs/constants.js'
import { initKeyboardListeners } from '../../lib/shell/keyboard.js'

const router = useRouter()
const apps = ref([])
const isNative = ref(false)
let pollingTimer = null 
let isScanning = false 

// Long Press & Context Menu State Variables
const selectedApp = ref(null)
const menuX = ref(0)
const menuY = ref(0)
let touchTimer = null
let longPressTriggered = false

const refreshApplicationPool = async () => {
  if (isScanning) return;
  isScanning = true;
  try {
    const discoveredApps = await scanForApps()
    const currentHash = JSON.stringify(apps.value)
    const incomingHash = JSON.stringify(discoveredApps)
    if (currentHash !== incomingHash) {
      apps.value = discoveredApps
    }
  } catch (err) {
    console.error('[Telemetry:Home] Polling check crashed:', err);
  } finally {
    isScanning = false;
  }
}

onMounted(async () => {
  initKeyboardListeners()
  isNative.value = await isNativeAndroidEnvironment()
  await refreshApplicationPool()
  pollingTimer = setInterval(refreshApplicationPool, 3500)
})

onUnmounted(() => {
  if (pollingTimer) clearInterval(pollingTimer)
  if (touchTimer) clearTimeout(touchTimer)
})

const openContextMenu = (event, app) => {
  // Prevent system apps or core marketplaces from being removed
  if (app.id === 'marketplace') return;
  
  selectedApp.value = app
  longPressTriggered = true
  
  // Calculate spatial positioning bounds based on user interaction inputs
  const touch = event.touches ? event.touches[0] : event;
  menuX.value = Math.min(touch.clientX, window.innerWidth - 160)
  menuY.value = Math.min(touch.clientY, window.innerHeight - 80)
}

const closeContextMenu = () => {
  selectedApp.value = null
  longPressTriggered = false
}

// Touch Handling Logic Maps for Hardware Mobile Deployments
const handleTouchStart = (event, app) => {
  longPressTriggered = false
  if (touchTimer) clearTimeout(touchTimer)
  touchTimer = setTimeout(() => {
    openContextMenu(event, app)
  }, 650) // Triggers hold milestone at 650ms
}

const handleTouchEnd = (event, app) => {
  if (touchTimer) clearTimeout(touchTimer)
  if (!longPressTriggered) {
    // If it was just a brief tap, handle standard navigation pipelines
    navigateTo(app.route)
  }
}
// Mouse Event Support Fallbacks for Local Desktop Browser Diagnostics
const handleMouseDown = (event, app) => {
  if (event.button !== 0) return; // Only process left clicks
  longPressTriggered = false
  if (touchTimer) clearTimeout(touchTimer)
  touchTimer = setTimeout(() => {
    openContextMenu(event, app)
  }, 650)
}

const handleMouseUp = (event, app) => {
  if (event.button !== 0) return;
  if (touchTimer) clearTimeout(touchTimer)
  if (!longPressTriggered && selectedApp.value === null) {
    navigateTo(app.route)
  }
}

/**
 * Executes a POSIX wipe on the physical storage blocks via the client bridge
 */
const uninstallSelectedApp = async () => {
  if (!selectedApp.value) return;
  const app = selectedApp.value;
  
  const confirmWipe = confirm('Are you sure you want to completely uninstall ' + app.name + '?');
  if (!confirmWipe) {
    closeContextMenu();
    return;
  }

  try {
    const appsDir = getAppsDirectory(isNative.value);
    const targetFolder = appsDir + '/' + app.id;
    console.log('[Home:Uninstall] Wiping application directory path: ' + targetFolder);

    // 1. Remove files from physical storage drive partitions
    await fsApi.deleteItem(targetFolder);

    // 2. Clear from market tracking manifests if they exist
    try {
      const registryPath = appsDir + '/installed.json';
      const rawRegistry = await fsApi.readFile(registryPath);
      let registry = JSON.parse(rawRegistry);
      registry = registry.filter(item => item.id !== app.id);
      await fsApi.writeFile(registryPath, JSON.stringify(registry, null, 2));
    } catch (e) {}

    // 3. Immediately pull updated file topology mappings
    await refreshApplicationPool();
    console.log('[Home:Uninstall] File asset uninstalled successfully.');
  } catch (err) {
    console.error('[Home:Uninstall] Target erasure sequence aborted:', err.message);
    alert('Failed to remove app assets: ' + err.message);
  } finally {
    closeContextMenu();
  }
}

const navigateTo = (route) => {
  if (selectedApp.value !== null) return;
  router.push(route)
}
</script>
<style scoped>
.mobile-container{margin:0 auto;min-height:100vh;background-color:#0a0a0c;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#f3f4f6;box-shadow:0 0 40px rgba(0,0,0,0.6);position:relative;}
.app-header{display:flex;justify-content:space-between;align-items:center;padding:40px 24px 16px 24px;}
.header-title{margin:0;font-size:16px;font-weight:400;letter-spacing:0.05em;color:#8e8e93;text-transform:uppercase;}
.status-dot{width:6px;height:6px;background-color:#30d158;border-radius:50%;transition:background-color 0.3s ease;}
.status-dot.offline{background-color:#ff9500;}
.app-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:20px 12px;padding:24px;}
.app-item{display:flex;flex-direction:column;align-items:center;cursor:pointer;user-select:none;transition:opacity 0.15s ease;-webkit-user-select:none;}
.app-item:active{opacity:0.5;}
.icon-wrapper{width:60px;height:60px;border-radius:16px;background-color:#16161a;border:1px solid #242429;display:flex;align-items:center;justify-content:center;margin-bottom:10px;}
.app-icon{width:22px;height:22px;color:#ffffff;}
.app-label{font-size:11px;font-weight:400;color:#8e8e93;text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;width:100%;letter-spacing:0.01em;}
.empty-state{grid-column:span 4;text-align:center;color:#48484a;font-size:13px;padding-top:40px;}

/* Absolute Android-Style Floating Menu Overlays */
.context-menu {
  position: absolute;
  background-color: #1c1c1e;
  border: 1px solid #2c2c2e;
  border-radius: 12px;
  padding: 4px;
  z-index: 9999;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
  min-width: 140px;
  animation: menuFade 0.12s ease-out;
}
@keyframes menuFade {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}
.menu-action {
  width: 100%;
  background: none;
  border: none;
  padding: 10px 12px;
  font-size: 13px;
  text-align: left;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  border-radius: 8px;
}
.delete-action {
  color: #ff453a;
}
.menu-action:active {
  background-color: rgba(255, 255, 255, 0.05);
}
.action-icon {
  width: 14px;
  height: 14px;
}
</style>


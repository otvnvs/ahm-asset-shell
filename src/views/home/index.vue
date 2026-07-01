<template>
<div class="mobile-container">
  <header class="app-header">
    <h1 class="header-title">Apps</h1>
    <span class="status-dot" :class="{ 'offline': !isNative }"></span>
  </header>

  <main class="app-grid">
    <div v-for="app in apps" :key="app.id" class="app-item" @click="navigateTo(app.route)">
      <div class="icon-wrapper">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="app-icon" v-html="app.svgContent"></svg>
      </div>
      <span class="app-label">{{ app.name }}</span>
    </div>

    <div v-if="apps.length === 0" class="empty-state">
      No application bundles found in storage.
    </div>
  </main>
</div>
</template>
<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { scanForApps } from '../../lib/shell/index.js'
import { isNativeAndroidEnvironment } from '../../lib/fs/index.js'
import { initKeyboardListeners } from '../../lib/shell/keyboard.js'

const router = useRouter()
const apps = ref([])
const isNative = ref(false)
let pollingTimer = null

// PERFORMANCE SHIELD: Prevent file operation cycles from stacking up on a clogged thread
let isScanning = false

const refreshApplicationPool = async () => {
  if (isScanning) return; // Drop step if previous disk poll is still reading data
  isScanning = true;
  
  const startTime = performance.now();
  console.log('[Telemetry:Home] Initiating application tree directory sync path...');

  try {
    const discoveredApps = await scanForApps()
    const currentHash = JSON.stringify(apps.value)
    const incomingHash = JSON.stringify(discoveredApps)
    
    if (currentHash !== incomingHash) {
      console.log('[Telemetry:Home] System variation captured. Mutating dashboard cards pool.');
      apps.value = discoveredApps
    }
    
    const duration = (performance.now() - startTime).toFixed(1);
    console.log('[Telemetry:Home] Sync sequence completed cleanly in ' + duration + 'ms');
  } catch (err) {
    console.error('[Telemetry:Home] Critical background scanning error block:', err);
  } finally {
    isScanning = false;
  }
}

onMounted(async () => {
  initKeyboardListeners()
  isNative.value = await isNativeAndroidEnvironment()
  
  // Fire initial immediate read pass before starting loop workers
  await refreshApplicationPool()
  
  // Performance Guard: Increased polling interval slice smoothly to 3500ms to allow UI processing breath
  pollingTimer = setInterval(refreshApplicationPool, 3500)
})

onUnmounted(() => {
  if (pollingTimer) clearInterval(pollingTimer)
})

const navigateTo = (route) => {
  router.push(route)
}
</script>

<style scoped>
.mobile-container { margin: 0 auto; min-height: 100vh; background-color: #0a0a0c; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #f3f4f6; box-shadow: 0 0 40px rgba(0,0,0,0.6); }
.app-header { display: flex; justify-content: space-between; align-items: center; padding: 40px 24px 16px 24px; }
.header-title { margin: 0; font-size: 16px; font-weight: 400; letter-spacing: 0.05em; color: #8e8e93; text-transform: uppercase; }
.status-dot { width: 6px; height: 6px; background-color: #30d158; border-radius: 50%; transition: background-color 0.3s ease; }
.status-dot.offline { background-color: #ff9500; }
.app-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px 12px; padding: 24px; }
.app-item { display: flex; flex-direction: column; align-items: center; cursor: pointer; user-select: none; transition: opacity 0.15s ease; }
.app-item:active { opacity: 0.5; }
.icon-wrapper { width: 60px; height: 60px; border-radius: 16px; background-color: #16161a; border: 1px solid #242429; display: flex; align-items: center; justify-content: center; margin-bottom: 10px; }
.app-icon { width: 22px; height: 22px; color: #ffffff; }
.app-label { font-size: 11px; font-weight: 400; color: #8e8e93; text-align: center; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; width: 100%; letter-spacing: 0.01em; }
.empty-state { grid-column: span 4; text-align: center; color: #48484a; font-size: 13px; padding-top: 40px; }
</style>

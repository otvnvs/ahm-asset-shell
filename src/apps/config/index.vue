<template>
  <div class="config-container">
    <header class="app-header">
      <button class="back-btn" @click="goBack">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="15 18 9 12 15 6"></polyline>
        </svg>
      </button>
      <div class="header-text">
        <h1>Config</h1>
        <span class="subtitle">System Configuration</span>
      </div>
    </header>

    <main class="content">
      <section class="section">
        <h2 class="section-title">General</h2>
        <ul class="settings-list">
          <li class="settings-row">
            <span class="row-label">Theme</span>
            <span class="row-value">Dark</span>
          </li>
          <li class="settings-row">
            <span class="row-label">Language</span>
            <span class="row-value">English</span>
          </li>
        </ul>
      </section>

      <section class="section">
        <h2 class="section-title">Network</h2>
        <ul class="settings-list">
          <li class="settings-row">
            <span class="row-label">Marketplace Cache TTL</span>
            <span class="row-value">5 min</span>
          </li>
          <li class="settings-row">
            <span class="row-label">Search Debounce</span>
            <span class="row-value">400 ms</span>
          </li>
          <li class="settings-row">
            <span class="row-label">Page Size</span>
            <span class="row-value">5</span>
          </li>
        </ul>
      </section>

      <section class="section">
        <h2 class="section-title">Storage</h2>
        <ul class="settings-list">
          <li class="settings-row">
            <span class="row-label">Storage Backend</span>
            <span class="row-value">{{ storageBackend }}</span>
          </li>
          <li class="settings-row">
            <span class="row-label">Environment</span>
            <span class="row-value">{{ environment }}</span>
          </li>
        </ul>
      </section>
    </main>

    <footer class="app-footer">
      <p>Configuration — Built-in App</p>
    </footer>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { isAndroidHybrid } from '../../lib/fs/index.js'

const router = useRouter()
const environment = ref('Detecting...')
const storageBackend = ref('Detecting...')

onMounted(async () => {
  const hybrid = await isAndroidHybrid()
  if (hybrid) {
    environment.value = 'Android Hybrid'
    storageBackend.value = 'Native Filesystem'
  } else {
    environment.value = 'Web Browser'
    storageBackend.value = typeof navigator.storage?.getDirectory === 'function'
      ? 'OPFS'
      : 'In-Memory'
  }
})

const goBack = () => {
  router.push('/home')
}
</script>

<style scoped>
.config-container {
  min-height: 100vh;
  background-color: #0b0b0c;
  color: #e3e3e6;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
}

.app-header {
  display: flex;
  align-items: center;
  padding: 40px 24px 16px 24px;
  border-bottom: 1px solid #1f1f22;
  gap: 16px;
}

.back-btn {
  background: none;
  border: none;
  color: #8e8e93;
  cursor: pointer;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.back-btn svg {
  width: 20px;
  height: 20px;
}

.header-text h1 {
  margin: 0 0 2px 0;
  font-size: 20px;
  font-weight: 600;
  color: #ffffff;
}

.subtitle {
  font-size: 12px;
  color: #71717a;
}

.content {
  flex: 1;
  padding: 24px 16px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.section-title {
  margin: 0;
  font-size: 12px;
  font-weight: 500;
  color: #71717a;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  padding: 0 4px;
}

.settings-list {
  list-style: none;
  padding: 0;
  margin: 0;
  background-color: #18181b;
  border: 1px solid #27272a;
  border-radius: 12px;
  overflow: hidden;
}

.settings-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px;
  font-size: 15px;
  border-bottom: 1px solid #27272a;
}

.settings-row:last-child {
  border-bottom: none;
}

.row-label {
  color: #e3e3e6;
}

.row-value {
  color: #71717a;
  font-size: 14px;
}

.app-footer {
  text-align: center;
  font-size: 12px;
  color: #3f3f46;
  padding: 20px 16px;
}
</style>

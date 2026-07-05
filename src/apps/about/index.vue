<template>
  <div class="about-container">
    <!-- Header -->
    <header class="app-header">
      <h1>{{ appInfo.appName }}</h1>
      <span class="version">Version {{ appInfo.version }}</span>
    </header>

    <!-- Main Content Card -->
    <main class="content-card">
      <p class="description">
        {{ appInfo.description }}
      </p>

      <!-- System Details List -->
      <ul class="info-list">
        <li>
          <span class="label">Developer:</span>
          <span class="value">{{ appInfo.developer }}</span>
        </li>
        <li>
          <span class="label">Environment:</span>
          <span class="value">{{ appInfo.environment }}</span>
        </li>
      </ul>
    </main>

    <!-- Footer / Legal -->
    <footer class="app-footer">
      <p>{{ appInfo.copyright }}</p>
    </footer>
  </div>
</template>

<script setup>
// Import the static JSON file directly
// Note: Adjust the path if your JSON file is located elsewhere (e.g., '@/assets/aboutData.json')
import appInfo from './data.json';
</script>

<style scoped>
/* Reset & Base Layout */
.about-container {
  min-height: 100vh;
  background-color: #0b0b0c; /* Deep black background */
  color: #e3e3e6; /* Soft light gray text */
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  padding: 24px 16px;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
}

/* Header Styles */
.app-header {
  text-align: center;
  margin-bottom: 32px;
  margin-top: 16px;
}

.app-header h1 {
  font-size: 24px;
  font-weight: 600;
  margin: 0 0 8px 0;
  color: #ffffff;
}

.version {
  font-size: 14px;
  color: #71717a;
}

/* Content Card Elements */
.content-card {
  background-color: #18181b; /* Dark gray surface card */
  border: 1px solid #27272a;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: auto;
}

.description {
  font-size: 15px;
  line-height: 1.6;
  margin: 0 0 20px 0;
  color: #d4d4d8;
}

/* Info Lists */
.info-list {
  list-style: none;
  padding: 0;
  margin: 0;
  border-top: 1px solid #27272a;
}

.info-list li {
  display: flex;
  justify-content: space-between;
  padding: 12px 0;
  font-size: 14px;
  border-bottom: 1px solid #27272a;
}

.info-list li:last-child {
  border-bottom: none;
}

.label {
  color: #a1a1aa;
}

.value {
  color: #ffffff;
  font-weight: 500;
}

/* Status Indicator Accent */
.success-text {
  color: #22c55e; /* Green accent matching your UI dot */
}

/* Footer Section */
.app-footer {
  text-align: center;
  font-size: 12px;
  color: #52525b;
  margin-top: 24px;
}
</style>


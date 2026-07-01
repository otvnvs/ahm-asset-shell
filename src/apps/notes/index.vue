<template>
<div class="app-container">
  <header class="view-header">
    <button class="back-btn" @click="goHome">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"></polyline></svg>
    </button>
    <h1 class="view-title">Quick Notes</h1>
  </header>

  <main class="content-body">
    <div class="notepad">
      <textarea v-model="noteText" placeholder="Start typing on your device..."></textarea>
    </div>
    <div class="footer-status">
      <span>Saved to physical storage</span>
    </div>
  </main>
</div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const noteText = ref('This app only exists on the physical Android file structure!')

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
  gap: 16px;
}
.notepad {
  flex: 1;
}
textarea {
  width: 100%;
  height: 300px;
  background-color: #16161a;
  border: 1px solid #242429;
  border-radius: 14px;
  padding: 16px;
  color: #ffffff;
  font-family: inherit;
  font-size: 14px;
  resize: none;
  box-sizing: border-box;
}
textarea:focus {
  outline: 1px solid #48484a;
}
.footer-status {
  text-align: center;
  font-size: 11px;
  color: #48484a;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
</style>


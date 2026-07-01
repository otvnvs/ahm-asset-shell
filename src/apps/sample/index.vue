<template>
<div class="app-container">
  <header class="view-header">
    <button class="back-btn" @click="goHome">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"></polyline></svg>
    </button>
    <h1 class="view-title">Task Master</h1>
  </header>

  <main class="content-body">
    <div class="input-row">
      <input v-model="newTask" type="text" placeholder="Add a quick item..." @keyup.enter="addItem" />
      <button class="add-btn" @click="addItem">+</button>
    </div>

    <ul class="task-list">
      <li v-for="(item, index) in items" :key="index" class="task-item">
        <span class="bullet"></span>
        <span class="task-text">{{ item }}</span>
        <button class="remove-btn" @click="removeItem(index)">×</button>
      </li>
      <li v-if="items.length === 0" class="empty-tasks">All tasks completed!</li>
    </ul>
  </main>
</div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const newTask = ref('')
const items = ref(['Initialize hybrid app sandbox', 'Verify live dynamic routes'])

const addItem = () => {
  if (newTask.value.trim()) {
    items.value.push(newTask.value.trim())
    newTask.value = ''
  }
}

const removeItem = (idx) => {
  items.value.splice(idx, 1)
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
}
.input-row {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
}
input {
  flex: 1;
  background-color: #16161a;
  border: 1px solid #242429;
  border-radius: 12px;
  padding: 12px 16px;
  color: #ffffff;
  font-size: 14px;
}
input:focus {
  outline: 1px solid #48484a;
}
.add-btn {
  background-color: #f3f4f6;
  border: none;
  color: #0a0a0c;
  font-size: 20px;
  font-weight: bold;
  width: 46px;
  border-radius: 12px;
  cursor: pointer;
}
.task-list {
  list-style: none;
  padding: 0;
  margin: 0;
}
.task-item {
  display: flex;
  align-items: center;
  background-color: #16161a;
  border: 1px solid #242429;
  padding: 16px;
  border-radius: 12px;
  margin-bottom: 10px;
}
.bullet {
  width: 8px;
  height: 8px;
  background-color: #30d158;
  border-radius: 50%;
  margin-right: 12px;
}
.task-text {
  flex: 1;
  font-size: 14px;
}
.remove-btn {
  background: none;
  border: none;
  color: #ff453a;
  font-size: 18px;
  cursor: pointer;
}
.empty-tasks {
  text-align: center;
  color: #48484a;
  padding-top: 30px;
  font-size: 14px;
}
</style>


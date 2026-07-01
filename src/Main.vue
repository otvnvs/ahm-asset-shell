<template>
  <div class="minimal-container">
    <router-view></router-view>
  </div>
</template>
<script setup>
import { provide } from 'vue'
import { shellState } from './lib/shell/state.js'
// Natively injects the reactive state instance down into the entire Vue component tree
provide('globalState', shellState)
</script>
<style>
</style>

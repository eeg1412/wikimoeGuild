<template>
  <router-view />
</template>

<script setup>
import { useTheme } from './composables/useTheme.js'

// 在根组件初始化主题（单例，确保应用启动时立即应用存储的主题偏好）
useTheme()
</script>

<template>
  <div
    class="min-h-screen flex flex-col bg-gray-50 dark:bg-[#141414] transition-colors"
  >
    <!-- 顶栏 -->
    <header
      class="flex items-center justify-between px-6 py-4 bg-white dark:bg-[#1d1e1f] shadow-sm"
    >
      <h1 class="text-xl font-bold text-gray-800 dark:text-gray-100">
        WikimoeGuild
      </h1>
      <div class="flex items-center gap-2">
        <el-button text circle @click="toggleTheme">
          <el-icon :size="18">
            <Moon v-if="!isDark" />
            <Sunny v-else />
          </el-icon>
        </el-button>
        <el-button type="primary" @click="$router.push('/login')">
          登录
        </el-button>
      </div>
    </header>
    <!-- 主体 -->
    <main class="flex-1 flex items-center justify-center px-4">
      <router-view />
    </main>
    <!-- 页脚 -->
    <footer class="py-4 text-center text-sm text-gray-400 dark:text-gray-600">
      &copy; 2026 WikimoeGuild
    </footer>
  </div>
</template>
<script setup>
import { useTheme } from '@/composables/useTheme.js'

const { isDark, toggleTheme } = useTheme()
</script>
<style scoped></style>

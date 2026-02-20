<template>
  <div
    class="min-h-screen flex flex-col bg-gray-50 dark:bg-[#141414] transition-colors"
  >
    <header
      class="flex items-center justify-between px-6 py-4 bg-white dark:bg-[#1d1e1f] border-b border-gray-200 dark:border-gray-700 shadow-sm"
    >
      <slot name="header">
        <h1 class="text-lg font-bold text-gray-800 dark:text-gray-100">
          WikimoeGuild
        </h1>
      </slot>
      <el-button text circle @click="toggleTheme">
        <el-icon :size="18">
          <Moon v-if="!isDark" />
          <Sunny v-else />
        </el-icon>
      </el-button>
    </header>

    <main class="flex-1 p-6">
      <slot />
    </main>

    <footer class="py-4 text-center text-sm text-gray-400 dark:text-gray-600">
      <slot name="footer">
        <p>&copy; 2026 WikimoeGuild</p>
      </slot>
    </footer>
  </div>
</template>

<script setup>
import { useTheme } from '../composables/useTheme.js'

const { isDark, toggleTheme } = useTheme()
</script>

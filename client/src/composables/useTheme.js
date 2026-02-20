import { ref, watch } from 'vue'

const STORAGE_KEY = 'app-theme'

// ── 模块级单例状态 ── 所有组件共享同一份 isDark
const isDark = ref(false)
let initialized = false

function applyTheme(dark) {
  document.documentElement.classList.toggle('dark', dark)
}

function initTheme() {
  if (initialized) return
  initialized = true

  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored !== null) {
    isDark.value = stored === 'dark'
  } else {
    // 跟随系统偏好
    isDark.value = window.matchMedia('(prefers-color-scheme: dark)').matches
  }
  applyTheme(isDark.value)

  // 监听变化 → 持久化 + 应用
  watch(isDark, val => {
    localStorage.setItem(STORAGE_KEY, val ? 'dark' : 'light')
    applyTheme(val)
  })
}

/**
 * 暗模式管理（单例）
 * 所有组件共享同一份 isDark 状态，持久化到 localStorage，
 * 应用到 <html> 的 class="dark"
 */
export function useTheme() {
  initTheme()

  function toggleTheme() {
    isDark.value = !isDark.value
  }

  return { isDark, toggleTheme }
}

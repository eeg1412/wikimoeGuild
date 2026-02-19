import { ref, watch, onMounted } from 'vue'

const STORAGE_KEY = 'admin-theme'

/**
 * 暗模式管理
 * 持久化到 localStorage，应用到 <html> 的 class="dark"
 */
export function useTheme() {
  const isDark = ref(false)

  function applyTheme(dark) {
    const html = document.documentElement
    if (dark) {
      html.classList.add('dark')
    } else {
      html.classList.remove('dark')
    }
  }

  function toggleTheme() {
    isDark.value = !isDark.value
  }

  onMounted(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored !== null) {
      isDark.value = stored === 'dark'
    } else {
      // 跟随系统偏好
      isDark.value = window.matchMedia('(prefers-color-scheme: dark)').matches
    }
    applyTheme(isDark.value)
  })

  watch(isDark, val => {
    localStorage.setItem(STORAGE_KEY, val ? 'dark' : 'light')
    applyTheme(val)
  })

  return { isDark, toggleTheme }
}

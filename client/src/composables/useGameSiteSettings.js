import { ref, onMounted } from 'vue'
import { getSiteSettingsApi } from '@/api/game/config.js'

// 全局单例缓存
const siteSettings = ref({
  siteTitle: '',
  siteSubTitle: '',
  siteKeywords: '',
  siteUrl: ''
})
const settingsLoaded = ref(false)

export function useGameSiteSettings() {
  async function loadSiteSettings() {
    if (settingsLoaded.value) return
    try {
      const res = await getSiteSettingsApi()
      Object.assign(siteSettings.value, res.data.data || {})
      settingsLoaded.value = true
    } catch {
      // 忽略错误
    }
  }

  return { siteSettings, settingsLoaded, loadSiteSettings }
}

import { ref, computed } from 'vue'
import { getMeApi } from '@/api/game/auth.js'

// 全局单例状态
const playerToken = ref(localStorage.getItem('playerToken') || '')
const playerInfo = ref(null)
const playerLoaded = ref(false)

export function useGameUser() {
  const isLoggedIn = computed(() => !!playerToken.value)

  /**
   * 公会图标路径
   */
  const guildIconUrl = computed(() => {
    if (!playerInfo.value) return ''
    const id = playerInfo.value.account
    if (playerInfo.value.hasCustomGuildIcon) {
      return `/uploads/custom-guild-icon/${id}.png`
    }
    return `/uploads/default-guild-icon/${id}.png`
  })

  /**
   * 登录后设置 token 和信息
   */
  function setLogin(token, info) {
    playerToken.value = token
    playerInfo.value = info
    playerLoaded.value = true
    localStorage.setItem('playerToken', token)
  }

  /**
   * 退出登录
   */
  function logout() {
    playerToken.value = ''
    playerInfo.value = null
    playerLoaded.value = false
    localStorage.removeItem('playerToken')
  }

  /**
   * 从服务端拉取当前玩家信息
   */
  async function fetchPlayerInfo() {
    if (!playerToken.value) return
    try {
      const res = await getMeApi()
      playerInfo.value = res.data.data
      playerLoaded.value = true
    } catch {
      logout()
    }
  }

  return {
    playerToken,
    playerInfo,
    playerLoaded,
    isLoggedIn,
    guildIconUrl,
    setLogin,
    logout,
    fetchPlayerInfo
  }
}

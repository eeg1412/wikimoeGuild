import { ref, computed } from 'vue'
import { getMeApi } from '@/api/game/auth.js'

// 全局单例状态
const playerAccessToken = ref(localStorage.getItem('playerAccessToken') || '')
const playerInfo = ref(null)
const playerLoaded = ref(false)

export function useGameUser() {
  const isLoggedIn = computed(() => !!playerAccessToken.value)

  /**
   * 公会图标路径
   */
  const guildIconUrl = computed(() => {
    if (!playerInfo.value) return ''
    const id = playerInfo.value.account
    if (playerInfo.value.hasCustomGuildIcon) {
      const t = playerInfo.value.customGuildIconUpdatedAt
        ? new Date(playerInfo.value.customGuildIconUpdatedAt).getTime()
        : ''
      return `/uploads/custom-guild-icon/${id}.png${t ? '?t=' + t : ''}`
    }
    return `/uploads/default-guild-icon/${id}.png`
  })

  /**
   * 登录后设置 token 和信息
   * @param {string} accessToken
   * @param {string} refreshToken
   * @param {object} info - 玩家信息
   */
  function setLogin(accessToken, refreshToken, info) {
    playerAccessToken.value = accessToken
    playerInfo.value = info
    playerLoaded.value = true
    localStorage.setItem('playerAccessToken', accessToken)
    localStorage.setItem('playerRefreshToken', refreshToken)
  }

  /**
   * 退出登录
   */
  function logout() {
    playerAccessToken.value = ''
    playerInfo.value = null
    playerLoaded.value = false
    localStorage.removeItem('playerAccessToken')
    localStorage.removeItem('playerRefreshToken')
  }

  /**
   * 从服务端拉取当前玩家信息
   */
  async function fetchPlayerInfo() {
    if (!playerAccessToken.value) return
    try {
      const res = await getMeApi()
      playerInfo.value = res.data.data
      playerLoaded.value = true
    } catch {
      logout()
    }
  }

  return {
    playerToken: playerAccessToken,
    playerInfo,
    playerLoaded,
    isLoggedIn,
    guildIconUrl,
    setLogin,
    logout,
    fetchPlayerInfo
  }
}

import { useUserStore } from '../stores/user.js'

/**
 * 用户相关的组合式函数
 */
export function useUser() {
  const userStore = useUserStore()

  const isLoggedIn = computed(() => !!userStore.token)
  const username = computed(() => userStore.user?.username || '')

  return {
    isLoggedIn,
    username,
    user: userStore.user,
    login: userStore.login,
    logout: userStore.logout,
    fetchProfile: userStore.fetchProfile
  }
}

import { defineStore } from 'pinia'
import { ref } from 'vue'
import { adminLoginApi, adminProfileApi } from '../api/admin/auth.js'

export const useAdminStore = defineStore('admin', () => {
  const user = ref(null)
  const accessToken = ref(localStorage.getItem('adminAccessToken') || '')

  async function login(credentials) {
    const { data } = await adminLoginApi(credentials)
    const { admin, accessToken: at, refreshToken: rt } = data.data
    accessToken.value = at
    user.value = admin
    localStorage.setItem('adminAccessToken', at)
    localStorage.setItem('adminRefreshToken', rt)
  }

  async function fetchProfile() {
    const { data } = await adminProfileApi()
    user.value = data.data
  }

  function logout() {
    user.value = null
    accessToken.value = ''
    localStorage.removeItem('adminAccessToken')
    localStorage.removeItem('adminRefreshToken')
  }

  return { user, token: accessToken, login, fetchProfile, logout }
})

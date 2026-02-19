import { defineStore } from 'pinia'
import { ref } from 'vue'
import { adminLoginApi, adminProfileApi } from '../api/admin/auth.js'

export const useAdminStore = defineStore('admin', () => {
  const user = ref(null)
  const token = ref(localStorage.getItem('adminToken') || '')

  async function login(credentials) {
    const { data } = await adminLoginApi(credentials)
    token.value = data.data.token
    user.value = data.data.user
    localStorage.setItem('adminToken', data.data.token)
  }

  async function fetchProfile() {
    const { data } = await adminProfileApi()
    user.value = data.data
  }

  function logout() {
    user.value = null
    token.value = ''
    localStorage.removeItem('adminToken')
  }

  return { user, token, login, fetchProfile, logout }
})

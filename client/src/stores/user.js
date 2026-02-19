import { defineStore } from 'pinia'
import { ref } from 'vue'
import { loginApi, getProfileApi } from '../api/user.js'

export const useUserStore = defineStore('user', () => {
  const user = ref(null)
  const token = ref(localStorage.getItem('token') || '')

  async function login(credentials) {
    const { data } = await loginApi(credentials)
    token.value = data.data.token
    user.value = data.data.user
    localStorage.setItem('token', data.data.token)
  }

  async function fetchProfile() {
    const { data } = await getProfileApi()
    user.value = data.data
  }

  function logout() {
    user.value = null
    token.value = ''
    localStorage.removeItem('token')
  }

  return { user, token, login, fetchProfile, logout }
})

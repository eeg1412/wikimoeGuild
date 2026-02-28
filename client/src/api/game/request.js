import axios from 'axios'
import { ElMessage } from 'element-plus'

const gameRequest = axios.create({
  baseURL: '/api/game',
  timeout: 300000
})

/**
 * 双 Token 刷新队列机制
 * - isRefreshing: 是否正在刷新 token
 * - refreshQueue: 等待刷新完成的请求回调队列
 */
let isRefreshing = false
let refreshQueue = []

function processQueue(error, accessToken = null) {
  refreshQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error)
    } else {
      resolve(accessToken)
    }
  })
  refreshQueue = []
}

function redirectToGameLogin(message = '登录已过期，请重新登录') {
  ElMessage.error(message)
  localStorage.removeItem('playerAccessToken')
  localStorage.removeItem('playerRefreshToken')
  window.location.href = '/game/login'
}

// 请求拦截器 — 附加 accessToken
gameRequest.interceptors.request.use(
  config => {
    const token = localStorage.getItem('playerAccessToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  error => Promise.reject(error)
)

// 响应拦截器 — 统一错误处理 + 自动刷新 Token
gameRequest.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config
    const status = error.response?.status
    const message = error.response?.data?.message

    // 401 且非刷新接口本身
    if (
      status === 401 &&
      !originalRequest._isRetry &&
      !originalRequest._isRefresh
    ) {
      const refreshToken = localStorage.getItem('playerRefreshToken')

      if (!refreshToken) {
        redirectToGameLogin()
        return Promise.reject(error)
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          refreshQueue.push({ resolve, reject })
        })
          .then(accessToken => {
            originalRequest.headers.Authorization = `Bearer ${accessToken}`
            return gameRequest(originalRequest)
          })
          .catch(err => Promise.reject(err))
      }

      originalRequest._isRetry = true
      isRefreshing = true

      try {
        const res = await axios.post(
          '/api/game/auth/refresh',
          { refreshToken },
          { _isRefresh: true }
        )
        const { accessToken, refreshToken: newRefreshToken } = res.data.data
        localStorage.setItem('playerAccessToken', accessToken)
        localStorage.setItem('playerRefreshToken', newRefreshToken)

        processQueue(null, accessToken)

        originalRequest.headers.Authorization = `Bearer ${accessToken}`
        return gameRequest(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError, null)
        redirectToGameLogin('登录已过期，请重新登录')
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    if (status === 403) {
      ElMessage.error(message || '您的账号已被封禁，禁止访问')
    } else if (status === 429) {
      ElMessage.error(message || '操作过于频繁，请稍后再试')
    } else if (message) {
      ElMessage.error(message)
    } else if (status) {
      ElMessage.error('请求失败，请稍后重试')
    }

    // 标记错误已由拦截器处理，避免调用方重复弹出
    if (error.response) {
      error.response._errorHandled = true
    }

    return Promise.reject(error)
  }
)

export default gameRequest

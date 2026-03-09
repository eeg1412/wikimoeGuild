import axios from 'axios'
import router from '@/router'
import { ElMessage } from 'element-plus'

const adminRequest = axios.create({
  baseURL: '/api/admin',
  timeout: 300000
})

/**
 * 双 Token 刷新队列机制
 * - isRefreshing: 是否正在刷新 token
 * - refreshQueue: 等待刷新完成的请求回调队列
 */
let isRefreshing = false
let refreshQueue = []

/** 执行队列中所有等待的请求 */
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

/** 跳转到登录页并清除 token */
function redirectToLogin(message = '登录已过期，请重新登录') {
  ElMessage.error({ message, showClose: true })
  localStorage.removeItem('adminRefreshToken')
  router.push('/admin/login')
}

// 请求拦截器 — 附加 accessToken
adminRequest.interceptors.request.use(
  config => {
    const token = localStorage.getItem('adminAccessToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  error => Promise.reject(error)
)

// 响应拦截器 — 统一错误处理 + 自动刷新 Token
adminRequest.interceptors.response.use(
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
      const refreshToken = localStorage.getItem('adminRefreshToken')

      // 没有 refreshToken，直接跳转登录
      if (!refreshToken) {
        redirectToLogin()
        return Promise.reject(error)
      }

      // 如果已经在刷新中，将请求加入队列等待
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          refreshQueue.push({ resolve, reject })
        })
          .then(accessToken => {
            originalRequest.headers.Authorization = `Bearer ${accessToken}`
            return adminRequest(originalRequest)
          })
          .catch(err => Promise.reject(err))
      }

      // 开始刷新
      originalRequest._isRetry = true
      isRefreshing = true

      try {
        // 直接用 axios 调用刷新接口，避免触发拦截器循环
        const res = await axios.post(
          '/api/admin/auth/refresh',
          { refreshToken },
          { _isRefresh: true }
        )
        const { accessToken, refreshToken: newRefreshToken } = res.data.data
        localStorage.setItem('adminAccessToken', accessToken)
        localStorage.setItem('adminRefreshToken', newRefreshToken)

        // 通知所有等待的请求
        processQueue(null, accessToken)

        // 重试原请求
        originalRequest.headers.Authorization = `Bearer ${accessToken}`
        return adminRequest(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError, null)
        const refreshStatus = refreshError.response?.status
        // 仅在 token 校验失败（401/403）时清除本地 token，服务器内部错误不清除
        if (refreshStatus === 401 || refreshStatus === 403) {
          redirectToLogin('登录已过期，请重新登录')
        } else {
          ElMessage.error({ message: '刷新登录状态失败，请稍后重试', showClose: true })
        }
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    // 403 禁止访问
    if (status === 403) {
      ElMessage.error({ message: message || '权限不足', showClose: true })
      return Promise.reject(error)
    }

    if (status === 429) {
      ElMessage.error({ message: message || '操作过于频繁，请稍后再试', showClose: true })
      return Promise.reject(error)
    }

    if (message) {
      ElMessage.error({ message, showClose: true })
    } else if (status) {
      ElMessage.error({ message: `请求失败，状态码 ${status}`, showClose: true })
    }

    return Promise.reject(error)
  }
)

export default adminRequest

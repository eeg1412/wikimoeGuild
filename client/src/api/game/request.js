import axios from 'axios'
import { ElMessage } from 'element-plus'

const gameRequest = axios.create({
  baseURL: '/api/game',
  timeout: 300000
})

// 请求拦截器 — 附加玩家 token
gameRequest.interceptors.request.use(
  config => {
    const token = localStorage.getItem('playerToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  error => Promise.reject(error)
)

// 响应拦截器 — 统一错误处理
gameRequest.interceptors.response.use(
  response => response,
  error => {
    const status = error.response?.status
    const message = error.response?.data?.message
    if (status === 401) {
      ElMessage.error('登录已过期，请重新登录')
      localStorage.removeItem('playerToken')
      window.location.href = '/game/login'
    } else if (status === 403) {
      ElMessage.error(message || '您的 IP 已被封禁，禁止访问')
    } else if (status === 429) {
      ElMessage.error(message || '操作过于频繁，请稍后再试')
    } else if (message) {
      ElMessage.error(message)
    } else {
      ElMessage.error('请求失败，请稍后重试')
    }
    return Promise.reject(error)
  }
)

export default gameRequest

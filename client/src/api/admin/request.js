import axios from 'axios'

const adminRequest = axios.create({
  baseURL: '/api/admin',
  timeout: 10000
})

// 请求拦截器 — 附加管理后台 token
adminRequest.interceptors.request.use(
  config => {
    const token = localStorage.getItem('adminToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  error => Promise.reject(error)
)

// 响应拦截器 — 管理后台统一错误处理
adminRequest.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('adminToken')
      window.location.href = '/admin/login'
    }
    return Promise.reject(error)
  }
)

export default adminRequest

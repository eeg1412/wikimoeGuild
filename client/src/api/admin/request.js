import axios from 'axios'
import router from '@/router'
// 导入element-plus的消息组件
import { ElMessage } from 'element-plus'

const adminRequest = axios.create({
  baseURL: '/api/admin',
  timeout: 300000
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
    switch (error.response?.status) {
      case 401:
        ElMessage.error('未授权，请重新登录')
        localStorage.removeItem('adminToken')
        router.push('/admin/login')
        break
      default:
        const message =
          error.response?.data?.message ||
          `请求失败，状态码 ${error.response?.status}`
        ElMessage.error(message)
        break
    }
    // if (error.response?.status === 401) {
    //   localStorage.removeItem('adminToken')
    //   router.push('/admin/login')
    // }
    return Promise.reject(error)
  }
)

export default adminRequest

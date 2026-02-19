import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../views/HomeView.vue')
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/LoginView.vue')
  },
  // ── 管理后台 ──
  {
    path: '/admin/login',
    name: 'AdminLogin',
    component: () => import('../views/admin/LoginView.vue'),
    meta: { title: '管理后台登录' }
  },
  {
    path: '/admin',
    component: () => import('../layouts/AdminLayout.vue'),
    redirect: '/admin/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'AdminDashboard',
        component: () => import('../views/admin/DashboardView.vue'),
        meta: { title: '仪表盘' }
      },
      {
        path: 'blog-post',
        name: 'AdminBlogPost',
        component: () => import('../views/admin/blog-post/index.vue'),
        meta: { title: '文章管理' }
      },
      {
        path: 'category',
        name: 'AdminCategory',
        component: () => import('../views/admin/category/index.vue'),
        meta: { title: '分类管理' }
      }
      // ===GENERATOR_ADMIN_ROUTE===
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 管理后台路由守卫
router.beforeEach(to => {
  // 访问管理后台（非登录页）需要 adminToken
  if (to.path.startsWith('/admin') && to.name !== 'AdminLogin') {
    const adminToken = localStorage.getItem('adminToken')
    if (!adminToken) return { name: 'AdminLogin' }
  }
  // 已登录管理员访问登录页，重定向到仪表盘
  if (to.name === 'AdminLogin') {
    const adminToken = localStorage.getItem('adminToken')
    if (adminToken) return { path: '/admin/dashboard' }
  }
})

export default router

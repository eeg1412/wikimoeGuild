import { createRouter, createWebHistory } from 'vue-router'

/** 简单解析 JWT payload（仅用于 UI-level 权限判断，安全由服务端保障） */
function parseJwtPayload(token) {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    return JSON.parse(atob(base64))
  } catch {
    return null
  }
}

const routes = [
  {
    path: '/',
    redirect: '/game/home'
  },
  // ── 安装 ──
  {
    path: '/install',
    name: 'Install',
    component: () => import('../views/InstallView.vue'),
    meta: { title: '安装向导' }
  },
  // ── 游戏界面 ──
  {
    path: '/game',
    name: 'Game',
    redirect: '/game/home',
    component: () => import('../layouts/GameLayout.vue'),
    children: [
      {
        path: 'home',
        name: 'GameHome',
        component: () => import('../views/game/home/HomeView.vue'),
        meta: { title: '游戏界面' }
      },
      {
        path: 'login',
        name: 'GameLogin',
        component: () => import('../views/game/auth/LoginView.vue'),
        meta: { title: '登录' }
      },
      {
        path: 'register',
        name: 'GameRegister',
        component: () => import('../views/game/auth/RegisterView.vue'),
        meta: { title: '注册' }
      },
      {
        path: 'forgot-password',
        name: 'GameForgotPassword',
        component: () => import('../views/game/auth/ForgotPasswordView.vue'),
        meta: { title: '找回密码' }
      }
    ]
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
        path: 'global-config',
        name: 'AdminGlobalConfig',
        component: () => import('../views/admin/global-config/Index.vue'),
        meta: { title: '配置管理' }
      },
      {
        path: 'login-log',
        name: 'AdminLoginLog',
        component: () => import('../views/admin/login-log/Index.vue'),
        meta: { title: '登录历史' }
      },
      {
        path: 'profile/change-password',
        name: 'AdminChangePassword',
        component: () =>
          import('../views/admin/profile/ChangePasswordView.vue'),
        meta: { title: '修改密码' }
      },
      {
        path: 'admin-management',
        name: 'AdminManagement',
        component: () => import('../views/admin/admin-management/Index.vue'),
        meta: { title: '管理员列表', requiredRole: 999 }
      },
      {
        path: 'admin-management/editor',
        name: 'AdminManagementEditor',
        component: () => import('../views/admin/admin-management/Editor.vue'),
        meta: {
          title: '管理员编辑',
          createTitle: '管理员新增',
          dynamicTitle: true,
          requiredRole: 999,
          breadcrumbParent: {
            title: '管理员列表',
            name: 'AdminManagement',
            path: '/admin/admin-management'
          }
        }
      },
      {
        path: 'game-player',
        name: 'AdminGamePlayer',
        component: () => import('../views/admin/game-player/Index.vue'),
        meta: { title: '玩家列表' }
      },
      {
        path: 'game-mail-code',
        name: 'AdminGameMailCode',
        component: () => import('../views/admin/game-mail-code/Index.vue'),
        meta: { title: '邮件验证码' }
      },
      {
        path: 'game-player-login-log',
        name: 'AdminGamePlayerLoginLog',
        component: () =>
          import('../views/admin/game-player-login-log/Index.vue'),
        meta: { title: '玩家登录日志' }
      },
      {
        path: 'game-player-register-log',
        name: 'AdminGamePlayerRegisterLog',
        component: () =>
          import('../views/admin/game-player-register-log/Index.vue'),
        meta: { title: '玩家注册日志' }
      },
      {
        path: 'game-player-ban-log',
        name: 'AdminGamePlayerBanLog',
        component: () => import('../views/admin/game-player-ban-log/Index.vue'),
        meta: { title: '封禁记录' }
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
  // 访问管理后台（非登录页）需要 adminAccessToken
  if (to.path.startsWith('/admin') && to.name !== 'AdminLogin') {
    const adminToken = localStorage.getItem('adminAccessToken')
    if (!adminToken) return { name: 'AdminLogin' }

    // 检查需要特定 role 的路由
    if (to.meta?.requiredRole) {
      const payload = parseJwtPayload(adminToken)
      if (!payload || payload.role !== to.meta.requiredRole) {
        return { name: 'AdminDashboard' }
      }
    }
  }
  // 已登录管理员访问登录页，重定向到仪表盘
  if (to.name === 'AdminLogin') {
    const adminToken = localStorage.getItem('adminAccessToken')
    if (adminToken) return { path: '/admin/dashboard' }
  }
})

export default router

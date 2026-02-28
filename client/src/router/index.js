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
        path: 'adventurers',
        name: 'GameAdventurers',
        component: () => import('../views/game/AdventurersView.vue'),
        meta: { title: '冒险家列表', requiresPlayerAuth: true }
      },
      {
        path: 'dungeon',
        name: 'GameDungeon',
        component: () => import('../views/game/DungeonView.vue'),
        meta: { title: '地下迷宫', requiresPlayerAuth: true }
      },
      {
        path: 'rune-stones',
        name: 'GameRuneStones',
        component: () => import('../views/game/RuneStonesView.vue'),
        meta: { title: '符文石', requiresPlayerAuth: true }
      },
      {
        path: 'formations',
        name: 'GameFormations',
        component: () => import('../views/game/FormationView.vue'),
        meta: { title: '阵容配置', requiresPlayerAuth: true }
      },
      {
        path: 'inventory',
        name: 'GameInventory',
        component: () => import('../views/game/InventoryView.vue'),
        meta: { title: '背包', requiresPlayerAuth: true }
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
      },
      {
        path: 'mail',
        name: 'GameMail',
        component: () => import('../views/game/MailView.vue'),
        meta: { title: '邮箱', requiresPlayerAuth: true }
      },
      {
        path: 'market',
        name: 'GameMarket',
        component: () => import('../views/game/MarketView.vue'),
        meta: { title: '交易市场', requiresPlayerAuth: true }
      },
      {
        path: 'arena',
        name: 'GameArena',
        component: () => import('../views/game/ArenaView.vue'),
        meta: { title: '竞技场', requiresPlayerAuth: true }
      },
      {
        path: 'mine',
        name: 'GameMine',
        component: () => import('../views/game/MineView.vue'),
        meta: { title: '矿场', requiresPlayerAuth: true }
      },
      {
        path: 'guild-settings',
        name: 'GameGuildSettings',
        component: () => import('../views/game/GuildSettingsView.vue'),
        meta: { title: '公会设置', requiresPlayerAuth: true }
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
      },
      {
        path: 'game-adventurer',
        name: 'AdminGameAdventurer',
        component: () => import('../views/admin/game-adventurer/Index.vue'),
        meta: { title: '冒险家列表' }
      },
      {
        path: 'game-mail',
        name: 'AdminGameMail',
        component: () => import('../views/admin/game-mail/Index.vue'),
        meta: { title: '发送邮件' }
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
  // 游戏端需要登录的路由守卫
  if (to.meta?.requiresPlayerAuth) {
    const playerToken = localStorage.getItem('playerAccessToken')
    if (!playerToken)
      return { name: 'GameLogin', query: { redirect: to.fullPath } }
  }

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

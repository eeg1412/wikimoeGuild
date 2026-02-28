export const adminMenu = [
  {
    path: '/admin/dashboard',
    title: '仪表盘',
    icon: 'Odometer'
  },
  {
    path: '/admin/login-log',
    title: '登录历史',
    icon: 'List'
  },
  {
    path: '/admin/global-config',
    title: '配置管理',
    icon: 'Document'
  },
  {
    path: '/admin/admin-management',
    title: '管理员列表',
    icon: 'UserFilled',
    requiredRole: 999
  },
  {
    title: '玩家管理',
    icon: 'Medal',
    children: [
      { path: '/admin/game-player', title: '玩家列表', icon: 'User' },
      {
        path: '/admin/game-adventurer',
        title: '冒险家列表',
        icon: 'Promotion'
      },
      { path: '/admin/game-mail-code', title: '邮件验证码', icon: 'Message' },
      { path: '/admin/game-mail', title: '发送邮件', icon: 'Promotion' },
      {
        path: '/admin/game-player-ban-log',
        title: '封禁记录',
        icon: 'CircleClose'
      },
      {
        path: '/admin/game-player-login-log',
        title: '玩家登录日志',
        icon: 'Key'
      },
      {
        path: '/admin/game-player-register-log',
        title: '玩家注册日志',
        icon: 'UserFilled'
      }
    ]
  }
  // ===GENERATOR_MENU===
]

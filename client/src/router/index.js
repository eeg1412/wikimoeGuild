import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'Home',
    redirect: { name: 'GameHome' }
  },
  {
    path: '/game',
    name: 'GameIndex',
    redirect: { name: 'GameHome' },
    component: () => import(/* webpackChunkName: "game" */ '../views/game/Index.vue'),
    children: [
      // home
      {
        path: 'home',
        name: 'GameHome',
        component: () => import(/* webpackChunkName: "game" */ '../views/game/home/Home.vue')
      },
      // register
      {
        path: 'register',
        name: 'GameRegister',
        component: () => import(/* webpackChunkName: "game" */ '../views/game/register/Register.vue')
      },
    ]
  }
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

export default router

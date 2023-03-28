import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'Home',
    redirect: { name: 'GameIndex' }
  },
  {
    path: '/game',
    name: 'GameIndex',
    component: () => import(/* webpackChunkName: "game" */ '../views/game/Index.vue'),
    children: [
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

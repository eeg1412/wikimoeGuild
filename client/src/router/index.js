import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import store from '../store'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home,
    meta: {
      shouldPlayerLogin: true,
      shouldAdminLogin: false
    },
    children: [
      { //默认
        path: '',
        redirect: 'game'
      },
      {
        name: 'Game',
        path: 'game',
        component: () => import(/* webpackChunkName: "Game" */ '../views/game/Game.vue'),
        meta: {
          shouldPlayerLogin: true,
          shouldAdminLogin: false
        },
      },
    ]
  },
  {
    path: '/about',
    name: 'About',
    // route level code-splitting
    // this generates a separate chunk (about.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () => import(/* webpackChunkName: "about" */ '../views/About.vue')
  },
  {
    path: '/account',
    name: 'Account',
    component: () => import(/* webpackChunkName: "about" */ '../views/Account.vue'),
    meta: {
      shouldPlayerLogin: false,
      shouldAdminLogin: false
    }
  }
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})
router.beforeEach((to, from, next) => {
  console.log(to, store.getters.token);
  const shouldPlayerLogin = to.meta.shouldPlayerLogin
  const shouldAdminLogin = to.meta.shouldAdminLogin
  const token = store.getters.token
  if (shouldPlayerLogin) {
    if (!token) {
      router.replace({ name: 'Account' });
    }
  }
  next();
});
export default router

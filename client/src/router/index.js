import { createRouter, createWebHistory } from "vue-router";
import GameIndex from "../views/game/Index.vue";
import store from "../store";

const routes = [
  {
    path: "/",
    name: "Home",
    component: GameIndex,
    meta: {
      shouldPlayerLogin: true,
      shouldAdminLogin: false
    },
    children: [
      {
        //默认
        path: "",
        redirect: "game"
      },
      {
        name: "Game",
        path: "game",
        component: () =>
          import(/* webpackChunkName: "Game" */ "../views/game/Game.vue"),
        meta: {
          shouldPlayerLogin: true,
          shouldAdminLogin: false
        }
      }
    ]
  },
  {
    path: "/account",
    name: "Account",
    component: () =>
      import(/* webpackChunkName: "about" */ "../views/Account.vue"),
    meta: {
      shouldPlayerLogin: false,
      shouldAdminLogin: false
    }
  }
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
});
router.beforeEach((to, from, next) => {
  console.log(to, store.getters.token);
  const shouldPlayerLogin = to.meta.shouldPlayerLogin;
  const shouldAdminLogin = to.meta.shouldAdminLogin;
  const token = store.getters.token;
  if (shouldPlayerLogin) {
    if (!token) {
      router.replace({ name: "Account" });
    }
  }
  next();
});
export default router;

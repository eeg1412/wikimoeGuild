import { createAPI } from "./create-api";
import auth from "./module/auth";
import store from "../store";
import router from "../router";
import i18n from "../lang";

const api = createAPI({ baseURL: "/api" });
//请求拦截器
api.interceptors.request.use(
  config => {
    config.headers["token"] = store.getters.token;
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);
//响应拦截器
api.interceptors.response.use(
  response => {
    const $t = i18n.global.t;
    if (response.data.code == 403) {
      store.commit("showToast", {
        severity: "error",
        summary: $t("m.label.error"),
        detail: $t("m.error.code.403"),
        life: 3000
      });
      sessionStorage.removeItem("token");
      localStorage.removeItem("token");
      router.replace({ name: "Account" });
    }
    return response;
  },
  error => {
    return Promise.reject(error);
  }
);
export const authApi = auth(api);

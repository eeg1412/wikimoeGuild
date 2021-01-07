import Vue from "vue";
import App from "./App.vue";
import router from "./router";
import store from "./store";
// eslint-disable-next-line
import ElementUI from 'element-ui';
// eslint-disable-next-line
import 'element-ui/lib/theme-chalk/index.css';
// eslint-disable-next-line
import './assets/style.css';

Vue.config.productionTip = false;
Vue.use(ElementUI);
new Vue({
  router,
  store,
  render: h => h(App)
}).$mount("#app");

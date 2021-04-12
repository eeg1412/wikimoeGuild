import { createApp } from 'vue'
import App from './App.vue'
import './registerServiceWorker'
import PrimeVue from 'primevue/config'
import router from './router'
import store from './store'
import i18n from './lang'

const viewApp = createApp(App)
viewApp.use(PrimeVue)
viewApp.use(i18n)
viewApp.use(store).use(router).mount('#app')
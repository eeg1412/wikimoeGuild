import { createApp } from 'vue'
import App from './App.vue'
import './registerServiceWorker'
import PrimeVue from 'primevue/config'
import router from './router'
import store from './store'
import i18n from './lang'
import './assets/style.css';
import 'primevue/resources/themes/bootstrap4-light-purple/theme.css'


const viewApp = createApp(App)
viewApp.use(PrimeVue)
viewApp.use(i18n)
viewApp.use(store).use(router).mount('#app')
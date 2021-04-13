import { createApp } from 'vue'
import App from './App.vue'
import './registerServiceWorker'
import PrimeVue from 'primevue/config'
import router from './router'
import store from './store'
import i18n from './lang'
import 'primevue/resources/primevue.min.css'
import 'primevue/resources/themes/bootstrap4-light-purple/theme.css'
import 'primeicons/primeicons.css'
import 'primeflex/primeflex.css';
import './assets/style.css';


const viewApp = createApp(App)
viewApp.use(PrimeVue)
viewApp.use(i18n)
viewApp.use(store).use(router).mount('#app')
viewApp.config.globalProperties.$i18n = i18n
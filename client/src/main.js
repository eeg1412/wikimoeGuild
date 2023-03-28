import { createApp } from 'vue'
import App from './App.vue'
import './registerServiceWorker'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import router from './router'
import store from './store'
import './assets/css/common.css'
import 'cropperjs/dist/cropper.css';

const app = createApp(App)
app.use(ElementPlus)
app.use(store).use(router)
app.mount('#app')
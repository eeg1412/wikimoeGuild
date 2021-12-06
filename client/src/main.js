import { createApp } from "vue";
import App from "./App.vue";
import ToastService from "primevue/toastservice";
import "./registerServiceWorker";
import PrimeVue from "primevue/config";
import router from "./router";
import store from "./store";
import i18n from "./lang";
import "primevue/resources/primevue.min.css";
import "primevue/resources/themes/bootstrap4-light-purple/theme.css";
import "primeicons/primeicons.css";
import "primeflex/primeflex.css";
import "./assets/style.css";

import InputText from "primevue/inputtext";
import Password from "primevue/password";
import Button from "primevue/button";
import AutoComplete from "primevue/autocomplete";
import RadioButton from "primevue/radiobutton";
import InputNumber from "primevue/inputnumber";
import Tag from "primevue/tag";
import Dropdown from "primevue/dropdown";
import FileUpload from "primevue/fileupload";
import MultiSelect from "primevue/multiselect";

import Slider from "primevue/slider";
import InputSwitch from "primevue/inputswitch";
import Dialog from "primevue/dialog";

const viewApp = createApp(App);
viewApp.use(PrimeVue);
viewApp.use(ToastService);
viewApp.use(i18n);
viewApp
  .use(store)
  .use(router)
  .mount("#app");
viewApp.config.globalProperties.$i18n = i18n;

viewApp.component("InputText", InputText);
viewApp.component("Password", Password);
viewApp.component("Button", Button);
viewApp.component("AutoComplete", AutoComplete);
viewApp.component("RadioButton", RadioButton);
viewApp.component("InputNumber", InputNumber);
viewApp.component("Tag", Tag);
viewApp.component("Dropdown", Dropdown);
viewApp.component("FileUpload", FileUpload);
viewApp.component("MultiSelect", MultiSelect);
viewApp.component("Slider", Slider);
viewApp.component("InputSwitch", InputSwitch);
viewApp.component("Dialog", Dialog);

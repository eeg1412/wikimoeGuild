<template>
  <Dialog
    v-model:visible="display"
    :breakpoints="{ '850px': '95vw' }"
    :style="{ width: '800px' }"
    :modal="true"
  >
    <template #header>
      <h3>{{ $t("m.label.login") }}</h3>
    </template>
    <div class="p-fluid">
      <div class="p-field">
        <label>{{ $t("m.label.account") }}</label>
        <InputText type="text" v-model="form.account" />
      </div>
      <div class="p-field">
        <label>{{ $t("m.label.password") }}</label>
        <Password v-model="form.password" :feedback="false" toggleMask />
      </div>
      <div class="p-field">
        <label>{{ $t("m.label.saveLoginInfo") }}</label>
        <div><InputSwitch v-model="form.save" /></div>
      </div>
      <div class="p-field">
        <label>{{ $t("m.label.captcha") }}</label>
        <div class="p-inputgroup">
          <InputText type="text" v-model="form.captcha" />
          <img :src="captchaSrc" class="reg_code_img" @click="reflushCaptcha" />
        </div>
      </div>
    </div>
    <template #footer>
      <Button :label="$t('m.label.login')" @click="onLogin" />
      <Button
        :label="$t('m.label.close')"
        class="p-button-text"
        @click="close"
      />
    </template>
  </Dialog>
</template>

<script>
import { ref, reactive, getCurrentInstance } from "vue";
import CropperDialog from "../components/cropperDialog";
// import { mapState } from "vuex";
import store from "../store";
import { authApi } from "../api";
import { useToast } from "primevue/usetoast";
import { useRoute, useRouter } from "vue-router";
const utils = require("../../utils/utils");

export default {
  name: "loginDialog",
  components: {
    CropperDialog
  },
  setup() {
    const display = ref(false);
    const form = reactive({
      password: "",
      account: "",
      captcha: "",
      save: false
    });
    // login
    const router = useRouter();
    const route = useRoute();
    const app = getCurrentInstance();
    const toast = useToast();
    const $t = app.appContext.config.globalProperties.$i18n.global.t;
    const onLogin = () => {
      authApi.login(form).then(res => {
        console.log(res);
        reflushCaptcha();
        if (res.data.code === 0) {
          toast.add({
            severity: "error",
            summary: $t("m.label.error"),
            detail: $t(res.data.msgCode),
            life: 3000
          });
        } else if (res.data.code === 1) {
          store.commit("setToken", res.data.token);
          if (form.save) {
            localStorage.setItem("token", res.data.token);
          } else {
            sessionStorage.setItem("token", res.data.token);
          }
          display.value = false;
          router.replace({
            name: "Home"
          });
        }
      });
    };
    // close and open
    const open = () => {
      display.value = true;
    };
    const close = () => {
      display.value = false;
    };
    // captcha
    const captchaSrc = ref("/api/captcha?time=" + new Date().getTime());
    const reflushCaptcha = () => {
      captchaSrc.value = "/api/captcha?time=" + new Date().getTime();
    };
    return {
      display,
      form,
      open,
      close,
      captchaSrc,
      reflushCaptcha,
      onLogin
    };
  }
};
</script>

<style></style>

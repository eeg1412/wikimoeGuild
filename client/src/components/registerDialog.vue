<template>
  <Dialog
    v-model:visible="display"
    :breakpoints="{ '850px': '95vw' }"
    :style="{ width: '800px' }"
    :modal="true"
  >
    <template #header>
      <h3>{{ $t("m.label.register") }}</h3>
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
        <label>{{ $t("m.label.passwordRetry") }}</label>
        <Password v-model="form.password2" :feedback="false" toggleMask />
      </div>
      <div class="p-field">
        <label>{{ $t("m.label.nickName") }}</label>
        <InputText type="text" v-model="form.nickName" />
      </div>
      <div class="p-field">
        <label>{{ $t("m.label.guildName") }}</label>
        <InputText type="text" v-model="form.guildName" />
      </div>
      <div class="p-field">
        <label>{{ $t("m.label.accountTx") }}</label>
        <div>
          <img
            :src="form.accountTx"
            v-if="form.accountTx"
            class="mb5 avatar50"
          />
        </div>
        <FileUpload
          mode="basic"
          accept="image/*"
          @uploader="selectAvatar"
          :customUpload="true"
          :auto="true"
          :chooseLabel="$t('m.label.select')"
          ref="avatarUploader"
        />
        <CropperDialog
          :headText="$t('m.label.accountTx')"
          ref="avatarCropperDialog"
          :width="100"
          :height="100"
          @getImage="getAvatar"
        />
      </div>
      <div class="p-field">
        <label>{{ $t("m.label.guildIcon") }}</label>
        <div>
          <img
            :src="form.guildIcon"
            v-if="form.guildIcon"
            class="mb5 avatar50"
          />
        </div>
        <FileUpload
          mode="basic"
          accept="image/*"
          @uploader="selectGuildIcon"
          :customUpload="true"
          :auto="true"
          :chooseLabel="$t('m.label.select')"
          ref="guildIconUploader"
        />
        <CropperDialog
          :headText="$t('m.label.guildIcon')"
          ref="guildIconCropperDialog"
          :width="100"
          :height="100"
          @getImage="getGuildIcon"
        />
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
      <Button :label="$t('m.label.register')" @click="onReg" />
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
import Dialog from "primevue/dialog";
import Button from "primevue/button";
import InputText from "primevue/inputtext";
import Password from "primevue/password";
import FileUpload from "primevue/fileupload";
import CropperDialog from "../components/cropperDialog";
// import { mapState } from "vuex";
import store from "../store";
import { authApi } from "../api";
import { useToast } from "primevue/usetoast";
const utils = require("../../utils/utils");

export default {
  name: "registerDialog",
  components: {
    Button,
    Dialog,
    InputText,
    Password,
    FileUpload,
    CropperDialog
  },
  setup() {
    const display = ref(false);
    const form = reactive({
      password: "",
      password2: "",
      account: "",
      nickName: "",
      guildName: "",
      accountTx: "",
      guildIcon: "",
      captcha: ""
    });
    // register
    const app = getCurrentInstance();
    const toast = useToast();
    const $t = app.appContext.config.globalProperties.$i18n.global.t;
    const onReg = () => {
      if (form.password !== form.password2) {
        toast.add({
          severity: "error",
          summary: $t("m.label.error"),
          detail: "两次密码不同!",
          life: 3000
        });
        return false;
      }
      const {
        account,
        password,
        nickName,
        guildName,
        accountTx,
        guildIcon,
        captcha
      } = form;
      //   校验格式
      if (!utils.accountCheck(account)) {
        toast.add({
          severity: "error",
          summary: $t("m.label.error"),
          detail: "请输入2-16位英数字下划线减号的账号！",
          life: 3000
        });
        return false;
      }
      if (!utils.passwordCheck(password)) {
        toast.add({
          severity: "error",
          summary: $t("m.label.error"),
          detail: "请输入4-16位英数字下划线减号的密码！",
          life: 3000
        });
        return false;
      }
      if (!utils.nickNameCheck(nickName)) {
        toast.add({
          severity: "error",
          summary: $t("m.label.error"),
          detail: "请输2-8位中文、日文、英文、数字包括下划线的昵称！",
          life: 3000
        });
        return false;
      }
      if (!utils.nickNameCheck(guildName)) {
        toast.add({
          severity: "error",
          summary: $t("m.label.error"),
          detail: "请输入2-8位中文、日文、英文、数字包括下划线的公会名称！",
          life: 3000
        });
        return false;
      }
      const jpgReg = new RegExp("data:image/jpeg;base64,");
      if (!jpgReg.test(accountTx)) {
        toast.add({
          severity: "error",
          summary: $t("m.label.error"),
          detail: "请设置会长头像！",
          life: 3000
        });
        return false;
      }
      if (!jpgReg.test(guildIcon)) {
        toast.add({
          severity: "error",
          summary: $t("m.label.error"),
          detail: "请设置公会图标！",
          life: 3000
        });
        return false;
      }
      if (!captcha) {
        toast.add({
          severity: "error",
          summary: $t("m.label.error"),
          detail: "请输入验证码！",
          life: 3000
        });
        return false;
      }
      authApi.register(form).then(res => {
        console.log(res);
        reflushCaptcha();
        if (res.data.code === 0) {
          toast.add({
            severity: "error",
            summary: $t("m.label.error"),
            detail: res.data.msg,
            life: 3000
          });
        } else if (res.data.code === 1) {
          store.commit("setToken", res.data.token);
          display.value = false;
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
    // avatar
    const avatarUploader = ref(null);
    const avatarCropperDialog = ref(null);
    const selectAvatar = ev => {
      console.log(ev, avatarUploader);
      avatarCropperDialog.value.selectFile(ev.files);
      avatarUploader.value.clear();
    };
    const getAvatar = base64 => {
      form.accountTx = base64;
    };
    // guildIcon
    const guildIconUploader = ref(null);
    const guildIconCropperDialog = ref(null);
    const selectGuildIcon = ev => {
      console.log(ev, avatarUploader);
      guildIconCropperDialog.value.selectFile(ev.files);
      guildIconUploader.value.clear();
    };
    const getGuildIcon = base64 => {
      form.guildIcon = base64;
    };
    // captcha
    const captchaSrc = ref("/api/captcha?time=" + new Date().getTime());
    const reflushCaptcha = () => {
      captchaSrc.value = "/api/captcha?time=" + new Date().getTime();
    };
    return {
      display,
      form,
      selectAvatar,
      avatarUploader,
      avatarCropperDialog,
      getAvatar,
      guildIconUploader,
      guildIconCropperDialog,
      selectGuildIcon,
      getGuildIcon,
      captchaSrc,
      reflushCaptcha,
      open,
      close,
      onReg
    };
  }
};
</script>

<style></style>

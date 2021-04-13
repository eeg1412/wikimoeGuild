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
        <InputText type="text" />
      </div>
      <div class="p-field">
        <label>{{ $t("m.label.password") }}</label>
        <Password />
      </div>
      <div class="p-field">
        <label>{{ $t("m.label.passwordRetry") }}</label>
        <Password />
      </div>
      <div class="p-field">
        <label>{{ $t("m.label.nickName") }}</label>
        <InputText type="text" />
      </div>
      <div class="p-field">
        <label>{{ $t("m.label.guildName") }}</label>
        <InputText type="text" />
      </div>
      <div class="p-field">
        <label>{{ $t("m.label.accountTx") }}</label>
        <FileUpload
          mode="basic"
          accept="image/*"
          @uploader="selectAvastar"
          :customUpload="true"
          :auto="true"
          ref="avastarUploader"
        />
      </div>
      <div class="p-field">
        <label>{{ $t("m.label.guildIcon") }}</label>
      </div>
      <div class="p-field">
        <label>{{ $t("m.label.captcha") }}</label>
      </div>
    </div>
    <template #footer>
      <Button :label="$t('m.label.register')" />
      <Button :label="$t('m.label.close')" class="p-button-text" />
    </template>
  </Dialog>
</template>

<script>
import { ref, reactive } from "vue";
import Dialog from "primevue/dialog";
import Button from "primevue/button";
import InputText from "primevue/inputtext";
import Password from "primevue/password";
import FileUpload from "primevue/fileupload";

export default {
  name: "registerDialog",
  components: {
    Button,
    Dialog,
    InputText,
    Password,
    FileUpload
  },
  setup() {
    const display = ref(true);
    const avastarUploader = ref(null);
    const form = reactive({
      password: "",
      account: "",
      nickName: "",
      guildName: "",
      accountTx: "",
      guildIcon: "",
      captcha: ""
    });
    const selectAvastar = ev => {
      console.log(ev, avastarUploader);
      avastarUploader.value.clear();
      return true;
    };
    return { display, form, selectAvastar, avastarUploader };
  }
};
</script>

<style></style>

<template>
  <div class="wm_guild_body wm_login_view" :class="'wm_login_time_' + bgTime">
    <LocaleSelect class="wm_guild_account_locale" />
    <div class="wm_guild_enter_block">
      <!-- TODO:名称由后台设置 -->
      <h1 class="tc mb20">TODO</h1>
      <div class="tc mt30">
        <Button class="mr5">{{ $t("m.label.loginGame") }}</Button>
        <Button class="p-button-info">{{ $t("m.label.register") }}</Button>
      </div>
    </div>
  </div>
  <register-dialog></register-dialog>
</template>

<script>
import moment from "moment";
import Button from "primevue/button";
import RegisterDialog from "../components/registerDialog";
import LocaleSelect from "../components/localeSelect";

export default {
  name: "Account",
  components: {
    Button,
    RegisterDialog,
    LocaleSelect
  },
  computed: {
    bgTime: () => {
      const HH = Number(moment().format("HH"));
      if (HH > 5 && HH <= 14) {
        return "1";
      } else if (HH > 14 && HH < 7) {
        return "2";
      } else {
        return "3";
      }
    }
  }
};
</script>

<style>
.wm_guild_account_locale {
  position: absolute;
  z-index: 1;
  right: 10px;
  top: 10px;
}
</style>

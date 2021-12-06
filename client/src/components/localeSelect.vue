<template>
  <Dropdown
    class="wm_guild-locale-select"
    v-model="lang"
    :options="langList"
    optionLabel="name"
    optionValue="value"
    @change="localeChange"
  />
</template>

<script>
import { ref, getCurrentInstance } from "vue";
export default {
  name: "localeSelect",
  components: {},
  setup() {
    const app = getCurrentInstance();
    const langSelected = String(
      app.appContext.config.globalProperties.$i18n.global.locale
    );
    const langList = ref([
      { name: "中文", value: "zh" },
      { name: "English", value: "en" },
      { name: "日本語", value: "ja" }
    ]);
    const filterLang = langList.value.filter(item => {
      return item.value === langSelected;
    });
    const lang = ref(filterLang.length > 0 ? langSelected : "zh");
    const localeChange = ev => {
      app.appContext.config.globalProperties.$i18n.global.locale = ev.value;
      localStorage.setItem("lang", ev.value);
    };
    return { lang, langList, localeChange };
  }
};
</script>

<style>
.wm_guild-locale-select {
  width: 100px;
  font-size: 12px;
  height: 25px;
  line-height: 25px;
}
.wm_guild-locale-select .p-dropdown-label {
  font-size: 12px;
  padding: 0 8px;
}
</style>

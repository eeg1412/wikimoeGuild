<template>
  <Toast :baseZIndex="9999" />
  <router-view />
</template>
<script>
import Toast from "primevue/toast";
export default {
  components: {
    Toast
  },
  computed: {
    commonToast() {
      return this.$store.getters.commonToast;
    }
  },
  watch: {
    commonToast(val) {
      if (val) {
        this.$toast.add(val);
      }
    }
  },
  created() {
    const token = sessionStorage.getItem("token")
      ? sessionStorage.getItem("token")
      : localStorage.getItem("token");
    this.$store.commit("setToken", token);
  }
};
</script>
<style></style>

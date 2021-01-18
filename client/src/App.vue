<template>
  <div id="app">
    <router-view />
  </div>
</template>

<script>
export default {
  name: "App",
  components: {},
  data() {
    return {};
  },
  computed: {},
  watch: {},
  methods: {},
  created() {
    const token = sessionStorage.getItem("token")
      ? sessionStorage.getItem("token")
      : localStorage.getItem("token");
    this.$store.commit("setToken", token);
  },
  mounted() {},
  beforeCreate() {},
  beforeMount() {},
  beforeUpdate() {},
  updated() {},
  beforeUnmount() {},
  unmounted() {},
  activated() {}
};
</script>
<style></style>

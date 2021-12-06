<template>
  <div class="wm_home">
    <commonTop></commonTop>
    <div class="wm_home_content">
      <router-view></router-view>
    </div>
  </div>
</template>

<script>
// @ is an alias to /src
import commonTop from "@/components/commonTop.vue";

export default {
  name: "Home",
  components: {
    commonTop
  }
};
</script>
<style scoped>
.wm_home {
  padding-top: 40px;
}
.wm_home_content {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
}
</style>

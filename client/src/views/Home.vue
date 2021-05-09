<template>
  <div class="home">
    <commonTop></commonTop>
    <img alt="Vue logo" src="../assets/logo.png" />
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

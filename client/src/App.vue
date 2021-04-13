<template>
  <Toast :baseZIndex="9999" />
  <router-view />
</template>
<script>
import Toast from "primevue/toast";
export default {
  components: {
    Toast
  }
};
</script>
<style></style>

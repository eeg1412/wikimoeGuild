<template>
  <div class="pt10 pb10">
    <charactersList></charactersList>
  </div>
</template>

<script>
import charactersList from "@/components/charactersList.vue";
export default {
  name: "Game",
  components: {
    charactersList
  }
};
</script>

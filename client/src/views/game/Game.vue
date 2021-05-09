<template>
  <div>
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

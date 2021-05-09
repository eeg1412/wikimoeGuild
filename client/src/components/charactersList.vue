<template>
  <div>
    <Carousel :settings="settings" :breakpoints="breakpoints">
      <Slide v-for="slide in 10" :key="slide">
        <div class="carousel__item">{{ slide }}</div>
      </Slide>

      <template #addons>
        <Navigation />
      </template>
    </Carousel>
  </div>
</template>

<script>
import { ref, reactive, getCurrentInstance } from "vue";
import { Carousel, Navigation, Pagination, Slide } from "vue3-carousel";
import "vue3-carousel/dist/carousel.css";
export default {
  name: "charactersList",
  components: {
    Carousel,
    Slide,
    Pagination,
    Navigation
  },
  setup() {
    const settings = reactive({
      itemsToShow: 1,
      snapAlign: "center"
    });
    const breakpoints = reactive({
      // 700px and up
      700: {
        itemsToShow: 3.5,
        snapAlign: "center"
      },
      // 1024 and up
      1024: {
        itemsToShow: 5,
        snapAlign: "start"
      }
    });
    return { settings, breakpoints };
  }
};
</script>

<style></style>

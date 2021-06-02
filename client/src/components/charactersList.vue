<template>
  <div class="wm_carousel_body">
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
      snapAlign: "start"
    });
    const breakpoints = reactive({
      // 700px and up
      700: {
        itemsToShow: 2.5,
        snapAlign: "start"
      },
      // 1024 and up
      1024: {
        itemsToShow: 3.5,
        snapAlign: "start"
      }
    });
    return { settings, breakpoints };
  }
};
</script>

<style scoped>
.wm_carousel_body {
  padding: 10px 20px;
}
.carousel__item {
  background: #000;
  height: 420px;
  margin: 0 5px;
  width: 100%;
}
</style>

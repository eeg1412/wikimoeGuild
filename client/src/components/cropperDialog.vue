<template>
  <Dialog
    v-model:visible="isOpen"
    :breakpoints="{ '850px': '95vw' }"
    :style="{ width: '800px' }"
    :modal="true"
    @hide="close"
  >
    <template #header>
      <h3>{{ headText }}</h3>
    </template>
    <vue-picture-cropper
      :boxStyle="{
        width: '80%',
        height: '80%',
        backgroundColor: '#f8f8f8',
        margin: 'auto'
      }"
      :img="pic"
      :options="{
        viewMode: 1,
        dragMode: 'crop',
        aspectRatio: width / height,
        preview: preview
      }"
    />
    <template #footer>
      <Button :label="$t('m.label.ok')" @click="getResult" />
      <Button
        :label="$t('m.label.close')"
        class="p-button-text"
        @click="close"
      />
    </template>
  </Dialog>
</template>

<script>
import { ref, watch } from "vue";
import Dialog from "primevue/dialog";
import Button from "primevue/button";
import VuePictureCropper, { cropper } from "vue-picture-cropper";

export default {
  name: "cropperDialog",
  components: {
    VuePictureCropper,
    Dialog,
    Button
  },
  props: {
    headText: { type: String, default: "" },
    width: { type: Number, default: 1 },
    height: { type: Number, default: 1 }
  },
  setup(props, context) {
    let uploadInput = ref(null);
    let preview = ref("");
    let pic = ref("");
    let result = ref("");
    let isOpen = ref(false);

    const selectFile = files => {
      const file = files[0];
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        pic.value = reader.result;
        isOpen.value = true;
      };
    };

    const getResult = () => {
      const OPT = {
        width: props.width,
        height: props.height
      };
      //   console.log(cropper.getCroppedCanvas(OPT).toDataURL("image/jpeg", 0.8));
      const DATA_URL = cropper
        .getCroppedCanvas(OPT)
        .toDataURL("image/jpeg", 0.8);
      result.value = DATA_URL;
      context.emit("getImage", DATA_URL);
      isOpen.value = false;
    };
    const close = () => {
      isOpen.value = false;
      context.emit("close");
    };

    const clear = () => {
      cropper.clear();
    };

    const reset = () => {
      cropper.reset();
    };
    return {
      close,
      selectFile,
      uploadInput,
      preview,
      pic,
      result,
      getResult,
      clear,
      reset,
      isOpen
    };
  }
};
</script>

<style></style>

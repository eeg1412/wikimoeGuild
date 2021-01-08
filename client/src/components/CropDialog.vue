<!-- CropDialog -->
<template>
  <div>
    <el-dialog
      title="选择图像"
      :visible.sync="cropDialogShow"
      class="wm_guild_dialog_body"
      width="90%"
      :lock-scroll="false"
      :close-on-click-modal="false"
      @close="$emit('update:show', false)"
    >
      <div>
        <cropper
          class="cropper"
          :src="img"
          :stencil-props="{
            aspectRatio: 1
          }"
          @change="change"
        ></cropper>
      </div>
      <div slot="footer">
        <el-button type="primary" @click="onCrop">确定</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { Cropper } from "vue-advanced-cropper";
import "vue-advanced-cropper/dist/style.css";
const pica = require("pica")();

export default {
  name: "cropDialog",
  props: {
    img: {
      type: String
    },
    show: {
      type: Boolean
    }
  },
  components: { Cropper },
  data() {
    return {
      cropDialogShow: false,
      cropCanvas: null
    };
  },
  computed: {},
  watch: {
    show(val) {
      this.cropDialogShow = val;
    }
  },
  methods: {
    onCrop() {
      this.cropDialogShow = false;
      this.reSizeImg();
    },
    change({ coordinates, canvas }) {
      console.log(coordinates, canvas);
      this.cropCanvas = canvas;
    },
    reSizeImg() {
      const canvas = document.createElement("canvas");
      canvas.width = 100;
      canvas.height = 100;

      pica
        .resize(this.cropCanvas, canvas, {
          unsharpAmount: 80,
          unsharpRadius: 0,
          unsharpThreshold: 0
        })
        .then(() => {
          const cropedImg = canvas.toDataURL("image/jpeg", 0.9);
          this.$emit("onCrop", cropedImg);
          this.cropCanvas = null;
        });
    }
  },
  created() {
    this.cropDialogShow = this.show;
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

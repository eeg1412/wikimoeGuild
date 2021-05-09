<template>
  <div v-if="playerInfo" class="wm_common_top_body clearfix">
    <div class="fl">
      <img
        :src="`/guildIcon/${playerInfo.account}.jpg`"
        class="wm_top_info_avatar_pic"
      />
    </div>
    <div class="fl">
      <span class="wm_top_info_rank">R.{{ playerInfo.rank }}</span>
    </div>
    <div class="fl ml3">
      {{ playerInfo.guildName }}
    </div>
  </div>
</template>

<script>
import { ref, getCurrentInstance, computed } from "vue";
import store from "../store";

export default {
  name: "commonTop",
  components: {},
  setup() {
    const playerInfo = computed(() => {
      return store.getters.playerInfo;
    });
    console.log(playerInfo);
    return { playerInfo };
  }
};
</script>

<style scoped>
.wm_top_info_rank {
  color: #ffffff;
  background-color: #423d8b;
  border-radius: 5px;
  padding: 2px 5px;
  font-size: 13px;
}
.wm_top_info_avatar_pic {
  width: 30px;
  height: 30px;
  margin: 5px 10px 0 5px;
  border-radius: 3px;
  cursor: pointer;
  display: block;
  background-color: #ccc;
}
.wm_common_top_body {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 40px;
  z-index: 1000;
  background-color: hsla(0, 0%, 100%, 0.8);
  box-shadow: 0 1px 2px rgb(0 0 0 / 10%);
  line-height: 40px;
  font-size: 14px;
  font-size: 13px;
}
</style>

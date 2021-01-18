<!--  -->
<template>
  <div class="wm_guild_body">
    <h2 class="pt30 tc">成员列表</h2>
    <div class="mt10">
      <el-row :gutter="20">
        <el-col :xs="24" :sm="24" :md="8">
          <el-card>
            <div>测试</div>
          </el-card>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script>
// import { authApi } from "../api";
import { mapState } from "vuex";
export default {
  name: "Home",
  components: {},
  data() {
    return {};
  },
  computed: {
    ...mapState(["token"])
  },
  watch: {},
  methods: {},
  created() {},
  mounted() {
    if (!this.token) {
      this.$router.replace({
        name: "Login"
      });
    }
  },
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

<template>
  <div class="wm_guild_body wm_login_view" :class="'wm_login_time_' + bgTime">
    <div class="wm_guild_enter_block">
      <h1 class="tc mb20">维基萌公会联盟</h1>
      <div class="tc mt30">
        <el-button type="primary" @click="onLoginShow">登录游戏</el-button>
        <el-button @click="onRegShow">注册账号</el-button>
      </div>
    </div>
    <el-dialog
      title="登陆游戏"
      :visible.sync="loginDialog"
      class="wm_guild_dialog_body"
      width="90%"
      :lock-scroll="false"
      :close-on-click-modal="false"
    >
      <div>
        <el-form
          ref="form"
          :model="form"
          label-width="80px"
          @keyup.enter.native="onLogin()"
        >
          <el-form-item label="账号">
            <el-input
              v-model="form.account"
              placeholder="请输入账号"
            ></el-input>
          </el-form-item>
          <el-form-item label="密码">
            <el-input
              v-model="form.password"
              show-password
              placeholder="请输入密码"
            ></el-input>
          </el-form-item>
          <el-form-item label="验证码">
            <el-input
              placeholder="请输入计算结果"
              v-model="form.captcha"
              type="tel"
            >
              <template slot="append"
                ><img
                  class="reg_code_img"
                  :src="captchaSrc"
                  @click="captchaUpdata"
              /></template>
            </el-input>
          </el-form-item>
          <el-form-item label="保持登录">
            <el-switch v-model="form.remPass"></el-switch>
          </el-form-item>
        </el-form>
      </div>
      <div slot="footer">
        <el-button type="primary" @click="onLogin">登录</el-button>
      </div>
    </el-dialog>
    <el-dialog
      title="注册游戏"
      :visible.sync="regDialog"
      class="wm_guild_dialog_body"
      width="90%"
      :lock-scroll="false"
      :close-on-click-modal="false"
    >
      <div>
        <el-form
          ref="form"
          :model="regForm"
          label-width="90px"
          @keyup.enter.native="onReg()"
        >
          <el-form-item label="账号">
            <el-input
              v-model="regForm.account"
              placeholder="请输入账号"
            ></el-input>
          </el-form-item>
          <el-form-item label="密码">
            <el-input
              v-model="regForm.password"
              show-password
              placeholder="请输入密码"
            ></el-input>
          </el-form-item>
          <el-form-item label="确认密码">
            <el-input
              v-model="regForm.password2"
              show-password
              placeholder="再次输入密码"
            ></el-input>
          </el-form-item>
          <el-form-item label="管理员昵称">
            <el-input
              v-model="regForm.account"
              placeholder="请输入管理员昵称"
            ></el-input>
          </el-form-item>
          <el-form-item label="公会名称">
            <el-input
              v-model="form.account"
              placeholder="请输入公会名称"
            ></el-input>
          </el-form-item>
          <el-form-item label="管理员头像"> </el-form-item>
          <el-form-item label="公会图标"></el-form-item>
          <el-form-item label="验证码">
            <el-input
              placeholder="请输入计算结果"
              v-model="regForm.captcha"
              type="tel"
            >
              <template slot="append"
                ><img
                  class="reg_code_img"
                  :src="captchaSrc"
                  @click="captchaUpdata"
              /></template>
            </el-input>
          </el-form-item>
        </el-form>
      </div>
      <div slot="footer">
        <el-button type="primary" @click="onReg">注册</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import moment from "moment";

export default {
  name: "login",
  components: {},
  data() {
    return {
      captchaSrc: "",
      form: {},
      regForm: {},
      loginDialog: false,
      regDialog: false
    };
  },
  computed: {
    bgTime: () => {
      const HH = Number(moment().format("HH"));
      if (HH > 5 && HH <= 14) {
        return "1";
      } else if (HH > 14 && HH < 7) {
        return "2";
      } else {
        return "3";
      }
    }
  },
  watch: {},
  methods: {
    onLogin() {},
    onReg() {},
    captchaUpdata() {},
    onLoginShow() {
      this.loginDialog = true;
    },
    onRegShow() {
      this.regDialog = true;
    }
  },
  created() {},
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

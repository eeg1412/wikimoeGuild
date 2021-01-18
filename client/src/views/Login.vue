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
              class="reg_code_img_body"
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
            <el-switch v-model="form.save"></el-switch>
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
          label-width="80px"
          @keyup.enter.native="onReg()"
        >
          <el-form-item label="账号">
            <el-input
              v-model="regForm.account"
              placeholder="2-16位英数字下划线减号的账号"
            ></el-input>
          </el-form-item>
          <el-form-item label="密码">
            <el-input
              v-model="regForm.password"
              show-password
              placeholder="4-16位英数字下划线减号的密码"
            ></el-input>
          </el-form-item>
          <el-form-item label="确认密码">
            <el-input
              v-model="regForm.password2"
              show-password
              placeholder="再次输入密码"
            ></el-input>
          </el-form-item>
          <el-form-item label="会长昵称">
            <el-input
              v-model="regForm.nickName"
              placeholder="2-8位中文、日文、英文、数字、下划线"
            ></el-input>
          </el-form-item>
          <el-form-item label="公会名称">
            <el-input
              v-model="regForm.guildName"
              placeholder="2-8位中文、日文、英文、数字、下划线"
            ></el-input>
          </el-form-item>
          <el-form-item label="会长头像">
            <img :src="this.regForm.accountTx" v-if="this.regForm.accountTx" />
            <el-upload
              action=""
              :auto-upload="false"
              :show-file-list="false"
              accept="image/*"
              :on-change="
                (file, fileList) =>
                  handleAvatarSuccess('accountTx', file, fileList)
              "
            >
              <el-button size="small" type="primary">{{
                regForm.accountTx ? "重新导入" : "点击导入"
              }}</el-button>
            </el-upload>
          </el-form-item>
          <el-form-item label="公会图标">
            <img :src="this.regForm.guildIcon" v-if="this.regForm.guildIcon" />
            <el-upload
              action=""
              :auto-upload="false"
              :show-file-list="false"
              accept="image/*"
              :on-change="
                (file, fileList) =>
                  handleAvatarSuccess('guildIcon', file, fileList)
              "
            >
              <el-button size="small" type="primary">{{
                regForm.guildIcon ? "重新导入" : "点击导入"
              }}</el-button>
            </el-upload>
          </el-form-item>
          <el-form-item label="验证码">
            <el-input
              class="reg_code_img_body"
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
    <cropDialog
      :img="base64"
      :show.sync="cropDialogShow"
      @onCrop="onCrop"
    ></cropDialog>
  </div>
</template>

<script>
import moment from "moment";
import cropDialog from "../components/CropDialog.vue";
import { authApi } from "../api";
import { mapState } from "vuex";
const utils = require("../../utils/utils");

export default {
  name: "Login",
  components: {
    cropDialog
  },
  data() {
    return {
      cropDialogShow: false,
      captchaSrc: "/api/captcha?time=" + new Date().getTime(),
      form: {
        account: "",
        password: "",
        captcha: "",
        save: false
      },
      regForm: {
        account: "",
        password: "",
        password2: "",
        nickName: "",
        guildName: "",
        accountTx: "",
        guildIcon: "",
        captcha: ""
      },
      loginDialog: false,
      regDialog: false,
      cropType: "",
      base64: ""
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
    },
    ...mapState(["token"])
  },
  watch: {},
  methods: {
    onCrop(base64) {
      this.regForm[this.cropType] = base64;
    },
    handleAvatarSuccess(mode, file) {
      this.cropType = mode;
      this.base64 = URL.createObjectURL(file.raw);
      this.cropDialogShow = true;
    },
    onLogin() {
      const { account, password, captcha } = this.form;
      if (!account) {
        this.$message.error("请输入账号！");
        return false;
      }
      if (!password) {
        this.$message.error("请输入密码！");
        return false;
      }
      if (!captcha) {
        this.$message.error("请输入验证码！");
        return false;
      }
      authApi.login(this.form).then(res => {
        console.log(res);
        this.captchaUpdata();
        if (res.data.code === 0) {
          this.$message.error(res.data.msg);
        } else if (res.data.code === 1) {
          this.$store.commit("setToken", res.data.token);
          if (this.form.save) {
            localStorage.setItem("token", res.data.token);
          } else {
            sessionStorage.setItem("token", res.data.token);
          }
          this.regDialog = false;
          this.$router.replace({
            name: "Home"
          });
        }
      });
    },
    onReg() {
      if (this.regForm.password !== this.regForm.password2) {
        this.$message.error("两次密码不同!");
        return false;
      }
      const {
        account,
        password,
        nickName,
        guildName,
        accountTx,
        guildIcon,
        captcha
      } = this.regForm;
      //   校验格式
      if (!utils.accountCheck(account)) {
        this.$message.error("请输入2-16位英数字下划线减号的账号！");
        return false;
      }
      if (!utils.passwordCheck(password)) {
        this.$message.error("请输入4-16位英数字下划线减号的密码！");
        return false;
      }
      if (!utils.nickNameCheck(nickName)) {
        this.$message.error(
          "请输2-8位中文、日文、英文、数字包括下划线的昵称！"
        );
        return false;
      }
      if (!utils.nickNameCheck(guildName)) {
        this.$message.error(
          "请输入2-8位中文、日文、英文、数字包括下划线的公会名称！"
        );
        return false;
      }

      const jpgReg = new RegExp("data:image/jpeg;base64,");
      if (!jpgReg.test(accountTx)) {
        this.$message.error("请设置会长头像！");
        return false;
      }
      if (!jpgReg.test(guildIcon)) {
        this.$message.error("请设置公会图标！");
        return false;
      }
      if (!captcha) {
        this.$message.error("请输入验证码！");
        return false;
      }
      authApi.register(this.regForm).then(res => {
        console.log(res);
        this.captchaUpdata();
        if (res.data.code === 0) {
          this.$message.error(res.data.msg);
        } else if (res.data.code === 1) {
          this.$store.commit("setToken", res.data.token);
          this.regDialog = false;
        }
      });
    },
    captchaUpdata() {
      this.captchaSrc = "/api/captcha?time=" + new Date().getTime();
    },
    onLoginShow() {
      this.captchaUpdata();
      this.loginDialog = true;
    },
    onRegShow() {
      this.regForm = {
        account: "",
        password: "",
        password2: "",
        nickName: "",
        guildName: "",
        accountTx: "",
        guildIcon: "",
        captcha: ""
      };
      this.captchaUpdata();
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

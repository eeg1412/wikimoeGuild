<template>
  <div class="common_body">
    <!-- 注册页面标题 -->
    <h1 class="tc pt20 pb20 common_title">注册</h1>
    <!-- element ui plus 注册页面 -->
    <el-form ref="formRef" :model="form" :rules="rules" label-width="120px">
      <el-form-item label="用户名" prop="username">
        <el-input v-model="form.username"></el-input>
      </el-form-item>
      <el-form-item label="密码" prop="password">
        <el-input type="password" v-model="form.password"></el-input>
      </el-form-item>
      <el-form-item label="邮箱" prop="email">
        <el-input v-model="form.email"></el-input>
      </el-form-item>
      <!-- 邮箱验证码 -->
      <el-form-item label="邮箱验证码" prop="emailCode">
        <el-input v-model="form.emailCode">
          <template #append
            ><el-button type="primary">获取验证码</el-button></template
          >
        </el-input>
      </el-form-item>
      <!-- 图形验证码 -->
      <el-form-item label="图形验证码" prop="captcha">
        <el-input v-model="form.captcha">
          <template #append><img /></template>
        </el-input>
      </el-form-item>
      <!-- 公会名称 -->
      <el-form-item label="公会名称" prop="guildName">
        <el-input v-model="form.guildName"></el-input>
      </el-form-item>
      <!-- 公会图标 -->
      <el-form-item label="公会图标" prop="guildIcon">
        <Cropper
          :aspectRatio="1"
          :width="256"
          :height="256"
          @crop="(data) => getCover(data, 'guildIcon')"
          :src="form.guildIcon"
        />
      </el-form-item>
      <!-- 会长名字 -->
      <el-form-item label="会长名字" prop="guildMasterName">
        <el-input v-model="form.guildMasterName"></el-input>
      </el-form-item>
      <!-- 会长头像 -->
      <el-form-item label="会长头像" prop="guildMasterIcon">
        <Cropper
          :aspectRatio="1"
          :width="256"
          :height="256"
          @crop="(data) => getCover(data, 'guildMasterIcon')"
          :src="form.guildMasterIcon"
        />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="submitForm('form')">注册</el-button>
        <!-- 返回首页 -->
        <el-button @click="goHome">返回首页</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>
<script>
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Plus } from '@element-plus/icons-vue'
// Cropper
import Cropper from '@/components/Cropper.vue'

export default {
  components: {
    Plus,
    Cropper,
  },
  setup(props) {
    const route = useRoute()
    const router = useRouter()

    const form = ref({
      username: '',
      password: '',
      email: '',
      emailCode: '',
      captcha: '',
      guildName: '',
      guildIcon: '',
      guildMasterName: '',
      guildMasterIcon: '',
    })
    const rules = ref({
      username: [
        { required: true, message: 'Please input username', trigger: 'blur' },
      ],
      password: [
        { required: true, message: 'Please input password', trigger: 'blur' },
      ],
      email: [
        { required: true, message: 'Please input email', trigger: 'blur' },
      ],
      emailCode: [
        { required: true, message: 'Please input emailCode', trigger: 'blur' },
      ],
      captcha: [
        { required: true, message: 'Please input captcha', trigger: 'blur' },
      ],
      guildName: [
        { required: true, message: 'Please input guildName', trigger: 'blur' },
      ],
      guildIcon: [
        { required: true, message: 'Please input guildIcon', trigger: 'blur' },
      ],
      guildMasterName: [
        {
          required: true,
          message: 'Please input guildMasterName',
          trigger: 'blur',
        },
      ],
      guildMasterIcon: [
        {
          required: true,
          message: 'Please input guildMasterIcon',
          trigger: 'blur',
        },
      ],
    })
    const formRef = ref(null)
    const submitForm = () => {
      formRef.value.validate((valid) => {
        if (valid) {
          console.log(form.value)
        } else {
          console.log('error submit!!')
          return false
        }
      })
    }

    // getCover
    const getCover = (data, key) => {
      console.log(data)
      form.value[key] = data
    }

    const goHome = () => {
      router.push({
        name: 'GameIndex',
      })
    }
    return {
      formRef,
      form,
      rules,
      submitForm,
      goHome,
      getCover,
    }
  },
}
</script>
<style lang="scss"></style>

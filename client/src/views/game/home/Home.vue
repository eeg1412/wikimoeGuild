<template>
  <div class="common_body">
    <h1 class="tc pt20 pb20 common_title">Wikimoe Guild Master</h1>
    <div class="tc">
      <!-- login button -->
      <el-button type="primary" @click="login">登录</el-button>
      <!-- register button -->
      <el-button @click="register">注册</el-button>
    </div>
  </div>
</template>
<script>
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

export default {
  setup() {
    const route = useRoute()
    const router = useRouter()

    const login = () => {}
    const register = () => {
      router.push({
        name: 'GameRegister',
      })
    }

    return {
      login,
      register,
    }
  },
}
</script>
<style lang=""></style>

<template>
  <div class="w-full max-w-sm mx-auto py-8">
    <div class="bg-white dark:bg-[#1d1e1f] rounded-2xl shadow-lg p-8">
      <h2
        class="text-2xl font-bold text-center text-gray-800 dark:text-gray-100 mb-2"
      >
        欢迎登录
      </h2>
      <p class="text-center text-gray-400 text-sm mb-6">
        还没有账号？
        <router-link to="/game/register" class="text-blue-500 hover:underline"
          >立即注册</router-link
        >
      </p>

      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-position="top"
        @submit.prevent="handleSubmit"
      >
        <el-form-item label="邮箱" prop="email">
          <el-input
            v-model="form.email"
            type="email"
            placeholder="请输入邮箱地址"
            clearable
            :disabled="loading"
          />
        </el-form-item>

        <el-form-item label="密码" prop="password">
          <el-input
            v-model="form.password"
            type="password"
            placeholder="请输入密码"
            show-password
            :disabled="loading"
            @keyup.enter="handleSubmit"
          />
        </el-form-item>

        <el-form-item class="mb-2">
          <el-checkbox v-model="form.rememberMe" :disabled="loading"
            >保持登录状态</el-checkbox
          >
        </el-form-item>

        <el-button
          type="primary"
          class="w-full mt-2"
          :loading="loading"
          :disabled="loading"
          @click="handleSubmit"
        >
          登录
        </el-button>
      </el-form>

      <div class="mt-4 text-center">
        <router-link
          to="/game/forgot-password"
          class="text-sm text-gray-400 hover:text-blue-500"
        >
          忘记密码？
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { loginApi } from '@/api/game/auth.js'
import { useGameUser } from '@/composables/useGameUser.js'

const router = useRouter()
const { setLogin, isLoggedIn } = useGameUser()

// 已登录则跳转
if (isLoggedIn.value) {
  router.replace('/game/home')
}

const formRef = ref(null)
const loading = ref(false)

const form = reactive({ email: '', password: '', rememberMe: false })

const rules = {
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '邮箱格式不正确', trigger: 'blur' }
  ],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
}

async function handleSubmit() {
  await formRef.value?.validate()
  loading.value = true
  try {
    const res = await loginApi({
      email: form.email,
      password: form.password,
      rememberMe: form.rememberMe
    })
    const { accessToken, refreshToken, playerInfo } = res.data.data
    setLogin(accessToken, refreshToken, playerInfo)
    ElMessage.success('登录成功')
    router.replace('/game/home')
  } catch {
    // 错误已由 request.js 拦截器处理
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div
    class="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-[#141414] px-4 relative transition-colors"
  >
    <!-- 暗模式切换 -->
    <div class="absolute top-4 right-4">
      <el-button text circle @click="toggleTheme" size="large">
        <el-icon :size="20">
          <Moon v-if="!isDark" />
          <Sunny v-else />
        </el-icon>
      </el-button>
    </div>

    <el-card class="w-full max-w-100" shadow="hover">
      <template #header>
        <div class="text-center">
          <h1 class="text-2xl font-bold text-gray-800 dark:text-gray-100">
            WikimoeGuild
          </h1>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">用户登录</p>
        </div>
      </template>

      <el-alert
        v-if="loginError"
        :title="loginError"
        type="error"
        show-icon
        closable
        class="mb-4"
        @close="loginError = ''"
      />

      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-position="top"
        @keyup.enter="handleLogin"
      >
        <el-form-item label="用户名" prop="username">
          <el-input
            v-model="form.username"
            placeholder="请输入用户名"
            size="large"
          >
            <template #prefix>
              <el-icon><User /></el-icon>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input
            v-model="form.password"
            type="password"
            placeholder="请输入密码"
            size="large"
            show-password
          >
            <template #prefix>
              <el-icon><Lock /></el-icon>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item>
          <el-button
            type="primary"
            class="w-full"
            size="large"
            :loading="loading"
            @click="handleLogin"
          >
            登录
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useUserStore } from '../stores/user.js'
import { useTheme } from '../composables/useTheme.js'

const router = useRouter()
const userStore = useUserStore()
const { isDark, toggleTheme } = useTheme()
const formRef = ref()
const loading = ref(false)
const loginError = ref('')

const form = reactive({
  username: '',
  password: ''
})

const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
}

async function handleLogin() {
  loginError.value = ''
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  loading.value = true
  try {
    await userStore.login(form)
    ElMessage.success('登录成功')
    router.push('/')
  } catch (e) {
    loginError.value = e.response?.data?.message || '登录失败，请检查网络连接'
  } finally {
    loading.value = false
  }
}
</script>

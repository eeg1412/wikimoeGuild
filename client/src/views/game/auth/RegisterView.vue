<template>
  <div class="w-full max-w-sm mx-auto py-8">
    <div class="bg-white dark:bg-[#1d1e1f] rounded-2xl shadow-lg p-8">
      <h2
        class="text-2xl font-bold text-center text-gray-800 dark:text-gray-100 mb-2"
      >
        创建账号
      </h2>
      <p class="text-center text-gray-400 text-sm mb-6">
        已有账号？
        <router-link to="/game/login" class="text-blue-500 hover:underline"
          >立即登录</router-link
        >
      </p>

      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-position="top"
        @submit.prevent="handleSubmit"
      >
        <!-- 邮箱 -->
        <el-form-item label="邮箱" prop="email">
          <el-input
            v-model="form.email"
            type="email"
            placeholder="请输入邮箱地址"
            clearable
            :disabled="loading"
          />
        </el-form-item>

        <!-- 公会名 -->
        <el-form-item label="公会名" prop="guildName">
          <el-input
            v-model="form.guildName"
            placeholder="2-8 个字符"
            clearable
            :maxlength="8"
            show-word-limit
            :disabled="loading"
          />
        </el-form-item>

        <!-- 密码 -->
        <el-form-item label="密码" prop="password">
          <el-input
            v-model="form.password"
            type="password"
            placeholder="包含大小写字母和数字，最长 64 字符"
            show-password
            :disabled="loading"
          />
          <!-- 密码强度 -->
          <div class="w-full mt-2">
            <div class="flex gap-1 mb-1">
              <div
                v-for="i in 4"
                :key="i"
                class="h-1.5 flex-1 rounded-full transition-colors"
                :class="passwordStrengthColor(i)"
              />
            </div>
            <p class="text-xs" :class="strengthTextColor">{{ strengthText }}</p>
          </div>
        </el-form-item>

        <!-- 确认密码 -->
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input
            v-model="form.confirmPassword"
            type="password"
            placeholder="再次输入密码"
            show-password
            :disabled="loading"
          />
        </el-form-item>

        <!-- 邮箱验证码 -->
        <el-form-item label="邮箱验证码" prop="code">
          <div class="flex gap-2 w-full">
            <el-input
              v-model="form.code"
              placeholder="6 位验证码"
              clearable
              :maxlength="6"
              :disabled="loading"
              class="flex-1"
            />
            <el-button
              :disabled="sendCodeDisabled || loading"
              :loading="sendingCode"
              @click="handleSendCode"
            >
              {{ countdownText }}
            </el-button>
          </div>
        </el-form-item>

        <el-button
          type="primary"
          class="w-full mt-2"
          :loading="loading"
          @click="handleSubmit"
        >
          注册
        </el-button>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { sendCodeApi, registerApi } from '@/api/game/auth.js'
import { useGameUser } from '@/composables/useGameUser.js'

const router = useRouter()
const { isLoggedIn, setLogin } = useGameUser()

if (isLoggedIn.value) {
  router.replace('/game/home')
}

const formRef = ref(null)
const loading = ref(false)
const sendingCode = ref(false)
const countdown = ref(0)

const form = reactive({
  email: '',
  guildName: '',
  password: '',
  confirmPassword: '',
  code: ''
})

// 密码强度
const passwordStrength = computed(() => {
  const p = form.password
  if (!p) return 0
  let score = 0
  if (p.length >= 8) score++
  if (/[a-z]/.test(p)) score++
  if (/[A-Z]/.test(p)) score++
  if (/[0-9]/.test(p)) score++
  return score
})

function passwordStrengthColor(i) {
  const s = passwordStrength.value
  if (s === 0) return 'bg-gray-200 dark:bg-gray-700'
  if (s === 1) return i <= 1 ? 'bg-red-400' : 'bg-gray-200 dark:bg-gray-700'
  if (s === 2) return i <= 2 ? 'bg-yellow-400' : 'bg-gray-200 dark:bg-gray-700'
  if (s === 3) return i <= 3 ? 'bg-blue-400' : 'bg-gray-200 dark:bg-gray-700'
  return 'bg-green-500'
}

const strengthText = computed(() => {
  const labels = ['', '弱', '一般', '较强', '强']
  return labels[passwordStrength.value] || ''
})

const strengthTextColor = computed(() => {
  const colors = [
    '',
    'text-red-400',
    'text-yellow-500',
    'text-blue-500',
    'text-green-500'
  ]
  return colors[passwordStrength.value] || ''
})

// 验证码倒计时
const sendCodeDisabled = computed(() => countdown.value > 0 || !form.email)
const countdownText = computed(() =>
  countdown.value > 0 ? `${countdown.value}s 后重发` : '发送验证码'
)

function startCountdown() {
  countdown.value = 60
  const timer = setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) clearInterval(timer)
  }, 1000)
}

async function handleSendCode() {
  if (!form.email) {
    ElMessage.warning('请先填写邮箱')
    return
  }
  sendingCode.value = true
  try {
    await sendCodeApi({ email: form.email, type: 'register' })
    ElMessage.success('验证码已发送，请查收邮件')
    startCountdown()
  } catch {
    // 错误已由拦截器处理
  } finally {
    sendingCode.value = false
  }
}

const validatePassword = (rule, value, callback) => {
  if (!value) return callback(new Error('请输入密码'))
  if (value.length > 64) return callback(new Error('密码最长 64 字符'))
  if (!/[a-z]/.test(value)) return callback(new Error('密码必须包含小写字母'))
  if (!/[A-Z]/.test(value)) return callback(new Error('密码必须包含大写字母'))
  if (!/[0-9]/.test(value)) return callback(new Error('密码必须包含数字'))
  callback()
}

const validateConfirmPassword = (rule, value, callback) => {
  if (!value) return callback(new Error('请再次输入密码'))
  if (value !== form.password) return callback(new Error('两次密码不一致'))
  callback()
}

const rules = {
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '邮箱格式不正确', trigger: 'blur' }
  ],
  guildName: [
    { required: true, message: '请输入公会名', trigger: 'blur' },
    { min: 2, max: 8, message: '公会名为 2-8 个字符', trigger: 'blur' }
  ],
  password: [{ required: true, validator: validatePassword, trigger: 'blur' }],
  confirmPassword: [
    { required: true, validator: validateConfirmPassword, trigger: 'blur' }
  ],
  code: [
    { required: true, message: '请输入验证码', trigger: 'blur' },
    { len: 6, message: '验证码为 6 位', trigger: 'blur' }
  ]
}

async function handleSubmit() {
  await formRef.value?.validate()
  loading.value = true
  try {
    const res = await registerApi({
      email: form.email,
      guildName: form.guildName,
      password: form.password,
      code: form.code
    })
    const { accessToken, refreshToken, playerInfo } = res.data.data
    setLogin(accessToken, refreshToken, playerInfo)
    ElMessage.success('注册成功，欢迎加入公会！')
    router.push('/game/home')
  } catch {
    // 错误已由拦截器处理
  } finally {
    loading.value = false
  }
}
</script>

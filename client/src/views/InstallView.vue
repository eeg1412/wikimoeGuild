<template>
  <div
    class="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-[#141414] px-4 py-10 relative transition-colors"
  >
    <!-- 暗模式切换 -->
    <div class="absolute top-4 right-4">
      <el-button text circle @click="toggleTheme">
        <el-icon :size="20">
          <Moon v-if="!isDark" />
          <Sunny v-else />
        </el-icon>
      </el-button>
    </div>

    <!-- 检查初始化中 -->
    <div
      v-if="checking"
      class="flex flex-col items-center gap-3 text-gray-500 dark:text-gray-400"
    >
      <el-icon class="animate-spin" :size="32"><Loading /></el-icon>
      <span>正在检查初始化状态…</span>
    </div>

    <!-- 安装表单 -->
    <el-card v-else class="w-full max-w-lg" shadow="hover">
      <template #header>
        <div class="text-center">
          <h1 class="text-2xl font-bold text-gray-800 dark:text-gray-100">
            WikimoeGuild
          </h1>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
            站点初始化向导
          </p>
        </div>
      </template>

      <!-- 全局错误 -->
      <el-alert
        v-if="installError"
        :title="installError"
        type="error"
        show-icon
        closable
        class="mb-5"
        @close="installError = ''"
      />

      <!-- 安装成功提示 -->
      <el-result
        v-if="installDone"
        icon="success"
        title="初始化成功"
        sub-title="站点已完成初始化,点击下方按钮前往登录页"
      >
        <template #extra>
          <el-button type="primary" @click="goHome">立即前往登录页</el-button>
        </template>
      </el-result>

      <el-form
        v-else
        ref="formRef"
        :model="form"
        :rules="rules"
        label-position="top"
        @keyup.enter="handleInstall"
      >
        <!-- ── 管理员账号 ── -->
        <div class="mb-4">
          <div
            class="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 border-b border-gray-200 dark:border-gray-700 pb-1"
          >
            管理员账号
          </div>
          <el-form-item label="用户名" prop="username">
            <el-input
              v-model="form.username"
              placeholder="请输入管理员用户名"
              @blur="form.username = form.username.toLowerCase()"
            >
              <template #prefix
                ><el-icon><User /></el-icon
              ></template>
            </el-input>
            <template #extra>
              <span class="text-xs text-gray-400 dark:text-gray-500"
                >仅支持小写字母 (a-z) 和数字 (0-9)，3-30 个字符</span
              >
            </template>
          </el-form-item>
          <el-form-item label="密码" prop="password">
            <el-input
              v-model="form.password"
              type="password"
              placeholder="请输入管理员密码（至少 6 位）"
              show-password
            >
              <template #prefix
                ><el-icon><Lock /></el-icon
              ></template>
            </el-input>
            <template #extra>
              <span class="text-xs text-gray-400 dark:text-gray-500"
                >必须包含大小写字母、数字和符号</span
              >
            </template>
          </el-form-item>
        </div>

        <!-- ── 站点设置 ── -->
        <div class="mb-4">
          <div
            class="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 border-b border-gray-200 dark:border-gray-700 pb-1"
          >
            站点设置
          </div>
          <el-form-item label="网站标题" prop="siteTitle">
            <el-input v-model="form.siteTitle" placeholder="请输入网站标题" />
          </el-form-item>
          <el-form-item label="网站副标题" prop="siteSubTitle">
            <el-input
              v-model="form.siteSubTitle"
              placeholder="请输入网站副标题（可选）"
            />
          </el-form-item>
          <el-form-item label="站点关键词" prop="siteKeywords">
            <el-input
              v-model="form.siteKeywords"
              placeholder="维基萌,公会,游戏"
            />
          </el-form-item>
          <el-form-item label="站点地址" prop="siteUrl">
            <el-input
              v-model="form.siteUrl"
              placeholder="https://example.com"
              @blur="trimSiteUrl"
            >
              <template #prefix
                ><el-icon><Link /></el-icon
              ></template>
            </el-input>
            <template #extra>
              <span class="text-xs text-gray-400 dark:text-gray-500"
                >末尾无需填写 /，系统会自动处理</span
              >
            </template>
          </el-form-item>
        </div>

        <el-form-item>
          <el-button
            type="primary"
            class="w-full"
            :loading="loading"
            :disabled="loading"
            @click="handleInstall"
          >
            开始初始化
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useTheme } from '../composables/useTheme.js'
import { checkInitedApi, installApi } from '../api/admin/install.js'

const router = useRouter()
const { isDark, toggleTheme } = useTheme()

const checking = ref(true)
const loading = ref(false)
const installError = ref('')
const installDone = ref(false)
const formRef = ref()

const form = reactive({
  username: '',
  password: '',
  siteTitle: '',
  siteSubTitle: '',
  siteKeywords: '',
  siteUrl: ''
})

const rules = {
  username: [
    { required: true, message: '请输入管理员用户名', trigger: 'blur' },
    { min: 3, max: 30, message: '用户名长度 3-30 个字符', trigger: 'blur' },
    {
      pattern: /^[a-z0-9]+$/,
      message: '用户名只能包含小写字母 (a-z) 和数字 (0-9)',
      trigger: 'blur'
    }
  ],
  password: [
    { required: true, message: '请输入管理员密码', trigger: 'blur' },
    { min: 6, message: '密码至少 6 个字符', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (!value) return callback()
        const hasLower = /[a-z]/.test(value)
        const hasUpper = /[A-Z]/.test(value)
        const hasDigit = /[0-9]/.test(value)
        const hasSymbol = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(value)
        if (hasLower && hasUpper && hasDigit && hasSymbol) {
          callback()
        } else {
          callback(new Error('密码必须包含大小写字母、数字和符号'))
        }
      },
      trigger: 'blur'
    }
  ],
  siteTitle: [
    { required: true, message: '请填写网站标题', trigger: 'blur' },
    { max: 200, message: '网站标题最多 200 个字符', trigger: 'blur' }
  ],
  siteKeywords: [
    { max: 500, message: '站点关键词最多 500 个字符', trigger: 'blur' }
  ],
  siteUrl: [
    { required: true, message: '请填写站点地址', trigger: 'blur' },
    { max: 500, message: '站点地址最多 500 个字符', trigger: 'blur' }
  ]
}

/** 去除站点地址末尾的斜杠 */
function trimSiteUrl() {
  form.siteUrl = form.siteUrl.replace(/\/+$/, '')
}

function goHome() {
  router.replace({ name: 'AdminLogin' })
}

/** 提交安装 */
async function handleInstall() {
  installError.value = ''
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  // 提交前再次处理 siteUrl
  trimSiteUrl()

  loading.value = true
  try {
    await installApi({ ...form })
    installDone.value = true
  } catch (e) {
    const msg = e.response?.data?.message || '初始化失败，请检查网络连接'
    installError.value = msg
  } finally {
    loading.value = false
  }
}

/** 页面加载时检查初始化状态 */
onMounted(async () => {
  try {
    const res = await checkInitedApi()
    if (res.data?.data?.inited) {
      return router.replace({ name: 'GameHome' })
    }
  } catch {
    // 接口异常时允许继续显示安装页
  } finally {
    checking.value = false
  }

  // 自动填入当前域名作为站点地址
  const { protocol, host } = window.location
  form.siteUrl = `${protocol}//${host}`.replace(/\/+$/, '')
})
</script>

<style scoped></style>

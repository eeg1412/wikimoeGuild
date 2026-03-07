<template>
  <div class="w-full py-6" style="min-height: 60vh">
    <!-- 页面标题 -->
    <div class="mb-6 text-center">
      <h1 class="rpg-title text-2xl font-bold text-gray-800 dark:text-gray-100">
        🏰 公会设置
      </h1>
      <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
        自定义你的公会信息
      </p>
    </div>

    <!-- 加载 -->
    <div v-if="loading" class="flex justify-center py-12">
      <span class="animate-spin inline-block text-4xl">⏳</span>
    </div>

    <template v-else>
      <!-- 公会信息卡片 -->
      <div class="rpg-card rounded-xl p-4 mb-4">
        <div class="flex items-center gap-4">
          <div class="relative cursor-pointer" @click="handleOpenLogoDialog">
            <GameGuildIcon
              :player-info="playerInfo"
              class="w-20 h-20 rounded-lg object-cover border-2 border-gray-200 dark:border-gray-700"
            />
            <div
              class="absolute bottom-0 right-0 bg-black/60 rounded-full px-1.5 py-0.5 text-[10px] text-white"
            >
              ✏️
            </div>
          </div>
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-2 mb-1">
              <h2
                class="text-lg font-bold text-gray-800 dark:text-gray-100 truncate"
              >
                {{ playerInfo?.guildName || '加载中...' }}
              </h2>
              <el-button text size="small" @click="handleOpenNameDialog">
                ✏️
              </el-button>
            </div>
            <p class="text-sm text-purple-500 font-semibold">
              🏰 公会等级 Lv.{{ playerInfo?.guildLevel ?? 1 }}
            </p>
            <p class="text-sm text-gray-400">
              🪙 {{ (playerInfo?.gold ?? 0).toLocaleString() }} 金币
            </p>
            <p
              v-if="playerInfo?.createdAt"
              class="text-xs text-gray-400 mt-0.5"
            >
              📅 创建于 {{ formatDate(playerInfo.createdAt) }}
            </p>
            <p v-if="playerInfo?.email" class="text-xs text-gray-400 mt-0.5">
              📧 {{ playerInfo.email }}
            </p>
          </div>
        </div>
      </div>

      <!-- 公会升级卡片 -->
      <div class="rpg-card rounded-xl p-4 mb-4">
        <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">
          📈 公会升级
        </h3>
        <div v-if="levelInfoLoading" class="flex justify-center py-4">
          <span class="animate-spin inline-block text-xl">⏳</span>
        </div>
        <template v-else-if="levelInfo">
          <div class="grid grid-cols-2 gap-2 text-sm mb-3">
            <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-2 text-center">
              <p class="text-xs text-gray-400">当前等级</p>
              <p class="text-sm font-bold text-purple-500">
                Lv.{{ levelInfo.guildLevel }}
              </p>
            </div>
            <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-2 text-center">
              <p class="text-xs text-gray-400">升级费用</p>
              <p class="text-sm font-bold text-yellow-500">
                🪙 {{ levelInfo.fee?.toLocaleString() }}
              </p>
            </div>
            <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-2 text-center">
              <p class="text-xs text-gray-400">所需满级冒险家</p>
              <p
                class="text-sm font-bold"
                :class="
                  levelInfo.qualifiedCount >= levelInfo.requiredCount
                    ? 'text-green-500'
                    : 'text-red-500'
                "
              >
                {{ levelInfo.qualifiedCount }} / {{ levelInfo.requiredCount }}
              </p>
            </div>
            <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-2 text-center">
              <p class="text-xs text-gray-400">所需综合等级</p>
              <p class="text-sm font-bold text-blue-500">
                Lv.{{ levelInfo.requiredCompLevel }}
              </p>
            </div>
          </div>
          <div class="text-sm text-gray-500 dark:text-gray-400 space-y-1 mb-3">
            <p>升级后冒险家上限: {{ levelInfo.nextMaxAdventurerCount }}</p>
            <p>
              升级后综合等级上限: Lv.{{ levelInfo.nextMaxComprehensiveLevel }}
            </p>
          </div>
          <div class="flex justify-center">
            <el-button
              type="primary"
              :loading="upgradeLoading"
              :disabled="
                upgradeLoading ||
                levelInfo.gold < levelInfo.fee ||
                levelInfo.qualifiedCount < levelInfo.requiredCount
              "
              @click="handleUpgradeGuild"
            >
              ⬆️ 升级公会 (🪙 {{ levelInfo.fee?.toLocaleString() }})
            </el-button>
          </div>
        </template>
      </div>

      <!-- 操作说明 -->
      <div class="rpg-card rounded-xl p-4 space-y-3">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-semibold text-gray-700 dark:text-gray-200">
              🎨 修改公会标志
            </p>
            <p class="text-sm text-gray-400 mt-0.5">
              消耗 {{ gameSettings.guildCustomLogoPrice ?? 5000 }} 金币
            </p>
          </div>
          <el-button type="primary" size="small" @click="handleOpenLogoDialog">
            修改
          </el-button>
        </div>
        <el-divider class="my-2!" />
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-semibold text-gray-700 dark:text-gray-200">
              📝 修改公会名字
            </p>
            <p class="text-sm text-gray-400 mt-0.5">
              消耗 {{ gameSettings.guildChangeNamePrice ?? 1000 }} 金币
            </p>
          </div>
          <el-button type="primary" size="small" @click="handleOpenNameDialog">
            修改
          </el-button>
        </div>
        <el-divider class="my-2!" />
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-semibold text-gray-700 dark:text-gray-200">
              🔑 修改密码
            </p>
            <p class="text-sm text-gray-400 mt-0.5">修改登录密码</p>
          </div>
          <el-button
            type="primary"
            size="small"
            @click="handleOpenPasswordDialog"
          >
            修改
          </el-button>
        </div>

        <!-- 游客绑定邮箱 -->
        <template v-if="playerInfo?.isGuest">
          <el-divider class="my-2!" />
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-semibold text-gray-700 dark:text-gray-200">
                📧 绑定邮箱
              </p>
              <p class="text-sm text-gray-400 mt-0.5">绑定正式邮箱以保护账号</p>
            </div>
            <el-button
              type="warning"
              size="small"
              @click="handleOpenBindEmailDialog"
            >
              绑定
            </el-button>
          </div>
        </template>
      </div>
    </template>

    <!-- ===== 修改标志弹窗 ===== -->
    <el-dialog
      v-model="logoDialogVisible"
      title="修改公会标志"
      width="360px"
      align-center
      destroy-on-close
      :close-on-click-modal="!logoSaving"
      :close-on-press-escape="!logoSaving"
      :show-close="!logoSaving"
      append-to-body
    >
      <p class="text-sm text-gray-500 mb-3">
        消耗 {{ gameSettings.guildCustomLogoPrice ?? 5000 }} 金币
      </p>
      <Cropper
        :src="logoPreview"
        :width="200"
        :height="200"
        :aspect-ratio="1"
        put-image-type="image/png"
        :put-image-quality="0.9"
        @crop="onLogoCrop"
      />
      <template #footer>
        <el-button @click="logoDialogVisible = false">取消</el-button>
        <el-button
          type="primary"
          :loading="logoSaving"
          :disabled="logoSaving || !logoBase64"
          @click="handleSaveLogo"
        >
          确定
        </el-button>
      </template>
    </el-dialog>

    <!-- ===== 修改名字弹窗 ===== -->
    <el-dialog
      v-model="nameDialogVisible"
      title="修改公会名字"
      width="320px"
      align-center
      destroy-on-close
      :close-on-click-modal="!nameSaving"
      :close-on-press-escape="!nameSaving"
      :show-close="!nameSaving"
      append-to-body
    >
      <p class="text-sm text-gray-500 mb-3">
        消耗 {{ gameSettings.guildChangeNamePrice ?? 1000 }} 金币
      </p>
      <el-input
        v-model="newGuildName"
        placeholder="输入新公会名（2-20字符）"
        maxlength="20"
        show-word-limit
      />
      <template #footer>
        <el-button @click="nameDialogVisible = false">取消</el-button>
        <el-button
          type="primary"
          :loading="nameSaving"
          :disabled="
            nameSaving || !newGuildName || newGuildName.trim().length < 2
          "
          @click="handleSaveName"
        >
          确定
        </el-button>
      </template>
    </el-dialog>

    <!-- ===== 修改密码弹窗 ===== -->
    <el-dialog
      v-model="passwordDialogVisible"
      title="修改密码"
      width="360px"
      align-center
      destroy-on-close
      :close-on-click-modal="!passwordSaving"
      :close-on-press-escape="!passwordSaving"
      :show-close="!passwordSaving"
      append-to-body
    >
      <el-form
        ref="passwordFormRef"
        :model="passwordForm"
        :rules="passwordRules"
        label-position="top"
      >
        <el-form-item label="当前密码" prop="currentPassword">
          <el-input
            v-model="passwordForm.currentPassword"
            type="password"
            placeholder="请输入当前密码"
            show-password
            :disabled="passwordSaving"
          />
        </el-form-item>
        <el-form-item label="新密码" prop="newPassword">
          <el-input
            v-model="passwordForm.newPassword"
            type="password"
            placeholder="包含大小写字母和数字，至少6位"
            show-password
            :disabled="passwordSaving"
          />
        </el-form-item>
        <el-form-item label="确认新密码" prop="confirmPassword">
          <el-input
            v-model="passwordForm.confirmPassword"
            type="password"
            placeholder="再次输入新密码"
            show-password
            :disabled="passwordSaving"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="passwordDialogVisible = false">取消</el-button>
        <el-button
          type="primary"
          :loading="passwordSaving"
          :disabled="passwordSaving"
          @click="handleSavePassword"
        >
          确定
        </el-button>
      </template>
    </el-dialog>

    <!-- ===== 绑定邮箱弹窗 ===== -->
    <el-dialog
      v-model="bindEmailDialogVisible"
      title="绑定邮箱"
      width="360px"
      align-center
      destroy-on-close
      :close-on-click-modal="!bindEmailSaving"
      :close-on-press-escape="!bindEmailSaving"
      :show-close="!bindEmailSaving"
      append-to-body
    >
      <p class="text-sm text-gray-500 mb-3">
        绑定正式邮箱后，游客标记将被移除，您将使用新邮箱登录。
      </p>
      <el-form
        ref="bindEmailFormRef"
        :model="bindEmailForm"
        :rules="bindEmailRules"
        label-position="top"
      >
        <el-form-item label="邮箱" prop="email">
          <el-input
            v-model="bindEmailForm.email"
            type="email"
            placeholder="请输入要绑定的邮箱"
            clearable
            :disabled="bindEmailSaving"
          />
        </el-form-item>
        <el-form-item label="验证码" prop="code">
          <div class="flex gap-2 w-full">
            <el-input
              v-model="bindEmailForm.code"
              placeholder="6 位验证码"
              clearable
              :maxlength="6"
              :disabled="bindEmailSaving"
              class="flex-1"
            />
            <el-button
              :disabled="bindEmailSendCodeDisabled || bindEmailSaving"
              :loading="bindEmailSendingCode"
              @click="handleBindEmailSendCode"
            >
              {{ bindEmailCountdownText }}
            </el-button>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="bindEmailDialogVisible = false">取消</el-button>
        <el-button
          type="primary"
          :loading="bindEmailSaving"
          :disabled="bindEmailSaving"
          @click="handleBindEmail"
        >
          绑定
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  changeGuildLogoApi,
  changeGuildNameApi,
  getGuildLevelInfoApi,
  upgradeGuildLevelApi
} from '@/api/game/guild.js'
import {
  changePasswordApi,
  guestBindEmailSendCodeApi,
  guestBindEmailApi
} from '@/api/game/auth.js'
import { getGameSettingsApi } from '@/api/game/config.js'
import { useGameUser } from '@/composables/useGameUser.js'
import Cropper from '@/components/Cropper.vue'
import { useDialogRoute } from '@/composables/useDialogRoute.js'

const router = useRouter()
const { isLoggedIn, playerInfo, fetchPlayerInfo, logout } = useGameUser()

if (!isLoggedIn.value) {
  router.replace({ name: 'GameLogin' })
}

const loading = ref(false)
const gameSettings = ref({})

// ── 公会升级 ──
const levelInfo = ref(null)
const levelInfoLoading = ref(false)
const upgradeLoading = ref(false)

async function fetchGuildLevelInfo() {
  levelInfoLoading.value = true
  try {
    const res = await getGuildLevelInfoApi()
    levelInfo.value = res.data.data
  } catch {
    levelInfo.value = null
  } finally {
    levelInfoLoading.value = false
  }
}

async function handleUpgradeGuild() {
  try {
    await ElMessageBox.confirm(
      `确定花费 ${levelInfo.value.fee?.toLocaleString()} 金币升级公会？`,
      '确认升级',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
  } catch {
    return
  }
  upgradeLoading.value = true
  try {
    await upgradeGuildLevelApi()
    ElMessage.success('公会升级成功！')
    await Promise.all([fetchPlayerInfo(), fetchGuildLevelInfo()])
  } catch {
    // 错误已由拦截器处理
  } finally {
    upgradeLoading.value = false
  }
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// ── 标志修改 ──
const { visible: logoDialogVisible } = useDialogRoute('logoDialog')
const logoPreview = ref('')
const logoBase64 = ref('')
const logoSaving = ref(false)

function handleOpenLogoDialog() {
  logoPreview.value = ''
  logoBase64.value = ''
  logoDialogVisible.value = true
}

function onLogoCrop(base64) {
  logoBase64.value = base64
  logoPreview.value = base64
}

async function handleSaveLogo() {
  if (!logoBase64.value) return
  logoSaving.value = true
  try {
    await changeGuildLogoApi({ logo: logoBase64.value })
    ElMessage.success('公会标志修改成功！')
    logoDialogVisible.value = false
    logoBase64.value = ''
    logoPreview.value = ''
    await fetchPlayerInfo()
  } catch {
    // 错误已由拦截器处理
  } finally {
    logoSaving.value = false
  }
}

// ── 名字修改 ──
const { visible: nameDialogVisible } = useDialogRoute('nameDialog')
const newGuildName = ref('')
const nameSaving = ref(false)

function handleOpenNameDialog() {
  newGuildName.value = ''
  nameDialogVisible.value = true
}

async function handleSaveName() {
  const name = newGuildName.value.trim()
  if (!name || name.length < 2) return
  nameSaving.value = true
  try {
    await changeGuildNameApi({ name })
    ElMessage.success('公会名修改成功！')
    nameDialogVisible.value = false
    newGuildName.value = ''
    await fetchPlayerInfo()
  } catch {
    // 错误已由拦截器处理
  } finally {
    nameSaving.value = false
  }
}

// ── 修改密码 ──
const { visible: passwordDialogVisible } = useDialogRoute('passwordDialog')
const passwordFormRef = ref(null)
const passwordSaving = ref(false)
const passwordForm = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const passwordRules = {
  currentPassword: [
    { required: true, message: '请输入当前密码', trigger: 'blur' }
  ],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, max: 64, message: '密码长度 6-64 位', trigger: 'blur' },
    {
      validator: (_rule, value, callback) => {
        if (
          !/[a-z]/.test(value) ||
          !/[A-Z]/.test(value) ||
          !/[0-9]/.test(value)
        ) {
          callback(new Error('密码必须包含大小写字母和数字'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ],
  confirmPassword: [
    { required: true, message: '请确认新密码', trigger: 'blur' },
    {
      validator: (_rule, value, callback) => {
        if (value !== passwordForm.newPassword) {
          callback(new Error('两次输入的密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
}

function handleOpenPasswordDialog() {
  passwordForm.currentPassword = ''
  passwordForm.newPassword = ''
  passwordForm.confirmPassword = ''
  passwordDialogVisible.value = true
}

async function handleSavePassword() {
  await passwordFormRef.value?.validate()
  passwordSaving.value = true
  try {
    await changePasswordApi({
      currentPassword: passwordForm.currentPassword,
      newPassword: passwordForm.newPassword
    })
    ElMessage.success('密码修改成功，请重新登录')
    passwordDialogVisible.value = false
    logout()
    router.replace({ name: 'GameLogin' })
  } catch {
    // 错误已由拦截器处理
  } finally {
    passwordSaving.value = false
  }
}

// ── 绑定邮箱（游客） ──
const { visible: bindEmailDialogVisible } = useDialogRoute('bindEmailDialog')
const bindEmailFormRef = ref(null)
const bindEmailSaving = ref(false)
const bindEmailSendingCode = ref(false)
const bindEmailCountdown = ref(0)

const bindEmailForm = reactive({
  email: '',
  code: ''
})

const bindEmailSendCodeDisabled = computed(
  () => bindEmailCountdown.value > 0 || !bindEmailForm.email
)
const bindEmailCountdownText = computed(() =>
  bindEmailCountdown.value > 0
    ? `${bindEmailCountdown.value}s 后重发`
    : '发送验证码'
)

const bindEmailRules = {
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '邮箱格式不正确', trigger: 'blur' }
  ],
  code: [
    { required: true, message: '请输入验证码', trigger: 'blur' },
    { len: 6, message: '验证码为 6 位', trigger: 'blur' }
  ]
}

function handleOpenBindEmailDialog() {
  bindEmailForm.email = ''
  bindEmailForm.code = ''
  bindEmailDialogVisible.value = true
}

let bindEmailCountdownTimer = null
function startBindEmailCountdown() {
  bindEmailCountdown.value = 60
  if (bindEmailCountdownTimer) clearInterval(bindEmailCountdownTimer)
  bindEmailCountdownTimer = setInterval(() => {
    bindEmailCountdown.value--
    if (bindEmailCountdown.value <= 0) {
      clearInterval(bindEmailCountdownTimer)
      bindEmailCountdownTimer = null
    }
  }, 1000)
}

onUnmounted(() => {
  if (bindEmailCountdownTimer) {
    clearInterval(bindEmailCountdownTimer)
    bindEmailCountdownTimer = null
  }
})

async function handleBindEmailSendCode() {
  if (!bindEmailForm.email) {
    ElMessage.warning('请先填写邮箱')
    return
  }
  bindEmailSendingCode.value = true
  try {
    await guestBindEmailSendCodeApi({ email: bindEmailForm.email })
    ElMessage.success('验证码已发送，请查收邮件')
    startBindEmailCountdown()
  } catch {
    // 错误已由拦截器处理
  } finally {
    bindEmailSendingCode.value = false
  }
}

async function handleBindEmail() {
  await bindEmailFormRef.value?.validate()
  bindEmailSaving.value = true
  try {
    const res = await guestBindEmailApi({
      email: bindEmailForm.email,
      code: bindEmailForm.code
    })
    const { accessToken, refreshToken } = res.data.data
    ElMessage.success('邮箱绑定成功，请重新登录')
    bindEmailDialogVisible.value = false
    logout()
    router.replace({ name: 'GameLogin' })
  } catch {
    // 错误已由拦截器处理
  } finally {
    bindEmailSaving.value = false
  }
}

// ── 游戏配置 ──
async function fetchGameSettings() {
  try {
    const res = await getGameSettingsApi()
    gameSettings.value = res.data.data || {}
  } catch {
    // ignore
  }
}

// ── 初始化 ──
onMounted(async () => {
  loading.value = true
  await Promise.all([
    fetchPlayerInfo(),
    fetchGameSettings(),
    fetchGuildLevelInfo()
  ])
  loading.value = false
})
</script>

<style scoped>
.rpg-title {
  font-family: 'serif';
  text-shadow: 0 0 10px rgba(255, 200, 50, 0.4);
  animation: titleGlow 3s ease-in-out infinite;
}
@keyframes titleGlow {
  0%,
  100% {
    text-shadow: 0 0 8px rgba(255, 200, 50, 0.3);
  }
  50% {
    text-shadow: 0 0 18px rgba(255, 200, 50, 0.7);
  }
}

.rpg-card {
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.9) 0%,
    rgba(240, 230, 200, 0.6) 100%
  );
  border: 1px solid rgba(200, 160, 80, 0.3);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
}
.dark .rpg-card {
  background: linear-gradient(
    135deg,
    rgba(40, 35, 30, 0.9) 0%,
    rgba(30, 24, 18, 0.8) 100%
  );
  border-color: rgba(200, 160, 80, 0.25);
}
</style>

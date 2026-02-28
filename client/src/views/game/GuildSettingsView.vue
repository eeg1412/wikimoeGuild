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
            <p class="text-sm text-gray-400">
              🪙 {{ (playerInfo?.gold ?? 0).toLocaleString() }} 金币
            </p>
          </div>
        </div>
      </div>

      <!-- 操作说明 -->
      <div class="rpg-card rounded-xl p-4 space-y-3">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-semibold text-gray-700 dark:text-gray-200">
              🎨 修改公会标志
            </p>
            <p class="text-xs text-gray-400 mt-0.5">
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
            <p class="text-xs text-gray-400 mt-0.5">
              消耗 {{ gameSettings.guildChangeNamePrice ?? 1000 }} 金币
            </p>
          </div>
          <el-button type="primary" size="small" @click="handleOpenNameDialog">
            修改
          </el-button>
        </div>
      </div>
    </template>

    <!-- ===== 修改标志弹窗 ===== -->
    <el-dialog
      v-model="logoDialogVisible"
      title="修改公会标志"
      width="360px"
      align-center
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
    >
      <p class="text-sm text-gray-500 mb-3">
        消耗 {{ gameSettings.guildChangeNamePrice ?? 1000 }} 金币
      </p>
      <el-input
        v-model="newGuildName"
        placeholder="输入新公会名（2-8字符）"
        maxlength="8"
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
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { changeGuildLogoApi, changeGuildNameApi } from '@/api/game/guild.js'
import { getGameSettingsApi } from '@/api/game/config.js'
import { useGameUser } from '@/composables/useGameUser.js'
import Cropper from '@/components/Cropper.vue'

const router = useRouter()
const { isLoggedIn, playerInfo, fetchPlayerInfo } = useGameUser()

if (!isLoggedIn.value) {
  router.replace({ name: 'GameLogin' })
}

const loading = ref(false)
const gameSettings = ref({})

// ── 标志修改 ──
const logoDialogVisible = ref(false)
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
const nameDialogVisible = ref(false)
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
  await Promise.all([fetchPlayerInfo(), fetchGameSettings()])
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

<template>
  <div class="w-full py-6">
    <!-- 欢迎区域 -->
    <div class="text-center mb-8">
      <span class="text-6xl mb-4 block">🏰</span>
      <h2 class="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">
        欢迎来到 WikimoeGuild
      </h2>
      <p class="text-gray-500 dark:text-gray-400 mb-4 text-sm">
        一起开启冒险之旅吧
      </p>
      <el-button text size="small" @click="handleNavGuide">
        📖 查看新手手册
      </el-button>

      <!-- 未登录：显示登录/注册按钮 -->
      <div v-if="!isLoggedIn" class="flex flex-wrap gap-3 justify-center mb-6">
        <el-button type="primary" size="large" @click="handleNavLogin">
          🔑 登录
        </el-button>
        <el-button size="large" @click="handleNavRegister"> 📝 注册 </el-button>
        <el-button
          v-if="guestModeEnabled"
          size="large"
          type="success"
          :loading="guestLoading"
          @click="handleNavGuestLogin"
        >
          🎮 游客模式
        </el-button>
      </div>

      <!-- 已登录：快捷菜单 -->
      <div v-else class="mb-6">
        <p class="text-sm text-gray-500 dark:text-gray-400 mb-3">
          欢迎回来，<span class="font-bold text-yellow-500">{{
            playerInfo?.guildName
          }}</span>
        </p>
        <div class="flex flex-wrap gap-2 justify-center">
          <el-button size="small" @click="handleNav('GameAdventurers')"
            >⚔️ 冒险家</el-button
          >
          <el-button size="small" @click="handleNav('GameDungeon')"
            >🏰 地下迷宫</el-button
          >
          <el-button size="small" @click="handleNav('GameMine')"
            >⛏️ 矿场</el-button
          >
          <el-button size="small" @click="handleNav('GameArena')"
            >⚔️ 竞技场</el-button
          >
          <el-button size="small" @click="handleNav('GameMarket')"
            >🏪 交易市场</el-button
          >
          <el-button size="small" @click="handleNav('GameInventory')"
            >🎒 背包</el-button
          >
        </div>
      </div>
    </div>

    <!-- 游戏介绍 -->
    <div class="rpg-card rounded-xl p-5 mb-6">
      <h3
        class="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3 flex items-center gap-2"
      >
        <span>📖</span> 游戏介绍
      </h3>
      <p class="text-sm text-gray-600 dark:text-gray-300 mb-4">
        这是一款放置类的冒险公会经营游戏。招募冒险家、探索迷宫、收集符文石，打造最强公会！
      </p>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div
          class="flex items-start gap-3 bg-gray-50 dark:bg-gray-800 rounded-lg p-3"
        >
          <span class="text-2xl flex-shrink-0">🏰</span>
          <div>
            <p
              class="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1"
            >
              地下迷宫
            </p>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              在地下迷宫放置冒险家，自动产出水晶和符文石。挑战迷宫军团升级迷宫，获取更高级的奖励。
            </p>
          </div>
        </div>
        <div
          class="flex items-start gap-3 bg-gray-50 dark:bg-gray-800 rounded-lg p-3"
        >
          <span class="text-2xl flex-shrink-0">⚔️</span>
          <div>
            <p
              class="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1"
            >
              冒险家培养
            </p>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              使用水晶和金币升级冒险家属性，装备符文石赋予强力技能，编排阵容应对各种战斗。
            </p>
          </div>
        </div>
        <div
          class="flex items-start gap-3 bg-gray-50 dark:bg-gray-800 rounded-lg p-3"
        >
          <span class="text-2xl flex-shrink-0">⛏️</span>
          <div>
            <p
              class="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1"
            >
              矿场探索
            </p>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              扫雷玩法的矿场系统，手动挖掘获取水晶和符文石。成为矿主还能获得其他玩家挖矿时的额外收益。
            </p>
          </div>
        </div>
        <div
          class="flex items-start gap-3 bg-gray-50 dark:bg-gray-800 rounded-lg p-3"
        >
          <span class="text-2xl flex-shrink-0">🏪</span>
          <div>
            <p
              class="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1"
            >
              交易市场
            </p>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              在自由市场交易水晶、符文石碎片和符文石，通过官方市场买卖水晶，积累财富。
            </p>
          </div>
        </div>
        <div
          class="flex items-start gap-3 bg-gray-50 dark:bg-gray-800 rounded-lg p-3"
        >
          <span class="text-2xl flex-shrink-0">🏆</span>
          <div>
            <p
              class="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1"
            >
              竞技场
            </p>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              和其他玩家在竞技场一决高下，赢取竞技点和金币。赛季排名前三还能获得丰厚的奖池奖励。
            </p>
          </div>
        </div>
        <div
          class="flex items-start gap-3 bg-gray-50 dark:bg-gray-800 rounded-lg p-3"
        >
          <span class="text-2xl flex-shrink-0">💎</span>
          <div>
            <p
              class="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1"
            >
              符文石系统
            </p>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              收集不同稀有度的符文石，通过升级和合成打造最强装备，赋予冒险家独特的主动技能和被动增益。
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- 玩家动态 -->
    <div>
      <div class="flex items-center justify-between mb-3">
        <h3
          class="text-sm font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-2"
        >
          <span>📢</span> 玩家动态
        </h3>
        <el-button
          text
          size="small"
          :loading="refreshingFeed"
          @click="handleRefreshFeed"
        >
          🔄 刷新
        </el-button>
      </div>
      <ActivityFeed ref="activityFeedRef" />
    </div>

    <!-- 游客注册结果弹窗 -->
    <GuestResultDialog
      v-model="guestResultVisible"
      :email="guestResult.email"
      :password="guestResult.password"
      @confirm="handleGuestResultConfirm"
    />
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { useGameUser } from '@/composables/useGameUser.js'
import { useDialogRoute } from '@/composables/useDialogRoute.js'
import ActivityFeed from '@/components/ActivityFeed.vue'
import GuestResultDialog from '@/components/GuestResultDialog.vue'
import { getGuestConfigApi, guestRegisterApi } from '@/api/game/auth.js'

const router = useRouter()
const { isLoggedIn, playerInfo, setLogin } = useGameUser()

const activityFeedRef = ref(null)
const refreshingFeed = ref(false)
const guestModeEnabled = ref(false)
const guestLoading = ref(false)

async function handleRefreshFeed() {
  refreshingFeed.value = true
  try {
    await activityFeedRef.value?.refresh()
  } finally {
    refreshingFeed.value = false
  }
}

function handleNavLogin() {
  router.push({ name: 'GameLogin' })
}

function handleNavRegister() {
  router.push({ name: 'GameRegister' })
}

function handleNav(routeName) {
  router.push({ name: routeName })
}

function handleNavGuide() {
  router.push({ name: 'GameGuide' })
}

async function loadGuestConfig() {
  try {
    const res = await getGuestConfigApi()
    guestModeEnabled.value = res.data.data?.guestModeEnabled ?? false
  } catch {
    // ignore
  }
}

const { visible: guestResultVisible } = useDialogRoute('guestResult')
const guestResult = reactive({ email: '', password: '' })
let pendingGuestLogin = null

async function handleNavGuestLogin() {
  guestLoading.value = true
  try {
    const res = await guestRegisterApi()
    const {
      accessToken,
      refreshToken,
      playerInfo: pInfo,
      guestEmail,
      guestPassword
    } = res.data.data
    // 先显示账号信息弹窗
    guestResult.email = guestEmail
    guestResult.password = guestPassword
    pendingGuestLogin = { accessToken, refreshToken, playerInfo: pInfo }
    guestResultVisible.value = true
  } catch {
    // 错误已由拦截器处理
  } finally {
    guestLoading.value = false
  }
}

function handleGuestResultConfirm() {
  guestResultVisible.value = false
  if (pendingGuestLogin) {
    const { accessToken, refreshToken, playerInfo: pInfo } = pendingGuestLogin
    setLogin(accessToken, refreshToken, pInfo)
    pendingGuestLogin = null
    ElMessage.success({ message: '欢迎来到游戏！', showClose: true })
    router.replace({ name: 'GameHome' })
  }
}

onMounted(() => {
  if (!isLoggedIn.value) {
    loadGuestConfig()
  }
})
</script>

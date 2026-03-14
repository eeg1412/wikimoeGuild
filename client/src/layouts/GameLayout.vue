<template>
  <div
    class="min-h-screen flex flex-col bg-gray-100 dark:bg-[#141414] transition-colors game-layout"
    :class="
      route.name === 'GameDungeon' ? '!bg-[#141414] game-layout-dungeon' : ''
    "
  >
    <!-- 顶栏 -->
    <header
      class="sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6 py-3 bg-gray-50 dark:bg-[#1d1e1f] shadow-sm"
    >
      <!-- 左侧标题 -->
      <router-link
        to="/game/home"
        class="flex-1 min-w-0 text-lg font-bold text-gray-800 dark:text-gray-100 hover:opacity-80 transition-opacity truncate"
      >
        {{ siteSettings.siteTitle || 'WikimoeGuild' }}
      </router-link>

      <!-- 右侧操作区 -->
      <div class="flex items-center gap-2 shrink-0">
        <!-- 公会等级（已登录时） -->
        <el-popover
          v-if="isLoggedIn && playerInfo"
          :width="300"
          trigger="click"
          placement="bottom-end"
          @show="handleGuildLevelPopoverShow"
          @after-leave="handleGuildLevelPopoverAfterLeave"
        >
          <template #reference>
            <button
              type="button"
              class="flex items-center gap-1 px-2 py-1 rounded-full bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700/40 cursor-pointer hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-colors"
            >
              <span class="text-purple-500 text-sm">🏰</span>
              <span
                class="text-sm font-semibold text-purple-600 dark:text-purple-400 tabular-nums"
              >
                Lv.{{ playerInfo.guildLevel ?? 1 }}
              </span>
            </button>
          </template>
          <!-- 公会等级升级面板 -->
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <span
                class="text-sm font-semibold text-gray-700 dark:text-gray-200"
                >🏰 公会等级</span
              >
              <span class="text-lg font-bold text-purple-500"
                >Lv.{{ playerInfo.guildLevel ?? 1 }}</span
              >
            </div>
            <div v-if="guildLevelLoading" class="text-center py-3">
              <span class="animate-spin inline-block text-xl">⏳</span>
            </div>
            <template v-else-if="guildLevelInfo">
              <div class="space-y-1.5 text-sm">
                <div class="flex justify-between">
                  <span class="text-gray-500 dark:text-gray-400"
                    >冒险家容量</span
                  >
                  <span class="font-semibold text-gray-700 dark:text-gray-200"
                    >{{ playerInfo.adventurerCount ?? 0 }} /
                    {{ guildLevelInfo.maxAdventurerCount }}</span
                  >
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-500 dark:text-gray-400"
                    >综合等级上限</span
                  >
                  <span
                    class="font-semibold text-gray-700 dark:text-gray-200"
                    >{{ guildLevelInfo.maxComprehensiveLevel }}</span
                  >
                </div>
                <template v-if="guildLevelInfo.nextMaxAdventurerCount">
                  <el-divider class="my-1.5!" />
                  <p class="text-xs text-gray-400 text-center">升级后</p>
                  <div class="flex justify-between">
                    <span class="text-gray-500 dark:text-gray-400"
                      >冒险家容量</span
                    >
                    <span class="font-semibold text-green-500">{{
                      guildLevelInfo.nextMaxAdventurerCount
                    }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-500 dark:text-gray-400"
                      >综合等级上限</span
                    >
                    <span class="font-semibold text-green-500">{{
                      guildLevelInfo.nextMaxComprehensiveLevel
                    }}</span>
                  </div>
                </template>
                <el-divider class="my-1.5!" />
                <div class="flex justify-between">
                  <span class="text-gray-500 dark:text-gray-400">升级费用</span>
                  <span class="font-semibold text-yellow-500"
                    >🪙 {{ guildLevelInfo.fee?.toLocaleString() }}</span
                  >
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-500 dark:text-gray-400">当前金币</span>
                  <span class="font-semibold text-yellow-500"
                    >🪙 {{ guildLevelInfo.gold?.toLocaleString() }}</span
                  >
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-500 dark:text-gray-400"
                    >需满级冒险家</span
                  >
                  <span
                    class="font-semibold"
                    :class="
                      guildLevelInfo.qualifiedCount >=
                      guildLevelInfo.requiredCount
                        ? 'text-green-500'
                        : 'text-red-500'
                    "
                    >{{ guildLevelInfo.qualifiedCount }} /
                    {{ guildLevelInfo.requiredCount }}</span
                  >
                </div>
              </div>
              <el-button
                type="primary"
                class="w-full"
                :loading="guildLevelUpLoading"
                :disabled="guildLevelUpLoading || !canUpgradeGuild"
                @click="handleGuildLevelUp"
              >
                ⬆️ 升级公会 (Lv.{{ (playerInfo.guildLevel ?? 1) + 1 }})
              </el-button>
            </template>
          </div>
        </el-popover>

        <!-- 背包按钮（已登录时） -->
        <el-popover
          v-if="isLoggedIn && playerInfo"
          :width="260"
          trigger="click"
          placement="bottom-end"
          @show="handleBackpackPopoverShow"
          @after-leave="handleBackpackPopoverAfterLeave"
        >
          <template #reference>
            <button
              type="button"
              class="flex items-center gap-1 px-2 py-1 rounded-full bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700/40 cursor-pointer hover:bg-yellow-100 dark:hover:bg-yellow-900/40 transition-colors"
            >
              <span class="text-yellow-500 text-sm">🎒</span>
            </button>
          </template>
          <!-- 背包弹出面板 -->
          <div class="space-y-2">
            <p class="text-sm font-semibold text-gray-700 dark:text-gray-200">
              🎒 背包
            </p>
            <div
              class="flex items-center justify-between bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-2"
            >
              <span class="text-sm text-gray-600 dark:text-gray-300"
                >🪙 金币</span
              >
              <span class="font-bold text-yellow-500 tabular-nums">{{
                playerInfo.gold?.toLocaleString() ?? 0
              }}</span>
            </div>
            <div v-if="backpackLoading" class="text-center py-2">
              <span class="animate-spin inline-block text-sm">⏳</span>
            </div>
            <template v-else-if="backpackInventory">
              <div class="grid grid-cols-1 gap-1.5">
                <div
                  v-for="cry in backpackCrystalList"
                  :key="cry.key"
                  class="flex items-center justify-between bg-gray-50 dark:bg-gray-800 rounded p-1.5"
                >
                  <span class="text-xs text-gray-500"
                    >{{ cry.icon }} {{ cry.name }}</span
                  >
                  <span class="flex items-center gap-1">
                    <span
                      class="text-sm font-semibold tabular-nums"
                      :class="cry.colorClass"
                      >{{ backpackInventory[cry.key] ?? 0 }}</span
                    >
                    <span
                      class="text-xs text-yellow-500 cursor-pointer hover:underline"
                      @click="openBackpackSellDialog(cry.key)"
                      >出售</span
                    >
                  </span>
                </div>
              </div>
              <div
                class="flex items-center justify-between bg-gray-50 dark:bg-gray-800 rounded p-1.5"
              >
                <span class="text-xs text-gray-500">💎 符文碎片</span>
                <span
                  class="text-sm font-semibold text-cyan-400 tabular-nums"
                  >{{ backpackInventory.runeFragment ?? 0 }}</span
                >
              </div>
            </template>
          </div>
        </el-popover>

        <!-- 暗模式切换 -->
        <el-button text circle @click="toggleTheme">
          <span class="text-lg">{{ isDark ? '☀️' : '🌙' }}</span>
        </el-button>

        <!-- 已登录：显示公会图标和公会名 -->
        <template v-if="isLoggedIn && playerInfo">
          <el-dropdown trigger="click">
            <div class="flex items-center gap-2 cursor-pointer">
              <GameGuildIcon
                :player-info="playerInfo"
                class="w-7 h-7 rounded object-cover"
              />
              <span
                class="text-sm text-gray-700 dark:text-gray-200 hidden sm:inline"
              >
                {{ playerInfo.guildName }}
              </span>
              <span class="text-xs text-gray-400">▼</span>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item
                  @click="handleNavTo({ name: 'GameGuildSettings' })"
                >
                  ⚙️ 公会设置
                </el-dropdown-item>
                <el-dropdown-item divided @click="handleLogout">
                  🚪 退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </template>

        <!-- 未登录：显示登录和注册按钮 -->
        <template v-else>
          <router-link to="/game/login">
            <el-button text size="small">登录</el-button>
          </router-link>
          <router-link to="/game/register">
            <el-button type="primary" size="small">注册</el-button>
          </router-link>
        </template>
      </div>
    </header>

    <!-- 主体 -->
    <main
      class="flex-1 flex flex-col items-start px-4 w-full mx-auto max-w-[720px]"
    >
      <!-- 游客提醒横幅 -->
      <div
        v-if="isLoggedIn && playerInfo?.isGuest"
        class="w-full bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-300 dark:border-yellow-700 rounded-lg px-4 py-2 mt-4 flex items-center justify-between gap-2"
      >
        <div class="flex items-center gap-2 min-w-0">
          <span class="text-yellow-500 text-lg flex-shrink-0">⚠️</span>
          <span class="text-sm text-yellow-700 dark:text-yellow-300 truncate">
            您正在使用游客账号，请及时绑定邮箱
          </span>
        </div>
        <el-button
          type="warning"
          size="small"
          class="flex-shrink-0"
          @click="handleNavTo({ name: 'GameGuildSettings' })"
        >
          去绑定
        </el-button>
      </div>
      <router-view class="w-full" />
    </main>

    <!-- 页脚 -->
    <footer class="py-4 text-center text-sm text-gray-400 dark:text-gray-600">
      &copy; {{ new Date().getFullYear() }}
      {{ siteSettings.siteTitle || 'WikimoeGuild' }}
    </footer>

    <!-- 悬浮菜单球（已登录时显示） -->
    <div
      v-if="isLoggedIn"
      class="fixed bottom-6 right-4 z-50 flex flex-col items-end gap-2"
    >
      <!-- 菜单项（展开时显示） -->
      <transition name="fab-menu">
        <div v-if="fabOpen" class="fab-grid-panel">
          <div class="fab-grid-item" @click="handleNavTo({ name: 'GameHome' })">
            <span class="fab-grid-icon">🏠</span>
            <span class="fab-grid-label">首页</span>
          </div>
          <div
            class="fab-grid-item"
            @click="handleNavTo({ name: 'GameAdventurers' })"
          >
            <span class="fab-grid-icon">⚔️</span>
            <span class="fab-grid-label">冒险家</span>
          </div>
          <div
            class="fab-grid-item"
            @click="handleNavTo({ name: 'GameDungeon' })"
          >
            <span class="fab-grid-icon">🏰</span>
            <span class="fab-grid-label">迷宫</span>
          </div>
          <div
            class="fab-grid-item"
            @click="handleNavTo({ name: 'GameRuneStones' })"
          >
            <span class="fab-grid-icon">💎</span>
            <span class="fab-grid-label">符文石</span>
          </div>
          <div
            class="fab-grid-item"
            @click="handleNavTo({ name: 'GameFormations' })"
          >
            <span class="fab-grid-icon">🏗️</span>
            <span class="fab-grid-label">阵容</span>
          </div>
          <div
            class="fab-grid-item"
            @click="handleNavTo({ name: 'GameInventory' })"
          >
            <span class="fab-grid-icon">🎒</span>
            <span class="fab-grid-label">背包</span>
          </div>
          <div class="fab-grid-item" @click="handleNavTo({ name: 'GameMail' })">
            <div class="relative inline-flex">
              <span class="fab-grid-icon">📬</span>
              <span v-if="unreadMailBadge" class="fab-badge">{{
                unreadMailBadge
              }}</span>
            </div>
            <span class="fab-grid-label">邮箱</span>
          </div>
          <div
            class="fab-grid-item"
            @click="handleNavTo({ name: 'GameMarket' })"
          >
            <span class="fab-grid-icon">🏪</span>
            <span class="fab-grid-label">市场</span>
          </div>
          <div
            class="fab-grid-item"
            @click="handleNavTo({ name: 'GameArena' })"
          >
            <span class="fab-grid-icon">🏟️</span>
            <span class="fab-grid-label">竞技场</span>
          </div>
          <div class="fab-grid-item" @click="handleNavTo({ name: 'GameMine' })">
            <span class="fab-grid-icon">⛏️</span>
            <span class="fab-grid-label">矿场</span>
          </div>
          <div
            class="fab-grid-item"
            @click="handleNavTo({ name: 'GameGuildSettings' })"
          >
            <span class="fab-grid-icon">⚙️</span>
            <span class="fab-grid-label">公会</span>
          </div>
          <div
            class="fab-grid-item"
            @click="handleNavTo({ name: 'GameGuide' })"
          >
            <span class="fab-grid-icon">📖</span>
            <span class="fab-grid-label">手册</span>
          </div>
        </div>
      </transition>

      <!-- 主按钮 -->
      <button
        class="fab-main"
        :class="{ 'fab-main--open': fabOpen }"
        @click="toggleFab"
        aria-label="菜单"
      >
        <span
          class="text-2xl transition-transform duration-300"
          :class="{ 'rotate-45': fabOpen }"
        >
          ➕
        </span>
        <!-- 红点角标 -->
        <span v-if="hasNewContent && !fabOpen" class="fab-dot" />
      </button>
    </div>

    <!-- 悬浮菜单遮罩 -->
    <transition name="fab-overlay">
      <div
        v-if="fabOpen && isLoggedIn"
        class="fixed inset-0 bg-black/40 z-40"
        @click="fabOpen = false"
      />
    </transition>

    <!-- ===== 背包快速出售水晶弹窗 ===== -->
    <el-dialog
      v-model="backpackSellVisible"
      :title="`快速出售 ${backpackSellCrystalLabel}`"
      width="320px"
      align-center
      destroy-on-close
      v-bind="backpackSellLockProps"
      append-to-body
    >
      <div class="space-y-3">
        <p class="text-sm text-gray-500 dark:text-gray-400">
          当前持有:
          <span class="font-bold text-yellow-500">
            {{ backpackInventory?.[backpackSellCrystalType] ?? 0 }}
          </span>
        </p>
        <p class="text-xs text-gray-400">
          官方收购单价:
          <span class="text-yellow-500 font-semibold"
            >🪙 {{ backpackGameSettings?.officialCrystalBuyPrice ?? 100 }}</span
          >
        </p>
        <div
          v-if="backpackPriceRange"
          class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-2 text-xs text-gray-500 dark:text-gray-400"
        >
          <p>
            📊 收购单价区间:
            <span class="text-yellow-500 font-semibold">
              🪙 {{ backpackPriceRange.minPrice
              }}<template
                v-if="backpackPriceRange.maxPrice > backpackPriceRange.minPrice"
              >
                ~ {{ backpackPriceRange.maxPrice }}</template
              >
            </span>
          </p>
          <p class="text-xs text-gray-400 mt-1">
            💡 出售时会优先匹配市场高价求购单
          </p>
        </div>
        <div class="flex">
          <el-button
            size="small"
            :loading="backpackSellLoading"
            :disabled="backpackSellLoading"
            @click="handleBackpackSell(10)"
          >
            出售 10
          </el-button>
          <el-button
            size="small"
            :loading="backpackSellLoading"
            :disabled="backpackSellLoading"
            @click="handleBackpackSell(100)"
          >
            出售 100
          </el-button>
          <el-button
            size="small"
            :loading="backpackSellLoading"
            :disabled="backpackSellLoading"
            @click="handleBackpackSell(1000)"
          >
            出售 1000
          </el-button>
        </div>
        <div class="flex items-center gap-2">
          <el-input-number
            v-model="backpackSellCustomAmount"
            :min="1"
            :max="99999"
            size="small"
            class="flex-1"
          />
          <el-button
            type="primary"
            size="small"
            :loading="backpackSellLoading"
            :disabled="backpackSellLoading"
            @click="handleBackpackSell(backpackSellCustomAmount)"
          >
            出售
          </el-button>
        </div>
        <div class="text-sm text-gray-400">
          预计获得<span class="text-xs">(按官方收购价计算)</span>:
          <span class="text-yellow-500 font-semibold"
            >🪙
            {{
              (
                backpackSellCustomAmount *
                (backpackGameSettings?.officialCrystalBuyPrice ?? 100)
              ).toLocaleString()
            }}</span
          >
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'

import { useTheme } from '@/composables/useTheme.js'
import { useGameUser } from '@/composables/useGameUser.js'
import { useGameSiteSettings } from '@/composables/useGameSiteSettings.js'
import { useDialogLock } from '@/composables/useDialogLock.js'
import { getGuildLevelInfoApi, upgradeGuildLevelApi } from '@/api/game/guild.js'
import { getMyInventoryApi } from '@/api/game/inventory.js'
import {
  sellCrystalToOfficialApi,
  smartSellCrystalApi,
  getCrystalBuyPriceRangeApi
} from '@/api/game/market.js'
import { getGameSettingsApi } from '@/api/game/config.js'
import { getUnreadCountApi } from '@/api/game/mail.js'

const router = useRouter()
const route = useRoute()
const { isDark, toggleTheme } = useTheme()
const { isLoggedIn, playerInfo, fetchPlayerInfo, logout } = useGameUser()
const { siteSettings, loadSiteSettings } = useGameSiteSettings()

// 悬浮菜单控制
const fabOpen = ref(false)

// ── 未读邮件角标 ──
const unreadMailCount = ref(0)

const hasNewContent = computed(() => unreadMailCount.value > 0)

const unreadMailBadge = computed(() => {
  if (unreadMailCount.value <= 0) return ''
  if (unreadMailCount.value > 99) return '99+'
  return String(unreadMailCount.value)
})

async function fetchUnreadMailCount() {
  if (!isLoggedIn.value) return
  try {
    const res = await getUnreadCountApi()
    unreadMailCount.value = res.data.data?.unreadCount ?? 0
  } catch {
    // ignore
  }
}

// 每次路由切换时更新未读数
watch(
  () => route.fullPath,
  () => {
    fetchUnreadMailCount()
  }
)

// ── 公会等级面板 ──
const guildLevelLoading = ref(false)
const guildLevelInfo = ref(null)
const guildLevelUpLoading = ref(false)

// 是否可升级公会
const canUpgradeGuild = computed(() => {
  const info = guildLevelInfo.value
  if (!info || !info.fee) return false
  return (
    info.gold >= info.fee &&
    info.qualifiedCount >= info.requiredCount &&
    (playerInfo.value?.guildLevel ?? 1) < info.maxGuildLevel
  )
})

async function handleGuildLevelPopoverShow() {
  guildLevelLoading.value = true
  guildLevelInfo.value = null
  try {
    const res = await getGuildLevelInfoApi()
    guildLevelInfo.value = res.data.data
  } catch {
    // ignore
  } finally {
    guildLevelLoading.value = false
  }
}

function handleGuildLevelPopoverAfterLeave() {
  guildLevelInfo.value = null
}

async function handleGuildLevelUp() {
  try {
    await ElMessageBox.confirm(
      `确定花费 ${guildLevelInfo.value?.fee?.toLocaleString()} 金币升级公会？`,
      '公会升级',
      { confirmButtonText: '确定升级', cancelButtonText: '取消', type: 'info' }
    )
  } catch {
    return
  }
  guildLevelUpLoading.value = true
  try {
    await upgradeGuildLevelApi()
    ElMessage.success({ message: '公会升级成功！', showClose: true })
    await fetchPlayerInfo()
    await handleGuildLevelPopoverShow()
  } catch {
    // handled by interceptor
  } finally {
    guildLevelUpLoading.value = false
  }
}

// ── 背包面板 ──
const backpackLoading = ref(false)
const backpackInventory = ref(null)

async function handleBackpackPopoverShow() {
  backpackLoading.value = true
  backpackInventory.value = null
  try {
    const res = await getMyInventoryApi()
    backpackInventory.value = res.data.data
  } catch {
    // ignore
  } finally {
    backpackLoading.value = false
  }
}

function handleBackpackPopoverAfterLeave() {
  backpackInventory.value = null
}

// ── 背包快速出售 ──
const backpackCrystalList = [
  {
    key: 'attackCrystal',
    name: '攻击水晶',
    icon: '⚔️',
    colorClass: 'text-red-400'
  },
  {
    key: 'defenseCrystal',
    name: '防御水晶',
    icon: '🛡️',
    colorClass: 'text-blue-400'
  },
  {
    key: 'speedCrystal',
    name: '速度水晶',
    icon: '💨',
    colorClass: 'text-green-400'
  },
  {
    key: 'sanCrystal',
    name: 'SAN水晶',
    icon: '❤️',
    colorClass: 'text-purple-400'
  }
]

const backpackSellVisible = ref(false)
const backpackSellCrystalType = ref('attackCrystal')
const backpackSellCustomAmount = ref(10)
const backpackSellLoading = ref(false)
const { dialogLockProps: backpackSellLockProps } = useDialogLock(
  () => backpackSellLoading.value
)
const backpackGameSettings = ref({})
const backpackPriceRange = ref(null)

const backpackSellCrystalLabel = computed(() => {
  return (
    backpackCrystalList.find(c => c.key === backpackSellCrystalType.value)
      ?.name || '水晶'
  )
})

async function openBackpackSellDialog(crystalType) {
  backpackSellCrystalType.value = crystalType
  backpackSellCustomAmount.value = 10
  backpackPriceRange.value = null
  try {
    const [settingsRes, priceRes] = await Promise.all([
      getGameSettingsApi(),
      getCrystalBuyPriceRangeApi()
    ])
    backpackGameSettings.value = settingsRes.data.data || {}
    const ranges = priceRes.data.data || {}
    backpackPriceRange.value = ranges[crystalType] || null
  } catch {
    // ignore
  }
  backpackSellVisible.value = true
}

async function handleBackpackSell(amount) {
  if (!amount || amount <= 0) return
  backpackSellLoading.value = true
  try {
    const res = await smartSellCrystalApi({
      crystalType: backpackSellCrystalType.value,
      quantity: amount
    })
    const data = res.data.data
    let msg = `出售成功，获得 ${data.goldEarned} 金币`
    if (data.soldToBuyers > 0) {
      msg += `（市场求购 ${data.soldToBuyers} 个 +${data.goldFromBuyers}🪙, 官方 ${data.soldToOfficial} 个 +${data.goldFromOfficial}🪙）`
    }
    ElMessage.success({ message: msg, showClose: true })
    // 刷新背包和玩家信息
    const [invRes] = await Promise.all([getMyInventoryApi(), fetchPlayerInfo()])
    backpackInventory.value = invRes.data.data
  } catch {
    // handled by interceptor
  } finally {
    backpackSellLoading.value = false
  }
}

function handleNavTo(routeObj) {
  fabOpen.value = false
  router.push(routeObj)
}

function toggleFab() {
  fabOpen.value = !fabOpen.value
}

// 更新文档标题和 meta
function updateDocumentMeta() {
  const title = siteSettings.value.siteTitle
  const subTitle = siteSettings.value.siteSubTitle
  if (title) {
    document.title = subTitle ? `${title} - ${subTitle}` : title
  }
  const keywords = siteSettings.value.siteKeywords
  if (keywords) {
    let metaKeywords = document.querySelector('meta[name="keywords"]')
    if (!metaKeywords) {
      metaKeywords = document.createElement('meta')
      metaKeywords.setAttribute('name', 'keywords')
      document.head.appendChild(metaKeywords)
    }
    metaKeywords.setAttribute('content', keywords)
  }
  const siteUrl = siteSettings.value.siteUrl
  if (siteUrl) {
    let metaCanonical = document.querySelector('link[rel="canonical"]')
    if (!metaCanonical) {
      metaCanonical = document.createElement('link')
      metaCanonical.setAttribute('rel', 'canonical')
      document.head.appendChild(metaCanonical)
    }
    metaCanonical.setAttribute('href', siteUrl)
  }
}

watch(siteSettings, updateDocumentMeta, { deep: true })

onMounted(async () => {
  await loadSiteSettings()
  updateDocumentMeta()
  if (isLoggedIn.value) {
    await fetchPlayerInfo()
    fetchUnreadMailCount()
  }
})

function handleLogout() {
  logout()
  fabOpen.value = false
  unreadMailCount.value = 0
  router.push('/game/home')
}
</script>

<style scoped>
/* ─── 悬浮菜单球 ─── */
.fab-main {
  position: relative;
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: linear-gradient(135deg, #f5c842 0%, #e8920a 100%);
  border: none;
  box-shadow: 0 4px 16px rgba(232, 146, 10, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #fff;
  transition:
    transform 0.25s ease,
    box-shadow 0.25s ease;
  outline: none;
}

.fab-main:hover {
  transform: scale(1.08);
  box-shadow: 0 6px 24px rgba(232, 146, 10, 0.7);
}

.fab-main:active {
  transform: scale(0.96);
}

.fab-main--open {
  background: linear-gradient(135deg, #7c5cbf 0%, #4b3080 100%);
  box-shadow: 0 4px 16px rgba(124, 92, 191, 0.6);
}

/* 网格面板 */
.fab-grid-panel {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  padding: 12px;
  background: rgba(30, 20, 10, 0.92);
  backdrop-filter: blur(8px);
  border-radius: 16px;
  border: 1px solid rgba(200, 160, 80, 0.3);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  margin-bottom: 8px;
  max-width: 280px;
}

/* 横屏时使用更多列 */
@media (orientation: landscape) and (max-height: 500px) {
  .fab-grid-panel {
    grid-template-columns: repeat(6, 1fr);
    max-width: 420px;
    gap: 6px;
    padding: 10px;
  }
}

.fab-grid-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 8px 4px;
  border-radius: 12px;
  cursor: pointer;
  transition: background 0.2s ease;
}

.fab-grid-item:hover {
  background: rgba(200, 160, 80, 0.15);
}

.fab-grid-item:active {
  background: rgba(200, 160, 80, 0.25);
}

.fab-grid-icon {
  font-size: 24px;
  line-height: 1;
}

.fab-grid-label {
  font-size: 12px;
  font-weight: 600;
  color: #e8d5b0;
  white-space: nowrap;
  text-align: center;
}

/* 菜单展开动画 */
.fab-menu-enter-active {
  transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.fab-menu-leave-active {
  transition: all 0.18s ease-in;
}
.fab-menu-enter-from,
.fab-menu-leave-to {
  opacity: 0;
  transform: translateY(12px) scale(0.9);
}

/* 遮罩动画 */
.fab-overlay-enter-active {
  transition: opacity 0.25s ease;
}
.fab-overlay-leave-active {
  transition: opacity 0.18s ease;
}
.fab-overlay-enter-from,
.fab-overlay-leave-to {
  opacity: 0;
}

/* 红点角标（主按钮上） */
.fab-dot {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 10px;
  height: 10px;
  background: #ef4444;
  border-radius: 50%;
  border: 2px solid #fff;
  box-shadow: 0 1px 4px rgba(239, 68, 68, 0.5);
  pointer-events: none;
}

/* 数字角标（邮件项上） */
.fab-badge {
  position: absolute;
  top: -6px;
  right: -10px;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  background: #ef4444;
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  line-height: 18px;
  text-align: center;
  border-radius: 9px;
  pointer-events: none;
  white-space: nowrap;
}

/* dungeons_texturize.webp */
.game-layout-dungeon {
  background-image: url('/publicgame/assets/dungeons_texturize.webp');
  /* 平铺 */
  background-repeat: repeat;
  /* 固定在视口 */
  background-attachment: fixed;
  background-size: 512px;
}
</style>

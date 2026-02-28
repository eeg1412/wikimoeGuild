<template>
  <div
    class="min-h-screen flex flex-col bg-gray-50 dark:bg-[#141414] transition-colors game-layout"
  >
    <!-- 顶栏 -->
    <header
      class="sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6 py-3 bg-white dark:bg-[#1d1e1f] shadow-sm"
    >
      <!-- 左侧标题 -->
      <router-link
        to="/game/home"
        class="text-lg font-bold text-gray-800 dark:text-gray-100 hover:opacity-80 transition-opacity"
      >
        {{ siteSettings.siteTitle || 'WikimoeGuild' }}
      </router-link>

      <!-- 右侧操作区 -->
      <div class="flex items-center gap-2">
        <!-- 金币显示（已登录时） -->
        <div
          v-if="isLoggedIn && playerInfo"
          class="flex items-center gap-1 px-2 py-1 rounded-full bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700/40"
        >
          <span class="text-yellow-500 text-sm">🪙</span>
          <span
            class="text-sm font-semibold text-yellow-600 dark:text-yellow-400 tabular-nums"
          >
            {{ playerInfo.gold?.toLocaleString() ?? 0 }}
          </span>
        </div>

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
    <main class="flex-1 flex items-start px-4 w-full mx-auto max-w-[720px]">
      <router-view />
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
            <span class="fab-grid-icon">📬</span>
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
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'

import { useTheme } from '@/composables/useTheme.js'
import { useGameUser } from '@/composables/useGameUser.js'
import { useGameSiteSettings } from '@/composables/useGameSiteSettings.js'

const router = useRouter()
const { isDark, toggleTheme } = useTheme()
const { isLoggedIn, playerInfo, fetchPlayerInfo, logout } = useGameUser()
const { siteSettings, loadSiteSettings } = useGameSiteSettings()

// 悬浮菜单控制
const fabOpen = ref(false)

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
  }
})

function handleLogout() {
  logout()
  fabOpen.value = false
  router.push('/game/home')
}
</script>

<style scoped>
/* ─── 悬浮菜单球 ─── */
.fab-main {
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
</style>

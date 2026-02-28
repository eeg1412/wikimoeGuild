<template>
  <div
    class="min-h-screen flex flex-col bg-gray-50 dark:bg-[#141414] transition-colors"
  >
    <!-- 顶栏 -->
    <header
      class="flex items-center justify-between px-4 sm:px-6 py-3 bg-white dark:bg-[#1d1e1f] shadow-sm"
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
              <el-avatar :size="28" :src="guildIconUrl" shape="square" />
              <span
                class="text-sm text-gray-700 dark:text-gray-200 hidden sm:inline"
              >
                {{ playerInfo.guildName }}
              </span>
              <span class="text-xs text-gray-400">▼</span>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item @click="handleLogout"
                  >退出登录</el-dropdown-item
                >
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
        <div v-if="fabOpen" class="flex flex-col items-end gap-2 mb-2">
          <!-- 冒险家列表 -->
          <div class="fab-item-wrapper" @click="navTo('/game/adventurers')">
            <span class="fab-label">冒险家</span>
            <div class="fab-item-btn">
              <span class="text-xl">⚔️</span>
            </div>
          </div>
          <!-- 地下迷宫 -->
          <div class="fab-item-wrapper" @click="navTo('/game/dungeon')">
            <span class="fab-label">地下迷宫</span>
            <div class="fab-item-btn">
              <span class="text-xl">🏰</span>
            </div>
          </div>
          <!-- 符文石 -->
          <div class="fab-item-wrapper" @click="navTo('/game/rune-stones')">
            <span class="fab-label">符文石</span>
            <div class="fab-item-btn">
              <span class="text-xl">💎</span>
            </div>
          </div>
          <!-- 阵容配置 -->
          <div class="fab-item-wrapper" @click="navTo('/game/formations')">
            <span class="fab-label">阵容配置</span>
            <div class="fab-item-btn">
              <span class="text-xl">🏗️</span>
            </div>
          </div>
          <!-- 背包 -->
          <div class="fab-item-wrapper" @click="navTo('/game/inventory')">
            <span class="fab-label">背包</span>
            <div class="fab-item-btn">
              <span class="text-xl">🎒</span>
            </div>
          </div>
          <!-- 邮箱 -->
          <div class="fab-item-wrapper" @click="navTo('/game/mail')">
            <span class="fab-label">邮箱</span>
            <div class="fab-item-btn">
              <span class="text-xl">📬</span>
            </div>
          </div>
          <!-- 交易市场 -->
          <div class="fab-item-wrapper" @click="navTo('/game/market')">
            <span class="fab-label">交易市场</span>
            <div class="fab-item-btn">
              <span class="text-xl">🏪</span>
            </div>
          </div>
          <!-- 竞技场 -->
          <div class="fab-item-wrapper" @click="navTo('/game/arena')">
            <span class="fab-label">竞技场</span>
            <div class="fab-item-btn">
              <span class="text-xl">⚔️</span>
            </div>
          </div>
          <!-- 矿场 -->
          <div class="fab-item-wrapper" @click="navTo('/game/mine')">
            <span class="fab-label">矿场</span>
            <div class="fab-item-btn">
              <span class="text-xl">⛏️</span>
            </div>
          </div>
        </div>
      </transition>

      <!-- 主按钮 -->
      <button
        class="fab-main"
        :class="{ 'fab-main--open': fabOpen }"
        @click="fabOpen = !fabOpen"
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
const { isLoggedIn, playerInfo, guildIconUrl, fetchPlayerInfo, logout } =
  useGameUser()
const { siteSettings, loadSiteSettings } = useGameSiteSettings()

// 悬浮菜单控制
const fabOpen = ref(false)

function navTo(path) {
  fabOpen.value = false
  router.push(path)
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

.fab-item-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.fab-item-wrapper:hover .fab-item-btn {
  transform: scale(1.1);
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.3);
}

.fab-item-btn {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: rgba(30, 20, 10, 0.85);
  border: 2px solid rgba(200, 160, 80, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
  overflow: hidden;
  position: relative;
}

.fab-icon-img {
  width: 28px;
  height: 28px;
  object-fit: contain;
}

.fab-fallback-icon {
  color: #d4a843;
}

.fab-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: #fff;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  padding: 3px 8px;
  border-radius: 12px;
  white-space: nowrap;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
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
</style>

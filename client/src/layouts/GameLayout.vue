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
        <!-- <span
          v-if="siteSettings.siteSubTitle"
          class="hidden sm:inline text-sm font-normal text-gray-400 ml-2"
        >
          {{ siteSettings.siteSubTitle }}
        </span> -->
      </router-link>

      <!-- 右侧操作区 -->
      <div class="flex items-center gap-2">
        <!-- 暗模式切换 -->
        <el-button text circle @click="toggleTheme">
          <el-icon :size="18">
            <Moon v-if="!isDark" />
            <Sunny v-else />
          </el-icon>
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
              <el-icon :size="12" class="text-gray-400"><ArrowDown /></el-icon>
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
    <main class="flex-1 flex items-center justify-center px-4">
      <router-view />
    </main>

    <!-- 页脚 -->
    <footer class="py-4 text-center text-sm text-gray-400 dark:text-gray-600">
      &copy; {{ new Date().getFullYear() }}
      {{ siteSettings.siteTitle || 'WikimoeGuild' }}
    </footer>
  </div>
</template>

<script setup>
import { onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useTheme } from '@/composables/useTheme.js'
import { useGameUser } from '@/composables/useGameUser.js'
import { useGameSiteSettings } from '@/composables/useGameSiteSettings.js'

const router = useRouter()
const { isDark, toggleTheme } = useTheme()
const { isLoggedIn, playerInfo, guildIconUrl, fetchPlayerInfo, logout } =
  useGameUser()
const { siteSettings, loadSiteSettings } = useGameSiteSettings()

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
  router.push('/game/home')
}
</script>

<style scoped></style>

<template>
  <div class="w-full py-6">
    <!-- 欢迎区域 -->
    <div class="text-center mb-8">
      <span class="text-6xl mb-4 block">🏰</span>
      <h2 class="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">
        欢迎来到 WikimoeGuild
      </h2>
      <p class="text-gray-500 dark:text-gray-400 mb-6 text-sm">
        一起开启冒险之旅吧
      </p>

      <!-- 未登录：显示登录/注册按钮 -->
      <div v-if="!isLoggedIn" class="flex gap-3 justify-center mb-6">
        <el-button type="primary" size="large" @click="handleNavLogin">
          🔑 登录
        </el-button>
        <el-button size="large" @click="handleNavRegister"> 📝 注册 </el-button>
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

    <!-- 玩家动态 -->
    <div>
      <h3
        class="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3 flex items-center gap-2"
      >
        <span>📢</span> 玩家动态
      </h3>
      <ActivityFeed />
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { useGameUser } from '@/composables/useGameUser.js'
import ActivityFeed from '@/components/ActivityFeed.vue'

const router = useRouter()
const { isLoggedIn, playerInfo } = useGameUser()

function handleNavLogin() {
  router.push({ name: 'GameLogin' })
}

function handleNavRegister() {
  router.push({ name: 'GameRegister' })
}

function handleNav(routeName) {
  router.push({ name: routeName })
}
</script>

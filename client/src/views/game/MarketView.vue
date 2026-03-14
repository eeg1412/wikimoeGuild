<template>
  <div class="w-full py-6" style="min-height: 60vh">
    <!-- 页面标题 -->
    <div class="mb-6 text-center">
      <h1 class="rpg-title text-2xl font-bold text-gray-800 dark:text-gray-100">
        🏪 交易市场
      </h1>
      <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
        官方市场 & 自由市场
      </p>
      <p class="text-sm text-yellow-500 font-semibold mt-1">
        🪙 {{ formatNumberWithCommas(playerInfo?.gold ?? 0) }} 金币
      </p>
    </div>

    <!-- 顶部标签页 -->
    <el-tabs v-model="activeTab" class="market-tabs mb-4">
      <el-tab-pane label="🏛️ 官方市场" name="official" />
      <el-tab-pane label="📦 素材交易" name="material" />
      <el-tab-pane label="💎 符文石交易" name="runeStone" />
    </el-tabs>

    <router-view />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useGameUser } from '@/composables/useGameUser.js'
import { formatNumberWithCommas } from 'shared/utils/utils.js'

const route = useRoute()
const router = useRouter()
const { isLoggedIn, playerInfo } = useGameUser()

if (!isLoggedIn.value) {
  router.replace({ name: 'GameLogin' })
}

const tabRouteMap = {
  official: 'GameMarketOfficial',
  material: 'GameMarketMaterial',
  runeStone: 'GameMarketRuneStone'
}

const activeTab = computed({
  get() {
    const name = String(route.name || '')
    if (name === 'GameMarketOfficial') return 'official'
    if (name.startsWith('GameMarketMaterial')) return 'material'
    if (name.startsWith('GameMarketRuneStone')) return 'runeStone'
    return 'official'
  },
  set(tab) {
    const targetRoute = tabRouteMap[tab]
    if (targetRoute) {
      router.push({ name: targetRoute })
    }
  }
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
.market-tabs :deep(.el-tabs__nav-wrap) {
  justify-content: center;
}
</style>

<template>
  <div class="w-full py-6" style="min-height: 60vh">
    <!-- 页面标题 -->
    <div class="mb-6 text-center">
      <h1 class="rpg-title text-2xl font-bold text-gray-800 dark:text-gray-100">
        🎒 背包
      </h1>
      <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
        管理你的水晶和符文石碎片
      </p>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="flex justify-center py-12">
      <span class="animate-spin inline-block text-4xl">⏳</span>
    </div>

    <template v-else>
      <!-- 水晶展示 -->
      <div class="grid grid-cols-2 gap-4 mb-6">
        <div
          v-for="cry in crystalList"
          :key="cry.key"
          class="rpg-card rounded-xl p-4 flex flex-col items-center"
        >
          <span class="text-3xl mb-2">{{ cry.icon }}</span>
          <span class="text-sm text-gray-500 dark:text-gray-400"
            >{{ cry.name }}水晶</span
          >
          <span
            class="text-2xl font-bold mt-1 tabular-nums"
            :style="{ color: cry.color }"
          >
            {{ formatNumberWithCommas(inventory[cry.key] || 0) }}
          </span>
          <div class="flex gap-2 mt-2 w-full">
            <el-button
              type="warning"
              size="small"
              class="flex-1"
              @click="openQuickSellDialog(cry.key)"
            >
              出售
            </el-button>
            <el-button
              type="primary"
              size="small"
              class="flex-1 ml-0!"
              @click="openQuickBuyDialog(cry.key)"
            >
              求购
            </el-button>
          </div>
        </div>
      </div>

      <!-- 符文石碎片 -->
      <div class="rpg-card rounded-xl p-5 flex flex-col items-center">
        <span class="text-3xl mb-2">💠</span>
        <span class="text-sm text-gray-500 dark:text-gray-400">符文石碎片</span>
        <span class="text-2xl font-bold text-purple-400 mt-1 tabular-nums">
          {{ formatNumberWithCommas(inventory.runeFragment || 0) }}
        </span>
        <p class="text-sm text-gray-400 mt-2">可用于升级符文石</p>
      </div>
    </template>

    <!-- ===== 快速出售水晶弹窗 ===== -->
    <CrystalQuickSellDialog
      v-model="quickSellVisible"
      :crystal-type="quickSellCrystalType"
      @sold="handleCrystalTraded"
    />

    <!-- ===== 快速求购水晶弹窗 ===== -->
    <CrystalQuickBuyDialog
      v-model="quickBuyVisible"
      :crystal-type="quickBuyCrystalType"
      @bought="handleCrystalTraded"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getMyInventoryApi } from '@/api/game/inventory.js'
import { useGameUser } from '@/composables/useGameUser.js'
import { formatNumberWithCommas } from 'shared/utils/utils.js'
import CrystalQuickSellDialog from '@/components/CrystalQuickSellDialog.vue'
import CrystalQuickBuyDialog from '@/components/CrystalQuickBuyDialog.vue'

const router = useRouter()
const { isLoggedIn } = useGameUser()

if (!isLoggedIn.value) {
  router.replace({ name: 'GameLogin' })
}

const loading = ref(false)
const inventory = ref({})

const crystalList = [
  { key: 'attackCrystal', name: '攻击', icon: '⚔️', color: '#e05c4f' },
  { key: 'defenseCrystal', name: '防御', icon: '🛡️', color: '#4fa3e0' },
  { key: 'speedCrystal', name: '速度', icon: '💨', color: '#6abf69' },
  { key: 'sanCrystal', name: 'SAN值', icon: '❤️', color: '#c070e0' }
]

async function fetchInventory() {
  loading.value = true
  try {
    const res = await getMyInventoryApi()
    inventory.value = res.data.data || {}
  } catch {
    // 加载失败时不重置 inventory，保留已有数据
  } finally {
    loading.value = false
  }
}

async function refreshInventoryData() {
  try {
    const res = await getMyInventoryApi()
    inventory.value = res.data.data || {}
  } catch {
    // ignore
  }
}

onMounted(fetchInventory)

// ── 快速出售/求购 ──
const quickSellVisible = ref(false)
const quickSellCrystalType = ref('attackCrystal')
const quickBuyVisible = ref(false)
const quickBuyCrystalType = ref('attackCrystal')

function openQuickSellDialog(crystalType) {
  quickSellCrystalType.value = crystalType
  quickSellVisible.value = true
}

function openQuickBuyDialog(crystalType) {
  quickBuyCrystalType.value = crystalType
  quickBuyVisible.value = true
}

async function handleCrystalTraded() {
  await refreshInventoryData()
}
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
  transition: transform 0.2s ease;
}
.dark .rpg-card {
  background: linear-gradient(
    135deg,
    rgba(40, 35, 30, 0.9) 0%,
    rgba(30, 24, 18, 0.8) 100%
  );
  border-color: rgba(200, 160, 80, 0.25);
}
.rpg-card:hover {
  transform: translateY(-2px);
}
</style>

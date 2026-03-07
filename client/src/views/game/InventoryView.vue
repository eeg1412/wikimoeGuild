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
            {{ (inventory[cry.key] || 0).toLocaleString() }}
          </span>
          <el-button
            type="warning"
            size="small"
            class="mt-2"
            @click="openQuickSellDialog(cry.key)"
          >
            出售
          </el-button>
        </div>
      </div>

      <!-- 符文石碎片 -->
      <div class="rpg-card rounded-xl p-5 flex flex-col items-center">
        <span class="text-3xl mb-2">💠</span>
        <span class="text-sm text-gray-500 dark:text-gray-400">符文石碎片</span>
        <span class="text-2xl font-bold text-purple-400 mt-1 tabular-nums">
          {{ (inventory.runeFragment || 0).toLocaleString() }}
        </span>
        <p class="text-sm text-gray-400 mt-2">可用于升级符文石</p>
      </div>
    </template>

    <!-- ===== 快速出售水晶弹窗 ===== -->
    <el-dialog
      v-model="quickSellVisible"
      :title="`快速出售 ${quickSellCrystalLabel}`"
      width="320px"
      align-center
      destroy-on-close
      v-bind="inventoryQuickSellLockProps"
      append-to-body
    >
      <div class="space-y-3">
        <p class="text-sm text-gray-500 dark:text-gray-400">
          当前持有:
          <span class="font-bold text-yellow-500">
            {{ inventory?.[quickSellCrystalType] ?? 0 }}
          </span>
        </p>
        <p class="text-xs text-gray-400">
          收购单价:
          <span class="text-yellow-500 font-semibold"
            >🪙 {{ gameSettings?.officialCrystalBuyPrice ?? 100 }}</span
          >
        </p>
        <div class="flex gap-2">
          <el-button
            size="small"
            :loading="quickSellLoading"
            :disabled="quickSellLoading"
            @click="handleQuickSell(10)"
          >
            出售 10 ({{
              (
                10 * (gameSettings?.officialCrystalBuyPrice ?? 100)
              ).toLocaleString()
            }}🪙)
          </el-button>
          <el-button
            size="small"
            :loading="quickSellLoading"
            :disabled="quickSellLoading"
            @click="handleQuickSell(100)"
          >
            出售 100 ({{
              (
                100 * (gameSettings?.officialCrystalBuyPrice ?? 100)
              ).toLocaleString()
            }}🪙)
          </el-button>
          <el-button
            size="small"
            :loading="quickSellLoading"
            :disabled="quickSellLoading"
            @click="handleQuickSell(1000)"
          >
            出售 1000 ({{
              (
                1000 * (gameSettings?.officialCrystalBuyPrice ?? 100)
              ).toLocaleString()
            }}🪙)
          </el-button>
        </div>
        <div class="flex items-center gap-2">
          <el-input-number
            v-model="quickSellCustomAmount"
            :min="1"
            :max="99999"
            size="small"
            class="flex-1"
          />
          <el-button
            type="primary"
            size="small"
            :loading="quickSellLoading"
            :disabled="quickSellLoading"
            @click="handleQuickSell(quickSellCustomAmount)"
          >
            出售
          </el-button>
        </div>
        <div class="text-sm text-gray-400">
          预计获得:
          <span class="text-yellow-500 font-semibold"
            >🪙
            {{
              (
                quickSellCustomAmount *
                (gameSettings?.officialCrystalBuyPrice ?? 100)
              ).toLocaleString()
            }}</span
          >
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getMyInventoryApi } from '@/api/game/inventory.js'
import { sellCrystalToOfficialApi } from '@/api/game/market.js'
import { getGameSettingsApi } from '@/api/game/config.js'
import { useGameUser } from '@/composables/useGameUser.js'
import { useDialogLock } from '@/composables/useDialogLock.js'

const router = useRouter()
const { isLoggedIn, fetchPlayerInfo } = useGameUser()

if (!isLoggedIn.value) {
  router.replace({ name: 'GameLogin' })
}

const loading = ref(false)
const inventory = ref({})
const gameSettings = ref({})

const crystalList = [
  { key: 'attackCrystal', name: '攻击', icon: '⚔️', color: '#e05c4f' },
  { key: 'defenseCrystal', name: '防御', icon: '🛡️', color: '#4fa3e0' },
  { key: 'speedCrystal', name: '速度', icon: '💨', color: '#6abf69' },
  { key: 'sanCrystal', name: 'SAN值', icon: '❤️', color: '#c070e0' }
]

async function fetchInventory() {
  loading.value = true
  try {
    const [invRes, settingsRes] = await Promise.all([
      getMyInventoryApi(),
      getGameSettingsApi()
    ])
    inventory.value = invRes.data.data || {}
    gameSettings.value = settingsRes.data.data || {}
  } catch {
    inventory.value = {}
  } finally {
    loading.value = false
  }
}

onMounted(fetchInventory)

// ── 快速出售水晶 ──
const quickSellVisible = ref(false)
const quickSellCrystalType = ref('attackCrystal')
const quickSellCustomAmount = ref(10)
const quickSellLoading = ref(false)
const { dialogLockProps: inventoryQuickSellLockProps } = useDialogLock(
  () => quickSellLoading.value
)

const quickSellCrystalLabel = computed(() => {
  return (
    crystalList.find(c => c.key === quickSellCrystalType.value)?.name +
      '水晶' || '水晶'
  )
})

function openQuickSellDialog(crystalType) {
  quickSellCrystalType.value = crystalType
  quickSellCustomAmount.value = 10
  quickSellVisible.value = true
}

async function handleQuickSell(amount) {
  if (!amount || amount <= 0) return
  quickSellLoading.value = true
  try {
    const res = await sellCrystalToOfficialApi({
      crystalType: quickSellCrystalType.value,
      quantity: amount
    })
    const { goldEarned } = res.data.data
    ElMessage.success(`出售成功，获得 ${goldEarned} 金币`)
    await Promise.all([fetchInventory(), fetchPlayerInfo()])
  } catch {
    // handled by interceptor
  } finally {
    quickSellLoading.value = false
  }
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

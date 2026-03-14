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
            {{ formatNumberWithCommas(inventory?.[quickSellCrystalType] ?? 0) }}
          </span>
        </p>
        <p class="text-xs text-gray-400">
          官方收购单价:
          <span class="text-yellow-500 font-semibold"
            >🪙
            {{
              formatNumberWithCommas(
                gameSettings?.officialCrystalBuyPrice ?? 100
              )
            }}</span
          >
        </p>
        <div
          v-if="quickSellPriceRange && quickSellPriceRange.hasOrders"
          class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-2 text-xs text-gray-500 dark:text-gray-400"
        >
          <p>
            📊 收购单价区间:
            <span class="text-yellow-500 font-semibold">
              🪙 {{ formatNumberWithCommas(quickSellPriceRange.minPrice)
              }}<template
                v-if="
                  quickSellPriceRange.maxPrice > quickSellPriceRange.minPrice
                "
              >
                ~
                {{
                  formatNumberWithCommas(quickSellPriceRange.maxPrice)
                }}</template
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
            :loading="quickSellLoading"
            :disabled="quickSellLoading"
            @click="handleQuickSell(10)"
          >
            出售 10
          </el-button>
          <el-button
            size="small"
            :loading="quickSellLoading"
            :disabled="quickSellLoading"
            @click="handleQuickSell(100)"
          >
            出售 100
          </el-button>
          <el-button
            size="small"
            :loading="quickSellLoading"
            :disabled="quickSellLoading"
            @click="handleQuickSell(1000)"
          >
            出售 1000
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
          预计获得<span class="text-xs">(按官方收购价计算)</span>:
          <span class="text-yellow-500 font-semibold"
            >🪙
            {{
              formatNumberWithCommas(
                quickSellCustomAmount *
                  (gameSettings?.officialCrystalBuyPrice ?? 100)
              )
            }}</span
          >
        </div>
      </div>
    </el-dialog>

    <!-- ===== 快速求购水晶弹窗 ===== -->
    <el-dialog
      v-model="quickBuyVisible"
      :title="`快速求购 ${quickBuyCrystalLabel}`"
      width="320px"
      align-center
      destroy-on-close
      v-bind="inventoryQuickBuyLockProps"
      append-to-body
    >
      <div class="space-y-3">
        <p class="text-sm text-gray-500 dark:text-gray-400">
          当前金币:
          <span class="font-bold text-yellow-500">
            🪙 {{ formatNumberWithCommas(playerGold) }}
          </span>
        </p>
        <div
          v-if="quickBuyPriceRange && quickBuyPriceRange.hasOrders"
          class="bg-green-50 dark:bg-green-900/20 rounded-lg p-2 text-xs text-gray-500 dark:text-gray-400"
        >
          <p>
            📊 当前市场求购价区间:
            <span class="text-yellow-500 font-semibold">
              🪙 {{ formatNumberWithCommas(quickBuyPriceRange.minPrice)
              }}<template
                v-if="quickBuyPriceRange.maxPrice > quickBuyPriceRange.minPrice"
              >
                ~
                {{
                  formatNumberWithCommas(quickBuyPriceRange.maxPrice)
                }}</template
              >
            </span>
          </p>
        </div>
        <div class="flex items-center gap-2">
          <span class="text-sm text-gray-500 shrink-0">单价:</span>
          <el-input-number
            v-model="quickBuyUnitPrice"
            :min="1"
            :max="2000000000"
            :step="100"
            size="small"
            class="flex-1"
          />
        </div>
        <div v-if="quickBuyQuickPrices.length > 0" class="flex gap-1 flex-wrap">
          <el-button
            v-for="price in quickBuyQuickPrices"
            :key="price.value"
            size="small"
            @click="setQuickBuyPrice(price.value)"
          >
            {{ price.label }}
          </el-button>
        </div>
        <div class="flex items-center gap-2">
          <span class="text-sm text-gray-500 shrink-0">数量:</span>
          <el-input-number
            v-model="quickBuyQuantity"
            :min="1"
            :max="99999"
            size="small"
            class="flex-1"
          />
        </div>
        <div class="flex gap-1">
          <el-button size="small" @click="setQuickBuyQuantity(10)">
            10
          </el-button>
          <el-button size="small" @click="setQuickBuyQuantity(100)">
            100
          </el-button>
          <el-button size="small" @click="setQuickBuyQuantity(1000)">
            1000
          </el-button>
        </div>
        <div class="text-sm text-gray-400">
          需冻结金币:
          <span class="text-yellow-500 font-semibold">
            🪙
            {{
              quickBuyUnitPrice
                ? formatNumberWithCommas(quickBuyQuantity * quickBuyUnitPrice)
                : '--'
            }}
          </span>
        </div>
        <el-button
          type="warning"
          class="w-full"
          size="small"
          :loading="quickBuyLoading"
          :disabled="quickBuyLoading || !quickBuyUnitPrice"
          @click="handleQuickBuy"
        >
          发布求购
        </el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getMyInventoryApi } from '@/api/game/inventory.js'
import {
  sellCrystalToOfficialApi,
  smartSellCrystalApi,
  getCrystalBuyPriceRangeApi,
  createMaterialBuyOrderApi
} from '@/api/game/market.js'
import { getGameSettingsApi } from '@/api/game/config.js'
import { useGameUser } from '@/composables/useGameUser.js'
import { useDialogLock } from '@/composables/useDialogLock.js'
import { formatNumberWithCommas } from 'shared/utils/utils.js'

const router = useRouter()
const { isLoggedIn, playerInfo, fetchPlayerInfo } = useGameUser()

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
const quickSellPriceRange = ref(null)
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
  quickSellPriceRange.value = null
  getCrystalBuyPriceRangeApi()
    .then(res => {
      const responseData = res.data.data || {}
      const ranges = responseData.priceMap || {}
      quickSellPriceRange.value = ranges[crystalType] || null
    })
    .catch(() => {})
  quickSellVisible.value = true
}

async function handleQuickSell(amount) {
  if (!amount || amount <= 0) return
  quickSellLoading.value = true
  try {
    const res = await smartSellCrystalApi({
      crystalType: quickSellCrystalType.value,
      quantity: amount
    })
    const data = res.data.data
    let msg = `出售成功，获得 ${data.goldEarned} 金币`
    if (data.soldToBuyers > 0) {
      msg += `（市场求购 ${data.soldToBuyers} 个 +${data.goldFromBuyers}🪙, 官方 ${data.soldToOfficial} 个 +${data.goldFromOfficial}🪙）`
    }
    ElMessage.success({ message: msg, showClose: true })
    await Promise.all([fetchInventory(), fetchPlayerInfo()])
  } catch {
    // handled by interceptor
  } finally {
    quickSellLoading.value = false
  }
}

// ── 快速求购水晶 ──
const quickBuyVisible = ref(false)
const quickBuyCrystalType = ref('attackCrystal')
const quickBuyUnitPrice = ref(null)
const quickBuyQuantity = ref(10)
const quickBuyLoading = ref(false)
const quickBuyPriceRange = ref(null)
const { dialogLockProps: inventoryQuickBuyLockProps } = useDialogLock(
  () => quickBuyLoading.value
)

const quickBuyCrystalLabel = computed(() => {
  return (
    crystalList.find(c => c.key === quickBuyCrystalType.value)?.name + '水晶' ||
    '水晶'
  )
})

const playerGold = computed(() => playerInfo.value?.gold ?? 0)

function setQuickBuyPrice(price) {
  quickBuyUnitPrice.value = price
}

const quickBuyQuickPrices = computed(() => {
  const range = quickBuyPriceRange.value
  const officialPrice = gameSettings.value?.officialCrystalBuyPrice ?? 100
  if (!range || !range.hasOrders) {
    const fallback = officialPrice + 10
    return [{ value: fallback, label: formatNumberWithCommas(fallback) }]
  }
  const min = range.minPrice
  const max = range.maxPrice
  const mid = Math.floor((min + max) / 2)
  const prices = [...new Set([min, mid, max])]
  return prices.map(p => ({ value: p, label: formatNumberWithCommas(p) }))
})

function setQuickBuyQuantity(qty) {
  quickBuyQuantity.value = qty
}

async function openQuickBuyDialog(crystalType) {
  quickBuyCrystalType.value = crystalType
  quickBuyUnitPrice.value = null
  quickBuyQuantity.value = 10
  quickBuyPriceRange.value = null
  try {
    const res = await getCrystalBuyPriceRangeApi()
    const responseData = res.data.data || {}
    const ranges = responseData.priceMap || {}
    quickBuyPriceRange.value = ranges[crystalType] || null
    // 如果没有市场求购单，默认单价为官方收购价+10
    const range = quickBuyPriceRange.value
    if (!range || !range.hasOrders) {
      const officialPrice =
        gameSettings.value?.officialCrystalBuyPrice ??
        responseData.officialBuyPrice ??
        100
      quickBuyUnitPrice.value = officialPrice + 10
    }
  } catch {
    // ignore
  }
  quickBuyVisible.value = true
}

async function handleQuickBuy() {
  if (!quickBuyUnitPrice.value || quickBuyUnitPrice.value <= 0) return
  quickBuyLoading.value = true
  try {
    await createMaterialBuyOrderApi({
      materialType: quickBuyCrystalType.value,
      quantity: quickBuyQuantity.value,
      unitPrice: quickBuyUnitPrice.value
    })
    ElMessage.success({ message: '求购订单发布成功！', showClose: true })
    quickBuyVisible.value = false
    await Promise.all([fetchInventory(), fetchPlayerInfo()])
  } catch {
    // handled by interceptor
  } finally {
    quickBuyLoading.value = false
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

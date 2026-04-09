<template>
  <el-dialog
    v-model="dialogVisible"
    :title="`快速求购 ${displayLabel}`"
    width="320px"
    align-center
    destroy-on-close
    v-bind="lockProps"
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
        v-if="priceRange && priceRange.hasOrders"
        class="bg-green-50 dark:bg-green-900/20 rounded-lg p-2 text-xs text-gray-500 dark:text-gray-400"
      >
        <p>
          📊 当前市场求购价区间:
          <span class="text-yellow-500 font-semibold">
            🪙
            {{ formatNumberWithCommas(priceRange.minPrice)
            }}<template v-if="priceRange.maxPrice > priceRange.minPrice">
              ~ {{ formatNumberWithCommas(priceRange.maxPrice) }}</template
            >
          </span>
        </p>
      </div>
      <div class="flex items-center gap-2">
        <span class="text-sm text-gray-500 shrink-0">单价:</span>
        <el-input-number
          v-model="unitPrice"
          :min="1"
          :max="2000000000"
          :step="100"
          size="small"
          class="flex-1"
        />
      </div>
      <div v-if="quickPrices.length > 0" class="flex gap-1 flex-wrap">
        <el-button
          v-for="price in quickPrices"
          :key="price.value"
          size="small"
          @click="setPrice(price.value)"
        >
          {{ price.label }}
        </el-button>
      </div>
      <div class="flex items-center gap-2">
        <span class="text-sm text-gray-500 shrink-0">数量:</span>
        <el-input-number
          v-model="quantity"
          :min="1"
          :max="99999"
          size="small"
          class="flex-1"
        />
      </div>
      <div class="flex gap-1">
        <el-button size="small" @click="setQuantity(10)">10</el-button>
        <el-button size="small" @click="setQuantity(100)">100</el-button>
        <el-button size="small" @click="setQuantity(1000)">1000</el-button>
      </div>
      <div class="text-sm text-gray-400">
        需冻结金币:
        <span class="text-yellow-500 font-semibold">
          🪙
          {{ unitPrice ? formatNumberWithCommas(quantity * unitPrice) : '--' }}
        </span>
      </div>
      <el-button
        type="warning"
        class="w-full"
        size="small"
        :loading="buyLoading"
        :disabled="buyLoading || !unitPrice"
        @click="handleBuy"
      >
        发布求购
      </el-button>
    </div>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { getGameSettingsApi } from '@/api/game/config.js'
import {
  getCrystalBuyPriceRangeApi,
  createMaterialBuyOrderApi
} from '@/api/game/market.js'
import { useGameUser } from '@/composables/useGameUser.js'
import { useDialogLock } from '@/composables/useDialogLock.js'
import { formatNumberWithCommas } from 'shared/utils/utils.js'

const CRYSTAL_LABEL_MAP = {
  attackCrystal: '攻击水晶',
  defenseCrystal: '防御水晶',
  speedCrystal: '速度水晶',
  sanCrystal: 'SAN水晶'
}

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  crystalType: { type: String, default: 'attackCrystal' }
})

const emit = defineEmits(['update:modelValue', 'bought'])

const { fetchPlayerInfo, playerInfo } = useGameUser()

const dialogVisible = computed({
  get: () => props.modelValue,
  set: val => emit('update:modelValue', val)
})

const displayLabel = computed(
  () => CRYSTAL_LABEL_MAP[props.crystalType] || '水晶'
)

// ── 组件自管理的数据 ──
const gameSettings = ref({})
const priceRange = ref(null)
const unitPrice = ref(null)
const quantity = ref(10)
const buyLoading = ref(false)

const { dialogLockProps: lockProps } = useDialogLock(() => buyLoading.value)

const playerGold = computed(() => playerInfo.value?.gold ?? 0)

const quickPrices = computed(() => {
  const range = priceRange.value
  const officialBuyPrice = gameSettings.value?.officialCrystalBuyPrice ?? 100
  if (!range || !range.hasOrders) {
    const fallback = officialBuyPrice + 10
    return [{ value: fallback, label: formatNumberWithCommas(fallback) }]
  }
  const min = range.minPrice
  const max = range.maxPrice
  const mid = Math.floor((min + max) / 2)
  const prices = [...new Set([min, mid, max])]
  return prices.map(p => ({ value: p, label: formatNumberWithCommas(p) }))
})

function setPrice(price) {
  unitPrice.value = price
}

function setQuantity(qty) {
  quantity.value = qty
}

// ── 弹窗打开时独立加载数据 ──
watch(
  () => props.modelValue,
  async val => {
    if (val) {
      unitPrice.value = null
      quantity.value = 10
      priceRange.value = null
      try {
        const [settingsRes, priceRes] = await Promise.all([
          getGameSettingsApi(),
          getCrystalBuyPriceRangeApi()
        ])
        gameSettings.value = settingsRes.data.data || {}
        const responseData = priceRes.data.data || {}
        const ranges = responseData.priceMap || {}
        priceRange.value = ranges[props.crystalType] || null
        // 如果没有市场求购单，默认单价为官方收购价+10
        const range = priceRange.value
        if (!range || !range.hasOrders) {
          const officialBuyPrice =
            gameSettings.value?.officialCrystalBuyPrice ??
            responseData.officialBuyPrice ??
            100
          unitPrice.value = officialBuyPrice + 10
        }
      } catch {
        // 加载失败时保留已有数据，不重置
      }
    }
  }
)

// ── 求购 ──
async function handleBuy() {
  if (!unitPrice.value || unitPrice.value <= 0) return
  buyLoading.value = true
  try {
    await createMaterialBuyOrderApi({
      materialType: props.crystalType,
      quantity: quantity.value,
      unitPrice: unitPrice.value
    })
    ElMessage.success({ message: '求购订单发布成功！', showClose: true })
    dialogVisible.value = false
    await fetchPlayerInfo()
    emit('bought')
  } catch {
    // handled by interceptor
  } finally {
    buyLoading.value = false
  }
}
</script>

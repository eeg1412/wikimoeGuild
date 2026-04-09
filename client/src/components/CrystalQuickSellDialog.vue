<template>
  <el-dialog
    v-model="dialogVisible"
    :title="`快速出售 ${displayLabel}`"
    width="320px"
    align-center
    destroy-on-close
    v-bind="lockProps"
    append-to-body
  >
    <div class="space-y-3">
      <p class="text-sm text-gray-500 dark:text-gray-400">
        当前持有:
        <span class="font-bold text-yellow-500">
          {{ formatNumberWithCommas(currentHolding) }}
        </span>
      </p>
      <p class="text-xs text-gray-400">
        官方收购单价:
        <span class="text-yellow-500 font-semibold"
          >🪙 {{ formatNumberWithCommas(officialPrice) }}</span
        >
      </p>
      <div
        v-if="priceRange && priceRange.hasOrders"
        class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-2 text-xs text-gray-500 dark:text-gray-400"
      >
        <p>
          📊 收购单价区间:
          <span class="text-yellow-500 font-semibold">
            🪙
            {{ formatNumberWithCommas(priceRange.minPrice)
            }}<template v-if="priceRange.maxPrice > priceRange.minPrice">
              ~ {{ formatNumberWithCommas(priceRange.maxPrice) }}</template
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
          :loading="sellLoading"
          :disabled="sellLoading"
          @click="handleSell(10)"
        >
          出售 10
        </el-button>
        <el-button
          size="small"
          :loading="sellLoading"
          :disabled="sellLoading"
          @click="handleSell(100)"
        >
          出售 100
        </el-button>
        <el-button
          size="small"
          :loading="sellLoading"
          :disabled="sellLoading"
          @click="handleSell(1000)"
        >
          出售 1000
        </el-button>
      </div>
      <div class="flex items-center gap-2">
        <el-input-number
          v-model="customAmount"
          :min="1"
          :max="99999"
          size="small"
          class="flex-1"
        />
        <el-button
          type="primary"
          size="small"
          :loading="sellLoading"
          :disabled="sellLoading"
          @click="handleSell(customAmount)"
        >
          出售
        </el-button>
      </div>
      <div class="text-sm text-gray-400">
        预计获得<span class="text-xs">(按官方收购价计算)</span>:
        <span class="text-yellow-500 font-semibold"
          >🪙 {{ formatNumberWithCommas(customAmount * officialPrice) }}</span
        >
      </div>
    </div>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { getMyInventoryApi } from '@/api/game/inventory.js'
import { getGameSettingsApi } from '@/api/game/config.js'
import {
  smartSellCrystalApi,
  getCrystalBuyPriceRangeApi
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

const emit = defineEmits(['update:modelValue', 'sold'])

const { fetchPlayerInfo } = useGameUser()

const dialogVisible = computed({
  get: () => props.modelValue,
  set: val => emit('update:modelValue', val)
})

const displayLabel = computed(
  () => CRYSTAL_LABEL_MAP[props.crystalType] || '水晶'
)

// ── 组件自管理的数据（不依赖外部 ref，避免被外部事件重置） ──
const inventory = ref(null)
const gameSettings = ref({})
const priceRange = ref(null)
const customAmount = ref(10)
const sellLoading = ref(false)

const { dialogLockProps: lockProps } = useDialogLock(() => sellLoading.value)

const currentHolding = computed(() => inventory.value?.[props.crystalType] ?? 0)

const officialPrice = computed(
  () => gameSettings.value?.officialCrystalBuyPrice ?? 100
)

// ── 弹窗打开时独立加载数据 ──
watch(
  () => props.modelValue,
  async val => {
    if (val) {
      customAmount.value = 10
      priceRange.value = null
      try {
        const [invRes, settingsRes, priceRes] = await Promise.all([
          getMyInventoryApi(),
          getGameSettingsApi(),
          getCrystalBuyPriceRangeApi()
        ])
        inventory.value = invRes.data.data || null
        gameSettings.value = settingsRes.data.data || {}
        const responseData = priceRes.data.data || {}
        const ranges = responseData.priceMap || {}
        priceRange.value = ranges[props.crystalType] || null
      } catch {
        // 加载失败时保留已有数据，不重置
      }
    }
  }
)

// ── 出售 ──
async function handleSell(amount) {
  if (!amount || amount <= 0) return
  sellLoading.value = true
  try {
    const res = await smartSellCrystalApi({
      crystalType: props.crystalType,
      quantity: amount
    })
    const data = res.data.data
    let msg = `出售成功，获得 ${formatNumberWithCommas(data.goldEarned)} 金币`
    if (data.soldToBuyers > 0) {
      msg += `（市场求购 ${formatNumberWithCommas(data.soldToBuyers)} 个 +${formatNumberWithCommas(data.goldFromBuyers)}🪙, 官方 ${formatNumberWithCommas(data.soldToOfficial)} 个 +${formatNumberWithCommas(data.goldFromOfficial)}🪙）`
    }
    ElMessage.success({ message: msg, showClose: true })
    // 独立刷新自己的数据，不依赖外部 ref
    const [invRes] = await Promise.all([getMyInventoryApi(), fetchPlayerInfo()])
    inventory.value = invRes.data.data || null
    emit('sold')
  } catch {
    // handled by interceptor
  } finally {
    sellLoading.value = false
  }
}
</script>

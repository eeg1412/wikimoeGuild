<template>
  <div>
    <div class="rpg-card rounded-xl p-4 mb-4">
      <div class="flex items-center justify-between mb-3">
        <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-200">
          📝 上架符文石
        </h3>
        <el-button
          type="primary"
          text
          size="small"
          :loading="unlistedLoading"
          @click="loadUnlistedRuneStones"
        >
          刷新列表
        </el-button>
      </div>

      <!-- 官方收购价参考 -->
      <div
        v-if="officialPrices"
        class="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3 mb-3"
      >
        <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">
          ⚠️ 低于官方收购价的符文石将被官方立即收购
        </p>
        <div class="flex flex-wrap gap-2 text-xs">
          <span class="text-gray-600 dark:text-gray-300"
            >普通: 🪙 {{ officialPrices.normal }}</span
          >
          <span class="text-blue-500">稀有: 🪙 {{ officialPrices.rare }}</span>
          <span class="text-yellow-500"
            >传说: 🪙 {{ officialPrices.legendary }}</span
          >
        </div>
      </div>

      <!-- 可展开列表 -->
      <RuneStoneMarketList
        :items="filteredUnlistedRuneStones"
        :loading="unlistedLoading"
        mode="direct"
        empty-text="暂无可上架的符文石（需未装备且未上架）"
      >
        <template #expanded="{ item }">
          <!-- 价格输入 & 上架按钮 -->
          <div class="flex items-center gap-2 mt-3">
            <el-input-number
              v-model="listPriceMap[item._id]"
              :min="1"
              :max="2000000000"
              :step="100"
              size="small"
              class="flex-1"
              placeholder="设置价格"
              controls-position="right"
            />
            <el-button
              type="primary"
              size="small"
              :loading="createListingLoading === item._id"
              :disabled="!!createListingLoading"
              @click="handleCreateListing(item)"
            >
              上架出售
            </el-button>
          </div>
        </template>
      </RuneStoneMarketList>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, inject, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  getOfficialMarketInfoApi,
  createRuneStoneListingApi
} from '@/api/game/market.js'
import { getMyRuneStonesApi } from '@/api/game/runeStone.js'
import { useGameUser } from '@/composables/useGameUser.js'
import RuneStoneMarketList from '@/components/RuneStoneMarketList.vue'
import { rarityName } from '@/composables/useMarketUtils.js'

const { fetchPlayerInfo } = useGameUser()
const rarityFilter = inject('runeStoneRarityFilter')

// 未上架列表
const unlistedRuneStones = ref([])
const unlistedLoading = ref(false)
const listPriceMap = reactive({})
const createListingLoading = ref(null)

// 官方收购价参考
const officialPrices = ref(null)

const filteredUnlistedRuneStones = computed(() => {
  if (!rarityFilter.value) return unlistedRuneStones.value
  return unlistedRuneStones.value.filter(rs => rs.rarity === rarityFilter.value)
})

async function loadUnlistedRuneStones() {
  unlistedLoading.value = true
  try {
    const res = await getMyRuneStonesApi({ pageSize: 999 })
    // 只显示未装备且未上架的
    unlistedRuneStones.value = (res.data.data?.list || []).filter(
      rs => !rs.equippedBy && !rs.listedOnMarket
    )
  } catch {
  } finally {
    unlistedLoading.value = false
  }
}

async function loadOfficialPrices() {
  try {
    const res = await getOfficialMarketInfoApi()
    officialPrices.value = res.data.data?.runeStoneOfficialPrices || null
  } catch {}
}

async function handleCreateListing(rs) {
  const price = listPriceMap[rs._id]
  if (!price || price <= 0) {
    ElMessage.warning('请设置价格')
    return
  }

  // 检查是否低于官方收购价
  const officialPrice = officialPrices.value?.[rs.rarity]
  if (officialPrice && price <= officialPrice) {
    try {
      await ElMessageBox.confirm(
        `你设置的价格 ${price.toLocaleString()} 金币低于或等于官方收购价 ${officialPrice.toLocaleString()} 金币，该符文石将被官方立即收购，你将获得 ${officialPrice.toLocaleString()} 金币。是否继续？`,
        '⚠️ 官方收购提示',
        {
          confirmButtonText: '确认出售给官方',
          cancelButtonText: '取消',
          type: 'warning'
        }
      )
    } catch {
      return
    }
  } else {
    try {
      await ElMessageBox.confirm(
        `确定以 ${price.toLocaleString()} 金币的价格上架该 ${rarityName(rs.rarity)} Lv.${rs.level} 符文石？`,
        '确认上架',
        { confirmButtonText: '确认上架', cancelButtonText: '取消' }
      )
    } catch {
      return
    }
  }

  createListingLoading.value = rs._id
  try {
    const res = await createRuneStoneListingApi({
      runeStoneId: rs._id,
      price
    })
    const result = res.data.data
    if (result?.officialPurchased) {
      await ElMessageBox.alert(
        `你的 ${rarityName(rs.rarity)} Lv.${rs.level} 符文石已被官方市场以 ${result.goldEarned.toLocaleString()} 金币收购！`,
        '🏛️ 官方收购完成',
        { confirmButtonText: '确定', type: 'success' }
      )
      await fetchPlayerInfo()
    } else {
      ElMessage.success('符文石已上架！')
    }
    delete listPriceMap[rs._id]
    await loadUnlistedRuneStones()
  } catch {
  } finally {
    createListingLoading.value = null
  }
}

onMounted(() => {
  loadUnlistedRuneStones()
  loadOfficialPrices()
})
</script>

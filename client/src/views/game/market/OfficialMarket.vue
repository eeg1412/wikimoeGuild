<template>
  <div>
    <div v-if="officialLoading" class="flex justify-center py-12">
      <span class="animate-spin inline-block text-4xl">⏳</span>
    </div>
    <template v-else>
      <!-- 收购价格 / 出售价格 -->
      <div class="rpg-card rounded-xl p-4 mb-4">
        <div class="flex items-center justify-between mb-3">
          <span class="text-sm font-semibold text-gray-700 dark:text-gray-200"
            >💰 官方市场报价</span
          >
        </div>
        <div class="grid grid-cols-2 gap-3 text-sm">
          <div
            class="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 text-center"
          >
            <p class="text-sm text-gray-400 mb-1">收购单价</p>
            <p class="text-lg font-bold text-green-500">
              🪙 {{ officialInfo.buyPrice }}
            </p>
            <p class="text-xs text-gray-400">官方从你手中收购</p>
          </div>
          <div
            class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 text-center"
          >
            <p class="text-sm text-gray-400 mb-1">出售单价</p>
            <p class="text-lg font-bold text-blue-500">
              🪙 {{ officialInfo.sellPrice }}
            </p>
            <p class="text-xs text-gray-400">从官方购买</p>
          </div>
        </div>
      </div>

      <!-- 卖给官方 -->
      <div class="rpg-card rounded-xl p-4 mb-4">
        <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">
          📤 出售水晶给官方
        </h3>
        <!-- 玩家水晶持有量 -->
        <div class="grid grid-cols-2 gap-2 mb-3">
          <div
            v-for="c in crystalList"
            :key="'own-' + c.key"
            class="flex items-center gap-1.5 bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2 text-sm"
          >
            <span>{{ c.icon }}</span>
            <span class="text-gray-600 dark:text-gray-300">{{ c.name }}</span>
            <span class="ml-auto font-mono" :style="{ color: c.color }">{{
              playerInventory[c.key] ?? 0
            }}</span>
          </div>
        </div>
        <div class="flex items-center gap-2 mb-3">
          <el-select
            v-model="sellCrystalType"
            class="flex-1"
            placeholder="选择水晶类型"
            size="small"
          >
            <el-option
              v-for="c in crystalList"
              :key="c.key"
              :label="`${c.icon} ${c.name}水晶`"
              :value="c.key"
            />
          </el-select>
          <el-input-number
            v-model="sellCrystalQty"
            :min="1"
            :max="99999"
            size="small"
            class="w-28!"
          />
        </div>
        <div class="flex gap-2 mb-3">
          <el-button
            size="small"
            :loading="sellOfficialLoading"
            :disabled="sellOfficialLoading"
            @click="handleQuickSellToOfficial(10)"
            >快速 10</el-button
          >
          <el-button
            size="small"
            :loading="sellOfficialLoading"
            :disabled="sellOfficialLoading"
            @click="handleQuickSellToOfficial(100)"
            >快速 100</el-button
          >
          <el-button
            size="small"
            :loading="sellOfficialLoading"
            :disabled="sellOfficialLoading"
            @click="handleQuickSellToOfficial(1000)"
            >快速 1000</el-button
          >
        </div>
        <div class="text-sm text-gray-400 mb-2">
          预计获得:
          <span class="text-yellow-500 font-semibold"
            >🪙
            {{
              (sellCrystalQty * officialInfo.buyPrice).toLocaleString()
            }}</span
          >
        </div>
        <el-button
          type="success"
          class="w-full"
          size="small"
          :loading="sellOfficialLoading"
          :disabled="sellOfficialLoading"
          @click="handleSellToOfficial"
        >
          确认出售
        </el-button>
      </div>

      <!-- 从官方购买 -->
      <div class="rpg-card rounded-xl p-4 mb-4">
        <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">
          📥 从官方购买水晶
        </h3>
        <!-- 库存展示 -->
        <div class="grid grid-cols-2 gap-2 mb-3">
          <div
            v-for="c in crystalList"
            :key="c.key"
            class="flex items-center gap-1.5 bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2 text-sm"
          >
            <span>{{ c.icon }}</span>
            <span class="text-gray-600 dark:text-gray-300">{{ c.name }}</span>
            <span class="ml-auto font-mono" :style="{ color: c.color }">{{
              officialInfo.stock?.[c.key] ?? 0
            }}</span>
          </div>
        </div>
        <div class="flex items-center gap-2 mb-3">
          <el-select
            v-model="buyCrystalType"
            class="flex-1"
            placeholder="选择水晶类型"
            size="small"
          >
            <el-option
              v-for="c in crystalList"
              :key="c.key"
              :label="`${c.icon} ${c.name}水晶`"
              :value="c.key"
            />
          </el-select>
          <el-input-number
            v-model="buyCrystalQty"
            :min="1"
            :max="99999"
            size="small"
            class="w-28!"
          />
        </div>
        <div class="text-sm text-gray-400 mb-2">
          需要花费:
          <span class="text-yellow-500 font-semibold"
            >🪙
            {{
              (buyCrystalQty * officialInfo.sellPrice).toLocaleString()
            }}</span
          >
        </div>
        <el-button
          type="primary"
          class="w-full"
          size="small"
          :loading="buyOfficialLoading"
          :disabled="buyOfficialLoading"
          @click="handleBuyFromOfficial"
        >
          确认购买
        </el-button>
      </div>

      <!-- 出售符文石碎片给官方 -->
      <div class="rpg-card rounded-xl p-4 mb-4">
        <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">
          🔮 出售符文石碎片给官方
        </h3>
        <div
          class="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 mb-3 text-center"
        >
          <p class="text-sm text-gray-400 mb-1">收购单价</p>
          <p class="text-lg font-bold text-green-500">
            🪙 {{ officialInfo.runeFragmentBuyPrice ?? 0 }}
          </p>
        </div>
        <div
          class="flex items-center gap-1.5 bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2 text-sm mb-3"
        >
          <span>🔮</span>
          <span class="text-gray-600 dark:text-gray-300">符文石碎片</span>
          <span class="ml-auto font-mono text-purple-500">{{
            playerInventory.runeFragment ?? 0
          }}</span>
        </div>
        <div class="flex items-center gap-2 mb-3">
          <el-input-number
            v-model="sellFragmentQty"
            :min="1"
            :max="99999"
            size="small"
            class="flex-1"
          />
        </div>
        <div class="flex gap-2 mb-3">
          <el-button
            size="small"
            :loading="sellFragmentLoading"
            :disabled="sellFragmentLoading"
            @click="handleQuickSellFragment(10)"
            >快速 10</el-button
          >
          <el-button
            size="small"
            :loading="sellFragmentLoading"
            :disabled="sellFragmentLoading"
            @click="handleQuickSellFragment(100)"
            >快速 100</el-button
          >
          <el-button
            size="small"
            :loading="sellFragmentLoading"
            :disabled="sellFragmentLoading"
            @click="handleQuickSellFragment(1000)"
            >快速 1000</el-button
          >
        </div>
        <div class="text-sm text-gray-400 mb-2">
          预计获得:
          <span class="text-yellow-500 font-semibold"
            >🪙
            {{
              (
                sellFragmentQty * (officialInfo.runeFragmentBuyPrice ?? 0)
              ).toLocaleString()
            }}</span
          >
        </div>
        <el-button
          type="success"
          class="w-full"
          size="small"
          :loading="sellFragmentLoading"
          :disabled="sellFragmentLoading"
          @click="handleSellFragmentToOfficial"
        >
          确认出售
        </el-button>
      </div>

      <!-- 出售符文石给官方 -->
      <div class="rpg-card rounded-xl p-4 mb-4">
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-200">
            💎 出售符文石给官方
          </h3>
          <el-button
            type="primary"
            text
            size="small"
            :loading="officialRsLoading"
            @click="loadOfficialRuneStones"
          >
            刷新列表
          </el-button>
        </div>

        <!-- 官方收购价 -->
        <div
          v-if="officialInfo.runeStoneOfficialPrices"
          class="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3 mb-3"
        >
          <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">
            💰 官方符文石收购报价
          </p>
          <div class="flex flex-wrap gap-2 text-xs">
            <span class="text-gray-600 dark:text-gray-300"
              >普通: 🪙 {{ officialInfo.runeStoneOfficialPrices.normal }}</span
            >
            <span class="text-blue-500"
              >稀有: 🪙 {{ officialInfo.runeStoneOfficialPrices.rare }}</span
            >
            <span class="text-yellow-500"
              >传说: 🪙
              {{ officialInfo.runeStoneOfficialPrices.legendary }}</span
            >
          </div>
        </div>

        <!-- 稀有度筛选 -->
        <div class="flex items-center gap-2 mb-3">
          <el-select
            v-model="officialRsRarityFilter"
            size="small"
            placeholder="稀有度筛选"
            clearable
            style="width: 120px"
          >
            <el-option label="普通" value="normal" />
            <el-option label="稀有" value="rare" />
            <el-option label="传说" value="legendary" />
          </el-select>
        </div>

        <!-- 使用可展开列表组件 -->
        <RuneStoneMarketList
          :items="filteredOfficialRuneStones"
          :loading="officialRsLoading"
          mode="direct"
          empty-text="暂无可出售的符文石（需未装备且未上架）"
        >
          <template #extra="{ runeStone }">
            <div class="text-right mr-1">
              <p class="text-xs text-gray-400">收购价</p>
              <p
                class="text-sm text-yellow-500 font-semibold whitespace-nowrap"
              >
                🪙
                {{
                  officialInfo.runeStoneOfficialPrices?.[
                    runeStone?.rarity
                  ]?.toLocaleString()
                }}
              </p>
            </div>
          </template>
          <template #expanded="{ runeStone, item }">
            <div class="mt-3">
              <el-button
                type="success"
                class="w-full"
                size="small"
                :loading="sellRsOfficialLoading === item._id"
                :disabled="!!sellRsOfficialLoading"
                @click="handleSellRuneStoneToOfficial(item)"
              >
                出售给官方
              </el-button>
            </div>
          </template>
        </RuneStoneMarketList>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  getOfficialMarketInfoApi,
  sellCrystalToOfficialApi,
  buyCrystalFromOfficialApi,
  sellRuneStoneToOfficialApi,
  sellRuneFragmentToOfficialApi
} from '@/api/game/market.js'
import { getMyRuneStonesApi } from '@/api/game/runeStone.js'
import { getMyInventoryApi } from '@/api/game/inventory.js'
import { useGameUser } from '@/composables/useGameUser.js'
import RuneStoneMarketList from '@/components/RuneStoneMarketList.vue'
import {
  crystalList,
  getMaterialName,
  rarityName
} from '@/composables/useMarketUtils.js'

const { fetchPlayerInfo } = useGameUser()

// ===== 官方市场 =====
const officialLoading = ref(false)
const officialInfo = ref({ buyPrice: 0, sellPrice: 0, stock: {} })

const sellCrystalType = ref('attackCrystal')
const sellCrystalQty = ref(1)
const sellOfficialLoading = ref(false)

const buyCrystalType = ref('attackCrystal')
const buyCrystalQty = ref(1)
const buyOfficialLoading = ref(false)

// 玩家水晶库存
const playerInventory = ref({})

async function fetchPlayerInventory() {
  try {
    const res = await getMyInventoryApi()
    playerInventory.value = res.data.data || {}
  } catch {}
}

async function fetchOfficialInfo() {
  officialLoading.value = true
  try {
    const res = await getOfficialMarketInfoApi()
    officialInfo.value = res.data.data || {}
  } catch {
  } finally {
    officialLoading.value = false
  }
}

async function handleSellToOfficial() {
  try {
    await ElMessageBox.confirm(
      `确定出售 ${sellCrystalQty.value} 个${getMaterialName(sellCrystalType.value)}？预计获得 ${(sellCrystalQty.value * officialInfo.value.buyPrice).toLocaleString()} 金币`,
      '确认出售',
      { confirmButtonText: '出售', cancelButtonText: '取消' }
    )
  } catch {
    return
  }

  sellOfficialLoading.value = true
  try {
    await sellCrystalToOfficialApi({
      crystalType: sellCrystalType.value,
      quantity: sellCrystalQty.value
    })
    ElMessage.success('出售成功！')
    await fetchOfficialInfo()
    await fetchPlayerInfo()
    await fetchPlayerInventory()
  } catch {
  } finally {
    sellOfficialLoading.value = false
  }
}

async function handleQuickSellToOfficial(qty) {
  sellOfficialLoading.value = true
  try {
    await sellCrystalToOfficialApi({
      crystalType: sellCrystalType.value,
      quantity: qty
    })
    ElMessage.success('出售成功！')
    await fetchOfficialInfo()
    await fetchPlayerInfo()
    await fetchPlayerInventory()
  } catch {
  } finally {
    sellOfficialLoading.value = false
  }
}

async function handleBuyFromOfficial() {
  try {
    await ElMessageBox.confirm(
      `确定购买 ${buyCrystalQty.value} 个${getMaterialName(buyCrystalType.value)}？需花费 ${(buyCrystalQty.value * officialInfo.value.sellPrice).toLocaleString()} 金币`,
      '确认购买',
      { confirmButtonText: '购买', cancelButtonText: '取消' }
    )
  } catch {
    return
  }

  buyOfficialLoading.value = true
  try {
    await buyCrystalFromOfficialApi({
      crystalType: buyCrystalType.value,
      quantity: buyCrystalQty.value
    })
    ElMessage.success('购买成功！')
    await fetchOfficialInfo()
    await fetchPlayerInfo()
    await fetchPlayerInventory()
  } catch {
  } finally {
    buyOfficialLoading.value = false
  }
}

// ===== 出售符文石碎片给官方 =====
const sellFragmentQty = ref(1)
const sellFragmentLoading = ref(false)

async function handleSellFragmentToOfficial() {
  const price = officialInfo.value.runeFragmentBuyPrice ?? 0
  try {
    await ElMessageBox.confirm(
      `确定出售 ${sellFragmentQty.value} 个符文石碎片？预计获得 ${(sellFragmentQty.value * price).toLocaleString()} 金币`,
      '确认出售',
      { confirmButtonText: '出售', cancelButtonText: '取消' }
    )
  } catch {
    return
  }

  sellFragmentLoading.value = true
  try {
    await sellRuneFragmentToOfficialApi({ quantity: sellFragmentQty.value })
    ElMessage.success('出售成功！')
    await fetchOfficialInfo()
    await fetchPlayerInfo()
    await fetchPlayerInventory()
  } catch {
  } finally {
    sellFragmentLoading.value = false
  }
}

async function handleQuickSellFragment(qty) {
  sellFragmentLoading.value = true
  try {
    await sellRuneFragmentToOfficialApi({ quantity: qty })
    ElMessage.success('出售成功！')
    await fetchOfficialInfo()
    await fetchPlayerInfo()
    await fetchPlayerInventory()
  } catch {
  } finally {
    sellFragmentLoading.value = false
  }
}

// ===== 出售符文石给官方 =====
const officialRuneStones = ref([])
const officialRsLoading = ref(false)
const sellRsOfficialLoading = ref(null)
const officialRsRarityFilter = ref('')

const filteredOfficialRuneStones = computed(() => {
  if (!officialRsRarityFilter.value) return officialRuneStones.value
  return officialRuneStones.value.filter(
    rs => rs.rarity === officialRsRarityFilter.value
  )
})

async function loadOfficialRuneStones() {
  officialRsLoading.value = true
  try {
    const res = await getMyRuneStonesApi({ pageSize: 1000 })
    officialRuneStones.value = (res.data.data?.list || []).filter(
      rs => !rs.equippedBy && !rs.listedOnMarket
    )
  } catch {
  } finally {
    officialRsLoading.value = false
  }
}

async function handleSellRuneStoneToOfficial(rs) {
  const officialPrices = officialInfo.value.runeStoneOfficialPrices || {}
  const price = officialPrices[rs.rarity] || 0
  try {
    await ElMessageBox.confirm(
      `确定将这块 ${rarityName(rs.rarity)} Lv.${rs.level} 符文石出售给官方？\n获得: ${price.toLocaleString()} 金币`,
      '确认出售给官方',
      { confirmButtonText: '确认出售', cancelButtonText: '取消' }
    )
  } catch {
    return
  }

  sellRsOfficialLoading.value = rs._id
  try {
    const res = await sellRuneStoneToOfficialApi({ runeStoneId: rs._id })
    const data = res.data.data
    ElMessage.success(
      `出售成功！获得 ${(data?.goldEarned || price).toLocaleString()} 金币`
    )
    await loadOfficialRuneStones()
    await fetchPlayerInfo()
  } catch {
  } finally {
    sellRsOfficialLoading.value = null
  }
}

onMounted(() => {
  fetchOfficialInfo()
  fetchPlayerInventory()
  loadOfficialRuneStones()
})
</script>

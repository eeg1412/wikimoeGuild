<template>
  <div>
    <div v-if="officialLoading" class="flex justify-center py-12">
      <span class="animate-spin inline-block text-4xl">⏳</span>
    </div>
    <template v-else>
      <!-- 官方市场报价 -->
      <div class="rpg-card rounded-xl p-4 mb-4 border-2 border-yellow-400/40">
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

      <!-- ===== 📤 出售水晶给官方 ===== -->
      <div class="official-section-card sell-crystal mb-4">
        <div class="section-header bg-green-500/10 dark:bg-green-900/30">
          <span class="section-icon">📤</span>
          <span class="section-title">出售水晶给官方</span>
        </div>
        <div class="section-body">
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
            预计获得<span class="text-xs">(按官方收购价计算)</span>:
            <span class="text-yellow-500 font-semibold"
              >🪙
              {{
                (sellCrystalQty * officialInfo.buyPrice).toLocaleString()
              }}</span
            >
          </div>
          <div
            v-if="currentCrystalPriceRange"
            class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-2 text-xs text-gray-500 dark:text-gray-400 mb-2"
          >
            <p>
              📊 收购单价区间:
              <span class="text-yellow-500 font-semibold">
                🪙 {{ currentCrystalPriceRange.minPrice
                }}<template
                  v-if="
                    currentCrystalPriceRange.maxPrice >
                    currentCrystalPriceRange.minPrice
                  "
                >
                  ~ {{ currentCrystalPriceRange.maxPrice }}</template
                >
              </span>
            </p>
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
      </div>

      <!-- ===== 📥 从官方购买水晶 ===== -->
      <div class="official-section-card buy-crystal mb-4">
        <div class="section-header bg-blue-500/10 dark:bg-blue-900/30">
          <span class="section-icon">📥</span>
          <span class="section-title">从官方购买水晶</span>
        </div>
        <div class="section-body">
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
      </div>

      <!-- ===== 🔮 出售符文石碎片给官方 ===== -->
      <div class="official-section-card sell-fragment mb-4">
        <div class="section-header bg-purple-500/10 dark:bg-purple-900/30">
          <span class="section-icon">🔮</span>
          <span class="section-title">出售符文石碎片给官方</span>
        </div>
        <div class="section-body">
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
      </div>

      <!-- ===== 💎 出售符文石给官方 ===== -->
      <div class="official-section-card sell-runestone mb-4">
        <div class="section-header bg-yellow-500/10 dark:bg-yellow-900/30">
          <span class="section-icon">💎</span>
          <span class="section-title">出售符文石给官方</span>
          <el-button
            type="primary"
            text
            size="small"
            class="ml-auto!"
            :loading="officialRsLoading"
            @click="loadOfficialRuneStones"
          >
            刷新列表
          </el-button>
        </div>
        <div class="section-body">
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
                >普通: 🪙
                {{ officialInfo.runeStoneOfficialPrices.normal }}</span
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

          <!-- 筛选 + 批量操作栏 -->
          <div class="flex items-center gap-2 mb-3 flex-wrap">
            <el-select
              v-model="officialRsRarityFilter"
              size="small"
              placeholder="稀有度筛选"
              clearable
              style="width: 120px"
              @change="handleRsFilterChange"
            >
              <el-option label="普通" value="normal" />
              <el-option label="稀有" value="rare" />
              <el-option label="传说" value="legendary" />
            </el-select>
            <el-button size="small" @click="handleSelectCurrentPage">
              选中当前页
            </el-button>
            <el-button
              size="small"
              @click="handleClearSelection"
              :disabled="selectedRuneStoneIds.size === 0"
            >
              取消选中
            </el-button>
          </div>

          <!-- 批量操作信息 -->
          <div
            class="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3 mb-3 flex items-center justify-between"
          >
            <span class="text-sm text-gray-600 dark:text-gray-300">
              已选中
              <b class="text-yellow-500">{{ selectedRuneStoneIds.size }}</b>
              个符文石
              <template v-if="selectedRuneStoneIds.size > 0">
                · 预计获得
                <b class="text-yellow-500"
                  >🪙 {{ batchSellTotalGold.toLocaleString() }}</b
                >
              </template>
            </span>
            <el-button
              type="success"
              size="small"
              :loading="batchSellLoading"
              :disabled="batchSellLoading || selectedRuneStoneIds.size === 0"
              @click="handleBatchSellRuneStones"
            >
              批量出售
            </el-button>
          </div>

          <!-- 符文石列表 -->
          <div v-if="officialRsLoading" class="flex justify-center py-6">
            <span class="animate-spin inline-block text-2xl">⏳</span>
          </div>
          <div
            v-else-if="paginatedRuneStones.length === 0"
            class="text-center py-6 text-gray-400 text-sm"
          >
            暂无可出售的符文石（需未装备且未上架）
          </div>
          <div v-else class="space-y-2">
            <div
              v-for="rs in paginatedRuneStones"
              :key="rs._id"
              class="rpg-card rounded-xl p-3 border transition-colors cursor-pointer"
              :class="
                selectedRuneStoneIds.has(rs._id)
                  ? 'border-yellow-400 bg-yellow-50/50 dark:bg-yellow-900/20'
                  : 'border-gray-300 dark:border-gray-600'
              "
              @click="handleToggleExpand(rs._id)"
            >
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2 min-w-0">
                  <el-checkbox
                    :model-value="selectedRuneStoneIds.has(rs._id)"
                    size="small"
                    @click.stop
                    @change="handleToggleRuneStone(rs._id)"
                  />
                  <div
                    class="w-8 h-8 rounded-lg flex items-center justify-center text-base shrink-0"
                    :class="rarityBgClass(rs.rarity)"
                  >
                    💎
                  </div>
                  <div class="min-w-0">
                    <p
                      :class="rarityTextClass(rs.rarity)"
                      class="text-sm font-semibold truncate"
                    >
                      {{ rarityName(rs.rarity) }}符文石
                      <span class="text-xs text-gray-400 font-normal"
                        >Lv.{{ rs.level }}</span
                      >
                    </p>
                  </div>
                </div>
                <div class="flex items-center gap-2 shrink-0">
                  <div class="text-right mr-1">
                    <p class="text-xs text-gray-400">收购价</p>
                    <p
                      class="text-sm text-yellow-500 font-semibold whitespace-nowrap"
                    >
                      🪙
                      {{
                        officialInfo.runeStoneOfficialPrices?.[
                          rs.rarity
                        ]?.toLocaleString()
                      }}
                    </p>
                  </div>
                  <el-button
                    type="success"
                    size="small"
                    :loading="sellRsOfficialLoading === rs._id"
                    :disabled="!!sellRsOfficialLoading || batchSellLoading"
                    @click.stop="handleSellRuneStoneToOfficial(rs)"
                  >
                    出售
                  </el-button>
                  <span class="text-gray-400 text-sm px-1 select-none">
                    {{ expandedRuneStoneIds.has(rs._id) ? '🔼' : '🔽' }}
                  </span>
                </div>
              </div>
              <!-- 展开详情 -->
              <div
                v-if="expandedRuneStoneIds.has(rs._id)"
                class="mt-2"
                @click.stop
              >
                <RuneStoneInfoCard :rune-stone="rs" />
              </div>
            </div>
          </div>

          <!-- 分页 -->
          <div
            v-if="filteredOfficialRuneStones.length > rsPageSize"
            class="flex justify-center mt-4"
          >
            <el-pagination
              v-model:current-page="rsPage"
              :page-size="rsPageSize"
              :total="filteredOfficialRuneStones.length"
              layout="prev, pager, next"
              size="small"
            />
          </div>
        </div>
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
  batchSellRuneStonesToOfficialApi,
  sellRuneFragmentToOfficialApi,
  getCrystalBuyPriceRangeApi
} from '@/api/game/market.js'
import { getMyRuneStonesApi } from '@/api/game/runeStone.js'
import { getMyInventoryApi } from '@/api/game/inventory.js'
import { useGameUser } from '@/composables/useGameUser.js'
import {
  crystalList,
  getMaterialName,
  rarityName,
  rarityTextClass,
  rarityBgClass
} from '@/composables/useMarketUtils.js'
import RuneStoneInfoCard from '@/components/RuneStoneInfoCard.vue'

const { fetchPlayerInfo } = useGameUser()

// ===== 官方市场 =====
const officialLoading = ref(false)
const officialInfo = ref({ buyPrice: 0, sellPrice: 0, stock: {} })

const sellCrystalType = ref('attackCrystal')
const sellCrystalQty = ref(1)
const sellOfficialLoading = ref(false)

// 水晶收购价格区间
const crystalPriceRange = ref(null)

async function fetchCrystalPriceRange() {
  try {
    const res = await getCrystalBuyPriceRangeApi()
    crystalPriceRange.value = res.data.data || null
  } catch {}
}

const currentCrystalPriceRange = computed(() => {
  if (!crystalPriceRange.value) return null
  return crystalPriceRange.value[sellCrystalType.value] || null
})

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
    ElMessage.success({ message: '出售成功！', showClose: true })
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
    ElMessage.success({ message: '出售成功！', showClose: true })
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
    ElMessage.success({ message: '购买成功！', showClose: true })
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
    ElMessage.success({ message: '出售成功！', showClose: true })
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
    ElMessage.success({ message: '出售成功！', showClose: true })
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
const selectedRuneStoneIds = ref(new Set())
const batchSellLoading = ref(false)
const rsPage = ref(1)
const rsPageSize = 20
const expandedRuneStoneIds = ref(new Set())

const filteredOfficialRuneStones = computed(() => {
  if (!officialRsRarityFilter.value) return officialRuneStones.value
  return officialRuneStones.value.filter(
    rs => rs.rarity === officialRsRarityFilter.value
  )
})

const paginatedRuneStones = computed(() => {
  const start = (rsPage.value - 1) * rsPageSize
  return filteredOfficialRuneStones.value.slice(start, start + rsPageSize)
})

const batchSellTotalGold = computed(() => {
  const prices = officialInfo.value.runeStoneOfficialPrices || {}
  let total = 0
  for (const rs of officialRuneStones.value) {
    if (selectedRuneStoneIds.value.has(rs._id)) {
      total += prices[rs.rarity] || 0
    }
  }
  return total
})

function handleRsFilterChange() {
  rsPage.value = 1
  selectedRuneStoneIds.value = new Set()
}

function handleToggleRuneStone(id) {
  const newSet = new Set(selectedRuneStoneIds.value)
  if (newSet.has(id)) {
    newSet.delete(id)
  } else {
    newSet.add(id)
  }
  selectedRuneStoneIds.value = newSet
}

function handleSelectCurrentPage() {
  const newSet = new Set(selectedRuneStoneIds.value)
  for (const rs of paginatedRuneStones.value) {
    newSet.add(rs._id)
  }
  selectedRuneStoneIds.value = newSet
}

function handleClearSelection() {
  selectedRuneStoneIds.value = new Set()
}

function handleToggleExpand(id) {
  const newSet = new Set(expandedRuneStoneIds.value)
  if (newSet.has(id)) {
    newSet.delete(id)
  } else {
    newSet.add(id)
  }
  expandedRuneStoneIds.value = newSet
}

async function loadOfficialRuneStones() {
  officialRsLoading.value = true
  try {
    const res = await getMyRuneStonesApi({ pageSize: 1000 })
    officialRuneStones.value = (res.data.data?.list || []).filter(
      rs => !rs.equippedBy && !rs.listedOnMarket
    )
    selectedRuneStoneIds.value = new Set()
    rsPage.value = 1
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
    ElMessage.success({
      message: `出售成功！获得 ${(data?.goldEarned || price).toLocaleString()} 金币`,
      showClose: true
    })
    await loadOfficialRuneStones()
    await fetchPlayerInfo()
  } catch {
  } finally {
    sellRsOfficialLoading.value = null
  }
}

async function handleBatchSellRuneStones() {
  const ids = Array.from(selectedRuneStoneIds.value)
  if (ids.length === 0) return

  try {
    await ElMessageBox.confirm(
      `确定将 ${ids.length} 个符文石批量出售给官方？\n预计获得: ${batchSellTotalGold.value.toLocaleString()} 金币`,
      '批量出售确认',
      { confirmButtonText: '确认出售', cancelButtonText: '取消' }
    )
  } catch {
    return
  }

  batchSellLoading.value = true
  try {
    const res = await batchSellRuneStonesToOfficialApi({ runeStoneIds: ids })
    const data = res.data.data
    ElMessage.success({
      message: `批量出售成功！出售 ${data.soldCount} 个，获得 ${data.goldEarned.toLocaleString()} 金币`,
      showClose: true
    })
    await loadOfficialRuneStones()
    await fetchPlayerInfo()
  } catch {
  } finally {
    batchSellLoading.value = false
  }
}

onMounted(() => {
  fetchOfficialInfo()
  fetchPlayerInventory()
  loadOfficialRuneStones()
  fetchCrystalPriceRange()
})
</script>

<style scoped>
.official-section-card {
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid rgba(200, 160, 80, 0.3);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}
.dark .official-section-card {
  border-color: rgba(200, 160, 80, 0.2);
}
.sell-crystal {
  border-left: 4px solid #10b981;
}
.buy-crystal {
  border-left: 4px solid #3b82f6;
}
.sell-fragment {
  border-left: 4px solid #a855f7;
}
.sell-runestone {
  border-left: 4px solid #eab308;
}
.section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
}
.section-icon {
  font-size: 18px;
}
.section-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}
.section-body {
  padding: 16px;
}
.official-section-card .rpg-card {
  box-shadow: none;
  border: 1px solid rgba(200, 160, 80, 0.2);
}
.official-section-card :deep(.el-button + .el-button) {
  margin-left: 0;
}
</style>

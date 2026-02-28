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
    </div>

    <!-- 顶部标签页 -->
    <el-tabs v-model="activeTab" class="market-tabs mb-4">
      <el-tab-pane label="🏛️ 官方市场" name="official" />
      <el-tab-pane label="📦 素材交易" name="material" />
      <el-tab-pane label="💎 符文石交易" name="runeStone" />
    </el-tabs>

    <!-- ===== 官方市场 ===== -->
    <div v-if="activeTab === 'official'">
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
              <p class="text-xs text-gray-400 mb-1">收购单价</p>
              <p class="text-lg font-bold text-green-500">
                🪙 {{ officialInfo.buyPrice }}
              </p>
              <p class="text-[10px] text-gray-400">官方从你手中收购</p>
            </div>
            <div
              class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 text-center"
            >
              <p class="text-xs text-gray-400 mb-1">出售单价</p>
              <p class="text-lg font-bold text-blue-500">
                🪙 {{ officialInfo.sellPrice }}
              </p>
              <p class="text-[10px] text-gray-400">从官方购买</p>
            </div>
          </div>
        </div>

        <!-- 卖给官方 -->
        <div class="rpg-card rounded-xl p-4 mb-4">
          <h3
            class="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3"
          >
            📤 出售水晶给官方
          </h3>
          <!-- 玩家水晶持有量 -->
          <div class="grid grid-cols-2 gap-2 mb-3">
            <div
              v-for="c in crystalList"
              :key="'own-' + c.key"
              class="flex items-center gap-1.5 bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2 text-xs"
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
          <div class="text-xs text-gray-400 mb-2">
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
          <h3
            class="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3"
          >
            📥 从官方购买水晶
          </h3>
          <!-- 库存展示 -->
          <div class="grid grid-cols-2 gap-2 mb-3">
            <div
              v-for="c in crystalList"
              :key="c.key"
              class="flex items-center gap-1.5 bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2 text-xs"
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
          <div class="text-xs text-gray-400 mb-2">
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
      </template>
    </div>

    <!-- ===== 素材交易 ===== -->
    <div v-if="activeTab === 'material'">
      <!-- 二级标签 -->
      <div class="flex justify-center gap-2 mb-4">
        <el-button
          :type="materialSubTab === 'sell' ? 'primary' : 'default'"
          size="small"
          @click="switchMaterialTab('sell')"
        >
          贩卖中
        </el-button>
        <el-button
          :type="materialSubTab === 'buy' ? 'primary' : 'default'"
          size="small"
          @click="switchMaterialTab('buy')"
        >
          求购中
        </el-button>
        <el-button
          :type="materialSubTab === 'my' ? 'warning' : 'default'"
          size="small"
          @click="switchMaterialTab('my')"
        >
          我的
        </el-button>
      </div>

      <!-- 筛选面板 -->
      <div v-if="materialSubTab !== 'my'" class="rpg-card rounded-xl p-3 mb-4">
        <div class="flex flex-wrap items-center gap-2">
          <el-select
            v-model="matFilter.materialType"
            placeholder="材料类型"
            clearable
            size="small"
            class="w-32!"
          >
            <el-option
              v-for="m in materialTypes"
              :key="m.key"
              :label="`${m.icon} ${m.name}`"
              :value="m.key"
            />
          </el-select>
          <el-button
            type="primary"
            text
            size="small"
            @click="fetchMaterialOrders"
            >筛选</el-button
          >
        </div>
      </div>

      <!-- 创建订单 -->
      <div v-if="materialSubTab === 'my'" class="rpg-card rounded-xl p-4 mb-4">
        <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">
          {{ materialSubTab === 'buy' ? '📝 发布求购' : '📝 发布出售' }}
        </h3>
        <div class="flex flex-wrap items-center gap-2 mb-3">
          <el-select
            v-model="matOrder.materialType"
            placeholder="材料类型"
            size="small"
            class="w-32!"
          >
            <el-option
              v-for="m in materialTypes"
              :key="m.key"
              :label="`${m.icon} ${m.name}`"
              :value="m.key"
            />
          </el-select>
          <el-input-number
            v-model="matOrder.quantity"
            :min="1"
            :max="99999"
            size="small"
            class="w-24!"
            placeholder="数量"
          />
          <el-input-number
            v-model="matOrder.unitPrice"
            :min="1"
            :max="2000000000"
            :step="100"
            size="small"
            class="w-32!"
            placeholder="单价"
          />
        </div>
        <div class="text-xs text-gray-400 mb-2">
          <template v-if="materialSubTab === 'buy'">
            需冻结金币:
            <span class="text-yellow-500 font-semibold"
              >🪙
              {{
                (matOrder.quantity * matOrder.unitPrice).toLocaleString()
              }}</span
            >
          </template>
          <template v-else>
            将扣除:
            <span class="text-yellow-500 font-semibold"
              >{{ matOrder.quantity }} 个素材</span
            >
          </template>
        </div>
        <el-button
          type="primary"
          class="w-full"
          size="small"
          :loading="createMatOrderLoading"
          :disabled="createMatOrderLoading"
          @click="handleCreateMaterialOrder"
        >
          发布{{ materialSubTab === 'buy' ? '求购' : '出售' }}
        </el-button>
      </div>

      <!-- 订单列表 -->
      <div v-if="matOrdersLoading" class="flex justify-center py-8">
        <span class="animate-spin inline-block text-2xl">⏳</span>
      </div>
      <template v-else>
        <div
          v-if="matOrders.length === 0"
          class="text-center py-8 text-gray-400 text-sm"
        >
          暂无订单
        </div>
        <div v-else class="space-y-2">
          <div
            v-for="order in matOrders"
            :key="order._id"
            class="rpg-card rounded-xl p-3"
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span>{{ getMaterialIcon(order.materialType) }}</span>
                <div>
                  <p
                    class="text-sm font-semibold text-gray-700 dark:text-gray-200"
                  >
                    {{ getMaterialName(order.materialType) }}
                    <span class="text-xs text-gray-400 font-normal ml-1"
                      >x{{ order.quantity }}</span
                    >
                  </p>
                  <p class="text-xs text-gray-400">
                    单价 🪙 {{ order.unitPrice?.toLocaleString() }} · 总价 🪙
                    {{ (order.quantity * order.unitPrice).toLocaleString() }}
                  </p>
                  <p
                    v-if="order.guildName"
                    class="text-[10px] text-gray-400 mt-0.5"
                  >
                    {{ order.guildName }}
                  </p>
                </div>
              </div>
              <div class="flex flex-col items-end gap-1">
                <template v-if="order.isMine">
                  <el-button
                    type="danger"
                    text
                    size="small"
                    :loading="cancelMatLoading === order._id"
                    :disabled="!!cancelMatLoading"
                    @click="handleCancelMaterialOrder(order)"
                  >
                    下架
                  </el-button>
                </template>
                <template v-else>
                  <el-button
                    type="primary"
                    size="small"
                    :loading="fulfillMatLoading === order._id"
                    :disabled="!!fulfillMatLoading"
                    @click="handleFulfillMaterialOrder(order)"
                  >
                    {{ order.orderType === 'sell' ? '购买' : '出售' }}
                  </el-button>
                </template>
              </div>
            </div>
          </div>
        </div>

        <!-- 分页 -->
        <div
          v-if="matOrdersTotal > matPageSize"
          class="flex justify-center mt-4"
        >
          <el-pagination
            v-model:current-page="matPage"
            :page-size="matPageSize"
            :total="matOrdersTotal"
            layout="prev, pager, next"
            small
            @current-change="fetchMaterialOrders"
          />
        </div>
      </template>
    </div>

    <!-- ===== 符文石交易 ===== -->
    <div v-if="activeTab === 'runeStone'">
      <div class="flex justify-center gap-2 mb-4">
        <el-button
          :type="rsSubTab === 'market' ? 'primary' : 'default'"
          size="small"
          @click="switchRsTab('market')"
        >
          贩卖中
        </el-button>
        <el-button
          :type="rsSubTab === 'my' ? 'warning' : 'default'"
          size="small"
          @click="switchRsTab('my')"
        >
          我的
        </el-button>
      </div>

      <!-- 上架符文石 -->
      <div v-if="rsSubTab === 'my'" class="rpg-card rounded-xl p-4 mb-4">
        <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">
          📝 上架符文石
        </h3>
        <div class="flex flex-wrap items-center gap-2 mb-3">
          <el-select
            v-model="rsListForm.runeStoneId"
            placeholder="选择符文石"
            size="small"
            class="flex-1"
            @focus="loadMyRuneStones"
          >
            <el-option
              v-for="rs in myRuneStones"
              :key="rs._id"
              :label="`${rarityName(rs.rarity)} Lv.${rs.level}`"
              :value="rs._id"
            >
              <span>💎 {{ rarityName(rs.rarity) }} Lv.{{ rs.level }}</span>
            </el-option>
          </el-select>
          <el-input-number
            v-model="rsListForm.price"
            :min="1"
            :max="2000000000"
            :step="100"
            size="small"
            class="w-32!"
            placeholder="价格"
          />
        </div>
        <el-button
          type="primary"
          class="w-full"
          size="small"
          :loading="createRsListingLoading"
          :disabled="createRsListingLoading"
          @click="handleCreateRuneStoneListing"
        >
          上架出售
        </el-button>
      </div>

      <!-- 符文石列表 -->
      <div v-if="rsListingsLoading" class="flex justify-center py-8">
        <span class="animate-spin inline-block text-2xl">⏳</span>
      </div>
      <template v-else>
        <div
          v-if="rsListings.length === 0"
          class="text-center py-8 text-gray-400 text-sm"
        >
          暂无符文石上架
        </div>
        <div v-else class="space-y-2">
          <div
            v-for="listing in rsListings"
            :key="listing._id"
            class="rpg-card rounded-xl p-3"
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <div
                  class="w-10 h-10 rounded-lg flex items-center justify-center text-lg"
                  :class="rarityBgClass(listing.runeStone?.rarity)"
                >
                  💎
                </div>
                <div>
                  <p
                    class="text-sm font-semibold"
                    :class="rarityTextClass(listing.runeStone?.rarity)"
                  >
                    {{ rarityName(listing.runeStone?.rarity) }}符文石
                    <span class="text-xs text-gray-400 font-normal"
                      >Lv.{{ listing.runeStone?.level }}</span
                    >
                  </p>
                  <p class="text-xs text-gray-400">
                    主动 {{ listing.runeStone?.activeSkills?.length || 0 }} ·
                    被动 {{ listing.runeStone?.passiveBuffs?.length || 0 }}
                  </p>
                  <p class="text-xs text-yellow-500 font-semibold">
                    🪙 {{ listing.price?.toLocaleString() }}
                  </p>
                  <p
                    v-if="listing.guildName"
                    class="text-[10px] text-gray-400 mt-0.5"
                  >
                    {{ listing.guildName }}
                  </p>
                </div>
              </div>
              <div>
                <template v-if="listing.isMine">
                  <el-button
                    type="danger"
                    text
                    size="small"
                    :loading="cancelRsLoading === listing._id"
                    :disabled="!!cancelRsLoading"
                    @click="handleCancelRuneStoneListing(listing)"
                  >
                    下架
                  </el-button>
                </template>
                <template v-else>
                  <el-button
                    type="primary"
                    size="small"
                    :loading="buyRsLoading === listing._id"
                    :disabled="!!buyRsLoading"
                    @click="handleBuyRuneStone(listing)"
                  >
                    购买
                  </el-button>
                </template>
              </div>
            </div>
          </div>
        </div>

        <!-- 分页 -->
        <div
          v-if="rsListingsTotal > rsPageSize"
          class="flex justify-center mt-4"
        >
          <el-pagination
            v-model:current-page="rsPage"
            :page-size="rsPageSize"
            :total="rsListingsTotal"
            layout="prev, pager, next"
            small
            @current-change="fetchRuneStoneListings"
          />
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  getOfficialMarketInfoApi,
  sellCrystalToOfficialApi,
  buyCrystalFromOfficialApi,
  listMaterialSellOrdersApi,
  listMaterialBuyOrdersApi,
  createMaterialSellOrderApi,
  createMaterialBuyOrderApi,
  fulfillMaterialSellOrderApi,
  fulfillMaterialBuyOrderApi,
  cancelMaterialOrderApi,
  listRuneStoneListingsApi,
  createRuneStoneListingApi,
  buyRuneStoneListingApi,
  cancelRuneStoneListingApi,
  listMyRuneStoneListingsApi
} from '@/api/game/market.js'
import { getMyRuneStonesApi } from '@/api/game/runeStone.js'
import { getMyInventoryApi } from '@/api/game/inventory.js'
import { useGameUser } from '@/composables/useGameUser.js'

const router = useRouter()
const { isLoggedIn, fetchPlayerInfo } = useGameUser()
if (!isLoggedIn.value) {
  router.replace('/game/login')
}

const crystalList = [
  { key: 'attackCrystal', name: '攻击', icon: '⚔️', color: '#e05c4f' },
  { key: 'defenseCrystal', name: '防御', icon: '🛡️', color: '#4fa3e0' },
  { key: 'speedCrystal', name: '速度', icon: '💨', color: '#6abf69' },
  { key: 'sanCrystal', name: 'SAN值', icon: '🌀', color: '#c070e0' }
]

const materialTypes = [
  { key: 'attackCrystal', name: '攻击水晶', icon: '⚔️' },
  { key: 'defenseCrystal', name: '防御水晶', icon: '🛡️' },
  { key: 'speedCrystal', name: '速度水晶', icon: '💨' },
  { key: 'sanCrystal', name: 'SAN值水晶', icon: '🌀' },
  { key: 'runeFragment', name: '符文石碎片', icon: '🔮' }
]

function getMaterialIcon(type) {
  return materialTypes.find(m => m.key === type)?.icon || '📦'
}
function getMaterialName(type) {
  return materialTypes.find(m => m.key === type)?.name || type
}

// ===== 标签页 =====
const activeTab = ref('official')

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
    // 错误已由拦截器处理
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
    // 错误已由拦截器处理
  } finally {
    buyOfficialLoading.value = false
  }
}

// ===== 素材交易 =====
const materialSubTab = ref('sell')
const matFilter = reactive({ materialType: '' })
const matOrders = ref([])
const matOrdersLoading = ref(false)
const matPage = ref(1)
const matPageSize = 20
const matOrdersTotal = ref(0)

const matOrder = reactive({
  materialType: 'attackCrystal',
  quantity: 1,
  unitPrice: 100
})
const createMatOrderLoading = ref(false)
const fulfillMatLoading = ref(null)
const cancelMatLoading = ref(null)

function switchMaterialTab(tab) {
  materialSubTab.value = tab
  fetchMaterialOrders()
}

async function fetchMaterialOrders() {
  matOrdersLoading.value = true
  try {
    const params = { page: matPage.value, pageSize: matPageSize }
    if (matFilter.materialType) params.materialType = matFilter.materialType
    let res
    if (materialSubTab.value === 'my') {
      // 获取我的订单—合并 sell 和 buy
      const [sellRes, buyRes] = await Promise.all([
        listMaterialSellOrdersApi({ ...params, mine: true }),
        listMaterialBuyOrdersApi({ ...params, mine: true })
      ])
      const sellList = (sellRes.data.data?.list || []).map(o => ({
        ...o,
        isMine: true
      }))
      const buyList = (buyRes.data.data?.list || []).map(o => ({
        ...o,
        isMine: true
      }))
      matOrders.value = [...sellList, ...buyList]
      matOrdersTotal.value =
        (sellRes.data.data?.total || 0) + (buyRes.data.data?.total || 0)
    } else if (materialSubTab.value === 'sell') {
      res = await listMaterialSellOrdersApi(params)
      matOrders.value = res.data.data?.list || []
      matOrdersTotal.value = res.data.data?.total || 0
    } else {
      res = await listMaterialBuyOrdersApi(params)
      matOrders.value = res.data.data?.list || []
      matOrdersTotal.value = res.data.data?.total || 0
    }
  } catch {
    matOrders.value = []
  } finally {
    matOrdersLoading.value = false
  }
}

async function handleCreateMaterialOrder() {
  createMatOrderLoading.value = true
  try {
    if (materialSubTab.value === 'buy') {
      await createMaterialBuyOrderApi({
        materialType: matOrder.materialType,
        quantity: matOrder.quantity,
        unitPrice: matOrder.unitPrice
      })
    } else {
      await createMaterialSellOrderApi({
        materialType: matOrder.materialType,
        quantity: matOrder.quantity,
        unitPrice: matOrder.unitPrice
      })
    }
    ElMessage.success('订单发布成功！')
    await fetchMaterialOrders()
    await fetchPlayerInfo()
  } catch {
    // 错误已由拦截器处理
  } finally {
    createMatOrderLoading.value = false
  }
}

async function handleFulfillMaterialOrder(order) {
  const isSell = order.orderType === 'sell'
  try {
    await ElMessageBox.confirm(
      isSell
        ? `确定购买 ${order.quantity} 个${getMaterialName(order.materialType)}？花费 ${(order.quantity * order.unitPrice).toLocaleString()} 金币`
        : `确定出售 ${order.quantity} 个${getMaterialName(order.materialType)}？获得 ${(order.quantity * order.unitPrice).toLocaleString()} 金币`,
      '确认交易',
      { confirmButtonText: '确认', cancelButtonText: '取消' }
    )
  } catch {
    return
  }

  fulfillMatLoading.value = order._id
  try {
    if (isSell) {
      await fulfillMaterialSellOrderApi(order._id)
    } else {
      await fulfillMaterialBuyOrderApi(order._id)
    }
    ElMessage.success('交易完成！')
    await fetchMaterialOrders()
    await fetchPlayerInfo()
  } catch {
    // 错误已由拦截器处理
  } finally {
    fulfillMatLoading.value = null
  }
}

async function handleCancelMaterialOrder(order) {
  try {
    await ElMessageBox.confirm('确定下架该订单？素材或金币将退还', '确认下架', {
      confirmButtonText: '下架',
      cancelButtonText: '取消',
      type: 'warning'
    })
  } catch {
    return
  }

  cancelMatLoading.value = order._id
  try {
    await cancelMaterialOrderApi(order._id)
    ElMessage.success('已下架，资源已退还')
    await fetchMaterialOrders()
    await fetchPlayerInfo()
  } catch {
    // 错误已由拦截器处理
  } finally {
    cancelMatLoading.value = null
  }
}

// ===== 符文石交易 =====
const rsSubTab = ref('market')
const rsListings = ref([])
const rsListingsLoading = ref(false)
const rsPage = ref(1)
const rsPageSize = 20
const rsListingsTotal = ref(0)

const myRuneStones = ref([])
const rsListForm = reactive({ runeStoneId: '', price: 100 })
const createRsListingLoading = ref(false)
const buyRsLoading = ref(null)
const cancelRsLoading = ref(null)

function switchRsTab(tab) {
  rsSubTab.value = tab
  fetchRuneStoneListings()
}

async function fetchRuneStoneListings() {
  rsListingsLoading.value = true
  try {
    const params = { page: rsPage.value, pageSize: rsPageSize }
    let res
    if (rsSubTab.value === 'my') {
      res = await listMyRuneStoneListingsApi(params)
      rsListings.value = (res.data.data?.list || []).map(l => ({
        ...l,
        isMine: true
      }))
    } else {
      res = await listRuneStoneListingsApi(params)
      rsListings.value = (res.data.data?.list || []).map(l => ({
        ...l,
        isMine: false
      }))
    }
    rsListingsTotal.value = res.data.data?.total || 0
  } catch {
    rsListings.value = []
  } finally {
    rsListingsLoading.value = false
  }
}

async function loadMyRuneStones() {
  try {
    const res = await getMyRuneStonesApi()
    // 只显示未装备的
    myRuneStones.value = (res.data.data?.list || []).filter(
      rs => !rs.equippedBy
    )
  } catch {}
}

async function handleCreateRuneStoneListing() {
  if (!rsListForm.runeStoneId) {
    ElMessage.warning('请选择要上架的符文石')
    return
  }
  createRsListingLoading.value = true
  try {
    await createRuneStoneListingApi({
      runeStoneId: rsListForm.runeStoneId,
      price: rsListForm.price
    })
    ElMessage.success('符文石已上架！')
    rsListForm.runeStoneId = ''
    await fetchRuneStoneListings()
  } catch {
    // 错误已由拦截器处理
  } finally {
    createRsListingLoading.value = false
  }
}

async function handleBuyRuneStone(listing) {
  try {
    await ElMessageBox.confirm(
      `确定购买这个${rarityName(listing.runeStone?.rarity)}符文石？花费 ${listing.price?.toLocaleString()} 金币`,
      '确认购买',
      { confirmButtonText: '购买', cancelButtonText: '取消' }
    )
  } catch {
    return
  }

  buyRsLoading.value = listing._id
  try {
    await buyRuneStoneListingApi(listing._id)
    ElMessage.success('购买成功！')
    await fetchRuneStoneListings()
    await fetchPlayerInfo()
  } catch {
    // 错误已由拦截器处理
  } finally {
    buyRsLoading.value = null
  }
}

async function handleCancelRuneStoneListing(listing) {
  try {
    await ElMessageBox.confirm('确定下架该符文石？', '确认下架', {
      confirmButtonText: '下架',
      cancelButtonText: '取消',
      type: 'warning'
    })
  } catch {
    return
  }

  cancelRsLoading.value = listing._id
  try {
    await cancelRuneStoneListingApi(listing._id)
    ElMessage.success('已下架，符文石已退还')
    await fetchRuneStoneListings()
  } catch {
    // 错误已由拦截器处理
  } finally {
    cancelRsLoading.value = null
  }
}

// ===== 工具函数 =====
function rarityName(r) {
  return { normal: '普通', rare: '稀有', legendary: '传说' }[r] || r
}
function rarityTextClass(r) {
  return (
    {
      normal: 'text-gray-600 dark:text-gray-300',
      rare: 'text-blue-500',
      legendary: 'text-yellow-500'
    }[r] || ''
  )
}
function rarityBgClass(r) {
  return (
    {
      normal: 'bg-gray-200 dark:bg-gray-700',
      rare: 'bg-blue-100 dark:bg-blue-900/30',
      legendary: 'bg-yellow-100 dark:bg-yellow-900/30'
    }[r] || ''
  )
}

onMounted(() => {
  fetchOfficialInfo()
  fetchPlayerInventory()
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
.rpg-card {
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.9) 0%,
    rgba(240, 230, 200, 0.6) 100%
  );
  border: 1px solid rgba(200, 160, 80, 0.3);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
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
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}
.market-tabs :deep(.el-tabs__nav-wrap) {
  justify-content: center;
}
</style>

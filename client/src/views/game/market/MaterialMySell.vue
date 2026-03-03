<template>
  <div>
    <!-- 我的素材持有 -->
    <div class="rpg-card rounded-xl p-4 mb-4">
      <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
        🎒 我的素材
      </h3>
      <div v-if="inventoryLoading" class="text-center py-2">
        <span class="animate-spin inline-block text-sm">⏳</span>
      </div>
      <div v-else class="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
        <div
          v-for="m in materialTypes"
          :key="m.key"
          class="flex items-center justify-between bg-gray-50 dark:bg-gray-800 rounded p-1.5"
        >
          <span class="text-xs text-gray-500">{{ m.icon }} {{ m.name }}</span>
          <span
            class="text-sm font-semibold tabular-nums text-gray-700 dark:text-gray-200"
            >{{ myInventory[m.key] ?? 0 }}</span
          >
        </div>
      </div>
    </div>

    <!-- 发布出售表单 -->
    <div class="rpg-card rounded-xl p-4 mb-4">
      <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">
        📝 发布出售
      </h3>
      <div class="flex flex-wrap items-center gap-2 mb-3">
        <el-select
          v-model="sellForm.materialType"
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
          v-model="sellForm.quantity"
          :min="1"
          :max="99999"
          size="small"
          class="w-24!"
          placeholder="数量"
        />
        <el-input-number
          v-model="sellForm.unitPrice"
          :min="1"
          :max="2000000000"
          :step="100"
          size="small"
          class="w-32!"
          placeholder="单价"
        />
      </div>
      <div class="text-sm text-gray-400 mb-2">
        将扣除:
        <span class="text-yellow-500 font-semibold"
          >{{ sellForm.quantity }} 个素材</span
        >
        <template v-if="sellForm.unitPrice">
          ，预计获得:
          <span class="text-yellow-500 font-semibold"
            >🪙
            {{
              (sellForm.quantity * sellForm.unitPrice).toLocaleString()
            }}</span
          >
        </template>
      </div>
      <el-button
        type="primary"
        class="w-full"
        size="small"
        :loading="createLoading"
        :disabled="createLoading"
        @click="handleCreateSellOrder"
      >
        发布出售
      </el-button>
    </div>

    <!-- 我的出售订单列表 -->
    <div class="flex items-center justify-between mb-3">
      <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-200">
        📋 我的出售列表
      </h3>
    </div>

    <div v-if="ordersLoading" class="flex justify-center py-8">
      <span class="animate-spin inline-block text-2xl">⏳</span>
    </div>
    <template v-else>
      <div
        v-if="orders.length === 0"
        class="text-center py-8 text-gray-400 text-sm"
      >
        暂无出售订单
      </div>
      <div v-else class="space-y-2">
        <div
          v-for="order in orders"
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
                    >x{{ order.originalQuantity || order.quantity }}</span
                  >
                </p>
                <p class="text-sm text-gray-400">
                  单价 🪙 {{ order.unitPrice?.toLocaleString() }}
                </p>
                <!-- 状态显示 -->
                <p class="text-xs mt-0.5">
                  <template
                    v-if="
                      order.status === 'active' &&
                      order.quantity <
                        (order.originalQuantity || order.quantity)
                    "
                  >
                    <span class="text-orange-500">部分售出</span>
                    <span class="text-gray-400">
                      · 剩余 x{{ order.quantity }}
                    </span>
                  </template>
                  <template v-else-if="order.status === 'active'">
                    <span class="text-green-500">上架中</span>
                  </template>
                  <template v-else-if="order.status === 'completed'">
                    <span class="text-blue-500">已售出</span>
                  </template>
                  <template v-else-if="order.status === 'cancelled'">
                    <span class="text-gray-400">已下架</span>
                  </template>
                </p>
                <!-- 待收取提示 -->
                <p
                  v-if="order.pendingGold > 0"
                  class="text-xs text-yellow-500 mt-0.5"
                >
                  💰 待收取: 🪙 {{ order.pendingGold.toLocaleString() }}
                </p>
              </div>
            </div>
            <div class="flex flex-col items-end gap-1">
              <!-- 收取按钮 -->
              <el-button
                v-if="order.pendingGold > 0"
                type="success"
                size="small"
                :loading="collectLoading === order._id"
                :disabled="!!collectLoading"
                @click="handleCollect(order)"
              >
                收取
              </el-button>
              <!-- 下架按钮 -->
              <el-button
                v-if="order.status === 'active'"
                type="danger"
                text
                size="small"
                :loading="cancelLoading === order._id"
                :disabled="!!cancelLoading"
                @click="handleCancel(order)"
              >
                下架
              </el-button>
            </div>
          </div>
        </div>
      </div>

      <!-- 分页 -->
      <div v-if="ordersTotal > pageSize" class="flex justify-center mt-4">
        <el-pagination
          v-model:current-page="page"
          :page-size="pageSize"
          :total="ordersTotal"
          layout="prev, pager, next"
          small
          @current-change="fetchOrders"
        />
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  createMaterialSellOrderApi,
  listMyMaterialOrdersApi,
  cancelMaterialOrderApi,
  collectMaterialOrderApi
} from '@/api/game/market.js'
import { getMyInventoryApi } from '@/api/game/inventory.js'
import { useGameUser } from '@/composables/useGameUser.js'
import {
  materialTypes,
  getMaterialIcon,
  getMaterialName
} from '@/composables/useMarketUtils.js'

const { fetchPlayerInfo } = useGameUser()

// ── 素材持有信息 ──
const inventoryLoading = ref(false)
const myInventory = ref({})

async function fetchInventory() {
  inventoryLoading.value = true
  try {
    const res = await getMyInventoryApi()
    myInventory.value = res.data.data || {}
  } catch {
    // ignore
  } finally {
    inventoryLoading.value = false
  }
}

const sellForm = reactive({
  materialType: 'attackCrystal',
  quantity: 1,
  unitPrice: null
})
const createLoading = ref(false)

const orders = ref([])
const ordersLoading = ref(false)
const ordersTotal = ref(0)
const page = ref(1)
const pageSize = 20
const cancelLoading = ref(null)
const collectLoading = ref(null)

async function fetchOrders() {
  ordersLoading.value = true
  try {
    const res = await listMyMaterialOrdersApi({
      page: page.value,
      pageSize,
      orderType: 'sell'
    })
    orders.value = res.data.data?.list || []
    ordersTotal.value = res.data.data?.total || 0
  } catch {
    orders.value = []
  } finally {
    ordersLoading.value = false
  }
}

async function handleCreateSellOrder() {
  if (!sellForm.unitPrice || sellForm.unitPrice <= 0) {
    ElMessage.warning('请设置单价')
    return
  }
  try {
    await ElMessageBox.confirm(
      `确定发布出售 ${sellForm.quantity} 个 ${getMaterialName(sellForm.materialType)}？\n单价: ${sellForm.unitPrice.toLocaleString()} 金币`,
      '确认发布出售',
      { confirmButtonText: '确认发布', cancelButtonText: '取消' }
    )
  } catch {
    return
  }

  createLoading.value = true
  try {
    await createMaterialSellOrderApi({
      materialType: sellForm.materialType,
      quantity: sellForm.quantity,
      unitPrice: sellForm.unitPrice
    })
    ElMessage.success('出售订单发布成功！')
    await fetchOrders()
    await fetchPlayerInfo()
    await fetchInventory()
  } catch {
  } finally {
    createLoading.value = false
  }
}

async function handleCollect(order) {
  collectLoading.value = order._id
  try {
    await collectMaterialOrderApi(order._id)
    ElMessage.success('收取成功！')
    await fetchOrders()
    await fetchPlayerInfo()
  } catch {
  } finally {
    collectLoading.value = null
  }
}

async function handleCancel(order) {
  try {
    await ElMessageBox.confirm(
      '确定下架该订单？剩余未售出的素材将退还',
      '确认下架',
      {
        confirmButtonText: '下架',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
  } catch {
    return
  }

  cancelLoading.value = order._id
  try {
    await cancelMaterialOrderApi(order._id)
    ElMessage.success('已下架，剩余素材已退还')
    await fetchOrders()
    await fetchPlayerInfo()
  } catch {
  } finally {
    cancelLoading.value = null
  }
}

onMounted(() => {
  fetchOrders()
  fetchInventory()
})
</script>

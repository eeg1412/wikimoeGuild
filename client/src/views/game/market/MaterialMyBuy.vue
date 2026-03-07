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

    <!-- 发布求购表单 -->
    <div class="rpg-card rounded-xl p-4 mb-4">
      <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">
        📝 发布求购
      </h3>
      <div class="flex flex-wrap items-center gap-2 mb-3">
        <el-select
          v-model="buyForm.materialType"
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
          v-model="buyForm.quantity"
          :min="1"
          :max="99999"
          size="small"
          class="w-24!"
          placeholder="数量"
        />
        <el-input-number
          v-model="buyForm.unitPrice"
          :min="1"
          :max="2000000000"
          :step="100"
          size="small"
          class="w-32!"
          placeholder="单价"
        />
      </div>
      <div class="text-sm text-gray-400 mb-2">
        需冻结金币:
        <span class="text-yellow-500 font-semibold"
          >🪙
          {{
            buyForm.unitPrice
              ? (buyForm.quantity * buyForm.unitPrice).toLocaleString()
              : '--'
          }}</span
        >
      </div>
      <el-button
        type="warning"
        class="w-full"
        size="small"
        :loading="createLoading"
        :disabled="createLoading"
        @click="handleCreateBuyOrder"
      >
        发布求购
      </el-button>
    </div>

    <!-- 我的求购订单列表 -->
    <div class="flex items-center justify-between mb-3">
      <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-200">
        📋 我的求购列表
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
        暂无求购订单
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
                    <span class="text-orange-500">部分求购成功</span>
                    <span class="text-gray-400">
                      · 剩余需求 x{{ order.quantity }}
                    </span>
                  </template>
                  <template v-else-if="order.status === 'active'">
                    <span class="text-blue-500">求购中</span>
                  </template>
                  <template v-else-if="order.status === 'completed'">
                    <span class="text-green-500">求购成功</span>
                  </template>
                  <template v-else-if="order.status === 'cancelled'">
                    <span class="text-gray-400">已下架</span>
                  </template>
                </p>
                <!-- 待收取提示 -->
                <p
                  v-if="order.pendingQuantity > 0"
                  class="text-xs text-yellow-500 mt-0.5"
                >
                  📦 待收取: {{ getMaterialName(order.materialType) }} x{{
                    order.pendingQuantity
                  }}
                </p>
              </div>
            </div>
            <div class="flex flex-col items-end gap-1">
              <!-- 收取按钮 -->
              <el-button
                v-if="order.pendingQuantity > 0"
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
          size="small"
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
  createMaterialBuyOrderApi,
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

const buyForm = reactive({
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
      orderType: 'buy'
    })
    orders.value = res.data.data?.list || []
    ordersTotal.value = res.data.data?.total || 0
  } catch {
    orders.value = []
  } finally {
    ordersLoading.value = false
  }
}

async function handleCreateBuyOrder() {
  if (!buyForm.unitPrice || buyForm.unitPrice <= 0) {
    ElMessage.warning('请设置单价')
    return
  }
  const totalCost = buyForm.quantity * buyForm.unitPrice
  try {
    await ElMessageBox.confirm(
      `确定发布求购 ${buyForm.quantity} 个 ${getMaterialName(buyForm.materialType)}？\n单价: ${buyForm.unitPrice.toLocaleString()} 金币\n将冻结: ${totalCost.toLocaleString()} 金币`,
      '确认发布求购',
      { confirmButtonText: '确认发布', cancelButtonText: '取消' }
    )
  } catch {
    return
  }

  createLoading.value = true
  try {
    await createMaterialBuyOrderApi({
      materialType: buyForm.materialType,
      quantity: buyForm.quantity,
      unitPrice: buyForm.unitPrice
    })
    ElMessage.success('求购订单发布成功！')
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
    await fetchInventory()
  } catch {
  } finally {
    collectLoading.value = null
  }
}

async function handleCancel(order) {
  try {
    await ElMessageBox.confirm(
      '确定下架该订单？剩余冻结的金币将退还',
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
    ElMessage.success('已下架，剩余金币已退还')
    await fetchOrders()
    await fetchPlayerInfo()
    await fetchInventory()
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

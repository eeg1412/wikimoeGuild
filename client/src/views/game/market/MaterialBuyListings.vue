<template>
  <div>
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
          :class="order.isMine ? 'opacity-70' : ''"
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
                  <span
                    v-if="order.isMine"
                    class="text-xs text-yellow-500 font-normal ml-1"
                    >（我的）</span
                  >
                </p>
                <p class="text-sm text-gray-400">
                  单价 🪙 {{ formatNumberWithCommas(order.unitPrice) }} · 总价
                  🪙
                  {{ formatNumberWithCommas(order.quantity * order.unitPrice) }}
                </p>
                <p v-if="order.guildName" class="text-xs text-gray-400 mt-0.5">
                  {{ order.guildName }}
                </p>
              </div>
            </div>
            <div class="flex flex-col items-end gap-1">
              <el-button
                v-if="!order.isMine"
                type="primary"
                size="small"
                :loading="fulfillLoading === order._id"
                :disabled="!!fulfillLoading"
                @click="openFulfillDialog(order)"
              >
                出售
              </el-button>
              <span v-else class="text-xs text-gray-400">我的订单</span>
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

    <!-- 出售确认弹窗 -->
    <el-dialog
      v-model="fulfillDialogVisible"
      title="出售素材"
      width="340px"
      align-center
      destroy-on-close
      :close-on-click-modal="!fulfillLoading"
      :close-on-press-escape="!fulfillLoading"
      :show-close="!fulfillLoading"
      append-to-body
    >
      <div v-if="fulfillDialogOrder" class="space-y-3">
        <div class="text-sm text-gray-600 dark:text-gray-300">
          {{ getMaterialName(fulfillDialogOrder.materialType) }}
          单价 🪙 {{ formatNumberWithCommas(fulfillDialogOrder.unitPrice) }} ·
          需求 x{{ fulfillDialogOrder.quantity }}
        </div>
        <div class="flex items-center gap-2">
          <span class="text-sm text-gray-500">数量:</span>
          <el-input-number
            v-model="fulfillQty"
            :min="1"
            :max="fulfillDialogOrder.quantity"
            size="small"
            class="flex-1"
          />
          <el-button text size="small" @click="handleFulfillSetMax"
            >全部</el-button
          >
        </div>
        <div class="text-sm text-gray-400">
          将获得:
          <span class="text-yellow-500 font-semibold"
            >🪙
            {{
              formatNumberWithCommas(fulfillQty * fulfillDialogOrder.unitPrice)
            }}</span
          >
        </div>
      </div>
      <template #footer>
        <el-button size="small" @click="handleCloseFulfillDialog"
          >取消</el-button
        >
        <el-button
          type="primary"
          size="small"
          :loading="!!fulfillLoading"
          :disabled="!!fulfillLoading"
          @click="handleFulfillOrder"
        >
          确认出售
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, inject, watch, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import {
  listMaterialBuyOrdersApi,
  fulfillMaterialBuyOrderApi
} from '@/api/game/market.js'
import { useGameUser } from '@/composables/useGameUser.js'
import { useDialogRoute } from '@/composables/useDialogRoute.js'
import {
  getMaterialIcon,
  getMaterialName
} from '@/composables/useMarketUtils.js'
import { formatNumberWithCommas } from 'shared/utils/utils.js'

const { fetchPlayerInfo } = useGameUser()
const materialFilter = inject('materialFilter')
const materialFilterVersion = inject('materialFilterVersion')

const orders = ref([])
const ordersLoading = ref(false)
const ordersTotal = ref(0)
const page = ref(1)
const pageSize = 20
const fulfillLoading = ref(null)

const { visible: fulfillDialogVisible } = useDialogRoute('fulfillBuyDialog')
const fulfillDialogOrder = ref(null)
const fulfillQty = ref(1)

watch(materialFilterVersion, () => {
  page.value = 1
  fetchOrders()
})

async function fetchOrders() {
  ordersLoading.value = true
  try {
    const params = { page: page.value, pageSize }
    if (materialFilter.value) {
      params.materialType = materialFilter.value
    }
    const res = await listMaterialBuyOrdersApi(params)
    orders.value = res.data.data?.list || []
    ordersTotal.value = res.data.data?.total || 0
  } catch {
    orders.value = []
  } finally {
    ordersLoading.value = false
  }
}

function openFulfillDialog(order) {
  fulfillDialogOrder.value = order
  fulfillQty.value = order.quantity
  fulfillDialogVisible.value = true
}

function handleCloseFulfillDialog() {
  fulfillDialogVisible.value = false
}

function handleFulfillSetMax() {
  if (fulfillDialogOrder.value) {
    fulfillQty.value = fulfillDialogOrder.value.quantity
  }
}

async function handleFulfillOrder() {
  const order = fulfillDialogOrder.value
  if (!order) return

  fulfillLoading.value = order._id
  try {
    await fulfillMaterialBuyOrderApi(order._id, {
      quantity: fulfillQty.value
    })
    ElMessage.success({ message: '出售成功！', showClose: true })
    fulfillDialogVisible.value = false
    await fetchOrders()
    await fetchPlayerInfo()
  } catch {
  } finally {
    fulfillLoading.value = null
  }
}

onMounted(() => {
  fetchOrders()
})
</script>

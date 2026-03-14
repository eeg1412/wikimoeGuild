<template>
  <div>
    <div v-if="myListingsLoading" class="flex justify-center py-8">
      <span class="animate-spin inline-block text-2xl">⏳</span>
    </div>
    <template v-else>
      <RuneStoneMarketList
        :items="myListings"
        :loading="false"
        mode="nested"
        empty-text="暂无上架中的符文石"
      >
        <template #extra="{ item }">
          <div class="text-right mr-1">
            <p class="text-sm text-yellow-500 font-semibold whitespace-nowrap">
              🪙 {{ formatNumberWithCommas(item.price) }}
            </p>
            <!-- 状态显示 -->
            <p class="text-xs mt-0.5">
              <template v-if="item.status === 'active'">
                <span class="text-green-500">上架中</span>
              </template>
              <template v-else-if="item.status === 'completed'">
                <span class="text-blue-500">已售出</span>
              </template>
            </p>
            <!-- 待收取提示 -->
            <p
              v-if="item.pendingGold > 0"
              class="text-xs text-yellow-500 mt-0.5 whitespace-nowrap"
            >
              💰 待收取: 🪙 {{ formatNumberWithCommas(item.pendingGold) }}
            </p>
          </div>
        </template>
        <template #action="{ item }">
          <!-- 收取按钮 -->
          <el-button
            v-if="item.pendingGold > 0"
            type="success"
            size="small"
            :loading="collectRsLoading === item._id"
            :disabled="!!collectRsLoading"
            @click="handleCollectListing(item)"
          >
            收取
          </el-button>
          <!-- 下架按钮 -->
          <el-button
            v-if="item.status === 'active'"
            type="danger"
            text
            size="small"
            :loading="cancelRsLoading === item._id"
            :disabled="!!cancelRsLoading"
            @click="handleCancelListing(item)"
          >
            下架
          </el-button>
        </template>
      </RuneStoneMarketList>

      <!-- 分页 -->
      <div v-if="myListingsTotal > pageSize" class="flex justify-center mt-4">
        <el-pagination
          v-model:current-page="page"
          :page-size="pageSize"
          :total="myListingsTotal"
          layout="prev, pager, next"
          size="small"
          @current-change="fetchMyListings"
        />
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, inject, watch, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  listMyRuneStoneListingsApi,
  cancelRuneStoneListingApi,
  collectRuneStoneListingApi
} from '@/api/game/market.js'
import { useGameUser } from '@/composables/useGameUser.js'
import RuneStoneMarketList from '@/components/RuneStoneMarketList.vue'
import { formatNumberWithCommas } from 'shared/utils/utils.js'

const { fetchPlayerInfo } = useGameUser()
const rarityFilter = inject('runeStoneRarityFilter')

const myListings = ref([])
const myListingsLoading = ref(false)
const myListingsTotal = ref(0)
const page = ref(1)
const pageSize = 20
const cancelRsLoading = ref(null)
const collectRsLoading = ref(null)

watch(rarityFilter, () => {
  page.value = 1
  fetchMyListings()
})

async function fetchMyListings() {
  myListingsLoading.value = true
  try {
    const params = {
      page: page.value,
      pageSize
    }
    if (rarityFilter.value) {
      params.rarity = rarityFilter.value
    }
    const res = await listMyRuneStoneListingsApi(params)
    let list = (res.data.data?.list || []).map(l => ({
      ...l,
      isMine: true
    }))
    // 客户端筛选稀有度（如果后端不支持）
    if (rarityFilter.value) {
      list = list.filter(l => l.runeStone?.rarity === rarityFilter.value)
    }
    // 过滤：显示上架中 + 有待收取金币的已完成订单
    list = list.filter(
      l =>
        l.status === 'active' || (l.status === 'completed' && l.pendingGold > 0)
    )
    myListings.value = list
    myListingsTotal.value = res.data.data?.total || 0
  } catch {
    myListings.value = []
  } finally {
    myListingsLoading.value = false
  }
}

async function handleCollectListing(listing) {
  collectRsLoading.value = listing._id
  try {
    await collectRuneStoneListingApi(listing._id)
    ElMessage.success({ message: '收取成功！', showClose: true })
    await fetchMyListings()
    await fetchPlayerInfo()
  } catch {
  } finally {
    collectRsLoading.value = null
  }
}

async function handleCancelListing(listing) {
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
    ElMessage.success({ message: '已下架，符文石已退还', showClose: true })
    await fetchMyListings()
  } catch {
  } finally {
    cancelRsLoading.value = null
  }
}

onMounted(() => {
  fetchMyListings()
})
</script>

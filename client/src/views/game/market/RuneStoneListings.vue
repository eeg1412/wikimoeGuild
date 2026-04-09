<template>
  <div>
    <div v-if="listingsLoading" class="flex justify-center py-8">
      <span class="animate-spin inline-block text-2xl">⏳</span>
    </div>
    <template v-else>
      <RuneStoneMarketList
        :items="listings"
        :loading="false"
        mode="nested"
        empty-text="暂无符文石上架"
        :item-class="item => (item.isMine ? 'opacity-70' : '')"
      >
        <template #extra="{ item }">
          <div class="text-right mr-1">
            <p class="text-sm text-yellow-500 font-semibold whitespace-nowrap">
              🪙 {{ formatNumberWithCommas(item.price) }}
            </p>
            <p v-if="item.isMine" class="text-xs text-yellow-500">（我的）</p>
            <p v-else-if="item.guildName" class="text-xs text-gray-400">
              {{ item.guildName }}
            </p>
          </div>
        </template>
        <template #action="{ item }">
          <el-button
            v-if="!item.isMine"
            type="primary"
            size="small"
            :loading="buyRsLoading === item._id"
            :disabled="!!buyRsLoading"
            @click="handleBuyRuneStone(item)"
          >
            购买
          </el-button>
          <span v-else class="text-xs text-gray-400">我的上架</span>
        </template>
      </RuneStoneMarketList>

      <!-- 分页 -->
      <div v-if="listingsTotal > pageSize" class="flex justify-center mt-4">
        <el-pagination
          v-model:current-page="page"
          :page-size="pageSize"
          :total="listingsTotal"
          layout="prev, pager, next"
          size="small"
          @current-change="fetchListings"
        />
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, inject, watch, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  listRuneStoneListingsApi,
  buyRuneStoneListingApi
} from '@/api/game/market.js'
import { useGameUser } from '@/composables/useGameUser.js'
import RuneStoneMarketList from '@/components/RuneStoneMarketList.vue'
import { rarityName } from '@/composables/useMarketUtils.js'
import { formatNumberWithCommas } from 'shared/utils/utils.js'

const { fetchPlayerInfo } = useGameUser()
const rarityFilter = inject('runeStoneRarityFilter')

const listings = ref([])
const listingsLoading = ref(false)
const listingsTotal = ref(0)
const page = ref(1)
const pageSize = 20
const buyRsLoading = ref(null)

watch(rarityFilter, () => {
  page.value = 1
  fetchListings()
})

async function fetchListings() {
  listingsLoading.value = true
  try {
    const params = { page: page.value, pageSize }
    if (rarityFilter.value) {
      params.rarity = rarityFilter.value
    }
    const res = await listRuneStoneListingsApi(params)
    listings.value = res.data.data?.list || []
    listingsTotal.value = res.data.data?.total || 0
  } catch {
    listings.value = []
  } finally {
    listingsLoading.value = false
  }
}

async function handleBuyRuneStone(listing) {
  try {
    await ElMessageBox.confirm(
      `确定购买这个${rarityName(listing.runeStone?.rarity)}符文石？花费 ${formatNumberWithCommas(listing.price)} 金币`,
      '确认购买',
      { confirmButtonText: '购买', cancelButtonText: '取消' }
    )
  } catch {
    return
  }

  buyRsLoading.value = listing._id
  try {
    await buyRuneStoneListingApi(listing._id)
    ElMessage.success({ message: '购买成功！', showClose: true })
    await fetchListings()
    await fetchPlayerInfo()
  } catch {
  } finally {
    buyRsLoading.value = null
  }
}

onMounted(() => {
  fetchListings()
})
</script>

<template>
  <div>
    <!-- 二级标签 -->
    <div class="flex justify-center gap-2 mb-4">
      <el-button
        :type="activeSubTab === 'listings' ? 'primary' : 'default'"
        size="small"
        @click="navigateToSubTab('GameMarketRuneStoneListings')"
      >
        贩卖中
      </el-button>
      <el-button
        :type="activeSubTab === 'myListed' ? 'success' : 'default'"
        size="small"
        @click="navigateToSubTab('GameMarketRuneStoneMyListed')"
      >
        上架中
      </el-button>
      <el-button
        :type="activeSubTab === 'myUnlisted' ? 'info' : 'default'"
        size="small"
        @click="navigateToSubTab('GameMarketRuneStoneMyUnlisted')"
      >
        未上架
      </el-button>
    </div>

    <!-- 稀有度筛选（贯穿所有子页面） -->
    <div class="flex items-center gap-2 mb-3">
      <el-select
        v-model="rarityFilter"
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

    <router-view />
  </div>
</template>

<script setup>
import { ref, computed, provide } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

// 共享稀有度筛选（贯穿所有子页面）
const rarityFilter = ref('')
provide('runeStoneRarityFilter', rarityFilter)

const activeSubTab = computed(() => {
  const name = String(route.name || '')
  if (name === 'GameMarketRuneStoneListings') return 'listings'
  if (name === 'GameMarketRuneStoneMyListed') return 'myListed'
  if (name === 'GameMarketRuneStoneMyUnlisted') return 'myUnlisted'
  return 'listings'
})

function navigateToSubTab(routeName) {
  if (route.name !== routeName) {
    router.push({ name: routeName })
  }
}
</script>

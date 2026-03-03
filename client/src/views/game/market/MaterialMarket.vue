<template>
  <div>
    <!-- 二级标签 -->
    <div class="flex justify-center gap-2 mb-4 flex-wrap">
      <el-button
        :type="activeSubTab === 'sellListings' ? 'primary' : 'default'"
        size="small"
        @click="navigateToSubTab('GameMarketMaterialSellListings')"
      >
        贩卖中
      </el-button>
      <el-button
        :type="activeSubTab === 'buyListings' ? 'primary' : 'default'"
        size="small"
        @click="navigateToSubTab('GameMarketMaterialBuyListings')"
      >
        求购中
      </el-button>
      <el-button
        :type="activeSubTab === 'mySell' ? 'warning' : 'default'"
        size="small"
        @click="navigateToSubTab('GameMarketMaterialMySell')"
      >
        发布出售
      </el-button>
      <el-button
        :type="activeSubTab === 'myBuy' ? 'warning' : 'default'"
        size="small"
        @click="navigateToSubTab('GameMarketMaterialMyBuy')"
      >
        发布求购
      </el-button>
    </div>

    <!-- 筛选面板（贩卖中/求购中页面共享） -->
    <div
      v-if="activeSubTab === 'sellListings' || activeSubTab === 'buyListings'"
      class="flex items-center gap-2 mb-3"
    >
      <el-select
        v-model="materialFilter"
        placeholder="材料类型"
        clearable
        size="small"
        class="w-32!"
        @change="handleFilterChange"
      >
        <el-option
          v-for="m in materialTypes"
          :key="m.key"
          :label="`${m.icon} ${m.name}`"
          :value="m.key"
        />
      </el-select>
    </div>

    <router-view />
  </div>
</template>

<script setup>
import { ref, computed, provide } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { materialTypes } from '@/composables/useMarketUtils.js'

const route = useRoute()
const router = useRouter()

// 共享素材类型筛选
const materialFilter = ref('')
const filterVersion = ref(0)
provide('materialFilter', materialFilter)
provide('materialFilterVersion', filterVersion)

const activeSubTab = computed(() => {
  const name = String(route.name || '')
  if (name === 'GameMarketMaterialSellListings') return 'sellListings'
  if (name === 'GameMarketMaterialBuyListings') return 'buyListings'
  if (name === 'GameMarketMaterialMySell') return 'mySell'
  if (name === 'GameMarketMaterialMyBuy') return 'myBuy'
  return 'sellListings'
})

function navigateToSubTab(routeName) {
  if (route.name !== routeName) {
    router.push({ name: routeName })
  }
}

function handleFilterChange() {
  filterVersion.value++
}
</script>

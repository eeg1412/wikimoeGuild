<template>
  <div>
    <div class="mb-4">
      <h2 class="text-xl font-semibold dark:text-gray-100">官方市场库存管理</h2>
    </div>

    <el-card shadow="never">
      <el-form
        :model="stockForm"
        label-width="170px"
        @submit.prevent="handleStockSubmit"
      >
        <el-divider content-position="left">📦 库存设置</el-divider>

        <el-form-item label="攻击水晶库存">
          <el-input-number
            v-model="stockForm.attackCrystal"
            :min="0"
            :max="2000000000"
            :step="100"
            controls-position="right"
          />
        </el-form-item>

        <el-form-item label="防御水晶库存">
          <el-input-number
            v-model="stockForm.defenseCrystal"
            :min="0"
            :max="2000000000"
            :step="100"
            controls-position="right"
          />
        </el-form-item>

        <el-form-item label="速度水晶库存">
          <el-input-number
            v-model="stockForm.speedCrystal"
            :min="0"
            :max="2000000000"
            :step="100"
            controls-position="right"
          />
        </el-form-item>

        <el-form-item label="SAN值水晶库存">
          <el-input-number
            v-model="stockForm.sanCrystal"
            :min="0"
            :max="2000000000"
            :step="100"
            controls-position="right"
          />
        </el-form-item>

        <el-form-item label="符文石碎片库存">
          <el-input-number
            v-model="stockForm.runeFragment"
            :min="0"
            :max="2000000000"
            :step="100"
            controls-position="right"
          />
        </el-form-item>

        <el-form-item>
          <el-button
            type="primary"
            :loading="stockSubmitting"
            :disabled="stockSubmitting"
            @click="handleStockSubmit"
          >
            保存库存
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import {
  getOfficialMarketStockApi,
  updateOfficialMarketStockApi
} from '@/api/admin/globalConfig'

const stockSubmitting = ref(false)
const stockForm = reactive({
  attackCrystal: 0,
  defenseCrystal: 0,
  speedCrystal: 0,
  sanCrystal: 0,
  runeFragment: 0
})

async function loadStock() {
  try {
    const res = await getOfficialMarketStockApi()
    const data = res.data?.data || {}
    Object.assign(stockForm, {
      attackCrystal: data.attackCrystal ?? 0,
      defenseCrystal: data.defenseCrystal ?? 0,
      speedCrystal: data.speedCrystal ?? 0,
      sanCrystal: data.sanCrystal ?? 0,
      runeFragment: data.runeFragment ?? 0
    })
  } catch {
    ElMessage.error('加载官方市场库存失败')
  }
}

async function handleStockSubmit() {
  if (stockSubmitting.value) return
  stockSubmitting.value = true
  try {
    await updateOfficialMarketStockApi({ ...stockForm })
    ElMessage.success('官方市场库存已保存')
  } catch (e) {
    ElMessage.error(e.response?.data?.message || '保存库存失败')
  } finally {
    stockSubmitting.value = false
  }
}

onMounted(() => {
  loadStock()
})
</script>

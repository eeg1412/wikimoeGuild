<template>
  <div class="space-y-4">
    <el-form
      :model="form"
      :rules="rules"
      label-width="170px"
      @submit.prevent="handleSubmit"
    >
      <el-divider content-position="left">💰 冒险家价格</el-divider>

      <el-form-item label="招募价格（金币）" prop="adventurerRecruitPrice">
        <el-input-number
          v-model="form.adventurerRecruitPrice"
          :min="0"
          :max="2000000000"
          :step="1000"
          controls-position="right"
        />
      </el-form-item>

      <el-form-item label="自定义头像价格" prop="adventurerCustomAvatarPrice">
        <el-input-number
          v-model="form.adventurerCustomAvatarPrice"
          :min="0"
          :max="2000000000"
          :step="500"
          controls-position="right"
        />
      </el-form-item>

      <el-form-item label="自定义名字价格" prop="adventurerCustomNamePrice">
        <el-input-number
          v-model="form.adventurerCustomNamePrice"
          :min="0"
          :max="2000000000"
          :step="100"
          controls-position="right"
        />
      </el-form-item>

      <el-divider content-position="left">✨ 符文石掉率</el-divider>

      <el-form-item label="符文石掉率" prop="runeStoneDropRate">
        <el-input-number
          v-model="form.runeStoneDropRate"
          :min="0"
          :max="10000"
          :step="10"
          controls-position="right"
        />
        <span class="ml-2 text-gray-400 text-sm">/ 10000</span>
      </el-form-item>

      <el-form-item label="普通符文石概率" prop="normalRuneStoneRate">
        <el-input-number
          v-model="form.normalRuneStoneRate"
          :min="0"
          :max="10000"
          :step="100"
          controls-position="right"
        />
        <span class="ml-2 text-gray-400 text-sm">/ 10000</span>
      </el-form-item>

      <el-form-item label="稀有符文石概率" prop="rareRuneStoneRate">
        <el-input-number
          v-model="form.rareRuneStoneRate"
          :min="0"
          :max="10000"
          :step="100"
          controls-position="right"
        />
        <span class="ml-2 text-gray-400 text-sm">/ 10000</span>
      </el-form-item>

      <el-form-item label="传说符文石概率" prop="legendaryRuneStoneRate">
        <el-input-number
          v-model="form.legendaryRuneStoneRate"
          :min="0"
          :max="10000"
          :step="100"
          controls-position="right"
        />
        <span class="ml-2 text-gray-400 text-sm">/ 10000</span>
      </el-form-item>

      <el-form-item>
        <div class="flex items-center gap-3">
          <span
            class="text-sm"
            :class="
              rateTotal > 10000 ? 'text-red-500 font-bold' : 'text-gray-400'
            "
          >
            三种概率合计: {{ rateTotal }} / 10000
          </span>
        </div>
      </el-form-item>

      <el-divider content-position="left">🏪 交易市场</el-divider>

      <el-form-item label="官方水晶收购单价" prop="officialCrystalBuyPrice">
        <el-input-number
          v-model="form.officialCrystalBuyPrice"
          :min="1"
          :max="2000000000"
          :step="100"
          controls-position="right"
        />
        <span class="ml-2 text-gray-400 text-sm">金币/个</span>
      </el-form-item>

      <el-form-item label="官方水晶出售单价" prop="officialCrystalSellPrice">
        <el-input-number
          v-model="form.officialCrystalSellPrice"
          :min="1"
          :max="2000000000"
          :step="1000"
          controls-position="right"
        />
        <span class="ml-2 text-gray-400 text-sm">金币/个</span>
      </el-form-item>

      <el-form-item label="自由市场素材最低价" prop="freeMarketMinPrice">
        <el-input-number
          v-model="form.freeMarketMinPrice"
          :min="1"
          :max="2000000000"
          :step="100"
          controls-position="right"
        />
      </el-form-item>

      <el-form-item label="符文石最低上架价" prop="freeMarketRuneStoneMinPrice">
        <el-input-number
          v-model="form.freeMarketRuneStoneMinPrice"
          :min="1"
          :max="2000000000"
          :step="100"
          controls-position="right"
        />
      </el-form-item>

      <el-divider content-position="left">⚔️ 竞技场</el-divider>

      <el-form-item label="奖池金额" prop="arenaPoolAmount">
        <el-input-number
          v-model="form.arenaPoolAmount"
          :min="0"
          :max="2000000000"
          :step="10000"
          controls-position="right"
        />
      </el-form-item>

      <el-form-item label="参与奖奖金" prop="arenaParticipationReward">
        <el-input-number
          v-model="form.arenaParticipationReward"
          :min="0"
          :max="2000000000"
          :step="100"
          controls-position="right"
        />
        <span class="ml-2 text-gray-400 text-sm">24场后可领</span>
      </el-form-item>

      <el-form-item label="每战获得金币" prop="arenaBattleGold">
        <el-input-number
          v-model="form.arenaBattleGold"
          :min="0"
          :max="2000000000"
          :step="10"
          controls-position="right"
        />
      </el-form-item>

      <el-form-item label="赛季持续天数" prop="seasonDays">
        <el-input-number
          v-model="form.seasonDays"
          :min="3"
          :max="365"
          :step="1"
          controls-position="right"
        />
        <span class="ml-2 text-gray-400 text-sm">最少3天</span>
      </el-form-item>

      <el-form-item>
        <el-button
          type="primary"
          :loading="submitting"
          :disabled="submitting || rateTotal > 10000"
          @click="handleSubmit"
        >
          保存配置
        </el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import {
  getGameSettingsApi,
  updateGameSettingsApi
} from '@/api/admin/globalConfig'

const submitting = ref(false)

const form = reactive({
  adventurerRecruitPrice: 10000,
  adventurerCustomAvatarPrice: 5000,
  adventurerCustomNamePrice: 1000,
  runeStoneDropRate: 100,
  normalRuneStoneRate: 8000,
  rareRuneStoneRate: 1500,
  legendaryRuneStoneRate: 500,
  officialCrystalBuyPrice: 100,
  officialCrystalSellPrice: 10000,
  freeMarketMinPrice: 100,
  freeMarketRuneStoneMinPrice: 100,
  arenaPoolAmount: 100000,
  arenaParticipationReward: 500,
  arenaBattleGold: 50,
  seasonDays: 3
})

const rateTotal = computed(() => {
  return (
    (form.normalRuneStoneRate || 0) +
    (form.rareRuneStoneRate || 0) +
    (form.legendaryRuneStoneRate || 0)
  )
})

const rules = {
  adventurerRecruitPrice: [
    { required: true, message: '请填写招募价格', trigger: 'blur' }
  ],
  runeStoneDropRate: [
    { required: true, message: '请填写掉率', trigger: 'blur' }
  ]
}

async function loadGameSettings() {
  try {
    const res = await getGameSettingsApi()
    const data = res.data?.data || {}
    Object.assign(form, data)
  } catch (e) {
    ElMessage.error('加载游戏设置失败')
  }
}

onMounted(() => {
  loadGameSettings()
})

async function handleSubmit() {
  if (submitting.value) return
  if (rateTotal.value > 10000) {
    ElMessage.error('三种符文石概率加起来不得超过10000')
    return
  }
  submitting.value = true
  try {
    await updateGameSettingsApi({ ...form })
    ElMessage.success('游戏设置已保存')
  } catch (e) {
    ElMessage.error(e.response?.data?.message || '保存失败')
  } finally {
    submitting.value = false
  }
}
</script>

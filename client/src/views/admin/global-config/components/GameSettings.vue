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

      <el-form-item
        label="官方普通符文石收购价"
        prop="officialNormalRuneStoneBuyPrice"
      >
        <el-input-number
          v-model="form.officialNormalRuneStoneBuyPrice"
          :min="1"
          :max="2000000000"
          :step="100"
          controls-position="right"
        />
        <span class="ml-2 text-gray-400 text-sm">金币/个</span>
      </el-form-item>

      <el-form-item
        label="官方稀有符文石收购价"
        prop="officialRareRuneStoneBuyPrice"
      >
        <el-input-number
          v-model="form.officialRareRuneStoneBuyPrice"
          :min="1"
          :max="2000000000"
          :step="100"
          controls-position="right"
        />
        <span class="ml-2 text-gray-400 text-sm">金币/个</span>
      </el-form-item>

      <el-form-item
        label="官方传说符文石收购价"
        prop="officialLegendaryRuneStoneBuyPrice"
      >
        <el-input-number
          v-model="form.officialLegendaryRuneStoneBuyPrice"
          :min="1"
          :max="2000000000"
          :step="100"
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

      <el-form-item
        label="官方符文石碎片收购价"
        prop="officialRuneFragmentBuyPrice"
      >
        <el-input-number
          v-model="form.officialRuneFragmentBuyPrice"
          :min="1"
          :max="2000000000"
          :step="10"
          controls-position="right"
        />
        <span class="ml-2 text-gray-400 text-sm">金币/个</span>
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

      <el-divider content-position="left">⚔️ 冒险家升级基础值</el-divider>

      <el-form-item label="升级水晶基础值" prop="adventurerLevelUpCrystalBase">
        <el-input-number
          v-model="form.adventurerLevelUpCrystalBase"
          :min="1"
          :max="2000000000"
          :step="10"
          controls-position="right"
        />
        <span class="ml-2 text-gray-400 text-sm">默认100</span>
      </el-form-item>

      <el-form-item label="升级金币基础值" prop="adventurerLevelUpGoldBase">
        <el-input-number
          v-model="form.adventurerLevelUpGoldBase"
          :min="1"
          :max="2000000000"
          :step="50"
          controls-position="right"
        />
        <span class="ml-2 text-gray-400 text-sm">默认500</span>
      </el-form-item>

      <el-form-item label="降级金币价格" prop="adventurerLevelDownGoldPrice">
        <el-input-number
          v-model="form.adventurerLevelDownGoldPrice"
          :min="0"
          :max="2000000000"
          :step="100"
          controls-position="right"
        />
        <span class="ml-2 text-gray-400 text-sm">默认1000（每降1级）</span>
      </el-form-item>

      <el-divider content-position="left">🏰 公会设置</el-divider>

      <el-form-item label="公会升级费用基础值" prop="guildLevelUpFeeBase">
        <el-input-number
          v-model="form.guildLevelUpFeeBase"
          :min="1"
          :max="2000000000"
          :step="100"
          controls-position="right"
        />
        <span class="ml-2 text-gray-400 text-sm">默认1000</span>
      </el-form-item>

      <el-form-item label="公会标志价格（金币）" prop="guildCustomLogoPrice">
        <el-input-number
          v-model="form.guildCustomLogoPrice"
          :min="0"
          :max="2000000000"
          :step="500"
          controls-position="right"
        />
      </el-form-item>

      <el-form-item label="公会改名价格（金币）" prop="guildChangeNamePrice">
        <el-input-number
          v-model="form.guildChangeNamePrice"
          :min="0"
          :max="2000000000"
          :step="100"
          controls-position="right"
        />
      </el-form-item>

      <el-divider content-position="left">� 冒险家洗属性</el-divider>

      <el-form-item
        label="洗元素价格（金币）"
        prop="adventurerRerollElementPrice"
      >
        <el-input-number
          v-model="form.adventurerRerollElementPrice"
          :min="0"
          :max="2000000000"
          :step="100"
          controls-position="right"
        />
      </el-form-item>

      <el-form-item
        label="洗被动增益价格（金币）"
        prop="adventurerRerollPassiveBuffPrice"
      >
        <el-input-number
          v-model="form.adventurerRerollPassiveBuffPrice"
          :min="0"
          :max="2000000000"
          :step="100"
          controls-position="right"
        />
      </el-form-item>

      <el-form-item
        label="洗攻击偏好价格（金币）"
        prop="adventurerRerollAttackPreferencePrice"
      >
        <el-input-number
          v-model="form.adventurerRerollAttackPreferencePrice"
          :min="0"
          :max="2000000000"
          :step="100"
          controls-position="right"
        />
      </el-form-item>
      <el-divider content-position="left">🎮 迷宫设置</el-divider>

      <el-form-item
        label="迷宫等级增益基础值"
        prop="dungeonLevelProductionBonusBase"
      >
        <el-input-number
          v-model="form.dungeonLevelProductionBonusBase"
          :min="1"
          :max="2000000000"
          :step="10"
          controls-position="right"
        />
        <span class="ml-2 text-gray-400 text-sm">默认100</span>
      </el-form-item>
      <el-divider content-position="left">🎮 游客模式</el-divider>

      <el-form-item label="启用游客模式" prop="guestModeEnabled">
        <el-switch v-model="form.guestModeEnabled" />
        <span class="ml-2 text-gray-400 text-sm">
          {{ form.guestModeEnabled ? '已开启' : '已关闭' }}
        </span>
      </el-form-item>

      <el-form-item label="每IP每日游客上限" prop="guestMaxPerIpPerDay">
        <el-input-number
          v-model="form.guestMaxPerIpPerDay"
          :min="1"
          :max="100"
          :step="1"
          controls-position="right"
        />
        <span class="ml-2 text-gray-400 text-sm">次/天</span>
      </el-form-item>

      <el-form-item label="每24小时游客注册上限" prop="dailyGuestRegisterLimit">
        <el-input-number
          v-model="form.dailyGuestRegisterLimit"
          :min="1"
          :max="100000"
          :step="10"
          controls-position="right"
        />
        <span class="ml-2 text-gray-400 text-sm">次/24小时</span>
      </el-form-item>

      <el-divider content-position="left">✉️ 邮件限制</el-divider>

      <el-form-item label="每24小时邮件发送上限" prop="dailyEmailLimit">
        <el-input-number
          v-model="form.dailyEmailLimit"
          :min="1"
          :max="100000"
          :step="50"
          controls-position="right"
        />
        <span class="ml-2 text-gray-400 text-sm">封/24小时</span>
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
  officialNormalRuneStoneBuyPrice: 100,
  officialRareRuneStoneBuyPrice: 400,
  officialLegendaryRuneStoneBuyPrice: 2000,
  freeMarketMinPrice: 100,
  freeMarketRuneStoneMinPrice: 100,
  arenaPoolAmount: 100000,
  arenaParticipationReward: 500,
  arenaBattleGold: 50,
  seasonDays: 3,
  guildCustomLogoPrice: 5000,
  guildChangeNamePrice: 1000,
  adventurerRerollElementPrice: 1000,
  adventurerRerollPassiveBuffPrice: 1000,
  adventurerRerollAttackPreferencePrice: 1000,
  guildLevelUpFeeBase: 1000,
  adventurerLevelUpCrystalBase: 100,
  adventurerLevelUpGoldBase: 500,
  adventurerLevelDownGoldPrice: 1000,
  dungeonLevelProductionBonusBase: 100,
  guestModeEnabled: true,
  guestMaxPerIpPerDay: 3,
  dailyEmailLimit: 500,
  dailyGuestRegisterLimit: 200,
  officialRuneFragmentBuyPrice: 10
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
    ElMessage.error({ message: '加载游戏设置失败', showClose: true })
  }
}

onMounted(() => {
  loadGameSettings()
})

async function handleSubmit() {
  if (submitting.value) return
  if (rateTotal.value > 10000) {
    ElMessage.error({ message: '三种符文石概率加起来不得超过10000', showClose: true })
    return
  }
  submitting.value = true
  try {
    await updateGameSettingsApi({ ...form })
    ElMessage.success({ message: '游戏设置已保存', showClose: true })
  } catch (e) {
    ElMessage.error({ message: e.response?.data?.message || '保存失败', showClose: true })
  } finally {
    submitting.value = false
  }
}
</script>

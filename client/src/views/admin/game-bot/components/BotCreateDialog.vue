<template>
  <el-dialog
    v-model="dialogVisible"
    title="创建机器人"
    width="600px"
    :close-on-click-modal="!loading"
    :close-on-press-escape="!loading"
    :show-close="!loading"
    destroy-on-close
    append-to-body
    align-center
  >
    <el-form :model="createForm" label-width="120px">
      <el-form-item label="状态">
        <el-switch
          v-model="createForm.isActive"
          active-text="活跃"
          inactive-text="停用"
        />
      </el-form-item>
      <el-form-item label="阵容倾向">
        <el-select v-model="createForm.formationTendency" style="width: 100%">
          <el-option label="均衡型" value="balanced" />
          <el-option label="攻击型" value="aggressive" />
          <el-option label="防御型" value="defensive" />
          <el-option label="刺客型" value="assassin" />
        </el-select>
        <div class="text-xs text-gray-400 mt-1">
          决定冒险家角色分配：攻击型=1排坦克+4排输出；防御型=3排坦克+2排输出；均衡型=2排坦克+1排平衡+1排刺客+1排输出；刺客型=1排坦克+4排刺客。
        </div>
      </el-form-item>
      <el-divider content-position="left">行为权重 (0-100)</el-divider>
      <div class="text-xs text-gray-400 mb-3 px-4">
        权重决定每项行动的执行概率，数值越高越可能执行。
        <br />
        <span class="text-blue-400"
          >注：收获水晶、卖水晶、招募冒险家、升级属性、公会升级
          已成为共通行动，每次都会自动执行。</span
        >
      </div>
      <div class="mb-3 px-4 flex flex-wrap gap-2">
        <el-button
          v-for="(_, name) in weightPresets"
          :key="name"
          size="small"
          @click="applyWeightPreset(name)"
        >
          {{ name }}
        </el-button>
      </div>
      <el-form-item
        v-for="weight in weightFields"
        :key="weight.key"
        :label="weight.label"
      >
        <el-slider
          v-model="createForm.behaviorWeights[weight.key]"
          :min="0"
          :max="100"
          show-input
          input-size="small"
        />
      </el-form-item>
      <el-divider content-position="left">市场交易设置</el-divider>
      <div class="text-xs text-gray-400 mb-3 px-4">
        机器人会智能计算升级所需的水晶保留量，多余的水晶将自动出售换取金币用于招募冒险家和公会升级。
      </div>
      <el-form-item label="水晶挂卖市场数">
        <el-input-number
          v-model="createForm.marketSettings.sellCrystals.maxMarketAmount"
          :min="0"
          :max="99999"
          :step="100"
          style="width: 100%"
        />
        <div class="text-xs text-gray-400 mt-1">
          每种水晶同时在自由市场最多挂卖此数量。超出部分会直接卖给官方。
          <br />
          设置为 0 则全部直接卖给官方（不挂单到市场）。
        </div>
      </el-form-item>
      <el-form-item label="出售符文石">
        <el-switch
          v-model="createForm.marketSettings.sellRuneStones.enabled"
          active-text="开启"
          inactive-text="关闭"
        />
      </el-form-item>
      <template v-if="createForm.marketSettings.sellRuneStones.enabled">
        <el-form-item label="最大挂卖数">
          <el-input-number
            v-model="createForm.marketSettings.sellRuneStones.maxAmount"
            :min="0"
            :max="100"
            :step="1"
            style="width: 100%"
          />
          <div class="text-xs text-gray-400 mt-1">
            同时挂卖的符文石数量上限，超出时下架低级替换高级的，低级卖官方。
          </div>
        </el-form-item>
        <el-form-item label="出售稀有度">
          <el-checkbox-group
            v-model="createForm.marketSettings.sellRuneStones.rarities"
          >
            <el-checkbox value="normal">普通</el-checkbox>
            <el-checkbox value="rare">稀有</el-checkbox>
            <el-checkbox value="legendary">传说</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
      </template>
      <el-divider content-position="left">水晶购买设置</el-divider>
      <el-form-item label="自动购买水晶">
        <el-switch
          v-model="createForm.marketSettings.buyCrystals.enabled"
          active-text="开启"
          inactive-text="关闭"
        />
        <div class="text-xs text-gray-400 mt-1">
          开启后机器人会使用余钱从玩家市场和官方市场购买短缺的水晶。
        </div>
      </el-form-item>
      <template v-if="createForm.marketSettings.buyCrystals.enabled">
        <el-form-item label="最高价比">
          <el-slider
            v-model="createForm.marketSettings.buyCrystals.maxPriceRatio"
            :min="0.1"
            :max="1.0"
            :step="0.1"
            :format-tooltip="val => `${Math.round(val * 100)}%`"
          />
          <div class="text-xs text-gray-400 mt-1">
            从玩家市场购买时可接受的最高单价（相对官方售价的比例）。
            <br />
            例如 100% 表示只要低于官方售价就购买，80% 表示只买不超过官方价格 80%
            的水晶。
          </div>
        </el-form-item>
      </template>
      <el-divider content-position="left">初始资源</el-divider>
      <el-form-item label="初始金币">
        <el-input-number
          v-model="createForm.initialGold"
          :min="0"
          :max="2000000000"
          :step="10000"
          style="width: 100%"
        />
      </el-form-item>
      <el-form-item label="攻击水晶">
        <el-input-number
          v-model="createForm.initialCrystals.attackCrystal"
          :min="0"
          :max="9999999"
          :step="100"
          style="width: 100%"
        />
      </el-form-item>
      <el-form-item label="防御水晶">
        <el-input-number
          v-model="createForm.initialCrystals.defenseCrystal"
          :min="0"
          :max="9999999"
          :step="100"
          style="width: 100%"
        />
      </el-form-item>
      <el-form-item label="速度水晶">
        <el-input-number
          v-model="createForm.initialCrystals.speedCrystal"
          :min="0"
          :max="9999999"
          :step="100"
          style="width: 100%"
        />
      </el-form-item>
      <el-form-item label="SAN水晶">
        <el-input-number
          v-model="createForm.initialCrystals.sanCrystal"
          :min="0"
          :max="9999999"
          :step="100"
          style="width: 100%"
        />
      </el-form-item>
      <el-form-item label="符文碎片">
        <el-input-number
          v-model="createForm.initialCrystals.runeFragment"
          :min="0"
          :max="9999999"
          :step="100"
          style="width: 100%"
        />
      </el-form-item>
      <el-form-item label="备注">
        <el-input
          v-model="createForm.note"
          type="textarea"
          :rows="2"
          maxlength="500"
        />
      </el-form-item>
      <el-divider content-position="left">活动时间设置</el-divider>
      <el-form-item label="限制活动时间">
        <el-switch
          v-model="createForm.activeTimeSettings.enabled"
          active-text="开启"
          inactive-text="关闭"
        />
        <div class="text-xs text-gray-400 mt-1">关闭后机器人将24小时活动。</div>
      </el-form-item>
      <template v-if="createForm.activeTimeSettings.enabled">
        <el-form-item label="活动时段">
          <div class="flex items-center gap-2 w-full">
            <el-input-number
              v-model="createForm.activeTimeSettings.startHour"
              :min="0"
              :max="23"
              :step="1"
              style="width: 120px"
            />
            <span>时 至</span>
            <el-input-number
              v-model="createForm.activeTimeSettings.endHour"
              :min="0"
              :max="23"
              :step="1"
              style="width: 120px"
            />
            <span>时</span>
          </div>
          <div class="text-xs text-gray-400 mt-1">
            机器人仅在此时段内执行行动。支持跨天设置（如22时至6时）。
          </div>
        </el-form-item>
      </template>
      <el-divider content-position="left">公会信息</el-divider>
      <el-form-item label="公会名">
        <div class="w-full">
          <el-input
            v-model="createForm.guildName"
            placeholder="留空则自动生成"
            maxlength="20"
          />
          <div class="text-xs text-gray-400 mt-1">
            留空时会自动生成唯一公会名。
          </div>
        </div>
      </el-form-item>
      <el-form-item label="公会图标">
        <div>
          <Cropper
            :src="createGuildIconBase64"
            :aspect-ratio="1"
            :width="200"
            :height="200"
            put-image-type="image/png"
            :put-image-quality="0.9"
            @crop="handleCreateGuildIconCrop"
          />
          <div class="text-xs text-gray-400 mt-2">
            留空则使用默认图标；裁剪后的图标会在点击底部“创建”后统一提交。
          </div>
        </div>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button :disabled="loading" @click="dialogVisible = false">
        取消
      </el-button>
      <el-button type="primary" :loading="loading" @click="handleCreate">
        创建
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import Cropper from '@/components/Cropper.vue'
import { createBotApi } from '@/api/admin/bot.js'
import {
  botWeightFields,
  botWeightPresets,
  buildBotSettingsPayload,
  createDefaultBotSettings
} from '@/views/admin/game-bot/botFormShared.js'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'created'])

const dialogVisible = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value)
})

const weightFields = botWeightFields
const weightPresets = botWeightPresets

const loading = ref(false)
const createGuildIconBase64 = ref('')
const createForm = reactive(createDefaultForm())

watch(
  () => props.modelValue,
  value => {
    if (value) resetCreateForm()
  }
)

function createDefaultForm() {
  return {
    ...createDefaultBotSettings(),
    guildName: '',
    initialGold: 0,
    initialCrystals: {
      attackCrystal: 0,
      defenseCrystal: 0,
      speedCrystal: 0,
      sanCrystal: 0,
      runeFragment: 0
    }
  }
}

function resetCreateForm() {
  const defaults = createDefaultForm()
  createForm.isActive = defaults.isActive
  createForm.formationTendency = defaults.formationTendency
  for (const field of weightFields) {
    createForm.behaviorWeights[field.key] = defaults.behaviorWeights[field.key]
  }
  createForm.marketSettings.sellCrystals.maxMarketAmount =
    defaults.marketSettings.sellCrystals.maxMarketAmount
  createForm.marketSettings.sellRuneStones.enabled =
    defaults.marketSettings.sellRuneStones.enabled
  createForm.marketSettings.sellRuneStones.maxAmount =
    defaults.marketSettings.sellRuneStones.maxAmount
  createForm.marketSettings.sellRuneStones.rarities = [
    ...defaults.marketSettings.sellRuneStones.rarities
  ]
  createForm.marketSettings.buyCrystals.enabled =
    defaults.marketSettings.buyCrystals.enabled
  createForm.marketSettings.buyCrystals.maxPriceRatio =
    defaults.marketSettings.buyCrystals.maxPriceRatio
  createForm.activeTimeSettings.enabled = defaults.activeTimeSettings.enabled
  createForm.activeTimeSettings.startHour =
    defaults.activeTimeSettings.startHour
  createForm.activeTimeSettings.endHour = defaults.activeTimeSettings.endHour
  createForm.guildName = defaults.guildName
  createForm.initialGold = defaults.initialGold
  createForm.initialCrystals.attackCrystal =
    defaults.initialCrystals.attackCrystal
  createForm.initialCrystals.defenseCrystal =
    defaults.initialCrystals.defenseCrystal
  createForm.initialCrystals.speedCrystal =
    defaults.initialCrystals.speedCrystal
  createForm.initialCrystals.sanCrystal = defaults.initialCrystals.sanCrystal
  createForm.initialCrystals.runeFragment =
    defaults.initialCrystals.runeFragment
  createForm.note = defaults.note
  createGuildIconBase64.value = ''
}

function applyWeightPreset(presetName) {
  const preset = weightPresets[presetName]
  if (!preset) return
  for (const [key, value] of Object.entries(preset)) {
    createForm.behaviorWeights[key] = value
  }
}

function handleCreateGuildIconCrop(base64) {
  createGuildIconBase64.value = base64
}

async function handleCreate() {
  loading.value = true
  try {
    const payload = {
      ...buildBotSettingsPayload(createForm),
      guildName: createForm.guildName,
      initialGold: createForm.initialGold,
      initialCrystals: { ...createForm.initialCrystals }
    }
    if (createGuildIconBase64.value) {
      payload.iconBase64 = createGuildIconBase64.value
    }
    await createBotApi(payload)
    ElMessage.success({ message: '创建机器人成功', showClose: true })
    dialogVisible.value = false
    emit('created')
  } catch (err) {
    ElMessage.error({
      message: err?.response?.data?.message || '创建失败',
      showClose: true
    })
  } finally {
    loading.value = false
  }
}
</script>

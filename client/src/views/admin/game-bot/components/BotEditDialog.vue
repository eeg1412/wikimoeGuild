<template>
  <el-dialog
    v-model="dialogVisible"
    title="编辑机器人"
    width="600px"
    :close-on-click-modal="!actioningId"
    :close-on-press-escape="!actioningId"
    :show-close="!actioningId"
    destroy-on-close
    append-to-body
    align-center
  >
    <el-form :model="editForm" label-width="120px">
      <el-form-item label="状态">
        <el-switch
          v-model="editForm.isActive"
          active-text="活跃"
          inactive-text="停用"
        />
      </el-form-item>
      <el-form-item label="阵容倾向">
        <el-select v-model="editForm.formationTendency" style="width: 100%">
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
          v-model="editForm.behaviorWeights[weight.key]"
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
          v-model="editForm.marketSettings.sellCrystals.maxMarketAmount"
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
          v-model="editForm.marketSettings.sellRuneStones.enabled"
          active-text="开启"
          inactive-text="关闭"
        />
      </el-form-item>
      <template v-if="editForm.marketSettings.sellRuneStones.enabled">
        <el-form-item label="最大挂卖数">
          <el-input-number
            v-model="editForm.marketSettings.sellRuneStones.maxAmount"
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
            v-model="editForm.marketSettings.sellRuneStones.rarities"
          >
            <el-checkbox value="normal">普通</el-checkbox>
            <el-checkbox value="rare">稀有</el-checkbox>
            <el-checkbox value="legendary">传说</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
      </template>
      <el-form-item label="备注">
        <el-input
          v-model="editForm.note"
          type="textarea"
          :rows="2"
          maxlength="500"
        />
      </el-form-item>
      <el-divider content-position="left">活动时间设置</el-divider>
      <el-form-item label="限制活动时间">
        <el-switch
          v-model="editForm.activeTimeSettings.enabled"
          active-text="开启"
          inactive-text="关闭"
        />
        <div class="text-xs text-gray-400 mt-1">关闭后机器人将24小时活动。</div>
      </el-form-item>
      <template v-if="editForm.activeTimeSettings.enabled">
        <el-form-item label="活动时段">
          <div class="flex items-center gap-2 w-full">
            <el-input-number
              v-model="editForm.activeTimeSettings.startHour"
              :min="0"
              :max="23"
              :step="1"
              style="width: 120px"
            />
            <span>时 至</span>
            <el-input-number
              v-model="editForm.activeTimeSettings.endHour"
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
            v-model="guildNameInput"
            placeholder="新公会名"
            maxlength="20"
          />
          <div class="text-xs text-gray-400 mt-1">
            修改后的公会名会在点击底部“保存”后统一提交。
          </div>
        </div>
      </el-form-item>
      <el-form-item label="公会图标">
        <div>
          <Cropper
            :src="guildIconPreview"
            :aspect-ratio="1"
            :width="200"
            :height="200"
            put-image-type="image/png"
            :put-image-quality="0.9"
            @crop="handleGuildIconCrop"
          />
          <div class="text-xs text-gray-400 mt-2">
            裁剪后的图标会在点击底部“保存”后统一提交。
          </div>
        </div>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button :disabled="!!actioningId" @click="dialogVisible = false"
        >取消</el-button
      >
      <el-button
        type="primary"
        :loading="actioningId === 'save'"
        :disabled="!!actioningId"
        @click="handleUpdate"
      >
        保存
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import Cropper from '@/components/Cropper.vue'
import { getBotDetailApi, updateBotApi } from '@/api/admin/bot.js'
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
  },
  bot: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['update:modelValue', 'updated'])

const dialogVisible = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value)
})

const weightFields = botWeightFields
const weightPresets = botWeightPresets

const actioningId = ref(null)
const detailData = ref(null)
const guildNameInput = ref('')
const initialGuildName = ref('')
const guildIconPreview = ref('')
const guildIconBase64 = ref('')
const editForm = reactive(createDefaultEditForm())

watch(
  () => [props.modelValue, props.bot],
  async ([visible, bot]) => {
    if (!visible || !bot?._id) return
    applyBotToForm(bot)
    await fetchEditGuildInfo(bot._id)
  },
  { immediate: true }
)

function createDefaultEditForm() {
  return createDefaultBotSettings()
}

function applyBotToForm(bot) {
  const defaults = createDefaultEditForm()
  editForm.isActive = bot.isActive
  editForm.formationTendency =
    bot.formationTendency || defaults.formationTendency
  editForm.note = bot.note || ''

  const weights = bot.behaviorWeights || {}
  for (const field of weightFields) {
    editForm.behaviorWeights[field.key] = weights[field.key] ?? 50
  }

  const marketSettings = bot.marketSettings || {}
  const sellCrystals = marketSettings.sellCrystals || {}
  editForm.marketSettings.sellCrystals.maxMarketAmount =
    sellCrystals.maxMarketAmount ??
    sellCrystals.maxAmount ??
    defaults.marketSettings.sellCrystals.maxMarketAmount

  const sellRuneStones = marketSettings.sellRuneStones || {}
  editForm.marketSettings.sellRuneStones.enabled =
    sellRuneStones.enabled || false
  editForm.marketSettings.sellRuneStones.maxAmount =
    sellRuneStones.maxAmount ?? defaults.marketSettings.sellRuneStones.maxAmount
  editForm.marketSettings.sellRuneStones.rarities =
    sellRuneStones.rarities || defaults.marketSettings.sellRuneStones.rarities

  const activeTimeSettings = bot.activeTimeSettings || {}
  editForm.activeTimeSettings.enabled =
    activeTimeSettings.enabled ?? defaults.activeTimeSettings.enabled
  editForm.activeTimeSettings.startHour =
    activeTimeSettings.startHour ?? defaults.activeTimeSettings.startHour
  editForm.activeTimeSettings.endHour =
    activeTimeSettings.endHour ?? defaults.activeTimeSettings.endHour

  guildNameInput.value = bot.playerInfo?.guildName || ''
  initialGuildName.value = bot.playerInfo?.guildName || ''
  guildIconBase64.value = ''
  guildIconPreview.value = ''
}

function applyWeightPreset(presetName) {
  const preset = weightPresets[presetName]
  if (!preset) return
  for (const [key, value] of Object.entries(preset)) {
    editForm.behaviorWeights[key] = value
  }
}

async function fetchEditGuildInfo(botId) {
  try {
    const res = await getBotDetailApi(botId)
    detailData.value = res.data.data
    updateGuildIconPreview()
  } catch {
    guildIconPreview.value = ''
  }
}

async function handleUpdate() {
  if (!props.bot?._id) return
  actioningId.value = 'save'
  try {
    await updateBotApi(props.bot._id, buildUpdatePayload())
    ElMessage.success({ message: '更新成功', showClose: true })
    dialogVisible.value = false
    emit('updated')
  } catch (err) {
    ElMessage.error({
      message: err?.response?.data?.message || '更新失败',
      showClose: true
    })
  } finally {
    actioningId.value = null
  }
}

function buildUpdatePayload() {
  const payload = buildBotSettingsPayload(editForm)

  if (guildNameInput.value !== initialGuildName.value) {
    payload.guildName = guildNameInput.value
  }

  if (guildIconBase64.value) {
    payload.iconBase64 = guildIconBase64.value
  }

  return payload
}

function handleGuildIconCrop(base64) {
  guildIconBase64.value = base64
  guildIconPreview.value = base64
}

function updateGuildIconPreview() {
  const playerInfo = detailData.value?.playerInfo
  if (!playerInfo) {
    guildIconPreview.value = ''
    return
  }
  if (playerInfo.hasCustomGuildIcon) {
    const timestamp = playerInfo.customGuildIconUpdatedAt
      ? new Date(playerInfo.customGuildIconUpdatedAt).getTime()
      : ''
    guildIconPreview.value = `/uploads/custom-guild-icon/${playerInfo.account}.png${timestamp ? `?t=${timestamp}` : ''}`
    return
  }
  guildIconPreview.value = `/uploads/default-guild-icon/${playerInfo.account}.png`
}
</script>

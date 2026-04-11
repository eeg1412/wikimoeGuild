<template>
  <el-dialog
    v-model="dialogVisible"
    title="创建机器人"
    width="520px"
    :close-on-click-modal="!loading"
    :close-on-press-escape="!loading"
    :show-close="!loading"
    destroy-on-close
    append-to-body
    align-center
  >
    <el-form :model="createForm" label-width="120px">
      <el-form-item label="公会名">
        <el-input
          v-model="createForm.guildName"
          placeholder="留空则自动生成"
          maxlength="20"
        />
      </el-form-item>
      <el-form-item label="阵容倾向">
        <el-select v-model="createForm.formationTendency" style="width: 100%">
          <el-option label="均衡型" value="balanced" />
          <el-option label="攻击型" value="aggressive" />
          <el-option label="防御型" value="defensive" />
          <el-option label="刺客型" value="assassin" />
        </el-select>
      </el-form-item>
      <el-form-item label="初始金币">
        <el-input-number
          v-model="createForm.initialGold"
          :min="0"
          :max="2000000000"
          :step="10000"
          style="width: 100%"
        />
      </el-form-item>
      <el-divider content-position="left">初始水晶</el-divider>
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
      <el-divider content-position="left">公会图标</el-divider>
      <el-form-item label="公会图标">
        <div>
          <Cropper
            :src="createGuildIconBase64"
            :aspect-ratio="1"
            :width="128"
            :height="128"
            :max-width="128"
            :max-height="128"
            put-image-type="image/png"
            :put-image-quality="0.9"
            @crop="handleCreateGuildIconCrop"
          />
          <p class="text-gray-400 text-xs mt-1">留空则使用默认图标</p>
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
    guildName: '',
    formationTendency: 'balanced',
    initialGold: 0,
    initialCrystals: {
      attackCrystal: 0,
      defenseCrystal: 0,
      speedCrystal: 0,
      sanCrystal: 0,
      runeFragment: 0
    },
    note: ''
  }
}

function resetCreateForm() {
  const defaults = createDefaultForm()
  createForm.guildName = defaults.guildName
  createForm.formationTendency = defaults.formationTendency
  createForm.initialGold = defaults.initialGold
  createForm.initialCrystals.attackCrystal = defaults.initialCrystals.attackCrystal
  createForm.initialCrystals.defenseCrystal = defaults.initialCrystals.defenseCrystal
  createForm.initialCrystals.speedCrystal = defaults.initialCrystals.speedCrystal
  createForm.initialCrystals.sanCrystal = defaults.initialCrystals.sanCrystal
  createForm.initialCrystals.runeFragment = defaults.initialCrystals.runeFragment
  createForm.note = defaults.note
  createGuildIconBase64.value = ''
}

function handleCreateGuildIconCrop(base64) {
  createGuildIconBase64.value = base64
}

async function handleCreate() {
  loading.value = true
  try {
    const payload = {
      guildName: createForm.guildName,
      formationTendency: createForm.formationTendency,
      initialGold: createForm.initialGold,
      initialCrystals: { ...createForm.initialCrystals },
      note: createForm.note
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
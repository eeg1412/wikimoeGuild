<template>
  <el-dialog
    v-model="dialogVisible"
    title="冒险家列表"
    width="720px"
    destroy-on-close
    append-to-body
    align-center
  >
    <div v-if="loading" v-loading="true" style="min-height: 180px"></div>
    <ResponsiveTable
      v-else
      :data="detailData?.adventurers || []"
      stripe
      size="small"
    >
      <ResponsiveTableColumn label="头像" width="70">
        <template #default="{ row }">
          <GameAdventurerAvatar
            :adventurer="row"
            style="width: 32px; height: 32px"
          />
        </template>
      </ResponsiveTableColumn>
      <ResponsiveTableColumn label="名字" min-width="100">
        <template #default="{ row }">
          {{ row.name }}
        </template>
      </ResponsiveTableColumn>
      <ResponsiveTableColumn label="角色" min-width="80">
        <template #default="{ row }">
          {{ getAdventurerRole(row._id) }}
        </template>
      </ResponsiveTableColumn>
      <ResponsiveTableColumn label="攻击" prop="attackLevel" min-width="60" />
      <ResponsiveTableColumn label="防御" prop="defenseLevel" min-width="60" />
      <ResponsiveTableColumn label="速度" prop="speedLevel" min-width="60" />
      <ResponsiveTableColumn label="SAN" prop="SANLevel" min-width="60" />
      <ResponsiveTableColumn
        label="操作"
        width="160"
        align="center"
        fixed="right"
      >
        <template #default="{ row }">
          <el-button
            type="primary"
            size="small"
            text
            :disabled="loading"
            @click="openAdvNameDialog(row)"
          >
            改名
          </el-button>
          <el-button
            type="primary"
            size="small"
            text
            :disabled="loading"
            @click="openAdvAvatarDialog(row)"
          >
            换头像
          </el-button>
        </template>
      </ResponsiveTableColumn>
    </ResponsiveTable>
  </el-dialog>

  <el-dialog
    v-model="advNameDialogVisible"
    title="修改冒险家名字"
    width="420px"
    :close-on-click-modal="!loading"
    :close-on-press-escape="!loading"
    :show-close="!loading"
    destroy-on-close
    align-center
    append-to-body
  >
    <el-form label-width="80px">
      <el-form-item label="新名字">
        <el-input
          v-model="advNameInput"
          placeholder="请输入新名字"
          maxlength="20"
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button :disabled="loading" @click="advNameDialogVisible = false">
        取消
      </el-button>
      <el-button
        type="primary"
        :loading="loading"
        :disabled="!advNameInput"
        @click="handleUpdateAdvName"
      >
        确定
      </el-button>
    </template>
  </el-dialog>

  <el-dialog
    v-model="advAvatarDialogVisible"
    title="修改冒险家头像"
    width="420px"
    :close-on-click-modal="!loading"
    :close-on-press-escape="!loading"
    :show-close="!loading"
    destroy-on-close
    align-center
    append-to-body
  >
    <Cropper
      :src="advAvatarPreview"
      :aspect-ratio="1"
      :width="128"
      :height="128"
      :max-width="128"
      :max-height="128"
      put-image-type="image/webp"
      :put-image-quality="0.8"
      @crop="handleAdvAvatarCrop"
    />
    <template #footer>
      <el-button :disabled="loading" @click="advAvatarDialogVisible = false">
        取消
      </el-button>
      <el-button
        type="primary"
        :loading="loading"
        :disabled="!advAvatarBase64"
        @click="handleUpdateAdvAvatar"
      >
        确定
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import Cropper from '@/components/Cropper.vue'
import GameAdventurerAvatar from '@/components/GameAdventurerAvatar.vue'
import {
  getBotDetailApi,
  updateBotAdventurerAvatarApi,
  updateBotAdventurerNameApi
} from '@/api/admin/bot.js'
import { ROLE_TAG_MAP } from 'shared/constants/index.js'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  botId: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['update:modelValue'])

const dialogVisible = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value)
})

const roleMap = {
  tank: ROLE_TAG_MAP[2].label,
  dps: ROLE_TAG_MAP[1].label,
  assassin: ROLE_TAG_MAP[3].label,
  balanced: ROLE_TAG_MAP[4].label
}

const loading = ref(false)
const detailData = ref(null)
const currentAdvId = ref(null)
const advNameDialogVisible = ref(false)
const advNameInput = ref('')
const advAvatarDialogVisible = ref(false)
const advAvatarPreview = ref('')
const advAvatarBase64 = ref('')

watch(
  () => [props.modelValue, props.botId],
  async ([visible, botId]) => {
    if (!visible || !botId) return
    await refreshAdventurers()
  },
  { immediate: true }
)

function getAdventurerRole(advId) {
  const roles = detailData.value?.bot?.adventurerRoles
  if (!roles) return '—'
  const role = roles[advId] || roles[advId?.toString()]
  return roleMap[role] || '—'
}

async function refreshAdventurers() {
  if (!props.botId) return
  loading.value = true
  try {
    const res = await getBotDetailApi(props.botId)
    detailData.value = res.data.data
  } catch (err) {
    ElMessage.error({
      message: err?.response?.data?.message || '获取冒险家列表失败',
      showClose: true
    })
    dialogVisible.value = false
  } finally {
    loading.value = false
  }
}

function openAdvNameDialog(adventurer) {
  currentAdvId.value = adventurer._id
  advNameInput.value = adventurer.name || ''
  advNameDialogVisible.value = true
}

async function handleUpdateAdvName() {
  if (!advNameInput.value || !currentAdvId.value || !props.botId) return
  loading.value = true
  try {
    await updateBotAdventurerNameApi(props.botId, {
      adventurerId: currentAdvId.value,
      name: advNameInput.value
    })
    ElMessage.success({ message: '冒险家名字修改成功', showClose: true })
    advNameDialogVisible.value = false
    await refreshAdventurers()
  } catch (err) {
    ElMessage.error({
      message: err?.response?.data?.message || '修改失败',
      showClose: true
    })
  } finally {
    loading.value = false
  }
}

function openAdvAvatarDialog(adventurer) {
  currentAdvId.value = adventurer._id
  if (adventurer.hasCustomAvatar) {
    const timestamp = adventurer.customAvatarUpdatedAt
      ? new Date(adventurer.customAvatarUpdatedAt).getTime()
      : ''
    advAvatarPreview.value = `/uploads/custom-adventurer-avatar/${adventurer._id}.webp${timestamp ? `?t=${timestamp}` : ''}`
  } else {
    advAvatarPreview.value = `/publicgame/avatar/${adventurer.defaultAvatarId || 1}.webp`
  }
  advAvatarBase64.value = ''
  advAvatarDialogVisible.value = true
}

function handleAdvAvatarCrop(base64) {
  advAvatarBase64.value = base64
  advAvatarPreview.value = base64
}

async function handleUpdateAdvAvatar() {
  if (!advAvatarBase64.value || !currentAdvId.value || !props.botId) return
  loading.value = true
  try {
    await updateBotAdventurerAvatarApi(props.botId, {
      adventurerId: currentAdvId.value,
      avatarBase64: advAvatarBase64.value
    })
    ElMessage.success({ message: '冒险家头像修改成功', showClose: true })
    advAvatarDialogVisible.value = false
    await refreshAdventurers()
  } catch (err) {
    ElMessage.error({
      message: err?.response?.data?.message || '修改失败',
      showClose: true
    })
  } finally {
    loading.value = false
  }
}
</script>

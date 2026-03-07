<template>
  <el-dialog
    v-model="visible"
    :title="guildInfo?.guildName || '公会详情'"
    width="340px"
    align-center
    destroy-on-close
    class="rpg-dialog game-dialog"
    append-to-body
  >
    <div v-if="loading" class="flex justify-center py-8">
      <span class="animate-spin inline-block text-2xl">⏳</span>
    </div>
    <div v-else-if="guildInfo" class="flex flex-col items-center gap-3">
      <!-- 公会图标 -->
      <GameGuildIcon
        :account-id="guildInfo.accountId"
        :has-custom-guild-icon="guildInfo.hasCustomGuildIcon"
        :custom-guild-icon-updated-at="guildInfo.customGuildIconUpdatedAt"
        class="w-20 h-20 rounded-lg object-cover border-2 border-gray-200 dark:border-gray-700"
      />

      <!-- 公会名 -->
      <p class="text-lg font-bold text-gray-800 dark:text-gray-100">
        {{ guildInfo.guildName }}
      </p>

      <!-- 信息栏 -->
      <div class="w-full space-y-1.5 text-sm">
        <div class="info-row bg-gray-50 dark:bg-gray-800 rounded p-1.5">
          <span class="info-label">🏰 公会等级</span>
          <span class="info-value rpg-number"
            >Lv.{{ guildInfo.guildLevel ?? 1 }}</span
          >
        </div>
        <div class="info-row bg-gray-50 dark:bg-gray-800 rounded p-1.5">
          <span class="info-label">⚔️ 冒险家数</span>
          <span class="info-value rpg-number">{{
            guildInfo.adventurerCount ?? 0
          }}</span>
        </div>
        <div
          v-if="guildInfo.createdAt"
          class="info-row bg-gray-50 dark:bg-gray-800 rounded p-1.5"
        >
          <span class="info-label">📅 创建时间</span>
          <span class="info-value text-gray-500 text-xs">{{
            formatDate(guildInfo.createdAt)
          }}</span>
        </div>
      </div>

      <!-- 冒险家列表 -->
      <div v-if="guildInfo.adventurers?.length" class="w-full mt-2">
        <p class="text-xs text-gray-400 mb-2 text-center">🗡️ 冒险家一览</p>
        <div class="grid grid-cols-5 gap-1.5">
          <div
            v-for="adv in guildInfo.adventurers"
            :key="adv._id"
            class="flex flex-col items-center"
          >
            <GameAdventurerAvatar
              :adventurer="adv"
              class="w-10 h-10 rounded-full border"
              :style="{ borderColor: getElementColor(adv.elements) }"
            />
            <p
              class="text-[10px] text-gray-500 truncate w-full text-center mt-0.5"
            >
              {{ adv.name }}
            </p>
          </div>
        </div>
      </div>
    </div>
    <div v-else class="text-center py-6 text-gray-400 text-sm">
      无法获取公会信息
    </div>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { getGuildInfoApi } from '@/api/game/guild.js'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  playerInfoId: { type: String, default: '' }
})

const emit = defineEmits(['update:modelValue'])

const visible = computed({
  get: () => props.modelValue,
  set: val => emit('update:modelValue', val)
})

const ELEMENT_MAP = {
  1: { name: '地', color: '#a0855b' },
  2: { name: '水', color: '#4fa3e0' },
  3: { name: '火', color: '#e05c4f' },
  4: { name: '风', color: '#6abf69' },
  5: { name: '光明', color: '#f5c842' },
  6: { name: '黑暗', color: '#7c5cbf' }
}

function getElementColor(el) {
  return ELEMENT_MAP[el]?.color || '#999'
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const guildInfo = ref(null)
const loading = ref(false)

watch(
  () => props.modelValue,
  async val => {
    if (val && props.playerInfoId) {
      loading.value = true
      try {
        const res = await getGuildInfoApi(props.playerInfoId)
        guildInfo.value = res.data.data
      } catch {
        guildInfo.value = null
      } finally {
        loading.value = false
      }
    }
  }
)
</script>

<style scoped>
.info-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.info-label {
  color: #9ca3af;
  white-space: nowrap;
  font-size: 13px;
}
.info-value {
  text-align: right;
}
.rpg-number {
  font-family: monospace;
  font-weight: bold;
  color: #fbbf24;
}
</style>

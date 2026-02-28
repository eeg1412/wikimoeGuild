<template>
  <img
    v-if="src"
    :src="src"
    v-bind="$attrs"
  />
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  /** 玩家信息对象，需包含 account, hasCustomGuildIcon, customGuildIconUpdatedAt 字段 */
  playerInfo: {
    type: Object,
    default: null
  },
  /**
   * 直接传入 account id（适用于活动动态等只有部分字段的场景）
   * 当同时传入 playerInfo 时以 playerInfo 为准
   */
  accountId: {
    type: String,
    default: ''
  },
  /** 是否有自定义公会图标（配合 accountId 使用） */
  hasCustomGuildIcon: {
    type: Boolean,
    default: false
  },
  /** 自定义公会图标更新时间（配合 accountId 使用） */
  customGuildIconUpdatedAt: {
    type: [String, Date],
    default: null
  }
})

defineOptions({ inheritAttrs: false })

const src = computed(() => {
  let id, hasCustom, updatedAt

  if (props.playerInfo) {
    id = props.playerInfo.account
    hasCustom = props.playerInfo.hasCustomGuildIcon
    updatedAt = props.playerInfo.customGuildIconUpdatedAt
  } else {
    id = props.accountId
    hasCustom = props.hasCustomGuildIcon
    updatedAt = props.customGuildIconUpdatedAt
  }

  if (!id) return ''

  if (hasCustom) {
    const t = updatedAt ? new Date(updatedAt).getTime() : ''
    return `/uploads/custom-guild-icon/${id}.png${t ? '?t=' + t : ''}`
  }
  return `/uploads/default-guild-icon/${id}.png`
})
</script>

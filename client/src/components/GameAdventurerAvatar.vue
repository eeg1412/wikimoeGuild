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
  /** 冒险家对象，需包含 _id / id, hasCustomAvatar, defaultAvatarId, customAvatarUpdatedAt 等字段 */
  adventurer: {
    type: Object,
    default: null
  },
  /** 是否为恶魔（恶魔使用 demon 头像目录） */
  isDemon: {
    type: Boolean,
    default: false
  }
})

defineOptions({ inheritAttrs: false })

const src = computed(() => {
  const adv = props.adventurer
  if (!adv) return ''

  // 恶魔使用恶魔头像
  if (adv.isDemon || props.isDemon) {
    return `/publicgame/demon/${adv.defaultAvatarId || 1}.webp`
  }

  // 自定义头像
  if (adv.hasCustomAvatar) {
    const id = adv.adventurerId || adv._id || adv.id
    const t = adv.customAvatarUpdatedAt
      ? new Date(adv.customAvatarUpdatedAt).getTime()
      : ''
    return `/uploads/custom-adventurer-avatar/${id}.webp${t ? '?t=' + t : ''}`
  }

  // 默认头像
  return `/publicgame/avatar/${adv.defaultAvatarId || 1}.webp`
})
</script>

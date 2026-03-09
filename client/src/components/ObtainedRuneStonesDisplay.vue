<template>
  <div v-if="runeStones && runeStones.length > 0" class="space-y-2">
    <p
      class="font-bold text-lg text-center"
      :style="{ color: headerColor }"
    >
      ✨ 获得符文石！
    </p>
    <div
      v-for="(rs, idx) in runeStones"
      :key="rs._id || idx"
      class="rounded-lg border p-3"
      :class="rarityBgClass(rs.rarity)"
    >
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <div
            class="w-8 h-8 rounded flex items-center justify-center text-base"
            :class="rarityIconBgClass(rs.rarity)"
          >
            💎
          </div>
          <div>
            <p class="text-sm font-semibold" :style="{ color: rarityColor(rs.rarity) }">
              {{ rarityName(rs.rarity) }}符文石
            </p>
            <p class="text-xs text-gray-400">Lv.{{ rs.level }}</p>
          </div>
        </div>
        <span
          class="text-gray-400 cursor-pointer select-none text-xs"
          @click="toggleExpand(rs._id || idx)"
        >
          {{ expandedIds.has(rs._id || idx) ? '▲' : '▼' }}
        </span>
      </div>
      <div v-if="expandedIds.has(rs._id || idx)" class="mt-2">
        <RuneStoneInfoCard :rune-stone="rs" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import RuneStoneInfoCard from '@/components/RuneStoneInfoCard.vue'

const props = defineProps({
  runeStones: {
    type: Array,
    default: () => []
  }
})

const expandedIds = ref(new Set())

function toggleExpand(id) {
  const newSet = new Set(expandedIds.value)
  if (newSet.has(id)) {
    newSet.delete(id)
  } else {
    newSet.add(id)
  }
  expandedIds.value = newSet
}

// 取第一个符文石的稀有度作为标题颜色（若有多个则取最高稀有度）
const headerColor = computed(() => {
  if (!props.runeStones || props.runeStones.length === 0) return '#ffffff'
  const rarityOrder = { legendary: 2, rare: 1, normal: 0 }
  const top = props.runeStones.reduce((best, rs) => {
    return (rarityOrder[rs.rarity] ?? 0) > (rarityOrder[best.rarity] ?? 0)
      ? rs
      : best
  })
  return rarityColor(top.rarity)
})

function rarityColor(r) {
  return (
    { normal: '#9ca3af', rare: '#60a5fa', legendary: '#f59e0b' }[r] || '#9ca3af'
  )
}

function rarityName(r) {
  return { normal: '普通', rare: '稀有', legendary: '传说' }[r] || r
}

function rarityBgClass(r) {
  return (
    {
      normal: 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700',
      rare: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700',
      legendary: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-700'
    }[r] || 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
  )
}

function rarityIconBgClass(r) {
  return (
    {
      normal: 'bg-gray-200 dark:bg-gray-700',
      rare: 'bg-blue-100 dark:bg-blue-900/30',
      legendary: 'bg-yellow-100 dark:bg-yellow-900/30'
    }[r] || 'bg-gray-200 dark:bg-gray-700'
  )
}
</script>

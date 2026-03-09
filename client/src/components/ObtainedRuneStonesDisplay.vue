<template>
  <div v-if="runeStones && runeStones.length > 0" class="space-y-2">
    <p class="font-bold text-lg text-center" :class="headerTextClass">
      ✨ 获得符文石！
    </p>
    <div
      v-for="(rs, idx) in runeStones"
      :key="rs._id || idx"
      class="rpg-card rounded-xl p-4"
    >
      <!-- 顶部：稀有度 + 等级 -->
      <div class="flex items-center justify-between mb-2">
        <div class="flex items-center gap-3">
          <div
            class="w-10 h-10 rounded-lg flex items-center justify-center text-lg"
            :class="rarityIconBgClass(rs.rarity)"
          >
            💎
          </div>
          <div>
            <p
              class="text-sm font-semibold"
              :class="rarityTextClass(rs.rarity)"
            >
              {{ rarityName(rs.rarity) }}符文石
            </p>
            <p class="text-sm text-gray-400 text-left">Lv.{{ rs.level }}</p>
          </div>
        </div>
        <span
          class="text-gray-400 cursor-pointer select-none"
          @click="toggleExpand(rs._id || idx)"
        >
          {{ expandedIds.has(rs._id || idx) ? '▲' : '▼' }}
        </span>
      </div>
      <!-- 可收缩的详细信息 -->
      <div v-if="expandedIds.has(rs._id || idx)" class="mt-2 text-left">
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

// 取最高稀有度作为标题颜色
const headerTextClass = computed(() => {
  if (!props.runeStones || props.runeStones.length === 0) return 'text-gray-200'
  const rarityOrder = { legendary: 2, rare: 1, normal: 0 }
  const top = props.runeStones.reduce((best, rs) => {
    return (rarityOrder[rs.rarity] ?? 0) > (rarityOrder[best.rarity] ?? 0)
      ? rs
      : best
  })
  return rarityTextClass(top.rarity)
})

function rarityTextClass(r) {
  return (
    {
      normal: 'text-gray-600 dark:text-gray-300',
      rare: 'text-blue-500',
      legendary: 'text-yellow-500'
    }[r] || 'text-gray-600 dark:text-gray-300'
  )
}

function rarityName(r) {
  return { normal: '普通', rare: '稀有', legendary: '传说' }[r] || r
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

<style scoped>
.rpg-card {
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.9) 0%,
    rgba(240, 230, 200, 0.6) 100%
  );
  border: 1px solid rgba(200, 160, 80, 0.3);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}
.dark .rpg-card {
  background: linear-gradient(
    135deg,
    rgba(40, 35, 30, 0.9) 0%,
    rgba(30, 24, 18, 0.8) 100%
  );
  border-color: rgba(200, 160, 80, 0.25);
}
</style>

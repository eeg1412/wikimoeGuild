<template>
  <div class="rune-stone-select-panel">
    <!-- 工具栏：稀有度筛选 + 排序 -->
    <div class="flex flex-wrap items-center gap-2 mb-3">
      <!-- 稀有度筛选 -->
      <div class="flex items-center gap-1">
        <button
          class="filter-btn"
          :class="{ 'filter-btn--active': rarityFilter === '' }"
          @click="handleSetRarity('')"
        >
          全部
        </button>
        <button
          v-for="r in rarityOptions"
          :key="r.value"
          class="filter-btn"
          :class="[
            { 'filter-btn--active': rarityFilter === r.value },
            r.colorClass
          ]"
          @click="handleSetRarity(r.value)"
        >
          {{ r.label }}
        </button>
      </div>
      <!-- 排序 -->
      <div class="flex items-center gap-1 ml-auto">
        <span class="text-xs text-gray-400 shrink-0">排序:</span>
        <select
          v-model="sortMode"
          class="text-xs rounded px-1.5 py-0.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200"
          @change="handleSortChange"
        >
          <option value="time">获取时间</option>
          <option value="rarity">稀有度</option>
          <option value="level">等级</option>
        </select>
      </div>
    </div>

    <!-- 列表 -->
    <div v-if="loading" class="text-center py-6">
      <span class="animate-spin inline-block text-2xl">⏳</span>
    </div>
    <div
      v-else-if="sortedList.length === 0"
      class="text-center py-6 text-gray-400"
    >
      暂无可用符文石
    </div>
    <div v-else class="space-y-2 max-h-80 overflow-y-auto">
      <div
        v-for="rs in sortedList"
        :key="rs._id"
        class="rpg-card rounded-xl p-3 cursor-pointer hover:border-yellow-400 transition-colors border relative"
        @click="handleItemClick(rs)"
      >
        <!-- New 标记 -->
        <span
          v-if="isNew(rs)"
          class="absolute top-1 right-1 text-xs bg-red-500 text-white px-1.5 py-0.5 rounded-full leading-none font-bold"
        >
          New
        </span>
        <!-- 摘要行 -->
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2 min-w-0">
            <div
              class="w-7 h-7 rounded-lg flex items-center justify-center text-sm shrink-0"
              :class="rarityBgClass(rs.rarity)"
            >
              💎
            </div>
            <div class="min-w-0">
              <p
                :class="rarityTextClass(rs.rarity)"
                class="text-sm font-semibold truncate"
              >
                {{ rarityName(rs.rarity) }}符文石 Lv.{{ rs.level }}
              </p>
              <p class="text-xs text-gray-400 truncate">
                {{ getSkillSummary(rs) }}
              </p>
            </div>
          </div>
          <div class="flex items-center gap-1 shrink-0">
            <slot name="action" :rune-stone="rs" />
            <button
              class="text-gray-400 hover:text-gray-200 text-sm px-1"
              :title="expandedIds.has(rs._id) ? '收起详情' : '展开详情'"
              @click.stop="handleToggleExpand(rs._id)"
            >
              {{ expandedIds.has(rs._id) ? '🔼' : '🔽' }}
            </button>
          </div>
        </div>
        <!-- 展开详情 -->
        <div v-if="expandedIds.has(rs._id)" class="mt-2" @click.stop>
          <RuneStoneInfoCard :rune-stone="rs" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import RuneStoneInfoCard from '@/components/RuneStoneInfoCard.vue'
import { runeStoneActiveSkillDataBase } from 'shared/utils/gameDatabase.js'

const props = defineProps({
  runeStones: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false }
})

const emit = defineEmits(['select'])

// 稀有度筛选
const rarityFilter = ref('')
const rarityOptions = [
  { value: 'normal', label: '普通', colorClass: 'text-gray-500' },
  { value: 'rare', label: '稀有', colorClass: 'text-blue-500' },
  { value: 'legendary', label: '传说', colorClass: 'text-yellow-500' }
]

function handleSetRarity(v) {
  rarityFilter.value = v
}

// 排序
const sortMode = ref('time')

function handleSortChange() {
  // select 的 v-model 已经更新
}

const RARITY_ORDER = { legendary: 0, rare: 1, normal: 2 }

const filteredList = computed(() => {
  let list = props.runeStones
  if (rarityFilter.value) {
    list = list.filter(rs => rs.rarity === rarityFilter.value)
  }
  return list
})

const sortedList = computed(() => {
  const list = [...filteredList.value]
  switch (sortMode.value) {
    case 'rarity':
      list.sort(
        (a, b) =>
          (RARITY_ORDER[a.rarity] ?? 3) - (RARITY_ORDER[b.rarity] ?? 3) ||
          b.level - a.level
      )
      break
    case 'level':
      list.sort((a, b) => b.level - a.level)
      break
    case 'time':
    default:
      list.sort(
        (a, b) =>
          new Date(b.createdAt || 0).getTime() -
          new Date(a.createdAt || 0).getTime()
      )
      break
  }
  return list
})

// 30分钟内获取的显示 New
function isNew(rs) {
  if (!rs.createdAt) return false
  const thirtyMin = 30 * 60 * 1000
  return Date.now() - new Date(rs.createdAt).getTime() < thirtyMin
}

// 展开/收起
const expandedIds = ref(new Set())

function handleToggleExpand(id) {
  const newSet = new Set(expandedIds.value)
  if (newSet.has(id)) {
    newSet.delete(id)
  } else {
    newSet.add(id)
  }
  expandedIds.value = newSet
}

// 技能摘要
const skillMap = computed(() => {
  const map = new Map()
  for (const s of runeStoneActiveSkillDataBase()) {
    map.set(s.value, s)
  }
  return map
})

function getSkillSummary(rs) {
  if (!rs.activeSkills?.length) return '无主动技能'
  return rs.activeSkills
    .map(s => {
      const info = skillMap.value.get(s.skillId || s)
      return info ? info.label : '未知'
    })
    .join(', ')
}

// 点击项目
function handleItemClick(rs) {
  emit('select', rs)
}

// 样式工具
function rarityName(r) {
  return { normal: '普通', rare: '稀有', legendary: '传说' }[r] || r
}

function rarityBgClass(r) {
  return (
    {
      normal: 'bg-gray-200 dark:bg-gray-700',
      rare: 'bg-blue-100 dark:bg-blue-900/30',
      legendary: 'bg-yellow-100 dark:bg-yellow-900/30'
    }[r] || ''
  )
}

function rarityTextClass(r) {
  return (
    {
      normal: 'text-gray-500',
      rare: 'text-blue-500',
      legendary: 'text-yellow-500'
    }[r] || ''
  )
}
</script>

<style scoped>
.filter-btn {
  padding: 2px 8px;
  border-radius: 8px;
  font-size: 12px;
  border: 1px solid transparent;
  cursor: pointer;
  transition: all 0.2s;
  background: transparent;
  color: inherit;
}
.filter-btn:hover {
  background: rgba(128, 128, 128, 0.15);
}
.filter-btn--active {
  border-color: currentColor;
  font-weight: bold;
}
</style>

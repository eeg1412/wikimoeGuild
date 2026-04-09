<template>
  <div class="rune-stone-market-list">
    <!-- 加载中 -->
    <div v-if="loading" class="flex justify-center py-6">
      <span class="animate-spin inline-block text-2xl">⏳</span>
    </div>
    <!-- 空状态 -->
    <div
      v-else-if="displayList.length === 0"
      class="text-center py-6 text-gray-400 text-sm"
    >
      {{ emptyText }}
    </div>
    <!-- 列表 -->
    <div v-else class="space-y-2">
      <div
        v-for="item in displayList"
        :key="getItemId(item)"
        class="rpg-card rounded-xl p-3 cursor-pointer hover:border-yellow-400 transition-colors border border-gray-300 dark:border-gray-600"
        :class="itemClass ? itemClass(item) : ''"
        @click="handleToggleExpand(getItemId(item))"
      >
        <!-- 摘要行 -->
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2 min-w-0">
            <div
              class="w-8 h-8 rounded-lg flex items-center justify-center text-base shrink-0"
              :class="rarityBgClass(getRuneStone(item)?.rarity)"
            >
              💎
            </div>
            <div class="min-w-0">
              <p
                :class="rarityTextClass(getRuneStone(item)?.rarity)"
                class="text-sm font-semibold truncate"
              >
                {{ rarityName(getRuneStone(item)?.rarity) }}符文石
                <span class="text-xs text-gray-400 font-normal"
                  >Lv.{{ getRuneStone(item)?.level }}</span
                >
              </p>
              <p class="text-xs text-gray-400 truncate">
                {{ getSkillSummary(getRuneStone(item)) }}
              </p>
            </div>
          </div>
          <div class="flex items-center gap-2 shrink-0" @click.stop>
            <!-- 价格 / 额外信息 slot -->
            <slot name="extra" :item="item" :rune-stone="getRuneStone(item)" />
            <!-- 操作按钮 slot -->
            <slot name="action" :item="item" :rune-stone="getRuneStone(item)" />
            <button
              class="text-gray-400 hover:text-gray-200 text-sm px-1"
              :title="
                expandedIds.has(getItemId(item)) ? '收起详情' : '展开详情'
              "
              @click.stop="handleToggleExpand(getItemId(item))"
            >
              {{ expandedIds.has(getItemId(item)) ? '🔼' : '🔽' }}
            </button>
          </div>
        </div>
        <!-- 额外信息行（如价格、公会名称等） -->
        <div v-if="$slots.info" class="mt-1" @click.stop>
          <slot name="info" :item="item" :rune-stone="getRuneStone(item)" />
        </div>
        <!-- 展开详情 -->
        <div v-if="expandedIds.has(getItemId(item))" class="mt-2" @click.stop>
          <RuneStoneInfoCard :rune-stone="getRuneStone(item)" />
          <!-- 展开后额外内容 slot -->
          <slot name="expanded" :item="item" :rune-stone="getRuneStone(item)" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import RuneStoneInfoCard from '@/components/RuneStoneInfoCard.vue'
import {
  rarityName,
  rarityTextClass,
  rarityBgClass
} from '@/composables/useMarketUtils.js'
import { runeStoneActiveSkillDataBase } from 'shared/utils/gameDatabase.js'

const props = defineProps({
  /** 列表数据 */
  items: { type: Array, default: () => [] },
  /** 是否加载中 */
  loading: { type: Boolean, default: false },
  /** 空状态文案 */
  emptyText: { type: String, default: '暂无数据' },
  /**
   * 数据模式:
   * - 'direct': items 中每项就是符文石对象 (如玩家自己的符文石列表)
   * - 'nested': items 中每项有 runeStone 字段 (如市场上架列表)
   */
  mode: {
    type: String,
    default: 'direct',
    validator: v => ['direct', 'nested'].includes(v)
  },
  /** 每个条目的额外 CSS class（接收 item 返回 string/object/array） */
  itemClass: {
    type: Function,
    default: null
  }
})

// 技能名称映射
const skillMap = computed(() => {
  const map = new Map()
  for (const s of runeStoneActiveSkillDataBase()) {
    map.set(s.value, s)
  }
  return map
})

/** 获取符文石对象 */
function getRuneStone(item) {
  return props.mode === 'nested' ? item?.runeStone : item
}

/** 获取唯一 ID */
function getItemId(item) {
  return props.mode === 'nested' ? item?._id : item?._id
}

/** 展开/收起 */
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

/** 获取技能摘要文本 */
function getSkillSummary(rs) {
  if (!rs?.activeSkills?.length) return '无主动技能'
  return rs.activeSkills
    .map(s => {
      const info = skillMap.value.get(s.skillId || s)
      return info ? info.label : '未知'
    })
    .join(', ')
}

/** 因为 items 引用变化时重置展开状态 */
const displayList = computed(() => props.items)
</script>

<template>
  <div>
    <!-- 拖拽排序开关 + 显示标记 -->
    <div class="flex justify-center mb-2 gap-4">
      <el-checkbox v-model="dragMode" size="small" v-if="canDragMode">
        ☰ 拖拽排序模式
      </el-checkbox>
      <el-checkbox v-model="showMarkMode" size="small">
        🏷️ 显示标记
      </el-checkbox>
    </div>

    <!-- 5×5 棋盘 -->
    <div class="fg-board mx-auto">
      <VueDraggable
        v-model="localFlatGrid"
        :disabled="!dragMode"
        :animation="200"
        :invertSwap="true"
        swap-class="fg-cell--swap"
        ghost-class="fg-cell--ghost"
        class="fg-board-inner"
        :style="{ gridTemplateColumns: `repeat(5, ${cellSize}px)` }"
        :move="checkDragMove"
        @end="onDragEnd"
      >
        <div
          v-for="(element, index) in localFlatGrid"
          :key="element._key"
          class="fg-cell"
          :class="{
            'fg-cell--occupied': element.adventurer,
            'fg-cell--draggable': dragMode && element.adventurer
          }"
          :style="{
            width: `${cellSize}px`,
            height: `${cellSize}px`,
            ...(element.adventurer
              ? { borderColor: getElementColor(element.adventurer.elements) }
              : {})
          }"
          @click="emit('cell-click', Math.floor(index / 5), index % 5)"
          @contextmenu.prevent
          @mousedown="handleCellLongPressStart($event)"
          @mouseup="handleCellLongPressEnd"
          @mouseleave="handleCellLongPressEnd"
          @touchstart.passive="handleCellLongPressStart($event)"
          @touchend="handleCellLongPressEnd"
          @touchcancel="handleCellLongPressEnd"
        >
          <!-- 序号 / 角色标记 -->
          <el-popover
            v-if="showMarkMode && showRoleTag && element.adventurer"
            :width="200"
            trigger="click"
            placement="bottom"
          >
            <template #reference>
              <span
                class="fg-cell-seq fg-cell-seq--clickable"
                @click.stop
                @mousedown.stop
                @touchstart.stop
              >
                {{
                  element.adventurer.roleTag &&
                  ROLE_TAG_MAP[element.adventurer.roleTag]
                    ? ROLE_TAG_MAP[element.adventurer.roleTag].emoji
                    : '🏷️'
                }}
              </span>
            </template>
            <div>
              <p
                class="text-sm font-medium mb-2 text-gray-700 dark:text-gray-200"
              >
                设置角色标记
              </p>
              <div class="flex items-center justify-center gap-2 py-1">
                <span
                  v-for="tag in roleTagList"
                  :key="tag.value"
                  class="cursor-pointer text-xl px-1 py-0.5 rounded"
                  :class="[
                    element.adventurer.roleTag === tag.value
                      ? 'bg-yellow-200 dark:bg-yellow-700'
                      : '',
                    roleTagLoading ? 'opacity-50 pointer-events-none' : ''
                  ]"
                  :title="tag.label"
                  @click="
                    emit(
                      'set-role-tag',
                      Math.floor(index / 5),
                      index % 5,
                      tag.value
                    )
                  "
                >
                  {{ tag.emoji }}
                </span>
              </div>
            </div>
          </el-popover>
          <span v-else class="fg-cell-seq">{{
            showMarkMode &&
            element.adventurer &&
            element.adventurer.roleTag &&
            ROLE_TAG_MAP[element.adventurer.roleTag]
              ? ROLE_TAG_MAP[element.adventurer.roleTag].emoji
              : showMarkMode && element.adventurer
                ? '🏷️'
                : `${Math.floor(index / 5) + 1}-${(index % 5) + 1}`
          }}</span>

          <template v-if="element.adventurer">
            <GameAdventurerAvatar
              :adventurer="element.adventurer"
              class="w-full h-full rounded object-cover pointer-events-none select-none"
            />

            <!-- 被动增益色块（在 avatar 之后渲染，z-index 覆盖 avatar） -->
            <div
              v-for="indicator in getPassiveIndicators(element.adventurer)"
              :key="indicator.position"
              class="passive-indicator"
              :class="'passive-indicator--' + indicator.position"
              :style="{ backgroundColor: indicator.color }"
              :title="indicator.label"
            />

            <!-- 名字条 -->
            <div
              class="absolute bottom-0 left-0 right-0 text-center bg-black/50 text-[10px] text-white leading-tight py-px truncate"
            >
              {{ element.adventurer.name }}
            </div>
            <!-- 锁定标识（ArenaView） -->
            <div
              v-if="isLocked(element.adventurer._id)"
              class="absolute top-0 right-0.5 text-[10px]"
              title="已锁定"
            >
              🔒
            </div>

            <!-- 清除按钮（非拖拽模式 且 未锁定） -->
            <span
              v-if="!dragMode && !isLocked(element.adventurer._id)"
              class="fg-clear-btn"
              title="移除"
              @click.stop="emit('clear-cell', Math.floor(index / 5), index % 5)"
              >✕</span
            >
          </template>

          <template v-else>
            <span class="text-gray-400 text-lg">➕</span>
          </template>
        </div>
      </VueDraggable>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { VueDraggable } from 'vue-draggable-plus'
import {
  getPassiveIndicators,
  getElementColor
} from '@/composables/useFormationGrid.js'
import { ROLE_TAG_MAP } from 'shared/constants/index.js'

// ── Props ──
const props = defineProps({
  /**
   * 二维网格 modelValue[row][col] = adventurer | null（5×5）
   */
  modelValue: {
    type: Array,
    required: true
  },
  /** 已锁定的冒险家 ID 列表，锁定的冒险家不显示移除按钮并显示 🔒 */
  lockedIds: {
    type: Array,
    default: () => []
  },
  /** 是否开启角色标记的 Popover 编辑（FormationView 用） */
  showRoleTag: {
    type: Boolean,
    default: false
  },
  /** 角色标记选项列表 { value, emoji, label } */
  roleTagList: {
    type: Array,
    default: () => []
  },
  /** 角色标记操作进行中（禁用点击） */
  roleTagLoading: {
    type: Boolean,
    default: false
  },
  /** 格子尺寸（px），FormationView=68，ArenaView=56 */
  cellSize: {
    type: Number,
    default: 68
  },
  canDragMode: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits([
  'update:modelValue', // 拖拽后更新二维网格
  'cell-click', // (row, col)
  'clear-cell', // (row, col)
  'set-role-tag' // (row, col, tagValue)
])

// 暴露方法供父组件调用
defineExpose({
  /** 关闭拖拽排序模式 */
  disableDragMode() {
    dragMode.value = false
  }
})

// ── 将 2D grid 转为扁平数组供 draggable 使用 ──
function buildFlatGrid(grid) {
  let emptyId = 0
  const cells = []
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 5; c++) {
      const adv = grid[r]?.[c]
      cells.push({
        _key: adv ? `adv-${adv._id}` : `empty-${emptyId++}`,
        adventurer: adv ?? null
      })
    }
  }
  return cells
}

// ── 将扁平数组写回 2D grid ──
function flatToGrid(flat) {
  const grid = []
  for (let r = 0; r < 5; r++) {
    grid.push([])
    for (let c = 0; c < 5; c++) {
      grid[r].push(flat[r * 5 + c].adventurer)
    }
  }
  return grid
}

// ── 本地扁平棋盘（draggable 直接操作） ──
const localFlatGrid = ref(buildFlatGrid(props.modelValue))

// 标记拖拽刚结束，避免 emit → 父组件更新 modelValue → watcher 覆盖本地已交换的状态
let skipWatchOnce = false

// 父组件修改 grid（切换槽位等）→ 同步本地 flatGrid
watch(
  () => props.modelValue,
  val => {
    if (skipWatchOnce) {
      skipWatchOnce = false
      return
    }
    localFlatGrid.value = buildFlatGrid(val)
  },
  { deep: true }
)

// ── 拖拽 ──
const dragMode = ref(false)
const showMarkMode = ref(false)

// ── 长按1秒进入拖拽模式 ──
let cellLongPressTimer = null

function handleCellLongPressStart(event) {
  // if (dragMode.value) return
  // cellLongPressTimer = setTimeout(() => {
  //   dragMode.value = true
  //   cellLongPressTimer = null
  // }, 1000)
}

function handleCellLongPressEnd() {
  if (cellLongPressTimer) {
    clearTimeout(cellLongPressTimer)
    cellLongPressTimer = null
  }
}

function checkDragMove(evt) {
  // 只有有冒险家的格子才可拖动，且目标格子也必须有冒险家才可交换
  return !!(
    evt.draggedContext.element?.adventurer &&
    evt.relatedContext?.element?.adventurer
  )
}

// swap 模式下 sortablejs 已直接交换数组中的两个元素
// vue-draggable-plus 通过 v-model 同步了 localFlatGrid，直接 emit 结果即可
function onDragEnd(evt) {
  if (evt.oldIndex !== evt.newIndex) {
    skipWatchOnce = true
    emit('update:modelValue', flatToGrid(localFlatGrid.value))
  }
}

// ── 锁定检查 ──
function isLocked(advId) {
  return props.lockedIds.some(
    id => id === advId || id?.toString() === advId?.toString()
  )
}
</script>

<style scoped>
.fg-board {
  max-width: 100%;
  width: fit-content;
}

.fg-board-inner {
  display: grid;
  gap: 4px;
}

.fg-cell {
  border: 2px dashed rgba(200, 160, 80, 0.4);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.05);
  transition:
    border-color 0.2s,
    background 0.2s;
}

.fg-cell:hover {
  border-color: rgba(200, 160, 80, 0.8);
  background: rgba(255, 200, 50, 0.1);
}

.fg-cell--occupied {
  border-style: solid;
  border-color: rgba(200, 160, 80, 0.6);
}

.fg-cell--draggable {
  cursor: grab;
  touch-action: none;
  -webkit-user-select: none;
  user-select: none;
}

.fg-cell--draggable:active {
  cursor: grabbing;
}

/* 拖拽时 ghost（已经有 scoped 但 sortablejs 直接操作 DOM，需用 :deep 穿透） */
:deep(.fg-cell--ghost) {
  opacity: 0.4;
  border-color: #fbbf24 !important;
  background: rgba(251, 191, 36, 0.2) !important;
  box-shadow: 0 0 8px rgba(251, 191, 36, 0.4);
}

/* SwapPlugin 目标格子高亮（SwapPlugin 直接操作 DOM class，需用 :deep 穿透） */
:deep(.fg-cell--swap) {
  border-color: #34d399 !important;
  background: rgba(52, 211, 153, 0.2) !important;
  box-shadow: 0 0 10px rgba(52, 211, 153, 0.5) !important;
}

.fg-cell-seq {
  position: absolute;
  top: 0px;
  left: 0px;
  font-size: 12px;
  padding: 2px 1px !important;
  /* 白色加粗黑色半透明阴影 */
  color: #fff;
  text-shadow:
    -1px -1px 0 rgba(0, 0, 0, 0.5),
    1px -1px 0 rgba(0, 0, 0, 0.5),
    -1px 1px 0 rgba(0, 0, 0, 0.5),
    1px 1px 0 rgba(0, 0, 0, 0.5);
  line-height: 1;
  pointer-events: none;
  z-index: 1;
}

.fg-cell-seq--clickable {
  pointer-events: auto;
  cursor: pointer;
  background: rgba(0, 0, 0, 0.6);
  border-radius: 3px;
  padding: 1px 3px;
  transition: background 0.2s;
}

.fg-cell-seq--clickable:hover {
  background: rgba(0, 0, 0, 0.85);
}

.dark .fg-cell {
  background: rgba(30, 25, 20, 0.5);
}

/* 清除按钮 */
.fg-clear-btn {
  position: absolute;
  top: 1px;
  right: 1px;
  z-index: 10;
  cursor: pointer;
  font-size: 10px;
  line-height: 1;
  color: #fff;
  background: rgba(220, 60, 60, 0.9);
  border-radius: 3px;
  padding: 1px 3px;
  transition: opacity 0.2s;
}

/* 被动增益元素色块 */
.passive-indicator {
  position: absolute;
  z-index: 2;
  border-radius: 2px;
  pointer-events: none;
  border: 1px solid rgba(255, 255, 255, 0.8);
}

.passive-indicator--left {
  left: 0;
  top: 30%;
  bottom: 30%;
  width: 4px;
}

.passive-indicator--right {
  right: 0;
  top: 30%;
  bottom: 30%;
  width: 4px;
}

.passive-indicator--top {
  top: 0;
  left: 30%;
  right: 30%;
  height: 4px;
}

.passive-indicator--bottom {
  bottom: 0;
  left: 30%;
  right: 30%;
  height: 4px;
  z-index: 3;
}

/* @media (max-width: 400px) {
  .fg-board-inner {
    grid-template-columns: repeat(5, 48px) !important;
  }
  .fg-cell {
    width: 48px !important;
    height: 48px !important;
  }
} */
</style>

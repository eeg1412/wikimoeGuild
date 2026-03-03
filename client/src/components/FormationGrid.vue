<template>
  <div>
    <!-- 拖拽排序开关 -->
    <div class="flex justify-center mb-2">
      <el-checkbox v-model="dragMode" size="small">
        ☰ 拖拽排序模式
      </el-checkbox>
    </div>

    <!-- 5×5 棋盘 -->
    <div class="fg-board mx-auto">
      <draggable
        :list="localFlatGrid"
        item-key="_key"
        :disabled="!dragMode"
        :animation="200"
        :swap-threshold="0.65"
        ghost-class="fg-cell--ghost"
        class="fg-board-inner"
        :style="{ gridTemplateColumns: `repeat(5, ${cellSize}px)` }"
        :move="checkDragMove"
        @start="onDragStart"
        @end="onDragEnd"
      >
        <template #item="{ element, index }">
          <div
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
          >
            <span class="fg-cell-seq">{{ index + 1 }}</span>

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
              <!-- <el-popover
                v-if="showRoleTag"
                :width="200"
                trigger="click"
                placement="bottom"
              >
                <template #reference>
                  <span
                    class="absolute top-[1px] right-[1px] z-10 rounded-sm text-xs leading-none p-0.5 cursor-pointer bg-black/80"
                    @click.stop
                    @mousedown.stop
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
              </el-popover> -->

              <!-- 角色标记 — 仅展示（showRoleTag=false，用于 ArenaView） -->
              <!-- <span
                v-else-if="
                  element.adventurer.roleTag &&
                  ROLE_TAG_MAP[element.adventurer.roleTag]
                "
                class="absolute top-0 right-0 z-10 bg-black/65 rounded-bl text-xs leading-none p-0.5"
              >
                {{ ROLE_TAG_MAP[element.adventurer.roleTag].emoji }}
              </span> -->

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
                @click.stop="
                  emit('clear-cell', Math.floor(index / 5), index % 5)
                "
                >✕</span
              >
            </template>

            <template v-else>
              <span class="text-gray-400 text-lg">➕</span>
            </template>
          </div>
        </template>
      </draggable>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import draggable from 'vuedraggable'
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

// 父组件修改 grid（切换槽位等）→ 同步本地 flatGrid
watch(
  () => props.modelValue,
  val => {
    localFlatGrid.value = buildFlatGrid(val)
  },
  { deep: true }
)

// ── 拖拽 ──
const dragMode = ref(false)
let preDragSnapshot = null

function checkDragMove(evt) {
  return !!evt.draggedContext.element?.adventurer
}

function onDragStart() {
  preDragSnapshot = localFlatGrid.value.map(item => ({ ...item }))
}

function onDragEnd(evt) {
  const { oldIndex, newIndex } = evt
  if (oldIndex !== newIndex && preDragSnapshot) {
    // 恢复快照后执行交换，保证 vue-draggable 行为一致
    localFlatGrid.value.splice(0, 25, ...preDragSnapshot)
    const temp = localFlatGrid.value[oldIndex]
    localFlatGrid.value[oldIndex] = localFlatGrid.value[newIndex]
    localFlatGrid.value[newIndex] = temp
    emit('update:modelValue', flatToGrid(localFlatGrid.value))
  }
  preDragSnapshot = null
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

.fg-cell--ghost {
  opacity: 0.4;
  border-color: #fbbf24 !important;
  background: rgba(251, 191, 36, 0.2) !important;
  box-shadow: 0 0 8px rgba(251, 191, 36, 0.4);
}

.fg-cell-seq {
  position: absolute;
  top: 1px;
  left: 3px;
  font-size: 12px;
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

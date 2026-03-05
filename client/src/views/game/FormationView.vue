<template>
  <div class="w-full py-6" style="min-height: 60vh">
    <!-- 页面标题 -->
    <div class="mb-6 text-center">
      <h1 class="rpg-title text-2xl font-bold text-gray-800 dark:text-gray-100">
        🏗️ 阵容配置
      </h1>
      <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
        配置 5×5 棋盘，最多预设 10 套阵容
      </p>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="flex justify-center py-12">
      <span class="animate-spin inline-block text-4xl">⏳</span>
    </div>

    <template v-else>
      <!-- 阵容切换栏 -->
      <div class="flex flex-wrap justify-center gap-2 mb-6">
        <el-button
          v-for="slot in 10"
          :key="slot"
          :type="currentSlot === slot ? 'primary' : 'default'"
          size="small"
          @click="switchSlot(slot)"
        >
          {{ getSlotLabel(slot) }}
        </el-button>
      </div>

      <!-- 阵容名字 -->
      <div class="mb-4 flex items-center gap-2 justify-center">
        <el-input
          v-model="formationName"
          placeholder="阵容名称"
          maxlength="20"
          class="max-w-50!"
          size="small"
        />
      </div>

      <!-- 5×5 棋盘 -->
      <div class="mb-4">
        <p class="text-sm text-gray-400 text-center mb-2">
          ↑ 前排（面向敌人）· ↓ 后排
        </p>
        <div class="flex justify-center">
          <FormationGrid
            ref="formationGridRef"
            v-model="grid"
            show-role-tag
            :role-tag-list="ROLE_TAGS"
            :role-tag-loading="roleTagLoading"
            @cell-click="handleCellClick"
            @clear-cell="handleClearCell"
            @set-role-tag="handleGridRoleTag"
          />
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="flex justify-center gap-3 mb-6 flex-wrap">
        <el-button
          type="primary"
          :loading="saving"
          :disabled="saving"
          @click="handleSave"
        >
          💾 保存阵容
        </el-button>
        <el-button
          type="danger"
          :loading="deleting"
          :disabled="deleting || !existingFormation"
          @click="handleDelete"
        >
          🗑️ 删除阵容
        </el-button>
        <el-button :disabled="!hasUnsavedChanges" @click="handleRestore">
          ↩️ 还原
        </el-button>
        <el-button @click="handleClear"> 清空棋盘 </el-button>
      </div>

      <!-- 已放置计数 + 综合战斗力 -->
      <p class="text-center text-sm text-gray-400 mb-2">
        已放置 {{ placedCount }} / 25 名冒险家
      </p>
      <p class="text-center text-sm text-orange-400 font-mono mb-4">
        ⚔️ 综合战斗力: {{ formationCombatPower }}
      </p>
    </template>

    <!-- ==================== 选择冒险家弹窗 ==================== -->
    <el-dialog
      v-model="pickDialogVisible"
      title="选择冒险家"
      width="340px"
      align-center
      :destroy-on-close="true"
    >
      <div v-if="adventurersLoading" class="text-center py-6">
        <span class="animate-spin inline-block text-2xl">⏳</span>
      </div>
      <template v-else>
        <!-- 当前格子上的冒险家 -->
        <div
          v-if="cellAdventurer"
          class="mb-3 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg"
        >
          <div class="flex items-center gap-2">
            <GameAdventurerAvatar
              :adventurer="cellAdventurer"
              class="w-8 h-8 rounded-full"
            />
            <span
              class="text-sm font-semibold text-gray-700 dark:text-gray-200"
            >
              {{ cellAdventurer.name }}
            </span>
            <el-button type="danger" text size="small" @click="removeFromCell"
              >移除</el-button
            >
          </div>
        </div>

        <!-- 分组 Tabs -->
        <el-tabs v-model="pickTab" class="mb-2">
          <el-tab-pane label="未放置" name="unplaced" />
          <el-tab-pane label="已放置" name="placed" />
        </el-tabs>

        <!-- 标签筛选 -->
        <div class="flex flex-wrap gap-1 mb-2">
          <el-button
            :type="pickFilterTag === '' ? 'primary' : 'default'"
            size="small"
            @click="handlePickFilterTag('')"
          >
            全部
          </el-button>
          <el-button
            v-for="tag in ROLE_TAGS"
            :key="tag.value"
            :type="pickFilterTag === tag.value ? 'primary' : 'default'"
            size="small"
            @click="handlePickFilterTag(tag.value)"
          >
            {{ tag.emoji }}
          </el-button>
        </div>

        <!-- 可选列表 -->
        <div class="space-y-1 max-h-60 overflow-y-auto">
          <div
            v-for="adv in filteredPickAdventurers"
            :key="adv._id"
            class="flex items-center gap-2 p-2 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            @click="placeAdventurer(adv)"
          >
            <GameAdventurerAvatar
              :adventurer="adv"
              class="w-8 h-8 rounded-full border"
              :style="{ borderColor: getElementColor(adv.elements) }"
            />
            <div class="flex-1 min-w-0">
              <p class="text-sm text-gray-700 dark:text-gray-200 truncate">
                {{ adv.name }}
              </p>
              <p class="text-xs text-gray-400">
                {{ getElementName(adv.elements) }} · Lv.{{
                  adv.comprehensiveLevel || 1
                }}
              </p>
            </div>
            <span
              v-if="isPlaced(adv._id)"
              class="text-xs text-yellow-500 border border-yellow-500 px-1 rounded"
            >
              已放置
            </span>
          </div>
        </div>

        <div
          v-if="filteredPickAdventurers.length === 0"
          class="text-center py-4 text-gray-400 text-sm"
        >
          暂无冒险家
        </div>
      </template>
    </el-dialog>

    <!-- ==================== 冒险家详情弹窗 ==================== -->
    <AdventurerDetailDialog
      v-model="advDetailVisible"
      :adventurer-id="advDetailId"
      show-manage
      @updated="handleAdvDetailUpdated"
    >
      <template #footer>
        <div class="flex justify-center gap-2 mt-2">
          <el-button size="small" @click="handleDetailReplace"
            >🔄 替换</el-button
          >
          <el-button type="danger" size="small" @click="handleDetailRemove"
            >🗑️ 移除</el-button
          >
        </div>
      </template>
    </AdventurerDetailDialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import FormationGrid from '@/components/FormationGrid.vue'
import {
  getMyFormationsApi,
  saveFormationApi,
  deleteFormationApi
} from '@/api/game/formation.js'
import { getMyAdventurersApi, setRoleTagApi } from '@/api/game/adventurer.js'
import { useGameUser } from '@/composables/useGameUser.js'
import { useDialogRoute } from '@/composables/useDialogRoute.js'
import {
  createEmptyGrid,
  isAdventurerPlaced,
  placeAdventurerOnGrid,
  getPassiveIndicators,
  getElementColor,
  getElementName,
  ELEMENT_MAP
} from '@/composables/useFormationGrid.js'
import { ROLE_TAG_MAP } from 'shared/constants/index.js'
import AdventurerDetailDialog from '@/components/AdventurerDetailDialog.vue'
import { calculateCombatPower } from 'shared/utils/gameDatabase.js'

const router = useRouter()

// ── 角色标记 ──
const ROLE_TAGS = Object.entries(ROLE_TAG_MAP).map(([value, info]) => ({
  value,
  ...info
}))
const { isLoggedIn } = useGameUser()

if (!isLoggedIn.value) {
  router.replace({ name: 'GameLogin' })
}

// ── 数据 ──
const loading = ref(true)
const allFormations = ref([])
const allAdventurers = ref([])
const adventurersLoading = ref(false)

const currentSlot = ref(1)
const formationName = ref('')
// 5x5 grid: grid[row][col] = adventurer object or null
const grid = ref(createEmptyGrid())

// 棋盘组件 ref
const formationGridRef = ref(null)

// 保存时的快照（用于还原）
const savedGridSnapshot = ref(null)
const savedFormationNameSnapshot = ref('')

const existingFormation = computed(() => {
  return allFormations.value.find(f => f.slot === currentSlot.value)
})

// 是否有未保存的变更
const hasUnsavedChanges = computed(() => {
  if (!savedGridSnapshot.value) {
    // 没有快照说明是新阵容，检查是否放置了冒险家
    return placedCount.value > 0 || formationName.value !== ''
  }
  // 对比名字
  if (formationName.value !== savedFormationNameSnapshot.value) return true
  // 对比棋盘
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 5; c++) {
      const cur = grid.value[r][c]
      const snap = savedGridSnapshot.value[r][c]
      if ((cur?._id || null) !== (snap?._id || null)) return true
    }
  }
  return false
})

const placedCount = computed(() => {
  let count = 0
  for (const row of grid.value) {
    for (const cell of row) {
      if (cell) count++
    }
  }
  return count
})

const formationCombatPower = computed(() => {
  let total = 0
  for (const row of grid.value) {
    for (const cell of row) {
      if (cell) {
        total += calculateCombatPower(cell, cell.runeStone || null)
      }
    }
  }
  return total
})

function getSlotLabel(slot) {
  const f = allFormations.value.find(fm => fm.slot === slot)
  return f?.name || `阵容 ${slot}`
}

function getCell(row, col) {
  return grid.value[row]?.[col] || null
}

// ── 加载阵容列表 ──
async function fetchFormations() {
  loading.value = true
  try {
    const res = await getMyFormationsApi()
    allFormations.value = res.data.data || []
    loadSlot(currentSlot.value)
  } catch {
    allFormations.value = []
  } finally {
    loading.value = false
  }
}

// ── 加载冒险家 ──
async function fetchAdventurers() {
  adventurersLoading.value = true
  try {
    const res = await getMyAdventurersApi()
    allAdventurers.value = res.data.data || []
  } catch {
    allAdventurers.value = []
  } finally {
    adventurersLoading.value = false
  }
}

// ── 切换阵容槽位 ──
function switchSlot(slot) {
  currentSlot.value = slot
  loadSlot(slot)
}

function loadSlot(slot) {
  const f = allFormations.value.find(fm => fm.slot === slot)
  if (f) {
    formationName.value = f.name || ''
    // 从服务端数据恢复 grid
    const newGrid = createEmptyGrid()
    if (f.grid && Array.isArray(f.grid)) {
      for (let r = 0; r < 5; r++) {
        for (let c = 0; c < 5; c++) {
          const advData = f.grid[r]?.[c]
          if (advData && typeof advData === 'object' && advData._id) {
            newGrid[r][c] = advData
          } else if (advData) {
            // 如果只有 ID，尝试从冒险家列表匹配
            const found = allAdventurers.value.find(
              a => a._id === advData || a._id === advData.toString()
            )
            newGrid[r][c] = found || null
          }
        }
      }
    }
    grid.value = newGrid
    takeSnapshot()
  } else {
    formationName.value = ''
    grid.value = createEmptyGrid()
    savedGridSnapshot.value = null
    savedFormationNameSnapshot.value = ''
  }
}

/** 拍快照（保存当前棋盘状态用于还原） */
function takeSnapshot() {
  savedGridSnapshot.value = grid.value.map(row =>
    row.map(cell => (cell ? { ...cell } : null))
  )
  savedFormationNameSnapshot.value = formationName.value
}

/** 还原到上次保存状态 */
function handleRestore() {
  if (!savedGridSnapshot.value && placedCount.value === 0) return
  if (savedGridSnapshot.value) {
    grid.value = savedGridSnapshot.value.map(row =>
      row.map(cell => (cell ? { ...cell } : null))
    )
    formationName.value = savedFormationNameSnapshot.value
  } else {
    grid.value = createEmptyGrid()
    formationName.value = ''
  }
  ElMessage.info('已还原到上次保存状态')
}

// ── 棋盘交互 ──
const pickDialogVisible = ref(false)
const pickRow = ref(0)
const pickCol = ref(0)

// ── 冒险家详情弹窗 ──
const { visible: advDetailVisible } = useDialogRoute('advDetail')
const advDetailId = ref('')

const cellAdventurer = computed(() => {
  return getCell(pickRow.value, pickCol.value)
})

const availableAdventurers = computed(() => {
  return allAdventurers.value
})

const pickTab = ref('unplaced')

// ── 选择弹窗标签筛选 ──
const pickFilterTag = ref('')

function handlePickFilterTag(tag) {
  pickFilterTag.value = tag
}

const filteredPickAdventurers = computed(() => {
  let list
  if (pickTab.value === 'placed') {
    list = allAdventurers.value.filter(adv => isPlaced(adv._id))
  } else {
    list = allAdventurers.value.filter(adv => !isPlaced(adv._id))
  }
  if (pickFilterTag.value) {
    list = list.filter(adv => adv.roleTag === pickFilterTag.value)
  }
  return list
})

function isPlaced(advId) {
  return isAdventurerPlaced(grid.value, advId)
}

function handleCellClick(row, col) {
  const cell = getCell(row, col)
  if (cell) {
    // 已放置冒险家 → 先加载数据再显示详情弹窗
    advDetailId.value = cell._id
    advDetailVisible.value = true
  } else {
    // 空格子 → 检查冒险家数据是否已加载
    if (adventurersLoading.value) {
      ElMessage.warning('冒险家数据加载中，请稍候')
      return
    }
    pickRow.value = row
    pickCol.value = col
    pickDialogVisible.value = true
  }
}

function handleAdvDetailUpdated(updatedAdv) {
  // 同步更新棋盘上的冒险家数据
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 5; c++) {
      if (grid.value[r][c]?._id === updatedAdv._id) {
        grid.value[r][c] = updatedAdv
      }
    }
  }
  // 也更新冒险家列表
  const idx = allAdventurers.value.findIndex(a => a._id === updatedAdv._id)
  if (idx !== -1) {
    allAdventurers.value[idx] = updatedAdv
  }
}

function placeAdventurer(adv) {
  placeAdventurerOnGrid(grid.value, pickRow.value, pickCol.value, adv)
  pickDialogVisible.value = false
}

function removeFromCell() {
  grid.value[pickRow.value][pickCol.value] = null
  pickDialogVisible.value = false
}

// 从详情弹窗中替换冒险家
function handleDetailReplace() {
  const pos = findAdvPosition(advDetailId.value)
  if (!pos) return
  advDetailVisible.value = false
  pickRow.value = pos.row
  pickCol.value = pos.col
  pickDialogVisible.value = true
}

// 从详情弹窗中移除冒险家
function handleDetailRemove() {
  const pos = findAdvPosition(advDetailId.value)
  if (!pos) return
  grid.value[pos.row][pos.col] = null
  advDetailVisible.value = false
}

function findAdvPosition(advId) {
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 5; c++) {
      if (grid.value[r][c]?._id === advId) {
        return { row: r, col: c }
      }
    }
  }
  return null
}

function handleClear() {
  grid.value = createEmptyGrid()
}

function handleClearCell(row, col) {
  grid.value[row][col] = null
}

// ── 角色标记（棋盘） ──
const roleTagLoading = ref(false)
async function handleGridRoleTag(row, col, tagValue) {
  const cell = getCell(row, col)
  if (!cell || roleTagLoading.value) return
  const newTag = cell.roleTag === tagValue ? '' : tagValue
  roleTagLoading.value = true
  try {
    const res = await setRoleTagApi(cell._id, { roleTag: newTag })
    grid.value[row][col] = { ...cell, ...res.data.data }
    const idx = allAdventurers.value.findIndex(a => a._id === cell._id)
    if (idx !== -1) {
      allAdventurers.value[idx] = {
        ...allAdventurers.value[idx],
        ...res.data.data
      }
    }
  } catch {
    // 错误已由拦截器处理
  } finally {
    roleTagLoading.value = false
  }
}

// ── 保存 ──
const saving = ref(false)
async function handleSave() {
  // 构建 grid 数据（只传 ID）
  const gridData = grid.value.map(row =>
    row.map(cell => (cell ? cell._id : null))
  )

  saving.value = true
  try {
    const actualName = formationName.value || `阵容 ${currentSlot.value}`
    await saveFormationApi({
      slot: currentSlot.value,
      name: actualName,
      grid: gridData
    })
    ElMessage.success('阵容保存成功！')
    // 写回实际使用的名称，保证输入框与保存结果同步
    formationName.value = actualName
    // 更新本地数据而不是重新加载，避免页面抖动
    const existIdx = allFormations.value.findIndex(
      f => f.slot === currentSlot.value
    )
    const savedFormation = {
      slot: currentSlot.value,
      name: actualName,
      grid: grid.value
    }
    if (existIdx >= 0) {
      allFormations.value[existIdx] = {
        ...allFormations.value[existIdx],
        ...savedFormation
      }
    } else {
      allFormations.value.push(savedFormation)
    }
    // 保存后关闭拖拽模式并拍快照
    formationGridRef.value?.disableDragMode()
    takeSnapshot()
  } catch (e) {
    // 错误已由拦截器处理
  } finally {
    saving.value = false
  }
}

// ── 删除 ──
const deleting = ref(false)
async function handleDelete() {
  try {
    await ElMessageBox.confirm('确定删除该阵容？', '确认', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning'
    })
  } catch {
    return
  }

  deleting.value = true
  try {
    await deleteFormationApi(currentSlot.value)
    ElMessage.success('阵容已删除')
    grid.value = createEmptyGrid()
    formationName.value = ''
    // 更新本地数据而不是重新加载，避免页面抖动
    allFormations.value = allFormations.value.filter(
      f => f.slot !== currentSlot.value
    )
  } catch (e) {
    // 错误已由拦截器处理
  } finally {
    deleting.value = false
  }
}

// ── 初始化 ──
onMounted(async () => {
  await fetchAdventurers()
  await fetchFormations()
})
</script>

<style scoped>
.rpg-title {
  font-family: 'serif';
  text-shadow: 0 0 10px rgba(255, 200, 50, 0.4);
  animation: titleGlow 3s ease-in-out infinite;
}
@keyframes titleGlow {
  0%,
  100% {
    text-shadow: 0 0 8px rgba(255, 200, 50, 0.3);
  }
  50% {
    text-shadow: 0 0 18px rgba(255, 200, 50, 0.7);
  }
}

.grid-board {
  max-width: 100%;
  width: fit-content;
}

.grid-board-inner {
  display: grid;
  grid-template-columns: repeat(5, 68px);
  gap: 4px;
}

.grid-cell {
  width: 68px;
  height: 68px;
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

.grid-cell:hover {
  border-color: rgba(200, 160, 80, 0.8);
  background: rgba(255, 200, 50, 0.1);
}

.grid-cell--occupied {
  border-style: solid;
  border-color: rgba(200, 160, 80, 0.6);
}

.grid-cell--draggable {
  cursor: grab;
  touch-action: none;
  -webkit-user-select: none;
  user-select: none;
}

.grid-cell--draggable:active {
  cursor: grabbing;
}

.grid-cell--ghost {
  opacity: 0.4;
  border-color: #fbbf24 !important;
  background: rgba(251, 191, 36, 0.2) !important;
  box-shadow: 0 0 8px rgba(251, 191, 36, 0.4);
}

.grid-cell-seq {
  position: absolute;
  top: 1px;
  left: 3px;
  font-size: 10px;
  color: rgba(140, 120, 80, 0.6);
  line-height: 1;
  pointer-events: none;
  z-index: 1;
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

.dark .grid-cell {
  background: rgba(30, 25, 20, 0.5);
}

/* 清除按钮 */
.clear-btn {
  position: absolute;
  top: 1px;
  left: 1px;
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

/* 选择列表中的被动增益色块 */
.passive-dot {
  position: absolute;
  border-radius: 2px;
  opacity: 0.85;
  pointer-events: none;
}
.passive-dot--left {
  left: -2px;
  top: 25%;
  bottom: 25%;
  width: 3px;
}
.passive-dot--right {
  right: -2px;
  top: 25%;
  bottom: 25%;
  width: 3px;
}
.passive-dot--top {
  top: -2px;
  left: 25%;
  right: 25%;
  height: 3px;
}
.passive-dot--bottom {
  bottom: -2px;
  left: 25%;
  right: 25%;
  height: 3px;
}

@media (max-width: 400px) {
  .grid-board-inner {
    grid-template-columns: repeat(5, 56px);
  }
  .grid-cell {
    width: 56px;
    height: 56px;
  }
}
</style>

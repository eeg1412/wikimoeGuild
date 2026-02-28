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
        <p class="text-xs text-gray-400 text-center mb-2">
          ↑ 前排（面向敌人）· ↓ 后排
        </p>
        <div class="grid-board mx-auto">
          <div v-for="row in 5" :key="row" class="grid-row">
            <div
              v-for="col in 5"
              :key="col"
              class="grid-cell"
              :class="{ 'grid-cell--occupied': getCell(row - 1, col - 1) }"
              @click="handleCellClick(row - 1, col - 1)"
            >
              <span class="grid-cell-seq">{{ (row - 1) * 5 + col }}</span>
              <template v-if="getCell(row - 1, col - 1)">
                <GameAdventurerAvatar
                  :adventurer="getCell(row - 1, col - 1)"
                  class="w-full h-full rounded object-cover"
                />
                <div
                  class="absolute bottom-0 left-0 right-0 text-center bg-black/60 text-[10px] text-white leading-tight py-px truncate"
                >
                  {{ getCell(row - 1, col - 1).name }}
                </div>
              </template>
              <template v-else>
                <span class="text-gray-400 text-lg">➕</span>
              </template>
            </div>
          </div>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="flex justify-center gap-3 mb-6">
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
        <el-button @click="handleClear"> 清空棋盘 </el-button>
      </div>

      <!-- 已放置计数 -->
      <p class="text-center text-xs text-gray-400 mb-4">
        已放置 {{ placedCount }} / 25 名冒险家
      </p>
    </template>

    <!-- ==================== 选择冒险家弹窗 ==================== -->
    <el-dialog
      v-model="pickDialogVisible"
      title="选择冒险家"
      width="340px"
      align-center
      :destroy-on-close="false"
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

        <!-- 可选列表 -->
        <div class="space-y-1 max-h-60 overflow-y-auto">
          <div
            v-for="adv in availableAdventurers"
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
              <p class="text-[10px] text-gray-400">
                {{ getElementName(adv.elements) }} · Lv.{{
                  adv.comprehensiveLevel || 1
                }}
              </p>
            </div>
            <span
              v-if="isPlaced(adv._id)"
              class="text-[10px] text-yellow-500 border border-yellow-500 px-1 rounded"
            >
              已放置
            </span>
          </div>
        </div>

        <div
          v-if="availableAdventurers.length === 0"
          class="text-center py-4 text-gray-400 text-sm"
        >
          暂无冒险家
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  getMyFormationsApi,
  saveFormationApi,
  deleteFormationApi
} from '@/api/game/formation.js'
import { getMyAdventurersApi } from '@/api/game/adventurer.js'
import { useGameUser } from '@/composables/useGameUser.js'

const router = useRouter()
const { isLoggedIn } = useGameUser()

if (!isLoggedIn.value) {
  router.replace({ name: 'GameLogin' })
}

// ── 元素工具 ──
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
function getElementName(el) {
  return ELEMENT_MAP[el]?.name || el
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

function createEmptyGrid() {
  return Array.from({ length: 5 }, () => Array.from({ length: 5 }, () => null))
}

const existingFormation = computed(() => {
  return allFormations.value.find(f => f.slot === currentSlot.value)
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
  } else {
    formationName.value = ''
    grid.value = createEmptyGrid()
  }
}

// ── 棋盘交互 ──
const pickDialogVisible = ref(false)
const pickRow = ref(0)
const pickCol = ref(0)

const cellAdventurer = computed(() => {
  return getCell(pickRow.value, pickCol.value)
})

const availableAdventurers = computed(() => {
  return allAdventurers.value
})

function isPlaced(advId) {
  for (const row of grid.value) {
    for (const cell of row) {
      if (cell && cell._id === advId) return true
    }
  }
  return false
}

function handleCellClick(row, col) {
  pickRow.value = row
  pickCol.value = col
  pickDialogVisible.value = true
}

function placeAdventurer(adv) {
  // 如果这个冒险家已经在其他位置，先移除
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 5; c++) {
      if (grid.value[r][c] && grid.value[r][c]._id === adv._id) {
        grid.value[r][c] = null
      }
    }
  }
  grid.value[pickRow.value][pickCol.value] = adv
  pickDialogVisible.value = false
}

function removeFromCell() {
  grid.value[pickRow.value][pickCol.value] = null
  pickDialogVisible.value = false
}

function handleClear() {
  grid.value = createEmptyGrid()
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
    await saveFormationApi({
      slot: currentSlot.value,
      name: formationName.value || `阵容 ${currentSlot.value}`,
      grid: gridData
    })
    ElMessage.success('阵容保存成功！')
    // 更新本地数据而不是重新加载，避免页面抖动
    const existIdx = allFormations.value.findIndex(
      f => f.slot === currentSlot.value
    )
    const savedFormation = {
      slot: currentSlot.value,
      name: formationName.value || `阵容 ${currentSlot.value}`,
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
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-width: 320px;
}

.grid-row {
  display: flex;
  gap: 4px;
}

.grid-cell {
  width: 56px;
  height: 56px;
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

.grid-cell-seq {
  position: absolute;
  top: 1px;
  left: 3px;
  font-size: 9px;
  color: rgba(140, 120, 80, 0.6);
  line-height: 1;
  pointer-events: none;
  z-index: 1;
}

.dark .grid-cell {
  background: rgba(30, 25, 20, 0.5);
}

@media (max-width: 400px) {
  .grid-cell {
    width: 48px;
    height: 48px;
  }
}
</style>

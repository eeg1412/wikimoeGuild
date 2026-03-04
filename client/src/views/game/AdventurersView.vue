<template>
  <div class="w-full py-6" style="min-height: 60vh">
    <!-- 页面标题 -->
    <div class="mb-6 text-center">
      <h1 class="rpg-title text-2xl font-bold text-gray-800 dark:text-gray-100">
        ⚔️ 冒险家公会
      </h1>
      <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
        您的公会共有
        <span class="text-yellow-500 font-semibold">{{
          adventurers.length
        }}</span>
        / {{ maxAdventurerCap }} 名冒险家
      </p>
    </div>

    <!-- 招募按钮 -->
    <div class="text-center mb-4">
      <p class="text-sm text-yellow-500 font-semibold mb-1">
        🪙 {{ (playerInfo?.gold ?? 0).toLocaleString() }} 金币
      </p>
      <el-button
        type="warning"
        round
        :loading="recruiting"
        :disabled="recruiting || adventurers.length >= maxAdventurerCap"
        @click="handleRecruit"
      >
        🪙 招募冒险家（{{ gameSettings.adventurerRecruitPrice ?? 10000 }} 金币）
      </el-button>
    </div>

    <!-- 筛选栏 -->
    <div class="flex flex-wrap justify-center gap-1.5 mb-2">
      <el-button
        :type="filterTag === '' ? 'primary' : 'default'"
        size="small"
        @click="handleFilterTag('')"
      >
        全部
      </el-button>
      <el-button
        v-for="tag in ROLE_TAGS"
        :key="tag.value"
        :type="filterTag === tag.value ? 'primary' : 'default'"
        size="small"
        @click="handleFilterTag(tag.value)"
      >
        {{ tag.emoji }} {{ tag.label }}
      </el-button>
      <el-button
        :type="filterTag === 'none' ? 'primary' : 'default'"
        size="small"
        @click="handleFilterTag('none')"
      >
        🏷️ 未设定
      </el-button>
    </div>

    <!-- 排序栏 + 批量操作 -->
    <div class="flex justify-center items-center gap-2 mb-4 flex-wrap">
      <el-select
        v-model="sortMode"
        size="small"
        style="width: 160px"
        @change="handleSortChange"
      >
        <el-option label="默认排序" value="default" />
        <el-option label="等级（高→低）" value="level_desc" />
        <el-option label="等级（低→高）" value="level_asc" />
      </el-select>
      <el-checkbox v-model="batchMode" size="small">批量选择</el-checkbox>
      <template v-if="batchMode && selectedIds.size > 0">
        <el-button
          type="warning"
          size="small"
          :loading="batchEquipLoading"
          :disabled="batchEquipLoading"
          @click="handleBatchEquipBest"
        >
          💎 批量装备符文石 ({{ selectedIds.size }})
        </el-button>
        <el-dropdown
          split-button
          type="primary"
          size="small"
          trigger="click"
          :disabled="batchRatioLoading"
          @click="handleBatchUpDefault"
          @command="handleBatchUpCommand"
        >
          📈 批量升级+10
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item :command="1">+1</el-dropdown-item>
              <el-dropdown-item :command="5">+5</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
        <el-dropdown
          split-button
          type="danger"
          size="small"
          trigger="click"
          :disabled="batchRatioLoading"
          @click="handleBatchDownDefault"
          @command="handleBatchDownCommand"
        >
          📉 批量降级-10
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item :command="1">-1</el-dropdown-item>
              <el-dropdown-item :command="5">-5</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </template>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="flex justify-center py-12">
      <span class="animate-spin inline-block text-4xl">⏳</span>
    </div>

    <!-- 冒险家网格 -->
    <div
      v-else-if="filteredAdventurers.length > 0"
      class="grid grid-cols-3 sm:grid-cols-4 gap-4"
    >
      <div
        v-for="adv in filteredAdventurers"
        :key="adv._id"
        class="rpg-card relative flex flex-col items-center p-3 rounded-xl cursor-pointer group"
        :class="{ 'ring-2 ring-yellow-400': selectedIds.has(adv._id) }"
        @click="handleCardClick(adv)"
        @mousedown="handleAdvLongPressStart(adv)"
        @mouseup="handleAdvLongPressEnd"
        @mouseleave="handleAdvLongPressEnd"
        @touchstart.passive="handleAdvLongPressStart(adv)"
        @touchend="handleAdvLongPressEnd"
        @touchcancel="handleAdvLongPressEnd"
      >
        <!-- 批量选择复选框 -->
        <div v-if="batchMode" class="absolute top-1 right-1 z-20" @click.stop>
          <el-checkbox
            :model-value="selectedIds.has(adv._id)"
            size="small"
            @change="handleToggleSelect(adv._id)"
          />
        </div>
        <!-- 元素菱形徽章 -->
        <div
          v-if="!batchMode"
          class="absolute top-2 right-2 w-4 h-4 rotate-45 border-2 border-white dark:border-gray-700 shadow-sm z-10"
          :style="{ backgroundColor: getElementColor(adv.elements) }"
        />

        <!-- 角色标记（点击可切换） -->
        <el-popover
          :width="190"
          trigger="click"
          placement="bottom-start"
          @click.stop
        >
          <template #reference>
            <span
              class="absolute top-1 left-1 z-10 bg-black/65 text-white rounded px-1.5 py-1 leading-none text-xs flex items-center gap-0.5 cursor-pointer hover:bg-black/80 transition-colors select-none"
              @click.stop
            >
              <template v-if="adv.roleTag && ROLE_TAG_MAP[adv.roleTag]">
                {{ ROLE_TAG_MAP[adv.roleTag].emoji }}
                {{ ROLE_TAG_MAP[adv.roleTag].label }}
              </template>
              <template v-else>🏷️ 未设定</template>
            </span>
          </template>
          <div>
            <!-- 标题 -->
            <p
              class="text-sm font-medium mb-2 text-gray-700 dark:text-gray-200"
            >
              设置角色标记
            </p>
            <!-- 选择 -->
            <div class="flex flex-wrap gap-1 p-1 justify-center">
              <span
                v-for="tag in ROLE_TAGS"
                :key="tag.value"
                class="cursor-pointer text-base px-1.5 py-0.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                :class="[
                  adv.roleTag === tag.value
                    ? 'bg-yellow-200 dark:bg-yellow-700'
                    : '',
                  roleTagLoadingId === adv._id
                    ? 'opacity-50 pointer-events-none'
                    : ''
                ]"
                :title="tag.label"
                @click="handleSetRoleTag(adv, tag.value)"
              >
                {{ tag.emoji }}
              </span>
            </div>
          </div>
        </el-popover>

        <!-- 头像 -->
        <div class="relative w-16 h-16 sm:w-20 sm:h-20 mb-2">
          <GameAdventurerAvatar
            :adventurer="adv"
            :alt="adv.name"
            class="w-full h-full rounded-full object-cover border-2 border-gray-200 dark:border-gray-600 group-hover:border-yellow-400 transition-colors"
          />
          <div
            class="avatar-glow absolute inset-0 rounded-full"
            :style="{ '--glow-color': getElementColor(adv.elements) }"
          />
        </div>

        <!-- 名字 -->
        <p
          class="text-sm font-medium text-gray-700 dark:text-gray-200 text-center truncate w-full"
        >
          {{ adv.name }}
        </p>

        <!-- 元素标签 -->
        <span
          class="mt-1 text-sm px-1.5 py-0.5 rounded-full text-white font-medium"
          :style="{ backgroundColor: getElementColor(adv.elements) }"
        >
          {{ getElementName(adv.elements) }}
        </span>

        <!-- 综合等级 -->
        <p class="text-sm text-yellow-500 mt-1 font-mono">
          Lv.{{ adv.comprehensiveLevel || 1 }}
        </p>

        <!-- 装备状态标签 -->
        <div
          v-if="adv.runeStone"
          class="mt-1 text-xs px-1.5 py-0.5 rounded-full border cursor-pointer hover:opacity-80 text-center w-full"
          :class="runeStoneCardClass(adv.runeStone.rarity)"
          @click.stop="handleShowRuneStoneManage(adv)"
        >
          💎 {{ rarityName(adv.runeStone.rarity) }} Lv.{{ adv.runeStone.level }}
        </div>

        <!-- 属性升降级按钮 -->
        <el-button
          type="warning"
          size="small"
          class="mt-1 w-full"
          style="font-size: 12px"
          @click.stop="handleOpenStatUpgrade(adv)"
        >
          📈 升降级
        </el-button>
      </div>

      <!-- 快捷入口 -->
      <div class="col-span-full text-center mt-4 mb-2">
        <el-button type="primary" text size="small" @click="goToFormation">
          🏗️ 前往阵容配置
        </el-button>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-else class="text-center py-16 text-gray-400 dark:text-gray-600">
      <span class="text-5xl mb-3 block">🧑‍⚔️</span>
      <p>暂无冒险家，快去招募吧！</p>
    </div>

    <!-- ==================== 冒险家详情弹窗（统一组件） ==================== -->
    <AdventurerDetailDialog
      v-model="detailVisible"
      :adventurer-id="detailAdvId"
      show-manage
      @updated="handleAdvUpdated"
    />

    <!-- ==================== 符文石管理弹窗 ==================== -->
    <AdventurerRuneStoneDialog
      v-model="runeStoneDialogVisible"
      :adventurer="runeStoneDialogAdv"
      @updated="handleRuneStoneDialogUpdated"
    />

    <!-- ==================== 属性升降级弹窗 ==================== -->
    <el-dialog
      v-model="statUpgradeVisible"
      :title="
        statUpgradeAdv ? `${statUpgradeAdv.name} - 属性升降级` : '属性升降级'
      "
      width="380px"
      align-center
      destroy-on-close
      class="game-dialog"
    >
      <StatLevelUpPanel
        v-if="statUpgradeAdv"
        :adventurer="statUpgradeAdv"
        @updated="handleStatUpgradeUpdated"
      />
    </el-dialog>

    <!-- ==================== 批量升降级报表预览弹窗 ==================== -->
    <el-dialog
      v-model="batchReportVisible"
      :title="`批量${batchReportDirection === 'up' ? '升级' : '降级'}报表预览`"
      width="90%"
      style="max-width: 700px"
      align-center
      destroy-on-close
      class="game-dialog"
    >
      <div v-if="batchReportData.length" class="text-sm">
        <!-- 总览 -->
        <div
          class="mb-3 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded text-center"
        >
          <p>
            共 <b>{{ batchReportData.length }}</b> 名冒险家，每人
            {{ batchReportDirection === 'up' ? '+' : '-'
            }}{{ batchReportTotalPerAdv }} 级
          </p>
          <p class="mt-1">
            💰 总金币:
            <span class="text-yellow-500 font-bold">{{
              batchReportTotalGold.toLocaleString()
            }}</span>
          </p>
          <p v-if="batchReportDirection === 'up'" class="mt-1 space-x-2">
            <span
              >⚔️ 攻击水晶: {{ batchReportTotalCrystals.attackCrystal }}</span
            >
            <span
              >🛡️ 防御水晶: {{ batchReportTotalCrystals.defenseCrystal }}</span
            >
            <span
              >💨 速度水晶: {{ batchReportTotalCrystals.speedCrystal }}</span
            >
            <span>🧠 SAN水晶: {{ batchReportTotalCrystals.sanCrystal }}</span>
          </p>
        </div>

        <!-- 每个冒险家详情 -->
        <div class="max-h-60 overflow-y-auto space-y-2">
          <div
            v-for="item in batchReportData"
            :key="item.adventurerId"
            class="p-2 border rounded dark:border-gray-600"
          >
            <p class="font-medium">{{ item.name }}</p>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-1 text-xs mt-1">
              <span
                >⚔️ Lv.{{ item.currentLevels.attack }} → Lv.{{
                  item.newLevels.attack
                }}</span
              >
              <span
                >🛡️ Lv.{{ item.currentLevels.defense }} → Lv.{{
                  item.newLevels.defense
                }}</span
              >
              <span
                >💨 Lv.{{ item.currentLevels.speed }} → Lv.{{
                  item.newLevels.speed
                }}</span
              >
              <span
                >🧠 Lv.{{ item.currentLevels.san }} → Lv.{{
                  item.newLevels.san
                }}</span
              >
            </div>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
              综合 {{ item.currentLevels.comprehensive }} →
              {{ item.newLevels.comprehensive }} | 金币:
              {{ item.goldCost.toLocaleString() }}
              <template v-if="batchReportDirection === 'up'">
                | 水晶: 攻{{ item.crystalCost.attack }} 防{{
                  item.crystalCost.defense
                }}
                速{{ item.crystalCost.speed }} SAN{{ item.crystalCost.san }}
              </template>
            </p>
            <p v-if="item.error" class="text-xs text-red-500 mt-1">
              ⚠️ {{ item.error }}
            </p>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="batchReportVisible = false">取消</el-button>
        <el-button
          type="primary"
          :loading="batchRatioLoading"
          :disabled="batchRatioLoading || batchReportHasError"
          @click="handleConfirmBatchRatio"
        >
          确认{{ batchReportDirection === 'up' ? '升级' : '降级' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  getMyAdventurersApi,
  recruitAdventurerApi,
  setRoleTagApi,
  batchEquipBestRuneStonesApi,
  batchRatioDistributeApi
} from '@/api/game/adventurer.js'
import { getGameSettingsApi } from '@/api/game/config.js'
import { useGameUser } from '@/composables/useGameUser.js'
import { useDialogRoute } from '@/composables/useDialogRoute.js'
import { ROLE_TAG_MAP } from 'shared/constants/index.js'
import {
  getMaxAdventurerCount,
  getMaxComprehensiveLevel,
  getAdventurerLevelUpCrystalCost,
  getAdventurerLevelUpGoldCost
} from 'shared/utils/guildLevelUtils.js'

const ROLE_TAGS = Object.entries(ROLE_TAG_MAP).map(
  ([value, { emoji, label }]) => ({
    value,
    emoji,
    label
  })
)
import AdventurerDetailDialog from '@/components/AdventurerDetailDialog.vue'
import AdventurerRuneStoneDialog from '@/components/AdventurerRuneStoneDialog.vue'
import StatLevelUpPanel from '@/components/StatLevelUpPanel.vue'

const router = useRouter()
const { isLoggedIn, playerInfo, fetchPlayerInfo } = useGameUser()

if (!isLoggedIn.value) {
  router.replace({ name: 'GameLogin' })
}

// 公会等级限制的冒险家上限
const maxAdventurerCap = computed(() => {
  return getMaxAdventurerCount(playerInfo.value?.guildLevel || 1)
})

function goToFormation() {
  router.push({ name: 'GameFormations' })
}

// ── 数据 ──
const loading = ref(false)
const adventurers = ref([])
const gameSettings = ref({})

// ── 标签筛选 ──
const filterTag = ref('')

function handleFilterTag(tag) {
  filterTag.value = tag
}

// ── 排序 ──
const sortMode = ref('default')

function handleSortChange() {
  // v-model 已更新
}

const filteredAdventurers = computed(() => {
  let list = adventurers.value
  if (filterTag.value) {
    if (filterTag.value === 'none') {
      list = list.filter(a => !a.roleTag)
    } else {
      list = list.filter(a => a.roleTag === filterTag.value)
    }
  }
  if (sortMode.value === 'level_desc') {
    list = [...list].sort(
      (a, b) => (b.comprehensiveLevel || 1) - (a.comprehensiveLevel || 1)
    )
  } else if (sortMode.value === 'level_asc') {
    list = [...list].sort(
      (a, b) => (a.comprehensiveLevel || 1) - (b.comprehensiveLevel || 1)
    )
  }
  return list
})

// ── 元素映射 ──
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

function rarityName(r) {
  return { normal: '普通', rare: '稀有', legendary: '传说' }[r] || r
}

function runeStoneCardClass(r) {
  return (
    {
      normal: 'text-gray-400 border-gray-400',
      rare: 'text-blue-400 border-blue-400',
      legendary: 'text-yellow-400 border-yellow-400'
    }[r] || 'text-gray-400 border-gray-400'
  )
}

function handleShowRuneStoneManage(adv) {
  if (!adv.runeStone) return
  runeStoneDialogAdv.value = { ...adv }
  runeStoneDialogVisible.value = true
}

function handleCardClick(adv) {
  if (batchMode.value) {
    handleToggleSelect(adv._id)
  } else {
    openDetail(adv)
  }
}

// ── 冒险家列表 ──
async function fetchAdventurers() {
  loading.value = true
  try {
    const res = await getMyAdventurersApi()
    adventurers.value = res.data.data || []
  } catch {
    adventurers.value = []
  } finally {
    loading.value = false
  }
}

// ── 游戏配置 ──
async function fetchGameSettings() {
  try {
    const res = await getGameSettingsApi()
    gameSettings.value = res.data.data || {}
  } catch {
    // ignore
  }
}

// ── 招募 ──
const recruiting = ref(false)
async function handleRecruit() {
  recruiting.value = true
  try {
    await recruitAdventurerApi()
    ElMessage.success('招募成功！')
    await fetchAdventurers()
    await fetchPlayerInfo()
  } catch {
    // 错误已由拦截器处理
  } finally {
    recruiting.value = false
  }
}

// ── 角色标记 ──
const roleTagLoadingId = ref('')

async function handleSetRoleTag(adv, tagValue) {
  if (roleTagLoadingId.value) return
  const newTag = adv.roleTag === tagValue ? '' : tagValue
  roleTagLoadingId.value = adv._id
  try {
    const res = await setRoleTagApi(adv._id, { roleTag: newTag })
    const updated = res.data.data
    const idx = adventurers.value.findIndex(a => a._id === adv._id)
    if (idx >= 0)
      adventurers.value[idx] = { ...adventurers.value[idx], ...updated }
  } catch {
    // 错误已由拦截器处理
  } finally {
    roleTagLoadingId.value = ''
  }
}

// ── 详情弹窗 ──
const { visible: detailVisible } = useDialogRoute('detail')
const detailAdvId = ref('')

function openDetail(adv) {
  detailAdvId.value = adv._id
  detailVisible.value = true
}

function handleAdvUpdated(updatedAdv) {
  const idx = adventurers.value.findIndex(a => a._id === updatedAdv._id)
  if (idx >= 0) adventurers.value[idx] = { ...updatedAdv }
}

// ── 批量选择 & 批量装备 ──
const batchMode = ref(false)
const selectedIds = ref(new Set())
const batchEquipLoading = ref(false)

// ── 长按3秒进入批量选择 ──
let advLongPressTimer = null

function handleAdvLongPressStart(adv) {
  if (batchMode.value) return
  advLongPressTimer = setTimeout(() => {
    batchMode.value = true
    selectedIds.value = new Set([adv._id])
    advLongPressTimer = null
  }, 3000)
}

function handleAdvLongPressEnd() {
  if (advLongPressTimer) {
    clearTimeout(advLongPressTimer)
    advLongPressTimer = null
  }
}

function handleToggleSelect(id) {
  const newSet = new Set(selectedIds.value)
  if (newSet.has(id)) {
    newSet.delete(id)
  } else {
    newSet.add(id)
  }
  selectedIds.value = newSet
}

async function handleBatchEquipBest() {
  if (selectedIds.value.size === 0) return
  batchEquipLoading.value = true
  try {
    const res = await batchEquipBestRuneStonesApi({
      adventurerIds: [...selectedIds.value]
    })
    const { results } = res.data.data
    const equipped = results.filter(r => r.success).length
    ElMessage.success(`批量装备完成，${equipped} 名冒险家已装备符文石`)
    selectedIds.value = new Set()
    batchMode.value = false
    await fetchAdventurers()
  } catch {
    // handled by interceptor
  } finally {
    batchEquipLoading.value = false
  }
}

// ── 符文石管理弹窗 ──
const { visible: runeStoneDialogVisible } = useDialogRoute('rsManage')
const runeStoneDialogAdv = ref(null)

function handleRuneStoneDialogUpdated(updatedAdv) {
  const idx = adventurers.value.findIndex(a => a._id === updatedAdv._id)
  if (idx >= 0) adventurers.value[idx] = { ...updatedAdv }
  runeStoneDialogAdv.value = { ...updatedAdv }
}

// ── 属性升级弹窗 ──
const { visible: statUpgradeVisible } = useDialogRoute('statUpgrade')
const statUpgradeAdv = ref(null)

function handleOpenStatUpgrade(adv) {
  statUpgradeAdv.value = { ...adv }
  statUpgradeVisible.value = true
}

function handleStatUpgradeUpdated(updatedAdv) {
  const idx = adventurers.value.findIndex(a => a._id === updatedAdv._id)
  if (idx >= 0) adventurers.value[idx] = { ...updatedAdv }
  statUpgradeAdv.value = { ...updatedAdv }
}

// ── 批量按比例升降级 ──
const batchRatioLoading = ref(false)
const { visible: batchReportVisible } = useDialogRoute('batchReport')
const batchReportData = ref([])
const batchReportDirection = ref('up')
const batchReportTotalPerAdv = ref(0)
const batchReportTotalGold = ref(0)
const batchReportTotalCrystals = ref({
  attackCrystal: 0,
  defenseCrystal: 0,
  speedCrystal: 0,
  sanCrystal: 0
})
const batchReportHasError = ref(false)

function handleOpenBatchRatioReport(direction, totalLevels) {
  if (selectedIds.value.size === 0) return

  batchReportDirection.value = direction
  batchReportTotalPerAdv.value = totalLevels

  const crystalBase = gameSettings.value.adventurerLevelUpCrystalBase ?? 100
  const goldBase = gameSettings.value.adventurerLevelUpGoldBase ?? 500
  const downPricePerLevel =
    gameSettings.value.adventurerLevelDownGoldPrice ?? 1000
  const guildLevel = playerInfo.value?.guildLevel || 1
  const maxCompLevel = getMaxComprehensiveLevel(guildLevel)

  let totalGold = 0
  const totalCrystalsAcc = {
    attackCrystal: 0,
    defenseCrystal: 0,
    speedCrystal: 0,
    sanCrystal: 0
  }
  let hasError = false
  const reportItems = []
  const selectedAdvs = adventurers.value.filter(a =>
    selectedIds.value.has(a._id)
  )
  const statLevelKeys = {
    attack: 'attackLevel',
    defense: 'defenseLevel',
    speed: 'speedLevel',
    san: 'SANLevel'
  }
  const crystalKeys = {
    attack: 'attackCrystal',
    defense: 'defenseCrystal',
    speed: 'speedCrystal',
    san: 'sanCrystal'
  }
  const statNames = {
    attack: '攻击',
    defense: '防御',
    speed: '速度',
    san: 'SAN'
  }

  for (const adv of selectedAdvs) {
    const ratio = adv.statDistributeRatio || {
      attack: 25,
      defense: 25,
      speed: 25,
      san: 25
    }
    const ratioTotal = ratio.attack + ratio.defense + ratio.speed + ratio.san
    let error = ''
    if (ratioTotal !== 100) {
      error = '分配比例未设置（需合计100%）'
      hasError = true
    }

    let effectiveLevels = totalLevels
    if (direction === 'up' && !error) {
      const currentComp =
        (adv.attackLevel || 1) +
        (adv.defenseLevel || 1) +
        (adv.speedLevel || 1) +
        (adv.SANLevel || 1) -
        3
      const remaining = maxCompLevel - currentComp
      if (remaining <= 0) {
        error = '综合等级已达上限'
        hasError = true
      } else {
        effectiveLevels = Math.min(totalLevels, remaining)
      }
    }

    const alloc = {
      attack: Math.round((effectiveLevels * ratio.attack) / 100),
      defense: Math.round((effectiveLevels * ratio.defense) / 100),
      speed: Math.round((effectiveLevels * ratio.speed) / 100),
      san: 0
    }
    alloc.san = effectiveLevels - alloc.attack - alloc.defense - alloc.speed

    let itemGold = 0
    const itemCrystals = { attack: 0, defense: 0, speed: 0, san: 0 }

    if (!error) {
      if (direction === 'up') {
        for (const [statType, allocCount] of Object.entries(alloc)) {
          if (allocCount <= 0) continue
          let currentLevel = adv[statLevelKeys[statType]] || 1
          for (let i = 0; i < allocCount; i++) {
            const cc = getAdventurerLevelUpCrystalCost(
              currentLevel,
              crystalBase
            )
            const gc = getAdventurerLevelUpGoldCost(currentLevel, goldBase)
            itemCrystals[statType] += cc
            itemGold += gc
            totalCrystalsAcc[crystalKeys[statType]] += cc
            currentLevel++
          }
        }
      } else {
        for (const [statType, allocCount] of Object.entries(alloc)) {
          if (allocCount <= 0) continue
          const currentLevel = adv[statLevelKeys[statType]] || 1
          if (currentLevel - allocCount < 1) {
            error = `${statNames[statType]}等级不足以降级 ${allocCount} 级（当前 Lv.${currentLevel}）`
            hasError = true
            break
          }
        }
        itemGold = effectiveLevels * downPricePerLevel
      }
    }

    totalGold += itemGold

    const currentLevels = {
      attack: adv.attackLevel || 1,
      defense: adv.defenseLevel || 1,
      speed: adv.speedLevel || 1,
      san: adv.SANLevel || 1,
      comprehensive: adv.comprehensiveLevel || 1
    }
    const newLevels = { ...currentLevels }
    if (!error) {
      if (direction === 'up') {
        newLevels.attack += alloc.attack
        newLevels.defense += alloc.defense
        newLevels.speed += alloc.speed
        newLevels.san += alloc.san
      } else {
        newLevels.attack -= alloc.attack
        newLevels.defense -= alloc.defense
        newLevels.speed -= alloc.speed
        newLevels.san -= alloc.san
      }
      newLevels.comprehensive =
        newLevels.attack +
        newLevels.defense +
        newLevels.speed +
        newLevels.san -
        3
    }

    reportItems.push({
      adventurerId: adv._id,
      name: adv.name,
      alloc,
      currentLevels,
      newLevels,
      goldCost: itemGold,
      crystalCost: itemCrystals,
      error
    })
  }

  batchReportData.value = reportItems
  batchReportTotalGold.value = totalGold
  batchReportTotalCrystals.value = totalCrystalsAcc
  batchReportHasError.value = hasError
  batchReportVisible.value = true
}

// ── Dropdown 升降级快捷方法 ──
function handleBatchUpDefault() {
  handleOpenBatchRatioReport('up', 10)
}
function handleBatchDownDefault() {
  handleOpenBatchRatioReport('down', 10)
}
function handleBatchUpCommand(levels) {
  handleOpenBatchRatioReport('up', levels)
}
function handleBatchDownCommand(levels) {
  handleOpenBatchRatioReport('down', levels)
}

async function handleConfirmBatchRatio() {
  batchRatioLoading.value = true
  try {
    const ops = batchReportData.value
      .filter(item => !item.error)
      .map(item => ({
        adventurerId: item.adventurerId,
        direction: batchReportDirection.value,
        totalLevels: batchReportTotalPerAdv.value
      }))
    if (ops.length === 0) return

    await batchRatioDistributeApi({ operations: ops })
    ElMessage.success(
      `批量${batchReportDirection.value === 'up' ? '升级' : '降级'}完成`
    )
    batchReportVisible.value = false
    selectedIds.value = new Set()
    batchMode.value = false
    await fetchAdventurers()
    await fetchPlayerInfo()
  } catch {
    // handled by interceptor
  } finally {
    batchRatioLoading.value = false
  }
}

// ── 初始化 ──
onMounted(() => {
  fetchAdventurers()
  fetchGameSettings()
  fetchPlayerInfo()
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

.rpg-card {
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.9) 0%,
    rgba(240, 230, 200, 0.6) 100%
  );
  border: 1px solid rgba(200, 160, 80, 0.3);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
}
.dark .rpg-card {
  background: linear-gradient(
    135deg,
    rgba(40, 35, 30, 0.9) 0%,
    rgba(30, 24, 18, 0.8) 100%
  );
  border-color: rgba(200, 160, 80, 0.25);
}
.rpg-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
}
.rpg-card:active {
  transform: translateY(-1px);
}

.avatar-glow {
  pointer-events: none;
  opacity: 0;
  box-shadow: 0 0 12px 4px var(--glow-color, transparent);
  transition: opacity 0.3s ease;
}
.rpg-card:hover .avatar-glow {
  opacity: 0.5;
  animation: glowPulse 1.5s ease-in-out infinite;
}
@keyframes glowPulse {
  0%,
  100% {
    opacity: 0.3;
  }
  50% {
    opacity: 0.7;
  }
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.info-label {
  color: #888;
  font-size: 0.8rem;
}
.dark .info-label {
  color: #aaa;
}
.info-value {
  font-weight: 500;
  color: #333;
}
.dark .info-value {
  color: #e0e0e0;
}
.rpg-number {
  font-family: 'monospace';
  color: #e6a817 !important;
  font-weight: 700;
}
</style>

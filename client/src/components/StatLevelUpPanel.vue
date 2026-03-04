<template>
  <div class="stat-level-up-panel">
    <!-- 资源信息 -->
    <div class="w-full grid grid-cols-1 gap-2 text-sm mb-2">
      <div
        class="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-2 text-center"
      >
        <p class="text-xs text-gray-400">🪙 金币</p>
        <p class="text-sm font-bold text-yellow-500">
          {{ (playerInfo?.gold ?? 0).toLocaleString() }}
        </p>
      </div>
    </div>
    <div class="w-full grid grid-cols-4 gap-1 text-sm mb-3">
      <div
        v-for="cType in CRYSTAL_TYPES"
        :key="cType.key"
        class="bg-gray-50 dark:bg-gray-800 rounded p-1.5 text-center"
      >
        <p class="text-xs text-gray-400">{{ cType.icon }}</p>
        <p class="text-sm font-mono text-gray-600 dark:text-gray-300">
          {{ inventory?.[cType.key] ?? 0 }}
        </p>
      </div>
    </div>

    <!-- 精细加点 / 自动分配切换 -->
    <div class="flex items-center justify-between mb-3">
      <el-checkbox v-model="manualMode" size="small">精细加点</el-checkbox>
      <span class="text-xs text-gray-400">
        综合等级 Lv.{{ adventurer.comprehensiveLevel }} / {{ maxCompLevel }}
      </span>
    </div>

    <!-- 精细加点模式：4卡片 -->
    <template v-if="manualMode">
      <div class="grid grid-cols-2 gap-2">
        <div
          v-for="stat in STAT_LIST"
          :key="stat.key"
          class="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 flex flex-col items-center gap-2"
        >
          <p class="text-lg">{{ stat.icon }}</p>
          <p class="text-sm font-semibold text-gray-700 dark:text-gray-200">
            {{ stat.name }}
          </p>
          <p class="text-base font-bold text-yellow-500">
            Lv.{{ adventurer[stat.levelKey] }}
          </p>
          <p class="text-[10px] text-gray-400 text-center leading-tight">
            升级: {{ getStatLevelUpCrystalCost(stat.levelKey) }}💎 +
            {{ getStatLevelUpGoldCost(stat.levelKey) }}🪙
          </p>
          <!-- 降级按钮组 -->
          <div class="flex gap-0.5 w-full">
            <el-button
              type="danger"
              size="small"
              class="flex-1 px-1!"
              :disabled="anyLoading || adventurer[stat.levelKey] <= 1"
              @click="handleLevelDown(stat.key, 1)"
            >
              -1
            </el-button>
            <el-button
              type="danger"
              size="small"
              class="flex-1 px-1!"
              :disabled="anyLoading || adventurer[stat.levelKey] <= 1"
              @click="handleLevelDown(stat.key, 5)"
            >
              -5
            </el-button>
            <el-button
              type="danger"
              size="small"
              class="flex-1 px-1!"
              :disabled="anyLoading || adventurer[stat.levelKey] <= 1"
              @click="handleLevelDown(stat.key, 10)"
            >
              -10
            </el-button>
          </div>
          <!-- 升级按钮组 -->
          <div class="flex gap-0.5 w-full">
            <el-button
              type="warning"
              size="small"
              class="flex-1 px-1!"
              :disabled="
                anyLoading || adventurer.comprehensiveLevel >= maxCompLevel
              "
              @click="handleLevelUp(stat.key, 1)"
            >
              +1
            </el-button>
            <el-button
              type="warning"
              size="small"
              class="flex-1 px-1!"
              :disabled="
                anyLoading || adventurer.comprehensiveLevel >= maxCompLevel
              "
              @click="handleLevelUp(stat.key, 5)"
            >
              +5
            </el-button>
            <el-button
              type="warning"
              size="small"
              class="flex-1 px-1!"
              :disabled="
                anyLoading || adventurer.comprehensiveLevel >= maxCompLevel
              "
              @click="handleLevelUp(stat.key, 10)"
            >
              +10
            </el-button>
          </div>
        </div>
      </div>
    </template>

    <!-- 按比例分配模式 -->
    <template v-else>
      <div class="space-y-3">
        <!-- 当前属性等级展示 -->
        <div class="grid grid-cols-4 gap-1 text-center">
          <div
            v-for="stat in STAT_LIST"
            :key="stat.key"
            class="bg-gray-50 dark:bg-gray-800 rounded p-1.5"
          >
            <p class="text-xs text-gray-400">{{ stat.icon }} {{ stat.name }}</p>
            <p class="text-sm font-bold text-yellow-500">
              Lv.{{ adventurer[stat.levelKey] }}
            </p>
          </div>
        </div>

        <!-- 比例设置 -->
        <div
          v-for="stat in STAT_LIST"
          :key="stat.key"
          class="flex items-center gap-2"
        >
          <span class="text-sm w-16 shrink-0">
            {{ stat.icon }} {{ stat.name }}
          </span>
          <el-input-number
            v-model="ratioForm[stat.key]"
            :min="0"
            :max="100"
            :step="5"
            size="small"
            class="flex-1"
          />
          <span class="text-xs text-gray-400">%</span>
        </div>
        <div class="flex items-center justify-between">
          <span
            class="text-xs"
            :class="ratioSum === 100 ? 'text-green-500' : 'text-red-500'"
          >
            合计: {{ ratioSum }}%
            <span v-if="ratioSum !== 100">（需为100%）</span>
          </span>
          <el-button
            type="primary"
            size="small"
            :disabled="ratioSum !== 100 || ratioSaving"
            :loading="ratioSaving"
            @click="handleSaveRatio"
          >
            保存比例
          </el-button>
        </div>

        <el-divider class="my-2!" />

        <!-- 按比例升级 -->
        <div class="flex items-center gap-2">
          <span class="text-sm text-gray-500 shrink-0">升级:</span>
          <div class="flex gap-1">
            <el-button
              type="warning"
              size="small"
              :disabled="
                anyLoading ||
                ratioSum !== 100 ||
                adventurer.comprehensiveLevel >= maxCompLevel
              "
              @click="handleAutoDistribute(1)"
            >
              +1
            </el-button>
            <el-button
              type="warning"
              size="small"
              :disabled="
                anyLoading ||
                ratioSum !== 100 ||
                adventurer.comprehensiveLevel >= maxCompLevel
              "
              @click="handleAutoDistribute(5)"
            >
              +5
            </el-button>
            <el-button
              type="warning"
              size="small"
              :disabled="
                anyLoading ||
                ratioSum !== 100 ||
                adventurer.comprehensiveLevel >= maxCompLevel
              "
              @click="handleAutoDistribute(10)"
            >
              +10
            </el-button>
          </div>
        </div>

        <!-- 按比例降级 -->
        <div class="flex items-center gap-2">
          <span class="text-sm text-gray-500 shrink-0">降级:</span>
          <div class="flex gap-1">
            <el-button
              type="danger"
              size="small"
              :disabled="
                anyLoading ||
                ratioSum !== 100 ||
                adventurer.comprehensiveLevel <= 4
              "
              @click="handleAutoDistributeDown(1)"
            >
              -1
            </el-button>
            <el-button
              type="danger"
              size="small"
              :disabled="
                anyLoading ||
                ratioSum !== 100 ||
                adventurer.comprehensiveLevel <= 4
              "
              @click="handleAutoDistributeDown(5)"
            >
              -5
            </el-button>
            <el-button
              type="danger"
              size="small"
              :disabled="
                anyLoading ||
                ratioSum !== 100 ||
                adventurer.comprehensiveLevel <= 4
              "
              @click="handleAutoDistributeDown(10)"
            >
              -10
            </el-button>
          </div>
        </div>
      </div>
    </template>

    <p
      v-if="adventurer.comprehensiveLevel >= maxCompLevel"
      class="text-xs text-red-400 text-center mt-2"
    >
      已达公会等级上限 (Lv.{{ maxCompLevel }})，请先升级公会
    </p>
  </div>
</template>

<script setup>
import { ref, computed, watch, h, reactive } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  levelUpStatApi,
  levelDownStatApi,
  saveDistributeRatioApi,
  autoDistributeLevelUpApi
} from '@/api/game/adventurer.js'
import { getMyInventoryApi } from '@/api/game/inventory.js'
import { getGameSettingsApi } from '@/api/game/config.js'
import { useGameUser } from '@/composables/useGameUser.js'
import {
  getAdventurerLevelUpCrystalCost,
  getAdventurerLevelUpGoldCost,
  getMaxComprehensiveLevel
} from 'shared/utils/guildLevelUtils.js'

const STORAGE_KEY_MANUAL_MODE = 'guild_stat_manual_mode'
const STORAGE_KEY_SKIP_CONFIRM_DATE = 'guild_skip_upgrade_confirm_date'

const props = defineProps({
  adventurer: { type: Object, required: true }
})

const emit = defineEmits(['updated'])

const { fetchPlayerInfo, playerInfo } = useGameUser()

// ── 精细加点模式（从 localStorage 读取，默认 true） ──
const savedManualMode = localStorage.getItem(STORAGE_KEY_MANUAL_MODE)
const manualMode = ref(
  savedManualMode !== null ? savedManualMode === 'true' : true
)

watch(manualMode, val => {
  localStorage.setItem(STORAGE_KEY_MANUAL_MODE, String(val))
})

// ── 升级确认弹窗跳过标记（基于日期，今天不再提示） ──
function isTodaySkipped() {
  const saved = localStorage.getItem(STORAGE_KEY_SKIP_CONFIRM_DATE)
  if (!saved) return false
  const today = new Date().toISOString().slice(0, 10)
  return saved === today
}

const skipConfirm = ref(isTodaySkipped())

// ── 管理数据 ──
const gameSettings = ref({})
const inventory = ref(null)

const maxCompLevel = computed(() => {
  return getMaxComprehensiveLevel(playerInfo.value?.guildLevel || 1)
})

const STAT_LIST = [
  { key: 'attack', levelKey: 'attackLevel', name: '攻击', icon: '⚔️' },
  { key: 'defense', levelKey: 'defenseLevel', name: '防御', icon: '🛡️' },
  { key: 'speed', levelKey: 'speedLevel', name: '速度', icon: '💨' },
  { key: 'san', levelKey: 'SANLevel', name: 'SAN值', icon: '❤️' }
]

const CRYSTAL_TYPES = [
  { key: 'attackCrystal', icon: '⚔️' },
  { key: 'defenseCrystal', icon: '🛡️' },
  { key: 'speedCrystal', icon: '💨' },
  { key: 'sanCrystal', icon: '❤️' }
]

// ── 自动分配比例 ──
const ratioForm = ref({
  attack: 25,
  defense: 25,
  speed: 25,
  san: 25
})

const ratioSum = computed(() => {
  return (
    (ratioForm.value.attack || 0) +
    (ratioForm.value.defense || 0) +
    (ratioForm.value.speed || 0) +
    (ratioForm.value.san || 0)
  )
})

// ── 加载数据 ──
async function fetchData() {
  try {
    const [settingsRes, invRes] = await Promise.all([
      getGameSettingsApi(),
      getMyInventoryApi()
    ])
    gameSettings.value = settingsRes.data.data || {}
    inventory.value = invRes.data.data || null
  } catch {
    // ignore
  }
}

watch(
  () => props.adventurer?._id,
  newId => {
    if (newId) {
      fetchData()
      // 同步比例
      const ratio = props.adventurer.statDistributeRatio
      if (ratio) {
        ratioForm.value = { ...ratio }
      }
    }
  },
  { immediate: true }
)

// ── 费用计算 ──
function getStatLevelUpCrystalCost(levelKey) {
  if (!props.adventurer) return 0
  const base = gameSettings.value?.adventurerLevelUpCrystalBase ?? 100
  return getAdventurerLevelUpCrystalCost(props.adventurer[levelKey], base)
}

function getStatLevelUpGoldCost(levelKey) {
  if (!props.adventurer) return 0
  const base = gameSettings.value?.adventurerLevelUpGoldBase ?? 500
  return getAdventurerLevelUpGoldCost(props.adventurer[levelKey], base)
}

// ── 加载状态 ──
const levelUpLoading = ref(false)
const levelDownLoading = ref(false)
const ratioSaving = ref(false)
const autoDistributeLoading = ref(false)

const anyLoading = computed(
  () =>
    levelUpLoading.value ||
    levelDownLoading.value ||
    autoDistributeLoading.value
)

// ── 精细加点操作 ──
async function handleLevelDown(statType, times = 1) {
  if (!props.adventurer) return
  const label = STAT_LIST.find(s => s.key === statType)?.name || statType
  const price =
    (gameSettings.value?.adventurerLevelDownGoldPrice ?? 1000) * times
  try {
    await ElMessageBox.confirm(
      `确定花费不超过 ${price} 金币降低 ${label}属性 ${times} 级吗？`,
      '属性降级',
      {
        confirmButtonText: '确定降级',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
  } catch {
    return
  }
  levelDownLoading.value = true
  try {
    const res = await levelDownStatApi(props.adventurer._id, {
      statType,
      times
    })
    const { adventurer: updated, levelsDropped, goldCost } = res.data.data
    ElMessage.success(`成功降级 ${levelsDropped} 级，消耗 ${goldCost} 金币！`)
    emit('updated', updated)
    await Promise.all([fetchPlayerInfo(), refreshInventory()])
  } catch {
    // handled by interceptor
  } finally {
    levelDownLoading.value = false
  }
}

async function showUpgradeConfirm(text) {
  const checkState = reactive({ checked: false })
  await ElMessageBox({
    title: '确认操作',
    message: h('div', [
      h('p', { style: 'margin-bottom:8px' }, text),
      h(
        'label',
        {
          style:
            'display:flex;align-items:center;gap:6px;cursor:pointer;font-size:12px;color:#999'
        },
        [
          h('input', {
            type: 'checkbox',
            onChange: e => {
              checkState.checked = e.target.checked
            }
          }),
          '今天不再提示'
        ]
      )
    ]),
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'info',
    distinguishCancelAndClose: true
  })
  if (checkState.checked) {
    skipConfirm.value = true
    const today = new Date().toISOString().slice(0, 10)
    localStorage.setItem(STORAGE_KEY_SKIP_CONFIRM_DATE, today)
  }
}

async function handleLevelUp(statType, times = 1) {
  if (!props.adventurer) return

  // 升级确认弹窗
  if (!skipConfirm.value) {
    try {
      const name = STAT_LIST.find(s => s.key === statType)?.name || statType
      await showUpgradeConfirm(`确定要升级 ${name} ${times} 级吗？`)
    } catch {
      return
    }
  }

  levelUpLoading.value = true
  try {
    const res = await levelUpStatApi(props.adventurer._id, { statType, times })
    const { adventurer: updated, levelsUpgraded } = res.data.data
    ElMessage.success(
      levelsUpgraded > 1 ? `成功升级 ${levelsUpgraded} 级！` : '升级成功！'
    )
    emit('updated', updated)
    await Promise.all([fetchPlayerInfo(), refreshInventory()])
  } catch {
    // handled by interceptor
  } finally {
    levelUpLoading.value = false
  }
}

async function refreshInventory() {
  try {
    const r = await getMyInventoryApi()
    inventory.value = r.data.data
  } catch {
    // ignore
  }
}

async function handleSaveRatio() {
  if (ratioSum.value !== 100) {
    ElMessage.warning('四项比例之和必须为 100')
    return
  }
  ratioSaving.value = true
  try {
    const res = await saveDistributeRatioApi(
      props.adventurer._id,
      ratioForm.value
    )
    ElMessage.success('分配比例已保存')
    emit('updated', res.data.data)
  } catch {
    // handled by interceptor
  } finally {
    ratioSaving.value = false
  }
}

// ── 按比例自动分配升级 ──
async function handleAutoDistribute(totalLevels) {
  if (ratioSum.value !== 100) {
    ElMessage.warning('请先设置正确的分配比例（合计 100%）')
    return
  }

  if (!skipConfirm.value) {
    try {
      await showUpgradeConfirm(
        `确定按比例自动分配升级 ${totalLevels} 级吗？\n攻击${ratioForm.value.attack}% / 防御${ratioForm.value.defense}% / 速度${ratioForm.value.speed}% / SAN${ratioForm.value.san}%`
      )
    } catch {
      return
    }
  }

  autoDistributeLoading.value = true
  try {
    const res = await autoDistributeLevelUpApi(props.adventurer._id, {
      totalLevels
    })
    const { adventurer: updated, levelsUpgraded, allocation } = res.data.data
    const allocStr = `攻击+${allocation.attack} 防御+${allocation.defense} 速度+${allocation.speed} SAN+${allocation.san}`
    ElMessage.success(`成功升级 ${levelsUpgraded} 级！(${allocStr})`)
    emit('updated', updated)
    await Promise.all([fetchPlayerInfo(), refreshInventory()])
  } catch {
    // handled by interceptor
  } finally {
    autoDistributeLoading.value = false
  }
}

// ── 按比例自动分配降级 ──
async function handleAutoDistributeDown(totalLevels) {
  if (ratioSum.value !== 100) {
    ElMessage.warning('请先设置正确的分配比例（合计 100%）')
    return
  }

  // 按比例计算每种属性降多少级
  const ratio = ratioForm.value
  const allocDown = {
    attack: Math.round((totalLevels * ratio.attack) / 100),
    defense: Math.round((totalLevels * ratio.defense) / 100),
    speed: Math.round((totalLevels * ratio.speed) / 100),
    san: 0
  }
  allocDown.san =
    totalLevels - allocDown.attack - allocDown.defense - allocDown.speed

  // 检查每个属性是否可以降级
  const statMap = {
    attack: 'attackLevel',
    defense: 'defenseLevel',
    speed: 'speedLevel',
    san: 'SANLevel'
  }
  const warnings = []
  for (const [key, levels] of Object.entries(allocDown)) {
    if (levels <= 0) continue
    const currentLevel = props.adventurer[statMap[key]]
    if (currentLevel - levels < 1) {
      const name = STAT_LIST.find(s => s.key === key)?.name || key
      warnings.push(
        `${name}等级不足（当前 Lv.${currentLevel}，需降 ${levels} 级）`
      )
    }
  }
  if (warnings.length > 0) {
    ElMessage.warning(warnings.join('；'))
    return
  }

  const pricePerLevel = gameSettings.value?.adventurerLevelDownGoldPrice ?? 1000
  const totalGoldCost = totalLevels * pricePerLevel
  const allocStr = `攻击-${allocDown.attack} 防御-${allocDown.defense} 速度-${allocDown.speed} SAN-${allocDown.san}`

  try {
    await ElMessageBox.confirm(
      `按比例降级 ${totalLevels} 级\n${allocStr}\n预计消耗 ${totalGoldCost.toLocaleString()} 金币`,
      '确认降级',
      {
        confirmButtonText: '确定降级',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
  } catch {
    return
  }

  // 逐属性调用降级接口
  autoDistributeLoading.value = true
  try {
    let latestAdv = null
    for (const [statType, levels] of Object.entries(allocDown)) {
      if (levels <= 0) continue
      const res = await levelDownStatApi(
        latestAdv?._id || props.adventurer._id,
        { statType, times: levels }
      )
      latestAdv = res.data.data.adventurer
    }
    if (latestAdv) {
      ElMessage.success(`成功降级 ${totalLevels} 级！(${allocStr})`)
      emit('updated', latestAdv)
    }
    await Promise.all([fetchPlayerInfo(), refreshInventory()])
  } catch {
    // handled by interceptor; 部分属性可能已降级，需刷新
    await fetchPlayerInfo()
  } finally {
    autoDistributeLoading.value = false
  }
}
</script>

<style scoped>
.stat-level-up-panel :deep(.el-button) {
  margin-left: 0 !important;
}
</style>

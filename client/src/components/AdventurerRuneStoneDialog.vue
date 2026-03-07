<template>
  <el-dialog
    v-model="visible"
    :title="dialogTitle"
    align-center
    destroy-on-close
    class="game-dialog"
    v-bind="anyLoadingLockProps"
  >
    <div v-if="adventurer && adventurer.runeStone" class="space-y-3">
      <!-- 冒险家信息 -->
      <div class="flex items-center gap-2 mb-2">
        <GameAdventurerAvatar
          :adventurer="adventurer"
          :alt="adventurer.name"
          class="w-10 h-10 rounded-full object-cover border-2"
          :style="{ borderColor: getElementColor(adventurer.elements) }"
        />
        <div>
          <p class="text-sm font-semibold text-gray-700 dark:text-gray-200">
            {{ adventurer.name }}
          </p>
          <p class="text-xs text-gray-400">
            Lv.{{ adventurer.comprehensiveLevel }}
          </p>
        </div>
      </div>

      <!-- 符文石信息 -->
      <div class="text-center">
        <div
          class="inline-flex w-14 h-14 rounded-2xl items-center justify-center text-2xl mb-1"
          :class="rarityBgClass(adventurer.runeStone.rarity)"
        >
          💎
        </div>
        <p
          class="text-lg font-bold"
          :class="rarityTextClass(adventurer.runeStone.rarity)"
        >
          {{ rarityName(adventurer.runeStone.rarity) }}符文石
        </p>
        <p class="text-sm text-gray-400">Lv.{{ adventurer.runeStone.level }}</p>
      </div>

      <!-- 技能详情 -->
      <RuneStoneInfoCard :rune-stone="adventurer.runeStone" />

      <!-- 升级区域 -->
      <div class="flex items-center justify-between">
        <span class="text-xs text-gray-400">
          升级消耗：{{ upgradeCost }} 碎片
          <span class="ml-1 text-purple-400">
            (持有 {{ inventory?.runeFragment ?? 0 }})
          </span>
        </span>
        <el-button
          type="primary"
          size="small"
          :loading="upgradeLoading"
          :disabled="upgradeLoading || !canUpgrade"
          @click="handleUpgradeRuneStone"
        >
          升级符文石
        </el-button>
      </div>
      <p
        v-if="adventurer.runeStone.level >= adventurer.comprehensiveLevel"
        class="text-xs text-red-400 text-center"
      >
        符文石等级已达冒险家综合等级上限 (Lv.{{
          adventurer.comprehensiveLevel
        }})
      </p>

      <el-divider class="my-2!" />

      <!-- 操作按钮 -->
      <div class="flex gap-2">
        <el-button
          type="danger"
          size="small"
          class="flex-1"
          :loading="unequipLoading"
          :disabled="anyLoading"
          @click="handleUnequip"
        >
          卸下
        </el-button>
        <el-button
          type="warning"
          size="small"
          class="flex-1"
          :disabled="anyLoading"
          @click="handleOpenReplace"
        >
          替换
        </el-button>
        <el-button
          type="primary"
          size="small"
          class="flex-1"
          :disabled="anyLoading"
          @click="handleOpenSynthesis"
        >
          🔮 合成
        </el-button>
      </div>
    </div>

    <!-- 没有符文石时 -->
    <div
      v-else-if="adventurer && !adventurer.runeStone"
      class="text-center py-6 text-gray-400"
    >
      <p class="text-3xl mb-2">💎</p>
      <p class="text-sm">该冒险家未装备符文石</p>
      <el-button
        type="primary"
        size="small"
        class="mt-3"
        :disabled="equipLoading"
        @click="handleOpenEquip"
      >
        装备符文石
      </el-button>
    </div>
  </el-dialog>

  <!-- 装备/替换选择弹窗 -->
  <el-dialog
    v-model="equipDialogVisible"
    title="选择符文石"
    align-center
    destroy-on-close
    v-bind="equipLoadingLockProps"
  >
    <RuneStoneSelectPanel
      :rune-stones="availableRuneStones"
      :loading="runeStoneListLoading"
      :adventurer="adventurer"
      @select="handleEquipSelect"
    >
      <template #action="{ runeStone }">
        <el-button
          type="primary"
          size="small"
          :loading="equipLoading"
          :disabled="equipLoading"
          @click.stop="handleEquip(runeStone._id)"
        >
          {{ adventurer?.runeStone ? '替换' : '装备' }}
        </el-button>
      </template>
    </RuneStoneSelectPanel>
  </el-dialog>

  <!-- 合成组件 -->
  <RuneStoneSynthesisDialog
    v-if="adventurer"
    ref="synthesisDialogRef"
    :adventurer-id="adventurer._id"
    @updated="handleSynthesisUpdated"
  />
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import {
  equipRuneStoneApi,
  unequipRuneStoneApi
} from '@/api/game/adventurer.js'
import {
  getMyRuneStonesApi,
  upgradeRuneStoneApi
} from '@/api/game/runeStone.js'
import { getMyInventoryApi } from '@/api/game/inventory.js'
import RuneStoneInfoCard from '@/components/RuneStoneInfoCard.vue'
import RuneStoneSelectPanel from '@/components/RuneStoneSelectPanel.vue'
import RuneStoneSynthesisDialog from '@/components/RuneStoneSynthesisDialog.vue'
import GameAdventurerAvatar from '@/components/GameAdventurerAvatar.vue'
import { useDialogRoute } from '@/composables/useDialogRoute.js'
import { useDialogLock } from '@/composables/useDialogLock.js'

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

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  adventurer: { type: Object, default: null }
})

const emit = defineEmits(['update:modelValue', 'updated'])

const visible = computed({
  get: () => props.modelValue,
  set: val => emit('update:modelValue', val)
})

const dialogTitle = computed(() => {
  if (!props.adventurer) return '符文石管理'
  return `${props.adventurer.name} 的符文石`
})

// ── 工具函数 ──
function rarityName(r) {
  return { normal: '普通', rare: '稀有', legendary: '传说' }[r] || r
}
function rarityTextClass(r) {
  return (
    {
      normal: 'text-gray-600 dark:text-gray-300',
      rare: 'text-blue-500',
      legendary: 'text-yellow-500'
    }[r] || ''
  )
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

// ── loading 状态 ──
const upgradeLoading = ref(false)
const unequipLoading = ref(false)
const equipLoading = ref(false)
const runeStoneListLoading = ref(false)

const anyLoading = computed(
  () => upgradeLoading.value || unequipLoading.value || equipLoading.value
)
const { dialogLockProps: anyLoadingLockProps } = useDialogLock(
  () => anyLoading.value
)
const { dialogLockProps: equipLoadingLockProps } = useDialogLock(
  () => equipLoading.value
)

// ── 库存（获取符文碎片数量） ──
const inventory = ref(null)

async function fetchInventory() {
  try {
    const res = await getMyInventoryApi()
    inventory.value = res.data.data || null
  } catch {
    // ignore
  }
}

watch(
  () => props.modelValue,
  val => {
    if (val) fetchInventory()
  },
  { immediate: true }
)

// ── 升级 ──
const RARITY_UPGRADE_COST = { normal: 100, rare: 1000, legendary: 5000 }

const upgradeCost = computed(() => {
  if (!props.adventurer?.runeStone) return 0
  const rs = props.adventurer.runeStone
  return (RARITY_UPGRADE_COST[rs.rarity] || 100) * rs.level
})

const canUpgrade = computed(() => {
  if (!props.adventurer?.runeStone) return false
  return props.adventurer.runeStone.level < props.adventurer.comprehensiveLevel
})

async function handleUpgradeRuneStone() {
  if (!props.adventurer?.runeStone) return
  upgradeLoading.value = true
  try {
    const res = await upgradeRuneStoneApi(props.adventurer.runeStone._id)
    ElMessage.success('符文石升级成功！')
    const updatedAdv = {
      ...props.adventurer,
      runeStone: res.data.data
    }
    emit('updated', updatedAdv)
    fetchInventory()
  } catch {
    // handled by interceptor
  } finally {
    upgradeLoading.value = false
  }
}

// ── 卸下 ──
async function handleUnequip() {
  if (!props.adventurer) return
  unequipLoading.value = true
  try {
    const res = await unequipRuneStoneApi(props.adventurer._id)
    ElMessage.success('卸下成功！')
    emit('updated', res.data.data)
  } catch {
    // handled by interceptor
  } finally {
    unequipLoading.value = false
  }
}

// ── 装备/替换 ──
const { visible: equipDialogVisible } = useDialogRoute('rsEquip')
const availableRuneStones = ref([])

async function handleOpenEquip() {
  await loadAvailableRuneStones()
  equipDialogVisible.value = true
}

function handleOpenReplace() {
  handleOpenEquip()
}

async function loadAvailableRuneStones() {
  runeStoneListLoading.value = true
  try {
    const res = await getMyRuneStonesApi({ equipped: 'false', pageSize: 1000 })
    const compLevel = props.adventurer?.comprehensiveLevel || 4
    availableRuneStones.value = (res.data.data?.list || []).filter(
      rs => rs.level <= compLevel
    )
  } catch {
    availableRuneStones.value = []
  } finally {
    runeStoneListLoading.value = false
  }
}

function handleEquipSelect(rs) {
  handleEquip(rs._id)
}

async function handleEquip(runeStoneId) {
  if (!props.adventurer) return
  equipLoading.value = true
  try {
    const res = await equipRuneStoneApi(props.adventurer._id, { runeStoneId })
    ElMessage.success('装备成功！')
    equipDialogVisible.value = false
    emit('updated', res.data.data)
  } catch {
    // handled by interceptor
  } finally {
    equipLoading.value = false
  }
}

// ── 合成 ──
const synthesisDialogRef = ref(null)

function handleOpenSynthesis() {
  if (!props.adventurer?.runeStone) return
  synthesisDialogRef.value?.open(
    props.adventurer.runeStone,
    props.adventurer.comprehensiveLevel
  )
}

function handleSynthesisUpdated(updatedAdv) {
  emit('updated', updatedAdv)
}
</script>

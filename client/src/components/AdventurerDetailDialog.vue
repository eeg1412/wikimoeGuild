<template>
  <el-dialog
    v-model="visible"
    :title="adventurer?.name || '冒险家详情'"
    width="380px"
    align-center
    destroy-on-close
    class="rpg-dialog game-dialog"
  >
    <div v-if="adventurer" class="flex flex-col items-center gap-3">
      <!-- 头像 -->
      <div class="relative">
        <GameAdventurerAvatar
          :adventurer="adventurer"
          :alt="adventurer.name"
          class="w-20 h-20 rounded-full object-cover border-4"
          :style="{ borderColor: getElementColor(adventurer.elements) }"
        />
        <div
          class="absolute -top-1 -right-1 w-5 h-5 rotate-45 border-2 border-white dark:border-gray-700 shadow"
          :style="{ backgroundColor: getElementColor(adventurer.elements) }"
        />
        <!-- 标记图标 -->
        <span
          v-if="adventurer.roleTag && ROLE_TAG_MAP[adventurer.roleTag]"
          class="absolute bottom-0 right-0 bg-black/65 rounded-tl text-sm leading-none p-1"
        >
          {{ ROLE_TAG_MAP[adventurer.roleTag].emoji }}
        </span>
      </div>

      <!-- 名字 -->
      <p class="text-lg font-bold text-gray-800 dark:text-gray-100">
        {{ adventurer.name }}
      </p>

      <!-- 基本信息 -->
      <div class="w-full space-y-1.5 text-sm">
        <div class="info-row bg-gray-50 dark:bg-gray-800 rounded p-1.5">
          <span class="info-label">元素</span>
          <span
            class="info-value font-semibold"
            :style="{ color: getElementColor(adventurer.elements) }"
          >
            {{ getElementName(adventurer.elements) }}
          </span>
        </div>
        <div class="info-row bg-gray-50 dark:bg-gray-800 rounded p-1.5">
          <span class="info-label">被动增益</span>
          <span class="info-value text-sm text-right" style="max-width: 60%">
            {{ getPassiveBuffName(adventurer.passiveBuffType) }}
          </span>
        </div>
        <div class="info-row bg-gray-50 dark:bg-gray-800 rounded p-1.5">
          <span class="info-label">攻击偏好</span>
          <span class="info-value text-sm">
            {{ getAttackPreferenceName(adventurer.attackPreference) }}
          </span>
        </div>
        <div class="info-row bg-gray-50 dark:bg-gray-800 rounded p-1.5">
          <span class="info-label">综合等级</span>
          <span class="info-value rpg-number">
            {{ adventurer.comprehensiveLevel }}
          </span>
        </div>

        <!-- 角色标记 -->
        <div class="info-row bg-gray-50 dark:bg-gray-800 rounded p-1.5">
          <span class="info-label">角色标记</span>
          <div class="flex items-center gap-2">
            <span
              v-for="tag in ROLE_TAGS"
              :key="tag.value"
              class="cursor-pointer text-xl px-1 py-0.5 rounded"
              :class="[
                adventurer.roleTag === tag.value
                  ? 'bg-yellow-200 dark:bg-yellow-700'
                  : '',
                roleTagLoading ? 'opacity-50 pointer-events-none' : ''
              ]"
              :title="tag.label"
              @click="handleSetRoleTag(tag.value)"
            >
              {{ tag.emoji }}
            </span>
          </div>
        </div>

        <el-divider class="my-1.5!" />

        <!-- 最终属性计算 -->
        <AdventurerFinalStats :adventurer="adventurer" />

        <el-divider class="my-1.5!" />

        <!-- 属性升级区 -->
        <template v-if="showLevelUp">
          <div v-for="stat in STAT_LIST" :key="stat.key" class="info-row">
            <span class="info-label">
              {{ stat.icon }} {{ stat.name }} Lv.{{ adventurer[stat.levelKey] }}
            </span>
            <el-button
              type="warning"
              size="small"
              :loading="levelUpLoading"
              :disabled="levelUpLoading"
              @click="handleLevelUp(stat.key)"
            >
              升级
            </el-button>
          </div>
          <p class="text-xs text-gray-400 text-center">
            升级消耗：50水晶 + 500金币
          </p>
          <el-divider class="my-1.5!" />
        </template>

        <!-- 符文石 -->
        <div class="info-row">
          <span class="info-label">💎 符文石</span>
          <div class="flex items-center gap-1">
            <template v-if="adventurer.runeStone">
              <span
                class="text-sm cursor-pointer hover:underline"
                :class="rarityClass(adventurer.runeStone.rarity)"
                @click="handleShowRuneStoneDetail"
              >
                {{ rarityName(adventurer.runeStone.rarity) }} Lv.{{
                  adventurer.runeStone.level
                }}
              </span>
            </template>
            <template v-else>
              <span class="text-sm text-gray-400">无</span>
            </template>
          </div>
        </div>

        <!-- 符文石详情展开 -->
        <div
          v-if="runeStoneDetailExpanded && adventurer.runeStone"
          class="mt-1"
        >
          <RuneStoneInfoCard :rune-stone="adventurer.runeStone" />
        </div>

        <!-- 外部插槽 -->
        <slot name="footer" />
      </div>
    </div>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import {
  getAdventurerDetailApi,
  levelUpStatApi,
  setRoleTagApi
} from '@/api/game/adventurer.js'
import { useGameUser } from '@/composables/useGameUser.js'
import {
  passiveBuffTypeDataBase,
  attackPreferenceDataBase
} from 'shared/utils/gameDatabase.js'
import { ROLE_TAG_MAP } from 'shared/constants/index.js'
import RuneStoneInfoCard from '@/components/RuneStoneInfoCard.vue'
import AdventurerFinalStats from '@/components/AdventurerFinalStats.vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  adventurerId: { type: String, default: '' },
  showLevelUp: { type: Boolean, default: true }
})

const emit = defineEmits(['update:modelValue', 'updated'])

// 冒险家数据（必须在 visible 之前声明）
const adventurer = ref(null)
const dataLoading = ref(false)

const visible = computed({
  get: () =>
    props.modelValue && !dataLoading.value && adventurer.value !== null,
  set: val => {
    if (!val) {
      emit('update:modelValue', false)
    }
  }
})

const { fetchPlayerInfo } = useGameUser()

const BASE_STATS = { attack: 100, defense: 100, speed: 100, san: 100 }
// 符文石品质基础系数
const RUNE_QUALITY_COEFFICIENT = {
  normal: 0.0012,
  rare: 0.0022,
  legendary: 0.0033
}

const STAT_LIST = [
  { key: 'attack', levelKey: 'attackLevel', name: '攻击', icon: '⚔️' },
  { key: 'defense', levelKey: 'defenseLevel', name: '防御', icon: '🛡️' },
  { key: 'speed', levelKey: 'speedLevel', name: '速度', icon: '💨' },
  { key: 'san', levelKey: 'SANLevel', name: 'SAN值', icon: '🌀' }
]

const ROLE_TAGS = Object.entries(ROLE_TAG_MAP).map(
  ([value, { emoji, label }]) => ({
    value,
    emoji,
    label
  })
)

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

// 被动增益与攻击偏好
const passiveMap = computed(() => {
  const map = new Map()
  for (const bt of passiveBuffTypeDataBase()) {
    map.set(bt.value, bt.label)
  }
  return map
})

const preferenceMap = computed(() => {
  const map = new Map()
  for (const p of attackPreferenceDataBase()) {
    map.set(p.value, p.label)
  }
  return map
})

function getPassiveBuffName(v) {
  return v ? passiveMap.value.get(v) || v : '—'
}

function getAttackPreferenceName(v) {
  return v ? preferenceMap.value.get(v) || v : '—'
}

function rarityName(r) {
  return { normal: '普通', rare: '稀有', legendary: '传说' }[r] || r
}

function rarityClass(r) {
  return (
    {
      normal: 'text-gray-500',
      rare: 'text-blue-500',
      legendary: 'text-yellow-500'
    }[r] || ''
  )
}

watch(
  () => props.modelValue,
  async val => {
    if (val && props.adventurerId) {
      adventurer.value = null
      dataLoading.value = true
      try {
        const res = await getAdventurerDetailApi(props.adventurerId)
        adventurer.value = res.data.data
      } catch {
        // 加载失败时关闭弹窗
        emit('update:modelValue', false)
      } finally {
        dataLoading.value = false
      }
    } else if (!val) {
      adventurer.value = null
    }
  }
)

// 最终属性计算
function computeFinalStat(statKey) {
  if (!adventurer.value) return 0
  const levelKeyMap = {
    attack: 'attackLevel',
    defense: 'defenseLevel',
    speed: 'speedLevel',
    san: 'SANLevel'
  }
  const level = adventurer.value[levelKeyMap[statKey]] || 1
  let base = BASE_STATS[statKey] * level
  base += getRuneStoneBonus(statKey)
  return base
}

function getRuneStoneBonus(statKey) {
  if (!adventurer.value?.runeStone?.passiveBuffs) return 0
  const rs = adventurer.value.runeStone
  const levelKeyMap = {
    attack: 'attackLevel',
    defense: 'defenseLevel',
    speed: 'speedLevel',
    san: 'SANLevel'
  }
  const level = adventurer.value[levelKeyMap[statKey]] || 1
  const baseAttr = BASE_STATS[statKey] * level
  const qualityCoeff = RUNE_QUALITY_COEFFICIENT[rs.rarity] || 0.0012
  let bonus = 0
  for (const buff of rs.passiveBuffs) {
    if (buff.buffType === statKey) {
      bonus += Math.floor(baseAttr * buff.buffLevel * qualityCoeff)
    }
  }
  return bonus
}

// 升级
const levelUpLoading = ref(false)

async function handleLevelUp(statType) {
  if (!adventurer.value) return
  levelUpLoading.value = true
  try {
    const res = await levelUpStatApi(adventurer.value._id, { statType })
    ElMessage.success('升级成功！')
    adventurer.value = res.data.data
    emit('updated', adventurer.value)
    await fetchPlayerInfo()
  } catch {
    // handled by interceptor
  } finally {
    levelUpLoading.value = false
  }
}

// 设置角色标记
const roleTagLoading = ref(false)

async function handleSetRoleTag(tagValue) {
  if (!adventurer.value || roleTagLoading.value) return
  // 点击同一标记时取消标记
  const newTag = adventurer.value.roleTag === tagValue ? '' : tagValue
  roleTagLoading.value = true
  try {
    const res = await setRoleTagApi(adventurer.value._id, { roleTag: newTag })
    adventurer.value = res.data.data
    emit('updated', adventurer.value)
  } catch {
    // handled by interceptor
  } finally {
    roleTagLoading.value = false
  }
}

// 符文石详情
const runeStoneDetailExpanded = ref(false)

function handleShowRuneStoneDetail() {
  runeStoneDetailExpanded.value = !runeStoneDetailExpanded.value
}
</script>

<style scoped>
.info-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.info-label {
  color: #9ca3af;
  white-space: nowrap;
  font-size: 13px;
}
.info-value {
  text-align: right;
}
.rpg-number {
  font-family: monospace;
  font-weight: bold;
  color: #fbbf24;
}
</style>

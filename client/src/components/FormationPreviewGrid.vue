<template>
  <div class="formation-preview-grid">
    <div
      v-for="cell in flatGrid"
      :key="cell._key"
      class="fpg-cell"
      :class="{ 'fpg-cell--occupied': cell.adventurer }"
      :style="{
        ...(cell.adventurer
          ? { borderColor: getElementColor(cell.adventurer.elements) }
          : {})
      }"
    >
      <template v-if="cell.adventurer">
        <button
          type="button"
          class="fpg-cell-content"
          @click="openAdventurerDialog(cell.adventurer)"
        >
          <GameAdventurerAvatar
            :adventurer="cell.adventurer"
            :alt="cell.adventurer.name"
            class="fpg-avatar"
          />
          <div
            v-for="indicator in getPassiveIndicators(cell.adventurer)"
            :key="indicator.position"
            class="passive-indicator"
            :class="`passive-indicator--${indicator.position}`"
            :style="{ backgroundColor: indicator.color }"
          />
          <div class="fpg-level-badge">
            Lv.{{ cell.adventurer.comprehensiveLevel || 1 }}
          </div>
          <div v-if="cell.adventurer.botRoleLabel" class="fpg-role-badge">
            {{ cell.adventurer.botRoleLabel }}
          </div>
          <div class="fpg-namebar">
            {{ cell.adventurer.name }}
          </div>
        </button>
      </template>

      <div v-else class="fpg-empty-slot"></div>
    </div>
  </div>

  <el-dialog
    v-model="adventurerDialogVisible"
    title="冒险家详情"
    width="360px"
    append-to-body
    align-center
  >
    <div v-if="selectedAdventurer" class="fpg-dialog text-sm">
      <div class="flex items-center gap-3">
        <GameAdventurerAvatar
          :adventurer="selectedAdventurer"
          :alt="selectedAdventurer.name"
          class="w-14 h-14 rounded-full object-cover border-2"
          :style="{
            borderColor: getElementColor(selectedAdventurer.elements)
          }"
        />
        <div class="min-w-0 flex-1">
          <p
            class="text-base font-semibold text-gray-800 dark:text-gray-100 truncate"
          >
            {{ selectedAdventurer.name }}
          </p>
          <div class="flex flex-wrap items-center gap-1.5 mt-1.5">
            <span
              class="px-2 py-0.5 rounded-full text-white text-xs"
              :style="{
                backgroundColor: getElementColor(selectedAdventurer.elements)
              }"
            >
              {{ getElementName(selectedAdventurer.elements) }}
            </span>
            <span class="text-xs text-gray-500 dark:text-gray-400">
              Lv.{{ selectedAdventurer.comprehensiveLevel || 1 }}
            </span>
            <span
              v-if="selectedAdventurer.botRoleLabel"
              class="text-xs text-amber-600 dark:text-amber-400"
            >
              {{ selectedAdventurer.botRoleLabel }}
            </span>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-2 mt-4">
        <div class="fpg-stat-chip">
          ⚔️ {{ selectedAdventurer.attackLevel || 1 }}
        </div>
        <div class="fpg-stat-chip">
          🛡️ {{ selectedAdventurer.defenseLevel || 1 }}
        </div>
        <div class="fpg-stat-chip">
          💨 {{ selectedAdventurer.speedLevel || 1 }}
        </div>
        <div class="fpg-stat-chip">
          ❤️ {{ selectedAdventurer.SANLevel || 1 }}
        </div>
      </div>

      <div
        class="mt-4 rounded-lg bg-orange-50 dark:bg-orange-900/20 px-3 py-2.5 text-orange-500 font-mono"
      >
        ⚔️ 战斗力
        {{ formatNumberWithUnits(getCombatPower(selectedAdventurer)) }}
      </div>

      <div class="mt-4 space-y-2 text-xs text-gray-600 dark:text-gray-300">
        <p class="leading-5">
          <span class="text-gray-400 dark:text-gray-500 mr-1">被动</span>
          {{ getPassiveBuffName(selectedAdventurer.passiveBuffType) }}
        </p>
        <p class="leading-5">
          <span class="text-gray-400 dark:text-gray-500 mr-1">偏好</span>
          {{ getAttackPreferenceName(selectedAdventurer.attackPreference) }}
        </p>
        <p v-if="selectedAdventurer.runeStone" class="leading-5">
          <span class="text-gray-400 dark:text-gray-500 mr-1">符文石</span>
          <span
            :class="
              getRuneStoneRarityClass(selectedAdventurer.runeStone.rarity)
            "
          >
            {{ rarityName(selectedAdventurer.runeStone.rarity) }} Lv.{{
              selectedAdventurer.runeStone.level || 1
            }}
          </span>
        </p>
        <p v-else class="leading-5">
          <span class="text-gray-400 dark:text-gray-500 mr-1">符文石</span>
          未装备
        </p>
      </div>
    </div>
  </el-dialog>
</template>

<script setup>
import { computed, ref } from 'vue'
import GameAdventurerAvatar from '@/components/GameAdventurerAvatar.vue'
import {
  getPassiveIndicators,
  getElementColor,
  getElementName
} from '@/composables/useFormationGrid.js'
import {
  attackPreferenceDataBase,
  calculateCombatPower,
  passiveBuffTypeDataBase
} from 'shared/utils/gameDatabase.js'
import { formatNumberWithUnits } from 'shared/utils/utils.js'

const props = defineProps({
  grid: {
    type: Array,
    required: true
  }
})

const passiveBuffMap = new Map(
  passiveBuffTypeDataBase().map(item => [item.value, item.label])
)
const attackPreferenceMap = new Map(
  attackPreferenceDataBase().map(item => [item.value, item.label])
)
const adventurerDialogVisible = ref(false)
const selectedAdventurer = ref(null)

const flatGrid = computed(() => {
  const cells = []
  for (let rowIndex = 0; rowIndex < 5; rowIndex++) {
    for (let colIndex = 0; colIndex < 5; colIndex++) {
      const adventurer = props.grid?.[rowIndex]?.[colIndex] ?? null
      cells.push({
        _key: `${rowIndex}-${colIndex}-${adventurer?._id || 'empty'}`,
        adventurer
      })
    }
  }
  return cells
})

function getCombatPower(adventurer) {
  if (!adventurer) return 0
  return calculateCombatPower(adventurer, adventurer.runeStone || null)
}

function getPassiveBuffName(value) {
  return value ? passiveBuffMap.get(value) || value : '—'
}

function getAttackPreferenceName(value) {
  return value ? attackPreferenceMap.get(value) || value : '—'
}

function rarityName(rarity) {
  return (
    {
      normal: '普通',
      rare: '稀有',
      legendary: '传说'
    }[rarity] || rarity
  )
}

function getRuneStoneRarityClass(rarity) {
  return (
    {
      normal: 'text-gray-500',
      rare: 'text-blue-500',
      legendary: 'text-yellow-500'
    }[rarity] || 'text-gray-500'
  )
}

function openAdventurerDialog(adventurer) {
  selectedAdventurer.value = adventurer
  adventurerDialogVisible.value = true
}
</script>

<style scoped>
.formation-preview-grid {
  display: grid;
  gap: 4px;
  width: 100%;
  max-width: 100%;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  box-sizing: border-box;
}

.fpg-cell {
  position: relative;
  min-width: 0;
  overflow: hidden;
  aspect-ratio: 1 / 1;
  border-radius: 10px;
  border: 2px dashed rgba(200, 160, 80, 0.35);
  background: rgba(255, 248, 235, 0.85);
  transition: border-color 0.2s;
}

.dark .fpg-cell {
  background: rgba(32, 24, 18, 0.82);
}

.fpg-cell--occupied {
  border-style: solid;
}

.fpg-cell-content {
  width: 100%;
  height: 100%;
  position: relative;
  display: block;
  padding: 0;
  border: 0;
  appearance: none;
  background: transparent;
  text-align: left;
  cursor: pointer;
}

.fpg-avatar {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 8px;
  display: block;
}

.fpg-level-badge {
  position: absolute;
  top: 2px;
  right: 2px;
  z-index: 2;
  padding: 1px 4px;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.72);
  color: #fff;
  font-size: 10px;
  line-height: 1.2;
}

.fpg-role-badge {
  position: absolute;
  top: 2px;
  left: 2px;
  z-index: 2;
  max-width: calc(100% - 28px);
  padding: 1px 5px;
  border-radius: 999px;
  background: rgba(255, 247, 219, 0.88);
  color: #9a6700;
  font-size: 10px;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dark .fpg-role-badge {
  background: rgba(113, 63, 18, 0.92);
  color: #fde68a;
}

.fpg-namebar {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 2;
  padding: 2px 4px;
  background: rgba(0, 0, 0, 0.72);
  color: #fff;
  font-size: 10px;
  line-height: 1.2;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  padding-bottom: 6px;
}

.fpg-empty-slot {
  width: 100%;
  height: 100%;
  position: relative;
}

.fpg-empty-slot::before {
  content: '';
  position: absolute;
  inset: 50%;
  width: 12px;
  height: 12px;
  transform: translate(-50%, -50%);
  border-radius: 999px;
  background: rgba(226, 190, 123, 0.18);
  box-shadow:
    0 0 0 5px rgba(226, 190, 123, 0.08),
    0 0 0 10px rgba(226, 190, 123, 0.04);
}

.fpg-stat-chip {
  border-radius: 8px;
  padding: 6px 8px;
  background: rgba(148, 163, 184, 0.12);
  color: #334155;
  font-weight: 600;
}

.dark .fpg-stat-chip {
  background: rgba(71, 85, 105, 0.3);
  color: #e2e8f0;
}

.passive-indicator {
  position: absolute;
  z-index: 2;
  border-radius: 2px;
  pointer-events: none;
  border: 2px solid rgba(255, 255, 255, 0.8);
}

.passive-indicator--left {
  left: 0;
  top: 30%;
  bottom: 30%;
  width: 6px;
}

.passive-indicator--right {
  right: 0;
  top: 30%;
  bottom: 30%;
  width: 6px;
}

.passive-indicator--top {
  top: 0;
  left: 30%;
  right: 30%;
  height: 6px;
}

.passive-indicator--bottom {
  bottom: 0;
  left: 30%;
  right: 30%;
  height: 6px;
  z-index: 3;
}
</style>

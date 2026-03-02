<template>
  <div v-if="adventurer" class="w-full">
    <p class="text-xs text-gray-400 mb-1.5 text-center">📊 最终属性</p>
    <div class="grid grid-cols-2 gap-1.5">
      <div
        v-for="stat in STAT_LIST"
        :key="stat.key"
        class="bg-gray-50 dark:bg-gray-800 rounded p-2 text-center"
      >
        <p class="text-xs text-gray-400">{{ stat.icon }} {{ stat.name }}</p>
        <p class="text-base font-bold text-gray-700 dark:text-gray-200">
          {{ computeFinalStat(stat.key) }}
        </p>
        <p class="text-[10px] text-gray-400 leading-tight">
          Lv.{{ adventurer[stat.levelKey] }}
          <span v-if="getRuneStoneBonus(stat.key) > 0" class="text-yellow-500">
            +{{ getRuneStoneBonus(stat.key) }}💎
          </span>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  adventurer: { type: Object, default: null }
})

const BASE_STATS = { attack: 100, defense: 100, speed: 100, san: 100 }

const RUNE_QUALITY_COEFFICIENT = {
  normal: 0.0012,
  rare: 0.0022,
  legendary: 0.0033
}

const STAT_LIST = [
  { key: 'attack', levelKey: 'attackLevel', name: '攻击', icon: '⚔️' },
  { key: 'defense', levelKey: 'defenseLevel', name: '防御', icon: '🛡️' },
  { key: 'speed', levelKey: 'speedLevel', name: '速度', icon: '💨' },
  { key: 'san', levelKey: 'SANLevel', name: 'SAN值', icon: '❤️' }
]

const LEVEL_KEY_MAP = {
  attack: 'attackLevel',
  defense: 'defenseLevel',
  speed: 'speedLevel',
  san: 'SANLevel'
}

function computeFinalStat(statKey) {
  if (!props.adventurer) return 0
  const level = props.adventurer[LEVEL_KEY_MAP[statKey]] || 1
  let base = BASE_STATS[statKey] * level
  base += getRuneStoneBonus(statKey)
  return base
}

function getRuneStoneBonus(statKey) {
  if (!props.adventurer?.runeStone?.passiveBuffs) return 0
  const rs = props.adventurer.runeStone
  const level = props.adventurer[LEVEL_KEY_MAP[statKey]] || 1
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
</script>

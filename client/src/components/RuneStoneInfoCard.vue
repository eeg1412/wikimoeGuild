<template>
  <div class="rune-stone-info-card space-y-3">
    <!-- 主动技能 -->
    <div v-if="runeStone.activeSkills?.length">
      <h4 class="text-sm font-semibold text-yellow-500 mb-2">⚡ 主动技能</h4>
      <div
        v-for="(skill, idx) in runeStone.activeSkills"
        :key="idx"
        class="text-sm text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-lg px-3 py-2 mb-1"
      >
        <template v-if="getSkillInfo(skill.skillId || skill)">
          <p class="font-semibold text-gray-800 dark:text-gray-100">
            {{ getSkillInfo(skill.skillId || skill).label }}
          </p>
          <p class="mt-0.5 text-gray-500 dark:text-gray-400">
            {{ getSkillInfo(skill.skillId || skill).description }}
          </p>
          <div class="flex flex-wrap gap-x-3 gap-y-0.5 mt-1 text-xs">
            <span
              >类型:
              {{
                skillTypeName(getSkillInfo(skill.skillId || skill).type)
              }}</span
            >
            <span v-if="getSkillInfo(skill.skillId || skill).element">
              元素:
              {{ elementName(getSkillInfo(skill.skillId || skill).element) }}
            </span>
            <span
              >时机:
              {{
                triggerTimingName(
                  getSkillInfo(skill.skillId || skill).triggerTiming
                )
              }}</span
            >
            <span
              >目标:
              {{
                targetName(getSkillInfo(skill.skillId || skill).target)
              }}</span
            >
            <span class="text-yellow-500 font-semibold">
              实际效果:
              {{ computeActiveEffect(getSkillInfo(skill.skillId || skill)) }}
            </span>
          </div>
        </template>
        <template v-else>
          {{ skill.skillId || skill }}
        </template>
      </div>
    </div>

    <!-- 被动增益 -->
    <div v-if="runeStone.passiveBuffs?.length">
      <h4 class="text-sm font-semibold text-blue-400 mb-2">🔮 被动增益</h4>
      <div
        v-for="(buff, idx) in runeStone.passiveBuffs"
        :key="idx"
        class="text-sm text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-lg px-3 py-2 mb-1"
      >
        <div class="flex justify-between items-center">
          <span>{{ buffTypeName(buff.buffType) }}</span>
          <span class="font-mono text-yellow-500 font-semibold">
            +{{ computePassiveEffect(buff) }}
          </span>
        </div>
        <p class="text-xs text-gray-400 mt-0.5">
          对应属性 × (增益等级 {{ buff.buffLevel }} × 品质系数
          {{ RUNE_QUALITY_COEFFICIENT[runeStone.rarity] || 0.0012 }}) =
          {{
            (
              buff.buffLevel *
              (RUNE_QUALITY_COEFFICIENT[runeStone.rarity] || 0.0012) *
              100
            ).toFixed(2)
          }}%
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { runeStoneActiveSkillDataBase } from 'shared/utils/gameDatabase.js'

const props = defineProps({
  runeStone: {
    type: Object,
    required: true
  }
})

// 符文石品质基础系数
const RUNE_QUALITY_COEFFICIENT = {
  normal: 0.0012,
  rare: 0.0022,
  legendary: 0.0033
}

const allSkillsMap = computed(() => {
  const map = new Map()
  const skills = runeStoneActiveSkillDataBase()
  for (const s of skills) {
    map.set(s.value, s)
  }
  return map
})

function getSkillInfo(skillId) {
  return allSkillsMap.value.get(skillId) || null
}

/**
 * 主动效果实际值 = baseValue × 符文石等级
 */
function computeActiveEffect(skillInfo) {
  if (!skillInfo) return '—'
  const level = props.runeStone.level || 1
  const effect = skillInfo.baseValue * level
  const type = skillInfo.type
  if (type === 'attack') {
    return `${effect} 伤害`
  } else if (type === 'buff') {
    return `+${effect} ${buffTypeName(skillInfo.buffType)}`
  } else if (type === 'debuff') {
    return `-${effect} ${buffTypeName(skillInfo.debuffType)}`
  } else if (type === 'changeOrder') {
    // 等级小于等于符文石等级时100%，每高1级减3%，最低30%
    return `改变排序（等级≤${level}时100%，每高1级-3%，最低30%）`
  } else if (type === 'sanRecover') {
    return `恢复 ${effect} SAN值`
  }
  return String(effect)
}

/**
 * 被动增益实际值 = 对应属性 × (增益等级 × 品质系数)
 * 此处显示百分比增益
 */
function computePassiveEffect(buff) {
  const qualityCoeff =
    RUNE_QUALITY_COEFFICIENT[props.runeStone.rarity] || 0.0012
  const percent = buff.buffLevel * qualityCoeff * 100
  return `${percent.toFixed(2)}%`
}

function buffTypeName(t) {
  return (
    { attack: '攻击', defense: '防御', speed: '速度', san: 'SAN值' }[t] || t
  )
}

function skillTypeName(t) {
  return (
    {
      attack: '攻击',
      buff: '增益',
      debuff: '减益',
      changeOrder: '改变排序',
      sanRecover: 'SAN恢复'
    }[t] || t
  )
}

function elementName(el) {
  return { 1: '地', 2: '水', 3: '火', 4: '风', 5: '光明', 6: '黑暗' }[el] || ''
}

function triggerTimingName(t) {
  return { before: '攻击前', after: '攻击后' }[t] || t
}

function targetName(t) {
  return { self: '己方', enemy: '敌方' }[t] || t
}
</script>

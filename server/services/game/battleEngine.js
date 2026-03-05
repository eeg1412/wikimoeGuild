/**
 * 战斗引擎 - 5x5 回合制棋盘战斗系统
 *
 * 系统全局硬编码变量：
 * - 符文石品质基础系数: 普通=0.0012, 稀有=0.0022, 传说=0.0033
 * - 攻击基础值: 100
 * - 防御基础值: 100
 * - 速度基础值: 100
 * - SAN基础值: 100
 * - 符文石触发SP阈值: 1000
 * - 主动攻击SP: +180
 * - 每回合SP: +40
 * - 受伤SP: 40 + floor((1 - 剩余SAN比例) * 120)
 * - 被克制伤害倍率: 15000 (150%)
 * - 符文石主动技能基础值: 攻击类80, 增益/减益(攻击前)16, 增益/减益(攻击后)24, SAN恢复40
 * - 改变排序概率: 每高1级-4%, 最低25%
 *
 * 被动增益计算公式: 对应属性 × (增益等级 × 品质系数)
 * 品质系数: 普通=0.0012, 稀有=0.0022, 传说=0.0033
 */

import {
  passiveBuffTypeDataBase,
  attackPreferenceDataBase
} from 'shared/utils/gameDatabase.js'

// 符文石品质基础系数
const RUNE_QUALITY_COEFFICIENT = {
  normal: 0.0012,
  rare: 0.0022,
  legendary: 0.0033
}

const BASE_STATS = {
  attack: 100,
  defense: 100,
  speed: 100,
  san: 100
}

const SP_TRIGGER_THRESHOLD = 1000
const SP_GAIN_ON_ATTACK = 180
const SP_GAIN_PER_ROUND = 40
const SP_GAIN_ON_HIT_BASE = 40
const SP_GAIN_ON_HIT_MISSING_SAN_SCALE = 120

const COUNTER_DAMAGE_RATE = 15000 // 150%, 以10000为基数

const LEVEL_SUPPRESSION = {
  startDiff: 9,
  attackLinear: 0.006,
  attackQuadratic: 0.00032,
  defenseLinear: 0.0025,
  defenseQuadratic: 0.00014,
  minAttackMultiplier: 0.65,
  maxDefenseMultiplier: 1.35
}

const ELEMENT_NAME_MAP = {
  1: '地',
  2: '水',
  3: '火',
  4: '风',
  5: '光明',
  6: '黑暗'
}

// 元素克制关系：水→火→风→地→水，光明↔黑暗
const ELEMENT_COUNTER = {
  2: '3', // 水克火
  3: '4', // 火克风
  4: '1', // 风克地
  1: '2', // 地克水
  5: '6', // 光明克黑暗
  6: '5' // 黑暗克光明
}

/**
 * 检查元素是否克制
 * @param {string} attackerElement - 攻击者元素
 * @param {string} defenderElement - 防御者元素
 * @returns {boolean}
 */
function isElementCounter(attackerElement, defenderElement) {
  return ELEMENT_COUNTER[attackerElement] === defenderElement
}

function getLevelSuppressionMultipliers(attackerLevel, defenderLevel) {
  const levelDiff = Math.max(0, (defenderLevel || 0) - (attackerLevel || 0))
  const suppressionGap = Math.max(0, levelDiff - LEVEL_SUPPRESSION.startDiff)

  if (suppressionGap <= 0) {
    return {
      levelDiff,
      attackMultiplier: 1,
      defenseMultiplier: 1
    }
  }

  const attackPenalty =
    LEVEL_SUPPRESSION.attackLinear * suppressionGap +
    LEVEL_SUPPRESSION.attackQuadratic * suppressionGap * suppressionGap
  const attackMultiplier = Math.max(
    LEVEL_SUPPRESSION.minAttackMultiplier,
    1 / (1 + attackPenalty)
  )

  const defenseBonus =
    LEVEL_SUPPRESSION.defenseLinear * suppressionGap +
    LEVEL_SUPPRESSION.defenseQuadratic * suppressionGap * suppressionGap
  const defenseMultiplier = Math.min(
    LEVEL_SUPPRESSION.maxDefenseMultiplier,
    1 + defenseBonus
  )

  return {
    levelDiff,
    attackMultiplier,
    defenseMultiplier
  }
}

/**
 * 初始化战斗单位
 * @param {Array<Array<object|null>>} grid - 5x5棋盘
 * @param {string} side - 'attacker' 或 'defender'
 * @returns {Array<object>} 战斗单位列表
 */
function initBattleUnits(grid, side) {
  const units = []
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col < 5; col++) {
      const adventurer = grid[row]?.[col]
      if (!adventurer) continue

      // 计算实际属性
      let attack = BASE_STATS.attack * (adventurer.attackLevel || 1)
      let defense = BASE_STATS.defense * (adventurer.defenseLevel || 1)
      let speed = BASE_STATS.speed * (adventurer.speedLevel || 1)
      let maxSan = BASE_STATS.san * (adventurer.SANLevel || 1)

      // 应用符文石被动增益: 对应属性 × (增益等级 × 品质系数)
      if (adventurer.runeStone && adventurer.runeStone.passiveBuffs) {
        const qualityCoeff =
          RUNE_QUALITY_COEFFICIENT[adventurer.runeStone.rarity] || 0.0012
        for (const buff of adventurer.runeStone.passiveBuffs) {
          const multiplier = buff.buffLevel * qualityCoeff
          switch (buff.buffType) {
            case 'attack':
              attack += Math.floor(attack * multiplier)
              break
            case 'defense':
              defense += Math.floor(defense * multiplier)
              break
            case 'speed':
              speed += Math.floor(speed * multiplier)
              break
            case 'san':
              maxSan += Math.floor(maxSan * multiplier)
              break
          }
        }
      }

      const comprehensiveLevel =
        (adventurer.attackLevel || 1) +
        (adventurer.defenseLevel || 1) +
        (adventurer.speedLevel || 1) +
        (adventurer.SANLevel || 1)

      units.push({
        id: adventurer._id?.toString() || `${side}_${row}_${col}`,
        name: adventurer.name || '未知',
        side,
        row,
        col,
        element: adventurer.elements,
        attackPreference: adventurer.attackPreference,
        passiveBuffType: adventurer.passiveBuffType,
        defaultAvatarId: adventurer.defaultAvatarId,
        hasCustomAvatar: !!adventurer.hasCustomAvatar,
        customAvatarUpdatedAt: adventurer.customAvatarUpdatedAt || null,
        isDemon: !!adventurer.isDemon,
        comprehensiveLevel,
        attack,
        defense,
        speed,
        maxSan,
        currentSan: maxSan,
        maxSp: SP_TRIGGER_THRESHOLD,
        currentSp: 0,
        delay: 0, // 延迟值
        baseDelay: 0, // 基础延迟值（每次行动增加的值）
        alive: true,
        runeStone: adventurer.runeStone || null,
        // 临时增减益
        tempBuffs: {
          attack: 0,
          defense: 0,
          speed: 0
        }
      })
    }
  }
  return units
}

/**
 * 应用被动增益类型（基于棋盘位置的增益）
 * 检查冒险家在棋盘上的邻居，根据方向和元素条件应用属性百分比增益
 * @param {Array<object>} units - 同一方的战斗单位列表
 */
function applyPassiveBuffTypes(units) {
  if (units.length === 0) return

  const allBuffTypes = passiveBuffTypeDataBase()
  const buffTypeMap = new Map()
  for (const bt of allBuffTypes) {
    buffTypeMap.set(bt.value, bt)
  }

  // 建立位置索引：(row, col) -> unit
  const posMap = new Map()
  for (const unit of units) {
    posMap.set(`${unit.row},${unit.col}`, unit)
  }

  // 方向偏移量（与 gameDatabase.js 的 direction 值一致：left/right/top/bottom）
  const DIRECTION_OFFSET = {
    left: [0, -1],
    right: [0, 1],
    top: [-1, 0],
    bottom: [1, 0]
  }

  for (const unit of units) {
    if (!unit.passiveBuffType) continue
    const buffDef = buffTypeMap.get(unit.passiveBuffType)
    if (!buffDef) continue

    // 检查所有指定方向是否都满足元素条件
    let allConditionsMet = true
    for (const dir of buffDef.direction) {
      const offset = DIRECTION_OFFSET[dir]
      if (!offset) {
        allConditionsMet = false
        break
      }
      const neighborRow = unit.row + offset[0]
      const neighborCol = unit.col + offset[1]
      const neighbor = posMap.get(`${neighborRow},${neighborCol}`)
      if (!neighbor || !neighbor.alive) {
        allConditionsMet = false
        break
      }
      // 检查邻居元素是否匹配
      if (!buffDef.element.includes(neighbor.element)) {
        allConditionsMet = false
        break
      }
    }

    if (allConditionsMet) {
      // 应用百分比增益
      const pct = buffDef.buffValue / 100
      switch (buffDef.buffType) {
        case 'attack':
          unit.attack = Math.floor(unit.attack * (1 + pct))
          break
        case 'defense':
          unit.defense = Math.floor(unit.defense * (1 + pct))
          break
        case 'speed':
          unit.speed = Math.floor(unit.speed * (1 + pct))
          break
        case 'san':
          unit.maxSan = Math.floor(unit.maxSan * (1 + pct))
          unit.currentSan = unit.maxSan
          break
      }
    }
  }
}

/**
 * 计算延迟值
 * 优化算法：速度 -> 延迟值的映射，采用 `delay = 10000 / ( (speed + 100)^0.8 )`
 * 避免速度差异过大会导致低速冒险家永远无法出手，同时保证高速刺客收益
 */
function calculateDelays(allUnits) {
  for (const unit of allUnits) {
    const effectiveSpeed = Math.pow(Math.max(1, unit.speed) + 100, 0.8)
    unit.baseDelay = Math.floor(10000 / effectiveSpeed)
    unit.delay = unit.baseDelay
  }
}

/**
 * 获取最前排（仍存活的最低row的单位）
 */
function getFrontRow(units) {
  const alive = units.filter(u => u.alive)
  if (alive.length === 0) return []
  const minRow = Math.min(...alive.map(u => u.row))
  return alive.filter(u => u.row === minRow)
}

/**
 * 根据攻击偏好选择目标
 */
function selectTarget(attacker, targets, preferenceType, preferenceOrder) {
  if (targets.length === 0) return null
  if (targets.length === 1) return targets[0]

  let sorted
  switch (preferenceType) {
    case 'remainSan':
      sorted = [...targets].sort((a, b) =>
        preferenceOrder === 'asc'
          ? a.currentSan - b.currentSan
          : b.currentSan - a.currentSan
      )
      break
    case 'speed':
      sorted = [...targets].sort((a, b) =>
        preferenceOrder === 'asc' ? a.speed - b.speed : b.speed - a.speed
      )
      break
    case 'defense':
      sorted = [...targets].sort((a, b) =>
        preferenceOrder === 'asc'
          ? a.defense - b.defense
          : b.defense - a.defense
      )
      break
    case 'attack':
      sorted = [...targets].sort((a, b) =>
        preferenceOrder === 'asc' ? a.attack - b.attack : b.attack - a.attack
      )
      break
    case 'san':
      sorted = [...targets].sort((a, b) =>
        preferenceOrder === 'asc' ? a.maxSan - b.maxSan : b.maxSan - a.maxSan
      )
      break
    default:
      sorted = targets
  }

  return sorted[0]
}

function gainSp(unit, amount) {
  if (!unit || amount <= 0) return 0
  const gain = Math.floor(amount)
  unit.currentSp = (unit.currentSp || 0) + gain
  return gain
}

function gainSpFromDamage(unit) {
  if (!unit || unit.maxSan <= 0) return 0
  const remainRatio = Math.max(0, unit.currentSan / unit.maxSan)
  const gain =
    SP_GAIN_ON_HIT_BASE +
    Math.floor((1 - remainRatio) * SP_GAIN_ON_HIT_MISSING_SAN_SCALE)
  return gainSp(unit, gain)
}

/**
 * 执行普通攻击
 */
function performAttack(attacker, defender, log) {
  const suppression = getLevelSuppressionMultipliers(
    attacker.comprehensiveLevel,
    defender.comprehensiveLevel
  )
  const rawAttack = Math.max(1, attacker.attack + attacker.tempBuffs.attack)
  const finalAttack = Math.max(
    1,
    Math.floor(rawAttack * suppression.attackMultiplier)
  )
  const rawDefense = Math.max(0, defender.defense + defender.tempBuffs.defense)
  const finalDefense = Math.max(
    0,
    Math.floor(rawDefense * suppression.defenseMultiplier)
  )

  // (攻击 * 攻击) / (攻击 + 防御)
  let damage = Math.floor(
    (finalAttack * finalAttack) / (finalAttack + finalDefense)
  )

  // 元素克制
  if (isElementCounter(attacker.element, defender.element)) {
    damage = Math.floor((damage * COUNTER_DAMAGE_RATE) / 10000)
  }

  // 伤害最小为1
  damage = Math.max(damage, 1)

  defender.currentSan -= damage
  if (defender.currentSan <= 0) {
    defender.currentSan = 0
    defender.alive = false
  }

  const defenderSpGain = gainSpFromDamage(defender)

  const entry = {
    type: 'attack',
    attacker: attacker.id,
    attackerName: attacker.name,
    defender: defender.id,
    defenderName: defender.name,
    damage,
    defenderRemainSan: defender.currentSan,
    defenderSpGain,
    defenderCurrentSp: defender.currentSp,
    elementCounter: isElementCounter(attacker.element, defender.element)
  }
  log.push(entry)
  return entry
}

function getSkillEffectText(skill, effectValue) {
  const STAT_LABELS = { attack: '攻击', defense: '防御', speed: '速度' }
  switch (skill.type) {
    case 'attack': {
      const elementName = ELEMENT_NAME_MAP[skill.element]
      if (elementName) {
        return `${elementName}属性攻击 造成 ${effectValue} 伤害`
      }
      return `造成 ${effectValue} 伤害`
    }
    case 'buff':
      return `${STAT_LABELS[skill.buffType] || skill.buffType} +${effectValue}`
    case 'debuff':
      return `${STAT_LABELS[skill.debuffType] || skill.debuffType} -${effectValue}`
    case 'sanRecover':
      return `恢复 ${effectValue} SAN`
    case 'changeOrder':
      return '改变排序'
    default:
      return String(effectValue)
  }
}

/**
 * 执行符文石主动技能
 */
function performRuneStoneSkill(unit, allUnits, skillData, log) {
  const allyUnits = allUnits.filter(u => u.alive && u.side === unit.side)
  const enemyUnits = allUnits.filter(u => u.alive && u.side !== unit.side)

  const enemyFrontRow = getFrontRow(enemyUnits)

  const skillsInfo = []
  const runeSkillLogs = []

  for (const skill of skillData) {
    const effectValue = skill.baseValue * (unit.runeStone.level || 1)
    const skillEffectText = getSkillEffectText(skill, effectValue)

    switch (skill.type) {
      case 'attack': {
        // 攻击类符文石
        let targets = enemyFrontRow
        const target = selectTarget(
          unit,
          targets,
          skill.preference,
          skill.order
        )
        if (!target) break

        const suppression = getLevelSuppressionMultipliers(
          unit.runeStone?.level || 1,
          target.comprehensiveLevel
        )
        const runeAttackValue = Math.max(
          1,
          Math.floor(effectValue * suppression.attackMultiplier)
        )
        const targetDefenseValue = Math.max(
          0,
          Math.floor(
            (target.defense + target.tempBuffs.defense) *
              suppression.defenseMultiplier
          )
        )

        let damage = runeAttackValue - targetDefenseValue
        // 元素克制
        if (skill.element && isElementCounter(skill.element, target.element)) {
          damage = Math.floor((damage * COUNTER_DAMAGE_RATE) / 10000)
        }
        damage = Math.max(damage, 1)

        target.currentSan -= damage
        if (target.currentSan <= 0) {
          target.currentSan = 0
          target.alive = false
        }

        const targetSpGain = gainSpFromDamage(target)

        skillsInfo.push({
          skillLabel: skill.label,
          skillType: skill.type,
          isAllyTarget: false,
          skillEffectText,
          skillElement: skill.element,
          skillValue: effectValue,
          target: target.id,
          targetName: target.name,
          targetDefaultAvatarId: target.defaultAvatarId,
          targetHasCustomAvatar: !!target.hasCustomAvatar,
          targetCustomAvatarUpdatedAt: target.customAvatarUpdatedAt || null,
          targetIsDemon: !!target.isDemon
        })

        runeSkillLogs.push({
          type: 'runeSkill',
          skillType: 'attack',
          skillLabel: skill.label,
          caster: unit.id,
          casterName: unit.name,
          target: target.id,
          targetName: target.name,
          skillElement: skill.element,
          elementCounter: !!(
            skill.element && isElementCounter(skill.element, target.element)
          ),
          damage,
          targetRemainSan: target.currentSan,
          targetSpGain,
          targetCurrentSp: target.currentSp
        })
        break
      }

      case 'buff': {
        // 增益类符文石（我方）
        let targets = allyUnits
        const target =
          selectTarget(unit, targets, skill.preference, skill.order) ||
          allyUnits[Math.floor(Math.random() * allyUnits.length)]
        if (!target) break

        target.tempBuffs[skill.buffType] =
          (target.tempBuffs[skill.buffType] || 0) + effectValue

        skillsInfo.push({
          skillLabel: skill.label,
          skillType: skill.type,
          isAllyTarget: true,
          skillEffectText,
          target: target.id,
          targetName: target.name,
          targetDefaultAvatarId: target.defaultAvatarId,
          targetHasCustomAvatar: !!target.hasCustomAvatar,
          targetCustomAvatarUpdatedAt: target.customAvatarUpdatedAt || null,
          targetIsDemon: !!target.isDemon
        })

        runeSkillLogs.push({
          type: 'runeSkill',
          skillType: 'buff',
          skillLabel: skill.label,
          caster: unit.id,
          casterName: unit.name,
          target: target.id,
          targetName: target.name,
          buffType: skill.buffType,
          value: effectValue
        })
        break
      }

      case 'debuff': {
        // 减益类符文石（敌方）
        let targets = enemyFrontRow
        const target =
          selectTarget(unit, targets, skill.preference, skill.order) ||
          enemyUnits[Math.floor(Math.random() * enemyUnits.length)]
        if (!target) break

        target.tempBuffs[skill.debuffType] =
          (target.tempBuffs[skill.debuffType] || 0) - effectValue

        skillsInfo.push({
          skillLabel: skill.label,
          skillType: skill.type,
          isAllyTarget: false,
          skillEffectText,
          target: target.id,
          targetName: target.name,
          targetDefaultAvatarId: target.defaultAvatarId,
          targetHasCustomAvatar: !!target.hasCustomAvatar,
          targetCustomAvatarUpdatedAt: target.customAvatarUpdatedAt || null,
          targetIsDemon: !!target.isDemon
        })

        runeSkillLogs.push({
          type: 'runeSkill',
          skillType: 'debuff',
          skillLabel: skill.label,
          caster: unit.id,
          casterName: unit.name,
          target: target.id,
          targetName: target.name,
          debuffType: skill.debuffType,
          value: effectValue
        })
        break
      }

      case 'changeOrder': {
        // 改变排序类：将目标移动到棋盘上的随机位置
        let targets = enemyFrontRow
        const target =
          selectTarget(unit, targets, skill.preference, skill.order) ||
          enemyUnits
            .filter(u => u.currentSan > 0)
            .sort((a, b) => a.currentSan - b.currentSan)[0]
        if (!target) break

        // 概率计算：目标等级 ≤ 符文石等级时100%，每高1级减少4%，最低25%
        const runeLevel = unit.runeStone?.level || 1
        const levelDiff = (target.comprehensiveLevel || 4) - runeLevel
        let probability = 100
        if (levelDiff > 0) {
          probability = Math.max(100 - levelDiff * 4, 25)
        }

        const roll = Math.floor(Math.random() * 100)
        const oldRow = target.row
        const oldCol = target.col

        skillsInfo.push({
          skillLabel: skill.label,
          skillType: skill.type,
          isAllyTarget: false,
          skillEffectText,
          target: target.id,
          targetName: target.name,
          targetDefaultAvatarId: target.defaultAvatarId,
          targetHasCustomAvatar: !!target.hasCustomAvatar,
          targetCustomAvatarUpdatedAt: target.customAvatarUpdatedAt || null,
          targetIsDemon: !!target.isDemon
        })

        if (roll < probability) {
          // 随机选择一个不同的位置（5×5棋盘范围内）
          const allPositions = []
          for (let r = 0; r < 5; r++) {
            for (let c = 0; c < 5; c++) {
              if (r !== target.row || c !== target.col) {
                allPositions.push({ row: r, col: c })
              }
            }
          }
          const newPos =
            allPositions[Math.floor(Math.random() * allPositions.length)]

          // 检查新位置是否有冒险家
          const occupant = enemyUnits.find(
            u =>
              u.id !== target.id && u.row === newPos.row && u.col === newPos.col
          )
          if (occupant) {
            // 互换位置
            occupant.row = oldRow
            occupant.col = oldCol
            target.row = newPos.row
            target.col = newPos.col
            runeSkillLogs.push({
              type: 'runeSkill',
              skillType: 'changeOrder',
              skillLabel: skill.label,
              caster: unit.id,
              casterName: unit.name,
              target: target.id,
              targetName: target.name,
              swapTarget: occupant.id,
              swapTargetName: occupant.name,
              success: true,
              swapped: true,
              oldRow,
              oldCol,
              newRow: newPos.row,
              newCol: newPos.col,
              probability
            })
          } else {
            // 直接移动到空位
            target.row = newPos.row
            target.col = newPos.col
            runeSkillLogs.push({
              type: 'runeSkill',
              skillType: 'changeOrder',
              skillLabel: skill.label,
              caster: unit.id,
              casterName: unit.name,
              target: target.id,
              targetName: target.name,
              success: true,
              swapped: false,
              oldRow,
              oldCol,
              newRow: newPos.row,
              newCol: newPos.col,
              probability
            })
          }
        } else {
          runeSkillLogs.push({
            type: 'runeSkill',
            skillType: 'changeOrder',
            skillLabel: skill.label,
            caster: unit.id,
            casterName: unit.name,
            target: target.id,
            targetName: target.name,
            success: false,
            probability
          })
        }
        break
      }

      case 'sanRecover': {
        // SAN恢复（我方SAN值最少的冒险家）
        const target = allyUnits
          .filter(u => u.alive)
          .sort((a, b) => a.currentSan - b.currentSan)[0]
        if (!target) break

        const healAmount = Math.min(
          effectValue,
          target.maxSan - target.currentSan
        )
        target.currentSan += healAmount

        skillsInfo.push({
          skillLabel: skill.label,
          skillType: skill.type,
          isAllyTarget: true,
          skillEffectText,
          target: target.id,
          targetName: target.name,
          targetDefaultAvatarId: target.defaultAvatarId,
          targetHasCustomAvatar: !!target.hasCustomAvatar,
          targetCustomAvatarUpdatedAt: target.customAvatarUpdatedAt || null,
          targetIsDemon: !!target.isDemon
        })

        runeSkillLogs.push({
          type: 'runeSkill',
          skillType: 'sanRecover',
          skillLabel: skill.label,
          caster: unit.id,
          casterName: unit.name,
          target: target.id,
          targetName: target.name,
          healAmount,
          targetRemainSan: target.currentSan
        })
        break
      }
    }
  }

  if (skillsInfo.length > 0) {
    log.push({
      type: 'runeActivate',
      caster: unit.id,
      casterName: unit.name,
      runeStoneRarity: unit.runeStone.rarity,
      runeStoneLevel: unit.runeStone.level || 1,
      casterCurrentSp: unit.currentSp,
      skills: skillsInfo,
      defaultAvatarId: unit.defaultAvatarId,
      hasCustomAvatar: !!unit.hasCustomAvatar,
      customAvatarUpdatedAt: unit.customAvatarUpdatedAt || null,
      isDemon: !!unit.isDemon
    })
  }

  if (runeSkillLogs.length > 0) {
    log.push(...runeSkillLogs)
  }
}

function tryTriggerRuneStoneSkill(
  unit,
  allUnits,
  skillMap,
  triggerTiming,
  log
) {
  if (!unit.runeStone || !unit.runeStone.activeSkills) return

  const timingSkills = unit.runeStone.activeSkills
    .map(s => skillMap.get(s.skillId))
    .filter(s => s && s.triggerTiming === triggerTiming)

  if (timingSkills.length === 0) return

  while (unit.currentSp >= SP_TRIGGER_THRESHOLD) {
    unit.currentSp -= SP_TRIGGER_THRESHOLD
    performRuneStoneSkill(unit, allUnits, timingSkills, log)
  }
}

/**
 * 执行战斗
 * @param {Array<Array<object|null>>} attackerGrid - 攻击方5x5棋盘
 * @param {Array<Array<object|null>>} defenderGrid - 防御方5x5棋盘
 * @param {Array} allSkillsDB - 符文石主动技能数据库
 * @returns {object} 战斗结果
 */
export function executeBattle(attackerGrid, defenderGrid, allSkillsDB) {
  const attackerUnits = initBattleUnits(attackerGrid, 'attacker')
  const defenderUnits = initBattleUnits(defenderGrid, 'defender')

  // 保留初始站位，供战斗演出初始化回放
  const initialPositionMap = new Map()
  for (const unit of attackerUnits) {
    initialPositionMap.set(unit.id, { row: unit.row, col: unit.col })
  }
  for (const unit of defenderUnits) {
    initialPositionMap.set(unit.id, { row: unit.row, col: unit.col })
  }

  // 应用被动增益类型（基于棋盘位置）
  applyPassiveBuffTypes(attackerUnits)
  applyPassiveBuffTypes(defenderUnits)

  const allUnits = [...attackerUnits, ...defenderUnits]

  if (allUnits.length === 0) {
    return {
      winner: 'draw',
      rounds: 0,
      log: [],
      attackerUnits: [],
      defenderUnits: []
    }
  }

  // 计算延迟值
  calculateDelays(allUnits)

  // 记录初始总SAN
  const attackerTotalMaxSan = attackerUnits.reduce((s, u) => s + u.maxSan, 0)
  const defenderTotalMaxSan = defenderUnits.reduce((s, u) => s + u.maxSan, 0)

  const battleLog = []
  let round = 0
  const MAX_ROUNDS = 200

  // 创建技能查找Map
  const skillMap = new Map()
  for (const skill of allSkillsDB) {
    skillMap.set(skill.value, skill)
  }

  // 创建攻击偏好查找Map
  const allPreferences = attackPreferenceDataBase()
  const preferenceMap = new Map()
  for (const pref of allPreferences) {
    preferenceMap.set(pref.value, pref)
  }

  while (round < MAX_ROUNDS) {
    round++

    // 检查双方是否全灭
    const attackerAlive = attackerUnits.some(u => u.alive)
    const defenderAlive = defenderUnits.some(u => u.alive)

    if (!attackerAlive && !defenderAlive) break
    if (!attackerAlive || !defenderAlive) break

    // 每回合SP回复（存活单位）
    const aliveUnits = allUnits.filter(u => u.alive)
    const spChanges = aliveUnits.map(u => {
      const spGain = gainSp(u, SP_GAIN_PER_ROUND)
      return {
        id: u.id,
        spGain,
        currentSp: u.currentSp
      }
    })

    // 找延迟值最低的单位
    const minDelay = Math.min(...aliveUnits.map(u => u.delay))
    const actingUnits = aliveUnits.filter(u => u.delay === minDelay)

    // 记录所有存活单位的当前延迟值，供前端计算行动准备度进度条
    const unitDelays = aliveUnits.map(u => ({
      id: u.id,
      delay: u.delay,
      baseDelay: u.baseDelay
    }))

    battleLog.push({
      type: 'roundStart',
      round,
      actingCount: actingUnits.length,
      spGainPerRound: SP_GAIN_PER_ROUND,
      spChanges,
      unitDelays
    })

    // 所有同时行动的单位执行攻击
    for (const unit of actingUnits) {
      if (!unit.alive) continue

      const enemySide = unit.side === 'attacker' ? defenderUnits : attackerUnits
      const allySide = unit.side === 'attacker' ? attackerUnits : defenderUnits
      const aliveEnemies = enemySide.filter(u => u.alive)

      if (aliveEnemies.length === 0) continue

      // 获取敌方最前排
      const frontRow = getFrontRow(aliveEnemies)
      if (frontRow.length === 0) continue

      // SP达到阈值时结算符文石主动效果（攻击前触发）
      tryTriggerRuneStoneSkill(unit, allUnits, skillMap, 'before', battleLog)

      // 选择攻击目标（根据冒险家攻击偏好）
      let prefType = 'remainSan'
      let prefOrder = 'asc'
      if (unit.attackPreference) {
        const pref = preferenceMap.get(unit.attackPreference)
        if (pref) {
          prefType = pref.type
          prefOrder = pref.order
        }
      }
      const target = selectTarget(unit, frontRow, prefType, prefOrder)
      if (target && target.alive) {
        const attackEntry = performAttack(unit, target, battleLog)
        const attackerSpGain = gainSp(unit, SP_GAIN_ON_ATTACK)
        attackEntry.attackerSpGain = attackerSpGain
        attackEntry.attackerCurrentSp = unit.currentSp
      }

      // SP达到阈值时结算符文石主动效果（攻击后触发）
      // 仅在敌方仍有存活单位时触发，避免战斗已分出胜负后继续播放 cut-in 演出
      const enemySideAfter =
        unit.side === 'attacker' ? defenderUnits : attackerUnits
      if (enemySideAfter.some(u => u.alive)) {
        tryTriggerRuneStoneSkill(unit, allUnits, skillMap, 'after', battleLog)
      }

      // 增加延迟值（重新计算包含临时速度增减益后的有效延迟）
      const currentSpeed = Math.max(1, unit.speed + (unit.tempBuffs.speed || 0))
      const effectiveSpeed = Math.pow(currentSpeed + 100, 0.8)
      const adjustedDelay = Math.floor(10000 / effectiveSpeed)
      unit.delay += adjustedDelay
    }
  }

  // 判定胜负
  const attackerAlive = attackerUnits.some(u => u.alive)
  const defenderAlive = defenderUnits.some(u => u.alive)

  let winner
  if (!attackerAlive && !defenderAlive) {
    winner = 'draw'
  } else if (!attackerAlive) {
    winner = 'defender'
  } else if (!defenderAlive) {
    winner = 'attacker'
  } else {
    // 200回合强制结束：比较剩余HP比例
    const attackerRemainSan = attackerUnits.reduce(
      (s, u) => s + u.currentSan,
      0
    )
    const defenderRemainSan = defenderUnits.reduce(
      (s, u) => s + u.currentSan,
      0
    )

    const attackerRatio =
      attackerTotalMaxSan > 0 ? attackerRemainSan / attackerTotalMaxSan : 0
    const defenderRatio =
      defenderTotalMaxSan > 0 ? defenderRemainSan / defenderTotalMaxSan : 0

    if (attackerRatio > defenderRatio) {
      winner = 'attacker'
    } else if (defenderRatio > attackerRatio) {
      winner = 'defender'
    } else {
      winner = 'draw'
    }
  }

  const buildResultUnit = u => {
    const initialPos = initialPositionMap.get(u.id)
    return {
      id: u.id,
      name: u.name,
      row: initialPos?.row ?? u.row,
      col: initialPos?.col ?? u.col,
      element: u.element,
      defaultAvatarId: u.defaultAvatarId,
      hasCustomAvatar: u.hasCustomAvatar,
      customAvatarUpdatedAt: u.customAvatarUpdatedAt || null,
      isDemon: u.isDemon,
      currentSan: u.currentSan,
      maxSan: u.maxSan,
      currentSp: u.currentSp,
      maxSp: u.maxSp,
      alive: u.alive,
      hasRuneStone: !!u.runeStone
    }
  }

  // 以实际推入 roundStart 的数量为准，避免循环最后一次
  // 因空检测 break 时 round 已自增但未记录日志导致的 rounds 偏大 1 的问题
  const actualRounds = battleLog.filter(e => e.type === 'roundStart').length

  return {
    winner,
    rounds: actualRounds,
    log: battleLog,
    attackerUnits: attackerUnits.map(buildResultUnit),
    defenderUnits: defenderUnits.map(buildResultUnit)
  }
}

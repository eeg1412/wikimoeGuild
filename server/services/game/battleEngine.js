/**
 * 战斗引擎 - 5x5 回合制棋盘战斗系统
 *
 * 系统全局硬编码变量：
 * - 符文石攻击被动增益系数: 10
 * - 符文石防御被动增益系数: 10
 * - 符文石速度被动增益系数: 10
 * - 符文石SAN被动增益系数: 15
 * - 攻击基础值: 100
 * - 防御基础值: 100
 * - 速度基础值: 100
 * - SAN基础值: 150
 * - 被克制伤害倍率: 15000 (150%)
 */

import {
  passiveBuffTypeDataBase,
  attackPreferenceDataBase
} from 'shared/utils/gameDatabase.js'

const PASSIVE_BUFF_COEFF = {
  attack: 10,
  defense: 10,
  speed: 10,
  san: 15
}

const BASE_STATS = {
  attack: 100,
  defense: 100,
  speed: 100,
  san: 150
}

const COUNTER_DAMAGE_RATE = 15000 // 150%, 以10000为基数

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

      // 应用符文石被动增益
      if (adventurer.runeStone && adventurer.runeStone.passiveBuffs) {
        for (const buff of adventurer.runeStone.passiveBuffs) {
          const coeff = PASSIVE_BUFF_COEFF[buff.buffType] || 0
          const bonus =
            buff.buffLevel * coeff * (adventurer.runeStone.level || 1)
          switch (buff.buffType) {
            case 'attack':
              attack += bonus
              break
            case 'defense':
              defense += bonus
              break
            case 'speed':
              speed += bonus
              break
            case 'san':
              maxSan += bonus
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
        isDemon: !!adventurer.isDemon,
        comprehensiveLevel,
        attack,
        defense,
        speed,
        maxSan,
        currentSan: maxSan,
        attackCount: 0, // 攻击计数（每5次触发符文石主动技能）
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

  // 方向偏移量
  const DIRECTION_OFFSET = {
    left: [0, -1],
    right: [0, 1],
    up: [-1, 0],
    down: [1, 0]
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
 * 初始化时棋盘上所有冒险家的速度相加，减去自身速度得到a
 * 找到a最低的设为b，b减去速度基础值得到c
 * 所有a减去c得到d（初始延迟值和每次行动增加的延迟值）
 */
function calculateDelays(allUnits) {
  const totalSpeed = allUnits.reduce((sum, u) => sum + u.speed, 0)

  // 每个单位的a值 = 总速度 - 自身速度
  for (const unit of allUnits) {
    unit._rawDelay = totalSpeed - unit.speed
  }

  // 找最低a值
  const minA = Math.min(...allUnits.map(u => u._rawDelay))

  // c = minA - 速度基础值
  const c = minA - BASE_STATS.speed

  // d = a - c
  for (const unit of allUnits) {
    unit.baseDelay = unit._rawDelay - c
    unit.delay = unit.baseDelay
    delete unit._rawDelay
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

/**
 * 执行普通攻击
 */
function performAttack(attacker, defender, log) {
  let damage =
    attacker.attack +
    attacker.tempBuffs.attack -
    (defender.defense + defender.tempBuffs.defense)

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

  log.push({
    type: 'attack',
    attacker: attacker.id,
    attackerName: attacker.name,
    defender: defender.id,
    defenderName: defender.name,
    damage,
    defenderRemainSan: defender.currentSan,
    elementCounter: isElementCounter(attacker.element, defender.element)
  })
}

/**
 * 执行符文石主动技能
 */
function performRuneStoneSkill(unit, allUnits, skillData, log) {
  const allyUnits = allUnits.filter(u => u.alive && u.side === unit.side)
  const enemyUnits = allUnits.filter(u => u.alive && u.side !== unit.side)

  const enemyFrontRow = getFrontRow(enemyUnits)

  for (const skill of skillData) {
    const effectValue = skill.baseValue * (unit.runeStone.level || 1)

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

        let damage = effectValue
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

        log.push({
          type: 'runeSkill',
          skillType: 'attack',
          skillLabel: skill.label,
          caster: unit.id,
          casterName: unit.name,
          target: target.id,
          targetName: target.name,
          damage,
          targetRemainSan: target.currentSan
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

        log.push({
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

        log.push({
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
        // 改变排序类
        let targets = enemyFrontRow
        const target =
          selectTarget(unit, targets, skill.preference, skill.order) ||
          enemyUnits
            .filter(u => u.currentSan > 0)
            .sort((a, b) => a.currentSan - b.currentSan)[0]
        if (!target) break

        // 概率计算：对比符文石等级和目标综合等级
        const runeLevel = unit.runeStone?.level || 1
        let probability = skill.baseValue
        const levelDiff = (target.comprehensiveLevel || 4) - runeLevel
        if (levelDiff > 0) {
          probability = Math.max(
            probability - levelDiff,
            Math.floor(skill.baseValue * 0.3)
          )
        }

        const roll = Math.floor(Math.random() * 100)
        if (roll < probability) {
          // 弹到随机位置（排除自身，避免无效交换）
          const otherCandidates = enemyUnits.filter(
            u => u.alive && u.id !== target.id
          )
          if (otherCandidates.length > 0) {
            const otherUnit =
              otherCandidates[
                Math.floor(Math.random() * otherCandidates.length)
              ]
            const tempRow = target.row
            const tempCol = target.col
            target.row = otherUnit.row
            target.col = otherUnit.col
            otherUnit.row = tempRow
            otherUnit.col = tempCol
          }

          log.push({
            type: 'runeSkill',
            skillType: 'changeOrder',
            skillLabel: skill.label,
            caster: unit.id,
            casterName: unit.name,
            target: target.id,
            targetName: target.name,
            success: true,
            probability
          })
        } else {
          log.push({
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

        log.push({
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

    // 找延迟值最低的单位
    const aliveUnits = allUnits.filter(u => u.alive)
    const minDelay = Math.min(...aliveUnits.map(u => u.delay))
    const actingUnits = aliveUnits.filter(u => u.delay === minDelay)

    battleLog.push({
      type: 'roundStart',
      round,
      actingCount: actingUnits.length
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

      unit.attackCount++

      // 每第5次攻击时结算符文石主动效果（攻击前触发的）
      if (
        unit.attackCount % 5 === 0 &&
        unit.runeStone &&
        unit.runeStone.activeSkills
      ) {
        const beforeSkills = unit.runeStone.activeSkills
          .map(s => skillMap.get(s.skillId))
          .filter(s => s && s.triggerTiming === 'before')
        if (beforeSkills.length > 0) {
          performRuneStoneSkill(unit, allUnits, beforeSkills, battleLog)
        }
      }

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
        performAttack(unit, target, battleLog)
      }

      // 每第5次攻击时结算符文石主动效果（攻击后触发的）
      if (
        unit.attackCount % 5 === 0 &&
        unit.runeStone &&
        unit.runeStone.activeSkills
      ) {
        const afterSkills = unit.runeStone.activeSkills
          .map(s => skillMap.get(s.skillId))
          .filter(s => s && s.triggerTiming === 'after')
        if (afterSkills.length > 0) {
          performRuneStoneSkill(unit, allUnits, afterSkills, battleLog)
        }
      }

      // 增加延迟值
      unit.delay += unit.baseDelay
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

  return {
    winner,
    rounds: round,
    log: battleLog,
    attackerUnits: attackerUnits.map(u => ({
      id: u.id,
      name: u.name,
      row: u.row,
      col: u.col,
      element: u.element,
      defaultAvatarId: u.defaultAvatarId,
      hasCustomAvatar: u.hasCustomAvatar,
      isDemon: u.isDemon,
      currentSan: u.currentSan,
      maxSan: u.maxSan,
      alive: u.alive
    })),
    defenderUnits: defenderUnits.map(u => ({
      id: u.id,
      name: u.name,
      row: u.row,
      col: u.col,
      element: u.element,
      defaultAvatarId: u.defaultAvatarId,
      hasCustomAvatar: u.hasCustomAvatar,
      isDemon: u.isDemon,
      currentSan: u.currentSan,
      maxSan: u.maxSan,
      alive: u.alive
    }))
  }
}

/**
 * 通用阵容棋盘工具函数
 * 提供创建空棋盘、放置/互换冒险家、检测已放置、被动增益色块等通用逻辑
 */
import { passiveBuffTypeDataBase } from 'shared/utils/gameDatabase.js'

export const ELEMENT_MAP = {
  1: { name: '地', color: '#a0855b' },
  2: { name: '水', color: '#4fa3e0' },
  3: { name: '火', color: '#e05c4f' },
  4: { name: '风', color: '#6abf69' },
  5: { name: '光明', color: '#f5c842' },
  6: { name: '黑暗', color: '#7c5cbf' }
}

export function getElementColor(el) {
  return ELEMENT_MAP[el]?.color || '#999'
}

export function getElementName(el) {
  return ELEMENT_MAP[el]?.name || el
}

// 预构建被动增益查找表
const _buffTypeMap = new Map()
for (const bt of passiveBuffTypeDataBase()) {
  _buffTypeMap.set(bt.value, bt)
}

/**
 * 获取冒险家的被动增益方向色块数据
 * @param {Object} adv 冒险家对象（需要 passiveBuffType 字段）
 * @returns {Array<{ position: string, color: string, label: string }>}
 */
export function getPassiveIndicators(adv) {
  if (!adv?.passiveBuffType) return []
  const buffDef = _buffTypeMap.get(adv.passiveBuffType)
  if (!buffDef) return []
  return buffDef.direction.map(dir => {
    const elementId = buffDef.element[0]
    const color = ELEMENT_MAP[elementId]?.color || '#999'
    return { position: dir, color, label: buffDef.label }
  })
}

/**
 * 创建 5×5 空棋盘
 */
export function createEmptyGrid() {
  return Array.from({ length: 5 }, () => Array(5).fill(null))
}

/**
 * 检查某冒险家是否已在棋盘中
 * @param {Array} grid 5×5 二维数组
 * @param {string} advId 冒险家ID
 * @returns {boolean}
 */
export function isAdventurerPlaced(grid, advId) {
  for (const row of grid) {
    for (const cell of row) {
      if (cell && cell._id === advId) return true
    }
  }
  return false
}

/**
 * 在棋盘上放置冒险家（自动互换位置）
 * @param {Array} grid 5×5 二维数组（会被原地修改）
 * @param {number} targetRow 目标行
 * @param {number} targetCol 目标列
 * @param {Object} adv 要放置的冒险家对象
 */
export function placeAdventurerOnGrid(grid, targetRow, targetCol, adv) {
  // 记住目标格子上原来的冒险家（可能为null）
  const existingAdv = grid[targetRow][targetCol]

  // 找到该冒险家当前所在的旧位置
  let oldRow = -1
  let oldCol = -1
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 5; c++) {
      if (grid[r][c] && grid[r][c]._id === adv._id) {
        oldRow = r
        oldCol = c
        break
      }
    }
    if (oldRow >= 0) break
  }

  // 如果旧位置存在，先清空
  if (oldRow >= 0) {
    grid[oldRow][oldCol] = null
  }

  // 将选中的冒险家放到目标格子
  grid[targetRow][targetCol] = adv

  // 如果目标格子原来有冒险家，且来源冒险家有旧位置，则互换
  if (existingAdv && existingAdv._id !== adv._id && oldRow >= 0) {
    grid[oldRow][oldCol] = existingAdv
  }
}

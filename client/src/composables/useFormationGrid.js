/**
 * 通用阵容棋盘工具函数
 * 提供创建空棋盘、放置/互换冒险家、检测已放置等通用逻辑
 */

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

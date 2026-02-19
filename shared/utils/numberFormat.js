/**
 * 数字格式化（千位分隔）
 * @param {number} num
 * @param {number} decimals - 小数位数
 * @returns {string}
 */
export function numberFormat(num, decimals = 0) {
  if (num === null || num === undefined) return ''
  return Number(num).toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  })
}

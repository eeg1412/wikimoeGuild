export function formatDate(
  date,
  format = 'YYYY-MM-DD HH:mm:ss',
  timezone = undefined
) {
  const d = new Date(date)
  if (isNaN(d.getTime())) return ''

  let parts

  if (timezone) {
    const formatter = new Intl.DateTimeFormat('en-GB', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    })

    const formattedParts = formatter.formatToParts(d)
    parts = Object.fromEntries(formattedParts.map(p => [p.type, p.value]))
  } else {
    parts = {
      year: d.getFullYear(),
      month: String(d.getMonth() + 1).padStart(2, '0'),
      day: String(d.getDate()).padStart(2, '0'),
      hour: String(d.getHours()).padStart(2, '0'),
      minute: String(d.getMinutes()).padStart(2, '0'),
      second: String(d.getSeconds()).padStart(2, '0')
    }
  }

  return format
    .replace('YYYY', parts.year)
    .replace('MM', parts.month)
    .replace('DD', parts.day)
    .replace('HH', parts.hour)
    .replace('mm', parts.minute)
    .replace('ss', parts.second)
}

/**
 * 生成指定范围内的随机数
 * @param {number} min - 最小值
 * @param {number} max - 最大值
 * @param {boolean} [isInteger=true] - 是否返回整数（默认返回整数）
 * @returns {number}
 */
export function getRandomInRange(min, max, isInteger = true) {
  if (typeof min !== 'number' || typeof max !== 'number') {
    throw new Error('min 和 max 必须是数字')
  }
  if (min > max) {
    ;[min, max] = [max, min] // 自动交换
  }

  const random = Math.random() * (max - min) + min
  return isInteger ? Math.floor(random) : random
}

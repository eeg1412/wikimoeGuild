/**
 * 安全地获取嵌套对象属性
 * @param {object} obj
 * @param {string} path - 'a.b.c'
 * @param {*} defaultValue
 * @returns {*}
 */
export function getNestedValue(obj, path, defaultValue = undefined) {
  return path.split('.').reduce((acc, key) => {
    return acc && acc[key] !== undefined ? acc[key] : defaultValue
  }, obj)
}

/**
 * 将对象数组按指定 key 转为 Map
 * @param {Array} arr
 * @param {string} key
 * @returns {Object}
 */
export function arrayToMap(arr, key) {
  return arr.reduce((map, item) => {
    map[item[key]] = item
    return map
  }, {})
}

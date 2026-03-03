/**
 * 市场模块共享工具函数
 */

/** 水晶类型列表 */
export const crystalList = [
  { key: 'attackCrystal', name: '攻击', icon: '⚔️', color: '#e05c4f' },
  { key: 'defenseCrystal', name: '防御', icon: '🛡️', color: '#4fa3e0' },
  { key: 'speedCrystal', name: '速度', icon: '💨', color: '#6abf69' },
  { key: 'sanCrystal', name: 'SAN值', icon: '❤️', color: '#c070e0' }
]

/** 素材类型列表 */
export const materialTypes = [
  { key: 'attackCrystal', name: '攻击水晶', icon: '⚔️' },
  { key: 'defenseCrystal', name: '防御水晶', icon: '🛡️' },
  { key: 'speedCrystal', name: '速度水晶', icon: '💨' },
  { key: 'sanCrystal', name: 'SAN值水晶', icon: '❤️' },
  { key: 'runeFragment', name: '符文石碎片', icon: '🔮' }
]

/** 获取素材图标 */
export function getMaterialIcon(type) {
  return materialTypes.find(m => m.key === type)?.icon || '📦'
}

/** 获取素材名称 */
export function getMaterialName(type) {
  return materialTypes.find(m => m.key === type)?.name || type
}

/** 稀有度中文名 */
export function rarityName(r) {
  return { normal: '普通', rare: '稀有', legendary: '传说' }[r] || r
}

/** 稀有度文字 class */
export function rarityTextClass(r) {
  return (
    {
      normal: 'text-gray-600 dark:text-gray-300',
      rare: 'text-blue-500',
      legendary: 'text-yellow-500'
    }[r] || ''
  )
}

/** 稀有度背景 class */
export function rarityBgClass(r) {
  return (
    {
      normal: 'bg-gray-200 dark:bg-gray-700',
      rare: 'bg-blue-100 dark:bg-blue-900/30',
      legendary: 'bg-yellow-100 dark:bg-yellow-900/30'
    }[r] || ''
  )
}

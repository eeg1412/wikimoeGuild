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

const nameSurnameList = [
  '潘德拉贡',
  '贝尔蒙特',
  '斯图亚特',
  '瓦伦丁',
  '克罗夫特',
  '索利安',
  '格兰德',
  '海因茨',
  '温斯顿',
  '弗瑞斯特',
  '阿特拉斯',
  '拉格纳',
  '哈布斯堡',
  '萨沃伊',
  '凡赛堤',
  '奥古斯都',
  '卡斯兰娜',
  '波拿巴',
  '美第奇',
  '都铎',
  '兰开斯特',
  '格里芬',
  '罗兰德',
  '博尔吉亚',
  '赫克托',
  '赛福思',
  '塔隆',
  '维尔利斯',
  '诺曼',
  '坎贝尔',
  '莫里亚蒂',
  '华伦斯坦',
  '霍恩海姆',
  '费迪南德',
  '萨克森',
  '巴登',
  '奥尔良',
  '波旁',
  '蒙巴顿',
  '罗切斯特',
  '阿奎纳',
  '维特根',
  '斯宾诺莎',
  '海德格尔',
  '克林索尔',
  '帕西瓦尔',
  '特里斯坦',
  '高文',
  '加拉哈德',
  '贝狄威尔',
  '埃尔隆德',
  '图尔冈',
  '费艾诺',
  '芬国昐',
  '欧洛费尔',
  '瑟兰督伊',
  '凯兰崔尔',
  '辛葛',
  '贝伦',
  '图林',
  '斯卡雷特',
  '克劳福德',
  '莱因哈特',
  '艾德里奇',
  '斯坦福德',
  '沃尔顿',
  '克利福德',
  '哈灵顿',
  '肯特',
  '汉密尔顿',
  '蒙哥马利',
  '谢尔曼',
  '巴顿',
  '艾森豪威尔',
  '布莱德利',
  '马歇尔',
  '道格拉斯',
  '麦克阿瑟',
  '尼米兹',
  '哈尔西',
  '雷恩',
  '米勒',
  '库珀',
  '贝克',
  '戴维斯',
  '怀特',
  '布朗',
  '威尔逊',
  '摩根',
  '琼斯',
  '罗德里格斯',
  '阿尔瓦雷斯',
  '加西亚',
  '马丁内斯',
  '赫尔南德斯',
  '洛佩兹',
  '冈萨雷斯',
  '佩雷斯',
  '桑切斯',
  '拉米雷斯'
]
const nameGivenNameList = [
  '凯恩',
  '亚瑟',
  '塞拉斯',
  '利安德',
  '雷诺',
  '奥丁',
  '提尔',
  '巴德尔',
  '洛基',
  '托尔',
  '莉莉丝',
  '薇薇安',
  '希尔微',
  '赛琳娜',
  '莉雅',
  '艾琳',
  '伊莎贝尔',
  '希维尔',
  '露娜',
  '米娅',
  '克里斯',
  '罗杰',
  '伊安',
  '诺亚',
  '尤里',
  '索菲亚',
  '卢卡斯',
  '奥利薇',
  '伊恩',
  '艾伦',
  '蕾拉',
  '汉斯',
  '特蕾莎',
  '杰拉德',
  '贝琳达',
  '卡尔',
  '罗兰',
  '谢恩',
  '安娜',
  '安德烈',
  '加百列',
  '拉斐尔',
  '乌列',
  '米迦勒',
  '迪亚',
  '费恩',
  '哈利',
  '伊芙',
  '格蕾丝',
  '希尔',
  '安度因',
  '萨尔',
  '阿尔萨斯',
  '吉安娜',
  '伊利丹',
  '玛维',
  '泰兰德',
  '瓦里安',
  '麦格尼',
  '布莱恩',
  '莫德雷德',
  '兰斯洛特',
  '莫林',
  '甘道夫',
  '萨鲁曼',
  '莱戈拉斯',
  '金雳',
  '阿拉贡',
  '波罗莫',
  '佛罗多',
  '山姆',
  '皮平',
  '梅里',
  '杰洛特',
  '叶奈法',
  '特莉丝',
  '希里',
  '维瑟米尔',
  '丹德里恩',
  '佐尔坦',
  '兰伯特',
  '艾斯卡尔',
  '考尔德',
  '马库斯',
  '塞德里克',
  '埃里克',
  '维克托',
  '路德维希',
  '奥托',
  '弗里德里希',
  '赫敏',
  '多米尼克',
  '阿德里安',
  '朱利安',
  '塞巴斯蒂安',
  '费利克斯',
  '克劳德',
  '里昂',
  '但丁',
  '维吉尔'
]

// 生成随机的冒险者名字
export function generateRandomAdventurerName() {
  const surname =
    nameSurnameList[Math.floor(Math.random() * nameSurnameList.length)]
  const givenName =
    nameGivenNameList[Math.floor(Math.random() * nameGivenNameList.length)]
  return surname + '·' + givenName
}

// 随机选取冒险者头像ID 1-10
export function generateRandomAdventurerAvatarId() {
  return Math.floor(Math.random() * 10) + 1
}

// NPC预设公会图标数量（server/publicgame/guildicon/ 下的 1.webp ~ N.webp）
const NPC_GUILD_ICON_COUNT = 10

/**
 * 随机获取NPC公会图标ID（1 ~ NPC_GUILD_ICON_COUNT）
 * @returns {number}
 */
export function getRandomNpcGuildIconId() {
  return Math.floor(Math.random() * NPC_GUILD_ICON_COUNT) + 1
}

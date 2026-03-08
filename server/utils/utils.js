import bcrypt from 'bcryptjs'
import fs from 'fs'
import path from 'path'
import { IP2Location } from 'ip2location-nodejs'
import { UAParser } from 'ua-parser-js'
import { Bots } from 'ua-parser-js/extensions'
import AsyncLock from 'async-lock'
import { Worker } from 'worker_threads'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const lock = new AsyncLock({ timeout: 60000 })

export function createBcryptStr(str) {
  const salt = bcrypt.genSaltSync(10)
  const hash = bcrypt.hashSync(str, salt)
  return hash
}

export function getUserIp(req) {
  let ip =
    (req.headers['x-forwarded-for'] || '').split(',')[0] ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    req.connection.socket.remoteAddress ||
    ''
  ip = ip.toLowerCase()
  if (ip.slice(0, 7) === '::ffff:') {
    ip = ip.slice(7)
  }
  // ip = this.generateRandomIPv4()
  return ip
}

export function initIp2location() {
  const binFilePath = path.join('./utils/ip2location/', 'IP2LOCATION.BIN')
  if (!fs.existsSync(binFilePath)) {
    console.warn(
      'ip2location文件不存在,如果需要IP解析请先从：https://lite.ip2location.com 下载BIN文件，然后放到utils/ip2location目录下'
    )
    return
  }
  ip2location = new IP2Location()
  ip2location.open(binFilePath)
  console.info('ip2location初始化成功')
}
let ip2location = null

export async function IP2LocationUtils(ip, id, model, updateMongodb = true) {
  if (ip2location) {
    const promise = new Promise(async (resolve, reject) => {
      console.time('ip2location')
      try {
        // 判断ip是否是ipv6
        const isIPV6 = ip.includes(':')
        // 判断ip是否是ipv4
        const ipV4Reg = /^(\d+)\.(\d+)\.(\d+)\.(\d+)$/
        const isIPV4 = ipV4Reg.test(ip)
        // 如果不是ipv4，直接返回null
        if (!isIPV4 && !isIPV6) {
          console.log('ip不是ipv4或ipv6,跳过ip解析')
          resolve(null)
          return
        }
        const ipInfoAll = ip2location.getAll(String(ip).trim())
        // 遍历ipInfoAll，如果包含字符串This method is 就删除该属性
        Object.keys(ipInfoAll).forEach(key => {
          const val = ipInfoAll[key]
          if (typeof val === 'string' && val.includes('This method is not')) {
            delete ipInfoAll[key]
          }
        })

        console.timeEnd('ip2location')
        if (updateMongodb) {
          await model
            .updateOne(
              { _id: id },
              {
                ipInfo: ipInfoAll
              }
            )
            .exec()
        }
        resolve(ipInfoAll)
      } catch (err) {
        console.error('ip2location解析失败', err)
        reject(err)
      }
    })
    return promise
  }
  return new Promise(resolve => {
    resolve(null)
  })
}

export function deviceUAInfoUtils(req) {
  const ua = req.get('user-agent') || ''
  if (ua.length > 1000) {
    return null
  }
  const uaParser = new UAParser(ua, Bots)
  return uaParser.getResult()
}

export async function deviceUtils(req, id, model, updateMongodb = true) {
  const ua = deviceUAInfoUtils(req)
  const type = ua?.browser?.type || null
  let isBot = false
  const botTypes = ['cli', 'crawler', 'fetcher', 'library']
  if (type && botTypes.includes(type)) {
    isBot = true
  }
  if (updateMongodb) {
    await model
      .updateOne(
        { _id: id },
        {
          deviceInfo: ua,
          isBot: isBot
        }
      )
      .exec()
  }
  return ua
}

export function limitStr(str, len) {
  const strArray = Array.from(str)
  if (strArray.length > len) {
    return strArray.slice(0, len).join('')
  }
  return str
}

// async-lock
export function executeInLock(key, fn) {
  return lock.acquire(key, () => {
    return fn()
  })
}

// ──────────────────────────────────────────────
// 冒险家工具函数
// ──────────────────────────────────────────────

/**
 * 随机生成冒险家头像 ID（1-44）
 */
export function generateRandomAdventurerAvatarId() {
  return String(Math.floor(Math.random() * 44) + 1)
}

// 冒险家名字词库
const ADVENTURER_NAME_PREFIXES = [
  '星',
  '月',
  '风',
  '雷',
  '影',
  '光',
  '暗',
  '冰',
  '炎',
  '云',
  '霜',
  '岚',
  '幽',
  '苍',
  '碧',
  '赤',
  '玄',
  '银',
  '金',
  '铁'
]
const ADVENTURER_NAME_MIDDLES = [
  '之',
  '烈',
  '若',
  '如',
  '似',
  '般',
  '起',
  '耀',
  '落',
  '升'
]
const ADVENTURER_NAME_SUFFIXES = [
  '战士',
  '骑士',
  '猎手',
  '法师',
  '游侠',
  '刺客',
  '勇者',
  '传说',
  '之魂',
  '守护',
  '行者',
  '先锋',
  '突击',
  '神射',
  '圣者',
  '荣耀'
]

/**
 * 随机生成冒险家名字
 */
export function generateRandomAdventurerName() {
  const prefix =
    ADVENTURER_NAME_PREFIXES[
      Math.floor(Math.random() * ADVENTURER_NAME_PREFIXES.length)
    ]
  const suffix =
    ADVENTURER_NAME_SUFFIXES[
      Math.floor(Math.random() * ADVENTURER_NAME_SUFFIXES.length)
    ]
  // 30% 概率插入中间词
  if (Math.random() < 0.3) {
    const middle =
      ADVENTURER_NAME_MIDDLES[
        Math.floor(Math.random() * ADVENTURER_NAME_MIDDLES.length)
      ]
    return prefix + middle + suffix
  }
  return prefix + suffix
}

export function generateIconAsync(objectId) {
  return new Promise((resolve, reject) => {
    const worker = new Worker(join(__dirname, 'worker', 'icon-worker.js'), {
      workerData: objectId
    })

    worker.on('message', msg => {
      if (msg?.error) reject(new Error(msg.error))
      else resolve(msg)
    })

    worker.on('error', reject)

    worker.on('exit', code => {
      if (code !== 0) reject(new Error(`Worker exited with code ${code}`))
    })
  })
}

// 公会词库前缀
const GUILD_NAME_PREFIXES = [
  '苍穹',
  '星河',
  '逐月',
  '凌风',
  '破晓',
  '赤焰',
  '寒霜',
  '青云',
  '雷霆',
  '烈阳',
  '幽影',
  '幻夜',
  '龙渊',
  '虎啸',
  '凤鸣',
  '天启',
  '无双',
  '战魂',
  '英灵',
  '神域',
  '狂澜',
  '逐光',
  '耀世',
  '御风',
  '踏雪',
  '飞羽',
  '孤城',
  '荒原',
  '沧海',
  '长空',
  '九天',
  '御龙',
  '霸业',
  '天命',
  '逐星',
  '圣堂',
  '暗夜',
  '荣耀',
  '风暴',
  '远征',
  '极光',
  '流火',
  '惊鸿',
  '问天',
  '弑神',
  '傲世',
  '凌霄',
  '绝影',
  '千军',
  '雷火',
  '焚天',
  '镇魂',
  '逐梦',
  '玄冥',
  '星陨',
  '苍炎',
  '影刃',
  '断空',
  '长夜',
  '裂空',
  '天穹',
  '苍狼',
  '狂风',
  '飞星',
  '怒海',
  '逐浪',
  '星辰',
  '烈刃',
  '疾风',
  '寒刃',
  '破军',
  '天域',
  '神锋',
  '血誓',
  '天择',
  '孤影',
  '战意',
  '龙魂',
  '苍穹之',
  '夜幕',
  '黎明',
  '风云',
  '雷影',
  '霜刃',
  '赤羽',
  '玄天',
  '天策',
  '星火',
  '苍月',
  '炎龙',
  '铁血',
  '圣域',
  '黑曜',
  '白夜',
  '龙吟',
  '虎卫',
  '凤舞',
  '逐电',
  '凌云',
  '天罡'
]

// 公会词库后缀
const GUILD_NAME_SUFFIXES = [
  '之刃',
  '之翼',
  '之心',
  '之魂',
  '之光',
  '之巅',
  '之境',
  '之域',
  '之誓',
  '之锋',
  '战团',
  '联盟',
  '军团',
  '公会',
  '殿堂',
  '圣殿',
  '王朝',
  '帝国',
  '神殿',
  '骑士团',
  '守望',
  '远征军',
  '先锋营',
  '荣耀团',
  '风云会',
  '霸业团',
  '天命会',
  '逐梦团',
  '苍穹会',
  '星辰会',
  '铁血盟',
  '无双营',
  '破晓团',
  '雷霆团',
  '烈阳盟',
  '寒霜团',
  '幽影盟',
  '幻夜团',
  '龙渊盟',
  '虎啸团',
  '凤鸣会',
  '天启团',
  '神域盟',
  '狂澜会',
  '逐光盟',
  '御风团',
  '踏雪盟',
  '飞羽团',
  '孤城会',
  '荒原盟',
  '沧海会',
  '长空团',
  '九天盟',
  '御龙会',
  '荣耀盟',
  '风暴团',
  '远征盟',
  '极光团',
  '流火盟',
  '惊鸿会',
  '问天盟',
  '弑神团',
  '傲世盟',
  '凌霄团',
  '绝影盟',
  '千军会',
  '雷火盟',
  '焚天团',
  '镇魂盟',
  '玄冥团',
  '星陨盟',
  '苍炎团',
  '影刃盟',
  '断空团',
  '裂空盟',
  '天穹团',
  '苍狼盟',
  '怒海团',
  '逐浪盟',
  '烈刃盟',
  '疾风盟',
  '寒刃团',
  '破军盟',
  '天域团',
  '神锋盟',
  '血誓盟',
  '战意盟',
  '龙魂盟',
  '夜幕盟',
  '黎明盟',
  '风云盟',
  '雷影盟',
  '霜刃盟',
  '赤羽盟',
  '玄天盟',
  '天策盟',
  '星火盟',
  '苍月盟',
  '炎龙盟',
  '黑曜盟'
]

// 随机生成公会名字
export function generateRandomGuildName() {
  const prefix =
    GUILD_NAME_PREFIXES[Math.floor(Math.random() * GUILD_NAME_PREFIXES.length)]
  const suffix =
    GUILD_NAME_SUFFIXES[Math.floor(Math.random() * GUILD_NAME_SUFFIXES.length)]
  // 随机0-9 A-Z 组合成一个随机字符串，长度为4
  const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase()
  return prefix + suffix + randomStr
}

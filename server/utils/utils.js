import bcrypt from 'bcryptjs'
import fs from 'fs'
import path from 'path'
import { IP2Location } from 'ip2location-nodejs'
import { UAParser } from 'ua-parser-js'
import { Bots } from 'ua-parser-js/extensions'

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

export function IP2LocationUtils(ip, id, model, updateMongodb = true) {
  if (ip2location) {
    const promise = new Promise((resolve, reject) => {
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
          model
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

export function deviceUtils(req, id, model) {
  const ua = deviceUAInfoUtils(req)
  const type = ua?.browser?.type || null
  let isBot = false
  const botTypes = ['cli', 'crawler', 'fetcher', 'library']
  if (type && botTypes.includes(type)) {
    isBot = true
  }
  const result = model
    .updateOne(
      { _id: id },
      {
        deviceInfo: ua,
        isBot: isBot
      }
    )
    .exec()
  return result
}

export function limitStr(str, len) {
  const strArray = Array.from(str)
  if (strArray.length > len) {
    return strArray.slice(0, len).join('')
  }
  return str
}

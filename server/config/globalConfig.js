import GlobalConfig from '../models/globalConfigs.js'
const initGlobalConfig = async () => {
  // 默认配置
  const siteSettingsConfig = {
    // 站点标题
    siteTitle: '',
    // 站点副标题
    siteSubTitle: '',
    // 站点地址
    siteUrl: ''
  }

  // 写一个函数，先判断原始类型，再将字符串转换为对应的类型
  const formatResToForm = (form, obj) => {
    Object.keys(form).forEach(key => {
      if (obj[key]) {
        // 判断form[key]的类型，有数字，字符串，布尔，数组，object,但是value只有字符串，所以需要转换
        if (typeof form[key] === 'number') {
          form[key] = Number(obj[key])
        } else if (typeof form[key] === 'boolean') {
          form[key] = obj[key] === 'true'
        } else if (Array.isArray(form[key])) {
          form[key] = obj[key].split(',')
        } else if (form[key] instanceof Set) {
          form[key] = new Set(obj[key].split(','))
        } else if (typeof form[key] === 'object') {
          form[key] = JSON.parse(obj[key])
        } else {
          form[key] = obj[key]
        }
      }
    })
  }

  // 从数据库获取配置
  await GlobalConfig.find({})
    .then(data => {
      // 返回格式list,total
      const config = {
        siteSettings: siteSettingsConfig
      }
      // 将data转换为object
      const obj = {}
      data.forEach(item => {
        obj[item.name] = item.value
      })
      formatResToForm(config.siteSettings, obj)
      // 将配置挂载到global上
      global.$globalConfig = config
      const showConfig = JSON.parse(
        JSON.stringify(config, (k, v) => {
          if (v instanceof Set) {
            return {
              type: 'Set',
              value: Array.from(v).join(',')
            }
          }
          return v
        })
      )
      // 颜色设置（ANSI）
      const ANSI = {
        reset: '\x1b[0m',
        key: '\x1b[36m', // cyan for keys
        value: '\x1b[32m', // green for values
        header: '\x1b[33m' // yellow for section headers
      }

      const formatValueColored = v => {
        if (v && typeof v === 'object') {
          if (v.type === 'Set') return ANSI.value + v.value + ANSI.reset
          if (Array.isArray(v)) return ANSI.value + v.join(', ') + ANSI.reset
          return ANSI.value + JSON.stringify(v) + ANSI.reset
        }
        return ANSI.value + String(v) + ANSI.reset
      }

      const prettyConfig = Object.keys(showConfig)
        .map(section => {
          const sec = showConfig[section]
          const header = `${ANSI.header}==== ${section} ==== ${ANSI.reset}`
          if (sec && typeof sec === 'object') {
            const body = Object.keys(sec)
              .map(
                k =>
                  `- ${ANSI.key}${k}${ANSI.reset}: ${formatValueColored(
                    sec[k]
                  )}`
              )
              .join('\n')
            return `${header}\n${body}`
          }
          return `${header}\n  ${formatValueColored(sec)}`
        })
        .join('\n\n')

      console.info('\n全局配置更新完成:\n' + prettyConfig + '\n')
    })
    .catch(err => {
      console.error('globalConfig更新失败', err)
    })
}
export { initGlobalConfig }

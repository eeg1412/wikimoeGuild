import GlobalConfig from '../models/globalConfigs.js'
import SensitiveFilter from '../utils/sensitiveFilter.js'

// 初始化
const filter = new SensitiveFilter([], {
  ignoreCase: true,
  skipSymbols: true
})

global.$sensitiveFilter = filter

// console.log(filter.contains(text));
// true

// console.log(filter.find(text));
// [{ word: 'sex', index: 8 }, { word: '暴力', index: 20 }]

const initGlobalConfig = async () => {
  // 默认配置
  const siteSettingsConfig = {
    // 站点标题
    siteTitle: '',
    // 站点副标题
    siteSubTitle: '',
    // 站点关键词
    siteKeywords: '',
    // 站点地址
    siteUrl: ''
  }

  const emailSettingsConfig = {
    // smtp服务器
    emailSmtpHost: '',
    // smtp端口
    emailSmtpPort: '',
    // 安全协议
    emailSmtpSecure: true,
    // 发信邮箱
    emailSender: '',
    // 发信密码
    emailPassword: '',
    // 收信邮箱
    emailReceiver: ''
  }

  // 安全设置
  const securitySettingsConfig = {
    // IP黑名单
    siteIPBlockList: new Set(),
    // 敏感词列表
    siteBannedKeywordList: []
  }

  // 广告
  const adSettingsConfig = {
    // 是否开启谷歌广告
    googleAdEnabled: false,
    // 谷歌广告ID
    googleAdId: '',
    // ads.txt
    googleAdAdsTxt: ''
  }

  // 游戏设置
  const gameSettingsConfig = {
    // 冒险家招募价格
    adventurerRecruitPrice: 10000,
    // 冒险家自定义头像价格
    adventurerCustomAvatarPrice: 5000,
    // 冒险家自定义名字价格
    adventurerCustomNamePrice: 1000,
    // 符文石掉率概率，最大值10000
    runeStoneDropRate: 100,
    // 普通符文石概率，最大值10000
    normalRuneStoneRate: 8000,
    // 稀有符文石概率，最大值10000
    rareRuneStoneRate: 1500,
    // 传说符文石概率，最大值10000
    legendaryRuneStoneRate: 500,
    // 官方市场水晶收购价格
    officialCrystalBuyPrice: 100,
    // 官方市场水晶售卖价格
    officialCrystalSellPrice: 10000,
    // 官方市场普通符文石收购价格
    officialNormalRuneStoneBuyPrice: 100,
    // 官方市场稀有符文石收购价格
    officialRareRuneStoneBuyPrice: 400,
    // 官方市场传说符文石收购价格
    officialLegendaryRuneStoneBuyPrice: 2000,
    // 官方市场符文石碎片收购价格
    officialRuneFragmentBuyPrice: 10,
    // 自由市场素材最低价格
    freeMarketMinPrice: 100,
    // 自由市场符文石最低价格
    freeMarketRuneStoneMinPrice: 100,
    // 竞技场奖池金额
    arenaPoolAmount: 100000,
    // 竞技场参与奖奖金
    arenaParticipationReward: 500,
    // 竞技场每次战斗获得金币
    arenaBattleGold: 50,
    // 赛季持续天数，最少3天
    seasonDays: 3,
    // 公会自定义标志价格
    guildCustomLogoPrice: 5000,
    // 公会修改名字价格
    guildChangeNamePrice: 1000,
    // 游客模式开关
    guestModeEnabled: true,
    // 每个IP每天可注册游客账号数
    guestMaxPerIpPerDay: 3,
    // 每24小时全局邮件发送上限
    dailyEmailLimit: 500,
    // 每24小时全局游客注册上限
    dailyGuestRegisterLimit: 200,
    // 公会等级升级手续费基数
    guildLevelUpFeeBase: 1000,
    // 冒险家升级素材基数（水晶）
    adventurerLevelUpCrystalBase: 100,
    // 冒险家升级金币基数
    adventurerLevelUpGoldBase: 500,
    // 冒险家降级金币价格
    adventurerLevelDownGoldPrice: 1000,
    // 迷宫等级产出增益计数（百分比）
    dungeonLevelProductionBonusBase: 100,
    // 符文石分解碎片系数：普通
    runeStoneDecomposeNormalBase: 10,
    // 符文石分解碎片系数：稀有
    runeStoneDecomposeRareBase: 100,
    // 符文石分解碎片系数：传说
    runeStoneDecomposeLegendaryBase: 500,
    // 符文石升级消耗碎片系数：普通
    runeStoneUpgradeNormalBase: 100,
    // 符文石升级消耗碎片系数：稀有
    runeStoneUpgradeRareBase: 1000,
    // 符文石升级消耗碎片系数：传说
    runeStoneUpgradeLegendaryBase: 5000
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
        siteSettings: siteSettingsConfig,
        securitySettings: securitySettingsConfig,
        emailSettings: emailSettingsConfig,
        adSettings: adSettingsConfig,
        gameSettings: gameSettingsConfig
      }
      // 将data转换为object
      const obj = {}
      data.forEach(item => {
        obj[item.name] = item.value
      })
      formatResToForm(config.siteSettings, obj)
      formatResToForm(config.securitySettings, obj)
      formatResToForm(config.emailSettings, obj)
      formatResToForm(config.adSettings, obj)
      formatResToForm(config.gameSettings, obj)
      // 将配置挂载到global上
      global.$globalConfig = config
      filter.reload([...config.securitySettings.siteBannedKeywordList])
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
      // 将emailSettings.emailPassword设置为****
      showConfig.emailSettings.emailPassword = '****'
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

import { createI18n } from 'vue-i18n'
// 国际化
let lang = navigator.language||navigator.userLanguage
lang = lang.substr(0, 2)
const i18n = createI18n({
  locale: localStorage.getItem("lang") || lang, // set locale
  messages: {
    zh: require('./zh.js'), // 中文语言包
    en: require('./en.js'), // 英文语言包
    ja: require('./ja.js') // 日文语言包
  }
})

export default i18n
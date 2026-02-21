<template>
  <div v-if="deviceInfo" class="device-info-display text-sm leading-6">
    <!-- 系统 -->
    <div v-if="osName" class="flex items-center gap-1">
      <span class="text-gray-500 dark:text-gray-400">系统：</span>
      <span>{{ osName }}</span>
      <span v-if="osVersion" class="text-gray-400 dark:text-gray-500">{{
        osVersion
      }}</span>
    </div>

    <!-- 浏览器 -->
    <div v-if="browserName" class="flex items-center gap-1">
      <span class="text-gray-500 dark:text-gray-400">浏览器：</span>
      <span>{{ browserName }}</span>
      <span v-if="browserVersion" class="text-gray-400 dark:text-gray-500">{{
        browserVersion
      }}</span>
    </div>

    <!-- 类型 -->
    <div class="flex items-center gap-1">
      <span class="text-gray-500 dark:text-gray-400">类型：</span>
      <span>{{ browserTypeLabel }}</span>
      <el-tooltip
        v-if="browserTypeDesc"
        :content="browserTypeDesc"
        placement="top"
        :show-after="100"
        max-width="260"
      >
        <el-icon class="cursor-pointer text-blue-400 hover:text-blue-600">
          <InfoFilled />
        </el-icon>
      </el-tooltip>
    </div>

    <!-- 完整 UA -->
    <div v-if="ua" class="flex items-start gap-1">
      <span class="text-gray-500 dark:text-gray-400 shrink-0">UA：</span>
      <el-tooltip
        :content="ua"
        placement="top"
        :show-after="100"
        max-width="400"
      >
        <span
          class="truncate max-w-[200px] cursor-default text-gray-600 dark:text-gray-300"
        >
          {{ ua }}
        </span>
      </el-tooltip>
    </div>
  </div>
  <span v-else class="text-gray-400">—</span>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  deviceInfo: {
    type: Object,
    default: null
  }
})

const BROWSER_TYPE_MAP = {
  cli: {
    label: '命令行浏览器',
    desc: '通过命令行操作的纯文本浏览器，无图形界面，如 cURL、Lynx'
  },
  crawler: {
    label: '爬虫',
    desc: '系统性抓取网页以为搜索引擎建立索引的自动化程序，如 Googlebot'
  },
  email: {
    label: '邮件客户端',
    desc: '用于访问和管理电子邮件的软件，如 Outlook、Thunderbird'
  },
  fetcher: {
    label: '抓取器',
    desc: '按需抓取特定 URL 以提取元数据或生成预览的自动化程序，如 Twitterbot、ChatGPT-User'
  },
  inapp: {
    label: '内嵌浏览器',
    desc: '移动应用中嵌入的浏览器，用于在不离开 App 的情况下打开网页，如 Slack'
  },
  mediaplayer: {
    label: '媒体播放器',
    desc: '专门用于播放媒体文件的应用程序，如 VLC、Windows Media Player'
  },
  library: {
    label: '请求库',
    desc: '在较大应用中用于抓取或交互网页内容的软件组件，如 Axios、Scrapy'
  }
}

const ua = computed(() => props.deviceInfo?.ua || '')
const osName = computed(() => props.deviceInfo?.os?.name || '')
const osVersion = computed(() => props.deviceInfo?.os?.version || '')
const browserName = computed(() => props.deviceInfo?.browser?.name || '')
const browserVersion = computed(() => props.deviceInfo?.browser?.version || '')

const browserTypeLabel = computed(() => {
  const type = props.deviceInfo?.browser?.type
  if (!type) return '普通浏览器'
  return BROWSER_TYPE_MAP[type]?.label || type
})

const browserTypeDesc = computed(() => {
  const type = props.deviceInfo?.browser?.type
  if (!type) return ''
  return BROWSER_TYPE_MAP[type]?.desc || ''
})
</script>

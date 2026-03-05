<template>
  <el-dialog
    v-model="visible"
    title="游客账号已创建"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    align-center
    destroy-on-close
    @closed="handleConfirm"
  >
    <div class="space-y-3">
      <el-alert type="warning" :closable="false" show-icon>
        <p>请牢记以下账号信息，关闭后将无法再次查看！</p>
      </el-alert>
      <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-2">
        <div class="flex items-center justify-between">
          <span class="text-sm text-gray-500">邮箱账号：</span>
          <div class="flex items-center gap-1">
            <span
              class="text-sm font-mono font-bold text-gray-800 dark:text-gray-200 select-all"
            >
              {{ email }}
            </span>
            <el-button size="small" text @click="handleCopy(email)">
              📋
            </el-button>
          </div>
        </div>
        <div class="flex items-center justify-between">
          <span class="text-sm text-gray-500">密码：</span>
          <div class="flex items-center gap-1">
            <span
              class="text-sm font-mono font-bold text-gray-800 dark:text-gray-200 select-all"
            >
              {{ password }}
            </span>
            <el-button size="small" text @click="handleCopy(password)">
              📋
            </el-button>
          </div>
        </div>
      </div>
      <!-- 下载按钮 -->
      <el-button
        type="warning"
        class="w-full"
        size="large"
        @click="handleDownload"
      >
        📥 下载账号信息
      </el-button>
      <p class="text-xs text-gray-400">
        建议进入游戏后在公会设置中绑定正式邮箱，以保护您的账号。
      </p>
    </div>
    <template #footer>
      <el-button type="primary" @click="handleConfirm">
        我已记住，进入游戏
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { computed } from 'vue'
import { ElMessage } from 'element-plus'
import { useGameSiteSettings } from '@/composables/useGameSiteSettings.js'

const { siteSettings } = useGameSiteSettings()

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  email: {
    type: String,
    default: ''
  },
  password: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['update:modelValue', 'confirm'])

const visible = computed({
  get: () => props.modelValue,
  set: val => emit('update:modelValue', val)
})

async function handleCopy(text) {
  try {
    await navigator.clipboard.writeText(text)
    ElMessage.success('已复制到剪贴板')
  } catch {
    ElMessage.warning('复制失败，请手动选择复制')
  }
}

function handleDownload() {
  const siteName = siteSettings.value.siteTitle || 'WikimoeGuild'
  const siteUrl = siteSettings.value.siteUrl || window.location.origin
  const content = [
    `${siteName} - 账号信息`,
    '========================',
    '',
    `游戏地址：${siteUrl}`,
    '',
    `邮箱账号：${props.email}`,
    `密码：${props.password}`,
    '',
    '========================',
    '请妥善保管此信息，建议进入游戏后绑定正式邮箱。'
  ].join('\n')

  // 加 UTF-8 BOM，避免 Windows 记事本等工具显示乱码
  const bom = '\uFEFF'
  const blob = new Blob([bom + content], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${siteName}_账号信息.txt`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
  ElMessage.success('账号信息已下载')
}

function handleConfirm() {
  emit('confirm')
}
</script>

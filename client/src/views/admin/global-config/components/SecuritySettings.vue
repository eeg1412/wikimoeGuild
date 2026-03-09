<template>
  <div class="space-y-4">
    <el-form label-width="140px" @submit.prevent="handleSubmit">
      <!-- IP 黑名单 -->
      <el-form-item label="IP 黑名单">
        <div class="w-full space-y-2">
          <el-input
            v-model="newIP"
            placeholder="输入 IP 地址"
            @keyup.enter="addIP"
            clearable
          />
          <el-button @click="addIP" size="small">添加</el-button>
          <div class="mt-2">
            <el-tag
              v-for="ip in form.siteIPBlockList"
              :key="ip"
              closable
              @close="removeIP(ip)"
              class="mr-2 mb-2"
            >
              {{ ip }}
            </el-tag>
          </div>
        </div>
      </el-form-item>

      <!-- 敏感词列表 -->
      <el-form-item label="敏感词列表">
        <div class="w-full space-y-2">
          <el-input
            v-model="newKeyword"
            placeholder="输入敏感词"
            @keyup.enter="addKeyword"
            clearable
          />
          <el-button @click="addKeyword" size="small">添加</el-button>
          <div class="mt-2">
            <el-tag
              v-for="(kw, idx) in form.siteBannedKeywordList"
              :key="idx"
              closable
              @close="removeKeyword(idx)"
              class="mr-2 mb-2"
            >
              {{ kw }}
            </el-tag>
          </div>
        </div>
      </el-form-item>

      <el-form-item>
        <el-button
          type="primary"
          :loading="submitting"
          :disabled="submitting"
          @click="handleSubmit"
        >
          保存配置
        </el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import {
  getSecuritySettingsApi,
  updateSecuritySettingsApi
} from '@/api/admin/globalConfig'

const submitting = ref(false)
const newIP = ref('')
const newKeyword = ref('')

const form = reactive({
  siteIPBlockList: [],
  siteBannedKeywordList: []
})

// 加载安全设置
async function loadSecuritySettings() {
  try {
    const res = await getSecuritySettingsApi()
    const data = res.data?.data || {}
    form.siteIPBlockList = data.siteIPBlockList || []
    form.siteBannedKeywordList = data.siteBannedKeywordList || []
  } catch (e) {
    ElMessage.error({ message: '加载安全设置失败', showClose: true })
  }
}

onMounted(() => {
  loadSecuritySettings()
})

function addIP() {
  if (newIP.value && !form.siteIPBlockList.includes(newIP.value)) {
    form.siteIPBlockList.push(newIP.value)
    newIP.value = ''
  }
}

function removeIP(ip) {
  const idx = form.siteIPBlockList.indexOf(ip)
  if (idx > -1) form.siteIPBlockList.splice(idx, 1)
}

function addKeyword() {
  if (
    newKeyword.value &&
    !form.siteBannedKeywordList.includes(newKeyword.value)
  ) {
    form.siteBannedKeywordList.push(newKeyword.value)
    newKeyword.value = ''
  }
}

function removeKeyword(idx) {
  form.siteBannedKeywordList.splice(idx, 1)
}

async function handleSubmit() {
  if (submitting.value) return
  submitting.value = true
  try {
    await updateSecuritySettingsApi({
      siteIPBlockList: form.siteIPBlockList,
      siteBannedKeywordList: form.siteBannedKeywordList
    })
    ElMessage.success({ message: '安全设置已保存', showClose: true })
  } catch (e) {
    ElMessage.error({ message: e.response?.data?.message || '保存失败', showClose: true })
  } finally {
    submitting.value = false
  }
}
</script>

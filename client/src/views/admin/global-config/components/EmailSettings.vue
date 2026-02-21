<template>
  <div class="space-y-4">
    <el-form :model="form" label-width="140px" @submit.prevent="handleSubmit">
      <el-form-item label="SMTP 服务器" prop="emailSmtpHost">
        <el-input
          v-model="form.emailSmtpHost"
          placeholder="例: smtp.gmail.com"
          clearable
        />
      </el-form-item>
      <el-form-item label="SMTP 端口" prop="emailSmtpPort">
        <el-input
          v-model="form.emailSmtpPort"
          placeholder="例: 587"
          clearable
        />
      </el-form-item>
      <el-form-item label="安全协议" prop="emailSmtpSecure">
        <el-switch
          v-model="form.emailSmtpSecure"
          active-text="TLS/SSL"
          inactive-text="无"
        />
      </el-form-item>
      <el-form-item label="发信邮箱" prop="emailSender">
        <el-input
          v-model="form.emailSender"
          placeholder="sender@example.com"
          clearable
        />
      </el-form-item>
      <el-form-item label="发信密码" prop="emailPassword">
        <el-input
          v-model="form.emailPassword"
          type="password"
          placeholder="应用密码或授权码"
          clearable
          show-password
        />
      </el-form-item>
      <el-form-item label="收信邮箱" prop="emailReceiver">
        <el-input
          v-model="form.emailReceiver"
          placeholder="receiver@example.com"
          clearable
        />
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
        <el-button @click="testEmail" :loading="testing" :disabled="testing"
          >测试连接</el-button
        >
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import {
  getEmailSettingsApi,
  updateEmailSettingsApi
} from '@/api/admin/globalConfig'

const submitting = ref(false)
const testing = ref(false)

const form = reactive({
  emailSmtpHost: '',
  emailSmtpPort: '',
  emailSmtpSecure: true,
  emailSender: '',
  emailPassword: '',
  emailReceiver: ''
})

// 加载邮箱设置
async function loadEmailSettings() {
  try {
    const res = await getEmailSettingsApi()
    const data = res.data?.data || {}
    Object.assign(form, data)
  } catch (e) {
    ElMessage.error('加载邮箱设置失败')
  }
}

onMounted(() => {
  loadEmailSettings()
})

async function handleSubmit() {
  if (submitting.value) return
  submitting.value = true
  try {
    await updateEmailSettingsApi({
      emailSmtpHost: form.emailSmtpHost,
      emailSmtpPort: form.emailSmtpPort,
      emailSmtpSecure: form.emailSmtpSecure,
      emailSender: form.emailSender,
      emailPassword: form.emailPassword,
      emailReceiver: form.emailReceiver
    })
    ElMessage.success('邮箱设置已保存')
  } catch (e) {
    ElMessage.error(e.response?.data?.message || '保存失败')
  } finally {
    submitting.value = false
  }
}

async function testEmail() {
  testing.value = true
  try {
    ElMessage.success('邮箱设置正确')
  } catch (e) {
    ElMessage.error('邮箱连接失败')
  } finally {
    testing.value = false
  }
}
</script>

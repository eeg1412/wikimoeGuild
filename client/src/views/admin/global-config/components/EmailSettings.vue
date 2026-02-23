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
          :disabled="submitting || testing"
          @click="handleSubmit"
        >
          保存配置
        </el-button>
        <el-button
          :loading="testing"
          :disabled="testing || submitting"
          @click="openTestDialog"
        >
          测试连接
        </el-button>
      </el-form-item>
    </el-form>

    <!-- 测试邮件发送弹窗 -->
    <el-dialog
      v-model="testDialogVisible"
      title="测试邮件连接"
      width="400px"
      :close-on-click-modal="!testing"
    >
      <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">
        将使用当前保存的邮件配置向指定邮箱发送一封测试邮件。
      </p>
      <el-form @submit.prevent="handleTestEmail">
        <el-form-item label="收件邮箱">
          <el-input
            v-model="testReceiver"
            placeholder="请输入接收测试邮件的邮箱"
            clearable
            :disabled="testing"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="testDialogVisible = false" :disabled="testing"
          >取消</el-button
        >
        <el-button
          type="primary"
          :loading="testing"
          :disabled="testing || !testReceiver"
          @click="handleTestEmail"
        >
          发送测试邮件
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import {
  getEmailSettingsApi,
  updateEmailSettingsApi,
  testEmailConnectionApi
} from '@/api/admin/globalConfig'

const submitting = ref(false)
const testing = ref(false)
const testDialogVisible = ref(false)
const testReceiver = ref('')

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
    if (data.emailReceiver) {
      testReceiver.value = data.emailReceiver
    }
  } catch {
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

function openTestDialog() {
  if (!testReceiver.value && form.emailReceiver) {
    testReceiver.value = form.emailReceiver
  }
  testDialogVisible.value = true
}

async function handleTestEmail() {
  if (!testReceiver.value) {
    ElMessage.warning('请输入收件邮箱')
    return
  }
  testing.value = true
  try {
    await testEmailConnectionApi({ to: testReceiver.value })
    ElMessage.success('测试邮件发送成功，请查收邮件')
    testDialogVisible.value = false
  } catch (e) {
    ElMessage.error(e.response?.data?.message || '邮件发送失败，请检查邮件配置')
  } finally {
    testing.value = false
  }
}
</script>

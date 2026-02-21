<template>
  <div class="space-y-4">
    <el-form
      :model="form"
      :rules="rules"
      label-width="140px"
      @submit.prevent="handleSubmit"
    >
      <!-- 开启谷歌广告 -->
      <el-form-item label="开启谷歌广告" prop="googleAdEnabled">
        <el-switch
          v-model="form.googleAdEnabled"
          active-text="开启"
          inactive-text="关闭"
        />
      </el-form-item>

      <!-- 谷歌广告 ID -->
      <el-form-item label="谷歌广告 ID" prop="googleAdId">
        <el-input
          v-model="form.googleAdId"
          placeholder="例: ca-pub-xxxxxxxxxxxxxxxx"
          clearable
          :disabled="!form.googleAdEnabled"
        />
      </el-form-item>

      <!-- ads.txt 内容 -->
      <el-form-item label="ads.txt" prop="googleAdAdsTxt">
        <el-input
          v-model="form.googleAdAdsTxt"
          type="textarea"
          placeholder="请输入 ads.txt 内容"
          :rows="6"
          clearable
          :disabled="!form.googleAdEnabled"
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
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getAdSettingsApi, updateAdSettingsApi } from '@/api/admin/globalConfig'

const submitting = ref(false)

const form = reactive({
  googleAdEnabled: false,
  googleAdId: '',
  googleAdAdsTxt: ''
})

const rules = computed(() => ({
  googleAdId: form.googleAdEnabled
    ? [
        {
          required: true,
          message: '开启广告后，谷歌广告 ID 为必填',
          trigger: 'blur'
        }
      ]
    : []
}))

// 加载广告设置
async function loadAdSettings() {
  try {
    const res = await getAdSettingsApi()
    const data = res.data?.data || {}
    Object.assign(form, data)
  } catch (e) {
    ElMessage.error('加载广告设置失败')
  }
}

onMounted(() => {
  loadAdSettings()
})

async function handleSubmit() {
  if (submitting.value) return
  submitting.value = true
  try {
    await updateAdSettingsApi({
      googleAdEnabled: form.googleAdEnabled,
      googleAdId: form.googleAdId,
      googleAdAdsTxt: form.googleAdAdsTxt
    })
    ElMessage.success('广告设置已保存')
  } catch (e) {
    ElMessage.error(e.response?.data?.message || '保存失败')
  } finally {
    submitting.value = false
  }
}
</script>

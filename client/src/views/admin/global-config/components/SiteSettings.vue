<template>
  <div class="space-y-4">
    <el-form
      :model="form"
      :rules="rules"
      label-width="140px"
      @submit.prevent="handleSubmit"
    >
      <!-- 网站标题 必填 -->
      <el-form-item label="网站标题" prop="siteTitle">
        <el-input
          v-model="form.siteTitle"
          placeholder="请输入网站标题"
          clearable
        />
      </el-form-item>

      <!-- 网站副标题 -->
      <el-form-item label="网站副标题" prop="siteSubTitle">
        <el-input
          v-model="form.siteSubTitle"
          placeholder="请输入网站副标题"
          clearable
        />
      </el-form-item>

      <!-- 站点关键词 -->
      <el-form-item label="站点关键词" prop="siteKeywords">
        <el-input
          v-model="form.siteKeywords"
          placeholder="维基萌,公会,游戏"
          clearable
        />
      </el-form-item>

      <!-- 站点地址 必填 -->
      <el-form-item label="站点地址" prop="siteUrl">
        <el-input
          v-model="form.siteUrl"
          placeholder="https://example.com"
          clearable
        />
      </el-form-item>

      <!-- Favicon 图片 -->
      <el-form-item label="网站Favicon" prop="siteFavicon">
        <div class="space-y-2" v-loading="faviconUrlIsloading">
          <Cropper
            :width="512"
            :height="512"
            :aspect-ratio="1"
            :src="
              faviconAccessible
                ? `/uploads/site/favicon.png?t=${Date.now()}`
                : form.siteFavicon
            "
            put-image-type="image/png"
            @crop="handleImageCrop"
          />
        </div>
      </el-form-item>

      <!-- 提交按钮 -->
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
import Cropper from '@/components/Cropper.vue'
import {
  getSiteSettingsApi,
  updateSiteSettingsApi
} from '@/api/admin/globalConfig'

const submitting = ref(false)
const faviconAccessible = ref(false)

const form = reactive({
  siteTitle: '',
  siteSubTitle: '',
  siteKeywords: '',
  siteUrl: '',
  siteFavicon: ''
})

const rules = {
  siteTitle: [{ required: true, message: '请填写网站标题', trigger: 'blur' }],
  siteUrl: [{ required: true, message: '请填写站点地址', trigger: 'blur' }]
}

// 检查 Favicon 是否可访问
const faviconUrlIsloading = ref(false)
function checkFaviconAccessible() {
  faviconUrlIsloading.value = true
  const faviconUrl = '/uploads/site/favicon.png'
  const img = new Image()
  img.onload = () => {
    faviconAccessible.value = true
    faviconUrlIsloading.value = false
  }
  img.onerror = () => {
    faviconAccessible.value = false
    faviconUrlIsloading.value = false
  }
  img.src = faviconUrl
}

// 加载站点设置
async function loadSiteSettings() {
  try {
    const res = await getSiteSettingsApi()
    const data = res.data?.data || {}
    Object.assign(form, data)
    checkFaviconAccessible()
  } catch (e) {
    ElMessage.error('加载站点设置失败')
  }
}

onMounted(() => {
  loadSiteSettings()
})

function handleImageCrop(base64) {
  if (submitting.value) return
  form.siteFavicon = base64
  faviconAccessible.value = false
}

function handleDeleteFavicon() {
  if (submitting.value) return
  form.siteFavicon = ''
  faviconAccessible.value = false
}

async function handleSubmit() {
  if (submitting.value) return
  submitting.value = true
  try {
    await updateSiteSettingsApi({
      siteTitle: form.siteTitle,
      siteSubTitle: form.siteSubTitle,
      siteKeywords: form.siteKeywords,
      siteUrl: form.siteUrl,
      siteFavicon: form.siteFavicon
    })
    ElMessage.success('站点设置已保存')
  } catch (e) {
    ElMessage.error(e.response?.data?.message || '保存失败')
  } finally {
    submitting.value = false
  }
}
</script>

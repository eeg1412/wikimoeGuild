<template>
  <div>
    <div class="mb-4">
      <h2 class="text-xl font-semibold dark:text-gray-100">竞技场赛季设置</h2>
      <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
        可设置当前活跃赛季的开始时间与结束时间
      </p>
    </div>

    <el-card shadow="never" v-loading="loading">
      <template v-if="seasonInfo">
        <el-descriptions :column="1" border class="mb-5">
          <el-descriptions-item label="赛季编号">
            {{ seasonInfo.seasonNumber }}
          </el-descriptions-item>
          <el-descriptions-item label="当前状态">
            <el-tag type="success">{{ seasonInfo.status }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="当前开始时间">
            {{ formatDate(seasonInfo.startTime) }}
          </el-descriptions-item>
          <el-descriptions-item label="当前结束时间">
            {{ formatDate(seasonInfo.endTime) }}
          </el-descriptions-item>
        </el-descriptions>

        <el-form
          :model="form"
          label-width="120px"
          @submit.prevent="handleSubmit"
        >
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <el-form-item label="开始时间">
              <el-date-picker
                v-model="form.startTime"
                type="datetime"
                placeholder="选择开始时间"
                style="width: 100%"
              />
            </el-form-item>
            <el-form-item label="结束时间">
              <el-date-picker
                v-model="form.endTime"
                type="datetime"
                placeholder="选择结束时间"
                style="width: 100%"
              />
            </el-form-item>
          </div>

          <el-alert
            type="info"
            :closable="false"
            show-icon
            class="mb-4"
            title="规则：开始时间不能早于历史赛季结束时间；开始到结束的区间必须大于等于3天。"
          />

          <el-form-item>
            <el-button
              type="primary"
              :loading="submitting"
              :disabled="submitting || loading"
              @click="handleSubmit"
            >
              保存赛季时间
            </el-button>
          </el-form-item>
        </el-form>
      </template>

      <el-empty v-else description="当前没有可设置的活跃赛季" />
    </el-card>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { formatDate } from '@shared'
import {
  getCurrentAdminArenaSeasonApi,
  updateCurrentAdminArenaSeasonTimeApi
} from '@/api/admin/arenaSeason.js'

const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000

const loading = ref(false)
const submitting = ref(false)
const seasonInfo = ref(null)

const form = reactive({
  startTime: null,
  endTime: null
})

async function loadCurrentSeason() {
  loading.value = true
  try {
    const res = await getCurrentAdminArenaSeasonApi()
    const data = res.data?.data || null
    seasonInfo.value = data
    form.startTime = data?.startTime ? new Date(data.startTime) : null
    form.endTime = data?.endTime ? new Date(data.endTime) : null
  } catch {
    seasonInfo.value = null
  } finally {
    loading.value = false
  }
}

async function handleSubmit() {
  if (!form.startTime || !form.endTime) {
    ElMessage.warning('请先选择开始时间和结束时间')
    return
  }

  const start = new Date(form.startTime)
  const end = new Date(form.endTime)

  if (end <= start) {
    ElMessage.warning('结束时间必须晚于开始时间')
    return
  }

  if (end.getTime() - start.getTime() < THREE_DAYS_MS) {
    ElMessage.warning('开始时间和结束时间的时间区间必须大于等于三天')
    return
  }

  if (submitting.value) return
  submitting.value = true

  try {
    const res = await updateCurrentAdminArenaSeasonTimeApi({
      startTime: start,
      endTime: end
    })
    const data = res.data?.data || null
    seasonInfo.value = data
    form.startTime = data?.startTime ? new Date(data.startTime) : form.startTime
    form.endTime = data?.endTime ? new Date(data.endTime) : form.endTime
    ElMessage.success('赛季时间已更新')
  } catch {
    // 错误提示已由 adminRequest 响应拦截器统一处理，避免重复弹窗
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  loadCurrentSeason()
})
</script>

<template>
  <div>
    <!-- 页面标题 -->
    <div class="mb-4">
      <h2 class="text-xl font-semibold dark:text-gray-100">玩家注册日志</h2>
      <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
        查看玩家注册记录
      </p>
    </div>

    <!-- 搜索栏 -->
    <el-card shadow="never" class="mb-4">
      <el-form :model="searchForm" inline class="flex flex-wrap gap-y-2">
        <el-form-item label="邮箱">
          <el-input
            v-model="searchForm.email"
            placeholder="邮箱地址"
            clearable
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item label="IP">
          <el-input
            v-model="searchForm.ip"
            placeholder="IP 地址"
            clearable
            style="width: 160px"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-select
            v-model="searchForm.success"
            placeholder="全部"
            clearable
            style="width: 120px"
          >
            <el-option label="注册成功" value="true" />
            <el-option label="注册失败" value="false" />
          </el-select>
        </el-form-item>
        <el-form-item label="游客">
          <el-select
            v-model="searchForm.isGuest"
            placeholder="全部"
            clearable
            style="width: 120px"
          >
            <el-option label="是" value="true" />
            <el-option label="否" value="false" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="loading" @click="handleSearch"
            >搜索</el-button
          >
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 批量删除 -->
    <el-card shadow="never" class="mb-4">
      <el-form :model="batchForm" inline class="flex flex-wrap gap-y-2">
        <el-form-item label="开始时间" class="mb-0">
          <el-date-picker
            v-model="batchForm.startTime"
            type="datetime"
            placeholder="选择开始时间"
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item label="结束时间" class="mb-0">
          <el-date-picker
            v-model="batchForm.endTime"
            type="datetime"
            placeholder="选择结束时间"
            style="width: 200px"
          />
        </el-form-item>
        <el-button
          type="danger"
          :loading="batchDeleting"
          @click="handleBatchDelete"
          >批量删除</el-button
        >
      </el-form>
    </el-card>

    <!-- 数据表格 -->
    <el-card shadow="never">
      <ResponsiveTable
        :data="tableData"
        v-loading="loading"
        stripe
        style="width: 100%"
      >
        <ResponsiveTableColumn label="邮箱" prop="email" min-width="200" />
        <ResponsiveTableColumn label="IP 地址" prop="ip" min-width="130" />
        <ResponsiveTableColumn label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.success ? 'success' : 'danger'" size="small">
              {{ row.success ? '成功' : '失败' }}
            </el-tag>
          </template>
        </ResponsiveTableColumn>
        <ResponsiveTableColumn
          label="消息"
          prop="message"
          min-width="140"
          show-overflow-tooltip
        />
        <ResponsiveTableColumn label="IP 归属地" min-width="180">
          <template #default="{ row }">
            <IpInfoDisplay
              v-if="row.ipInfo?.countryLong"
              :ipInfo="row.ipInfo"
            />
            <span v-else class="text-gray-400">—</span>
          </template>
        </ResponsiveTableColumn>
        <ResponsiveTableColumn label="Bot" width="70" align="center">
          <template #default="{ row }">
            <el-tag :type="row.isBot ? 'danger' : 'success'" size="small">
              {{ row.isBot ? '是' : '否' }}
            </el-tag>
          </template>
        </ResponsiveTableColumn>
        <ResponsiveTableColumn label="游客" width="70" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.isGuest" type="warning" size="small">
              游客
            </el-tag>
          </template>
        </ResponsiveTableColumn>
        <ResponsiveTableColumn label="设备信息" min-width="220">
          <template #default="{ row }">
            <DeviceInfoDisplay :deviceInfo="row.deviceInfo" />
          </template>
        </ResponsiveTableColumn>
        <ResponsiveTableColumn label="注册时间" min-width="170">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </ResponsiveTableColumn>
        <ResponsiveTableColumn
          label="操作"
          width="80"
          align="center"
          fixed="right"
        >
          <template #default="{ row }">
            <el-button
              type="danger"
              size="small"
              text
              :loading="deletingId === row._id"
              :disabled="deletingId !== null"
              @click="handleDelete(row)"
            >
              删除
            </el-button>
          </template>
        </ResponsiveTableColumn>
      </ResponsiveTable>

      <!-- 分页 -->
      <div class="flex justify-end mt-4">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          :page-sizes="[20, 50, 100]"
          layout="total, sizes, prev, pager, next"
          background
          @size-change="fetchData"
          @current-change="fetchData"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  listGamePlayerRegisterLogsApi,
  deleteGamePlayerRegisterLogApi,
  batchDeleteGamePlayerRegisterLogsApi
} from '@/api/admin/gamePlayerRegisterLog.js'
import { formatDate } from '@shared'

const loading = ref(false)
const tableData = ref([])
const deletingId = ref(null)
const batchDeleting = ref(false)

const searchForm = reactive({ email: '', ip: '', success: '', isGuest: '' })
const batchForm = reactive({ startTime: null, endTime: null })
const pagination = reactive({ page: 1, pageSize: 20, total: 0 })

async function fetchData() {
  loading.value = true
  try {
    const params = { page: pagination.page, pageSize: pagination.pageSize }
    if (searchForm.email) params.email = searchForm.email
    if (searchForm.ip) params.ip = searchForm.ip
    if (searchForm.success !== '') params.success = searchForm.success
    if (searchForm.isGuest !== '') params.isGuest = searchForm.isGuest
    const res = await listGamePlayerRegisterLogsApi(params)
    tableData.value = res.data.data.list || []
    pagination.total = res.data.data.total || 0
  } catch {
    tableData.value = []
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  pagination.page = 1
  fetchData()
}

function handleReset() {
  searchForm.email = ''
  searchForm.ip = ''
  searchForm.success = ''
  searchForm.isGuest = ''
  pagination.page = 1
  fetchData()
}

async function handleDelete(row) {
  try {
    await ElMessageBox.confirm('确认删除该注册日志？', '提示', {
      type: 'warning'
    })
    deletingId.value = row._id
    await deleteGamePlayerRegisterLogApi(row._id)
    ElMessage.success({ message: '删除成功', showClose: true })
    fetchData()
  } catch {
    // 取消或失败
  } finally {
    deletingId.value = null
  }
}

async function handleBatchDelete() {
  if (!batchForm.startTime && !batchForm.endTime) {
    ElMessage.warning({ message: '请至少选择开始时间或结束时间', showClose: true })
    return
  }
  try {
    await ElMessageBox.confirm('确认按时间范围批量删除注册日志？', '警告', {
      type: 'warning'
    })
    batchDeleting.value = true
    const data = {}
    if (batchForm.startTime) data.startTime = batchForm.startTime
    if (batchForm.endTime) data.endTime = batchForm.endTime
    const res = await batchDeleteGamePlayerRegisterLogsApi(data)
    ElMessage.success({ message: res.data.message || '批量删除成功', showClose: true })
    fetchData()
  } catch {
    // 取消或失败
  } finally {
    batchDeleting.value = false
  }
}

onMounted(fetchData)
</script>

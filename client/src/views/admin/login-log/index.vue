<template>
  <div>
    <!-- 页面标题 -->
    <div class="mb-4">
      <h2 class="text-xl font-semibold dark:text-gray-100">登录历史</h2>
      <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
        查看管理员登录记录
      </p>
    </div>

    <!-- 搜索栏 -->
    <el-card shadow="never" class="mb-4">
      <el-form :model="searchForm" inline class="flex flex-wrap gap-y-2">
        <el-form-item label="账号">
          <el-input
            v-model="searchForm.username"
            placeholder="账号名称"
            clearable
            style="width: 160px"
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
            <el-option label="登录成功" value="true" />
            <el-option label="登录失败" value="false" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="loading" @click="handleSearch">
            搜索
          </el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
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
        <ResponsiveTableColumn label="账号" prop="username" min-width="120" />
        <ResponsiveTableColumn label="IP 地址" prop="ip" min-width="130" />
        <ResponsiveTableColumn label="登录状态" width="100" align="center">
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
              v-if="row.ipInfo && row.ipInfo.countryLong"
              :ipInfo="row.ipInfo"
            />
            <span v-else class="text-gray-400">—</span>
          </template>
        </ResponsiveTableColumn>
        <ResponsiveTableColumn label="Bot" width="70" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.isBot" type="error" size="small">是</el-tag>
            <el-tag v-else type="success" size="small">否</el-tag>
          </template>
        </ResponsiveTableColumn>
        <ResponsiveTableColumn label="设备信息" min-width="220">
          <template #default="{ row }">
            <DeviceInfoDisplay :deviceInfo="row.deviceInfo" />
          </template>
        </ResponsiveTableColumn>
        <ResponsiveTableColumn label="登录时间" min-width="170">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
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
import { listLoginLogApi } from '@/api/admin/loginLog.js'
import { formatDate } from '@shared'
import { el } from 'element-plus/es/locale/index.mjs'

const loading = ref(false)
const tableData = ref([])

const searchForm = reactive({
  username: '',
  ip: '',
  success: ''
})

const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})

async function fetchData() {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize
    }
    if (searchForm.username) params.username = searchForm.username
    if (searchForm.ip) params.ip = searchForm.ip
    if (searchForm.success !== '') params.success = searchForm.success

    const res = await listLoginLogApi(params)
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
  searchForm.username = ''
  searchForm.ip = ''
  searchForm.success = ''
  pagination.page = 1
  fetchData()
}

onMounted(fetchData)
</script>

<template>
  <div>
    <!-- 页面标题 -->
    <div class="mb-4">
      <h2 class="text-xl font-semibold dark:text-gray-100">封禁记录</h2>
      <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
        查看并管理玩家封禁记录，删除记录即可解除封禁
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
            style="width: 220px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="loading" @click="handleSearch"
            >搜索</el-button
          >
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
        <ResponsiveTableColumn label="玩家邮箱" prop="email" min-width="220" />
        <ResponsiveTableColumn label="封禁到期时间" min-width="180">
          <template #default="{ row }">
            <span
              :class="
                isBanActive(row) ? 'text-red-500 font-medium' : 'text-gray-400'
              "
            >
              {{ formatDate(row.banExpires) }}
            </span>
          </template>
        </ResponsiveTableColumn>
        <ResponsiveTableColumn label="封禁状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="isBanActive(row) ? 'danger' : 'info'" size="small">
              {{ isBanActive(row) ? '封禁中' : '已过期' }}
            </el-tag>
          </template>
        </ResponsiveTableColumn>
        <ResponsiveTableColumn label="创建时间" min-width="180">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </ResponsiveTableColumn>
        <ResponsiveTableColumn
          label="操作"
          width="100"
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
              解除封禁
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
  listGamePlayerBanLogsApi,
  deleteGamePlayerBanLogApi
} from '@/api/admin/gamePlayer.js'
import { formatDate } from '@shared'

const loading = ref(false)
const tableData = ref([])
const deletingId = ref(null)

const searchForm = reactive({ email: '' })
const pagination = reactive({ page: 1, pageSize: 20, total: 0 })

function isBanActive(row) {
  return new Date(row.banExpires) > new Date()
}

async function fetchData() {
  loading.value = true
  try {
    const params = { page: pagination.page, pageSize: pagination.pageSize }
    if (searchForm.email) params.email = searchForm.email
    const res = await listGamePlayerBanLogsApi(params)
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
  pagination.page = 1
  fetchData()
}

async function handleDelete(row) {
  try {
    await ElMessageBox.confirm(
      `确认解除对 ${row.email} 的封禁？解除后该玩家可立即登录。`,
      '确认解除封禁',
      { type: 'warning' }
    )
    deletingId.value = row._id
    await deleteGamePlayerBanLogApi(row._id)
    ElMessage.success({ message: '封禁已解除', showClose: true })
    fetchData()
  } catch {
    // 取消或失败
  } finally {
    deletingId.value = null
  }
}

onMounted(fetchData)
</script>

<template>
  <div>
    <!-- 页面标题 -->
    <div class="mb-4">
      <h2 class="text-xl font-semibold dark:text-gray-100">管理员列表</h2>
      <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
        管理系统中的管理员账户（仅超级管理员可操作）
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
            style="width: 180px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="loading" @click="handleSearch">
            搜索
          </el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
        <el-form-item class="ml-auto">
          <el-button type="primary" @click="handleAdd">
            <el-icon class="mr-1"><Plus /></el-icon>
            新增管理员
          </el-button>
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
        <ResponsiveTableColumn label="账号" prop="username" min-width="150" />
        <ResponsiveTableColumn label="角色" width="120" align="center">
          <template #default="{ row }">
            <el-tag
              :type="row.role === 999 ? 'danger' : 'primary'"
              size="small"
            >
              {{ row.role === 999 ? '超级管理员' : '管理员' }}
            </el-tag>
          </template>
        </ResponsiveTableColumn>
        <ResponsiveTableColumn label="创建时间" min-width="170">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </ResponsiveTableColumn>
        <ResponsiveTableColumn label="更新时间" min-width="170">
          <template #default="{ row }">
            {{ formatDate(row.updatedAt) }}
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
              v-if="row.role !== 999"
              type="primary"
              link
              size="small"
              @click="handleEdit(row)"
            >
              编辑
            </el-button>
            <span v-else class="text-xs text-gray-400">不可编辑</span>
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
import { useRouter, useRoute } from 'vue-router'
import { listAdminsApi } from '@/api/admin/admin.js'
import { formatDate } from '@shared'

const router = useRouter()
const route = useRoute()
const loading = ref(false)
const tableData = ref([])

const searchForm = reactive({
  username: ''
})

const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})

/** 从当前路由 query 恢复列表状态（从 editor 返回时保持现场） */
function restoreStateFromQuery() {
  const { page, pageSize, username } = route.query
  if (page) pagination.page = Number(page)
  if (pageSize) pagination.pageSize = Number(pageSize)
  if (username) searchForm.username = username
}

async function fetchData() {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize
    }
    if (searchForm.username) params.username = searchForm.username

    const res = await listAdminsApi(params)
    tableData.value = res.data.data.list || []
    pagination.total = res.data.data.total || 0
  } catch (e) {
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
  pagination.page = 1
  fetchData()
}

function handleAdd() {
  router.push({
    name: 'AdminManagementEditor',
    query: {
      mode: 'create',
      _page: pagination.page,
      _pageSize: pagination.pageSize,
      _username: searchForm.username || undefined
    }
  })
}

function handleEdit(row) {
  router.push({
    name: 'AdminManagementEditor',
    query: {
      mode: 'edit',
      id: row._id,
      _page: pagination.page,
      _pageSize: pagination.pageSize,
      _username: searchForm.username || undefined
    }
  })
}

onMounted(() => {
  restoreStateFromQuery()
  fetchData()
})
</script>

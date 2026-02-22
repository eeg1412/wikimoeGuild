<template>
  <div>
    <!-- 页面标题 -->
    <div class="mb-4">
      <h2 class="text-xl font-semibold dark:text-gray-100">玩家列表</h2>
      <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
        查看所有注册玩家信息
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
        <el-form-item label="公会名">
          <el-input
            v-model="searchForm.guildName"
            placeholder="公会名称"
            clearable
            style="width: 160px"
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
        <ResponsiveTableColumn label="公会图标" width="80" align="center">
          <template #default="{ row }">
            <el-avatar :size="36" :src="getGuildIcon(row)" shape="square" />
          </template>
        </ResponsiveTableColumn>
        <ResponsiveTableColumn
          label="公会名"
          prop="guildName"
          min-width="120"
        />
        <ResponsiveTableColumn label="邮箱" min-width="200">
          <template #default="{ row }">
            {{ row.accountInfo?.email || '—' }}
          </template>
        </ResponsiveTableColumn>
        <ResponsiveTableColumn label="地图更换次数" width="120" align="center">
          <template #default="{ row }">
            {{ row.mapCanChangeUses }}
          </template>
        </ResponsiveTableColumn>
        <ResponsiveTableColumn label="挖矿次数" width="100" align="center">
          <template #default="{ row }">
            {{ row.miningCanUses }}
          </template>
        </ResponsiveTableColumn>
        <ResponsiveTableColumn label="注册时间" min-width="170">
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
import { listGamePlayersApi } from '@/api/admin/gamePlayer.js'
import { formatDate } from '@shared'

const loading = ref(false)
const tableData = ref([])

const searchForm = reactive({ email: '', guildName: '' })
const pagination = reactive({ page: 1, pageSize: 20, total: 0 })

function getGuildIcon(row) {
  if (row.hasCustomGuildIcon) {
    return `/uploads/custom-guild-icon/${row.account}.png`
  }
  return `/uploads/default-guild-icon/${row.account}.png`
}

async function fetchData() {
  loading.value = true
  try {
    const params = { page: pagination.page, pageSize: pagination.pageSize }
    if (searchForm.email) params.email = searchForm.email
    if (searchForm.guildName) params.guildName = searchForm.guildName
    const res = await listGamePlayersApi(params)
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
  searchForm.guildName = ''
  pagination.page = 1
  fetchData()
}

onMounted(fetchData)
</script>

<template>
  <div>
    <!-- 页面标题 -->
    <div class="mb-4">
      <h2 class="text-xl font-semibold dark:text-gray-100">玩家列表</h2>
      <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
        查看所有注册玩家信息，支持封禁和修改密码
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
            <GameGuildIcon
              :account-id="row.account"
              :has-custom-guild-icon="row.hasCustomGuildIcon"
              :custom-guild-icon-updated-at="row.customGuildIconUpdatedAt"
              class="w-9 h-9 rounded object-cover"
            />
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
        <ResponsiveTableColumn
          label="操作"
          width="160"
          align="center"
          fixed="right"
        >
          <template #default="{ row }">
            <el-button
              type="warning"
              size="small"
              text
              :disabled="!!actioningId"
              @click="openBanDialog(row)"
            >
              封禁
            </el-button>
            <el-button
              type="primary"
              size="small"
              text
              :disabled="!!actioningId"
              @click="openPasswordDialog(row)"
            >
              改密
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

    <!-- 封禁弹窗 -->
    <el-dialog
      v-model="banDialogVisible"
      title="封禁玩家"
      width="420px"
      :close-on-click-modal="!actioningId"
    >
      <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">
        将封禁玩家 <strong>{{ currentRow?.accountInfo?.email }}</strong
        >， 封禁期间该玩家无法登录。
      </p>
      <el-form label-width="100px">
        <el-form-item label="封禁到期时间">
          <el-date-picker
            v-model="banForm.banExpires"
            type="datetime"
            placeholder="请选择封禁到期时间"
            :disabled-date="disablePastDate"
            style="width: 100%"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="banDialogVisible = false" :disabled="!!actioningId"
          >取消</el-button
        >
        <el-button
          type="danger"
          :loading="!!actioningId"
          :disabled="!banForm.banExpires"
          @click="handleBan"
        >
          确认封禁
        </el-button>
      </template>
    </el-dialog>

    <!-- 修改密码弹窗 -->
    <el-dialog
      v-model="passwordDialogVisible"
      title="修改玩家密码"
      width="420px"
      :close-on-click-modal="!actioningId"
    >
      <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">
        修改玩家 <strong>{{ currentRow?.accountInfo?.email }}</strong> 的密码，
        修改后该玩家所有设备将被强制下线。
      </p>
      <el-form label-width="100px">
        <el-form-item label="新密码">
          <el-input
            v-model="passwordForm.newPassword"
            type="password"
            placeholder="请输入新密码（至少6位）"
            show-password
            :disabled="!!actioningId"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button
          @click="passwordDialogVisible = false"
          :disabled="!!actioningId"
          >取消</el-button
        >
        <el-button
          type="primary"
          :loading="!!actioningId"
          :disabled="
            !passwordForm.newPassword || passwordForm.newPassword.length < 6
          "
          @click="handleChangePassword"
        >
          确认修改
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  listGamePlayersApi,
  banGamePlayerApi,
  changeGamePlayerPasswordApi
} from '@/api/admin/gamePlayer.js'
import { formatDate } from '@shared'

const loading = ref(false)
const tableData = ref([])
const actioningId = ref(null)

const searchForm = reactive({ email: '', guildName: '' })
const pagination = reactive({ page: 1, pageSize: 20, total: 0 })

// 封禁相关
const banDialogVisible = ref(false)
const currentRow = ref(null)
const banForm = reactive({ banExpires: null })

// 改密相关
const passwordDialogVisible = ref(false)
const passwordForm = reactive({ newPassword: '' })

function disablePastDate(date) {
  return date < new Date()
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

function openBanDialog(row) {
  currentRow.value = row
  banForm.banExpires = null
  banDialogVisible.value = true
}

function openPasswordDialog(row) {
  currentRow.value = row
  passwordForm.newPassword = ''
  passwordDialogVisible.value = true
}

async function handleBan() {
  if (!banForm.banExpires || !currentRow.value) return
  const email = currentRow.value.accountInfo?.email
  if (!email) {
    ElMessage.error('无法获取玩家邮箱')
    return
  }
  try {
    await ElMessageBox.confirm(
      `确认封禁玩家 ${email}，直到 ${new Date(banForm.banExpires).toLocaleString('zh-CN')}？`,
      '确认封禁',
      {
        type: 'warning',
        confirmButtonText: '确认封禁',
        confirmButtonClass: 'el-button--danger'
      }
    )
    actioningId.value = currentRow.value._id
    await banGamePlayerApi({ email, banExpires: banForm.banExpires })
    ElMessage.success('封禁成功')
    banDialogVisible.value = false
    fetchData()
  } catch {
    // 取消或失败
  } finally {
    actioningId.value = null
  }
}

async function handleChangePassword() {
  if (!passwordForm.newPassword || !currentRow.value) return
  const email = currentRow.value.accountInfo?.email
  try {
    await ElMessageBox.confirm(
      `确认修改玩家 ${email} 的密码？修改后该玩家所有设备将被强制下线。`,
      '确认修改密码',
      { type: 'warning' }
    )
    actioningId.value = currentRow.value._id
    await changeGamePlayerPasswordApi(currentRow.value.account, {
      newPassword: passwordForm.newPassword
    })
    ElMessage.success('密码修改成功')
    passwordDialogVisible.value = false
  } catch {
    // 取消或失败
  } finally {
    actioningId.value = null
  }
}

onMounted(fetchData)
</script>

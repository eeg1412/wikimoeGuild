<template>
  <div>
    <!-- 页面标题 -->
    <div class="mb-4">
      <h2 class="text-xl font-semibold dark:text-gray-100">冒险家列表</h2>
      <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
        查看并管理所有冒险家信息，支持改名、重置头像操作
      </p>
    </div>

    <!-- 搜索栏 -->
    <el-card shadow="never" class="mb-4">
      <el-form :model="searchForm" inline class="flex flex-wrap gap-y-2">
        <el-form-item label="冒险家名字">
          <el-input
            v-model="searchForm.name"
            placeholder="冒险家名字"
            clearable
            style="width: 180px"
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
        <ResponsiveTableColumn label="头像" width="70" align="center">
          <template #default="{ row }">
            <div class="relative inline-block">
              <GameAdventurerAvatar
                :adventurer="row"
                class="w-10 h-10 rounded-full object-cover"
              />
              <span
                class="absolute top-1 -right-1 w-3 h-3 rotate-45 border border-white dark:border-gray-700 rounded-sm"
                :style="{ backgroundColor: getElementColor(row.elements) }"
              />
            </div>
          </template>
        </ResponsiveTableColumn>
        <ResponsiveTableColumn label="名字" prop="name" min-width="130" />
        <ResponsiveTableColumn label="元素" width="80" align="center">
          <template #default="{ row }">
            <el-tag
              :color="getElementColor(row.elements)"
              effect="dark"
              size="small"
              round
            >
              {{ getElementName(row.elements) }}
            </el-tag>
          </template>
        </ResponsiveTableColumn>
        <!-- <ResponsiveTableColumn label="被动增益" min-width="200">
          <template #default="{ row }">
            {{ getPassiveBuffName(row.passiveBuffType) }}
          </template>
        </ResponsiveTableColumn> -->
        <ResponsiveTableColumn label="所属公会" min-width="120">
          <template #default="{ row }">
            {{ row.playerInfo?.guildName || '—' }}
          </template>
        </ResponsiveTableColumn>
        <ResponsiveTableColumn label="攻/防/速/SAN" min-width="160">
          <template #default="{ row }">
            {{ row.attackLevel }} / {{ row.defenseLevel }} /
            {{ row.speedLevel }} / {{ row.SANLevel }}
          </template>
        </ResponsiveTableColumn>
        <ResponsiveTableColumn label="创建时间" min-width="170">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </ResponsiveTableColumn>
        <ResponsiveTableColumn label="操作" width="160" align="center">
          <template #default="{ row }">
            <el-button
              type="primary"
              size="small"
              text
              :disabled="!!actioningId"
              @click="openRenameDialog(row)"
            >
              改名
            </el-button>
            <el-button
              v-if="row.hasCustomAvatar"
              type="danger"
              size="small"
              text
              :disabled="!!actioningId"
              @click="handleResetAvatar(row)"
            >
              重置头像
            </el-button>
          </template>
        </ResponsiveTableColumn>
      </ResponsiveTable>

      <!-- 分页 -->
      <div class="flex justify-end mt-4" v-if="pagination.total > 0">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          :page-sizes="[20, 50, 100]"
          layout="total, sizes, prev, pager, next"
          @change="fetchData"
        />
      </div>
    </el-card>

    <!-- 改名弹窗 -->
    <el-dialog
      v-model="renameDialogVisible"
      title="冒险家改名"
      width="420px"
      :close-on-click-modal="!actioningId"
      destroy-on-close
      append-to-body
    >
      <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">
        为冒险家 <strong>{{ currentRow?.name }}</strong> 设置新名字。
      </p>
      <el-form label-width="80px">
        <el-form-item label="新名字">
          <el-input
            v-model="renameForm.name"
            placeholder="2-20 个字符"
            :maxlength="20"
            show-word-limit
            :disabled="!!actioningId"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button
          @click="renameDialogVisible = false"
          :disabled="!!actioningId"
          >取消</el-button
        >
        <el-button
          type="primary"
          :loading="!!actioningId"
          :disabled="!renameForm.name || renameForm.name.length < 2"
          @click="handleRename"
        >
          确认改名
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  listGameAdventurersApi,
  renameGameAdventurerApi,
  resetAdventurerAvatarApi
} from '@/api/admin/gameAdventurer.js'
import { formatDate } from '@shared'

const loading = ref(false)
const tableData = ref([])
const actioningId = ref(null)

const searchForm = reactive({ name: '', guildName: '' })
const pagination = reactive({ page: 1, pageSize: 20, total: 0 })

// 改名相关
const renameDialogVisible = ref(false)
const currentRow = ref(null)
const renameForm = reactive({ name: '' })

const ELEMENT_MAP = {
  1: { name: '地', color: '#a0855b' },
  2: { name: '水', color: '#4fa3e0' },
  3: { name: '火', color: '#e05c4f' },
  4: { name: '风', color: '#6abf69' },
  5: { name: '光明', color: '#f5c842' },
  6: { name: '黑暗', color: '#7c5cbf' }
}

const PASSIVE_BUFF_MAP = {
  1: '左侧地属性攻击力提升5%',
  2: '左侧水属性攻击力提升5%',
  3: '左侧火属性攻击力提升5%',
  4: '左侧风属性攻击力提升5%',
  5: '左侧光明属性攻击力提升5%',
  6: '左侧黑暗属性攻击力提升5%'
}

function getElementColor(el) {
  return ELEMENT_MAP[el]?.color || '#999'
}

function getElementName(el) {
  return ELEMENT_MAP[el]?.name || el
}

function getPassiveBuffName(type) {
  return PASSIVE_BUFF_MAP[type] || type
}

async function fetchData() {
  loading.value = true
  try {
    const params = { page: pagination.page, pageSize: pagination.pageSize }
    if (searchForm.name) params.name = searchForm.name
    if (searchForm.guildName) params.guildName = searchForm.guildName
    const res = await listGameAdventurersApi(params)
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
  searchForm.name = ''
  searchForm.guildName = ''
  pagination.page = 1
  fetchData()
}

function openRenameDialog(row) {
  currentRow.value = row
  renameForm.name = row.name
  renameDialogVisible.value = true
}

async function handleRename() {
  if (!renameForm.name || renameForm.name.length < 2 || !currentRow.value)
    return
  actioningId.value = currentRow.value._id
  try {
    await renameGameAdventurerApi(currentRow.value._id, {
      name: renameForm.name
    })
    ElMessage.success('改名成功')
    renameDialogVisible.value = false
    fetchData()
  } catch {
    // 错误已由拦截器处理
  } finally {
    actioningId.value = null
  }
}

async function handleResetAvatar(row) {
  try {
    await ElMessageBox.confirm(
      `确定要将冒险家「${row.name}」的头像重置为默认吗？该操作无法撤销。`,
      '重置头像确认',
      {
        confirmButtonText: '确定重置',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
  } catch {
    return
  }
  actioningId.value = row._id
  try {
    await resetAdventurerAvatarApi(row._id)
    ElMessage.success('头像已重置为默认')
    fetchData()
  } catch {
    // 错误已由拦截器处理
  } finally {
    actioningId.value = null
  }
}

onMounted(fetchData)
</script>

<template>
  <div class="app-container">
    <h2>机器人管理</h2>
    <p class="text-gray-500 text-sm mb-4">管理自动化机器人</p>

    <el-card shadow="never" class="mb-4">
      <el-form :model="searchForm" inline class="flex flex-wrap gap-y-2">
        <el-form-item label="公会名">
          <el-input
            v-model="searchForm.guildName"
            placeholder="公会名搜索"
            clearable
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-select
            v-model="searchForm.isActive"
            placeholder="全部"
            clearable
            style="width: 120px"
          >
            <el-option label="活跃" value="true" />
            <el-option label="停用" value="false" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="loading" @click="handleSearch">
            搜索
          </el-button>
          <el-button :disabled="loading" @click="handleReset">重置</el-button>
          <el-button
            type="success"
            :disabled="loading"
            @click="openCreateDialog"
          >
            创建机器人
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never">
      <ResponsiveTable
        :data="tableData"
        v-loading="loading"
        stripe
        style="width: 100%"
      >
        <ResponsiveTableColumn label="公会名" min-width="120">
          <template #default="{ row }">
            {{ row.playerInfo?.guildName || '—' }}
          </template>
        </ResponsiveTableColumn>
        <ResponsiveTableColumn label="阵容倾向" min-width="80">
          <template #default="{ row }">
            {{ tendencyMap[row.formationTendency || 'balanced'] || '—' }}
          </template>
        </ResponsiveTableColumn>
        <ResponsiveTableColumn label="状态" min-width="70">
          <template #default="{ row }">
            <el-tag :type="row.isActive ? 'success' : 'info'" size="small">
              {{ row.isActive ? '活跃' : '停用' }}
            </el-tag>
          </template>
        </ResponsiveTableColumn>
        <ResponsiveTableColumn label="冒险家数量" min-width="90">
          <template #default="{ row }">
            {{ formatNumberWithCommas(row.playerInfo?.adventurerCount || 0) }}
          </template>
        </ResponsiveTableColumn>
        <ResponsiveTableColumn label="累计行动" min-width="90">
          <template #default="{ row }">
            {{ formatNumberWithCommas(row.totalActions || 0) }}
          </template>
        </ResponsiveTableColumn>
        <ResponsiveTableColumn label="工作时间" min-width="120">
          <template #default="{ row }">
            {{ formatBotWorkTime(row.activeTimeSettings) }}
          </template>
        </ResponsiveTableColumn>
        <ResponsiveTableColumn label="上次行动" min-width="160">
          <template #default="{ row }">
            {{ row.lastTickAt ? formatDate(row.lastTickAt) : '—' }}
          </template>
        </ResponsiveTableColumn>
        <ResponsiveTableColumn label="备注" prop="note" min-width="120" />
        <ResponsiveTableColumn
          label="操作"
          width="280"
          align="center"
          fixed="right"
        >
          <template #default="{ row }">
            <el-button
              type="primary"
              size="small"
              text
              :disabled="!!actioningId"
              @click="openDetailDialog(row)"
            >
              详情
            </el-button>
            <el-button
              type="info"
              size="small"
              text
              :disabled="!!actioningId"
              @click="openAdventurerListFromTable(row)"
            >
              冒险家
            </el-button>
            <el-button
              type="warning"
              size="small"
              text
              :disabled="!!actioningId"
              @click="openEditDialog(row)"
            >
              编辑
            </el-button>
            <el-button
              type="success"
              size="small"
              text
              :disabled="!!actioningId"
              @click="handleTrigger(row)"
            >
              执行
            </el-button>
          </template>
        </ResponsiveTableColumn>
      </ResponsiveTable>

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

    <BotCreateDialog v-model="createDialogVisible" @created="fetchData" />
    <BotEditDialog
      v-model="editDialogVisible"
      :bot="editingBot"
      @updated="fetchData"
    />
    <BotDetailDialog v-model="detailDialogVisible" :bot-id="detailBotId" />
    <BotAdventurerManagerDialog
      v-model="adventurerDialogVisible"
      :bot-id="adventurerBotId"
    />
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { listBotsApi, triggerBotActionApi } from '@/api/admin/bot.js'
import BotAdventurerManagerDialog from '@/views/admin/game-bot/components/BotAdventurerManagerDialog.vue'
import BotCreateDialog from '@/views/admin/game-bot/components/BotCreateDialog.vue'
import BotDetailDialog from '@/views/admin/game-bot/components/BotDetailDialog.vue'
import BotEditDialog from '@/views/admin/game-bot/components/BotEditDialog.vue'
import { formatDate, formatNumberWithCommas } from '@shared'

const tendencyMap = {
  balanced: '均衡型',
  aggressive: '攻击型',
  defensive: '防御型',
  assassin: '刺客型'
}

const loading = ref(false)
const tableData = ref([])
const actioningId = ref(null)

const searchForm = reactive({ guildName: '', isActive: '' })
const pagination = reactive({ page: 1, pageSize: 20, total: 0 })

const createDialogVisible = ref(false)
const editDialogVisible = ref(false)
const detailDialogVisible = ref(false)
const adventurerDialogVisible = ref(false)

const editingBot = ref(null)
const detailBotId = ref('')
const adventurerBotId = ref('')

async function fetchData() {
  loading.value = true
  try {
    const params = { page: pagination.page, pageSize: pagination.pageSize }
    if (searchForm.guildName) params.guildName = searchForm.guildName
    if (searchForm.isActive) params.isActive = searchForm.isActive
    const res = await listBotsApi(params)
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
  searchForm.guildName = ''
  searchForm.isActive = ''
  pagination.page = 1
  fetchData()
}

function openCreateDialog() {
  createDialogVisible.value = true
}

function openEditDialog(row) {
  editingBot.value = row
  editDialogVisible.value = true
}

function openDetailDialog(row) {
  detailBotId.value = row._id
  detailDialogVisible.value = true
}

function openAdventurerListFromTable(row) {
  adventurerBotId.value = row._id
  adventurerDialogVisible.value = true
}

function formatBotWorkTime(activeTimeSettings) {
  if (!activeTimeSettings || activeTimeSettings.enabled === false) {
    return '24小时'
  }

  const startHour = String(activeTimeSettings.startHour ?? 8).padStart(2, '0')
  const endHour = String(activeTimeSettings.endHour ?? 23).padStart(2, '0')
  return `${startHour}:00 - ${endHour}:00`
}

async function handleTrigger(row) {
  try {
    await ElMessageBox.confirm(
      `确认手动触发机器人「${row.playerInfo?.guildName || '未命名'}」执行一次行动？`,
      '手动执行',
      { type: 'info', confirmButtonText: '执行' }
    )
    actioningId.value = row._id
    await triggerBotActionApi(row._id)
    ElMessage.success({
      message: '行动已触发，请稍后在详情中查看日志',
      showClose: true
    })
  } catch {
    // 用户取消或API失败
  } finally {
    actioningId.value = null
  }
}

onMounted(fetchData)
</script>

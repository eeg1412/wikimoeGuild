<template>
  <div>
    <!-- 页面标题 -->
    <div class="mb-4">
      <h2 class="text-xl font-semibold dark:text-gray-100">发送邮件</h2>
      <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
        向玩家发送系统邮件，可附带金币和物品
      </p>
    </div>

    <el-card shadow="never">
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="120px"
        class="max-w-[600px]"
      >
        <el-form-item label="邮件标题" prop="title">
          <el-input
            v-model="form.title"
            placeholder="请输入邮件标题"
            maxlength="100"
            show-word-limit
          />
        </el-form-item>

        <el-form-item label="邮件内容" prop="content">
          <el-input
            v-model="form.content"
            type="textarea"
            :rows="4"
            placeholder="请输入邮件内容"
            maxlength="1000"
            show-word-limit
          />
        </el-form-item>

        <el-form-item label="发送对象" prop="sendTo">
          <el-radio-group v-model="form.sendTo">
            <el-radio value="all">全部玩家</el-radio>
            <el-radio value="specific">指定玩家</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item
          v-if="form.sendTo === 'specific'"
          label="选择玩家"
          prop="playerIds"
        >
          <div class="w-full">
            <div class="flex gap-2 mb-2 flex-wrap">
              <el-input
                v-model="playerSearchEmail"
                placeholder="搜索邮箱"
                clearable
                style="width: 180px"
                @keyup.enter="searchPlayers"
              />
              <el-input
                v-model="playerSearchGuildName"
                placeholder="搜索公会名"
                clearable
                style="width: 180px"
                @keyup.enter="searchPlayers"
              />
              <el-button
                type="primary"
                :loading="searchLoading"
                :disabled="searchLoading"
                @click="searchPlayers"
              >
                搜索
              </el-button>
            </div>
            <el-table
              v-if="searchedPlayers.length > 0"
              :data="searchedPlayers"
              size="small"
              max-height="200"
              class="mb-2"
            >
              <el-table-column label="邮箱" width="180">
                <template #default="{ row }">
                  {{ row.accountInfo?.email || '-' }}
                </template>
              </el-table-column>
              <el-table-column prop="guildName" label="公会名" width="120" />
              <el-table-column label="操作" width="80">
                <template #default="{ row }">
                  <el-button
                    v-if="!form.playerIds.includes(row.account)"
                    type="primary"
                    size="small"
                    link
                    @click="addPlayer(row)"
                  >
                    添加
                  </el-button>
                  <span v-else class="text-gray-400 text-xs">已添加</span>
                </template>
              </el-table-column>
            </el-table>
            <div v-if="form.playerIds.length > 0" class="mt-2">
              <el-tag
                v-for="p in selectedPlayers"
                :key="p.id"
                closable
                class="mr-1 mb-1"
                @close="removePlayer(p.id)"
              >
                {{ p.label }}
              </el-tag>
            </div>
            <div v-else class="text-sm text-gray-400">暂未选择玩家</div>
          </div>
        </el-form-item>

        <el-divider content-position="left">附件（可选）</el-divider>

        <el-form-item label="金币">
          <el-input-number
            v-model="form.attachGold"
            :min="0"
            :max="99999999"
            :step="100"
            controls-position="right"
          />
        </el-form-item>

        <el-form-item label="攻击水晶">
          <el-input-number
            v-model="form.attachItems.attackCrystal"
            :min="0"
            :max="99999"
            controls-position="right"
          />
        </el-form-item>

        <el-form-item label="防御水晶">
          <el-input-number
            v-model="form.attachItems.defenseCrystal"
            :min="0"
            :max="99999"
            controls-position="right"
          />
        </el-form-item>

        <el-form-item label="速度水晶">
          <el-input-number
            v-model="form.attachItems.speedCrystal"
            :min="0"
            :max="99999"
            controls-position="right"
          />
        </el-form-item>

        <el-form-item label="SAN水晶">
          <el-input-number
            v-model="form.attachItems.sanCrystal"
            :min="0"
            :max="99999"
            controls-position="right"
          />
        </el-form-item>

        <el-form-item label="符文石碎片">
          <el-input-number
            v-model="form.attachItems.runeFragment"
            :min="0"
            :max="99999"
            controls-position="right"
          />
        </el-form-item>

        <el-form-item>
          <el-button
            type="primary"
            :loading="submitLoading"
            :disabled="submitLoading"
            @click="handleSubmit"
          >
            发送邮件
          </el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { sendAdminMailApi } from '@/api/admin/gameMail.js'
import { listGamePlayersApi } from '@/api/admin/gamePlayer.js'

const formRef = ref(null)
const submitLoading = ref(false)
const searchLoading = ref(false)
const playerSearchEmail = ref('')
const playerSearchGuildName = ref('')
const searchedPlayers = ref([])
const selectedPlayers = ref([])

const defaultForm = () => ({
  title: '',
  content: '',
  sendTo: 'all',
  playerIds: [],
  attachGold: 0,
  attachItems: {
    attackCrystal: 0,
    defenseCrystal: 0,
    speedCrystal: 0,
    sanCrystal: 0,
    runeFragment: 0
  }
})

const form = reactive(defaultForm())

const rules = {
  title: [{ required: true, message: '请输入邮件标题', trigger: 'blur' }],
  sendTo: [{ required: true, message: '请选择发送对象', trigger: 'change' }]
}

async function searchPlayers() {
  const email = playerSearchEmail.value.trim()
  const guildName = playerSearchGuildName.value.trim()
  if (!email && !guildName) return
  searchLoading.value = true
  try {
    const params = { page: 1, pageSize: 10 }
    if (email) params.email = email
    if (guildName) params.guildName = guildName
    const res = await listGamePlayersApi(params)
    searchedPlayers.value = res.data.data?.list || []
  } catch {
    searchedPlayers.value = []
  } finally {
    searchLoading.value = false
  }
}

function addPlayer(player) {
  const accountId = player.account
  if (!form.playerIds.includes(accountId)) {
    form.playerIds.push(accountId)
    const label = player.guildName || player.accountInfo?.email || accountId
    selectedPlayers.value.push({ id: accountId, label })
  }
}

function removePlayer(id) {
  form.playerIds = form.playerIds.filter(pid => pid !== id)
  selectedPlayers.value = selectedPlayers.value.filter(p => p.id !== id)
}

async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  if (form.sendTo === 'specific' && form.playerIds.length === 0) {
    ElMessage.warning('请至少选择一名玩家')
    return
  }

  const targetMsg =
    form.sendTo === 'all' ? '全部玩家' : `${form.playerIds.length} 名玩家`

  try {
    await ElMessageBox.confirm(
      `确定要向 ${targetMsg} 发送邮件"${form.title}"吗？`,
      '确认发送',
      {
        confirmButtonText: '确定发送',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
  } catch {
    return
  }

  submitLoading.value = true
  try {
    const res = await sendAdminMailApi({
      title: form.title,
      content: form.content,
      sendTo: form.sendTo,
      playerIds: form.sendTo === 'specific' ? form.playerIds : [],
      attachGold: form.attachGold,
      attachItems: form.attachItems
    })
    ElMessage.success(res.data?.message || '发送成功')
    handleReset()
  } catch (e) {
    ElMessage.error(e.response?.data?.message || '发送失败')
  } finally {
    submitLoading.value = false
  }
}

function handleReset() {
  Object.assign(form, defaultForm())
  selectedPlayers.value = []
  searchedPlayers.value = []
  playerSearchEmail.value = ''
  playerSearchGuildName.value = ''
  formRef.value?.clearValidate()
}
</script>

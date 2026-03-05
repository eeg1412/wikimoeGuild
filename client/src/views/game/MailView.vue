<template>
  <div class="w-full py-6" style="min-height: 60vh">
    <!-- 页面标题 -->
    <div class="mb-6 text-center">
      <h1 class="rpg-title text-2xl font-bold text-gray-800 dark:text-gray-100">
        📬 邮箱
      </h1>
      <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
        查收邮件和领取附件奖励
      </p>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="flex justify-center py-12">
      <span class="animate-spin inline-block text-4xl">⏳</span>
    </div>

    <template v-else>
      <!-- 未读提示 -->
      <div v-if="unreadCount > 0" class="text-center mb-4">
        <span class="text-sm text-yellow-500"
          >📩 你有 {{ unreadCount }} 封未读邮件</span
        >
      </div>

      <!-- 邮件列表 -->
      <div
        v-if="mails.length === 0"
        class="text-center py-16 text-gray-400 dark:text-gray-600"
      >
        <p>暂无邮件</p>
      </div>

      <div v-else class="space-y-3">
        <div
          v-for="mail in mails"
          :key="mail._id"
          class="rpg-card rounded-xl p-4 cursor-pointer"
          :class="{ 'opacity-60': mail.read }"
          @click="openDetail(mail)"
        >
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3 min-w-0">
              <div
                class="w-10 h-10 rounded-lg flex items-center justify-center text-lg"
                :class="
                  mail.read
                    ? 'bg-gray-200 dark:bg-gray-700'
                    : 'bg-yellow-100 dark:bg-yellow-900/30'
                "
              >
                {{ typeIcon(mail.type) }}
              </div>
              <div class="min-w-0">
                <p
                  class="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate"
                >
                  {{ mail.title }}
                </p>
                <p class="text-sm text-gray-400 mt-0.5">
                  {{ formatTime(mail.createdAt) }}
                  <span
                    v-if="mail.hasAttachment && !mail.claimed"
                    class="text-yellow-500 ml-1"
                    >📦 有附件</span
                  >
                  <span
                    v-if="mail.hasAttachment && mail.claimed"
                    class="text-green-500 ml-1"
                    >✅ 已领取</span
                  >
                </p>
              </div>
            </div>
            <div class="flex items-center gap-1">
              <span
                v-if="!mail.read"
                class="w-2 h-2 rounded-full bg-red-500 inline-block"
              ></span>
              <span class="text-gray-400">▶</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 分页 -->
      <div v-if="total > pageSize" class="flex justify-center mt-6">
        <el-pagination
          v-model:current-page="page"
          :page-size="pageSize"
          :total="total"
          layout="prev, pager, next"
          small
          @current-change="fetchMails"
        />
      </div>
    </template>

    <!-- 邮件详情弹窗 -->
    <el-dialog
      v-model="detailVisible"
      :title="detailMail?.title || '邮件详情'"
      align-center
      destroy-on-close
    >
      <div v-if="detailLoading" class="flex justify-center py-8">
        <span class="animate-spin inline-block text-2xl">⏳</span>
      </div>
      <div v-else-if="detailMail" class="space-y-4">
        <!-- 邮件信息 -->
        <div class="text-sm text-gray-400 flex items-center gap-2">
          <span>{{ typeLabel(detailMail.type) }}</span>
          <span>·</span>
          <span>{{ formatTime(detailMail.createdAt) }}</span>
        </div>

        <!-- 邮件内容 -->
        <div
          class="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 rounded-lg p-3 whitespace-pre-wrap"
        >
          {{ detailMail.content }}
        </div>

        <!-- 附件区域 -->
        <div
          v-if="detailMail.hasAttachment"
          class="border border-yellow-200 dark:border-yellow-700/40 rounded-lg p-3"
        >
          <h4 class="text-sm font-semibold text-yellow-500 mb-2">📦 附件</h4>
          <div class="space-y-1 text-sm">
            <div
              v-if="detailMail.attachGold > 0"
              class="flex items-center gap-2"
            >
              <span>🪙</span>
              <span class="text-gray-700 dark:text-gray-300">金币</span>
              <span class="ml-auto font-mono text-yellow-500"
                >+{{ detailMail.attachGold.toLocaleString() }}</span
              >
            </div>
            <template v-for="cry in crystalList" :key="cry.key">
              <div
                v-if="detailMail.attachItems?.[cry.key] > 0"
                class="flex items-center gap-2"
              >
                <span>{{ cry.icon }}</span>
                <span class="text-gray-700 dark:text-gray-300"
                  >{{ cry.name }}水晶</span
                >
                <span class="ml-auto font-mono" :style="{ color: cry.color }"
                  >+{{ detailMail.attachItems[cry.key] }}</span
                >
              </div>
            </template>
            <div
              v-if="detailMail.attachItems?.runeFragment > 0"
              class="flex items-center gap-2"
            >
              <span>🔮</span>
              <span class="text-gray-700 dark:text-gray-300">符文石碎片</span>
              <span class="ml-auto font-mono text-purple-400"
                >+{{ detailMail.attachItems.runeFragment }}</span
              >
            </div>
            <div
              v-if="detailMail.attachRuneStones?.length > 0"
              class="flex items-center gap-2"
            >
              <span>💎</span>
              <span class="text-gray-700 dark:text-gray-300">符文石</span>
              <span class="ml-auto font-mono text-blue-400"
                >x{{ detailMail.attachRuneStones.length }}</span
              >
            </div>
          </div>

          <!-- 领取按钮 -->
          <div v-if="!detailMail.claimed" class="mt-3">
            <el-button
              type="warning"
              class="w-full"
              :loading="claimLoading"
              :disabled="claimLoading"
              @click="handleClaim"
            >
              领取附件
            </el-button>
          </div>
          <div v-else class="mt-2 text-center text-sm text-green-500">
            ✅ 附件已领取
          </div>
        </div>

        <!-- 删除按钮 -->
        <div class="pt-2">
          <el-button
            type="danger"
            text
            class="w-full"
            :loading="deleteLoading"
            :disabled="deleteLoading"
            @click="handleDelete"
          >
            🗑️ 删除邮件
          </el-button>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  getMailListApi,
  getMailDetailApi,
  claimMailAttachmentApi,
  deleteMailApi,
  getUnreadCountApi
} from '@/api/game/mail.js'
import { useGameUser } from '@/composables/useGameUser.js'
import { useDialogRoute } from '@/composables/useDialogRoute.js'

const router = useRouter()
const { isLoggedIn, fetchPlayerInfo } = useGameUser()
if (!isLoggedIn.value) {
  router.replace({ name: 'GameLogin' })
}

const crystalList = [
  { key: 'attackCrystal', name: '攻击', icon: '⚔️', color: '#e05c4f' },
  { key: 'defenseCrystal', name: '防御', icon: '🛡️', color: '#4fa3e0' },
  { key: 'speedCrystal', name: '速度', icon: '💨', color: '#6abf69' },
  { key: 'sanCrystal', name: 'SAN值', icon: '❤️', color: '#c070e0' }
]

const loading = ref(false)
const mails = ref([])
const page = ref(1)
const pageSize = 20
const total = ref(0)
const unreadCount = ref(0)

async function fetchMails() {
  loading.value = true
  try {
    const res = await getMailListApi({ page: page.value, pageSize })
    mails.value = res.data.data?.list || []
    total.value = res.data.data?.total || 0
    unreadCount.value = res.data.data?.unreadCount || 0
  } catch {
    mails.value = []
  } finally {
    loading.value = false
  }
}

async function fetchUnread() {
  try {
    const res = await getUnreadCountApi()
    unreadCount.value = res.data.data?.unreadCount || 0
  } catch {}
}

// 详情弹窗
const { visible: detailVisible } = useDialogRoute('detail')
const detailMail = ref(null)
const detailLoading = ref(false)
const detailOpening = ref(false)

async function openDetail(mail) {
  if (detailOpening.value) return
  detailOpening.value = true
  detailMail.value = { ...mail }
  detailLoading.value = true
  try {
    const res = await getMailDetailApi(mail._id)
    detailMail.value = res.data.data
    // 标记已读后刷新未读计数
    if (!mail.read) {
      const idx = mails.value.findIndex(m => m._id === mail._id)
      if (idx >= 0) mails.value[idx].read = true
      unreadCount.value = Math.max(0, unreadCount.value - 1)
    }
  } catch {
  } finally {
    detailLoading.value = false
  }
  detailVisible.value = true
  detailOpening.value = false
}

// 领取附件
const claimLoading = ref(false)
async function handleClaim() {
  if (!detailMail.value) return
  claimLoading.value = true
  try {
    await claimMailAttachmentApi(detailMail.value._id)
    ElMessage.success('附件领取成功！')
    detailMail.value.claimed = true
    // 刷新玩家信息（金币等）
    await fetchPlayerInfo()
  } catch {
    // 错误已由拦截器处理
  } finally {
    claimLoading.value = false
  }
}

// 删除邮件
const deleteLoading = ref(false)
async function handleDelete() {
  if (!detailMail.value) return
  try {
    await ElMessageBox.confirm(
      detailMail.value.hasAttachment && !detailMail.value.claimed
        ? '该邮件有未领取的附件，删除后无法找回，确定删除？'
        : '确定删除此邮件？',
      '确认删除',
      { confirmButtonText: '删除', cancelButtonText: '取消', type: 'warning' }
    )
  } catch {
    return
  }

  deleteLoading.value = true
  try {
    await deleteMailApi(detailMail.value._id)
    ElMessage.success('邮件已删除')
    detailVisible.value = false
    await fetchMails()
    await fetchUnread()
  } catch {
    // 错误已由拦截器处理
  } finally {
    deleteLoading.value = false
  }
}

// 工具函数
function typeIcon(type) {
  return { system: '📢', reward: '🎁', arena: '⚔️', market: '🏪' }[type] || '📧'
}
function typeLabel(type) {
  return (
    {
      system: '系统邮件',
      reward: '奖励邮件',
      arena: '竞技场',
      market: '交易市场'
    }[type] || '邮件'
  )
}
function formatTime(t) {
  if (!t) return ''
  const d = new Date(t)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

onMounted(() => {
  fetchMails()
})
</script>

<style scoped>
.rpg-title {
  font-family: 'serif';
  text-shadow: 0 0 10px rgba(255, 200, 50, 0.4);
  animation: titleGlow 3s ease-in-out infinite;
}
@keyframes titleGlow {
  0%,
  100% {
    text-shadow: 0 0 8px rgba(255, 200, 50, 0.3);
  }
  50% {
    text-shadow: 0 0 18px rgba(255, 200, 50, 0.7);
  }
}
.rpg-card {
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.9) 0%,
    rgba(240, 230, 200, 0.6) 100%
  );
  border: 1px solid rgba(200, 160, 80, 0.3);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
}
.dark .rpg-card {
  background: linear-gradient(
    135deg,
    rgba(40, 35, 30, 0.9) 0%,
    rgba(30, 24, 18, 0.8) 100%
  );
  border-color: rgba(200, 160, 80, 0.25);
}
.rpg-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}
</style>

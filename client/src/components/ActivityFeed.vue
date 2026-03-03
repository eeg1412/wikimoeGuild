<template>
  <div class="activity-feed">
    <div
      v-if="loading && activities.length === 0"
      class="flex justify-center py-8"
    >
      <span class="animate-spin inline-block text-2xl">⏳</span>
    </div>

    <div
      v-else-if="activities.length === 0"
      class="text-center py-8 text-gray-400 text-sm"
    >
      暂无玩家动态
    </div>

    <div v-else class="space-y-2">
      <div
        v-for="item in activities"
        :key="item._id"
        class="activity-card rounded-xl p-3"
      >
        <div class="flex items-start gap-2">
          <!-- 公会头像 -->
          <GameGuildIcon
            v-if="item.account"
            :account-id="item.account"
            :has-custom-guild-icon="item.hasCustomGuildIcon"
            :custom-guild-icon-updated-at="item.customGuildIconUpdatedAt"
            class="w-12 h-12 rounded-full shrink-0 mt-0.5 border border-gray-200 dark:border-gray-600 object-cover cursor-pointer"
            @click="handleGuildIconClick(item)"
          />
          <!-- 类型图标（无账号时回退） -->
          <span v-else class="text-lg shrink-0 mt-0.5">{{
            typeIcon(item.type)
          }}</span>
          <div class="min-w-0 flex-1">
            <p
              class="text-sm font-semibold text-gray-700 dark:text-gray-200 break-all"
            >
              {{ item.title }}
            </p>
            <p
              v-if="item.content"
              class="text-sm text-gray-500 dark:text-gray-400 mt-0.5"
            >
              {{ item.content }}
            </p>
            <p class="text-xs text-gray-400 mt-1">
              {{ formatTime(item.createdAt) }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- 分页 -->
    <div v-if="total > pageSize" class="flex justify-center mt-4">
      <el-pagination
        v-model:current-page="page"
        :page-size="pageSize"
        :total="total"
        layout="prev, pager, next"
        small
        @current-change="handlePageChange"
      />
    </div>

    <!-- 公会信息弹窗 -->
    <GuildInfoDialog
      v-model="guildInfoDialogVisible"
      :player-info-id="guildInfoPlayerInfoId"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getActivitiesApi } from '@/api/game/activity.js'

const activities = ref([])
const loading = ref(false)
const page = ref(1)
const pageSize = 20
const total = ref(0)

// ── 公会信息弹窗 ──
const guildInfoDialogVisible = ref(false)
const guildInfoPlayerInfoId = ref('')

function handleGuildIconClick(item) {
  if (!item.playerInfoId) return
  guildInfoPlayerInfoId.value = item.playerInfoId
  guildInfoDialogVisible.value = true
}

function typeIcon(type) {
  const icons = {
    guild_created: '🏰',
    rune_stone_found: '💎',
    arena_top3: '🏆',
    mine_discovered: '⛏️',
    market_listing: '🏪'
  }
  return icons[type] || '📌'
}

function formatTime(t) {
  if (!t) return ''
  const d = new Date(t)
  const now = new Date()
  const diff = now - d
  // 1分钟内
  if (diff < 60 * 1000) return '刚刚'
  // 1小时内
  if (diff < 60 * 60 * 1000) return `${Math.floor(diff / (60 * 1000))}分钟前`
  // 24小时内
  if (diff < 24 * 60 * 60 * 1000)
    return `${Math.floor(diff / (60 * 60 * 1000))}小时前`
  // 超过24小时显示完整日期
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

async function fetchActivities() {
  loading.value = true
  try {
    const res = await getActivitiesApi({ page: page.value, pageSize })
    activities.value = res.data.data?.list || []
    total.value = res.data.data?.total || 0
  } catch {
    activities.value = []
  } finally {
    loading.value = false
  }
}

function handlePageChange() {
  fetchActivities()
}

onMounted(() => {
  fetchActivities()
})

defineExpose({
  refresh: fetchActivities
})
</script>

<style scoped>
.activity-card {
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.9) 0%,
    rgba(240, 230, 200, 0.6) 100%
  );
  border: 1px solid rgba(200, 160, 80, 0.3);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
}
.dark .activity-card {
  background: linear-gradient(
    135deg,
    rgba(40, 35, 30, 0.9) 0%,
    rgba(30, 24, 18, 0.8) 100%
  );
  border-color: rgba(200, 160, 80, 0.25);
}
.activity-card:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}
</style>

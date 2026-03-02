<template>
  <div class="w-full py-6" style="min-height: 60vh">
    <!-- 页面标题 -->
    <div class="mb-6 text-center">
      <h1 class="rpg-title text-2xl font-bold text-gray-800 dark:text-gray-100">
        ⚔️ 冒险家公会
      </h1>
      <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
        您的公会共有
        <span class="text-yellow-500 font-semibold">{{
          adventurers.length
        }}</span>
        / 50 名冒险家
      </p>
    </div>

    <!-- 招募按钮 -->
    <div class="text-center mb-4">
      <el-button
        type="warning"
        round
        :loading="recruiting"
        :disabled="recruiting || adventurers.length >= 50"
        @click="handleRecruit"
      >
        🪙 招募冒险家（{{ gameSettings.adventurerRecruitPrice ?? 10000 }} 金币）
      </el-button>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="flex justify-center py-12">
      <span class="animate-spin inline-block text-4xl">⏳</span>
    </div>

    <!-- 冒险家网格 -->
    <div
      v-else-if="adventurers.length > 0"
      class="grid grid-cols-3 sm:grid-cols-4 gap-4"
    >
      <div
        v-for="adv in adventurers"
        :key="adv._id"
        class="rpg-card relative flex flex-col items-center p-3 rounded-xl cursor-pointer group"
        @click="openDetail(adv)"
      >
        <!-- 元素菱形徽章 -->
        <div
          class="absolute top-2 right-2 w-4 h-4 rotate-45 border-2 border-white dark:border-gray-700 shadow-sm z-10"
          :style="{ backgroundColor: getElementColor(adv.elements) }"
        />

        <!-- 角色标记（点击可切换） -->
        <el-popover
          :width="190"
          trigger="click"
          placement="bottom-start"
          @click.stop
        >
          <template #reference>
            <span
              class="absolute top-1 left-1 z-10 bg-black/65 text-white rounded px-1.5 py-1 leading-none text-xs flex items-center gap-0.5 cursor-pointer hover:bg-black/80 transition-colors select-none"
              @click.stop
            >
              <template v-if="adv.roleTag && ROLE_TAG_MAP[adv.roleTag]">
                {{ ROLE_TAG_MAP[adv.roleTag].emoji }}
                {{ ROLE_TAG_MAP[adv.roleTag].label }}
              </template>
              <template v-else>🏷️ 未设定</template>
            </span>
          </template>
          <div>
            <!-- 标题 -->
            <p
              class="text-sm font-medium mb-2 text-gray-700 dark:text-gray-200"
            >
              设置角色标记
            </p>
            <!-- 选择 -->
            <div class="flex flex-wrap gap-1 p-1 justify-center">
              <span
                v-for="tag in ROLE_TAGS"
                :key="tag.value"
                class="cursor-pointer text-base px-1.5 py-0.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                :class="[
                  adv.roleTag === tag.value
                    ? 'bg-yellow-200 dark:bg-yellow-700'
                    : '',
                  roleTagLoadingId === adv._id
                    ? 'opacity-50 pointer-events-none'
                    : ''
                ]"
                :title="tag.label"
                @click="handleSetRoleTag(adv, tag.value)"
              >
                {{ tag.emoji }}
              </span>
            </div>
          </div>
        </el-popover>

        <!-- 头像 -->
        <div class="relative w-16 h-16 sm:w-20 sm:h-20 mb-2">
          <GameAdventurerAvatar
            :adventurer="adv"
            :alt="adv.name"
            class="w-full h-full rounded-full object-cover border-2 border-gray-200 dark:border-gray-600 group-hover:border-yellow-400 transition-colors"
          />
          <div
            class="avatar-glow absolute inset-0 rounded-full"
            :style="{ '--glow-color': getElementColor(adv.elements) }"
          />
        </div>

        <!-- 名字 -->
        <p
          class="text-sm font-medium text-gray-700 dark:text-gray-200 text-center truncate w-full"
        >
          {{ adv.name }}
        </p>

        <!-- 元素标签 -->
        <span
          class="mt-1 text-sm px-1.5 py-0.5 rounded-full text-white font-medium"
          :style="{ backgroundColor: getElementColor(adv.elements) }"
        >
          {{ getElementName(adv.elements) }}
        </span>

        <!-- 综合等级 -->
        <p class="text-sm text-yellow-500 mt-1 font-mono">
          Lv.{{ adv.comprehensiveLevel || 1 }}
        </p>

        <!-- 装备状态标签 -->
        <div
          v-if="adv.runeStone"
          class="mt-1 text-xs px-1.5 py-0.5 rounded-full border cursor-pointer hover:opacity-80 text-center w-full"
          :class="runeStoneCardClass(adv.runeStone.rarity)"
          @click.stop="handleShowRuneStonePreview(adv)"
        >
          💎 {{ rarityName(adv.runeStone.rarity) }} Lv.{{ adv.runeStone.level }}
        </div>
      </div>

      <!-- 快捷入口 -->
      <div class="col-span-full text-center mt-4 mb-2">
        <el-button type="primary" text size="small" @click="goToFormation">
          🏗️ 前往阵容配置
        </el-button>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-else class="text-center py-16 text-gray-400 dark:text-gray-600">
      <span class="text-5xl mb-3 block">🧑‍⚔️</span>
      <p>暂无冒险家，快去招募吧！</p>
    </div>

    <!-- ==================== 冒险家详情弹窗（统一组件） ==================== -->
    <AdventurerDetailDialog
      v-model="detailVisible"
      :adventurer-id="detailAdvId"
      show-manage
      @updated="handleAdvUpdated"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  getMyAdventurersApi,
  recruitAdventurerApi,
  setRoleTagApi
} from '@/api/game/adventurer.js'
import { getGameSettingsApi } from '@/api/game/config.js'
import { useGameUser } from '@/composables/useGameUser.js'
import { useDialogRoute } from '@/composables/useDialogRoute.js'
import { ROLE_TAG_MAP } from 'shared/constants/index.js'

const ROLE_TAGS = Object.entries(ROLE_TAG_MAP).map(
  ([value, { emoji, label }]) => ({
    value,
    emoji,
    label
  })
)
import AdventurerDetailDialog from '@/components/AdventurerDetailDialog.vue'

const router = useRouter()
const { isLoggedIn, fetchPlayerInfo } = useGameUser()

if (!isLoggedIn.value) {
  router.replace({ name: 'GameLogin' })
}

function goToFormation() {
  router.push({ name: 'GameFormations' })
}

// ── 数据 ──
const loading = ref(false)
const adventurers = ref([])
const gameSettings = ref({})

// ── 元素映射 ──
const ELEMENT_MAP = {
  1: { name: '地', color: '#a0855b' },
  2: { name: '水', color: '#4fa3e0' },
  3: { name: '火', color: '#e05c4f' },
  4: { name: '风', color: '#6abf69' },
  5: { name: '光明', color: '#f5c842' },
  6: { name: '黑暗', color: '#7c5cbf' }
}

function getElementColor(el) {
  return ELEMENT_MAP[el]?.color || '#999'
}
function getElementName(el) {
  return ELEMENT_MAP[el]?.name || el
}

function rarityName(r) {
  return { normal: '普通', rare: '稀有', legendary: '传说' }[r] || r
}

function runeStoneCardClass(r) {
  return (
    {
      normal: 'text-gray-400 border-gray-400',
      rare: 'text-blue-400 border-blue-400',
      legendary: 'text-yellow-400 border-yellow-400'
    }[r] || 'text-gray-400 border-gray-400'
  )
}

function handleShowRuneStonePreview(adv) {
  if (!adv.runeStone) return
  openDetail(adv)
}

// ── 冒险家列表 ──
async function fetchAdventurers() {
  loading.value = true
  try {
    const res = await getMyAdventurersApi()
    adventurers.value = res.data.data || []
  } catch {
    adventurers.value = []
  } finally {
    loading.value = false
  }
}

// ── 游戏配置 ──
async function fetchGameSettings() {
  try {
    const res = await getGameSettingsApi()
    gameSettings.value = res.data.data || {}
  } catch {
    // ignore
  }
}

// ── 招募 ──
const recruiting = ref(false)
async function handleRecruit() {
  recruiting.value = true
  try {
    await recruitAdventurerApi()
    ElMessage.success('招募成功！')
    await fetchAdventurers()
    await fetchPlayerInfo()
  } catch {
    // 错误已由拦截器处理
  } finally {
    recruiting.value = false
  }
}

// ── 角色标记 ──
const roleTagLoadingId = ref('')

async function handleSetRoleTag(adv, tagValue) {
  if (roleTagLoadingId.value) return
  const newTag = adv.roleTag === tagValue ? '' : tagValue
  roleTagLoadingId.value = adv._id
  try {
    const res = await setRoleTagApi(adv._id, { roleTag: newTag })
    const updated = res.data.data
    const idx = adventurers.value.findIndex(a => a._id === adv._id)
    if (idx >= 0)
      adventurers.value[idx] = { ...adventurers.value[idx], ...updated }
  } catch {
    // 错误已由拦截器处理
  } finally {
    roleTagLoadingId.value = ''
  }
}

// ── 详情弹窗 ──
const { visible: detailVisible } = useDialogRoute('detail')
const detailAdvId = ref('')

function openDetail(adv) {
  detailAdvId.value = adv._id
  detailVisible.value = true
}

function handleAdvUpdated(updatedAdv) {
  const idx = adventurers.value.findIndex(a => a._id === updatedAdv._id)
  if (idx >= 0) adventurers.value[idx] = { ...updatedAdv }
}

// ── 初始化 ──
onMounted(() => {
  fetchAdventurers()
  fetchGameSettings()
  fetchPlayerInfo()
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
  transform: translateY(-3px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
}
.rpg-card:active {
  transform: translateY(-1px);
}

.avatar-glow {
  pointer-events: none;
  opacity: 0;
  box-shadow: 0 0 12px 4px var(--glow-color, transparent);
  transition: opacity 0.3s ease;
}
.rpg-card:hover .avatar-glow {
  opacity: 0.5;
  animation: glowPulse 1.5s ease-in-out infinite;
}
@keyframes glowPulse {
  0%,
  100% {
    opacity: 0.3;
  }
  50% {
    opacity: 0.7;
  }
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.info-label {
  color: #888;
  font-size: 0.8rem;
}
.dark .info-label {
  color: #aaa;
}
.info-value {
  font-weight: 500;
  color: #333;
}
.dark .info-value {
  color: #e0e0e0;
}
.rpg-number {
  font-family: 'monospace';
  color: #e6a817 !important;
  font-weight: 700;
}
</style>

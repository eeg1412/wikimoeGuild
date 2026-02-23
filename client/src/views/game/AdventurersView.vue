<template>
  <div class="w-full py-6">
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
        名冒险家
      </p>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="flex justify-center py-12">
      <el-icon class="animate-spin text-4xl text-yellow-400"
        ><Loading
      /></el-icon>
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
        @click="openInfo(adv)"
      >
        <!-- 元素菱形徽章 -->
        <div
          class="absolute top-2 right-2 w-4 h-4 rotate-45 border-2 border-white dark:border-gray-700 shadow-sm z-10"
          :style="{ backgroundColor: getElementColor(adv.elements) }"
        />

        <!-- 头像 -->
        <div class="relative w-16 h-16 sm:w-20 sm:h-20 mb-2">
          <img
            :src="`/publicgame/avatar/${adv.defaultAvatarId}.webp`"
            :alt="adv.name"
            class="w-full h-full rounded-full object-cover border-2 border-gray-200 dark:border-gray-600 group-hover:border-yellow-400 transition-colors"
            @error="onAvatarError"
          />
          <!-- 闪光动画 -->
          <div
            class="avatar-glow absolute inset-0 rounded-full"
            :style="{ '--glow-color': getElementColor(adv.elements) }"
          />
        </div>

        <!-- 名字 -->
        <p
          class="text-xs font-medium text-gray-700 dark:text-gray-200 text-center truncate w-full"
        >
          {{ adv.name }}
        </p>

        <!-- 元素标签 -->
        <span
          class="mt-1 text-xs px-1.5 py-0.5 rounded-full text-white font-medium"
          :style="{ backgroundColor: getElementColor(adv.elements) }"
        >
          {{ getElementName(adv.elements) }}
        </span>

        <!-- 信息按钮提示 -->
        <p class="text-xs text-gray-400 mt-1">点击查看详情</p>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-else class="text-center py-16 text-gray-400 dark:text-gray-600">
      <el-icon :size="48" class="mb-3"><User /></el-icon>
      <p>暂无冒险家</p>
    </div>

    <!-- 冒险家详情 Popover（全局单个，通过弹窗实现） -->
    <el-dialog
      v-model="infoVisible"
      :title="currentAdv?.name"
      width="320px"
      align-center
      class="rpg-dialog"
    >
      <div v-if="currentAdv" class="flex flex-col items-center gap-4">
        <!-- 头像 -->
        <div class="relative">
          <img
            :src="`/publicgame/avatar/${currentAdv.defaultAvatarId}.webp`"
            :alt="currentAdv.name"
            class="w-24 h-24 rounded-full object-cover border-4"
            :style="{ borderColor: getElementColor(currentAdv.elements) }"
            @error="onAvatarError"
          />
          <div
            class="absolute -top-1 -right-1 w-6 h-6 rotate-45 border-2 border-white dark:border-gray-700 shadow"
            :style="{ backgroundColor: getElementColor(currentAdv.elements) }"
          />
        </div>

        <!-- 元素 & 被动 -->
        <div class="w-full space-y-2 text-sm">
          <div class="info-row">
            <span class="info-label">元素</span>
            <span
              class="info-value font-semibold"
              :style="{ color: getElementColor(currentAdv.elements) }"
            >
              {{ getElementName(currentAdv.elements) }}
            </span>
          </div>
          <div class="info-row">
            <span class="info-label">被动增益</span>
            <span class="info-value">{{
              getPassiveBuffName(currentAdv.passiveBuffType)
            }}</span>
          </div>
          <el-divider class="my-2!" />
          <div class="info-row">
            <span class="info-label">⚔️ 攻击等级</span>
            <span class="info-value rpg-number">{{
              currentAdv.attackLevel
            }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">🛡️ 防御等级</span>
            <span class="info-value rpg-number">{{
              currentAdv.defenseLevel
            }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">💨 速度等级</span>
            <span class="info-value rpg-number">{{
              currentAdv.speedLevel
            }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">🌀 SAN值等级</span>
            <span class="info-value rpg-number">{{ currentAdv.SANLevel }}</span>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Loading, User } from '@element-plus/icons-vue'
import { getMyAdventurersApi } from '@/api/game/adventurer.js'
import { useGameUser } from '@/composables/useGameUser.js'

const router = useRouter()
const { isLoggedIn } = useGameUser()

if (!isLoggedIn.value) {
  router.replace('/game/login')
}

const loading = ref(false)
const adventurers = ref([])

const infoVisible = ref(false)
const currentAdv = ref(null)

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

function onAvatarError(e) {
  e.target.src = '/publicgame/avatar/1.webp'
}

function openInfo(adv) {
  currentAdv.value = adv
  infoVisible.value = true
}

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

onMounted(fetchAdventurers)
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

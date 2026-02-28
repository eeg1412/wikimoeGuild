<template>
  <div class="w-full py-6" style="min-height: 60vh">
    <!-- 页面标题 -->
    <div class="mb-6 text-center">
      <h1 class="rpg-title text-2xl font-bold text-gray-800 dark:text-gray-100">
        💎 符文石
      </h1>
      <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
        管理你的符文石，分解或升级
      </p>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="flex justify-center py-12">
      <span class="animate-spin inline-block text-4xl">⏳</span>
    </div>

    <!-- 符文石列表 -->
    <template v-else>
      <div
        v-if="runeStones.length === 0"
        class="text-center py-16 text-gray-400 dark:text-gray-600"
      >
        <!-- <el-icon :size="48" class="mb-3"><Diamond /></el-icon> -->
        <p>暂无符文石</p>
      </div>

      <div v-else class="space-y-3">
        <div
          v-for="rs in runeStones"
          :key="rs._id"
          class="rpg-card rounded-xl p-4 cursor-pointer"
          @click="openDetail(rs)"
        >
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <!-- 稀有度图标 -->
              <div
                class="w-10 h-10 rounded-lg flex items-center justify-center text-lg"
                :class="rarityBgClass(rs.rarity)"
              >
                💎
              </div>
              <div>
                <p
                  class="text-sm font-semibold"
                  :class="rarityTextClass(rs.rarity)"
                >
                  {{ rarityName(rs.rarity) }}符文石
                </p>
                <p class="text-xs text-gray-400">
                  Lv.{{ rs.level }} · 主动 {{ rs.activeSkills?.length || 0 }} ·
                  被动 {{ rs.passiveBuffs?.length || 0 }}
                </p>
              </div>
            </div>
            <div class="flex items-center gap-1">
              <span
                v-if="rs.equippedBy"
                class="text-xs text-green-400 border border-green-400 px-1.5 py-0.5 rounded-full"
              >
                已装备
              </span>
              <span class="text-gray-400">▶</span>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- ==================== 符文石详情弹窗 ==================== -->
    <el-dialog
      v-model="detailVisible"
      :title="detailTitle"
      width="360px"
      align-center
    >
      <div v-if="detailRS" class="space-y-4">
        <!-- 基本信息 -->
        <div class="text-center">
          <div
            class="inline-flex w-16 h-16 rounded-2xl items-center justify-center text-3xl mb-2"
            :class="rarityBgClass(detailRS.rarity)"
          >
            💎
          </div>
          <p
            class="text-lg font-bold"
            :class="rarityTextClass(detailRS.rarity)"
          >
            {{ rarityName(detailRS.rarity) }}符文石
          </p>
          <p class="text-sm text-gray-400">等级 {{ detailRS.level }}</p>
        </div>

        <!-- 主动技能 -->
        <div>
          <h4 class="text-sm font-semibold text-yellow-500 mb-2">
            ⚡ 主动技能
          </h4>
          <div
            v-for="(skill, idx) in detailRS.activeSkills"
            :key="idx"
            class="text-xs text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-lg px-3 py-2 mb-1"
          >
            {{ skill.skillId || skill }}
          </div>
        </div>

        <!-- 被动增益 -->
        <div>
          <h4 class="text-sm font-semibold text-blue-400 mb-2">🔮 被动增益</h4>
          <div
            v-for="(buff, idx) in detailRS.passiveBuffs"
            :key="idx"
            class="text-xs text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-lg px-3 py-2 mb-1 flex justify-between"
          >
            <span>{{ buffTypeName(buff.buffType) }}</span>
            <span class="font-mono text-yellow-500">+{{ buff.buffLevel }}</span>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div v-if="!detailRS.equippedBy" class="flex gap-3 pt-2">
          <el-button
            type="danger"
            class="flex-1"
            :loading="decomposeLoading"
            :disabled="decomposeLoading"
            @click="handleDecompose"
          >
            分解 (+{{ decomposeFragments }}碎片)
          </el-button>
          <el-button
            type="primary"
            class="flex-1"
            :loading="upgradeLoading"
            :disabled="upgradeLoading"
            @click="handleUpgrade"
          >
            升级 ({{ upgradeCost }}碎片)
          </el-button>
        </div>
        <p v-else class="text-center text-xs text-gray-400">
          已装备中，请先卸下再进行分解或升级
        </p>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  getMyRuneStonesApi,
  getRuneStoneDetailApi,
  decomposeRuneStoneApi,
  upgradeRuneStoneApi
} from '@/api/game/runeStone.js'
import { useGameUser } from '@/composables/useGameUser.js'

const router = useRouter()
const { isLoggedIn } = useGameUser()

if (!isLoggedIn.value) {
  router.replace('/game/login')
}

// ── 列表 ──
const loading = ref(false)
const runeStones = ref([])

async function fetchRuneStones() {
  loading.value = true
  try {
    const res = await getMyRuneStonesApi()
    runeStones.value = res.data.data?.list || []
  } catch {
    runeStones.value = []
  } finally {
    loading.value = false
  }
}

// ── 详情 ──
const detailVisible = ref(false)
const detailRS = ref(null)

const detailTitle = computed(() => {
  if (!detailRS.value) return '符文石详情'
  return `${rarityName(detailRS.value.rarity)}符文石 Lv.${detailRS.value.level}`
})

async function openDetail(rs) {
  detailRS.value = { ...rs }
  detailVisible.value = true
  try {
    const res = await getRuneStoneDetailApi(rs._id)
    detailRS.value = res.data.data
  } catch {
    // fallback
  }
}

// ── 工具函数 ──
function rarityName(r) {
  return { normal: '普通', rare: '稀有', legendary: '传说' }[r] || r
}
function rarityTextClass(r) {
  return (
    {
      normal: 'text-gray-600 dark:text-gray-300',
      rare: 'text-blue-500',
      legendary: 'text-yellow-500'
    }[r] || ''
  )
}
function rarityBgClass(r) {
  return (
    {
      normal: 'bg-gray-200 dark:bg-gray-700',
      rare: 'bg-blue-100 dark:bg-blue-900/30',
      legendary: 'bg-yellow-100 dark:bg-yellow-900/30'
    }[r] || ''
  )
}
function buffTypeName(t) {
  return (
    { attack: '攻击', defense: '防御', speed: '速度', san: 'SAN值' }[t] || t
  )
}

// ── 分解计算 ──
const RARITY_DECOMPOSE = { normal: 10, rare: 100, legendary: 500 }
const decomposeFragments = computed(() => {
  if (!detailRS.value) return 0
  return (RARITY_DECOMPOSE[detailRS.value.rarity] || 10) * detailRS.value.level
})

// ── 升级费用 ──
const RARITY_UPGRADE = { normal: 100, rare: 1000, legendary: 5000 }
const upgradeCost = computed(() => {
  if (!detailRS.value) return 0
  return (RARITY_UPGRADE[detailRS.value.rarity] || 100) * detailRS.value.level
})

// ── 分解操作 ──
const decomposeLoading = ref(false)
async function handleDecompose() {
  if (!detailRS.value) return
  try {
    await ElMessageBox.confirm(
      `确定分解这个${rarityName(detailRS.value.rarity)}符文石？将获得 ${decomposeFragments.value} 碎片`,
      '确认分解',
      { confirmButtonText: '分解', cancelButtonText: '取消', type: 'warning' }
    )
  } catch {
    return
  }
  decomposeLoading.value = true
  try {
    await decomposeRuneStoneApi(detailRS.value._id)
    ElMessage.success(`分解成功！获得 ${decomposeFragments.value} 碎片`)
    detailVisible.value = false
    await fetchRuneStones()
  } catch (e) {
    // 错误已由拦截器处理
  } finally {
    decomposeLoading.value = false
  }
}

// ── 升级操作 ──
const upgradeLoading = ref(false)
async function handleUpgrade() {
  if (!detailRS.value) return
  upgradeLoading.value = true
  try {
    const res = await upgradeRuneStoneApi(detailRS.value._id)
    ElMessage.success('升级成功！')
    detailRS.value = res.data.data
    // 同步列表
    const idx = runeStones.value.findIndex(r => r._id === detailRS.value._id)
    if (idx >= 0) runeStones.value[idx] = { ...detailRS.value }
  } catch (e) {
    // 错误已由拦截器处理
  } finally {
    upgradeLoading.value = false
  }
}

// ── 初始化 ──
onMounted(fetchRuneStones)
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

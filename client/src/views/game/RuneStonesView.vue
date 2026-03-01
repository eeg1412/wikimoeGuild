<template>
  <div class="w-full py-6" style="min-height: 60vh">
    <!-- 页面标题 -->
    <div class="mb-6 text-center">
      <h1 class="rpg-title text-2xl font-bold text-gray-800 dark:text-gray-100">
        💎 符文石
      </h1>
      <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
        管理你的符文石，分解、升级或合成
      </p>
    </div>

    <!-- 排序 & 筛选 -->
    <div class="flex items-center justify-between gap-2 mb-4 flex-wrap">
      <div class="flex items-center gap-2">
        <el-select
          v-model="sortMode"
          size="small"
          style="width: 140px"
          @change="handleSortChange"
        >
          <el-option label="入手顺序（新→旧）" value="newest" />
          <el-option label="入手顺序（旧→新）" value="oldest" />
          <el-option label="等级（高→低）" value="level_desc" />
          <el-option label="等级（低→高）" value="level_asc" />
          <el-option label="稀有度优先" value="rarity" />
        </el-select>
        <el-select
          v-model="rarityFilter"
          size="small"
          placeholder="稀有度"
          clearable
          style="width: 100px"
          @change="handleRarityFilterChange"
        >
          <el-option label="普通" value="normal" />
          <el-option label="稀有" value="rare" />
          <el-option label="传说" value="legendary" />
        </el-select>
      </div>
      <el-button type="warning" size="small" @click="openSynthesisDialog">
        🔮 合成
      </el-button>
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
          <!-- 顶部：稀有度 + 等级 + 状态 -->
          <div class="flex items-center justify-between mb-2">
            <div class="flex items-center gap-3">
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
                <p class="text-sm text-gray-400">Lv.{{ rs.level }}</p>
              </div>
            </div>
            <div class="flex items-center gap-1">
              <span
                v-if="rs.equippedBy"
                class="text-xs text-green-400 border border-green-400 px-1.5 py-0.5 rounded-full"
              >
                已装备
              </span>
              <span
                v-if="rs.listedOnMarket"
                class="text-xs text-orange-400 border border-orange-400 px-1.5 py-0.5 rounded-full"
              >
                出售中
              </span>
              <span class="text-gray-400">▶</span>
            </div>
          </div>
          <!-- 完整的技能/增益信息 -->
          <RuneStoneInfoCard :rune-stone="rs" />
        </div>
      </div>

      <!-- 分页 -->
      <div
        v-if="runeStoneTotal > runeStonePageSize"
        class="flex justify-center mt-4"
      >
        <el-pagination
          v-model:current-page="runeStonePageNum"
          :page-size="runeStonePageSize"
          :total="runeStoneTotal"
          layout="prev, pager, next"
          small
          @current-change="fetchRuneStones"
        />
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

        <!-- 主动技能 & 被动增益 -->
        <RuneStoneInfoCard :rune-stone="detailRS" />

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
        <p v-else class="text-center text-sm text-gray-400">
          已装备中，请先卸下再进行分解或升级
        </p>
      </div>
    </el-dialog>

    <!-- ==================== 符文石合成弹窗 ==================== -->
    <el-dialog
      v-model="synthesisVisible"
      title="🔮 符文石合成"
      width="380px"
      align-center
    >
      <!-- 第 1 步: 选择符文石 -->
      <template v-if="synthesisStep === 'select'">
        <p class="text-sm text-gray-500 dark:text-gray-400 mb-3">
          选择两个<strong>相同稀有度</strong>的未装备符文石进行合成。合成后素材符文石将被销毁。
        </p>

        <!-- 主符文石 -->
        <div class="mb-3">
          <p
            class="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-1"
          >
            主符文石
          </p>
          <div
            class="rpg-card rounded-lg p-3 cursor-pointer border-2 transition-colors"
            :class="
              synthesisMain
                ? 'border-yellow-400'
                : 'border-dashed border-gray-300 dark:border-gray-600'
            "
            @click="pickSynthesisSlot('main')"
          >
            <div v-if="synthesisMain" class="flex items-center gap-2">
              <div
                class="w-8 h-8 rounded-lg flex items-center justify-center text-sm"
                :class="rarityBgClass(synthesisMain.rarity)"
              >
                💎
              </div>
              <div>
                <p
                  class="text-sm font-semibold"
                  :class="rarityTextClass(synthesisMain.rarity)"
                >
                  {{ rarityName(synthesisMain.rarity) }}符文石 Lv.{{
                    synthesisMain.level
                  }}
                </p>
              </div>
            </div>
            <p v-else class="text-gray-400 text-sm text-center">
              点击选择主符文石
            </p>
          </div>
        </div>

        <!-- 素材符文石 -->
        <div class="mb-4">
          <p
            class="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-1"
          >
            素材符文石（将被销毁）
          </p>
          <div
            class="rpg-card rounded-lg p-3 cursor-pointer border-2 transition-colors"
            :class="
              synthesisMaterial
                ? 'border-red-400'
                : 'border-dashed border-gray-300 dark:border-gray-600'
            "
            @click="pickSynthesisSlot('material')"
          >
            <div v-if="synthesisMaterial" class="flex items-center gap-2">
              <div
                class="w-8 h-8 rounded-lg flex items-center justify-center text-sm"
                :class="rarityBgClass(synthesisMaterial.rarity)"
              >
                💎
              </div>
              <div>
                <p
                  class="text-sm font-semibold"
                  :class="rarityTextClass(synthesisMaterial.rarity)"
                >
                  {{ rarityName(synthesisMaterial.rarity) }}符文石 Lv.{{
                    synthesisMaterial.level
                  }}
                </p>
              </div>
            </div>
            <p v-else class="text-gray-400 text-sm text-center">
              点击选择素材符文石
            </p>
          </div>
        </div>

        <el-button
          type="primary"
          class="w-full"
          :loading="synthesisPreviewLoading"
          :disabled="
            !synthesisMain || !synthesisMaterial || synthesisPreviewLoading
          "
          @click="handlePreviewSynthesis"
        >
          🔮 预览合成结果
        </el-button>
      </template>

      <!-- 第 2 步: 预览结果 -->
      <template v-else-if="synthesisStep === 'preview'">
        <div v-if="synthesisPreview" class="space-y-3">
          <!-- 预览卡片 -->
          <div class="text-center">
            <div
              class="inline-flex w-14 h-14 rounded-2xl items-center justify-center text-2xl mb-1"
              :class="rarityBgClass(synthesisPreview.rarity)"
            >
              💎
            </div>
            <p
              class="text-lg font-bold"
              :class="rarityTextClass(synthesisPreview.rarity)"
            >
              {{ rarityName(synthesisPreview.rarity) }}符文石
            </p>
            <p class="text-sm text-gray-400">
              等级 {{ synthesisPreview.level }}
              <template v-if="synthesisPreview.level !== synthesisMain?.level">
                <span
                  :class="
                    synthesisPreview.level > synthesisMain?.level
                      ? 'text-green-500'
                      : 'text-red-500'
                  "
                >
                  ({{ synthesisPreview.level > synthesisMain?.level ? '↑' : '↓'
                  }}{{
                    Math.abs(
                      synthesisPreview.level - (synthesisMain?.level || 0)
                    )
                  }})
                </span>
              </template>
            </p>
          </div>

          <!-- 与主石对比 -->
          <div
            v-if="synthesisMain"
            class="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 space-y-2 text-xs text-gray-500 dark:text-gray-400"
          >
            <p class="font-semibold text-gray-600 dark:text-gray-300 mb-1">
              📊 与主石对比
            </p>
            <p>
              稀有度：{{ rarityName(synthesisMain.rarity) }} →
              <span
                :class="
                  synthesisPreview.rarity !== synthesisMain.rarity
                    ? 'text-yellow-500 font-bold'
                    : ''
                "
              >
                {{ rarityName(synthesisPreview.rarity) }}
              </span>
            </p>

            <!-- 主动技能变化详情 -->
            <div>
              <p class="font-semibold text-gray-600 dark:text-gray-300 mb-1">
                ⚡ 主动技能变化
              </p>
              <template v-if="synthesisSkillDiff.removed.length">
                <div
                  v-for="(s, i) in synthesisSkillDiff.removed"
                  :key="'sr' + i"
                  class="bg-red-50 dark:bg-red-900/20 rounded px-2 py-1 mb-1"
                >
                  <span class="text-red-500 font-bold">- 移除：</span>
                  <span class="text-red-400">{{ s.label }}</span>
                </div>
              </template>
              <template v-if="synthesisSkillDiff.added.length">
                <div
                  v-for="(s, i) in synthesisSkillDiff.added"
                  :key="'sa' + i"
                  class="bg-green-50 dark:bg-green-900/20 rounded px-2 py-1 mb-1"
                >
                  <span class="text-green-500 font-bold">+ 新增：</span>
                  <span class="text-green-400">{{ s.label }}</span>
                </div>
              </template>
              <template v-if="synthesisSkillDiff.kept.length">
                <div
                  v-for="(s, i) in synthesisSkillDiff.kept"
                  :key="'sk' + i"
                  class="rounded px-2 py-1 mb-1"
                >
                  <span class="text-gray-400">= 保留：{{ s.label }}</span>
                </div>
              </template>
              <p
                v-if="
                  !synthesisSkillDiff.removed.length &&
                  !synthesisSkillDiff.added.length &&
                  !synthesisSkillDiff.kept.length
                "
                class="text-gray-400"
              >
                无主动技能
              </p>
            </div>

            <!-- 被动增益变化详情 -->
            <div>
              <p class="font-semibold text-gray-600 dark:text-gray-300 mb-1">
                🔮 被动增益变化
              </p>
              <template v-if="synthesisBuffDiff.removed.length">
                <div
                  v-for="(b, i) in synthesisBuffDiff.removed"
                  :key="'br' + i"
                  class="bg-red-50 dark:bg-red-900/20 rounded px-2 py-1 mb-1"
                >
                  <span class="text-red-500 font-bold">- 移除：</span>
                  <span class="text-red-400"
                    >{{ buffTypeName(b.buffType) }} Lv.{{ b.buffLevel }}</span
                  >
                </div>
              </template>
              <template v-if="synthesisBuffDiff.added.length">
                <div
                  v-for="(b, i) in synthesisBuffDiff.added"
                  :key="'ba' + i"
                  class="bg-green-50 dark:bg-green-900/20 rounded px-2 py-1 mb-1"
                >
                  <span class="text-green-500 font-bold">+ 新增：</span>
                  <span class="text-green-400"
                    >{{ buffTypeName(b.buffType) }} Lv.{{ b.buffLevel }}</span
                  >
                </div>
              </template>
              <template v-if="synthesisBuffDiff.changed.length">
                <div
                  v-for="(c, i) in synthesisBuffDiff.changed"
                  :key="'bc' + i"
                  class="bg-blue-50 dark:bg-blue-900/20 rounded px-2 py-1 mb-1"
                >
                  <span class="text-blue-500 font-bold">~ 变化：</span>
                  <span class="text-blue-400"
                    >{{ buffTypeName(c.buffType) }} Lv.{{ c.oldLevel }} → Lv.{{
                      c.newLevel
                    }}
                    <span
                      :class="
                        c.newLevel > c.oldLevel
                          ? 'text-green-500'
                          : 'text-red-500'
                      "
                    >
                      ({{ c.newLevel > c.oldLevel ? '↑' : '↓'
                      }}{{ Math.abs(c.newLevel - c.oldLevel) }})
                    </span>
                  </span>
                </div>
              </template>
              <template v-if="synthesisBuffDiff.kept.length">
                <div
                  v-for="(b, i) in synthesisBuffDiff.kept"
                  :key="'bk' + i"
                  class="rounded px-2 py-1 mb-1"
                >
                  <span class="text-gray-400"
                    >= 保留：{{ buffTypeName(b.buffType) }} Lv.{{
                      b.buffLevel
                    }}</span
                  >
                </div>
              </template>
              <p
                v-if="
                  !synthesisBuffDiff.removed.length &&
                  !synthesisBuffDiff.added.length &&
                  !synthesisBuffDiff.changed.length &&
                  !synthesisBuffDiff.kept.length
                "
                class="text-gray-400"
              >
                无被动增益
              </p>
            </div>
          </div>

          <!-- 主动技能 & 被动增益 -->
          <RuneStoneInfoCard :rune-stone="synthesisPreview" />

          <p class="text-sm text-red-400 text-center">
            ⚠️ 不论接受或放弃，素材符文石都将被销毁
          </p>

          <!-- 操作按钮 -->
          <div class="flex gap-3 pt-1">
            <el-button
              type="danger"
              class="flex-1"
              :loading="synthesisConfirmLoading"
              :disabled="synthesisConfirmLoading"
              @click="handleConfirmSynthesis(false)"
            >
              放弃合成
            </el-button>
            <el-button
              type="primary"
              class="flex-1"
              :loading="synthesisConfirmLoading"
              :disabled="synthesisConfirmLoading"
              @click="handleConfirmSynthesis(true)"
            >
              接受合成
            </el-button>
          </div>
        </div>
      </template>
    </el-dialog>

    <!-- ==================== 选择符文石弹窗 ==================== -->
    <el-dialog
      v-model="pickRuneVisible"
      title="选择符文石"
      width="380px"
      align-center
    >
      <!-- 稀有度筛选 -->
      <div class="flex items-center gap-2 mb-3">
        <el-select
          v-model="pickRarityFilter"
          size="small"
          placeholder="稀有度筛选"
          clearable
          style="width: 120px"
        >
          <el-option label="普通" value="normal" />
          <el-option label="稀有" value="rare" />
          <el-option label="传说" value="legendary" />
        </el-select>
      </div>
      <div
        v-if="filteredPickableRuneStones.length === 0"
        class="text-center py-8 text-gray-400"
      >
        无可选的符文石
      </div>
      <div v-else class="space-y-3 max-h-[60vh] overflow-y-auto">
        <div
          v-for="rs in filteredPickableRuneStones"
          :key="rs._id"
          class="rpg-card rounded-xl p-3 cursor-pointer hover:border-yellow-400 transition-colors border"
          @click="confirmPick(rs)"
        >
          <!-- 标题行 -->
          <div class="flex items-center justify-between mb-2">
            <div class="flex items-center gap-2">
              <div
                class="w-8 h-8 rounded-lg flex items-center justify-center text-sm"
                :class="rarityBgClass(rs.rarity)"
              >
                💎
              </div>
              <div>
                <p
                  class="text-sm font-semibold"
                  :class="rarityTextClass(rs.rarity)"
                >
                  {{ rarityName(rs.rarity) }}符文石 Lv.{{ rs.level }}
                </p>
              </div>
            </div>
            <span
              class="text-xs text-yellow-500 border border-yellow-400 px-1.5 py-0.5 rounded-full"
              >选择</span
            >
          </div>
          <!-- 完整信息 -->
          <RuneStoneInfoCard :rune-stone="rs" />
        </div>
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
  upgradeRuneStoneApi,
  previewSynthesisApi,
  confirmSynthesisApi
} from '@/api/game/runeStone.js'
import { useGameUser } from '@/composables/useGameUser.js'
import { runeStoneActiveSkillDataBase } from 'shared/utils/gameDatabase.js'
import RuneStoneInfoCard from '@/components/RuneStoneInfoCard.vue'

const router = useRouter()
const { isLoggedIn } = useGameUser()

if (!isLoggedIn.value) {
  router.replace({ name: 'GameLogin' })
}

// ── 列表 ──
const loading = ref(false)
const runeStones = ref([])
const sortMode = ref('newest')
const rarityFilter = ref('')
const runeStonePageNum = ref(1)
const runeStonePageSize = 20
const runeStoneTotal = ref(0)

function handleSortChange() {
  runeStonePageNum.value = 1
  fetchRuneStones()
}

function handleRarityFilterChange() {
  runeStonePageNum.value = 1
  fetchRuneStones()
}

async function fetchRuneStones() {
  loading.value = true
  try {
    const params = {
      sort: sortMode.value,
      page: runeStonePageNum.value,
      pageSize: runeStonePageSize
    }
    if (rarityFilter.value) {
      params.rarity = rarityFilter.value
    }
    const res = await getMyRuneStonesApi(params)
    runeStones.value = res.data.data?.list || []
    runeStoneTotal.value = res.data.data?.total || 0
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

function skillTypeName(t) {
  return (
    {
      attack: '攻击',
      buff: '增益',
      debuff: '减益',
      changeOrder: '改变排序',
      sanRecover: 'SAN恢复'
    }[t] || t
  )
}

function elementName(el) {
  return { 1: '地', 2: '水', 3: '火', 4: '风', 5: '光明', 6: '黑暗' }[el] || ''
}

function triggerTimingName(t) {
  return { before: '攻击前', after: '攻击后' }[t] || t
}

function targetName(t) {
  return { self: '己方', enemy: '敌方' }[t] || t
}
const allSkillsMap = computed(() => {
  const map = new Map()
  const skills = runeStoneActiveSkillDataBase()
  for (const s of skills) {
    map.set(s.value, s)
  }
  return map
})

function getSkillInfo(skillId) {
  return allSkillsMap.value.get(skillId) || null
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

// ── 合成系统 ──
const synthesisVisible = ref(false)
const synthesisStep = ref('select') // 'select' | 'preview'
const synthesisMain = ref(null)
const synthesisMaterial = ref(null)
const synthesisPreviewLoading = ref(false)
const synthesisPreview = ref(null)
const synthesisPreviewToken = ref('')
const synthesisConfirmLoading = ref(false)

// 选择器
const pickRuneVisible = ref(false)
const pickingSlot = ref('') // 'main' | 'material'
const pickRarityFilter = ref('')

function openSynthesisDialog() {
  synthesisStep.value = 'select'
  synthesisMain.value = null
  synthesisMaterial.value = null
  synthesisPreview.value = null
  synthesisPreviewToken.value = ''
  synthesisVisible.value = true
}

// 可选符文石：未装备、未上架，排除另一个槽位已选的
const pickableRuneStones = computed(() => {
  const excludeId =
    pickingSlot.value === 'main'
      ? synthesisMaterial.value?._id
      : synthesisMain.value?._id
  const targetRarity =
    pickingSlot.value === 'material' && synthesisMain.value
      ? synthesisMain.value.rarity
      : null

  return runeStones.value.filter(rs => {
    if (rs.equippedBy) return false
    if (rs.listedOnMarket) return false
    if (rs._id === excludeId) return false
    if (targetRarity && rs.rarity !== targetRarity) return false
    return true
  })
})

const filteredPickableRuneStones = computed(() => {
  if (!pickRarityFilter.value) return pickableRuneStones.value
  return pickableRuneStones.value.filter(
    rs => rs.rarity === pickRarityFilter.value
  )
})

// 合成对比 - 主动技能差异
const synthesisSkillDiff = computed(() => {
  const result = { removed: [], added: [], kept: [] }
  if (!synthesisMain.value || !synthesisPreview.value) return result

  const oldSkills = (synthesisMain.value.activeSkills || []).map(
    s => s.skillId || s
  )
  const newSkills = (synthesisPreview.value.activeSkills || []).map(
    s => s.skillId || s
  )

  // 统计每个 skillId 出现次数
  const oldMap = new Map()
  for (const id of oldSkills) oldMap.set(id, (oldMap.get(id) || 0) + 1)
  const newMap = new Map()
  for (const id of newSkills) newMap.set(id, (newMap.get(id) || 0) + 1)

  const allIds = new Set([...oldMap.keys(), ...newMap.keys()])
  for (const id of allIds) {
    const oldCount = oldMap.get(id) || 0
    const newCount = newMap.get(id) || 0
    const info = getSkillInfo(id)
    const label = info ? info.label : id
    const shared = Math.min(oldCount, newCount)
    for (let i = 0; i < shared; i++) result.kept.push({ skillId: id, label })
    for (let i = 0; i < oldCount - shared; i++)
      result.removed.push({ skillId: id, label })
    for (let i = 0; i < newCount - shared; i++)
      result.added.push({ skillId: id, label })
  }
  return result
})

// 合成对比 - 被动增益差异
const synthesisBuffDiff = computed(() => {
  const result = { removed: [], added: [], changed: [], kept: [] }
  if (!synthesisMain.value || !synthesisPreview.value) return result

  const oldBuffs = synthesisMain.value.passiveBuffs || []
  const newBuffs = synthesisPreview.value.passiveBuffs || []

  // 按 buffType 分组
  const oldByType = new Map()
  for (const b of oldBuffs) oldByType.set(b.buffType, b)
  const newByType = new Map()
  for (const b of newBuffs) newByType.set(b.buffType, b)

  const allTypes = new Set([...oldByType.keys(), ...newByType.keys()])
  for (const type of allTypes) {
    const oldBuff = oldByType.get(type)
    const newBuff = newByType.get(type)
    if (oldBuff && !newBuff) {
      result.removed.push(oldBuff)
    } else if (!oldBuff && newBuff) {
      result.added.push(newBuff)
    } else if (oldBuff && newBuff) {
      if (oldBuff.buffLevel !== newBuff.buffLevel) {
        result.changed.push({
          buffType: type,
          oldLevel: oldBuff.buffLevel,
          newLevel: newBuff.buffLevel
        })
      } else {
        result.kept.push(oldBuff)
      }
    }
  }
  return result
})

function pickSynthesisSlot(slot) {
  pickingSlot.value = slot
  pickRuneVisible.value = true
}

function confirmPick(rs) {
  if (pickingSlot.value === 'main') {
    synthesisMain.value = rs
    // 如果素材稀有度不匹配，清空素材
    if (
      synthesisMaterial.value &&
      synthesisMaterial.value.rarity !== rs.rarity
    ) {
      synthesisMaterial.value = null
    }
  } else {
    synthesisMaterial.value = rs
  }
  pickRuneVisible.value = false
}

async function handlePreviewSynthesis() {
  if (!synthesisMain.value || !synthesisMaterial.value) return
  synthesisPreviewLoading.value = true
  try {
    const res = await previewSynthesisApi({
      mainRuneStoneId: synthesisMain.value._id,
      materialRuneStoneId: synthesisMaterial.value._id
    })
    const data = res.data.data
    synthesisPreview.value = data.preview
    synthesisPreviewToken.value = data.previewToken
    synthesisStep.value = 'preview'
  } catch {
    // 错误已由拦截器处理
  } finally {
    synthesisPreviewLoading.value = false
  }
}

async function handleConfirmSynthesis(accept) {
  const actionLabel = accept ? '接受合成' : '放弃合成'
  const confirmMsg = accept
    ? '确定接受合成结果？主符文石将被替换为合成结果，素材符文石将被销毁。'
    : '确定放弃合成？素材符文石仍将被销毁，主符文石保持不变。'
  try {
    await ElMessageBox.confirm(confirmMsg, actionLabel, {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
  } catch {
    return
  }

  synthesisConfirmLoading.value = true
  try {
    await confirmSynthesisApi({
      previewToken: synthesisPreviewToken.value,
      accept
    })
    ElMessage.success(accept ? '合成成功！' : '已放弃合成，素材符文石已销毁')
    synthesisVisible.value = false
    await fetchRuneStones()
  } catch {
    // 错误已由拦截器处理
  } finally {
    synthesisConfirmLoading.value = false
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

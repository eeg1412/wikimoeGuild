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
                <p class="text-sm text-gray-400">
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
              <span
                v-if="rs.listedOnMarket"
                class="text-xs text-orange-400 border border-orange-400 px-1.5 py-0.5 rounded-full"
              >
                出售中
              </span>
              <span class="text-gray-400">▶</span>
            </div>
          </div>
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

        <!-- 主动技能 -->
        <div>
          <h4 class="text-sm font-semibold text-yellow-500 mb-2">
            ⚡ 主动技能
          </h4>
          <div
            v-for="(skill, idx) in detailRS.activeSkills"
            :key="idx"
            class="text-sm text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-lg px-3 py-2 mb-1"
          >
            <template v-if="getSkillInfo(skill.skillId || skill)">
              <p class="font-semibold text-gray-800 dark:text-gray-100">
                {{ getSkillInfo(skill.skillId || skill).label }}
              </p>
              <p class="mt-0.5 text-gray-500 dark:text-gray-400">
                {{ getSkillInfo(skill.skillId || skill).description }}
              </p>
              <div class="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
                <span
                  >类型:
                  {{
                    skillTypeName(getSkillInfo(skill.skillId || skill).type)
                  }}</span
                >
                <span v-if="getSkillInfo(skill.skillId || skill).element">
                  元素:
                  {{
                    elementName(getSkillInfo(skill.skillId || skill).element)
                  }}
                </span>
                <span
                  >时机:
                  {{
                    triggerTimingName(
                      getSkillInfo(skill.skillId || skill).triggerTiming
                    )
                  }}</span
                >
                <span
                  >目标:
                  {{
                    targetName(getSkillInfo(skill.skillId || skill).target)
                  }}</span
                >
                <span
                  >基础值:
                  {{ getSkillInfo(skill.skillId || skill).baseValue }}</span
                >
              </div>
            </template>
            <template v-else>
              {{ skill.skillId || skill }}
            </template>
          </div>
        </div>

        <!-- 被动增益 -->
        <div>
          <h4 class="text-sm font-semibold text-blue-400 mb-2">🔮 被动增益</h4>
          <div
            v-for="(buff, idx) in detailRS.passiveBuffs"
            :key="idx"
            class="text-sm text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-lg px-3 py-2 mb-1 flex justify-between"
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
            </p>
          </div>

          <!-- 主动技能 -->
          <div>
            <h4 class="text-sm font-semibold text-yellow-500 mb-1">
              ⚡ 主动技能
            </h4>
            <div
              v-for="(skill, idx) in synthesisPreview.activeSkills"
              :key="idx"
              class="text-sm text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-lg px-3 py-2 mb-1"
            >
              <template v-if="getSkillInfo(skill.skillId || skill)">
                <p class="font-semibold text-gray-800 dark:text-gray-100">
                  {{ getSkillInfo(skill.skillId || skill).label }}
                </p>
                <p class="mt-0.5 text-gray-500 dark:text-gray-400">
                  {{ getSkillInfo(skill.skillId || skill).description }}
                </p>
                <div class="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
                  <span
                    >类型:
                    {{
                      skillTypeName(getSkillInfo(skill.skillId || skill).type)
                    }}</span
                  >
                  <span v-if="getSkillInfo(skill.skillId || skill).element">
                    元素:
                    {{
                      elementName(getSkillInfo(skill.skillId || skill).element)
                    }}
                  </span>
                  <span
                    >时机:
                    {{
                      triggerTimingName(
                        getSkillInfo(skill.skillId || skill).triggerTiming
                      )
                    }}</span
                  >
                  <span
                    >目标:
                    {{
                      targetName(getSkillInfo(skill.skillId || skill).target)
                    }}</span
                  >
                  <span
                    >基础值:
                    {{ getSkillInfo(skill.skillId || skill).baseValue }}</span
                  >
                </div>
              </template>
              <template v-else>
                {{ skill.skillId || skill }}
              </template>
            </div>
          </div>

          <!-- 被动增益 -->
          <div>
            <h4 class="text-sm font-semibold text-blue-400 mb-1">
              🔮 被动增益
            </h4>
            <div
              v-for="(buff, idx) in synthesisPreview.passiveBuffs"
              :key="idx"
              class="text-sm text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-lg px-3 py-2 mb-1 flex justify-between"
            >
              <span>{{ buffTypeName(buff.buffType) }}</span>
              <span class="font-mono text-yellow-500"
                >+{{ buff.buffLevel }}</span
              >
            </div>
          </div>

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
      width="360px"
      align-center
    >
      <div
        v-if="pickableRuneStones.length === 0"
        class="text-center py-8 text-gray-400"
      >
        无可选的符文石
      </div>
      <div v-else class="space-y-2 max-h-[50vh] overflow-y-auto">
        <div
          v-for="rs in pickableRuneStones"
          :key="rs._id"
          class="rpg-card rounded-lg p-3 cursor-pointer hover:border-yellow-400 transition-colors border"
          @click="confirmPick(rs)"
        >
          <div class="flex items-center gap-2">
            <div
              class="w-8 h-8 rounded-lg flex items-center justify-center text-sm"
              :class="rarityBgClass(rs.rarity)"
            >
              💎
            </div>
            <div class="flex-1">
              <p
                class="text-sm font-semibold"
                :class="rarityTextClass(rs.rarity)"
              >
                {{ rarityName(rs.rarity) }}符文石 Lv.{{ rs.level }}
              </p>
              <p class="text-sm text-gray-400">
                主动 {{ rs.activeSkills?.length || 0 }} · 被动
                {{ rs.passiveBuffs?.length || 0 }}
              </p>
            </div>
          </div>
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

const router = useRouter()
const { isLoggedIn } = useGameUser()

if (!isLoggedIn.value) {
  router.replace({ name: 'GameLogin' })
}

// ── 列表 ──
const loading = ref(false)
const runeStones = ref([])
const sortMode = ref('newest')
const runeStonePageNum = ref(1)
const runeStonePageSize = 20
const runeStoneTotal = ref(0)

function handleSortChange() {
  runeStonePageNum.value = 1
  fetchRuneStones()
}

async function fetchRuneStones() {
  loading.value = true
  try {
    const res = await getMyRuneStonesApi({
      sort: sortMode.value,
      page: runeStonePageNum.value,
      pageSize: runeStonePageSize
    })
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

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

        <!-- 综合等级 -->
        <p class="text-xs text-yellow-500 mt-1 font-mono">
          Lv.{{ adv.comprehensiveLevel || 1 }}
        </p>

        <!-- 装备状态标签 -->
        <span
          v-if="adv.runeStone"
          class="mt-1 text-[10px] text-green-400 border border-green-400 px-1 py-0 rounded-full"
        >
          💎装备中
        </span>
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

    <!-- ==================== 冒险家详情弹窗 ==================== -->
    <el-dialog
      v-model="detailVisible"
      :title="detailAdv?.name || '冒险家详情'"
      width="360px"
      align-center
      class="rpg-dialog"
    >
      <div v-if="detailAdv" class="flex flex-col items-center gap-4">
        <!-- 头像 -->
        <div class="relative cursor-pointer" @click="showAvatarDialog = true">
          <GameAdventurerAvatar
            :adventurer="detailAdv"
            :alt="detailAdv.name"
            class="w-24 h-24 rounded-full object-cover border-4"
            :style="{ borderColor: getElementColor(detailAdv.elements) }"
          />
          <div
            class="absolute -top-1 -right-1 w-6 h-6 rotate-45 border-2 border-white dark:border-gray-700 shadow"
            :style="{ backgroundColor: getElementColor(detailAdv.elements) }"
          />
          <div
            class="absolute bottom-0 right-0 bg-black/60 rounded-full px-1.5 py-0.5 text-[10px] text-white"
          >
            ✏️
          </div>
        </div>

        <!-- 名字编辑 -->
        <div class="flex items-center gap-2">
          <span class="text-lg font-bold text-gray-800 dark:text-gray-100">{{
            detailAdv.name
          }}</span>
          <el-button text size="small" @click="showNameDialog = true"
            >✏️</el-button
          >
        </div>

        <!-- 基本信息 -->
        <div class="w-full space-y-2 text-sm">
          <div class="info-row">
            <span class="info-label">元素</span>
            <span
              class="info-value font-semibold"
              :style="{ color: getElementColor(detailAdv.elements) }"
            >
              {{ getElementName(detailAdv.elements) }}
            </span>
          </div>
          <div class="info-row">
            <span class="info-label">被动增益</span>
            <span class="info-value text-xs">{{
              getPassiveBuffName(detailAdv.passiveBuffType)
            }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">攻击偏好</span>
            <span class="info-value text-xs">{{
              getAttackPreferenceName(detailAdv.attackPreference)
            }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">综合等级</span>
            <span class="info-value rpg-number">{{
              detailAdv.comprehensiveLevel
            }}</span>
          </div>

          <el-divider class="my-2!" />

          <!-- 资源信息 -->
          <div class="w-full grid grid-cols-2 gap-2 text-xs">
            <div
              class="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-2 text-center"
            >
              <p class="text-[10px] text-gray-400">🪙 金币</p>
              <p class="text-sm font-bold text-yellow-500">
                {{ (playerInfo?.gold ?? 0).toLocaleString() }}
              </p>
            </div>
            <div
              class="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-2 text-center"
            >
              <p class="text-[10px] text-gray-400">💎 符文石碎片</p>
              <p class="text-sm font-bold text-purple-500">
                {{ (inventory?.runeFragment ?? 0).toLocaleString() }}
              </p>
            </div>
          </div>
          <div class="w-full grid grid-cols-4 gap-1 text-xs mt-1">
            <div class="bg-gray-50 dark:bg-gray-800 rounded p-1.5 text-center">
              <p class="text-[10px] text-gray-400">⚔️水晶</p>
              <p class="text-xs font-mono text-gray-600 dark:text-gray-300">
                {{ inventory?.attackCrystal ?? 0 }}
              </p>
            </div>
            <div class="bg-gray-50 dark:bg-gray-800 rounded p-1.5 text-center">
              <p class="text-[10px] text-gray-400">🛡️水晶</p>
              <p class="text-xs font-mono text-gray-600 dark:text-gray-300">
                {{ inventory?.defenseCrystal ?? 0 }}
              </p>
            </div>
            <div class="bg-gray-50 dark:bg-gray-800 rounded p-1.5 text-center">
              <p class="text-[10px] text-gray-400">💨水晶</p>
              <p class="text-xs font-mono text-gray-600 dark:text-gray-300">
                {{ inventory?.speedCrystal ?? 0 }}
              </p>
            </div>
            <div class="bg-gray-50 dark:bg-gray-800 rounded p-1.5 text-center">
              <p class="text-[10px] text-gray-400">🌀水晶</p>
              <p class="text-xs font-mono text-gray-600 dark:text-gray-300">
                {{ inventory?.sanCrystal ?? 0 }}
              </p>
            </div>
          </div>

          <el-divider class="my-2!" />

          <!-- 属性升级区 -->
          <div v-for="stat in STAT_LIST" :key="stat.key" class="info-row">
            <span class="info-label"
              >{{ stat.icon }} {{ stat.name }} Lv.{{
                detailAdv[stat.levelKey]
              }}</span
            >
            <el-button
              type="warning"
              size="small"
              :loading="levelUpLoading"
              :disabled="levelUpLoading"
              @click="handleLevelUp(stat.key)"
            >
              升级
            </el-button>
          </div>
          <p class="text-xs text-gray-400 text-center">
            升级消耗：50水晶 + 500金币
          </p>

          <el-divider class="my-2!" />

          <!-- 符文石 -->
          <div class="info-row">
            <span class="info-label">💎 符文石</span>
            <div class="flex items-center gap-1">
              <template v-if="detailAdv.runeStone">
                <span
                  class="text-xs cursor-pointer hover:underline"
                  :class="rarityClass(detailAdv.runeStone.rarity)"
                  @click="openRuneStoneDetail(detailAdv.runeStone)"
                >
                  {{ rarityName(detailAdv.runeStone.rarity) }} Lv.{{
                    detailAdv.runeStone.level
                  }}
                </span>
                <el-button
                  type="danger"
                  text
                  size="small"
                  :loading="unequipLoading"
                  :disabled="unequipLoading"
                  @click="handleUnequip"
                >
                  卸下
                </el-button>
              </template>
              <template v-else>
                <span class="text-xs text-gray-400">无</span>
                <el-button
                  type="primary"
                  text
                  size="small"
                  @click="showEquipDialog = true"
                >
                  装备
                </el-button>
              </template>
            </div>
          </div>
        </div>
      </div>
    </el-dialog>

    <!-- ==================== 自定义头像弹窗 ==================== -->
    <el-dialog
      v-model="showAvatarDialog"
      title="自定义头像"
      width="360px"
      align-center
    >
      <p class="text-sm text-gray-500 mb-3">
        消耗 {{ gameSettings.adventurerCustomAvatarPrice ?? 5000 }} 金币
      </p>
      <Cropper
        :src="avatarPreview"
        :width="200"
        :height="200"
        :aspect-ratio="1"
        put-image-type="image/webp"
        :put-image-quality="0.8"
        @crop="onAvatarCrop"
      />
      <template #footer>
        <el-button @click="showAvatarDialog = false">取消</el-button>
        <el-button
          type="primary"
          :loading="avatarSaving"
          :disabled="avatarSaving || !avatarBase64"
          @click="handleSaveAvatar"
        >
          确定
        </el-button>
      </template>
    </el-dialog>

    <!-- ==================== 自定义名字弹窗 ==================== -->
    <el-dialog
      v-model="showNameDialog"
      title="自定义名字"
      width="320px"
      align-center
    >
      <p class="text-sm text-gray-500 mb-3">
        消耗 {{ gameSettings.adventurerCustomNamePrice ?? 1000 }} 金币
      </p>
      <el-input
        v-model="newName"
        placeholder="输入新名字（2-20字符）"
        maxlength="20"
        show-word-limit
      />
      <template #footer>
        <el-button @click="showNameDialog = false">取消</el-button>
        <el-button
          type="primary"
          :loading="nameSaving"
          :disabled="nameSaving || !newName || newName.length < 2"
          @click="handleSaveName"
        >
          确定
        </el-button>
      </template>
    </el-dialog>

    <!-- ==================== 装备符文石弹窗 ==================== -->
    <el-dialog
      v-model="showEquipDialog"
      title="选择符文石"
      width="360px"
      align-center
    >
      <div v-if="runeStoneListLoading" class="text-center py-6">
        <span class="animate-spin inline-block text-2xl">⏳</span>
      </div>
      <div
        v-else-if="availableRuneStones.length === 0"
        class="text-center py-6 text-gray-400"
      >
        暂无可用符文石
      </div>
      <div v-else class="space-y-2 max-h-60 overflow-y-auto">
        <div
          v-for="rs in availableRuneStones"
          :key="rs._id"
          class="flex items-center justify-between p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-yellow-400 cursor-pointer transition-colors"
          @click="handleEquip(rs._id)"
        >
          <div>
            <span :class="rarityClass(rs.rarity)" class="text-sm font-semibold">
              {{ rarityName(rs.rarity) }}
            </span>
            <span class="text-xs text-gray-500 ml-1">Lv.{{ rs.level }}</span>
          </div>
          <el-button
            type="primary"
            size="small"
            :loading="equipLoading"
            :disabled="equipLoading"
          >
            装备
          </el-button>
        </div>
      </div>
    </el-dialog>

    <!-- ==================== 符文石详情弹窗 ==================== -->
    <el-dialog
      v-model="runeStoneDetailVisible"
      :title="runeStoneDetailTitle"
      width="360px"
      align-center
    >
      <div v-if="runeStoneDetailData" class="space-y-4">
        <!-- 基本信息 -->
        <div class="text-center">
          <div
            class="inline-flex w-16 h-16 rounded-2xl items-center justify-center text-3xl mb-2"
            :class="rarityBgClass(runeStoneDetailData.rarity)"
          >
            💎
          </div>
          <p
            class="text-lg font-bold"
            :class="rarityClass(runeStoneDetailData.rarity)"
          >
            {{ rarityName(runeStoneDetailData.rarity) }}符文石
          </p>
          <p class="text-sm text-gray-400">
            等级 {{ runeStoneDetailData.level }}
          </p>
        </div>

        <!-- 主动技能 -->
        <div>
          <h4 class="text-sm font-semibold text-yellow-500 mb-2">
            ⚡ 主动技能
          </h4>
          <div
            v-for="(skill, idx) in runeStoneDetailData.activeSkills"
            :key="idx"
            class="text-xs text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-lg px-3 py-2 mb-1"
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
                    elementNameForSkill(
                      getSkillInfo(skill.skillId || skill).element
                    )
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
            v-for="(buff, idx) in runeStoneDetailData.passiveBuffs"
            :key="idx"
            class="text-xs text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-lg px-3 py-2 mb-1 flex justify-between"
          >
            <span>{{ buffTypeName(buff.buffType) }}</span>
            <span class="font-mono text-yellow-500">+{{ buff.buffLevel }}</span>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  getMyAdventurersApi,
  getAdventurerDetailApi,
  recruitAdventurerApi,
  customizeAvatarApi,
  customizeNameApi,
  levelUpStatApi,
  equipRuneStoneApi,
  unequipRuneStoneApi
} from '@/api/game/adventurer.js'
import { getMyRuneStonesApi } from '@/api/game/runeStone.js'
import { getMyInventoryApi } from '@/api/game/inventory.js'
import { getGameSettingsApi } from '@/api/game/config.js'
import { useGameUser } from '@/composables/useGameUser.js'
import {
  runeStoneActiveSkillDataBase,
  passiveBuffTypeDataBase,
  attackPreferenceDataBase
} from 'shared/utils/gameDatabase.js'
import Cropper from '@/components/Cropper.vue'

const router = useRouter()
const { isLoggedIn, fetchPlayerInfo, playerInfo } = useGameUser()

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
const inventory = ref(null)

// ── 元素映射 ──
const ELEMENT_MAP = {
  1: { name: '地', color: '#a0855b' },
  2: { name: '水', color: '#4fa3e0' },
  3: { name: '火', color: '#e05c4f' },
  4: { name: '风', color: '#6abf69' },
  5: { name: '光明', color: '#f5c842' },
  6: { name: '黑暗', color: '#7c5cbf' }
}

const STAT_LIST = [
  { key: 'attack', levelKey: 'attackLevel', name: '攻击', icon: '⚔️' },
  { key: 'defense', levelKey: 'defenseLevel', name: '防御', icon: '🛡️' },
  { key: 'speed', levelKey: 'speedLevel', name: '速度', icon: '💨' },
  { key: 'san', levelKey: 'SANLevel', name: 'SAN值', icon: '🌀' }
]

function getElementColor(el) {
  return ELEMENT_MAP[el]?.color || '#999'
}
function getElementName(el) {
  return ELEMENT_MAP[el]?.name || el
}
const passiveBuffMap = computed(() => {
  const map = new Map()
  for (const item of passiveBuffTypeDataBase()) {
    map.set(item.value, item.label)
  }
  return map
})
const attackPreferenceMap = computed(() => {
  const map = new Map()
  for (const item of attackPreferenceDataBase()) {
    map.set(item.value, item.label)
  }
  return map
})
function getPassiveBuffName(type) {
  if (!type) return '—'
  return passiveBuffMap.value.get(type) || type
}
function getAttackPreferenceName(type) {
  if (!type) return '—'
  return attackPreferenceMap.value.get(type) || type
}


function rarityName(r) {
  return { normal: '普通', rare: '稀有', legendary: '传说' }[r] || r
}
function rarityClass(r) {
  return (
    {
      normal: 'text-gray-500',
      rare: 'text-blue-500',
      legendary: 'text-yellow-500'
    }[r] || ''
  )
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

// ── 背包（水晶数量） ──
async function fetchInventory() {
  try {
    const res = await getMyInventoryApi()
    inventory.value = res.data.data || null
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
  } catch (e) {
    // 错误已由拦截器处理
  } finally {
    recruiting.value = false
  }
}

// ── 详情弹窗 ──
const detailVisible = ref(false)
const detailAdv = ref(null)

async function openDetail(adv) {
  detailAdv.value = { ...adv }
  detailVisible.value = true
  // 加载完整详情（含符文石 populate）
  try {
    const res = await getAdventurerDetailApi(adv._id)
    detailAdv.value = res.data.data
  } catch {
    // fallback to basic data
  }
}

// ── 属性升级 ──
const levelUpLoading = ref(false)
async function handleLevelUp(stat) {
  if (!detailAdv.value) return
  levelUpLoading.value = true
  try {
    const res = await levelUpStatApi(detailAdv.value._id, { statType: stat })
    ElMessage.success('升级成功！')
    detailAdv.value = res.data.data
    // 同步列表
    const idx = adventurers.value.findIndex(a => a._id === detailAdv.value._id)
    if (idx >= 0) adventurers.value[idx] = { ...detailAdv.value }
    await Promise.all([fetchPlayerInfo(), fetchInventory()])
  } catch (e) {
    // 错误已由拦截器处理
  } finally {
    levelUpLoading.value = false
  }
}

// ── 自定义头像 ──
const showAvatarDialog = ref(false)
const avatarPreview = ref('')
const avatarBase64 = ref('')
const avatarSaving = ref(false)

function onAvatarCrop(base64) {
  avatarBase64.value = base64
  avatarPreview.value = base64
}

async function handleSaveAvatar() {
  if (!detailAdv.value || !avatarBase64.value) return
  avatarSaving.value = true
  try {
    await customizeAvatarApi(detailAdv.value._id, {
      avatar: avatarBase64.value
    })
    ElMessage.success('头像修改成功！')
    showAvatarDialog.value = false
    avatarBase64.value = ''
    avatarPreview.value = ''
    // 刷新详情
    const res = await getAdventurerDetailApi(detailAdv.value._id)
    detailAdv.value = res.data.data
    const idx = adventurers.value.findIndex(a => a._id === detailAdv.value._id)
    if (idx >= 0) adventurers.value[idx] = { ...detailAdv.value }
    await fetchPlayerInfo()
  } catch (e) {
    // 错误已由拦截器处理
  } finally {
    avatarSaving.value = false
  }
}

// ── 自定义名字 ──
const showNameDialog = ref(false)
const newName = ref('')
const nameSaving = ref(false)

async function handleSaveName() {
  if (!detailAdv.value || !newName.value) return
  nameSaving.value = true
  try {
    const res = await customizeNameApi(detailAdv.value._id, {
      name: newName.value
    })
    ElMessage.success('名字修改成功！')
    showNameDialog.value = false
    detailAdv.value = res.data.data
    const idx = adventurers.value.findIndex(a => a._id === detailAdv.value._id)
    if (idx >= 0) adventurers.value[idx] = { ...detailAdv.value }
    newName.value = ''
    await fetchPlayerInfo()
  } catch (e) {
    // 错误已由拦截器处理
  } finally {
    nameSaving.value = false
  }
}

// ── 装备符文石 ──
const showEquipDialog = ref(false)
const availableRuneStones = ref([])
const runeStoneListLoading = ref(false)
const equipLoading = ref(false)
const unequipLoading = ref(false)

watch(showEquipDialog, async val => {
  if (val) {
    runeStoneListLoading.value = true
    try {
      const res = await getMyRuneStonesApi({ equipped: 'false' })
      // 过滤等级 <= 冒险家综合等级
      const compLevel = detailAdv.value?.comprehensiveLevel || 4
      availableRuneStones.value = (res.data.data?.list || []).filter(
        rs => rs.level <= compLevel
      )
    } catch {
      availableRuneStones.value = []
    } finally {
      runeStoneListLoading.value = false
    }
  }
})

async function handleEquip(runeStoneId) {
  if (!detailAdv.value) return
  equipLoading.value = true
  try {
    const res = await equipRuneStoneApi(detailAdv.value._id, { runeStoneId })
    ElMessage.success('装备成功！')
    showEquipDialog.value = false
    detailAdv.value = res.data.data
    const idx = adventurers.value.findIndex(a => a._id === detailAdv.value._id)
    if (idx >= 0) adventurers.value[idx] = { ...detailAdv.value }
  } catch (e) {
    // 错误已由拦截器处理
  } finally {
    equipLoading.value = false
  }
}

async function handleUnequip() {
  if (!detailAdv.value) return
  unequipLoading.value = true
  try {
    const res = await unequipRuneStoneApi(detailAdv.value._id)
    ElMessage.success('卸下成功！')
    detailAdv.value = res.data.data
    const idx = adventurers.value.findIndex(a => a._id === detailAdv.value._id)
    if (idx >= 0) adventurers.value[idx] = { ...detailAdv.value }
  } catch (e) {
    // 错误已由拦截器处理
  } finally {
    unequipLoading.value = false
  }
}

// ── 符文石详情弹窗 ──
const runeStoneDetailVisible = ref(false)
const runeStoneDetailData = ref(null)

const runeStoneDetailTitle = computed(() => {
  if (!runeStoneDetailData.value) return '符文石详情'
  return `${rarityName(runeStoneDetailData.value.rarity)}符文石 Lv.${runeStoneDetailData.value.level}`
})

function openRuneStoneDetail(rs) {
  runeStoneDetailData.value = { ...rs }
  runeStoneDetailVisible.value = true
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

function elementNameForSkill(el) {
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

// ── 初始化 ──
onMounted(() => {
  fetchAdventurers()
  fetchGameSettings()
  fetchInventory()
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

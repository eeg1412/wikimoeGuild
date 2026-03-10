<template>
  <el-dialog
    v-model="visible"
    :title="adventurer?.name || '冒险家详情'"
    align-center
    destroy-on-close
    class="rpg-dialog game-dialog"
    v-bind="detailLockProps"
    append-to-body
  >
    <div v-if="adventurer" class="flex flex-col items-center gap-3 pt-2">
      <!-- 头像 -->
      <div
        class="relative"
        :class="{ 'cursor-pointer': showManage }"
        @click="handleAvatarClick"
      >
        <GameAdventurerAvatar
          :adventurer="adventurer"
          :alt="adventurer.name"
          class="w-20 h-20 rounded-full object-cover border-4"
          :style="{ borderColor: getElementColor(adventurer.elements) }"
        />
        <div
          class="absolute -top-1 -right-1 w-5 h-5 rotate-45 border-2 border-white dark:border-gray-700 shadow"
          :style="{ backgroundColor: getElementColor(adventurer.elements) }"
        />
        <!-- 标记图标 -->
        <span
          v-if="adventurer.roleTag && ROLE_TAG_MAP[adventurer.roleTag]"
          class="absolute bottom-0 right-0 rounded-tl text-sm leading-none p-1"
        >
          {{ ROLE_TAG_MAP[adventurer.roleTag].emoji }}
        </span>
        <!-- 编辑提示 -->
        <div
          v-if="showManage"
          class="absolute bottom-0 right-0 bg-black/60 rounded-full px-1.5 py-0.5 text-[10px] text-white"
        >
          ✏️
        </div>
      </div>

      <!-- 名字 -->
      <div class="flex items-center gap-2">
        <p class="text-lg font-bold text-gray-800 dark:text-gray-100">
          {{ adventurer.name }}
        </p>
        <el-button
          v-if="showManage"
          text
          size="small"
          @click="showNameDialog = true"
        >
          ✏️
        </el-button>
      </div>

      <!-- 基本信息 -->
      <div class="w-full space-y-1.5 text-sm">
        <!-- 元素 -->
        <div
          class="info-row bg-gray-50 dark:bg-gray-800 rounded p-1.5"
          :class="{ 'text-center': showManage }"
        >
          <span class="info-label">元素</span>
          <div v-if="showManage" class="flex items-center gap-1">
            <span
              class="info-value font-semibold"
              :style="{ color: getElementColor(adventurer.elements) }"
            >
              {{ getElementName(adventurer.elements) }}
            </span>
            <el-button
              type="warning"
              text
              size="small"
              :loading="rerollLoading"
              :disabled="rerollLoading"
              @click="handleReroll('element')"
            >
              🎲 {{ gameSettings.adventurerRerollElementPrice ?? 1000 }}金
            </el-button>
          </div>
          <span
            v-else
            class="info-value font-semibold"
            :style="{ color: getElementColor(adventurer.elements) }"
          >
            {{ getElementName(adventurer.elements) }}
          </span>
        </div>

        <!-- 被动增益 -->
        <div
          class="info-row bg-gray-50 dark:bg-gray-800 rounded p-1.5"
          :class="{ 'text-center': showManage }"
        >
          <span class="info-label">被动增益</span>
          <div
            v-if="showManage"
            class="flex items-center gap-1 flex-wrap justify-end"
            style="max-width: 65%"
          >
            <span class="info-value text-sm text-right">
              {{ getPassiveBuffName(adventurer.passiveBuffType) }}
            </span>
            <el-button
              type="warning"
              text
              size="small"
              :loading="rerollLoading"
              :disabled="rerollLoading"
              @click="handleReroll('passiveBuff')"
            >
              🎲 {{ gameSettings.adventurerRerollPassiveBuffPrice ?? 1000 }}金
            </el-button>
          </div>
          <span
            v-else
            class="info-value text-sm text-right"
            style="max-width: 60%"
          >
            {{ getPassiveBuffName(adventurer.passiveBuffType) }}
          </span>
        </div>

        <!-- 攻击偏好 -->
        <div
          class="info-row bg-gray-50 dark:bg-gray-800 rounded p-1.5"
          :class="{ 'text-center': showManage }"
        >
          <span class="info-label">攻击偏好</span>
          <div
            v-if="showManage"
            class="flex items-center gap-1 flex-wrap justify-end"
          >
            <span class="info-value text-sm">
              {{ getAttackPreferenceName(adventurer.attackPreference) }}
            </span>
            <el-button
              type="warning"
              text
              size="small"
              :loading="rerollLoading"
              :disabled="rerollLoading"
              @click="handleReroll('attackPreference')"
            >
              🎲
              {{ gameSettings.adventurerRerollAttackPreferencePrice ?? 1000 }}金
            </el-button>
          </div>
          <span v-else class="info-value text-sm">
            {{ getAttackPreferenceName(adventurer.attackPreference) }}
          </span>
        </div>

        <!-- 综合等级 -->
        <div class="info-row bg-gray-50 dark:bg-gray-800 rounded p-1.5">
          <span class="info-label">综合等级</span>
          <span class="info-value rpg-number">
            {{ adventurer.comprehensiveLevel }}
            <span class="text-xs text-gray-400 font-normal">
              / {{ maxCompLevel }}</span
            >
          </span>
        </div>

        <!-- 战斗力 -->
        <div class="info-row bg-gray-50 dark:bg-gray-800 rounded p-1.5">
          <span class="info-label">战斗力</span>
          <span class="info-value rpg-number text-orange-500">
            {{ combatPower }}
          </span>
        </div>

        <!-- 角色标记 -->
        <div class="info-row bg-gray-50 dark:bg-gray-800 rounded p-1.5">
          <span class="info-label">角色标记</span>
          <div class="flex items-center gap-2">
            <span
              v-for="tag in ROLE_TAGS"
              :key="tag.value"
              class="cursor-pointer text-xl px-1 py-0.5 rounded"
              :class="[
                adventurer.roleTag === tag.value
                  ? 'bg-yellow-200 dark:bg-yellow-700'
                  : '',
                roleTagLoading ? 'opacity-50 pointer-events-none' : ''
              ]"
              :title="tag.label"
              @click="handleSetRoleTag(tag.value)"
            >
              {{ tag.emoji }}
            </span>
          </div>
        </div>

        <el-divider class="my-1.5!" />

        <!-- 资源信息（管理模式） -->
        <template v-if="showManage">
          <div class="w-full grid grid-cols-1 gap-2 text-sm">
            <div
              class="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-2 text-center"
            >
              <p class="text-xs text-gray-400">🪙 金币</p>
              <p class="text-sm font-bold text-yellow-500">
                {{ (playerInfo?.gold ?? 0).toLocaleString() }}
              </p>
            </div>
          </div>
          <div class="w-full grid grid-cols-4 gap-1 text-sm mt-1">
            <div
              v-for="cType in CRYSTAL_TYPES"
              :key="cType.key"
              class="bg-gray-50 dark:bg-gray-800 rounded p-1.5 text-center cursor-pointer hover:ring-1 ring-yellow-400 transition"
            >
              <p class="text-xs text-gray-400">{{ cType.icon }}水晶</p>
              <p class="text-sm font-mono text-gray-600 dark:text-gray-300">
                {{ inventory?.[cType.key] ?? 0 }}
              </p>
              <el-button
                type="warning"
                size="small"
                @click.stop="openQuickSellDialog(cType.key)"
              >
                出售
              </el-button>
            </div>
          </div>
          <el-divider class="my-1.5!" />
        </template>

        <!-- 最终属性计算 -->
        <AdventurerFinalStats :adventurer="adventurer" />

        <el-divider class="my-1.5!" />

        <!-- 属性升级区 -->
        <template v-if="showLevelUp">
          <StatLevelUpPanel
            :adventurer="adventurer"
            @updated="handleStatUpdated"
          />
          <el-divider class="my-1.5!" />
        </template>

        <!-- 符文石 -->
        <div class="info-row">
          <span class="info-label">💎 符文石</span>
          <div class="flex items-center gap-1">
            <template v-if="adventurer.runeStone">
              <span
                class="text-sm cursor-pointer hover:underline"
                :class="rarityClass(adventurer.runeStone.rarity)"
                @click="handleToggleRuneStoneDetail"
              >
                {{ rarityName(adventurer.runeStone.rarity) }} Lv.{{
                  adventurer.runeStone.level
                }}
                <span v-if="runeStoneDetailExpanded">▲</span>
                <span v-else>▼</span>
              </span>
              <template v-if="showManage">
                <el-dropdown trigger="click" @command="handleRuneStoneCommand">
                  <el-button type="primary" size="small">
                    操作
                    <el-icon class="el-icon--right"><ArrowDown /></el-icon>
                  </el-button>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item
                        command="unequip"
                        :disabled="unequipLoading"
                      >
                        卸下
                      </el-dropdown-item>
                      <el-dropdown-item
                        command="replace"
                        :disabled="runeStoneListLoading"
                      >
                        替换
                      </el-dropdown-item>
                      <el-dropdown-item command="synthesis">
                        合成
                      </el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </template>
            </template>
            <template v-else>
              <span class="text-sm text-gray-400">无</span>
              <el-button
                v-if="showManage"
                type="primary"
                size="small"
                :disabled="runeStoneListLoading"
                @click="handleOpenEquipDialog"
              >
                装备
              </el-button>
            </template>
          </div>
        </div>

        <!-- 符文石详情展开 -->
        <div
          v-if="runeStoneDetailExpanded && adventurer.runeStone"
          class="mt-1 space-y-2"
        >
          <RuneStoneInfoCard :rune-stone="adventurer.runeStone" />
          <!-- 符文石升级按钮 -->
          <div class="flex items-center justify-between">
            <span class="text-xs text-gray-400">
              升级消耗：{{ runeStoneUpgradeCost }} 碎片
              <span class="ml-1 text-purple-400">
                (持有 {{ inventory?.runeFragment ?? 0 }})
              </span>
            </span>
            <el-button
              type="primary"
              size="small"
              :loading="runeStoneUpgradeLoading"
              :disabled="runeStoneUpgradeLoading || !canUpgradeRuneStone"
              @click="handleUpgradeRuneStone"
            >
              升级符文石
            </el-button>
          </div>
          <p
            v-if="adventurer.runeStone.level >= adventurer.comprehensiveLevel"
            class="text-xs text-red-400 text-center"
          >
            符文石等级已达冒险家综合等级上限 (Lv.{{
              adventurer.comprehensiveLevel
            }})
          </p>
        </div>

        <!-- 外部插槽 -->
        <slot name="footer" />
      </div>
    </div>
  </el-dialog>

  <!-- ==================== 自定义头像弹窗 ==================== -->
  <el-dialog
    v-if="showManage"
    v-model="showAvatarDialog"
    title="自定义头像"
    width="360px"
    align-center
    destroy-on-close
    v-bind="avatarLockProps"
    append-to-body
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
    v-if="showManage"
    v-model="showNameDialog"
    title="自定义名字"
    width="320px"
    align-center
    destroy-on-close
    v-bind="nameLockProps"
    append-to-body
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
    v-if="showManage"
    v-model="showEquipDialog"
    title="选择符文石"
    align-center
    destroy-on-close
    v-bind="equipLockProps"
    append-to-body
  >
    <RuneStoneSelectPanel
      :rune-stones="availableRuneStones"
      :loading="runeStoneListLoading"
      :adventurer="adventurer"
      @select="handleEquipSelect"
    >
      <template #action="{ runeStone }">
        <el-button
          type="primary"
          size="small"
          :loading="equipLoading"
          :disabled="equipLoading"
          @click.stop="handleEquip(runeStone._id)"
        >
          装备
        </el-button>
      </template>
    </RuneStoneSelectPanel>
  </el-dialog>

  <!-- ==================== 符文石合成组件 ==================== -->
  <RuneStoneSynthesisDialog
    v-if="showManage && adventurer"
    ref="synthesisDialogRef"
    :adventurer-id="adventurer._id"
    @updated="onSynthesisUpdated"
  />

  <!-- ===== 快速出售水晶弹窗 ===== -->
  <el-dialog
    v-if="showManage"
    v-model="quickSellVisible"
    :title="`快速出售 ${quickSellCrystalLabel}`"
    width="320px"
    align-center
    destroy-on-close
    v-bind="detailQuickSellLockProps"
    append-to-body
  >
    <div class="space-y-3">
      <p class="text-sm text-gray-500 dark:text-gray-400">
        当前持有:
        <span class="font-bold text-yellow-500">
          {{ inventory?.[quickSellCrystalType] ?? 0 }}
        </span>
      </p>
      <p class="text-xs text-gray-400">
        收购单价:
        <span class="text-yellow-500 font-semibold"
          >🪙 {{ gameSettings?.officialCrystalBuyPrice ?? 100 }}</span
        >
      </p>
      <div class="flex">
        <el-button
          size="small"
          :loading="quickSellLoading"
          :disabled="quickSellLoading"
          @click="handleQuickSell(10)"
        >
          出售 10
        </el-button>
        <el-button
          size="small"
          :loading="quickSellLoading"
          :disabled="quickSellLoading"
          @click="handleQuickSell(100)"
        >
          出售 100
        </el-button>
        <el-button
          size="small"
          :loading="quickSellLoading"
          :disabled="quickSellLoading"
          @click="handleQuickSell(1000)"
        >
          出售 1000
        </el-button>
      </div>
      <div class="flex items-center gap-2">
        <el-input-number
          v-model="quickSellCustomAmount"
          :min="1"
          :max="99999"
          size="small"
          class="flex-1"
        />
        <el-button
          type="primary"
          size="small"
          :loading="quickSellLoading"
          :disabled="quickSellLoading"
          @click="handleQuickSell(quickSellCustomAmount)"
        >
          出售
        </el-button>
      </div>
      <div class="text-sm text-gray-400">
        预计获得:
        <span class="text-yellow-500 font-semibold"
          >🪙
          {{
            (
              quickSellCustomAmount *
              (gameSettings?.officialCrystalBuyPrice ?? 100)
            ).toLocaleString()
          }}</span
        >
      </div>
    </div>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowDown } from '@element-plus/icons-vue'
import {
  getAdventurerDetailApi,
  setRoleTagApi,
  customizeAvatarApi,
  customizeNameApi,
  equipRuneStoneApi,
  unequipRuneStoneApi,
  rerollAttributeApi
} from '@/api/game/adventurer.js'
import {
  getMyRuneStonesApi,
  upgradeRuneStoneApi
} from '@/api/game/runeStone.js'
import { getMyInventoryApi } from '@/api/game/inventory.js'
import { getGameSettingsApi } from '@/api/game/config.js'
import { sellCrystalToOfficialApi } from '@/api/game/market.js'
import { useGameUser } from '@/composables/useGameUser.js'
import {
  passiveBuffTypeDataBase,
  attackPreferenceDataBase
} from 'shared/utils/gameDatabase.js'
import { ROLE_TAG_MAP } from 'shared/constants/index.js'
import RuneStoneInfoCard from '@/components/RuneStoneInfoCard.vue'
import RuneStoneSelectPanel from '@/components/RuneStoneSelectPanel.vue'
import RuneStoneSynthesisDialog from '@/components/RuneStoneSynthesisDialog.vue'
import AdventurerFinalStats from '@/components/AdventurerFinalStats.vue'
import StatLevelUpPanel from '@/components/StatLevelUpPanel.vue'
import Cropper from '@/components/Cropper.vue'
import { getMaxComprehensiveLevel } from 'shared/utils/guildLevelUtils.js'
import { calculateCombatPower } from 'shared/utils/gameDatabase.js'
import { useDialogRoute } from '@/composables/useDialogRoute.js'
import { useDialogLock } from '@/composables/useDialogLock.js'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  adventurerId: { type: String, default: '' },
  showLevelUp: { type: Boolean, default: true },
  /** 管理模式：显示头像编辑、名字编辑、洗属性、资源显示、符文石装备/卸下、水晶出售 */
  showManage: { type: Boolean, default: false }
})

const emit = defineEmits(['update:modelValue', 'updated'])

// ── 冒险家数据 ──
const adventurer = ref(null)
const dataLoading = ref(false)

const visible = computed({
  get: () =>
    props.modelValue && !dataLoading.value && adventurer.value !== null,
  set: val => {
    if (!val) {
      emit('update:modelValue', false)
    }
  }
})

const { fetchPlayerInfo, playerInfo } = useGameUser()

// ── 公会等级限制计算 ──
const maxCompLevel = computed(() => {
  return getMaxComprehensiveLevel(playerInfo.value?.guildLevel || 1)
})

// ── 战斗力 ──
const combatPower = computed(() => {
  if (!adventurer.value) return 0
  return calculateCombatPower(
    adventurer.value,
    adventurer.value.runeStone || null
  )
})

// ── 管理模式数据 ──
const gameSettings = ref({})
const inventory = ref(null)

// ── 常量 ──

const CRYSTAL_TYPES = [
  { key: 'attackCrystal', icon: '⚔️', label: '攻击水晶' },
  { key: 'defenseCrystal', icon: '🛡️', label: '防御水晶' },
  { key: 'speedCrystal', icon: '💨', label: '速度水晶' },
  { key: 'sanCrystal', icon: '❤️', label: 'SAN水晶' }
]

const ROLE_TAGS = Object.entries(ROLE_TAG_MAP).map(
  ([value, { emoji, label }]) => ({
    value,
    emoji,
    label
  })
)

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

// ── 被动增益与攻击偏好 ──
const passiveMap = computed(() => {
  const map = new Map()
  for (const bt of passiveBuffTypeDataBase()) {
    map.set(bt.value, bt.label)
  }
  return map
})

const preferenceMap = computed(() => {
  const map = new Map()
  for (const p of attackPreferenceDataBase()) {
    map.set(p.value, p.label)
  }
  return map
})

function getPassiveBuffName(v) {
  return v ? passiveMap.value.get(v) || v : '—'
}

function getAttackPreferenceName(v) {
  return v ? preferenceMap.value.get(v) || v : '—'
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

// ── 加载数据 ──
watch(
  () => props.modelValue,
  async val => {
    if (val && props.adventurerId) {
      adventurer.value = null
      dataLoading.value = true
      runeStoneDetailExpanded.value = true
      try {
        const res = await getAdventurerDetailApi(props.adventurerId)
        adventurer.value = res.data.data
        // 管理模式下加载额外数据
        if (props.showManage) {
          fetchManageData()
        }
      } catch {
        emit('update:modelValue', false)
      } finally {
        dataLoading.value = false
      }
    } else if (!val) {
      adventurer.value = null
    }
  }
)

async function fetchManageData() {
  try {
    const [settingsRes, inventoryRes] = await Promise.all([
      getGameSettingsApi(),
      getMyInventoryApi()
    ])
    gameSettings.value = settingsRes.data.data || {}
    inventory.value = inventoryRes.data.data || null
  } catch {
    // ignore
  }
}

// ── 角色标记 ──
const roleTagLoading = ref(false)

async function handleSetRoleTag(tagValue) {
  if (!adventurer.value || roleTagLoading.value) return
  const newTag = adventurer.value.roleTag === tagValue ? '' : tagValue
  roleTagLoading.value = true
  try {
    const res = await setRoleTagApi(adventurer.value._id, { roleTag: newTag })
    adventurer.value = res.data.data
    emit('updated', adventurer.value)
  } catch {
    // handled by interceptor
  } finally {
    roleTagLoading.value = false
  }
}

// ── 属性升级/降级（委托给 StatLevelUpPanel） ──
function handleStatUpdated(updatedAdv) {
  adventurer.value = updatedAdv
  emit('updated', adventurer.value)
}

// ── 符文石详情 ──
const runeStoneDetailExpanded = ref(true)

function handleToggleRuneStoneDetail() {
  runeStoneDetailExpanded.value = !runeStoneDetailExpanded.value
}

// ── 符文石操作下拉 ──
function handleRuneStoneCommand(command) {
  if (command === 'unequip') handleUnequip()
  else if (command === 'replace') handleOpenEquipDialog()
  else if (command === 'synthesis') handleOpenSynthesis()
}

// ── 符文石合成（委托给 RuneStoneSynthesisDialog 组件） ──
const synthesisDialogRef = ref(null)

function handleOpenSynthesis() {
  if (!adventurer.value?.runeStone) return
  synthesisDialogRef.value?.open(
    adventurer.value.runeStone,
    adventurer.value.comprehensiveLevel
  )
}

function onSynthesisUpdated(updatedAdventurer) {
  adventurer.value = updatedAdventurer
  emit('updated', updatedAdventurer)
}

// ── 符文石升级 ──
const runeStoneUpgradeCost = computed(() => {
  if (!adventurer.value?.runeStone) return 0
  const rs = adventurer.value.runeStone
  const costCoeff = {
    normal: gameSettings.value.runeStoneUpgradeNormalBase ?? 100,
    rare: gameSettings.value.runeStoneUpgradeRareBase ?? 1000,
    legendary: gameSettings.value.runeStoneUpgradeLegendaryBase ?? 5000
  }
  return (costCoeff[rs.rarity] || costCoeff.normal) * rs.level
})

const canUpgradeRuneStone = computed(() => {
  if (!adventurer.value?.runeStone) return false
  return adventurer.value.runeStone.level < adventurer.value.comprehensiveLevel
})

const runeStoneUpgradeLoading = ref(false)

async function handleUpgradeRuneStone() {
  if (!adventurer.value?.runeStone) return
  runeStoneUpgradeLoading.value = true
  try {
    const res = await upgradeRuneStoneApi(adventurer.value.runeStone._id)
    ElMessage.success({ message: '符文石升级成功！', showClose: true })
    // 更新符文石数据
    adventurer.value.runeStone = res.data.data
    emit('updated', adventurer.value)
  } catch {
    // handled by interceptor
  } finally {
    runeStoneUpgradeLoading.value = false
  }
}

// ── 洗属性（管理模式） ──
const rerollLoading = ref(false)
const REROLL_TYPE_LABEL = {
  element: '元素',
  passiveBuff: '被动增益',
  attackPreference: '攻击偏好'
}
const REROLL_PRICE_KEY = {
  element: 'adventurerRerollElementPrice',
  passiveBuff: 'adventurerRerollPassiveBuffPrice',
  attackPreference: 'adventurerRerollAttackPreferencePrice'
}

async function handleReroll(rerollType) {
  if (!adventurer.value || !props.showManage) return
  const label = REROLL_TYPE_LABEL[rerollType]
  const priceKey = REROLL_PRICE_KEY[rerollType]
  const price = gameSettings.value[priceKey] ?? 1000
  try {
    await ElMessageBox.confirm(
      `确定花费 ${price} 金币随机更换${label}？`,
      `洗${label}`,
      { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' }
    )
  } catch {
    return
  }
  rerollLoading.value = true
  try {
    const res = await rerollAttributeApi(adventurer.value._id, { rerollType })
    ElMessage.success({ message: `${label}已更换！`, showClose: true })
    adventurer.value = res.data.data
    emit('updated', adventurer.value)
    await fetchPlayerInfo()
  } catch {
    // handled by interceptor
  } finally {
    rerollLoading.value = false
  }
}

// ── 自定义头像（管理模式） ──
const { visible: showAvatarDialog } = useDialogRoute('avatar')
const avatarPreview = ref('')
const avatarBase64 = ref('')
const avatarSaving = ref(false)

function handleAvatarClick() {
  if (props.showManage) {
    showAvatarDialog.value = true
  }
}

function onAvatarCrop(base64) {
  avatarBase64.value = base64
  avatarPreview.value = base64
}

async function handleSaveAvatar() {
  if (!adventurer.value || !avatarBase64.value) return
  avatarSaving.value = true
  try {
    await customizeAvatarApi(adventurer.value._id, {
      avatar: avatarBase64.value
    })
    ElMessage.success({ message: '头像修改成功！', showClose: true })
    showAvatarDialog.value = false
    avatarBase64.value = ''
    avatarPreview.value = ''
    const res = await getAdventurerDetailApi(adventurer.value._id)
    adventurer.value = res.data.data
    emit('updated', adventurer.value)
    await fetchPlayerInfo()
  } catch {
    // handled by interceptor
  } finally {
    avatarSaving.value = false
  }
}

// ── 自定义名字（管理模式） ──
const { visible: showNameDialog } = useDialogRoute('advName')
const newName = ref('')
const nameSaving = ref(false)

async function handleSaveName() {
  if (!adventurer.value || !newName.value) return
  nameSaving.value = true
  try {
    const res = await customizeNameApi(adventurer.value._id, {
      name: newName.value
    })
    ElMessage.success({ message: '名字修改成功！', showClose: true })
    showNameDialog.value = false
    adventurer.value = res.data.data
    emit('updated', adventurer.value)
    newName.value = ''
    await fetchPlayerInfo()
  } catch {
    // handled by interceptor
  } finally {
    nameSaving.value = false
  }
}

// ── 装备/卸下符文石（管理模式） ──
const { visible: showEquipDialog } = useDialogRoute('equipRuneStone')
const availableRuneStones = ref([])
const runeStoneListLoading = ref(false)
const equipLoading = ref(false)
const unequipLoading = ref(false)

async function handleOpenEquipDialog() {
  if (runeStoneListLoading.value) return
  runeStoneListLoading.value = true
  try {
    const res = await getMyRuneStonesApi({ equipped: 'false', pageSize: 1000 })
    const compLevel = adventurer.value?.comprehensiveLevel || 4
    availableRuneStones.value = (res.data.data?.list || []).filter(
      rs => rs.level <= compLevel
    )
  } catch {
    availableRuneStones.value = []
  } finally {
    runeStoneListLoading.value = false
  }
  // 数据加载完成后才弹出对话框
  showEquipDialog.value = true
}

async function handleEquip(runeStoneId) {
  if (!adventurer.value) return
  equipLoading.value = true
  try {
    const res = await equipRuneStoneApi(adventurer.value._id, { runeStoneId })
    ElMessage.success({ message: '装备成功！', showClose: true })
    showEquipDialog.value = false
    adventurer.value = res.data.data
    emit('updated', adventurer.value)
  } catch {
    // handled by interceptor
  } finally {
    equipLoading.value = false
  }
}

function handleEquipSelect(rs) {
  handleEquip(rs._id)
}

async function handleUnequip() {
  if (!adventurer.value) return
  unequipLoading.value = true
  try {
    const res = await unequipRuneStoneApi(adventurer.value._id)
    ElMessage.success({ message: '卸下成功！', showClose: true })
    adventurer.value = res.data.data
    emit('updated', adventurer.value)
  } catch {
    // handled by interceptor
  } finally {
    unequipLoading.value = false
  }
}

// ── 快速出售水晶（管理模式） ──
const { visible: quickSellVisible } = useDialogRoute('quickSell')
const quickSellCrystalType = ref('attackCrystal')
const quickSellCustomAmount = ref(10)
const quickSellLoading = ref(false)

// 合并所有操作 loading 状态
const detailAnyLoading = computed(
  () =>
    roleTagLoading.value ||
    rerollLoading.value ||
    runeStoneUpgradeLoading.value ||
    equipLoading.value ||
    unequipLoading.value ||
    avatarSaving.value ||
    nameSaving.value ||
    quickSellLoading.value
)
const { dialogLockProps: detailLockProps } = useDialogLock(
  () => detailAnyLoading.value
)
const { dialogLockProps: avatarLockProps } = useDialogLock(
  () => avatarSaving.value
)
const { dialogLockProps: nameLockProps } = useDialogLock(() => nameSaving.value)
const { dialogLockProps: equipLockProps } = useDialogLock(
  () => equipLoading.value
)
const { dialogLockProps: detailQuickSellLockProps } = useDialogLock(
  () => quickSellLoading.value
)

const quickSellCrystalLabel = computed(() => {
  return (
    CRYSTAL_TYPES.find(c => c.key === quickSellCrystalType.value)?.label ||
    '水晶'
  )
})

function openQuickSellDialog(crystalType) {
  quickSellCrystalType.value = crystalType
  quickSellCustomAmount.value = 10
  quickSellVisible.value = true
}

async function handleQuickSell(amount) {
  if (!amount || amount <= 0) return
  quickSellLoading.value = true
  try {
    const res = await sellCrystalToOfficialApi({
      crystalType: quickSellCrystalType.value,
      quantity: amount
    })
    const { goldEarned } = res.data.data
    ElMessage.success({
      message: `出售成功，获得 ${goldEarned} 金币`,
      showClose: true
    })
    await Promise.all([
      getMyInventoryApi().then(r => {
        inventory.value = r.data.data
      }),
      fetchPlayerInfo()
    ])
  } catch {
    // handled by interceptor
  } finally {
    quickSellLoading.value = false
  }
}
</script>

<style scoped>
.info-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.info-label {
  color: #9ca3af;
  white-space: nowrap;
  font-size: 13px;
}
.info-value {
  text-align: right;
}
.rpg-number {
  font-family: monospace;
  font-weight: bold;
  color: #fbbf24;
}
.adventurer-stat-row :deep(.el-button) {
  margin-left: 0px !important;
}
</style>

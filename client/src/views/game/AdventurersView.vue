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
        / {{ maxAdventurerCap }} 名冒险家
      </p>
    </div>

    <!-- 招募按钮 -->
    <div class="text-center mb-4">
      <p class="text-sm text-yellow-500 font-semibold mb-1">
        🪙 {{ (playerInfo?.gold ?? 0).toLocaleString() }} 金币
      </p>
      <el-button
        type="warning"
        round
        :loading="recruiting"
        :disabled="recruiting || adventurers.length >= maxAdventurerCap"
        @click="handleRecruit"
      >
        🪙 招募冒险家（{{ gameSettings.adventurerRecruitPrice ?? 10000 }} 金币）
      </el-button>
    </div>

    <!-- 筛选栏 -->
    <div class="flex flex-wrap justify-center gap-1.5 mb-2">
      <el-button
        :type="filterTag === '' ? 'primary' : 'default'"
        size="small"
        @click="handleFilterTag('')"
      >
        全部
      </el-button>
      <el-button
        v-for="tag in ROLE_TAGS"
        :key="tag.value"
        :type="filterTag === tag.value ? 'primary' : 'default'"
        size="small"
        @click="handleFilterTag(tag.value)"
      >
        {{ tag.emoji }} {{ tag.label }}
      </el-button>
      <el-button
        :type="filterTag === 'none' ? 'primary' : 'default'"
        size="small"
        @click="handleFilterTag('none')"
      >
        🏷️ 未设定
      </el-button>
    </div>

    <!-- 阵容筛选 -->
    <div class="flex flex-wrap justify-center gap-1.5 mb-2">
      <el-select
        v-model="formationFilter"
        size="small"
        style="width: 180px"
        @change="handleFormationFilter"
        placeholder="筛选阵容"
      >
        <el-option
          v-for="opt in formationFilterOptions"
          :key="opt.value"
          :label="opt.label"
          :value="opt.value"
        />
      </el-select>
    </div>

    <!-- 排序栏 + 批量操作 -->
    <div class="flex justify-center items-center gap-2 mb-4 flex-wrap">
      <el-select
        v-model="sortMode"
        size="small"
        style="width: 160px"
        @change="handleSortChange"
      >
        <el-option label="默认排序" value="default" />
        <el-option label="等级（高→低）" value="level_desc" />
        <el-option label="等级（低→高）" value="level_asc" />
      </el-select>
      <el-checkbox v-model="batchMode" size="small">批量选择</el-checkbox
      ><span class="text-sm text-gray-500 dark:text-gray-400"
        >（已选中：{{ selectedIds.size }}）</span
      >
      <el-button
        v-if="batchMode"
        type="primary"
        text
        size="small"
        @click="handleSelectAll"
      >
        {{ isAllSelected ? '取消全选' : '全选当前' }}
      </el-button>
      <div
        class="flex items-center justify-center gap-2 flex-wrap"
        v-if="batchMode"
      >
        <el-button
          type="warning"
          size="small"
          :loading="batchEquipLoading"
          :disabled="batchEquipLoading"
          @click="handleBatchEquipBest"
        >
          💎 批量装备符文石 ({{ selectedIds.size }})
        </el-button>
        <el-dropdown
          split-button
          type="primary"
          size="small"
          trigger="click"
          :disabled="batchRatioLoading"
          @click="handleBatchUpDefault"
          @command="handleBatchUpCommand"
        >
          📈 批量升级+10
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item :command="1">+1</el-dropdown-item>
              <el-dropdown-item :command="5">+5</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
        <el-dropdown
          split-button
          type="danger"
          size="small"
          trigger="click"
          :disabled="batchRatioLoading"
          @click="handleBatchDownDefault"
          @command="handleBatchDownCommand"
        >
          📉 批量降级-10
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item :command="1">-1</el-dropdown-item>
              <el-dropdown-item :command="5">-5</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>

    <!-- 按阵容升级 -->
    <div class="flex justify-center mb-4">
      <el-dropdown
        split-button
        type="success"
        size="small"
        trigger="click"
        :disabled="batchRatioLoading || formationUpgradeLoading"
        @click="handleOpenFormationUpgrade(10)"
        @command="handleOpenFormationUpgrade"
      >
        🏗️ 按阵容升级+10
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item :command="1">+1</el-dropdown-item>
            <el-dropdown-item :command="5">+5</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="flex justify-center py-12">
      <span class="animate-spin inline-block text-4xl">⏳</span>
    </div>

    <!-- 冒险家网格 -->
    <div
      v-else-if="filteredAdventurers.length > 0"
      class="grid grid-cols-3 sm:grid-cols-4 gap-4"
    >
      <div
        v-for="adv in filteredAdventurers"
        :key="adv._id"
        class="rpg-card relative flex flex-col items-center p-3 rounded-xl cursor-pointer group"
        :class="{ 'ring-2 ring-yellow-400': selectedIds.has(adv._id) }"
        @click="handleCardClick(adv)"
        @mousedown="handleAdvLongPressStart(adv)"
        @mouseup="handleAdvLongPressEnd"
        @mouseleave="handleAdvLongPressEnd"
        @touchstart.passive="handleAdvLongPressStart(adv)"
        @touchend="handleAdvLongPressEnd"
        @touchcancel="handleAdvLongPressEnd"
      >
        <!-- 批量选择复选框 -->
        <div v-if="batchMode" class="absolute top-1 right-1 z-20" @click.stop>
          <el-checkbox
            :model-value="selectedIds.has(adv._id)"
            size="small"
            @change="handleToggleSelect(adv._id)"
          />
        </div>
        <!-- 元素菱形徽章 -->
        <div
          v-if="!batchMode"
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

        <!-- 战斗力 -->
        <p class="text-xs text-orange-400 mt-0.5 font-mono">
          ⚔️ {{ calculateCombatPower(adv, adv.runeStone || null) }}
        </p>

        <!-- 装备状态标签 -->
        <div
          v-if="adv.runeStone"
          class="mt-1 text-xs px-1.5 py-0.5 rounded-full border cursor-pointer hover:opacity-80 text-center w-full"
          :class="runeStoneCardClass(adv.runeStone.rarity)"
          @click.stop="handleShowRuneStoneManage(adv)"
        >
          💎 {{ rarityName(adv.runeStone.rarity) }} Lv.{{ adv.runeStone.level }}
        </div>

        <!-- 属性升降级按钮 -->
        <el-button
          type="warning"
          size="small"
          class="mt-1 w-full"
          style="font-size: 12px"
          @click.stop="handleOpenStatUpgrade(adv)"
        >
          📈 升降级
        </el-button>
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

    <!-- ==================== 符文石管理弹窗 ==================== -->
    <AdventurerRuneStoneDialog
      v-model="runeStoneDialogVisible"
      :adventurer="runeStoneDialogAdv"
      @updated="handleRuneStoneDialogUpdated"
    />

    <!-- ==================== 属性升降级弹窗 ==================== -->
    <el-dialog
      v-model="statUpgradeVisible"
      :title="
        statUpgradeAdv ? `${statUpgradeAdv.name} - 属性升降级` : '属性升降级'
      "
      align-center
      destroy-on-close
      class="game-dialog"
      v-bind="statPanelLockProps"
    >
      <StatLevelUpPanel
        v-if="statUpgradeAdv"
        ref="statLevelUpPanelRef"
        :adventurer="statUpgradeAdv"
        @updated="handleStatUpgradeUpdated"
      />
    </el-dialog>

    <!-- ==================== 批量升降级报表预览弹窗 ==================== -->
    <el-dialog
      v-model="batchReportVisible"
      :title="`批量${batchReportDirection === 'up' ? '升级' : '降级'}报表预览`"
      width="90%"
      style="max-width: 700px"
      align-center
      destroy-on-close
      class="game-dialog"
      v-bind="batchRatioLockProps"
    >
      <div v-if="batchReportData.length" class="text-sm">
        <!-- 总览 -->
        <div
          class="mb-3 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded text-center"
        >
          <p>
            共 <b>{{ batchReportData.length }}</b> 名冒险家，
            <span class="text-green-500"
              >{{ batchReportData.filter(i => !i.error).length }} 名可操作</span
            >
            <span
              v-if="batchReportData.some(i => i.error)"
              class="text-red-400 ml-1"
            >
              {{ batchReportData.filter(i => i.error).length }} 名将被跳过
            </span>
            ，每人
            {{ batchReportDirection === 'up' ? '+' : '-'
            }}{{ batchReportTotalPerAdv }} 级
          </p>
          <p class="mt-1">
            💰 总金币:
            <span class="text-yellow-500 font-bold">{{
              batchReportTotalGold.toLocaleString()
            }}</span>
            <span
              v-if="batchReportDirection === 'down'"
              class="text-xs text-gray-400 ml-1"
            >
              ({{
                (
                  gameSettings?.adventurerLevelDownGoldPrice ?? 1000
                ).toLocaleString()
              }}🪙/级)
            </span>
          </p>
          <p v-if="batchReportDirection === 'up'" class="mt-1 space-x-2">
            <span
              >⚔️ 攻击水晶: {{ batchReportTotalCrystals.attackCrystal }}</span
            >
            <span
              >🛡️ 防御水晶: {{ batchReportTotalCrystals.defenseCrystal }}</span
            >
            <span
              >💨 速度水晶: {{ batchReportTotalCrystals.speedCrystal }}</span
            >
            <span>🧠 SAN水晶: {{ batchReportTotalCrystals.sanCrystal }}</span>
          </p>
        </div>

        <!-- 每个冒险家详情 -->
        <div class="overflow-y-auto space-y-2">
          <div
            v-for="item in batchReportData"
            :key="item.adventurerId"
            class="p-2 border rounded dark:border-gray-600"
          >
            <p class="font-medium">{{ item.name }}</p>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-1 text-xs mt-1">
              <span
                >⚔️ Lv.{{ item.currentLevels.attack }} → Lv.{{
                  item.newLevels.attack
                }}</span
              >
              <span
                >🛡️ Lv.{{ item.currentLevels.defense }} → Lv.{{
                  item.newLevels.defense
                }}</span
              >
              <span
                >💨 Lv.{{ item.currentLevels.speed }} → Lv.{{
                  item.newLevels.speed
                }}</span
              >
              <span
                >🧠 Lv.{{ item.currentLevels.san }} → Lv.{{
                  item.newLevels.san
                }}</span
              >
            </div>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
              综合 {{ item.currentLevels.comprehensive }} →
              {{ item.newLevels.comprehensive }} | 金币:
              {{ item.goldCost.toLocaleString() }}
              <template v-if="batchReportDirection === 'up'">
                | 水晶: 攻{{ item.crystalCost.attack }} 防{{
                  item.crystalCost.defense
                }}
                速{{ item.crystalCost.speed }} SAN{{ item.crystalCost.san }}
              </template>
            </p>
            <p v-if="item.error" class="text-xs text-red-500 mt-1">
              ⚠️ {{ item.error }}
            </p>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="batchReportVisible = false">取消</el-button>
        <el-button
          type="primary"
          :loading="batchRatioLoading"
          :disabled="batchRatioLoading || batchReportHasError"
          @click="handleConfirmBatchRatio"
        >
          确认{{ batchReportDirection === 'up' ? '升级' : '降级' }}
        </el-button>
      </template>
    </el-dialog>

    <!-- ==================== 按阵容升级弹窗 ==================== -->
    <el-dialog
      v-model="formationSelectVisible"
      title="🏗️ 按阵容升级"
      width="90%"
      style="max-width: 600px"
      align-center
      destroy-on-close
      class="game-dialog"
      v-bind="formationUpgradeLockProps"
    >
      <!-- 阵容选择 -->
      <div v-if="!formationSelectedId" class="space-y-3">
        <p class="text-sm text-gray-500 dark:text-gray-400 text-center">
          选择阵容后，将对阵容中的冒险家批量升级
          <b>+{{ formationUpgradeLevels }}</b> 级
        </p>
        <div v-if="formationListLoading" class="flex justify-center py-6">
          <span class="animate-spin inline-block text-2xl">⏳</span>
        </div>
        <div v-else class="space-y-2">
          <!-- 竞技场阵容 -->
          <div
            v-if="arenaFormationOption"
            class="rpg-card rounded-xl p-3 cursor-pointer hover:border-yellow-400 transition-colors border border-gray-300 dark:border-gray-600"
            @click="handleSelectFormation('arena')"
          >
            <p class="font-medium text-sm">⚔️ 当前竞技场阵容</p>
            <p class="text-xs text-gray-400 mt-0.5">
              {{ arenaFormationOption.advCount }} 名冒险家
            </p>
          </div>
          <!-- 预设阵容列表 -->
          <div
            v-for="f in formationOptions"
            :key="f.slot"
            class="rpg-card rounded-xl p-3 cursor-pointer hover:border-yellow-400 transition-colors border border-gray-300 dark:border-gray-600"
            @click="handleSelectFormation(f.slot)"
          >
            <p class="font-medium text-sm">
              📋 {{ f.name }}（槽位{{ f.slot }}）
            </p>
            <p class="text-xs text-gray-400 mt-0.5">
              {{ f.advCount }} 名冒险家
            </p>
          </div>
          <p
            v-if="!arenaFormationOption && formationOptions.length === 0"
            class="text-center text-gray-400 py-4"
          >
            暂无可用阵容，请先配置阵容
          </p>
        </div>
      </div>

      <!-- 选择阵容后：冒险家勾选列表 -->
      <div v-else class="space-y-3">
        <div class="flex items-center justify-between">
          <el-button size="small" @click="handleBackToFormationList">
            ← 重选阵容
          </el-button>
          <span class="text-sm text-gray-500">
            已选 {{ formationSelectedAdvIds.size }} /
            {{ formationAdvList.length }}
          </span>
        </div>
        <div class="overflow-y-auto space-y-2 pr-1">
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div
              v-for="adv in formationAdvList"
              :key="adv._id"
              class="rpg-card relative flex flex-col items-center p-3 rounded-xl cursor-pointer transition-all"
              :class="{
                'ring-2 ring-yellow-400': formationSelectedAdvIds.has(adv._id)
              }"
              @click="handleToggleFormationAdv(adv._id)"
            >
              <!-- 批量选择复选框 -->
              <div class="absolute top-1 right-1 z-20" @click.stop>
                <el-checkbox
                  :model-value="formationSelectedAdvIds.has(adv._id)"
                  size="small"
                  @change="handleToggleFormationAdv(adv._id)"
                />
              </div>

              <!-- 头像 -->
              <div class="relative w-12 h-12 mb-2">
                <GameAdventurerAvatar
                  :adventurer="adv"
                  :alt="adv.name"
                  class="w-full h-full rounded-full object-cover border-2 transition-colors"
                  :style="{ borderColor: getElementColor(adv.elements) }"
                />
              </div>

              <!-- 名字 -->
              <p
                class="text-xs font-medium text-gray-700 dark:text-gray-200 text-center truncate w-full"
              >
                {{ adv.name }}
              </p>

              <!-- 综合等级 -->
              <p class="text-xs text-yellow-500 mt-1 font-mono">
                Lv.{{ adv.comprehensiveLevel || 1 }}
              </p>

              <!-- 战斗力 -->
              <p class="text-xs text-orange-400 mt-0.5 font-mono">
                ⚔️ {{ calculateCombatPower(adv, adv.runeStone || null) }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <template v-if="formationSelectedId">
          <el-button @click="formationSelectVisible = false">取消</el-button>
          <el-button
            type="primary"
            :disabled="formationSelectedAdvIds.size === 0"
            @click="handleFormationUpgradePreview"
          >
            预览升级报表
          </el-button>
        </template>
        <template v-else>
          <el-button @click="formationSelectVisible = false">关闭</el-button>
        </template>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  getMyAdventurersApi,
  recruitAdventurerApi,
  setRoleTagApi,
  batchEquipBestRuneStonesApi,
  batchRatioDistributeApi
} from '@/api/game/adventurer.js'
import { getGameSettingsApi } from '@/api/game/config.js'
import { useGameUser } from '@/composables/useGameUser.js'
import { useDialogRoute } from '@/composables/useDialogRoute.js'
import { useDialogLock } from '@/composables/useDialogLock.js'
import { ROLE_TAG_MAP } from 'shared/constants/index.js'
import {
  getMaxAdventurerCount,
  getMaxComprehensiveLevel,
  getAdventurerLevelUpCrystalCost,
  getAdventurerLevelUpGoldCost
} from 'shared/utils/guildLevelUtils.js'

const ROLE_TAGS = Object.entries(ROLE_TAG_MAP).map(
  ([value, { emoji, label }]) => ({
    value,
    emoji,
    label
  })
)
import AdventurerDetailDialog from '@/components/AdventurerDetailDialog.vue'
import AdventurerRuneStoneDialog from '@/components/AdventurerRuneStoneDialog.vue'
import StatLevelUpPanel from '@/components/StatLevelUpPanel.vue'
import GameAdventurerAvatar from '@/components/GameAdventurerAvatar.vue'
import { calculateCombatPower } from 'shared/utils/gameDatabase.js'
import { getMyFormationsApi } from '@/api/game/formation.js'
import { getArenaFormationApi } from '@/api/game/arena.js'

const router = useRouter()
const { isLoggedIn, playerInfo, fetchPlayerInfo } = useGameUser()

if (!isLoggedIn.value) {
  router.replace({ name: 'GameLogin' })
}

// 公会等级限制的冒险家上限
const maxAdventurerCap = computed(() => {
  return getMaxAdventurerCount(playerInfo.value?.guildLevel || 1)
})

function goToFormation() {
  router.push({ name: 'GameFormations' })
}

// ── 数据 ──
const loading = ref(false)
const adventurers = ref([])
const gameSettings = ref({})

// ── 标签筛选 ──
const filterTag = ref('')

function handleFilterTag(tag) {
  filterTag.value = tag
  // 切换标签时清空已选项
  selectedIds.value = new Set()
}

// ── 阵容筛选 ──
const formationFilter = ref('')
// key: 'arena' | 'slot_X' → Set<advId>
const formationSlotAdvIdsMap = ref({})
// 选项列表（初始含基础两项，fetchFormationIds 后动态填充）
const formationFilterOptions = ref([
  { value: '', label: '全部阵容' },
  { value: 'notInAny', label: '📭 未配置任何阵容' }
])

function handleFormationFilter() {
  selectedIds.value = new Set()
}

async function fetchFormationIds() {
  try {
    const [formRes, arenaRes] = await Promise.allSettled([
      getMyFormationsApi(),
      getArenaFormationApi({ silent: true })
    ])
    const newMap = {}
    const opts = [{ value: '', label: '全部阵容' }]

    if (arenaRes.status === 'fulfilled' && arenaRes.value.data.data?.grid) {
      const ids = new Set()
      for (const row of arenaRes.value.data.data.grid) {
        for (const cell of row) {
          if (cell) ids.add(typeof cell === 'object' ? cell._id : cell)
        }
      }
      if (ids.size > 0) {
        newMap['arena'] = ids
        opts.push({ value: 'arena', label: '⚔️ 竞技场阵容' })
      }
    }

    if (formRes.status === 'fulfilled') {
      const formations = formRes.value.data.data || []
      for (const f of formations) {
        if (!f.grid) continue
        const ids = new Set()
        for (const row of f.grid) {
          for (const cell of row) {
            if (cell) ids.add(typeof cell === 'object' ? cell._id : cell)
          }
        }
        if (ids.size > 0) {
          const key = 'slot_' + f.slot
          newMap[key] = ids
          opts.push({
            value: key,
            label: `📋 ${f.name || '阵容' + f.slot}（槽${f.slot}）`
          })
        }
      }
    }

    opts.push({ value: 'notInAny', label: '📭 未配置任何阵容' })
    formationSlotAdvIdsMap.value = newMap
    formationFilterOptions.value = opts
  } catch {
    // ignore
  }
}

// ── 排序 ──
const sortMode = ref('default')

function handleSortChange() {
  // v-model 已更新
}

const filteredAdventurers = computed(() => {
  let list = adventurers.value
  if (filterTag.value) {
    if (filterTag.value === 'none') {
      list = list.filter(a => !a.roleTag)
    } else {
      list = list.filter(a => a.roleTag === filterTag.value)
    }
  }
  if (formationFilter.value === 'notInAny') {
    const allIds = new Set()
    for (const ids of Object.values(formationSlotAdvIdsMap.value)) {
      for (const id of ids) allIds.add(id)
    }
    list = list.filter(a => !allIds.has(a._id))
  } else if (formationFilter.value) {
    const ids = formationSlotAdvIdsMap.value[formationFilter.value]
    if (ids) list = list.filter(a => ids.has(a._id))
  }
  if (sortMode.value === 'level_desc') {
    list = [...list].sort(
      (a, b) => (b.comprehensiveLevel || 1) - (a.comprehensiveLevel || 1)
    )
  } else if (sortMode.value === 'level_asc') {
    list = [...list].sort(
      (a, b) => (a.comprehensiveLevel || 1) - (b.comprehensiveLevel || 1)
    )
  }
  return list
})

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

function handleShowRuneStoneManage(adv) {
  if (!adv.runeStone) return
  runeStoneDialogAdv.value = { ...adv }
  runeStoneDialogVisible.value = true
}

function handleCardClick(adv) {
  if (batchMode.value) {
    handleToggleSelect(adv._id)
  } else {
    openDetail(adv)
  }
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

// ── 批量选择 & 批量装备 ──
const batchMode = ref(false)
const selectedIds = ref(new Set())
const batchEquipLoading = ref(false)

const isAllSelected = computed(() => {
  if (filteredAdventurers.value.length === 0) return false
  return filteredAdventurers.value.every(adv => selectedIds.value.has(adv._id))
})

function handleSelectAll() {
  if (isAllSelected.value) {
    // 取消全显（仅从当前过滤后的列表中移除）
    const newSet = new Set(selectedIds.value)
    filteredAdventurers.value.forEach(adv => newSet.delete(adv._id))
    selectedIds.value = newSet
  } else {
    // 全选（合并到当前已选项）
    const newSet = new Set(selectedIds.value)
    filteredAdventurers.value.forEach(adv => newSet.add(adv._id))
    selectedIds.value = newSet
  }
}

// 监听 batchMode 变化，取消批量选择时清空选择
import { watch } from 'vue'
watch(batchMode, newVal => {
  if (!newVal) {
    selectedIds.value = new Set()
  }
})

// ── 长按3秒进入批量选择 ──
let advLongPressTimer = null

function handleAdvLongPressStart(adv) {
  if (batchMode.value) return
  advLongPressTimer = setTimeout(() => {
    batchMode.value = true
    selectedIds.value = new Set([adv._id])
    advLongPressTimer = null
  }, 3000)
}

function handleAdvLongPressEnd() {
  if (advLongPressTimer) {
    clearTimeout(advLongPressTimer)
    advLongPressTimer = null
  }
}

function handleToggleSelect(id) {
  const newSet = new Set(selectedIds.value)
  if (newSet.has(id)) {
    newSet.delete(id)
  } else {
    newSet.add(id)
  }
  selectedIds.value = newSet
}

async function handleBatchEquipBest() {
  if (selectedIds.value.size === 0) return
  batchEquipLoading.value = true
  try {
    const res = await batchEquipBestRuneStonesApi({
      adventurerIds: [...selectedIds.value]
    })
    const { results } = res.data.data
    const equipped = results.filter(r => r.success).length
    ElMessage.success(`批量装备完成，${equipped} 名冒险家已装备符文石`)
    selectedIds.value = new Set()
    // batchMode.value = false // 仅取消选择，不退出批量模式
    await fetchAdventurers()
  } catch {
    // handled by interceptor
  } finally {
    batchEquipLoading.value = false
  }
}

// ── 符文石管理弹窗 ──
const { visible: runeStoneDialogVisible } = useDialogRoute('rsManage')
const runeStoneDialogAdv = ref(null)

function handleRuneStoneDialogUpdated(updatedAdv) {
  const idx = adventurers.value.findIndex(a => a._id === updatedAdv._id)
  if (idx >= 0) adventurers.value[idx] = { ...updatedAdv }
  runeStoneDialogAdv.value = { ...updatedAdv }
}

// ── 属性升级弹窗 ──
const { visible: statUpgradeVisible } = useDialogRoute('statUpgrade')
const statUpgradeAdv = ref(null)
const statLevelUpPanelRef = ref(null)
const statPanelLoading = computed(
  () => statLevelUpPanelRef.value?.anyLoading ?? false
)
const { dialogLockProps: statPanelLockProps } = useDialogLock(
  () => statPanelLoading.value
)
const { dialogLockProps: batchRatioLockProps } = useDialogLock(
  () => batchRatioLoading.value
)
const { dialogLockProps: formationUpgradeLockProps } = useDialogLock(
  () => formationUpgradeLoading.value
)

function handleOpenStatUpgrade(adv) {
  statUpgradeAdv.value = { ...adv }
  statUpgradeVisible.value = true
}

function handleStatUpgradeUpdated(updatedAdv) {
  const idx = adventurers.value.findIndex(a => a._id === updatedAdv._id)
  if (idx >= 0) adventurers.value[idx] = { ...updatedAdv }
  statUpgradeAdv.value = { ...updatedAdv }
}

// ── 批量按比例升降级 ──
const batchRatioLoading = ref(false)
const { visible: batchReportVisible } = useDialogRoute('batchReport')
const batchReportData = ref([])
const batchReportDirection = ref('up')
const batchReportTotalPerAdv = ref(0)
const batchReportTotalGold = ref(0)
const batchReportTotalCrystals = ref({
  attackCrystal: 0,
  defenseCrystal: 0,
  speedCrystal: 0,
  sanCrystal: 0
})
const batchReportHasError = ref(false)

function handleOpenBatchRatioReport(direction, totalLevels) {
  if (selectedIds.value.size === 0) {
    ElMessage.warning('请先选中冒险家')
    return
  }

  batchReportDirection.value = direction
  batchReportTotalPerAdv.value = totalLevels

  const crystalBase = gameSettings.value.adventurerLevelUpCrystalBase ?? 100
  const goldBase = gameSettings.value.adventurerLevelUpGoldBase ?? 500
  const downPricePerLevel =
    gameSettings.value.adventurerLevelDownGoldPrice ?? 1000
  const guildLevel = playerInfo.value?.guildLevel || 1
  const maxCompLevel = getMaxComprehensiveLevel(guildLevel)

  let totalGold = 0
  const totalCrystalsAcc = {
    attackCrystal: 0,
    defenseCrystal: 0,
    speedCrystal: 0,
    sanCrystal: 0
  }
  const reportItems = []
  const selectedAdvs = adventurers.value.filter(a =>
    selectedIds.value.has(a._id)
  )
  const statLevelKeys = {
    attack: 'attackLevel',
    defense: 'defenseLevel',
    speed: 'speedLevel',
    san: 'SANLevel'
  }
  const crystalKeys = {
    attack: 'attackCrystal',
    defense: 'defenseCrystal',
    speed: 'speedCrystal',
    san: 'sanCrystal'
  }
  const statNames = {
    attack: '攻击',
    defense: '防御',
    speed: '速度',
    san: 'SAN'
  }

  for (const adv of selectedAdvs) {
    const ratio = adv.statDistributeRatio
    const ratioTotal = ratio
      ? ratio.attack + ratio.defense + ratio.speed + ratio.san
      : 0
    let error = ''
    if (ratioTotal !== 100) {
      error = '分配比例未设置（需合计100%），将被跳过'
    }

    let effectiveLevels = totalLevels
    if (direction === 'up' && !error) {
      const currentComp =
        (adv.attackLevel || 1) +
        (adv.defenseLevel || 1) +
        (adv.speedLevel || 1) +
        (adv.SANLevel || 1) -
        3
      const remaining = maxCompLevel - currentComp
      if (remaining <= 0) {
        error = '综合等级已达上限，将被跳过'
      } else {
        effectiveLevels = Math.min(totalLevels, remaining)
      }
    }

    const alloc = {
      attack: error
        ? 0
        : Math.round((effectiveLevels * (ratio?.attack || 0)) / 100),
      defense: error
        ? 0
        : Math.round((effectiveLevels * (ratio?.defense || 0)) / 100),
      speed: error
        ? 0
        : Math.round((effectiveLevels * (ratio?.speed || 0)) / 100),
      san: 0
    }
    alloc.san = error
      ? 0
      : effectiveLevels - alloc.attack - alloc.defense - alloc.speed

    let itemGold = 0
    const itemCrystals = { attack: 0, defense: 0, speed: 0, san: 0 }

    if (!error) {
      if (direction === 'up') {
        for (const [statType, allocCount] of Object.entries(alloc)) {
          if (allocCount <= 0) continue
          let currentLevel = adv[statLevelKeys[statType]] || 1
          for (let i = 0; i < allocCount; i++) {
            const cc = getAdventurerLevelUpCrystalCost(
              currentLevel,
              crystalBase
            )
            const gc = getAdventurerLevelUpGoldCost(currentLevel, goldBase)
            itemCrystals[statType] += cc
            itemGold += gc
            totalCrystalsAcc[crystalKeys[statType]] += cc
            currentLevel++
          }
        }
      } else {
        for (const [statType, allocCount] of Object.entries(alloc)) {
          if (allocCount <= 0) continue
          const currentLevel = adv[statLevelKeys[statType]] || 1
          if (currentLevel - allocCount < 1) {
            error = `${statNames[statType]}等级不足以降级 ${allocCount} 级（当前 Lv.${currentLevel}），将被跳过`
            break
          }
        }
        itemGold = effectiveLevels * downPricePerLevel
      }
    }

    totalGold += itemGold

    const currentLevels = {
      attack: adv.attackLevel || 1,
      defense: adv.defenseLevel || 1,
      speed: adv.speedLevel || 1,
      san: adv.SANLevel || 1,
      comprehensive: adv.comprehensiveLevel || 1
    }
    const newLevels = { ...currentLevels }
    if (!error) {
      if (direction === 'up') {
        newLevels.attack += alloc.attack
        newLevels.defense += alloc.defense
        newLevels.speed += alloc.speed
        newLevels.san += alloc.san
      } else {
        newLevels.attack -= alloc.attack
        newLevels.defense -= alloc.defense
        newLevels.speed -= alloc.speed
        newLevels.san -= alloc.san
      }
      newLevels.comprehensive =
        newLevels.attack +
        newLevels.defense +
        newLevels.speed +
        newLevels.san -
        3
    }

    reportItems.push({
      adventurerId: adv._id,
      name: adv.name,
      alloc,
      currentLevels,
      newLevels,
      goldCost: itemGold,
      crystalCost: itemCrystals,
      error
    })
  }

  batchReportData.value = reportItems
  batchReportTotalGold.value = totalGold
  batchReportTotalCrystals.value = totalCrystalsAcc
  // 只有全部都有错误时才阻止提交
  batchReportHasError.value = reportItems.every(item => !!item.error)
  batchReportVisible.value = true
}

// ── Dropdown 升降级快捷方法 ──
function handleBatchUpDefault() {
  handleOpenBatchRatioReport('up', 10)
}
function handleBatchDownDefault() {
  handleOpenBatchRatioReport('down', 10)
}
function handleBatchUpCommand(levels) {
  handleOpenBatchRatioReport('up', levels)
}
function handleBatchDownCommand(levels) {
  handleOpenBatchRatioReport('down', levels)
}

async function handleConfirmBatchRatio() {
  batchRatioLoading.value = true
  try {
    const ops = batchReportData.value
      .filter(item => !item.error)
      .map(item => ({
        adventurerId: item.adventurerId,
        direction: batchReportDirection.value,
        totalLevels: batchReportTotalPerAdv.value
      }))
    if (ops.length === 0) return

    const res = await batchRatioDistributeApi({ operations: ops })
    const { results, skipped } = res.data.data
    const successCount = results?.length || 0
    const skippedCount =
      (skipped?.length || 0) + batchReportData.value.filter(i => i.error).length
    let msg = `批量${batchReportDirection.value === 'up' ? '升级' : '降级'}完成，${successCount} 名成功`
    if (skippedCount > 0) {
      msg += `，${skippedCount} 名被跳过`
    }
    ElMessage.success(msg)
    batchReportVisible.value = false
    selectedIds.value = new Set()
    // batchMode.value = false // 仅取消选择，不退出批量模式
    await fetchAdventurers()
    await fetchPlayerInfo()
  } catch {
    // handled by interceptor
  } finally {
    batchRatioLoading.value = false
  }
}

// ── 按阵容升级 ──
const { visible: formationSelectVisible } = useDialogRoute('formationUpgrade')
const formationUpgradeLoading = ref(false)
const formationListLoading = ref(false)
const formationUpgradeLevels = ref(10)
const formationOptions = ref([])
const arenaFormationOption = ref(null)
const formationSelectedId = ref(null)
const formationAdvList = ref([])
const formationSelectedAdvIds = ref(new Set())

// 保存原始阵容数据以便查找冒险家
let formationDataCache = []
let arenaFormationCache = null

async function handleOpenFormationUpgrade(levels) {
  formationUpgradeLevels.value = levels
  formationSelectedId.value = null
  formationAdvList.value = []
  formationSelectedAdvIds.value = new Set()
  formationListLoading.value = true
  formationSelectVisible.value = true

  try {
    const [formRes, arenaRes] = await Promise.allSettled([
      getMyFormationsApi(),
      getArenaFormationApi({ silent: true })
    ])

    // 预设阵容
    if (formRes.status === 'fulfilled') {
      const formations = formRes.value.data.data || []
      formationDataCache = formations
      formationOptions.value = formations
        .filter(f => {
          // 过滤有效阵容（至少有一个冒险家）
          return f.grid?.some(row => row?.some(cell => cell !== null))
        })
        .map(f => {
          const advCount = f.grid.flat().filter(cell => cell !== null).length
          return { slot: f.slot, name: f.name, advCount }
        })
    } else {
      formationOptions.value = []
      formationDataCache = []
    }

    // 竞技场阵容
    if (arenaRes.status === 'fulfilled' && arenaRes.value.data.data) {
      const arenaData = arenaRes.value.data.data
      arenaFormationCache = arenaData
      if (arenaData.grid?.some(row => row?.some(cell => cell !== null))) {
        const advCount = arenaData.grid
          .flat()
          .filter(cell => cell !== null).length
        arenaFormationOption.value = { advCount }
      } else {
        arenaFormationOption.value = null
      }
    } else {
      arenaFormationOption.value = null
      arenaFormationCache = null
    }
  } catch {
    formationOptions.value = []
    arenaFormationOption.value = null
  } finally {
    formationListLoading.value = false
  }
}

function handleSelectFormation(idOrSlot) {
  formationSelectedId.value = idOrSlot

  let advIds = []
  if (idOrSlot === 'arena' && arenaFormationCache) {
    advIds = arenaFormationCache.grid
      .flat()
      .filter(cell => cell !== null)
      .map(cell => (typeof cell === 'object' ? cell._id : cell))
  } else {
    const formation = formationDataCache.find(f => f.slot === idOrSlot)
    if (formation) {
      advIds = formation.grid
        .flat()
        .filter(cell => cell !== null)
        .map(cell => (typeof cell === 'object' ? cell._id : cell))
    }
  }

  // 去重
  const uniqueIds = [...new Set(advIds)]

  // 从现有冒险家列表中匹配
  formationAdvList.value = uniqueIds
    .map(id => adventurers.value.find(a => a._id === id))
    .filter(Boolean)

  // 默认全选
  formationSelectedAdvIds.value = new Set(
    formationAdvList.value.map(a => a._id)
  )
}

function handleBackToFormationList() {
  formationSelectedId.value = null
  formationAdvList.value = []
  formationSelectedAdvIds.value = new Set()
}

function handleToggleFormationAdv(id) {
  const newSet = new Set(formationSelectedAdvIds.value)
  if (newSet.has(id)) {
    newSet.delete(id)
  } else {
    newSet.add(id)
  }
  formationSelectedAdvIds.value = newSet
}

function handleFormationUpgradePreview() {
  if (formationSelectedAdvIds.value.size === 0) {
    ElMessage.warning('请先选中冒险家')
    return
  }

  // 暂存选中的阵容冒险家ID
  const advIds = new Set(formationSelectedAdvIds.value)
  const levels = formationUpgradeLevels.value

  // 先关闭阵容选择弹窗
  formationSelectVisible.value = false

  // 等待路由变更后再打开批量报表弹窗
  setTimeout(() => {
    selectedIds.value = advIds
    handleOpenBatchRatioReport('up', levels)
  }, 300)
}

// ── 初始化 ──
onMounted(() => {
  fetchAdventurers()
  fetchGameSettings()
  fetchPlayerInfo()
  fetchFormationIds()
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

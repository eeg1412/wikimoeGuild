<template>
  <div class="w-full relative" :style="[dungeonBgStyle, { minHeight: '70vh' }]">
    <!-- 遮罩层 -->
    <div class="absolute inset-0 bg-gray-400/60 dark:bg-black/60 z-0" />

    <!-- 内容层 -->
    <div class="relative z-10 py-6 px-4 max-w-lg mx-auto">
      <!-- 标题 -->
      <div class="text-center mb-6">
        <h1
          class="rpg-dungeon-title text-2xl font-bold text-yellow-300 drop-shadow-lg"
        >
          🏰 地下迷宫
        </h1>
        <p class="text-gray-300 text-sm mt-1">
          迷宫等级 Lv.{{
            dungeonInfo.dungeonsLevel || playerInfo?.dungeonsLevel || 1
          }}
        </p>
      </div>

      <!-- 选择产出等级 -->
      <div class="dungeon-card rounded-2xl p-4 mb-4">
        <div class="flex items-center justify-between gap-3 flex-wrap">
          <span
            class="text-yellow-300 font-semibold text-sm flex items-center gap-1"
          >
            <span>🎯</span> 符文石产出等级
          </span>
          <div class="flex items-center gap-2">
            <el-select-v2
              v-model="selectedLevel"
              :options="dungeonLevelOptions"
              size="small"
              style="width: 120px"
              :disabled="selectLevelLoading"
              @change="handleSelectLevel"
            />
            <span
              v-if="selectLevelLoading"
              class="animate-spin inline-block text-sm"
              >⏳</span
            >
          </div>
        </div>
        <p class="text-gray-400 text-xs mt-2">
          收取水晶时，符文石掉落等级将以所选等级为准。仅最高等级可挑战军团。
        </p>
      </div>

      <!-- 冒险家探索动画框 -->
      <div class="dungeon-explorer-box rounded-2xl mb-4">
        <div class="dungeon-explorer-inner">
          <div
            v-for="(adv, idx) in exploringAdventurers"
            :key="adv._id || idx"
            class="dungeon-explorer"
            :class="adv.direction"
            :style="adv.animStyle"
          >
            <div class="dungeon-explorer-body">
              <div class="dungeon-explorer-bounce">
                <GameAdventurerAvatar
                  :adventurer="adv"
                  class="dungeon-explorer-avatar"
                />
              </div>
              <!-- 对话气泡 -->
              <Transition name="bubble">
                <div
                  v-if="adv.showBubble"
                  class="explorer-bubble"
                  :class="
                    adv.direction === 'walk-left'
                      ? 'explorer-bubble--left'
                      : 'explorer-bubble--right'
                  "
                >
                  {{ adv.bubbleEmoji }}
                </div>
              </Transition>
            </div>
          </div>
        </div>
      </div>

      <!-- 迷宫信息卡 -->
      <div class="dungeon-card rounded-2xl p-5 mb-4">
        <h3
          class="text-yellow-300 font-semibold text-sm mb-3 flex items-center gap-2"
        >
          <span>💎</span> 水晶爆率
        </h3>
        <div class="grid grid-cols-2 gap-3">
          <div
            v-for="cry in crystalRates"
            :key="cry.key"
            class="crystal-item flex flex-col items-center p-2 rounded-lg"
            :style="{ borderColor: cry.color + '80' }"
          >
            <span class="text-lg">{{ cry.icon }}</span>
            <span class="text-sm text-gray-300 mt-0.5">{{ cry.name }}水晶</span>
            <span
              class="text-base font-bold mt-1"
              :style="{ color: cry.color }"
            >
              {{ cry.rate }}%
            </span>
          </div>
        </div>
      </div>

      <!-- 产出信息卡 -->
      <div class="dungeon-card rounded-2xl p-5 mb-4">
        <h3
          class="text-yellow-300 font-semibold text-sm mb-3 flex items-center gap-2"
        >
          <span>⚗️</span> 产出信息
        </h3>
        <div class="space-y-3">
          <div class="dungeon-info-row">
            <span class="text-gray-300 text-sm">冒险家数量</span>
            <span class="text-white font-semibold rpg-num">{{
              adventurerCount
            }}</span>
          </div>
          <div class="dungeon-info-row">
            <span class="text-gray-300 text-sm">冒险家产出率</span>
            <span class="text-yellow-300 font-bold rpg-num">{{
              adventurerProductionRate
            }}</span>
          </div>
          <div class="dungeon-info-row">
            <span class="text-gray-300 text-sm">迷宫等级增益</span>
            <span
              class="font-bold rpg-num"
              :class="
                isDungeonBonusCapped ? 'text-orange-400' : 'text-cyan-300'
              "
            >
              {{ dungeonBonusDisplay }}
              <span
                v-if="isDungeonBonusCapped"
                class="text-xs text-orange-400 ml-1"
                >(已达公会上限)</span
              >
            </span>
          </div>
          <div class="dungeon-info-row">
            <span class="text-gray-300 text-sm">总产出率</span>
            <span class="text-green-300 font-bold rpg-num">{{
              totalProductionRate
            }}</span>
          </div>
          <div class="dungeon-info-row">
            <span class="text-gray-300 text-sm">当前产物数量</span>
            <span
              class="text-green-300 font-bold text-lg rpg-num counting-animation"
            >
              {{ currentOutput }}
            </span>
          </div>
          <div class="dungeon-info-row">
            <span class="text-gray-300 text-sm">上次结算时间</span>
            <span class="text-gray-400 text-sm">{{ lastSettleStr }}</span>
          </div>
          <div class="dungeon-info-row">
            <span class="text-gray-300 text-sm">距上次收取</span>
            <span class="text-orange-300 font-semibold text-sm rpg-num">{{
              elapsedTimeStr
            }}</span>
          </div>
          <div class="dungeon-info-row">
            <span class="text-gray-300 text-sm">剩余切换次数</span>
            <span class="text-blue-300 font-semibold rpg-num">
              {{
                dungeonInfo.mapCanChangeUses ??
                playerInfo?.mapCanChangeUses ??
                0
              }}
              / 24
            </span>
          </div>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="flex flex-col gap-3 mt-6">
        <!-- 收取水晶 -->
        <el-button
          type="warning"
          size="large"
          round
          class="rpg-btn"
          :loading="settleLoading"
          :disabled="settleLoading || currentOutput < 1"
          @click="handleSettle"
        >
          ✨ 收取水晶
        </el-button>

        <!-- 切换迷宫 -->
        <el-button
          type="info"
          size="large"
          round
          class="rpg-btn"
          :loading="switchLoading"
          :disabled="
            switchLoading ||
            (dungeonInfo.mapCanChangeUses ??
              playerInfo?.mapCanChangeUses ??
              0) <= 0
          "
          @click="handleSwitch"
        >
          🔄 切换迷宫
        </el-button>

        <!-- 挑战军团 -->
        <el-button
          type="danger"
          size="large"
          round
          class="rpg-btn"
          :disabled="battleCooldown > 0 || legionPreviewLoading"
          @click="handleOpenLegionDialog"
        >
          {{
            battleCooldown > 0
              ? `⚔️ 冷却中 (${battleCooldown}s)`
              : '⚔️ 挑战迷宫军团'
          }}
        </el-button>
      </div>

      <!-- 结算结果弹窗 -->
      <el-dialog
        v-model="settleResultVisible"
        title="结算结果"
        width="320px"
        align-center
        destroy-on-close
      >
        <div v-if="settleResult" class="space-y-2 text-sm">
          <div class="flex justify-between">
            <span>⚔️ 攻击水晶</span>
            <span class="text-red-400 font-bold"
              >+{{ settleResult.crystals?.attackCrystal || 0 }}</span
            >
          </div>
          <div class="flex justify-between">
            <span>🛡️ 防御水晶</span>
            <span class="text-blue-400 font-bold"
              >+{{ settleResult.crystals?.defenseCrystal || 0 }}</span
            >
          </div>
          <div class="flex justify-between">
            <span>💨 速度水晶</span>
            <span class="text-green-400 font-bold"
              >+{{ settleResult.crystals?.speedCrystal || 0 }}</span
            >
          </div>
          <div class="flex justify-between">
            <span>❤️ SAN水晶</span>
            <span class="text-purple-400 font-bold"
              >+{{ settleResult.crystals?.sanCrystal || 0 }}</span
            >
          </div>
          <el-divider />
          <div v-if="settleResult.runeStone" class="text-center">
            <span class="text-yellow-400 font-bold text-lg"
              >🎉 获得符文石！</span
            >
            <p class="text-sm text-gray-400 mt-1">
              {{ rarityName(settleResult.runeStone.rarity) }} 符文石 Lv.{{
                settleResult.runeStone.level
              }}
            </p>
          </div>
        </div>
      </el-dialog>

      <!-- 军团挑战弹窗 -->
      <el-dialog
        v-model="showLegionDialog"
        title="⚔️ 挑战迷宫军团"
        width="380px"
        align-center
        destroy-on-close
      >
        <div class="space-y-4">
          <!-- 军团预览 -->
          <div v-if="legionPreviewLoading" class="text-center py-4">
            <span class="animate-spin inline-block text-2xl">⏳</span>
          </div>
          <div v-else-if="legionPreview">
            <p class="text-sm text-gray-500 dark:text-gray-400 mb-2">
              敌方军团（{{ legionPreview.demons?.length || 0 }} 只恶魔）
            </p>
            <div class="grid grid-cols-5 gap-1 max-h-40 overflow-y-auto">
              <div
                v-for="(demon, idx) in legionPreview.demons"
                :key="idx"
                class="flex flex-col items-center p-1"
              >
                <GameAdventurerAvatar
                  :adventurer="demon"
                  :is-demon="true"
                  class="w-8 h-8 rounded-full border"
                  :style="{ borderColor: getElementColor(demon.elements) }"
                />
                <span class="text-xs text-gray-400"
                  >Lv.{{ demon.comprehensiveLevel }}</span
                >
              </div>
            </div>
          </div>

          <!-- 选择阵容 -->
          <div>
            <p class="text-sm text-gray-600 dark:text-gray-300 mb-2">
              选择出战阵容：
            </p>
            <el-select
              v-model="selectedFormationSlot"
              placeholder="选择阵容"
              class="w-full"
            >
              <el-option
                v-for="f in myFormations"
                :key="f.slot"
                :label="f.name || `阵容 ${f.slot}`"
                :value="f.slot"
              />
            </el-select>
          </div>
        </div>
        <template #footer>
          <el-button @click="showLegionDialog = false">取消</el-button>
          <el-button
            type="danger"
            :loading="challengeLoading"
            :disabled="challengeLoading || !selectedFormationSlot"
            @click="handleChallenge"
          >
            开始挑战
          </el-button>
        </template>
      </el-dialog>

      <!-- 战斗结果弹窗 -->
      <el-dialog
        v-model="battleResultVisible"
        title="战斗结果"
        width="340px"
        align-center
        destroy-on-close
      >
        <div v-if="battleResult" class="text-center space-y-3">
          <div class="text-4xl">
            {{
              battleResultDisplay === 'win'
                ? '🎉'
                : battleResultDisplay === 'lose'
                  ? '💀'
                  : '🤝'
            }}
          </div>
          <p
            class="text-xl font-bold"
            :class="{
              'text-yellow-400': battleResultDisplay === 'win',
              'text-red-400': battleResultDisplay === 'lose',
              'text-gray-400': battleResultDisplay === 'draw'
            }"
          >
            {{
              { win: '胜利！', lose: '失败...', draw: '平局' }[
                battleResultDisplay
              ]
            }}
          </p>
          <p class="text-sm text-gray-500">
            战斗回合数：{{ battleResult.battleResult?.rounds || 0 }}
          </p>
          <div
            v-if="battleResultDisplay === 'win'"
            class="text-sm text-green-400"
          >
            <p>迷宫等级提升！</p>
            <p
              v-if="battleResult.droppedRuneStone"
              class="text-yellow-400 mt-1"
            >
              🎁 获得传说符文石！
            </p>
          </div>
        </div>
      </el-dialog>

      <!-- 战斗演出 -->
      <BattleAnimation
        v-if="showBattleAnimation"
        :battle-log="battleResult.battleResult.log"
        :attacker-units="battleResult.battleResult.attackerUnits"
        :defender-units="battleResult.battleResult.defenderUnits"
        :total-rounds="battleResult.battleResult.rounds"
        attacker-label="我方"
        defender-label="恶魔军团"
        @done="onBattleAnimationDone"
      />

      <!-- 发现矿场弹窗 -->
      <el-dialog
        v-model="showMineDiscovery"
        title="⛏️ 发现矿场！"
        width="340px"
        align-center
        destroy-on-close
      >
        <div v-if="discoveredMine" class="text-center space-y-3">
          <div class="text-4xl">⛰️</div>
          <p class="text-lg font-bold text-yellow-500">
            恭喜！你发现了一座矿场！
          </p>
          <div
            class="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 text-sm space-y-1"
          >
            <p class="text-gray-600 dark:text-gray-300">
              矿场等级:
              <span class="font-bold text-blue-500"
                >Lv.{{ discoveredMine.level }}</span
              >
            </p>
            <p class="text-gray-600 dark:text-gray-300">
              矿主:
              <span class="font-bold text-yellow-500">{{
                discoveredMine.ownerGuildName
              }}</span>
            </p>
          </div>
          <p class="text-sm text-gray-400">
            作为矿主，其他玩家挖矿时你将获得额外水晶奖励
          </p>
          <el-button type="primary" size="small" @click="handleGoToMine"
            >前往矿场</el-button
          >
        </div>
      </el-dialog>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useGameUser } from '@/composables/useGameUser.js'
import {
  getDungeonInfoApi,
  switchDungeonApi,
  settleCrystalsApi,
  previewLegionApi,
  challengeLegionApi,
  selectDungeonLevelApi
} from '@/api/game/dungeon.js'
import { getMyFormationsApi } from '@/api/game/formation.js'
import { getMyAdventurersApi } from '@/api/game/adventurer.js'
import BattleAnimation from '@/components/BattleAnimation.vue'
import { useDialogRoute } from '@/composables/useDialogRoute.js'
import {
  getCrystalProductionRateCap,
  getDungeonLevelBonus,
  getDungeonLevelBonusCap
} from 'shared/utils/guildLevelUtils.js'

const router = useRouter()
const { isLoggedIn, playerInfo, fetchPlayerInfo } = useGameUser()

if (!isLoggedIn.value) {
  router.replace({ name: 'GameLogin' })
}

// ── 元素工具 ──
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
function rarityName(r) {
  return { normal: '普通', rare: '稀有', legendary: '传说' }[r] || r
}

// ── 迷宫信息 ──
const dungeonInfo = ref({})

// ── 产出等级选择 ──
const selectedLevel = ref(1)
const selectLevelLoading = ref(false)
const maxDungeonLevel = computed(
  () => dungeonInfo.value?.dungeonsLevel || playerInfo.value?.dungeonsLevel || 1
)

// el-select-v2 options，从高到低排列
const dungeonLevelOptions = computed(() => {
  const max = maxDungeonLevel.value
  return Array.from({ length: max }, (_, i) => max - i).map(lv => ({
    value: lv,
    label: `Lv.${lv}`
  }))
})

async function handleSelectLevel(level) {
  selectLevelLoading.value = true
  try {
    await selectDungeonLevelApi({ level })
    ElMessage.success('产出等级已更新')
  } catch {
    // 恢复为服务器值
    selectedLevel.value =
      dungeonInfo.value?.selectedDungeonsLevel || maxDungeonLevel.value
  } finally {
    selectLevelLoading.value = false
  }
}

async function fetchDungeonInfo() {
  try {
    const res = await getDungeonInfoApi()
    dungeonInfo.value = res.data.data || {}
    // 同步产出等级
    selectedLevel.value =
      dungeonInfo.value.selectedDungeonsLevel ||
      dungeonInfo.value.dungeonsLevel ||
      1
    // 初始化战斗冷却（若服务器有 lastBattleAt）
    if (dungeonInfo.value.lastBattleAt && battleCooldown.value <= 0) {
      const remain = Math.ceil(
        10 -
          (Date.now() - new Date(dungeonInfo.value.lastBattleAt).getTime()) /
            1000
      )
      if (remain > 0) {
        battleCooldown.value = remain
        if (cooldownTimer) clearInterval(cooldownTimer)
        cooldownTimer = setInterval(() => {
          battleCooldown.value--
          if (battleCooldown.value <= 0) {
            clearInterval(cooldownTimer)
            cooldownTimer = null
          }
        }, 1000)
      }
    }
  } catch {
    // ignore
  }
}

// 背景
const dungeonBgStyle = computed(() => {
  const bgId =
    dungeonInfo.value?.dungeonsBackgroundId ||
    playerInfo.value?.dungeonsBackgroundId ||
    1
  return {
    backgroundImage: `url(/publicgame/dungeons/${bgId}.webp)`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat'
  }
})

// 冒险家数量
const adventurerCount = computed(
  () =>
    dungeonInfo.value?.adventurerCount || playerInfo.value?.adventurerCount || 0
)

// 水晶爆率
const crystalRates = computed(() => {
  const rates = dungeonInfo.value?.dungeonsCryRates ||
    playerInfo.value?.dungeonsCryRates || {
      attackCryRate: 2500,
      defenseCryRate: 2500,
      speedCryRate: 2500,
      SANCryRate: 2500
    }
  return [
    {
      key: 'attack',
      name: '攻击',
      icon: '⚔️',
      color: '#e05c4f',
      rate: (rates.attackCryRate / 100).toFixed(0)
    },
    {
      key: 'defense',
      name: '防御',
      icon: '🛡️',
      color: '#4fa3e0',
      rate: (rates.defenseCryRate / 100).toFixed(0)
    },
    {
      key: 'speed',
      name: '速度',
      icon: '💨',
      color: '#6abf69',
      rate: (rates.speedCryRate / 100).toFixed(0)
    },
    {
      key: 'san',
      name: 'SAN值',
      icon: '❤️',
      color: '#c070e0',
      rate: (rates.SANCryRate / 100).toFixed(0)
    }
  ]
})

// 产出倍率数值（冒险家部分，受公会等级限制）
const adventurerProductionRateValue = computed(() => {
  const cnt = adventurerCount.value
  if (cnt <= 0) return 0
  const guildLevel = playerInfo.value?.guildLevel || 1
  const rateCap = getCrystalProductionRateCap(guildLevel)
  return Math.min(cnt * 100 + (cnt - 1) * 10, rateCap)
})

// 冒险家产出率（显示用）
const adventurerProductionRate = computed(() => {
  if (adventurerProductionRateValue.value <= 0) return '0%'
  return `${adventurerProductionRateValue.value}%`
})

// 迷宫等级增益（百分比）
const dungeonLevelBonusValue = computed(() => {
  const dungeonLevel =
    dungeonInfo.value?.dungeonsLevel || playerInfo.value?.dungeonsLevel || 1
  const guildLevel = playerInfo.value?.guildLevel || 1
  // 从服务端获取的 bonusBase 信息，使用默认值100
  const bonusBase = 100
  let bonus = getDungeonLevelBonus(dungeonLevel, bonusBase)
  const cap = getDungeonLevelBonusCap(guildLevel, bonusBase)
  return Math.min(bonus, cap)
})

// 是否迷宫增益被公会等级限制
const isDungeonBonusCapped = computed(() => {
  const dungeonLevel =
    dungeonInfo.value?.dungeonsLevel || playerInfo.value?.dungeonsLevel || 1
  const guildLevel = playerInfo.value?.guildLevel || 1
  const bonusBase = 100
  const bonus = getDungeonLevelBonus(dungeonLevel, bonusBase)
  const cap = getDungeonLevelBonusCap(guildLevel, bonusBase)
  return bonus > cap
})

// 迷宫增益显示
const dungeonBonusDisplay = computed(() => {
  return `${dungeonLevelBonusValue.value}%`
})

// 总产出率
const totalProductionRateValue = computed(() => {
  return adventurerProductionRateValue.value + dungeonLevelBonusValue.value
})

const totalProductionRate = computed(() => {
  return `${totalProductionRateValue.value}%`
})

// 结算时间
const lastSettleStr = computed(() => {
  const d =
    dungeonInfo.value?.lastDungeonSettleAt ||
    playerInfo.value?.lastDungeonSettleAt
  if (!d) return '—'
  return new Date(d).toLocaleString('zh-CN')
})

// 当前产物数量
const currentOutput = ref(0)
let outputTimer = null

function calcOutput() {
  const settleAt =
    dungeonInfo.value?.lastDungeonSettleAt ||
    playerInfo.value?.lastDungeonSettleAt
  if (!settleAt) {
    currentOutput.value = 0
    return
  }
  const ms = Date.now() - new Date(settleAt).getTime()
  const secondsPassed = Math.max(Math.floor(ms / 1000), 0)
  // 产物数量 = 秒数 × 总产出倍率 / 6000（基础每分钟1个），上限99999
  const rate = totalProductionRateValue.value
  currentOutput.value = Math.min(
    Math.floor((secondsPassed * rate) / 6000),
    99999
  )
}

// 距上次收取经过的时间（实时更新）
const elapsedTimeStr = ref('—')

function calcElapsedTime() {
  const settleAt =
    dungeonInfo.value?.lastDungeonSettleAt ||
    playerInfo.value?.lastDungeonSettleAt
  if (!settleAt) {
    elapsedTimeStr.value = '—'
    return
  }
  const totalSec = Math.floor(
    (Date.now() - new Date(settleAt).getTime()) / 1000
  )
  if (totalSec < 0) {
    elapsedTimeStr.value = '0秒'
    return
  }
  const days = Math.floor(totalSec / 86400)
  const hours = Math.floor((totalSec % 86400) / 3600)
  const minutes = Math.floor((totalSec % 3600) / 60)
  const seconds = totalSec % 60
  const parts = []
  if (days > 0) parts.push(`${days}天`)
  if (hours > 0) parts.push(`${hours}小时`)
  if (minutes > 0) parts.push(`${minutes}分`)
  parts.push(`${seconds}秒`)
  elapsedTimeStr.value = parts.join('')
}

// ── 收取水晶 ──
const settleLoading = ref(false)
const { visible: settleResultVisible } = useDialogRoute('settleResult')
const settleResult = ref(null)

async function handleSettle() {
  // 如果符文石产出等级和当前迷宫等级不一致，提示用户确认
  if (selectedLevel.value !== (dungeonInfo.value?.dungeonsLevel || 1)) {
    const confirm = await ElMessageBox.confirm(
      `当前符文石产出等级为 Lv.${selectedLevel.value}，与迷宫等级 Lv.${
        dungeonInfo.value?.dungeonsLevel || 1
      } 不一致。是否继续？`,
      '确认收取',
      {
        confirmButtonText: '继续收取',
        cancelButtonText: '取消',
        type: 'warning'
      }
    ).catch(() => false)
    if (!confirm) return
  }
  settleLoading.value = true
  try {
    const res = await settleCrystalsApi()
    settleResult.value = res.data.data
    settleResultVisible.value = true
    ElMessage.success('收取成功！')
    await fetchDungeonInfo()
    await fetchPlayerInfo()
    calcOutput()
  } catch (e) {
    // 错误已由拦截器处理
  } finally {
    settleLoading.value = false
  }
}

// ── 切换迷宫 ──
const switchLoading = ref(false)
const { visible: showMineDiscovery } = useDialogRoute('mineDiscovery')
const discoveredMine = ref(null)

async function handleSwitch() {
  switchLoading.value = true
  try {
    // 切换迷宫时自动收取水晶
    if (currentOutput.value >= 1) {
      try {
        const settleRes = await settleCrystalsApi()
        settleResult.value = settleRes.data.data
        settleResultVisible.value = true
      } catch {
        // 收取失败不影响切换
      }
    }
    const switchRes = await switchDungeonApi()
    ElMessage.success('切换成功！')

    // 检查是否发现矿场
    const resData = switchRes.data?.data
    if (resData?.discoveredMine) {
      discoveredMine.value = resData.discoveredMine
      showMineDiscovery.value = true
    }

    await fetchDungeonInfo()
    await fetchPlayerInfo()
    calcOutput()
  } catch (e) {
    // 错误已由拦截器处理
  } finally {
    switchLoading.value = false
  }
}

// ── 军团挑战 ──
const { visible: showLegionDialog } = useDialogRoute('legion')
const legionPreviewLoading = ref(false)
const legionPreview = ref(null)
const myFormations = ref([])
const selectedFormationSlot = ref(null)
const challengeLoading = ref(false)
const { visible: battleResultVisible } = useDialogRoute('battleResult')
const battleResult = ref(null)
const showBattleAnimation = ref(false)
const battleCooldown = ref(0)
let cooldownTimer = null

function startBattleCooldown() {
  battleCooldown.value = 10
  if (cooldownTimer) clearInterval(cooldownTimer)
  cooldownTimer = setInterval(() => {
    battleCooldown.value--
    if (battleCooldown.value <= 0) {
      clearInterval(cooldownTimer)
      cooldownTimer = null
    }
  }, 1000)
}

// 将后端的 winner ('attacker'/'defender'/'draw') 映射为前端显示
const battleResultDisplay = computed(() => {
  if (!battleResult.value) return ''
  const winner = battleResult.value.battleResult?.winner
  if (winner === 'attacker') return 'win'
  if (winner === 'defender') return 'lose'
  return 'draw'
})

async function handleOpenLegionDialog() {
  legionPreviewLoading.value = true
  try {
    const [previewRes, formRes] = await Promise.all([
      previewLegionApi(),
      getMyFormationsApi()
    ])
    legionPreview.value = previewRes.data.data
    myFormations.value = formRes.data.data || []
    if (myFormations.value.length > 0 && !selectedFormationSlot.value) {
      selectedFormationSlot.value = myFormations.value[0].slot
    }
    showLegionDialog.value = true
  } catch (e) {
    // 错误已由拦截器处理
  } finally {
    legionPreviewLoading.value = false
  }
}

async function handleChallenge() {
  if (!selectedFormationSlot.value) return
  challengeLoading.value = true
  try {
    const res = await challengeLegionApi({
      formationSlot: selectedFormationSlot.value
    })
    battleResult.value = res.data.data
    showLegionDialog.value = false
    // 先展示战斗演出
    showBattleAnimation.value = true
    // 启动前端冷却
    startBattleCooldown()
    await fetchDungeonInfo()
    await fetchPlayerInfo()
  } catch (e) {
    // 错误已由拦截器处理
  } finally {
    challengeLoading.value = false
  }
}

function onBattleAnimationDone() {
  showBattleAnimation.value = false
  battleResultVisible.value = true
  if (battleResult.value?.battleResult?.winner === 'attacker') {
    ElMessage.success('胜利！迷宫等级提升！')
  }
}

function handleGoToMine() {
  showMineDiscovery.value = false
  router.push({ name: 'GameMine' })
}

// ── 冒险家探索动画 ──
const exploringAdventurers = ref([])

function buildExplorerStyle(idx, total) {
  // 横向穿越速度 10~20秒
  const duration = 10 + Math.random() * 10
  // 随机起始位置，错开步调
  const delay = -(Math.random() * duration)
  // 框高120px，头像36px，可用范围 0~84px
  const maxTop = 120 - 36
  const topPx = total <= 1 ? maxTop / 2 : (idx / (total - 1)) * maxTop
  // 走路弹跳速度
  const bounceSpeed = 0.3 + Math.random() * 0.2

  return {
    top: `${Math.round(topPx)}px`,
    animationDuration: `${duration.toFixed(1)}s`,
    animationDelay: `${delay.toFixed(1)}s`,
    '--bounce-speed': `${bounceSpeed.toFixed(2)}s`
  }
}

async function fetchExplorers() {
  try {
    const res = await getMyAdventurersApi()
    const all = res.data.data || []
    // 取最多5个冒险家用于动画展示
    const selected =
      all.length <= 5 ? all : all.sort(() => Math.random() - 0.5).slice(0, 5)
    exploringAdventurers.value = selected.map((adv, idx) => ({
      ...adv,
      direction: idx % 2 === 0 ? 'walk-right' : 'walk-left',
      animStyle: buildExplorerStyle(idx, selected.length),
      showBubble: false,
      bubbleEmoji: ''
    }))
    startBubbleTimer()
  } catch {
    // 获取失败不影响主流程
  }
}

// ── 对话气泡 ──
const MOOD_EMOJIS = [
  '😊',
  '😤',
  '🤔',
  '😴',
  '🥳',
  '😎',
  '🤩',
  '💪',
  '😅',
  '🙄',
  '😠',
  '🥶',
  '🫡',
  '😈',
  '✨',
  '💎',
  '⚔️',
  '🛡️',
  '🔥',
  '🌟',
  '👀',
  '😁',
  '🫣'
]

let bubbleTimer = null

function startBubbleTimer() {
  if (bubbleTimer) clearInterval(bubbleTimer)
  bubbleTimer = setInterval(
    () => {
      const advs = exploringAdventurers.value
      if (advs.length === 0) return
      // 随机选一个冒险家显示气泡
      const idx = Math.floor(Math.random() * advs.length)
      const adv = advs[idx]
      if (adv.showBubble) return // 已在显示
      adv.bubbleEmoji =
        MOOD_EMOJIS[Math.floor(Math.random() * MOOD_EMOJIS.length)]
      adv.showBubble = true
      // 显示 2~3 秒后消失
      setTimeout(
        () => {
          adv.showBubble = false
        },
        2000 + Math.random() * 1000
      )
    },
    3000 + Math.random() * 2000
  ) // 每 3~5 秒出现一次
}

// ── 初始化 ──
onMounted(() => {
  fetchDungeonInfo()
  fetchExplorers()
  calcOutput()
  calcElapsedTime()
  outputTimer = setInterval(() => {
    calcOutput()
    calcElapsedTime()
  }, 1000)
})

onUnmounted(() => {
  if (outputTimer) {
    clearInterval(outputTimer)
    outputTimer = null
  }
  if (cooldownTimer) {
    clearInterval(cooldownTimer)
    cooldownTimer = null
  }
  if (bubbleTimer) {
    clearInterval(bubbleTimer)
    bubbleTimer = null
  }
})
</script>

<style scoped>
.rpg-dungeon-title {
  font-family: serif;
  animation: dungeonTitleGlow 3s ease-in-out infinite;
  letter-spacing: 0.1em;
}
@keyframes dungeonTitleGlow {
  0%,
  100% {
    text-shadow:
      0 0 10px rgba(255, 200, 50, 0.5),
      0 0 20px rgba(255, 150, 0, 0.3);
  }
  50% {
    text-shadow:
      0 0 20px rgba(255, 200, 50, 0.9),
      0 0 40px rgba(255, 150, 0, 0.6);
  }
}

.dungeon-card {
  background: rgba(10, 8, 20, 0.75);
  border: 1px solid rgba(200, 160, 80, 0.3);
  backdrop-filter: blur(8px);
  box-shadow:
    0 4px 20px rgba(0, 0, 0, 0.5),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
}

.crystal-item {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid;
  transition: transform 0.2s ease;
}
.crystal-item:hover {
  transform: scale(1.05);
}

.dungeon-info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}
.dungeon-info-row:last-child {
  border-bottom: none;
}

.rpg-num {
  font-family: 'monospace';
  letter-spacing: 0.05em;
}
.counting-animation {
  animation: countUp 0.3s ease-out;
}
@keyframes countUp {
  from {
    transform: scale(1.2);
    color: #fff;
  }
  to {
    transform: scale(1);
  }
}

.rpg-btn {
  font-size: 1rem;
  letter-spacing: 0.1em;
  padding: 12px 32px;
  margin-left: 0px !important;
}

/* ── 冒险家探索动画 ── */
.dungeon-explorer-box {
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(200, 160, 80, 0.3);
  backdrop-filter: blur(2px);
  box-shadow: inset 0 0 20px rgba(0, 0, 0, 0.15);
  height: 120px;
  position: relative;
}

.dungeon-explorer-inner {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  border-radius: inherit;
  container-type: inline-size;
}

.dungeon-explorer {
  position: absolute;
  left: 0;
  width: 36px;
  animation-timing-function: linear;
  animation-iteration-count: infinite;
}

.dungeon-explorer-body {
  position: relative;
  width: 36px;
  height: 36px;
}

.dungeon-explorer.walk-right {
  animation-name: explorerMoveRight;
}

.dungeon-explorer.walk-left {
  animation-name: explorerMoveLeft;
}

.dungeon-explorer.walk-left .dungeon-explorer-avatar {
  transform: scaleX(-1);
}

/* 头像样式 */
.dungeon-explorer-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 2px solid rgba(255, 215, 0, 0.7);
  box-shadow:
    0 0 8px rgba(255, 200, 50, 0.4),
    0 2px 6px rgba(0, 0, 0, 0.6);
  background: rgba(0, 0, 0, 0.3);
}

/* 对话气泡 */
.explorer-bubble {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(255, 255, 255, 0.95);
  border-radius: 10px;
  padding: 2px 6px;
  font-size: 16px;
  line-height: 1.2;
  white-space: nowrap;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  pointer-events: none;
  z-index: 10;
}

.explorer-bubble--left {
  right: 100%;
  margin-right: 4px;
}

.explorer-bubble--right {
  left: 100%;
  margin-left: 4px;
}

/* 右侧气泡箭头（指向左侧头像） */
.explorer-bubble--right::before {
  content: '';
  position: absolute;
  left: -5px;
  top: 50%;
  transform: translateY(-50%);
  width: 0;
  height: 0;
  border-top: 5px solid transparent;
  border-bottom: 5px solid transparent;
  border-right: 6px solid rgba(255, 255, 255, 0.95);
}

/* 左侧气泡箭头（指向右侧头像） */
.explorer-bubble--left::after {
  content: '';
  position: absolute;
  right: -5px;
  top: 50%;
  transform: translateY(-50%);
  width: 0;
  height: 0;
  border-top: 5px solid transparent;
  border-bottom: 5px solid transparent;
  border-left: 6px solid rgba(255, 255, 255, 0.95);
}

/* 气泡进入/离开动画 */
.bubble-enter-active {
  animation: bubblePop 0.3s ease-out;
}
.bubble-leave-active {
  animation: bubblePop 0.25s ease-in reverse;
}

@keyframes bubblePop {
  0% {
    opacity: 0;
    transform: translateY(-50%) scale(0.5);
  }
  100% {
    opacity: 1;
    transform: translateY(-50%) scale(1);
  }
}

/* 走路上下弹跳 */
.dungeon-explorer-bounce {
  animation: explorerBounce var(--bounce-speed, 0.35s) ease-in-out infinite;
}

/* 从左到右穿越框体 */
@keyframes explorerMoveRight {
  0% {
    transform: translateX(-40px);
    opacity: 0;
  }
  3% {
    opacity: 1;
  }
  97% {
    opacity: 1;
  }
  100% {
    transform: translateX(calc(100cqw + 4px));
    opacity: 0;
  }
}

/* 从右到左穿越框体 */
@keyframes explorerMoveLeft {
  0% {
    transform: translateX(calc(100cqw + 4px));
    opacity: 0;
  }
  3% {
    opacity: 1;
  }
  97% {
    opacity: 1;
  }
  100% {
    transform: translateX(-40px);
    opacity: 0;
  }
}

/* 走路弹跳效果 */
@keyframes explorerBounce {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-5px);
  }
}
</style>

<template>
  <div class="w-full relative" :style="[{ minHeight: '70vh' }]">
    <!-- 遮罩层 -->
    <div class="absolute inset-0 z-0" />

    <!-- 内容层 -->
    <div class="relative z-10 py-6 max-w-lg mx-auto">
      <!-- 标题 -->
      <div class="text-center mb-6">
        <h1
          class="rpg-dungeon-title text-2xl font-bold text-yellow-300 drop-shadow-lg"
        >
          🏰 地下迷宫
        </h1>
        <p class="text-gray-300 text-sm mt-1">
          地下
          {{ dungeonInfo.dungeonsLevel || playerInfo?.dungeonsLevel || 1 }} 层
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
      <div
        ref="explorerBoxRef"
        class="dungeon-explorer-box rounded-2xl mb-4"
        :style="dungeonBgStyle"
      >
        <div class="dungeon-explorer-inner">
          <div
            v-for="(adv, idx) in exploringAdventurers"
            :key="adv._id || idx"
            class="dungeon-explorer"
            :class="adv.direction"
            :style="adv.animStyle"
            @animationend="handleAnimationEnd($event, adv)"
          >
            <div class="dungeon-explorer-body">
              <div class="dungeon-explorer-bounce">
                <!-- 搬运水晶泡泡（walk-left冒险家，随头像同步晃动） -->
                <div
                  v-if="adv.direction === 'walk-left' && adv.carryEmoji"
                  class="carry-bubble"
                ></div>
                <div
                  v-if="adv.direction === 'walk-left' && adv.carryEmoji"
                  class="carry-bubble-content"
                >
                  {{ adv.carryEmoji }}
                </div>
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
            <div class="relative inline-flex items-center justify-end">
              <span class="text-green-300 font-bold text-lg rpg-num">
                {{ currentOutput }}
              </span>
              <span
                v-for="f in floatingNumbers"
                :key="f.id"
                class="output-float-num"
                >+{{ f.value }}</span
              >
            </div>
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
      <!-- 自动分解设置 -->
      <div class="rpg-card rounded-xl p-1 mt-1">
        <!-- <p class="text-xs text-gray-400 mb-2">⚙️ 自动分解设置</p> -->
        <div class="flex flex-wrap items-center justify-center gap-1">
          <el-checkbox
            :model-value="autoDecomposeNormal"
            size="small"
            @change="handleAutoDecomposeNormalChange"
          >
            <span class="text-xs text-gray-600 dark:text-gray-300"
              >自动分解普通符文石</span
            >
          </el-checkbox>
          <el-checkbox
            :model-value="autoDecomposeRare"
            size="small"
            @change="handleAutoDecomposeRareChange"
          >
            <span class="text-xs text-gray-600 dark:text-gray-300"
              >自动分解稀有符文石</span
            >
          </el-checkbox>
        </div>
      </div>
      <!-- 操作按钮 -->
      <div class="flex flex-col gap-3">
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
        append-to-body
      >
        <div v-if="settleResult" class="space-y-2 text-sm">
          <div class="flex justify-between" style="color: #e05c4f">
            <span>⚔️ 攻击水晶</span>
            <span class="font-bold"
              >+{{
                formatNumberWithCommas(
                  settleResult.crystals?.attackCrystal || 0
                )
              }}</span
            >
          </div>
          <div class="flex justify-between" style="color: #4fa3e0">
            <span>🛡️ 防御水晶</span>
            <span class="font-bold"
              >+{{
                formatNumberWithCommas(
                  settleResult.crystals?.defenseCrystal || 0
                )
              }}</span
            >
          </div>
          <div class="flex justify-between" style="color: #6abf69">
            <span>💨 速度水晶</span>
            <span class="font-bold"
              >+{{
                formatNumberWithCommas(settleResult.crystals?.speedCrystal || 0)
              }}</span
            >
          </div>
          <div class="flex justify-between" style="color: #c070e0">
            <span>❤️ SAN水晶</span>
            <span class="font-bold"
              >+{{
                formatNumberWithCommas(settleResult.crystals?.sanCrystal || 0)
              }}</span
            >
          </div>
          <el-divider />
          <ObtainedRuneStonesDisplay
            v-if="settleResult.runeStones?.length > 0"
            :rune-stones="settleResult.runeStones"
          />
          <!-- 自动分解结果 -->
          <div
            v-if="settleResult.autoDecomposed"
            class="bg-purple-50 dark:bg-purple-900/20 border border-purple-400/30 rounded-lg p-3 text-sm"
          >
            <p class="text-purple-400 font-medium">🔮 已自动分解</p>
            <p class="text-gray-500 dark:text-gray-400 text-xs mt-1">
              获得
              {{
                formatNumberWithCommas(
                  settleResult.autoDecomposedFragments ?? 0
                )
              }}
              个符文石碎片
            </p>
          </div>
          <!-- 背包已满自动丢弃提示 -->
          <div
            v-if="
              settleResult.discardedRuneStones &&
              (settleResult.discardedRuneStones.normal > 0 ||
                settleResult.discardedRuneStones.rare > 0 ||
                settleResult.discardedRuneStones.legendary > 0)
            "
            class="mt-2 rounded p-2 text-xs bg-orange-500/10 border border-orange-500/30"
          >
            <p class="font-semibold text-orange-400 mb-1">
              ⚠️ 背包已满，已自动转换为符文石碎片：
            </p>
            <p
              v-if="settleResult.discardedRuneStones.normal > 0"
              style="color: #9ca3af"
            >
              普通符文石 ×{{ settleResult.discardedRuneStones.normal }}
            </p>
            <p
              v-if="settleResult.discardedRuneStones.rare > 0"
              style="color: #60a5fa"
            >
              稀有符文石 ×{{ settleResult.discardedRuneStones.rare }}
            </p>
            <p
              v-if="settleResult.discardedRuneStones.legendary > 0"
              style="color: #f59e0b"
            >
              传说符文石 ×{{ settleResult.discardedRuneStones.legendary }}
            </p>
            <p class="text-orange-300 font-semibold mt-1">
              共获得
              {{
                formatNumberWithCommas(settleResult.convertedFragments ?? 0)
              }}
              个符文石碎片
            </p>
          </div>
        </div>
      </el-dialog>

      <!-- 军团挑战弹窗 -->
      <el-dialog
        v-model="showLegionDialog"
        title="⚔️ 挑战迷宫军团"
        align-center
        destroy-on-close
        :close-on-click-modal="!challengeLoading"
        :close-on-press-escape="!challengeLoading"
        :show-close="!challengeLoading"
        append-to-body
      >
        <div class="space-y-4">
          <!-- 军团预览 -->
          <div v-if="legionPreviewLoading" class="text-center py-4">
            <span class="animate-spin inline-block text-2xl">⏳</span>
          </div>
          <div v-else-if="legionPreview">
            <div class="flex items-center justify-between mb-2">
              <p class="text-sm text-gray-500 dark:text-gray-400">
                敌方军团（{{ legionPreview.demons?.length || 0 }} 只恶魔）
              </p>
              <!-- <p
                class="text-sm font-semibold text-orange-500 dark:text-orange-400"
              >
                ⚔️ 敌方: {{ legionCombatPower }}
              </p> -->
            </div>
            <div class="grid grid-cols-5 gap-1 overflow-y-auto">
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
            <!-- 战斗力对比 -->
            <div
              class="mt-2 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm h-[64px] flex flex-col justify-center overflow-hidden"
            >
              <div
                v-if="selectedFormationDetailLoading"
                class="text-center text-gray-400"
              >
                计算战斗力...
              </div>
              <template v-else-if="myFormationCombatPower > 0">
                <div class="flex justify-between items-center px-1">
                  <span class="text-blue-500 font-mono font-bold"
                    >🏰 我方:
                    {{ formatNumberWithUnits(myFormationCombatPower) }}</span
                  >
                  <span class="text-orange-500 font-mono font-bold"
                    >😈 敌方:
                    {{ formatNumberWithUnits(legionCombatPower) }}</span
                  >
                </div>
                <div class="mt-1 text-center">
                  <span
                    v-if="myFormationCombatPower > legionCombatPower"
                    class="text-green-500 text-sm font-semibold"
                  >
                    ✅ 我方战斗力领先 +{{
                      formatNumberWithUnits(
                        myFormationCombatPower - legionCombatPower
                      )
                    }}
                  </span>
                  <span
                    v-else-if="myFormationCombatPower < legionCombatPower"
                    class="text-red-400 text-sm font-semibold"
                  >
                    ⚠️ 敌方战斗力领先 +{{
                      formatNumberWithUnits(
                        legionCombatPower - myFormationCombatPower
                      )
                    }}
                  </span>
                  <span v-else class="text-gray-400 text-sm font-semibold"
                    >战斗力持平</span
                  >
                </div>
              </template>
              <div v-else class="text-center text-gray-400 text-sm">
                请选择出战阵容
              </div>
            </div>
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
        append-to-body
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
          <div v-if="battleResult.upgraded" class="text-sm text-green-400">
            <p>迷宫等级提升！</p>
          </div>
          <div
            v-else-if="battleResultDisplay === 'win'"
            class="text-sm text-yellow-500"
          >
            <p>战斗获胜，但未能全歼敌方军团</p>
            <p class="text-xs text-gray-400 mt-1">
              需要将所有恶魔全部消灭才能升级迷宫
            </p>
          </div>
          <!-- 获得符文石 -->
          <ObtainedRuneStonesDisplay
            v-if="battleResult.droppedRuneStone"
            :rune-stones="[battleResult.droppedRuneStone]"
          />
          <!-- 自动分解结果 -->
          <div
            v-if="battleResult.autoDecomposed"
            class="bg-purple-50 dark:bg-purple-900/20 border border-purple-400/30 rounded-lg p-3 text-sm"
          >
            <p class="text-purple-400 font-medium">🔮 已自动分解</p>
            <p class="text-gray-500 dark:text-gray-400 text-xs mt-1">
              获得
              {{
                formatNumberWithCommas(
                  battleResult.autoDecomposedFragments ?? 0
                )
              }}
              个符文石碎片
            </p>
          </div>
          <!-- 背包已满转换碎片提示 -->
          <div
            v-if="battleResult.discardedRuneStone"
            class="bg-orange-900/30 rounded-lg p-2 text-xs text-orange-400"
          >
            ⚠️ 背包已满，符文石已自动转换为
            {{
              formatNumberWithCommas(
                battleResult.discardedRuneStone.convertedFragments ?? 0
              )
            }}
            个碎片
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
        append-to-body
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
import {
  getMyFormationsApi,
  getFormationDetailApi
} from '@/api/game/formation.js'
import { getMyAdventurersApi } from '@/api/game/adventurer.js'
import { getGameSettingsApi } from '@/api/game/config.js'
import { getMyRuneStonesApi } from '@/api/game/runeStone.js'
import BattleAnimation from '@/components/BattleAnimation.vue'
import ObtainedRuneStonesDisplay from '@/components/ObtainedRuneStonesDisplay.vue'
import { useDialogRoute } from '@/composables/useDialogRoute.js'
import {
  getCrystalProductionRateCap,
  getDungeonLevelBonus,
  getDungeonLevelBonusCap
} from 'shared/utils/guildLevelUtils.js'
import { calculateCombatPower } from 'shared/utils/gameDatabase.js'
import {
  formatNumberWithUnits,
  formatNumberWithCommas
} from 'shared/utils/utils.js'
import { BATTLE_COOLDOWN_SECONDS } from 'shared/constants/index.js'

const router = useRouter()
const { isLoggedIn, playerInfo, fetchPlayerInfo } = useGameUser()

// 游戏配置
const gameSettings = ref({})
async function fetchGameSettings() {
  try {
    const res = await getGameSettingsApi()
    gameSettings.value = res.data?.data || {}
  } catch {
    // 配置加载失败使用默认值
  }
}

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
function getRuneStoneRarityColor(rarity) {
  return (
    { normal: '#9ca3af', rare: '#60a5fa', legendary: '#f59e0b' }[rarity] ||
    '#ffffff'
  )
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
    ElMessage.success({ message: '产出等级已更新', showClose: true })
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
        BATTLE_COOLDOWN_SECONDS -
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
  const bgId = playerInfo.value?.dungeonsBackgroundId || null
  if (!bgId) return {}
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
  const bonusBase = gameSettings.value?.dungeonLevelProductionBonusBase ?? 100
  let bonus = getDungeonLevelBonus(dungeonLevel, bonusBase)
  const cap = getDungeonLevelBonusCap(guildLevel, bonusBase)
  bonus = Math.min(bonus, cap)
  return Math.max(bonus - bonusBase, 0)
})

// 是否迷宫增益被公会等级限制
const isDungeonBonusCapped = computed(() => {
  const dungeonLevel =
    dungeonInfo.value?.dungeonsLevel || playerInfo.value?.dungeonsLevel || 1
  const guildLevel = playerInfo.value?.guildLevel || 1
  const bonusBase = gameSettings.value?.dungeonLevelProductionBonusBase ?? 100
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
const floatingNumbers = ref([])
let floatingIdCounter = 0
let outputPrevValue = null
let outputTimer = null

function triggerFloating(increment) {
  const id = ++floatingIdCounter
  floatingNumbers.value.push({ id, value: increment })
  setTimeout(() => {
    const idx = floatingNumbers.value.findIndex(f => f.id === id)
    if (idx !== -1) floatingNumbers.value.splice(idx, 1)
  }, 1200)
}

function calcOutput() {
  const settleAt =
    dungeonInfo.value?.lastDungeonSettleAt ||
    playerInfo.value?.lastDungeonSettleAt
  let newOutput = 0
  if (settleAt) {
    const ms = Date.now() - new Date(settleAt).getTime()
    const secondsPassed = Math.max(Math.floor(ms / 1000), 0)
    // 产物数量 = 秒数 × 总产出倍率 / 6000（基础每分钟1个），上限99999
    const rate = totalProductionRateValue.value
    newOutput = Math.min(Math.floor((secondsPassed * rate) / 6000), 99999)
  }
  // 检测小幅增加才触发浮动动画（忽略初始化或结算后的大跳变）
  if (outputPrevValue !== null && newOutput > outputPrevValue) {
    const increment = newOutput - outputPrevValue
    if (increment > 0 && increment <= 10) {
      triggerFloating(increment)
    }
  }
  outputPrevValue = newOutput
  currentOutput.value = newOutput
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

// ── 自动分解偏好（与矿场共享 localStorage） ──
const autoDecomposeNormal = ref(
  localStorage.getItem('mine_auto_decompose_normal') === 'true'
)
const autoDecomposeRare = ref(
  localStorage.getItem('mine_auto_decompose_rare') === 'true'
)

function handleAutoDecomposeNormalChange(val) {
  autoDecomposeNormal.value = val
  localStorage.setItem('mine_auto_decompose_normal', String(val))
}

function handleAutoDecomposeRareChange(val) {
  autoDecomposeRare.value = val
  localStorage.setItem('mine_auto_decompose_rare', String(val))
}

/**
 * 检查符文石背包是否可能溢出，溢出时提示用户确认
 */
async function checkRuneStoneOverflow(crystalCount) {
  const dropRate = gameSettings.value?.runeStoneDropRate ?? 100
  const estimatedDrops = Math.min(
    Math.ceil((crystalCount * dropRate) / 10000),
    100
  )
  if (estimatedDrops <= 0) return true
  const runeStoneRes = await getMyRuneStonesApi({ page: 1, pageSize: 1 })
  const currentCount = runeStoneRes.data.data?.total ?? 0
  if (currentCount + estimatedDrops > 500) {
    try {
      await ElMessageBox.confirm(
        `当前符文石背包有 ${currentCount}/500 个，本次收取预计最多掉落 ${estimatedDrops} 个符文石，超出上限的部分将自动丢弃。\n\n是否继续？`,
        '⚠️ 符文石背包可能溢出',
        {
          confirmButtonText: '继续收取',
          cancelButtonText: '取消',
          type: 'warning'
        }
      )
    } catch {
      return false
    }
  }
  return true
}

/**
 * 结算收取水晶
 */
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
  // 检查符文石背包是否可能溢出
  if (!(await checkRuneStoneOverflow(currentOutput.value))) return
  settleLoading.value = true
  try {
    const res = await settleCrystalsApi({
      autoDecomposeNormal: autoDecomposeNormal.value,
      autoDecomposeRare: autoDecomposeRare.value
    })
    settleResult.value = res.data.data
    settleResultVisible.value = true
    ElMessage.success({ message: '收取成功！', showClose: true })
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
  // 切换迷宫时自动收取水晶，先检查符文石背包是否可能溢出
  if (currentOutput.value >= 1) {
    if (!(await checkRuneStoneOverflow(currentOutput.value))) return
  }
  switchLoading.value = true
  try {
    // 切换迷宫时自动收取水晶
    if (currentOutput.value >= 1) {
      try {
        const settleRes = await settleCrystalsApi({
          autoDecomposeNormal: autoDecomposeNormal.value,
          autoDecomposeRare: autoDecomposeRare.value
        })
        settleResult.value = settleRes.data.data
        settleResultVisible.value = true
      } catch {
        // 收取失败不影响切换
      }
    }
    const switchRes = await switchDungeonApi()
    ElMessage.success({ message: '切换成功！', showClose: true })

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

// 军团预览总战斗力
const legionCombatPower = computed(() => {
  if (!legionPreview.value?.demons?.length) return 0
  return legionPreview.value.demons.reduce(
    (total, demon) =>
      total + calculateCombatPower(demon, demon.runeStone || null),
    0
  )
})

// 所选阵容的详细数据（含冰险家属性）及其战斗力
const selectedFormationDetail = ref(null)
const selectedFormationDetailLoading = ref(false)

const myFormationCombatPower = computed(() => {
  if (!selectedFormationDetail.value?.grid) return 0
  let total = 0
  for (const row of selectedFormationDetail.value.grid) {
    for (const cell of row) {
      if (cell && typeof cell === 'object' && cell._id) {
        total += calculateCombatPower(cell, cell.runeStone || null)
      }
    }
  }
  return total
})

const myFormations = ref([])
const selectedFormationSlot = ref(null)

watch(
  () => selectedFormationSlot.value,
  async slot => {
    if (!slot) {
      selectedFormationDetail.value = null
      return
    }
    const formation = myFormations.value.find(f => f.slot === slot)
    if (!formation) return
    selectedFormationDetailLoading.value = true
    try {
      const res = await getFormationDetailApi(formation._id)
      selectedFormationDetail.value = res.data.data || null
    } catch {
      selectedFormationDetail.value = null
    } finally {
      selectedFormationDetailLoading.value = false
    }
  },
  { immediate: true }
)
const challengeLoading = ref(false)
const { visible: battleResultVisible } = useDialogRoute('battleResult')
const battleResult = ref(null)
const showBattleAnimation = ref(false)
const battleCooldown = ref(0)
let cooldownTimer = null

function startBattleCooldown() {
  battleCooldown.value = BATTLE_COOLDOWN_SECONDS
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
    const [previewRes, formRes, runeStoneRes] = await Promise.all([
      previewLegionApi(),
      getMyFormationsApi(),
      getMyRuneStonesApi({ page: 1, pageSize: 1 })
    ])
    legionPreview.value = previewRes.data.data
    myFormations.value = formRes.data.data || []
    if (myFormations.value.length > 0 && !selectedFormationSlot.value) {
      selectedFormationSlot.value = myFormations.value[0].slot
    }
    const runeStoneTotal = runeStoneRes.data.data?.total ?? 0
    if (runeStoneTotal >= 500) {
      try {
        await ElMessageBox.confirm(
          '符文石背包已满（500/500），胜利后必得的传说符文石将因空间不足而丢失。\n\n建议先前往「符文石」页面分解多余的符文石，再来挑战。\n\n是否仍要继续挑战？',
          '⚠️ 符文石背包已满',
          {
            confirmButtonText: '继续挑战',
            cancelButtonText: '暂不挑战',
            type: 'warning'
          }
        )
      } catch {
        return
      }
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
  if (battleResult.value?.upgraded) {
    ElMessage.success({ message: '胜利！迷宫等级提升！', showClose: true })
    // 如果当前选择的符文石产出等级是升级前的最高等级，自动切换到新等级
    const newDungeonLevel = dungeonInfo.value?.dungeonsLevel || 1
    if (selectedLevel.value < newDungeonLevel) {
      selectedLevel.value = newDungeonLevel
      // 同步服务端
      handleSelectLevel(newDungeonLevel)
    }
  } else if (battleResult.value?.battleResult?.winner === 'attacker') {
    ElMessage.warning({
      message: '战斗获胜，但未能全歼敌方军团，迷宫等级未提升',
      showClose: true
    })
  }
}

function handleGoToMine() {
  // 直接 replace 导航，避免 useDialogRoute 的 router.back() 与 push 冲突
  router.replace({ name: 'GameMine' })
}

// ── 冒险家探索动画 ──
const exploringAdventurers = ref([])
const explorerBoxRef = ref(null)
let resizeDebounceTimer = null

function buildExplorerStyle(idx, total, duration) {
  // 随机分布：用负delay让每个冒险家从动画的不同位置开始，避免挤在一侧
  const delay = -(Math.random() * duration)
  // 框高200px，头像36px，可用范围 0~164px
  const maxTop = 200 - 36
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

// ── 搬运水晶泡泡 ──
const CARRY_EMOJIS = ['⚔️', '🛡️', '💨', '❤️']

function getCarryEmoji() {
  return CARRY_EMOJIS[Math.floor(Math.random() * CARRY_EMOJIS.length)]
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
  '🫣',
  '🗡️',
  '🏹',
  '🪓',
  '🪄',
  '🔮',
  '📜',
  '🧭',
  '🏆',
  '👑',
  '💰',
  '🪙',
  '🧪',
  '🧫',
  '🐉',
  '👻',
  '🧙',
  '🧝',
  '🧌',
  '🦄',
  '🦇',
  '🌙',
  '⭐',
  '🗺️'
]

function showAdvBubble(adv) {
  if (!adv || adv.showBubble) return
  adv.bubbleEmoji = MOOD_EMOJIS[Math.floor(Math.random() * MOOD_EMOJIS.length)]
  adv.showBubble = true
  setTimeout(
    () => {
      adv.showBubble = false
    },
    2000 + Math.random() * 1000
  )
}

// 强制刷新气泡内容（即使正在显示也更新emoji）
function refreshAdvBubble(adv) {
  if (!adv) return
  adv.bubbleEmoji = MOOD_EMOJIS[Math.floor(Math.random() * MOOD_EMOJIS.length)]
  if (!adv.showBubble) {
    adv.showBubble = true
    setTimeout(
      () => {
        adv.showBubble = false
      },
      2000 + Math.random() * 1000
    )
  }
}

let bubbleTimer = null

function startBubbleTimer() {
  if (bubbleTimer) clearInterval(bubbleTimer)
  bubbleTimer = setInterval(
    () => {
      const advs = exploringAdventurers.value
      if (advs.length === 0) return
      const idx = Math.floor(Math.random() * advs.length)
      showAdvBubble(advs[idx])
    },
    3000 + Math.random() * 2000
  )
}

async function fetchExplorers() {
  try {
    const res = await getMyAdventurersApi()
    const all = res.data.data || []
    const MAX_EXPLORERS = 10
    const selected =
      all.length <= MAX_EXPLORERS
        ? all
        : all.sort(() => Math.random() - 0.5).slice(0, MAX_EXPLORERS)
    exploringAdventurers.value = selected.map((adv, idx) => {
      const duration = 10 + Math.random() * 10
      return {
        ...adv,
        direction: 'walk-right',
        animStyle: buildExplorerStyle(idx, selected.length, duration),
        animDuration: duration,
        showBubble: false,
        bubbleEmoji: '',
        carryEmoji: ''
      }
    })
    // 初始全部显示对话气泡
    exploringAdventurers.value.forEach(adv => {
      adv.bubbleEmoji =
        MOOD_EMOJIS[Math.floor(Math.random() * MOOD_EMOJIS.length)]

      // 随机决定是否显示
      adv.showBubble = Math.random() < 0.5

      // 如果显示才设置自动消失
      if (adv.showBubble) {
        setTimeout(
          () => {
            adv.showBubble = false
          },
          2000 + Math.random() * 1000
        )
      }
    })
    startBubbleTimer()
  } catch {
    // 获取失败不影响主流程
  }
}

function handleAnimationEnd(event, adv) {
  // 只处理当前元素自身的动画结束事件，忽略子元素冒泡（如气泡动画）
  if (event.target !== event.currentTarget) return
  if (adv.direction === 'walk-right') {
    // 到达右边，等1秒后：添加搬运泡泡、更新对话气泡、向左走
    setTimeout(() => {
      if (!exploringAdventurers.value.find(a => a._id === adv._id)) return
      adv.carryEmoji = getCarryEmoji()
      refreshAdvBubble(adv)
      adv.animStyle.animationDelay = '0s'
      adv.direction = 'walk-left'
    }, 1000)
  } else if (adv.direction === 'walk-left') {
    // 到达左边，等1秒后：移除搬运泡泡、更新对话气泡、向右走
    setTimeout(() => {
      if (!exploringAdventurers.value.find(a => a._id === adv._id)) return
      adv.carryEmoji = ''
      refreshAdvBubble(adv)
      adv.animStyle.animationDelay = '0s'
      adv.direction = 'walk-right'
    }, 1000)
  }
}

// ── 窗口大小变化防抖处理 ──
function onWindowResize() {
  clearTimeout(resizeDebounceTimer)
  resizeDebounceTimer = setTimeout(() => {
    // 水平移动由CSS left百分比自动适配，仅需重新计算垂直位置
    const box = explorerBoxRef.value
    if (!box) return
    const boxHeight = box.clientHeight
    const avatarSize = 36
    const maxTop = boxHeight - avatarSize
    const total = exploringAdventurers.value.length
    exploringAdventurers.value.forEach((adv, idx) => {
      const topPx = total <= 1 ? maxTop / 2 : (idx / (total - 1)) * maxTop
      adv.animStyle.top = `${Math.round(topPx)}px`
    })
  }, 200)
}

// ── 初始化 ──
onMounted(() => {
  fetchDungeonInfo()
  fetchGameSettings()
  fetchExplorers()
  calcOutput()
  calcElapsedTime()
  outputTimer = setInterval(() => {
    calcOutput()
    calcElapsedTime()
  }, 1000)
  window.addEventListener('resize', onWindowResize)
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
  window.removeEventListener('resize', onWindowResize)
  clearTimeout(resizeDebounceTimer)
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
  height: 200px;
  position: relative;
}

.dungeon-explorer-inner {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  border-radius: inherit;
}

.dungeon-explorer {
  position: absolute;
  width: 36px;
  animation-timing-function: linear;
  animation-iteration-count: 1;
  animation-fill-mode: both;
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
  background: rgba(255, 255, 255, 1);
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
  border-right: 6px solid rgba(255, 255, 255, 1);
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
  border-left: 6px solid rgba(255, 255, 255, 1);
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

/* 搬运水晶泡泡 */
.carry-bubble,
.carry-bubble-content {
  position: absolute;
  bottom: calc(100% + 2px);
  left: 50%;
  transform: translateX(-50%);

  width: 24px;
  height: 24px;
  border-radius: 50%;

  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  pointer-events: none;
  white-space: nowrap;
}
.carry-bubble {
  /* 泡泡主体 */
  background: radial-gradient(
    circle at 30% 30%,
    rgba(255, 255, 255, 0.9),
    rgba(255, 255, 255, 0.35) 40%,
    rgba(255, 255, 255, 0.15) 70%
  );

  border: 1px solid rgba(255, 255, 255, 0.4);

  /* 玻璃模糊 */
  backdrop-filter: blur(0.5px);

  box-shadow:
    inset 0 2px 4px rgba(255, 255, 255, 0.7),
    inset 0 -3px 6px rgba(0, 0, 0, 0.15),
    0 3px 10px rgba(0, 0, 0, 0.25);

  z-index: 5;
}
.carry-bubble-content {
  z-index: 4;
}

/* 反光 */
.carry-bubble::after {
  content: '';
  position: absolute;
  top: 3px;
  left: 5px;
  width: 8px;
  height: 5px;
  border-radius: 50%;

  background: radial-gradient(
    ellipse at center,
    rgba(255, 255, 255, 0.6),
    rgba(255, 255, 255, 0.2) 70%,
    transparent
  );

  transform: rotate(-20deg);
}

/* 产物数量浮动 +x 动画 */
.output-float-num {
  position: absolute;
  right: 0;
  top: -2px;
  color: #4ade80;
  font-size: 0.75em;
  font-weight: bold;
  pointer-events: none;
  white-space: nowrap;
  animation: outputFloatUp 1.2s ease-out forwards;
}
@keyframes outputFloatUp {
  0% {
    opacity: 1;
    transform: translateY(0);
  }
  20% {
    opacity: 1;
  }
  100% {
    opacity: 0;
    transform: translateY(-28px);
  }
}

/* 走路上下弹跳 */
.dungeon-explorer-bounce {
  position: relative;
  animation: explorerBounce var(--bounce-speed, 0.35s) ease-in-out infinite;
}

/* 从左到右穿越框体（使用 left 百分比兼容主流浏览器） */
@keyframes explorerMoveRight {
  0% {
    left: -40px;
  }
  100% {
    left: calc(100% + 4px);
  }
}

/* 从右到左穿越框体 */
@keyframes explorerMoveLeft {
  0% {
    left: calc(100% + 4px);
  }
  100% {
    left: -40px;
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

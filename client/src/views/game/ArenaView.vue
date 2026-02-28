<template>
  <div class="w-full py-6" style="min-height: 60vh">
    <!-- 页面标题 -->
    <div class="mb-6 text-center">
      <h1 class="rpg-title text-2xl font-bold text-gray-800 dark:text-gray-100">
        ⚔️ 竞技场
      </h1>
      <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
        与其他公会一较高下
      </p>
    </div>

    <!-- 加载 -->
    <div v-if="loading" class="flex justify-center py-12">
      <span class="animate-spin inline-block text-4xl">⏳</span>
    </div>

    <template v-else>
      <!-- ===== 赛季信息 ===== -->
      <div class="rpg-card rounded-xl p-4 mb-4">
        <div class="flex items-center justify-between mb-2">
          <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-200">
            🏆 赛季信息
          </h3>
          <span
            v-if="arenaInfo.season"
            class="text-xs text-yellow-500 border border-yellow-500 px-2 py-0.5 rounded-full"
          >
            第 {{ arenaInfo.season.seasonNumber }} 赛季
          </span>
        </div>
        <div v-if="arenaInfo.season" class="grid grid-cols-2 gap-2 text-sm">
          <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-2 text-center">
            <p class="text-[10px] text-gray-400">开始时间</p>
            <p class="text-xs font-mono text-gray-600 dark:text-gray-300">
              {{ formatTime(arenaInfo.season.startTime) }}
            </p>
          </div>
          <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-2 text-center">
            <p class="text-[10px] text-gray-400">结束时间</p>
            <p class="text-xs font-mono text-gray-600 dark:text-gray-300">
              {{ formatTime(arenaInfo.season.endTime) }}
            </p>
          </div>
          <div
            class="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-2 text-center"
          >
            <p class="text-[10px] text-gray-400">奖池总额</p>
            <p class="text-sm font-bold text-yellow-500">
              🪙 {{ arenaInfo.season.poolAmount?.toLocaleString() }}
            </p>
          </div>
          <div
            class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-2 text-center"
          >
            <p class="text-[10px] text-gray-400">每战奖金</p>
            <p class="text-sm font-bold text-blue-500">
              🪙 {{ arenaInfo.season.battleGold }}
            </p>
          </div>
        </div>
        <div v-else class="text-center text-gray-400 text-sm py-4">
          暂无进行中的赛季
        </div>
      </div>

      <!-- ===== 未报名状态 ===== -->
      <template v-if="!arenaInfo.registered">
        <div class="rpg-card rounded-xl p-4 mb-4 text-center">
          <p class="text-gray-500 dark:text-gray-400 mb-3">你还未报名本赛季</p>
          <p class="text-xs text-red-400 mb-3">
            ⚠️
            报名后，阵容中的冒险家将被锁定至赛季结束，期间不可替换，只能调整位置。
          </p>

          <!-- 选择阵容 -->
          <div class="mb-3">
            <el-select
              v-model="registerSlot"
              placeholder="选择阵容"
              size="small"
              class="w-48!"
              @change="handleSlotChange"
            >
              <el-option
                v-for="f in formations"
                :key="f.slot"
                :label="f.name || `阵容 ${f.slot}`"
                :value="f.slot"
              />
            </el-select>
          </div>

          <!-- 阵容预览 -->
          <div v-if="formationPreview" class="mb-3">
            <p class="text-xs text-gray-500 dark:text-gray-400 mb-2">
              📋 阵容预览（{{ formationPreviewCount }} 名冒险家）
            </p>
            <div class="grid grid-cols-5 gap-1 max-w-65 mx-auto">
              <template
                v-for="(row, rIdx) in formationPreview.grid"
                :key="rIdx"
              >
                <div
                  v-for="(cell, cIdx) in row"
                  :key="`${rIdx}-${cIdx}`"
                  class="aspect-square rounded border flex items-center justify-center text-xs"
                  :class="
                    cell
                      ? 'bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700'
                      : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                  "
                >
                  <template v-if="cell">
                    <span class="text-sm">{{
                      elementEmoji(cell.elements)
                    }}</span>
                  </template>
                </div>
              </template>
            </div>
          </div>
          <div v-if="formationPreviewLoading" class="mb-3 text-center">
            <span class="animate-spin inline-block text-xl">⏳</span>
          </div>

          <el-button
            type="primary"
            :loading="registerLoading"
            :disabled="registerLoading || !registerSlot"
            @click="handleRegister"
          >
            ⚔️ 报名参赛
          </el-button>
        </div>
      </template>

      <!-- ===== 已报名状态 ===== -->
      <template v-else>
        <!-- 我的状态卡片 -->
        <div class="rpg-card rounded-xl p-4 mb-4">
          <div class="grid grid-cols-3 gap-2 text-center">
            <div>
              <p class="text-[10px] text-gray-400">竞技点</p>
              <p class="text-lg font-bold text-yellow-500">
                {{ arenaInfo.registration?.points ?? 500 }}
              </p>
            </div>
            <div>
              <p class="text-[10px] text-gray-400">剩余挑战</p>
              <p class="text-lg font-bold text-blue-500">
                {{ arenaInfo.registration?.challengeUses ?? 0 }}
              </p>
            </div>
            <div>
              <p class="text-[10px] text-gray-400">对战次数</p>
              <p class="text-lg font-bold text-green-500">
                {{ arenaInfo.registration?.totalBattleCount ?? 0 }}
              </p>
            </div>
          </div>
          <p
            v-if="arenaInfo.nextRecoverIn"
            class="text-center text-[10px] text-gray-400 mt-2"
          >
            ⏰ 下次恢复: {{ Math.ceil(arenaInfo.nextRecoverIn / 60) }} 分钟后
          </p>
        </div>

        <!-- 标签切换 -->
        <div class="flex justify-center gap-2 mb-4">
          <el-button
            :type="arenaTab === 'match' ? 'primary' : 'default'"
            size="small"
            @click="handleSwitchArenaTab('match')"
          >
            🎯 匹配对手
          </el-button>
          <el-button
            :type="arenaTab === 'leaderboard' ? 'primary' : 'default'"
            size="small"
            @click="handleSwitchArenaTab('leaderboard')"
          >
            🏅 排行榜
          </el-button>
          <el-button
            :type="arenaTab === 'logs' ? 'primary' : 'default'"
            size="small"
            @click="handleSwitchArenaTab('logs')"
          >
            📜 战斗记录
          </el-button>
        </div>

        <!-- ===== 匹配对手 ===== -->
        <div v-if="arenaTab === 'match'">
          <div v-if="matchLoading" class="flex justify-center py-8">
            <span class="animate-spin inline-block text-2xl">⏳</span>
          </div>
          <template v-else>
            <div
              v-if="matchList.length === 0"
              class="text-center py-8 text-gray-400 text-sm"
            >
              暂无可匹配对手
            </div>
            <div v-else class="space-y-2">
              <div
                v-for="opponent in matchList"
                :key="opponent._id || opponent.npcId"
                class="rpg-card rounded-xl p-3"
              >
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-3 min-w-0">
                    <div
                      class="w-10 h-10 rounded-lg flex items-center justify-center text-lg bg-gray-200 dark:bg-gray-700"
                    >
                      {{ opponent.isNPC ? '🤖' : '🏰' }}
                    </div>
                    <div class="min-w-0">
                      <p
                        class="text-sm font-semibold text-gray-700 dark:text-gray-200 truncate"
                      >
                        {{ opponent.guildName }}
                        <span
                          v-if="opponent.isNPC"
                          class="text-[10px] text-gray-400"
                          >(NPC)</span
                        >
                      </p>
                      <p class="text-xs text-gray-400">
                        竞技点: {{ opponent.points }}
                      </p>
                    </div>
                  </div>
                  <el-button
                    type="danger"
                    size="small"
                    :loading="
                      challengeLoading === (opponent._id || opponent.npcId)
                    "
                    :disabled="
                      !!challengeLoading ||
                      (arenaInfo.registration?.challengeUses ?? 0) <= 0
                    "
                    @click="handleChallenge(opponent)"
                  >
                    ⚔️ 挑战
                  </el-button>
                </div>
              </div>
            </div>
            <div class="flex justify-center mt-4">
              <el-button
                text
                size="small"
                :loading="matchLoading"
                @click="fetchMatchList"
                >🔄 刷新对手</el-button
              >
            </div>
          </template>
        </div>

        <!-- ===== 排行榜 ===== -->
        <div v-if="arenaTab === 'leaderboard'">
          <div v-if="leaderboardLoading" class="flex justify-center py-8">
            <span class="animate-spin inline-block text-2xl">⏳</span>
          </div>
          <template v-else>
            <div
              v-if="leaderboard.length === 0"
              class="text-center py-8 text-gray-400 text-sm"
            >
              暂无数据
            </div>
            <div v-else class="space-y-2">
              <div
                v-for="(player, idx) in leaderboard"
                :key="player._id"
                class="rpg-card rounded-xl p-3"
              >
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-3">
                    <div
                      class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                      :class="rankClass(idx)"
                    >
                      {{ idx + 1 }}
                    </div>
                    <div>
                      <p
                        class="text-sm font-semibold text-gray-700 dark:text-gray-200"
                      >
                        {{ player.guildName }}
                      </p>
                      <p class="text-xs text-gray-400">
                        对战 {{ player.totalBattleCount }} 次
                      </p>
                    </div>
                  </div>
                  <span class="text-sm font-bold text-yellow-500"
                    >{{ player.points }} pt</span
                  >
                </div>
              </div>
            </div>
          </template>
        </div>

        <!-- ===== 战斗记录 ===== -->
        <div v-if="arenaTab === 'logs'">
          <div v-if="logsLoading" class="flex justify-center py-8">
            <span class="animate-spin inline-block text-2xl">⏳</span>
          </div>
          <template v-else>
            <div
              v-if="battleLogs.length === 0"
              class="text-center py-8 text-gray-400 text-sm"
            >
              暂无记录
            </div>
            <div v-else class="space-y-2">
              <div
                v-for="log in battleLogs"
                :key="log._id"
                class="rpg-card rounded-xl p-3 cursor-pointer"
                @click="handleViewLogDetail(log)"
              >
                <div class="flex items-center justify-between">
                  <div class="min-w-0">
                    <p class="text-sm text-gray-700 dark:text-gray-200">
                      <span v-if="log.isAttacker" class="text-blue-400"
                        >主动挑战</span
                      >
                      <span v-else class="text-orange-400">被挑战</span>
                      <span class="ml-1">{{
                        log.opponentName || (log.isNPC ? 'NPC' : '未知')
                      }}</span>
                    </p>
                    <p class="text-xs text-gray-400 mt-0.5">
                      {{ formatTime(log.createdAt) }}
                      · {{ log.rounds }} 回合
                      <span
                        v-if="log.goldEarned > 0"
                        class="text-yellow-500 ml-1"
                        >+🪙{{ log.goldEarned }}</span
                      >
                    </p>
                  </div>
                  <div class="text-right flex items-center gap-2">
                    <div>
                      <span
                        class="text-sm font-bold"
                        :class="
                          log.isWin
                            ? 'text-green-500'
                            : log.isDraw
                              ? 'text-gray-400'
                              : 'text-red-500'
                        "
                      >
                        {{ log.isWin ? '胜利' : log.isDraw ? '平局' : '失败' }}
                      </span>
                      <p
                        class="text-xs"
                        :class="
                          log.pointsChange >= 0
                            ? 'text-green-400'
                            : 'text-red-400'
                        "
                      >
                        {{ log.pointsChange >= 0 ? '+' : ''
                        }}{{ log.pointsChange }} pt
                      </p>
                    </div>
                    <span class="text-gray-400 text-xs">▶</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- 分页 -->
            <div
              v-if="logsTotal > logsPageSize"
              class="flex justify-center mt-4"
            >
              <el-pagination
                v-model:current-page="logsPage"
                :page-size="logsPageSize"
                :total="logsTotal"
                layout="prev, pager, next"
                small
                @current-change="fetchBattleLogs"
              />
            </div>
          </template>
        </div>
      </template>
    </template>

    <!-- ===== 战斗结果弹窗 ===== -->
    <el-dialog
      v-model="battleResultVisible"
      title="⚔️ 战斗结果"
      width="340px"
      align-center
    >
      <div v-if="battleResult" class="text-center space-y-3">
        <div class="text-4xl mb-2">
          {{ battleResult.isWin ? '🎉' : battleResult.isDraw ? '🤝' : '😔' }}
        </div>
        <p
          class="text-xl font-bold"
          :class="
            battleResult.isWin
              ? 'text-green-500'
              : battleResult.isDraw
                ? 'text-gray-400'
                : 'text-red-500'
          "
        >
          {{
            battleResult.isWin
              ? '胜利！'
              : battleResult.isDraw
                ? '平局'
                : '失败'
          }}
        </p>
        <div
          class="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 space-y-1 text-sm"
        >
          <p>
            <span class="text-gray-400">回合数:</span>
            <span class="ml-2 font-mono">{{ battleResult.rounds }}</span>
          </p>
          <p>
            <span class="text-gray-400">竞技点变化:</span>
            <span
              class="ml-2 font-bold"
              :class="
                battleResult.pointsChange >= 0
                  ? 'text-green-500'
                  : 'text-red-500'
              "
            >
              {{ battleResult.pointsChange >= 0 ? '+' : ''
              }}{{ battleResult.pointsChange }}
            </span>
          </p>
          <p v-if="battleResult.goldEarned > 0">
            <span class="text-gray-400">获得金币:</span>
            <span class="ml-2 text-yellow-500 font-bold"
              >🪙 {{ battleResult.goldEarned }}</span
            >
          </p>
        </div>
      </div>
    </el-dialog>

    <!-- ===== 战斗演出 ===== -->
    <BattleAnimation
      v-if="showBattleAnimation"
      :battle-log="battleResult.battleResult.log"
      :attacker-units="battleResult.battleResult.attackerUnits"
      :defender-units="battleResult.battleResult.defenderUnits"
      :total-rounds="battleResult.battleResult.rounds"
      attacker-label="我方"
      :defender-label="battleResult.opponentGuildName || '对手'"
      @done="onBattleAnimationDone"
    />

    <!-- ===== 战斗记录详情弹窗 ===== -->
    <el-dialog
      v-model="logDetailVisible"
      title="📜 战斗记录详情"
      width="95%"
      style="max-width: 500px"
      align-center
    >
      <div v-if="logDetailLoading" class="flex justify-center py-8">
        <span class="animate-spin inline-block text-2xl">⏳</span>
      </div>
      <template v-else-if="logDetail">
        <!-- 版本不匹配 -->
        <div v-if="logDetail.versionMismatch" class="text-center py-4">
          <p class="text-4xl mb-3">🔒</p>
          <p class="text-gray-500 dark:text-gray-400 mb-2">
            {{ logDetail.message }}
          </p>
          <div
            class="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 text-sm space-y-1"
          >
            <p>
              <span class="text-gray-400">结果:</span>
              <span
                class="ml-2 font-bold"
                :class="getLogWinClass(logDetail.basicInfo)"
                >{{ getLogWinText(logDetail.basicInfo) }}</span
              >
            </p>
            <p>
              <span class="text-gray-400">回合数:</span>
              <span class="ml-2">{{ logDetail.basicInfo.rounds }}</span>
            </p>
          </div>
        </div>
        <!-- 正常详情 -->
        <div v-else class="space-y-4">
          <!-- 对战信息 -->
          <div class="flex items-center justify-between text-sm">
            <div class="text-center flex-1">
              <p class="font-semibold text-blue-500">
                🏰 {{ logDetail.attackerGuildName }}
              </p>
              <p class="text-xs text-gray-400">挑战方</p>
            </div>
            <div class="text-xl font-bold text-gray-400 px-2">VS</div>
            <div class="text-center flex-1">
              <p class="font-semibold text-red-500">
                {{ logDetail.isNPC ? '🤖' : '🏰' }}
                {{ logDetail.defenderGuildName }}
              </p>
              <p class="text-xs text-gray-400">
                {{ logDetail.isNPC ? 'NPC' : '防守方' }}
              </p>
            </div>
          </div>

          <!-- 结果摘要 -->
          <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 text-center">
            <span class="text-lg font-bold" :class="getLogWinClass(logDetail)">
              {{ getLogWinText(logDetail) }}
            </span>
            <span class="text-gray-400 text-sm ml-2"
              >{{ logDetail.rounds }} 回合</span
            >
            <span
              v-if="logDetail.goldEarned > 0"
              class="text-yellow-500 text-sm ml-2"
              >+🪙{{ logDetail.goldEarned }}</span
            >
          </div>

          <!-- 阵容展示 -->
          <div class="grid grid-cols-2 gap-3">
            <!-- 挑战方阵容 -->
            <div>
              <p class="text-xs text-gray-400 mb-1 text-center">挑战方阵容</p>
              <div class="grid grid-cols-5 gap-0.5">
                <template v-for="r in 5" :key="'a' + r">
                  <template v-for="c in 5" :key="'a' + r + '-' + c">
                    <div
                      class="aspect-square rounded border flex items-center justify-center"
                      :class="
                        getUnitAt(logDetail.attackerUnits, r - 1, c - 1)
                          ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700'
                          : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                      "
                      :title="
                        getUnitTooltip(
                          getUnitAt(logDetail.attackerUnits, r - 1, c - 1)
                        )
                      "
                    >
                      <span
                        v-if="getUnitAt(logDetail.attackerUnits, r - 1, c - 1)"
                        class="text-[10px]"
                        >{{
                          elementEmoji(
                            getUnitAt(logDetail.attackerUnits, r - 1, c - 1)
                              .elements
                          )
                        }}</span
                      >
                    </div>
                  </template>
                </template>
              </div>
            </div>
            <!-- 防守方阵容 -->
            <div>
              <p class="text-xs text-gray-400 mb-1 text-center">防守方阵容</p>
              <div class="grid grid-cols-5 gap-0.5">
                <template v-for="r in 5" :key="'d' + r">
                  <template v-for="c in 5" :key="'d' + r + '-' + c">
                    <div
                      class="aspect-square rounded border flex items-center justify-center"
                      :class="
                        getUnitAt(logDetail.defenderUnits, r - 1, c - 1)
                          ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700'
                          : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                      "
                      :title="
                        getUnitTooltip(
                          getUnitAt(logDetail.defenderUnits, r - 1, c - 1)
                        )
                      "
                    >
                      <span
                        v-if="getUnitAt(logDetail.defenderUnits, r - 1, c - 1)"
                        class="text-[10px]"
                        >{{
                          elementEmoji(
                            getUnitAt(logDetail.defenderUnits, r - 1, c - 1)
                              .elements
                          )
                        }}</span
                      >
                    </div>
                  </template>
                </template>
              </div>
            </div>
          </div>

          <!-- 单位详情列表 -->
          <div class="space-y-2">
            <p class="text-xs text-gray-400">👥 冒险家属性快照</p>
            <div class="max-h-60 overflow-y-auto space-y-1">
              <div
                v-for="unit in [
                  ...logDetail.attackerUnits,
                  ...logDetail.defenderUnits
                ]"
                :key="unit.adventurerId + unit.row + unit.col"
                class="bg-gray-50 dark:bg-gray-800 rounded p-2 text-xs flex items-center gap-2"
              >
                <span class="text-sm">{{ elementEmoji(unit.elements) }}</span>
                <div class="min-w-0 flex-1">
                  <p
                    class="font-semibold text-gray-700 dark:text-gray-200 truncate"
                  >
                    {{ unit.name }}
                    <span v-if="unit.isDemon" class="text-red-400">(恶魔)</span>
                  </p>
                  <p class="text-gray-400">
                    ⚔️{{ unit.attackLevel }} 🛡️{{ unit.defenseLevel }} 💨{{
                      unit.speedLevel
                    }}
                    💚{{ unit.SANLevel }}
                    <span v-if="unit.runeStone" class="ml-1"
                      >💎Lv{{ unit.runeStone.level }}</span
                    >
                  </p>
                </div>
              </div>
            </div>
          </div>

          <p class="text-xs text-gray-400 text-center">
            {{ formatTime(logDetail.createdAt) }}
          </p>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  getArenaInfoApi,
  registerArenaApi,
  getMatchListApi,
  challengeOpponentApi,
  getLeaderboardApi,
  getMyBattleLogsApi,
  getBattleLogDetailApi
} from '@/api/game/arena.js'
import {
  getMyFormationsApi,
  getFormationDetailApi
} from '@/api/game/formation.js'
import { useGameUser } from '@/composables/useGameUser.js'
import BattleAnimation from '@/components/BattleAnimation.vue'

const router = useRouter()
const { isLoggedIn, fetchPlayerInfo } = useGameUser()
if (!isLoggedIn.value) {
  router.replace('/game/login')
}

const loading = ref(false)
const arenaInfo = ref({
  season: null,
  registered: false,
  registration: null,
  nextRecoverIn: 0
})
const formations = ref([])
const registerSlot = ref(null)
const registerLoading = ref(false)
const formationPreview = ref(null)
const formationPreviewLoading = ref(false)
const formationPreviewCount = ref(0)

const arenaTab = ref('match')

// 匹配对手
const matchList = ref([])
const matchLoading = ref(false)
const challengeLoading = ref(null)

// 排行榜
const leaderboard = ref([])
const leaderboardLoading = ref(false)

// 战斗记录
const battleLogs = ref([])
const logsLoading = ref(false)
const logsPage = ref(1)
const logsPageSize = 20
const logsTotal = ref(0)

// 战斗结果
const battleResultVisible = ref(false)
const battleResult = ref(null)
const showBattleAnimation = ref(false)

// 战斗记录详情
const logDetailVisible = ref(false)
const logDetailLoading = ref(false)
const logDetail = ref(null)

async function fetchArenaInfo() {
  loading.value = true
  try {
    const res = await getArenaInfoApi()
    arenaInfo.value = res.data.data || {}
  } catch {
  } finally {
    loading.value = false
  }
}

async function fetchFormations() {
  try {
    const res = await getMyFormationsApi()
    formations.value = res.data.data || []
  } catch {}
}

async function handleSlotChange(slot) {
  if (!slot) {
    formationPreview.value = null
    return
  }
  const formation = formations.value.find(f => f.slot === slot)
  if (!formation) return

  formationPreviewLoading.value = true
  try {
    const res = await getFormationDetailApi(formation._id)
    formationPreview.value = res.data.data || null
    formationPreviewCount.value = (res.data.data?.grid || [])
      .flat()
      .filter(c => c !== null).length
  } catch {
    formationPreview.value = null
  } finally {
    formationPreviewLoading.value = false
  }
}

async function handleRegister() {
  if (!registerSlot.value) {
    ElMessage.warning('请选择阵容')
    return
  }

  try {
    await ElMessageBox.confirm(
      '报名后，阵容中的冒险家将被锁定至赛季结束，期间不可替换，只能调整位置。确定报名？',
      '确认报名',
      {
        confirmButtonText: '确定报名',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
  } catch {
    return
  }

  // 二次确认
  try {
    await ElMessageBox.confirm(
      '请再次确认：报名后冒险家将被锁定，无法在阵容中替换其他冒险家。确定继续？',
      '二次确认',
      { confirmButtonText: '确认', cancelButtonText: '取消', type: 'warning' }
    )
  } catch {
    return
  }

  registerLoading.value = true
  try {
    await registerArenaApi({ formationSlot: registerSlot.value })
    ElMessage.success('报名成功！')
    await fetchArenaInfo()
    // 自动加载匹配
    fetchMatchList()
  } catch (e) {
    ElMessage.error(e.response?.data?.message || '报名失败')
  } finally {
    registerLoading.value = false
  }
}

function handleSwitchArenaTab(tab) {
  arenaTab.value = tab
  if (tab === 'match') {
    fetchMatchList()
  } else if (tab === 'leaderboard') {
    fetchLeaderboard()
  } else if (tab === 'logs') {
    fetchBattleLogs()
  }
}

async function fetchMatchList() {
  matchLoading.value = true
  try {
    const res = await getMatchListApi()
    matchList.value = res.data.data?.list || []
  } catch {
    matchList.value = []
  } finally {
    matchLoading.value = false
  }
}

async function handleChallenge(opponent) {
  const id = opponent._id || opponent.npcId
  challengeLoading.value = id
  try {
    const res = await challengeOpponentApi({
      opponentId: opponent.isNPC ? opponent._id : opponent.accountId
    })
    const result = res.data.data
    // 添加便捷字段供模板使用
    result.isWin = result.battleResult.winner === 'attacker'
    result.isDraw = result.battleResult.winner === 'draw'
    result.rounds = result.battleResult.rounds
    battleResult.value = result
    // 先展示战斗演出
    showBattleAnimation.value = true
    // 刷新状态
    await fetchArenaInfo()
    await fetchPlayerInfo()
  } catch (e) {
    ElMessage.error(e.response?.data?.message || '挑战失败')
  } finally {
    challengeLoading.value = null
  }
}

function onBattleAnimationDone() {
  showBattleAnimation.value = false
  battleResultVisible.value = true
}

async function fetchLeaderboard() {
  leaderboardLoading.value = true
  try {
    const res = await getLeaderboardApi()
    leaderboard.value = res.data.data?.list || []
  } catch {
    leaderboard.value = []
  } finally {
    leaderboardLoading.value = false
  }
}

async function fetchBattleLogs() {
  logsLoading.value = true
  try {
    const res = await getMyBattleLogsApi({
      page: logsPage.value,
      pageSize: logsPageSize
    })
    battleLogs.value = res.data.data?.list || []
    logsTotal.value = res.data.data?.total || 0
  } catch {
    battleLogs.value = []
  } finally {
    logsLoading.value = false
  }
}

async function handleViewLogDetail(log) {
  logDetailVisible.value = true
  logDetailLoading.value = true
  logDetail.value = null
  try {
    const res = await getBattleLogDetailApi(log._id)
    logDetail.value = res.data.data || null
  } catch (e) {
    ElMessage.error(e.response?.data?.message || '获取详情失败')
    logDetailVisible.value = false
  } finally {
    logDetailLoading.value = false
  }
}

const ELEMENT_EMOJI_MAP = {
  1: '🌍',
  2: '💧',
  3: '🔥',
  4: '🌪️',
  5: '☀️',
  6: '🌑'
}
function elementEmoji(el) {
  return ELEMENT_EMOJI_MAP[el] || '❓'
}

function getUnitAt(units, row, col) {
  if (!units) return null
  return units.find(u => u.row === row && u.col === col) || null
}

function getUnitTooltip(unit) {
  if (!unit) return ''
  return `${unit.name} | ⚔️${unit.attackLevel} 🛡️${unit.defenseLevel} 💨${unit.speedLevel} 💚${unit.SANLevel}`
}

function getLogWinClass(detail) {
  if (!detail) return ''
  // 从查看者角度判断
  if (detail.winner === 'draw') return 'text-gray-400'
  if (detail.winner === 'attacker') return 'text-green-500'
  return 'text-red-500'
}

function getLogWinText(detail) {
  if (!detail) return ''
  if (detail.winner === 'draw') return '平局'
  if (detail.winner === 'attacker') return '挑战方胜'
  return '防守方胜'
}

function rankClass(idx) {
  if (idx === 0) return 'bg-yellow-400 text-white'
  if (idx === 1) return 'bg-gray-400 text-white'
  if (idx === 2) return 'bg-orange-400 text-white'
  return 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
}

function formatTime(t) {
  if (!t) return ''
  const d = new Date(t)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

onMounted(async () => {
  await Promise.all([fetchArenaInfo(), fetchFormations()])
  if (arenaInfo.value.registered) {
    fetchMatchList()
  }
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
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}
</style>

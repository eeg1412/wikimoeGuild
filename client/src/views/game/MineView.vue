<template>
  <div class="w-full py-6" style="min-height: 60vh">
    <!-- 页面标题 -->
    <div class="mb-6 text-center">
      <h1 class="rpg-title text-2xl font-bold text-gray-800 dark:text-gray-100">
        ⛏️ 矿场
      </h1>
      <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
        探索矿场，获取宝贵资源
      </p>
    </div>

    <!-- 挖矿信息 -->
    <div class="rpg-card rounded-xl p-3 mb-4">
      <div class="flex items-center justify-between text-sm">
        <div class="flex items-center gap-2">
          <span class="text-yellow-500">⛏️</span>
          <span class="text-gray-600 dark:text-gray-300">剩余挖矿次数:</span>
          <span class="font-bold text-blue-500">{{
            miningInfo.miningCanUses ?? 0
          }}</span>
        </div>
        <div v-if="miningInfo.nextRecoverIn" class="text-sm text-gray-400">
          ⏰ {{ Math.ceil(miningInfo.nextRecoverIn / 60) }}分钟后恢复
        </div>
      </div>
    </div>

    <!-- 标签切换 -->
    <div class="flex justify-center gap-2 mb-4">
      <el-button
        :type="activeTab === 'list' ? 'primary' : 'default'"
        size="small"
        @click="handleSwitchTab('list')"
      >
        📋 矿场列表
      </el-button>
      <el-button
        :type="activeTab === 'revenue' ? 'primary' : 'default'"
        size="small"
        @click="handleSwitchTab('revenue')"
      >
        💰 矿主收益
      </el-button>
    </div>

    <!-- ===== 矿场列表 ===== -->
    <div v-if="activeTab === 'list'">
      <!-- 筛选 -->
      <div class="rpg-card rounded-xl p-3 mb-3">
        <div class="flex items-center gap-2 flex-wrap">
          <el-input
            v-model="filterMinLevel"
            placeholder="最低等级"
            size="small"
            type="number"
            class="w-24!"
          />
          <span class="text-gray-400">~</span>
          <el-input
            v-model="filterMaxLevel"
            placeholder="最高等级"
            size="small"
            type="number"
            class="w-24!"
          />
          <el-button
            size="small"
            type="primary"
            :loading="listLoading"
            @click="handleFilterMines"
            >🔍 筛选</el-button
          >
        </div>
      </div>

      <div v-if="listLoading" class="flex justify-center py-8">
        <span class="animate-spin inline-block text-2xl">⏳</span>
      </div>
      <template v-else>
        <div
          v-if="mineList.length === 0"
          class="text-center py-8 text-gray-400 text-sm"
        >
          暂无矿场
        </div>
        <div v-else class="space-y-2">
          <div
            v-for="mine in mineList"
            :key="mine._id"
            class="rpg-card rounded-xl p-3 cursor-pointer"
            @click="handleEnterMine(mine._id)"
          >
            <div class="flex items-center justify-between">
              <div class="min-w-0">
                <p
                  class="text-sm font-semibold text-gray-700 dark:text-gray-200"
                >
                  ⛰️ Lv.{{ mine.level }} 矿场
                  <span
                    v-if="mine.owner === playerId"
                    class="text-xs text-yellow-500 ml-1"
                    >👑 我的</span
                  >
                </p>
                <p class="text-sm text-gray-400 mt-0.5">
                  矿主: {{ mine.ownerGuildName }} · 奖励进度:
                  {{ mine.exploredRewards }}/{{ mine.totalRewards }}
                </p>
              </div>
              <span class="text-gray-400 text-sm">▶</span>
            </div>
          </div>
        </div>

        <div v-if="listTotal > listPageSize" class="flex justify-center mt-4">
          <el-pagination
            v-model:current-page="listPage"
            :page-size="listPageSize"
            :total="listTotal"
            layout="prev, pager, next"
            small
            @current-change="fetchMineList"
          />
        </div>
      </template>
    </div>

    <!-- ===== 当前矿场 ===== -->
    <div v-if="activeTab === 'mine'">
      <div v-if="!currentMine" class="text-center py-8 text-gray-400 text-sm">
        请先从矿场列表中选择一个矿场
      </div>
      <template v-else>
        <!-- 矿场信息 -->
        <div class="rpg-card rounded-xl p-3 mb-3">
          <div class="flex items-center justify-between text-sm">
            <div>
              <span class="font-semibold text-gray-700 dark:text-gray-200"
                >⛰️ Lv.{{ currentMine.level }} 矿场</span
              >
              <span class="text-sm text-gray-400 ml-2"
                >矿主: {{ currentMine.ownerGuildName }}</span
              >
            </div>
            <div class="text-sm text-gray-400">
              奖励: {{ currentMine.exploredRewards }}/{{
                currentMine.totalRewards
              }}
            </div>
          </div>
        </div>

        <!-- 阵容选择 -->
        <div class="rpg-card rounded-xl p-3 mb-3">
          <div class="flex items-center gap-2">
            <span class="text-sm text-gray-400">战斗阵容:</span>
            <el-select
              v-model="selectedFormationSlot"
              placeholder="选择阵容"
              size="small"
              class="flex-1"
              @change="handleFormationSlotChange"
            >
              <el-option
                v-for="f in formations"
                :key="f.slot"
                :label="f.name || `阵容 ${f.slot}`"
                :value="f.slot"
              />
            </el-select>
          </div>
        </div>

        <!-- 扫雷棋盘 -->
        <div class="rpg-card rounded-xl p-3 mb-3 overflow-x-auto">
          <div class="grid grid-cols-10 gap-0.5 min-w-75 max-w-100 mx-auto">
            <template v-for="(row, rIdx) in currentMine.grid" :key="rIdx">
              <button
                v-for="(cell, cIdx) in row"
                :key="`${rIdx}-${cIdx}`"
                class="mine-cell aspect-square rounded flex items-center justify-center text-xs font-bold transition-all"
                :class="getCellClass(cell)"
                :disabled="isCellDisabled(cell)"
                @click="handleDigCell(rIdx, cIdx, cell)"
              >
                <template
                  v-if="
                    digCellPos &&
                    digCellPos.row === rIdx &&
                    digCellPos.col === cIdx
                  "
                >
                  <span class="animate-spin inline-block">⏳</span>
                </template>
                <template v-else-if="cell.revealed">
                  <template v-if="cell.type === 'reward'">
                    <span v-if="cell.challengeDefeated" class="text-green-500"
                      >💎</span
                    >
                    <span v-else class="text-red-500 animate-pulse">👹</span>
                  </template>
                  <template v-else>
                    <span
                      v-if="cell.adjacentRewards > 0"
                      :class="getNumberColor(cell.adjacentRewards)"
                      >{{ cell.adjacentRewards }}</span
                    >
                    <span v-else class="text-gray-300 dark:text-gray-600"
                      >·</span
                    >
                  </template>
                </template>
                <template v-else>
                  <span class="text-gray-400">❓</span>
                </template>
              </button>
            </template>
          </div>
        </div>

        <!-- SSE 连接状态 -->
        <div class="text-center text-sm mb-3">
          <span v-if="sseConnected" class="text-green-400">🟢 实时同步中</span>
          <span v-else class="text-gray-400">🔴 未连接</span>
        </div>

        <div class="flex justify-center">
          <el-button text size="small" @click="handleLeaveMine"
            >← 返回列表</el-button
          >
        </div>
      </template>
    </div>

    <!-- ===== 矿主收益 ===== -->
    <div v-if="activeTab === 'revenue'">
      <div v-if="revenueLoading" class="flex justify-center py-8">
        <span class="animate-spin inline-block text-2xl">⏳</span>
      </div>
      <template v-else>
        <!-- 汇总 -->
        <div v-if="revenueSummary" class="rpg-card rounded-xl p-3 mb-3">
          <p class="text-sm text-gray-400 mb-2">📊 近7天总收益</p>
          <div class="grid grid-cols-2 gap-2 text-center text-sm">
            <div class="bg-red-50 dark:bg-red-900/20 rounded p-2">
              <p class="text-xs text-gray-400">⚔️ 攻击水晶</p>
              <p class="font-bold text-red-500">
                {{ revenueSummary.attackCrystal || 0 }}
              </p>
            </div>
            <div class="bg-blue-50 dark:bg-blue-900/20 rounded p-2">
              <p class="text-xs text-gray-400">🛡️ 防御水晶</p>
              <p class="font-bold text-blue-500">
                {{ revenueSummary.defenseCrystal || 0 }}
              </p>
            </div>
            <div class="bg-green-50 dark:bg-green-900/20 rounded p-2">
              <p class="text-xs text-gray-400">💨 速度水晶</p>
              <p class="font-bold text-green-500">
                {{ revenueSummary.speedCrystal || 0 }}
              </p>
            </div>
            <div class="bg-purple-50 dark:bg-purple-900/20 rounded p-2">
              <p class="text-xs text-gray-400">💚 SAN水晶</p>
              <p class="font-bold text-purple-500">
                {{ revenueSummary.sanCrystal || 0 }}
              </p>
            </div>
          </div>
        </div>

        <div
          v-if="revenueList.length === 0"
          class="text-center py-4 text-gray-400 text-sm"
        >
          暂无收益记录
        </div>
        <div v-else class="space-y-1">
          <div
            v-for="rev in revenueList"
            :key="rev._id"
            class="rpg-card rounded-xl p-2 text-sm"
          >
            <div class="flex items-center justify-between">
              <div>
                <span class="text-gray-500">{{
                  rev.triggeredByGuildName
                }}</span>
                <span class="text-gray-400 ml-1">挖矿触发</span>
              </div>
              <div class="font-semibold">
                +{{ rev.crystalAmount }} {{ crystalLabel(rev.crystalType) }}
              </div>
            </div>
            <p class="text-gray-400 mt-0.5">{{ formatTime(rev.createdAt) }}</p>
          </div>
        </div>

        <div
          v-if="revenueTotal > revenuePageSize"
          class="flex justify-center mt-4"
        >
          <el-pagination
            v-model:current-page="revenuePage"
            :page-size="revenuePageSize"
            :total="revenueTotal"
            layout="prev, pager, next"
            small
            @current-change="fetchRevenue"
          />
        </div>
      </template>
    </div>

    <!-- ===== 挖矿结果弹窗 ===== -->
    <el-dialog
      v-model="digResultVisible"
      title="⛏️ 挖矿结果"
      width="340px"
      align-center
    >
      <div v-if="digResult" class="text-center space-y-3">
        <!-- 数字格子结果 -->
        <template v-if="digResult.type === 'number'">
          <div class="text-4xl mb-2">
            {{ digResult.adjacentRewards > 0 ? '💎' : '🪨' }}
          </div>
          <p
            v-if="digResult.adjacentRewards > 0"
            class="text-gray-600 dark:text-gray-300"
          >
            发现 {{ digResult.adjacentRewards }} 处矿脉痕迹
          </p>
          <p v-else class="text-gray-400">这里什么也没有...</p>
        </template>

        <!-- 奖励区域结果 -->
        <template v-else-if="digResult.type === 'reward'">
          <template v-if="digResult.battleResult?.winner === 'attacker'">
            <div class="text-4xl mb-2">🎉</div>
            <p class="text-green-500 font-bold text-lg">战斗胜利！</p>
          </template>
          <template v-else-if="digResult.challengeFailed">
            <div class="text-4xl mb-2">😔</div>
            <p class="text-red-500 font-bold">战斗失败</p>
            <p class="text-sm text-gray-400">其他玩家可以继续挑战</p>
          </template>
        </template>

        <!-- 获得水晶 -->
        <div
          v-if="digResult.crystals"
          class="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 text-sm"
        >
          <p class="text-gray-400 mb-1">获得水晶:</p>
          <div class="grid grid-cols-2 gap-1">
            <p v-if="digResult.crystals.attackCrystal > 0">
              ⚔️ {{ digResult.crystals.attackCrystal }}
            </p>
            <p v-if="digResult.crystals.defenseCrystal > 0">
              🛡️ {{ digResult.crystals.defenseCrystal }}
            </p>
            <p v-if="digResult.crystals.speedCrystal > 0">
              💨 {{ digResult.crystals.speedCrystal }}
            </p>
            <p v-if="digResult.crystals.sanCrystal > 0">
              💚 {{ digResult.crystals.sanCrystal }}
            </p>
          </div>
        </div>

        <!-- 获得符文石 -->
        <div
          v-if="digResult.runeStone"
          class="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3 text-sm"
        >
          <p class="text-yellow-500 font-bold">✨ 获得符文石！</p>
          <p class="text-sm text-gray-400">
            {{ rarityLabel(digResult.runeStone.rarity) }} · Lv.{{
              digResult.runeStone.level
            }}
          </p>
        </div>

        <!-- 矿场废弃 -->
        <p v-if="digResult.mineDepleted" class="text-orange-400 text-sm">
          ⚠️ 矿场已被完全探索，即将废弃
        </p>
      </div>
    </el-dialog>

    <!-- ===== 战斗演出 ===== -->
    <BattleAnimation
      v-if="showBattleAnimation"
      :battle-log="digResult.battleResult.log"
      :attacker-units="digResult.battleResult.attackerUnits"
      :defender-units="digResult.battleResult.defenderUnits"
      :total-rounds="digResult.battleResult.rounds"
      attacker-label="我方"
      defender-label="矿场守卫"
      @done="onMineBattleAnimationDone"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  listMinesApi,
  getMineDetailApi,
  getMiningInfoApi,
  digCellApi,
  getOwnerRevenueApi,
  createMineSSE
} from '@/api/game/mine.js'
import { getMyFormationsApi } from '@/api/game/formation.js'
import { useGameUser } from '@/composables/useGameUser.js'
import BattleAnimation from '@/components/BattleAnimation.vue'

const router = useRouter()
const { isLoggedIn, playerInfo, fetchPlayerInfo } = useGameUser()
if (!isLoggedIn.value) {
  router.replace({ name: 'GameLogin' })
}

const playerId = ref(playerInfo.value?.accountId || '')

// 挖矿信息
const miningInfo = ref({})
const activeTab = ref('list')

// 矿场列表
const mineList = ref([])
const listLoading = ref(false)
const listPage = ref(1)
const listPageSize = 20
const listTotal = ref(0)
const filterMinLevel = ref('')
const filterMaxLevel = ref('')

// 当前矿场
const currentMine = ref(null)
const currentMineLoading = ref(false)
const selectedFormationSlot = ref(null)
const formations = ref([])
const digLoading = ref(false)
const digCellPos = ref(null) // 当前正在挖的格子位置

// SSE
let sseSource = null
const sseConnected = ref(false)

// 挖矿结果
const digResultVisible = ref(false)
const digResult = ref(null)
const showBattleAnimation = ref(false)

// 矿主收益
const revenueList = ref([])
const revenueSummary = ref(null)
const revenueLoading = ref(false)
const revenuePage = ref(1)
const revenuePageSize = 20
const revenueTotal = ref(0)

async function fetchMiningInfo() {
  try {
    const res = await getMiningInfoApi()
    miningInfo.value = res.data.data || {}
  } catch {}
}

async function fetchMineList() {
  listLoading.value = true
  try {
    const res = await listMinesApi({
      page: listPage.value,
      pageSize: listPageSize,
      minLevel: filterMinLevel.value || undefined,
      maxLevel: filterMaxLevel.value || undefined
    })
    mineList.value = res.data.data?.list || []
    listTotal.value = res.data.data?.total || 0
  } catch {
    mineList.value = []
  } finally {
    listLoading.value = false
  }
}

function handleFilterMines() {
  listPage.value = 1
  fetchMineList()
}

async function fetchFormations() {
  try {
    const res = await getMyFormationsApi()
    formations.value = res.data.data || []
    // 恢复上次选择的阵容
    const saved = localStorage.getItem('mine_formation_slot')
    if (saved) {
      const slot = parseInt(saved)
      if (formations.value.some(f => f.slot === slot)) {
        selectedFormationSlot.value = slot
      }
    }
  } catch {}
}

async function handleEnterMine(mineId) {
  currentMineLoading.value = true
  try {
    const res = await getMineDetailApi(mineId)
    currentMine.value = res.data.data || null
    activeTab.value = 'mine'
    connectSSE(mineId)
  } catch {
    // 错误已由拦截器处理
  } finally {
    currentMineLoading.value = false
  }
}

function handleLeaveMine() {
  disconnectSSE()
  currentMine.value = null
  activeTab.value = 'list'
}

function handleSwitchTab(tab) {
  activeTab.value = tab
  if (tab === 'list') {
    fetchMineList()
  } else if (tab === 'revenue') {
    fetchRevenue()
  }
}

function handleFormationSlotChange(val) {
  if (val) {
    localStorage.setItem('mine_formation_slot', String(val))
  }
}

async function handleDigCell(row, col, cell) {
  if (digLoading.value) return

  // 已揭示的数字格子不能再挖
  if (cell.revealed && cell.type === 'number') return

  // 奖励区域需要阵容
  if (!cell.revealed || (cell.type === 'reward' && !cell.challengeDefeated)) {
    // 不知道类型的时候也需要准备阵容（可能是奖励区域）
    if (!selectedFormationSlot.value && !cell.revealed) {
      ElMessage.warning('请先选择战斗阵容（可能遇到敌人）')
      return
    }
  }

  digLoading.value = true
  digCellPos.value = { row, col }
  try {
    const res = await digCellApi(currentMine.value._id, {
      row,
      col,
      formationSlot: selectedFormationSlot.value
    })
    const result = res.data.data
    digResult.value = result

    // 奖励区域且有战斗结果时，先播放战斗演出
    if (result.type === 'reward' && result.battleResult) {
      showBattleAnimation.value = true
    } else {
      digResultVisible.value = true
    }

    // 刷新挖矿信息
    await fetchMiningInfo()

    // 本地更新格子状态
    if (currentMine.value) {
      const updatedCell = currentMine.value.grid[row][col]
      updatedCell.revealed = true
      updatedCell.type = result.type
      if (result.type === 'number') {
        updatedCell.adjacentRewards = result.adjacentRewards
      }
      if (result.type === 'reward') {
        updatedCell.challengeDefeated =
          result.battleResult?.winner === 'attacker'
      }
      updatedCell.exploredByGuildName = playerInfo.value?.guildName

      if (result.mineDepleted) {
        currentMine.value = null
        activeTab.value = 'list'
        disconnectSSE()
        ElMessage.warning('矿场已完全探索，已废弃')
        fetchMineList()
      }
    }
  } catch {
    // 错误已由拦截器处理
  } finally {
    digLoading.value = false
    digCellPos.value = null
  }
}

function onMineBattleAnimationDone() {
  showBattleAnimation.value = false
  digResultVisible.value = true
}

function connectSSE(mineId) {
  disconnectSSE()
  try {
    sseSource = createMineSSE(mineId)
    sseSource.onmessage = event => {
      try {
        const data = JSON.parse(event.data)
        if (data.type === 'connected') {
          sseConnected.value = true
          return
        }
        if (data.type === 'cellUpdate' && currentMine.value) {
          // 更新格子
          const cell = currentMine.value.grid[data.row][data.col]
          Object.assign(cell, data.cell)
          currentMine.value.exploredRewards = data.exploredRewards

          if (data.depleted) {
            currentMine.value = null
            activeTab.value = 'list'
            disconnectSSE()
            ElMessage.warning('矿场已被完全探索，已废弃')
            fetchMineList()
          }
        }
      } catch {}
    }
    sseSource.onerror = () => {
      sseConnected.value = false
    }
  } catch {
    sseConnected.value = false
  }
}

function disconnectSSE() {
  if (sseSource) {
    sseSource.close()
    sseSource = null
  }
  sseConnected.value = false
}

async function fetchRevenue() {
  revenueLoading.value = true
  try {
    const res = await getOwnerRevenueApi({
      page: revenuePage.value,
      pageSize: revenuePageSize
    })
    revenueList.value = res.data.data?.list || []
    revenueTotal.value = res.data.data?.total || 0
    revenueSummary.value = res.data.data?.summary || null
  } catch {
    revenueList.value = []
  } finally {
    revenueLoading.value = false
  }
}

function getCellClass(cell) {
  if (!cell.revealed) {
    return 'bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:bg-gray-300 dark:hover:bg-gray-600 cursor-pointer'
  }
  if (cell.type === 'reward') {
    if (cell.challengeDefeated) {
      return 'bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700'
    }
    return 'bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 hover:bg-red-200 dark:hover:bg-red-900/50 cursor-pointer'
  }
  return 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700'
}

function isCellDisabled(cell) {
  if (digLoading.value) return true
  if (!cell.revealed) return false
  if (cell.type === 'reward' && !cell.challengeDefeated) return false
  return true
}

function getNumberColor(n) {
  const colors = [
    '',
    'text-blue-500',
    'text-green-500',
    'text-red-500',
    'text-purple-500',
    'text-yellow-600',
    'text-pink-500',
    'text-orange-500',
    'text-indigo-500'
  ]
  return colors[n] || 'text-gray-500'
}

function crystalLabel(type) {
  const map = {
    attackCrystal: '⚔️ 攻击水晶',
    defenseCrystal: '🛡️ 防御水晶',
    speedCrystal: '💨 速度水晶',
    sanCrystal: '💚 SAN水晶'
  }
  return map[type] || type
}

function rarityLabel(rarity) {
  return { normal: '普通', rare: '稀有', legendary: '传说' }[rarity] || rarity
}

function formatTime(t) {
  if (!t) return ''
  const d = new Date(t)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

onMounted(async () => {
  await Promise.all([fetchMiningInfo(), fetchMineList(), fetchFormations()])
  playerId.value = playerInfo.value?.accountId || ''
})

onUnmounted(() => {
  disconnectSSE()
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
.mine-cell {
  min-width: 26px;
  min-height: 26px;
  font-size: 12px;
}
@media (min-width: 400px) {
  .mine-cell {
    min-width: 32px;
    min-height: 32px;
    font-size: 14px;
  }
}
</style>

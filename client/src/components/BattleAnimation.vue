<template>
  <Teleport to="body">
    <div class="battle-animation-overlay">
      <div
        ref="containerRef"
        class="battle-animation-container"
        :style="containerStyle"
      >
        <!-- 标题 -->
        <div class="text-center mb-1 shrink-0">
          <h2
            class="text-yellow-300 font-bold drop-shadow-lg"
            :style="{ fontSize: titleFontSize + 'px' }"
          >
            ⚔️ 战斗演出
          </h2>
          <p class="text-gray-400" :style="{ fontSize: subFontSize + 'px' }">
            第 {{ currentRound }} / {{ totalRounds }} 回合
          </p>
        </div>

        <!-- 对战双方网格 -->
        <div
          class="battle-sides shrink-0"
          :class="isLandscape ? 'battle-sides--row' : 'battle-sides--col'"
        >
          <!-- 攻击方 -->
          <div class="battle-side">
            <p
              class="text-blue-300 text-center font-semibold"
              :style="{ fontSize: subFontSize + 'px', marginBottom: '2px' }"
            >
              {{ attackerLabel }}
            </p>
            <div class="battle-grid" :style="gridStyle">
              <div
                v-for="(unit, idx) in attackerDisplayUnits"
                :key="'a' + idx"
                class="battle-cell"
                :class="cellClass(unit)"
              >
                <template v-if="unit">
                  <span
                    class="battle-seq"
                    :style="{ fontSize: Math.max(10, nameFontSize - 1) + 'px' }"
                    >{{ unit.row * 5 + unit.col + 1 }}</span
                  >
                  <GameAdventurerAvatar
                    :adventurer="unit"
                    class="battle-avatar"
                    :class="{ 'grayscale opacity-40': !unit.alive }"
                    :style="{
                      borderColor: getElementColor(unit.element),
                      width: avatarSize + 'px',
                      height: avatarSize + 'px'
                    }"
                  />
                  <span
                    class="battle-name"
                    :title="unit.name"
                    :style="{ fontSize: nameFontSize + 'px' }"
                    >{{ unit.name }}</span
                  >
                  <div class="hp-bar-bg">
                    <div
                      class="hp-bar-fill"
                      :style="{
                        width: hpPercent(unit) + '%',
                        backgroundColor: hpColor(unit)
                      }"
                    />
                  </div>
                </template>
              </div>
            </div>
          </div>

          <!-- VS -->
          <div class="flex items-center justify-center shrink-0">
            <span
              class="text-yellow-400 font-bold"
              :style="{ fontSize: subFontSize + 'px' }"
              >VS</span
            >
          </div>

          <!-- 防御方 -->
          <div class="battle-side">
            <p
              class="text-red-300 text-center font-semibold"
              :style="{ fontSize: subFontSize + 'px', marginBottom: '2px' }"
            >
              {{ defenderLabel }}
            </p>
            <div class="battle-grid" :style="gridStyle">
              <div
                v-for="(unit, idx) in defenderDisplayUnits"
                :key="'d' + idx"
                class="battle-cell"
                :class="cellClass(unit)"
              >
                <template v-if="unit">
                  <span
                    class="battle-seq"
                    :style="{ fontSize: Math.max(10, nameFontSize - 1) + 'px' }"
                    >{{ unit.row * 5 + unit.col + 1 }}</span
                  >
                  <GameAdventurerAvatar
                    :adventurer="unit"
                    class="battle-avatar"
                    :class="{ 'grayscale opacity-40': !unit.alive }"
                    :style="{
                      borderColor: getElementColor(unit.element),
                      width: avatarSize + 'px',
                      height: avatarSize + 'px'
                    }"
                  />
                  <span
                    class="battle-name"
                    :title="unit.name"
                    :style="{ fontSize: nameFontSize + 'px' }"
                    >{{ unit.name }}</span
                  >
                  <div class="hp-bar-bg">
                    <div
                      class="hp-bar-fill"
                      :style="{
                        width: hpPercent(unit) + '%',
                        backgroundColor: hpColor(unit)
                      }"
                    />
                  </div>
                </template>
              </div>
            </div>
          </div>
        </div>

        <!-- 战斗日志滚动区 -->
        <div ref="logContainer" class="battle-log-area">
          <div
            v-for="(entry, idx) in displayedLogs"
            :key="idx"
            class="log-entry"
            :class="logEntryClass(entry)"
            :style="{ fontSize: logFontSize + 'px' }"
          >
            <span>{{ formatLogEntry(entry) }}</span>
          </div>
        </div>

        <!-- 按钮区域 -->
        <div class="text-center mt-1 shrink-0">
          <el-button
            v-if="animationFinished"
            type="primary"
            size="small"
            round
            @click="handleContinue"
          >
            继续 ▶️
          </el-button>
          <el-button
            v-else-if="canSkip"
            type="warning"
            size="small"
            round
            @click="handleSkip"
          >
            跳过演出 ⏭️
          </el-button>
          <p
            v-else
            class="text-gray-500"
            :style="{ fontSize: subFontSize + 'px' }"
          >
            {{ skipCountdown }}秒后可跳过
          </p>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'

const ELEMENT_COLORS = {
  1: '#a0855b',
  2: '#4fa3e0',
  3: '#e05c4f',
  4: '#6abf69',
  5: '#f5c842',
  6: '#7c5cbf'
}

function getElementColor(el) {
  return ELEMENT_COLORS[el] || '#999'
}

const props = defineProps({
  battleLog: { type: Array, required: true },
  attackerUnits: { type: Array, required: true },
  defenderUnits: { type: Array, required: true },
  totalRounds: { type: Number, default: 0 },
  attackerLabel: { type: String, default: '我方' },
  defenderLabel: { type: String, default: '敌方' }
})

const emit = defineEmits(['done'])

// ── 视口与布局（使用 visualViewport 获取手机真实可视区域）──
const containerRef = ref(null)

function getVP() {
  const vv = window.visualViewport
  return {
    w: vv ? vv.width : window.innerWidth,
    h: vv ? vv.height : window.innerHeight
  }
}

const { w: _initW, h: _initH } = getVP()
const vpWidth = ref(_initW)
const vpHeight = ref(_initH)
const isLandscape = ref(_initW > _initH)

function onResize() {
  const { w, h } = getVP()
  vpWidth.value = w
  vpHeight.value = h
  isLandscape.value = w > h
}

// 容器尺寸：max-height 控制上限（不用固定 height 避免裁切），最小 300×300，最大宽度 720
const PADDING = 12
const containerStyle = computed(() => {
  const w = Math.max(300, vpWidth.value - PADDING * 2)
  const h = Math.max(300, vpHeight.value - PADDING * 2)
  return {
    width: Math.min(w, 720) + 'px',
    maxHeight: h + 'px'
  }
})

// 计算可用于棋盘的高度与宽度，进而算出每个单元格大小
// 格子不再使用 aspect-ratio:1，实际高度 ≈ avatar(0.55cs) + name(0.2cs) + hp(3) + pad(4) ≈ 0.75cs + 7
const CELL_H_RATIO = 0.75
const CELL_H_CONST = 7

const cellSize = computed(() => {
  const H_PAD = 28 // 容器左右 padding 14*2
  const V_PAD = 20 // 容器上下 padding 10*2
  const GAP = 2

  const cw = Math.min(Math.max(300, vpWidth.value - PADDING * 2), 720) - H_PAD
  const ch = Math.max(300, vpHeight.value - PADDING * 2) - V_PAD

  // 宽度约束
  let fromWidth
  if (isLandscape.value) {
    const gridW = (cw - 28) / 2 // 减去 VS 文本宽度和间距
    fromWidth = (gridW - GAP * 4) / 5
  } else {
    fromWidth = (cw - GAP * 4) / 5
  }

  // 高度约束
  // 非棋盘固定元素：标题区(~32) + 日志区最小(~40) + 跳过按钮(~28) + 间距(~10)
  const overhead = 110
  const gridAreaH = ch - overhead

  let fromHeight
  if (isLandscape.value) {
    // 单棋盘 5 行 + 标签(~14)，5*(0.75cs+7+GAP)+14 ≤ gridAreaH
    fromHeight = ((gridAreaH - 14) / 5 - CELL_H_CONST - GAP) / CELL_H_RATIO
  } else {
    // 双棋盘 10 行 + 2标签(~28) + VS(~14)
    fromHeight = ((gridAreaH - 42) / 10 - CELL_H_CONST - GAP) / CELL_H_RATIO
  }

  return Math.max(20, Math.min(fromWidth, fromHeight, 80))
})

// 网格 gap 也随 cellSize 缩放
const gridGap = computed(() => Math.max(1, Math.round(cellSize.value * 0.05)))
const gridStyle = computed(() => ({
  gap: gridGap.value + 'px'
}))

// 各元素尺寸均基于 cellSize 等比缩放
const avatarSize = computed(() =>
  Math.max(14, Math.round(cellSize.value * 0.55))
)
const nameFontSize = computed(() =>
  Math.max(10, Math.round(cellSize.value * 0.17))
)
const titleFontSize = computed(() =>
  Math.max(12, Math.round(cellSize.value * 0.35))
)
const subFontSize = computed(() =>
  Math.max(10, Math.round(cellSize.value * 0.2))
)
const logFontSize = computed(() =>
  Math.max(10, Math.round(cellSize.value * 0.2))
)

// 单位状态跟踪
const unitState = ref(new Map())

function initUnitState() {
  const map = new Map()
  for (const u of props.attackerUnits) {
    map.set(u.id, { ...u, alive: true, currentSan: u.maxSan })
  }
  for (const u of props.defenderUnits) {
    map.set(u.id, { ...u, alive: true, currentSan: u.maxSan })
  }
  unitState.value = map
}

// 5x5 网格显示（攻击方翻转，使前排面向防御方）
const attackerDisplayUnits = computed(() => {
  const grid = Array(25).fill(null)
  for (const u of props.attackerUnits) {
    // 翻转行：前排 (row 0) 放到底部，后排 (row 4) 放到顶部
    const reversedRow = 4 - u.row
    const idx = reversedRow * 5 + u.col
    if (idx >= 0 && idx < 25) {
      grid[idx] = unitState.value.get(u.id) || u
    }
  }
  return grid
})

const defenderDisplayUnits = computed(() => {
  const grid = Array(25).fill(null)
  for (const u of props.defenderUnits) {
    const idx = u.row * 5 + u.col
    if (idx >= 0 && idx < 25) {
      grid[idx] = unitState.value.get(u.id) || u
    }
  }
  return grid
})

// 日志回放
const displayedLogs = ref([])
const currentRound = ref(0)
const currentLogIndex = ref(0)
const actingUnitIds = ref(new Set())
const hitUnitIds = ref(new Set())
let animationTimer = null
let hitClearTimer = null
const logContainer = ref(null)

function isActing(id) {
  return actingUnitIds.value.has(id)
}

function isHit(id) {
  return hitUnitIds.value.has(id)
}

function cellClass(unit) {
  if (!unit) return 'cell-empty'
  const cls = unit.alive ? 'cell-alive' : 'cell-dead'
  const acting = isActing(unit.id) ? ' cell-acting' : ''
  const hit = isHit(unit.id) ? ' cell-hit' : ''
  return cls + acting + hit
}

function hpPercent(unit) {
  if (!unit || unit.maxSan <= 0) return 0
  return Math.max(0, Math.round((unit.currentSan / unit.maxSan) * 100))
}

function hpColor(unit) {
  const pct = hpPercent(unit)
  if (pct > 60) return '#4ade80'
  if (pct > 30) return '#facc15'
  return '#ef4444'
}

function logEntryClass(entry) {
  if (!entry) return ''
  if (entry.type === 'roundStart') return 'log-round'
  if (entry.type === 'attack') {
    return entry.elementCounter ? 'log-attack-counter' : 'log-attack'
  }
  if (entry.type === 'runeSkill') {
    if (entry.skillType === 'sanRecover') return 'log-heal'
    if (entry.skillType === 'buff') return 'log-buff'
    return 'log-skill'
  }
  return ''
}

function formatLogEntry(entry) {
  if (!entry) return ''
  if (entry.type === 'roundStart') {
    return `── 第 ${entry.round} 回合 ──`
  }
  // 判断单位属于哪一方
  const attackerIdSet = new Set(props.attackerUnits.map(u => u.id))
  const getSideLabel = id => (attackerIdSet.has(id) ? '【我方】' : '【敌方】')
  if (entry.type === 'attack') {
    const counter = entry.elementCounter ? ' [克制!]' : ''
    const ko =
      entry.defenderRemainSan <= 0
        ? ' 💀击倒！'
        : ` (剩余${entry.defenderRemainSan})`
    return `${getSideLabel(entry.attacker)}${entry.attackerName} → ${getSideLabel(entry.defender)}${entry.defenderName} 造成 ${entry.damage} 伤害${counter}${ko}`
  }
  if (entry.type === 'runeSkill') {
    const casterLabel = getSideLabel(entry.caster)
    const targetLabel = entry.target ? getSideLabel(entry.target) : ''
    switch (entry.skillType) {
      case 'attack':
        return `✨ ${casterLabel}${entry.casterName} 发动 [${entry.skillLabel}] → ${targetLabel}${entry.targetName} ${entry.damage} 伤害`
      case 'buff':
        return `⬆️ ${casterLabel}${entry.casterName} 发动 [${entry.skillLabel}] → ${targetLabel}${entry.targetName} ${entry.buffType}+${entry.value}`
      case 'debuff':
        return `⬇️ ${casterLabel}${entry.casterName} 发动 [${entry.skillLabel}] → ${targetLabel}${entry.targetName} ${entry.debuffType}-${entry.value}`
      case 'changeOrder':
        return entry.success
          ? `🔀 ${casterLabel}${entry.casterName} 发动 [${entry.skillLabel}] 打乱了 ${targetLabel}${entry.targetName} 的位置！`
          : `🔀 ${casterLabel}${entry.casterName} 发动 [${entry.skillLabel}] 但未命中 ${targetLabel}${entry.targetName}`
      case 'sanRecover':
        return `💚 ${casterLabel}${entry.casterName} 发动 [${entry.skillLabel}] → ${targetLabel}${entry.targetName} 恢复 ${entry.healAmount} SAN`
      default:
        return `${casterLabel}${entry.casterName} 使用技能`
    }
  }
  return JSON.stringify(entry)
}

function processLogEntry(entry) {
  const map = unitState.value
  // 清除上一轮的受击状态
  if (hitClearTimer) {
    clearTimeout(hitClearTimer)
    hitClearTimer = null
  }
  hitUnitIds.value = new Set()

  if (entry.type === 'roundStart') {
    currentRound.value = entry.round
    return
  }
  if (entry.type === 'attack') {
    actingUnitIds.value = new Set([entry.attacker])
    const defender = map.get(entry.defender)
    if (defender) {
      defender.currentSan = entry.defenderRemainSan
      if (defender.currentSan <= 0) defender.alive = false
      hitUnitIds.value = new Set([entry.defender])
    }
  }
  if (entry.type === 'runeSkill') {
    actingUnitIds.value = new Set([entry.caster])
    if (entry.skillType === 'attack') {
      const target = map.get(entry.target)
      if (target) {
        target.currentSan = entry.targetRemainSan
        if (target.currentSan <= 0) target.alive = false
        hitUnitIds.value = new Set([entry.target])
      }
    }
    if (entry.skillType === 'sanRecover') {
      const target = map.get(entry.target)
      if (target) target.currentSan = entry.targetRemainSan
    }
  }
  // 自动清除受击状态
  hitClearTimer = setTimeout(() => {
    hitUnitIds.value = new Set()
  }, 300)
}

const animationFinished = ref(false)

function playNextLog() {
  if (currentLogIndex.value >= props.battleLog.length) {
    stopAnimation()
    animationFinished.value = true
    return
  }
  const entry = props.battleLog[currentLogIndex.value]
  processLogEntry(entry)
  displayedLogs.value.push(entry)
  currentLogIndex.value++
  nextTick(() => {
    if (logContainer.value) {
      logContainer.value.scrollTop = logContainer.value.scrollHeight
    }
  })
}

function startAnimation() {
  animationTimer = setInterval(playNextLog, 150)
}

function stopAnimation() {
  if (animationTimer) {
    clearInterval(animationTimer)
    animationTimer = null
  }
}

function handleSkip() {
  stopAnimation()
  while (currentLogIndex.value < props.battleLog.length) {
    const entry = props.battleLog[currentLogIndex.value]
    processLogEntry(entry)
    displayedLogs.value.push(entry)
    currentLogIndex.value++
  }
  // 跳过后直接关闭弹窗
  emit('done')
}

function handleContinue() {
  emit('done')
}

// 10秒跳过倒计时
const canSkip = ref(false)
const skipCountdown = ref(10)
let skipTimer = null

function startSkipCountdown() {
  skipCountdown.value = 10
  canSkip.value = false
  skipTimer = setInterval(() => {
    skipCountdown.value--
    if (skipCountdown.value <= 0) {
      canSkip.value = true
      clearInterval(skipTimer)
      skipTimer = null
    }
  }, 1000)
}

onMounted(() => {
  window.addEventListener('resize', onResize)
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', onResize)
  }
  initUnitState()
  startAnimation()
  startSkipCountdown()
})

onUnmounted(() => {
  window.removeEventListener('resize', onResize)
  if (window.visualViewport) {
    window.visualViewport.removeEventListener('resize', onResize)
  }
  stopAnimation()
  if (skipTimer) {
    clearInterval(skipTimer)
    skipTimer = null
  }
  if (hitClearTimer) {
    clearTimeout(hitClearTimer)
    hitClearTimer = null
  }
})
</script>

<style scoped>
.battle-animation-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px;
}

.battle-animation-container {
  background: linear-gradient(135deg, #1a1033 0%, #0d0d1a 100%);
  border: 1px solid rgba(200, 160, 80, 0.4);
  border-radius: 12px;
  padding: 10px 14px;
  min-width: 300px;
  min-height: 300px;
  overflow-y: auto;
  overflow-x: hidden;
  display: flex;
  flex-direction: column;
  box-shadow:
    0 0 30px rgba(200, 160, 80, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
}

/* 双方布局 */
.battle-sides--row {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  gap: 8px;
  margin-bottom: 4px;
}
.battle-sides--row .battle-side {
  flex: 1;
  min-width: 0;
}

.battle-sides--col {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-bottom: 4px;
}

.battle-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
}

/* \u6a2a\u5c4f\u65f6\u68cb\u76d8\u65cb\u8f6c90\u00b0\uff0c\u884c\u53d8\u6210\u5217\uff0c\u4f7f\u524d\u6392\u6c34\u5e73\u9762\u5411\u5bf9\u65b9 */
.battle-sides--row .battle-grid {
  grid-template-columns: none;
  grid-template-rows: repeat(5, 1fr);
  grid-auto-flow: column;
}

.battle-seq {
  position: absolute;
  top: 1px;
  left: 2px;
  color: rgba(255, 255, 255, 0.45);
  line-height: 1;
  pointer-events: none;
  z-index: 1;
}

.battle-cell {
  position: relative;
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2px 1px;
  min-width: 0;
  transition: all 0.3s ease;
}

.cell-empty {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.cell-alive {
  background: rgba(50, 50, 80, 0.6);
  border: 1px solid rgba(100, 150, 255, 0.3);
}

.cell-dead {
  background: rgba(80, 20, 20, 0.4);
  border: 1px solid rgba(255, 50, 50, 0.2);
}

.cell-acting {
  border-color: rgba(255, 200, 50, 0.8) !important;
  box-shadow: 0 0 8px rgba(255, 200, 50, 0.4);
  animation: actPulse 0.5s ease-in-out;
}

.cell-hit {
  border-color: rgba(255, 50, 50, 0.8) !important;
  box-shadow: 0 0 10px rgba(255, 50, 50, 0.6);
  animation: hitShake 0.3s ease-in-out;
}

@keyframes actPulse {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.06);
  }
}

@keyframes hitShake {
  0% {
    transform: translateX(0);
  }
  20% {
    transform: translateX(-3px);
    background: rgba(255, 50, 50, 0.3);
  }
  40% {
    transform: translateX(3px);
    background: rgba(255, 50, 50, 0.25);
  }
  60% {
    transform: translateX(-2px);
    background: rgba(255, 50, 50, 0.15);
  }
  80% {
    transform: translateX(1px);
  }
  100% {
    transform: translateX(0);
  }
}

.battle-avatar {
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid;
  flex-shrink: 0;
}

.battle-name {
  color: #e5e7eb;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-align: center;
  display: block;
  line-height: 1.2;
  margin-top: 1px;
}

.hp-bar-bg {
  width: 90%;
  height: 3px;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 2px;
  margin-top: 1px;
  overflow: hidden;
}

.hp-bar-fill {
  height: 100%;
  border-radius: 2px;
  transition: width 0.3s ease;
}

.battle-log-area {
  flex: 1;
  min-height: 50px;
  overflow-y: auto;
  background: rgba(0, 0, 0, 0.4);
  border-radius: 8px;
  padding: 6px 8px;
  scrollbar-width: thin;
  scrollbar-color: rgba(200, 160, 80, 0.3) transparent;
}

.log-entry {
  padding: 1px 4px;
  border-radius: 3px;
  margin-bottom: 1px;
  line-height: 1.4;
}

.log-round {
  color: #fbbf24;
  text-align: center;
  font-weight: bold;
  margin: 3px 0;
}
.log-attack {
  color: #e5e7eb;
}
.log-attack-counter {
  color: #f87171;
  font-weight: 600;
}
.log-skill {
  color: #a78bfa;
}
.log-buff {
  color: #34d399;
}
.log-heal {
  color: #6ee7b7;
}
</style>

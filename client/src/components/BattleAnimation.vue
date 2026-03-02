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
                  <!-- 浮动效果指示器 -->
                  <div
                    v-for="effect in getEffects(unit.id)"
                    :key="effect.id"
                    class="effect-float"
                    :class="'effect-' + effect.type"
                  >
                    {{ effect.text }}
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
                  <!-- 浮动效果指示器 -->
                  <div
                    v-for="effect in getEffects(unit.id)"
                    :key="effect.id"
                    class="effect-float"
                    :class="'effect-' + effect.type"
                  >
                    {{ effect.text }}
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
        <div
          class="flex items-center justify-center gap-2 mt-1 shrink-0 flex-wrap"
        >
          <!-- 倍速控制 -->
          <div v-if="!animationFinished" class="flex items-center gap-1">
            <button
              v-for="s in speedOptions"
              :key="s"
              class="speed-btn"
              :class="{ 'speed-btn--active': playbackSpeed === s }"
              :style="{ fontSize: Math.max(10, subFontSize - 2) + 'px' }"
              @click="handleSetSpeed(s)"
            >
              {{ s }}×
            </button>
          </div>

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
import {
  ref,
  computed,
  onMounted,
  onUnmounted,
  nextTick,
  triggerRef
} from 'vue'

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
    height: h + 'px'
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

// 浮动效果指示器系统
const effectOverlays = ref([])
let effectCounter = 0

function addEffect(unitId, text, type) {
  const id = ++effectCounter
  effectOverlays.value.push({ unitId, text, type, id })
  setTimeout(
    () => {
      effectOverlays.value = effectOverlays.value.filter(e => e.id !== id)
    },
    Math.max(800, Math.round(1200 / playbackSpeed.value))
  )
}

function getEffects(unitId) {
  if (!unitId) return []
  return effectOverlays.value.filter(e => e.unitId === unitId)
}

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
// 使用动态 row/col 因为 changeOrder 会改变位置
const attackerDisplayUnits = computed(() => {
  const grid = Array(25).fill(null)
  for (const u of props.attackerUnits) {
    const state = unitState.value.get(u.id)
    const row = state ? state.row : u.row
    const col = state ? state.col : u.col
    // 翻转行：前排 (row 0) 放到底部，后排 (row 4) 放到顶部
    const reversedRow = 4 - row
    const idx = reversedRow * 5 + col
    if (idx >= 0 && idx < 25) {
      grid[idx] = state || u
    }
  }
  return grid
})

const defenderDisplayUnits = computed(() => {
  const grid = Array(25).fill(null)
  for (const u of props.defenderUnits) {
    const state = unitState.value.get(u.id)
    const row = state ? state.row : u.row
    const col = state ? state.col : u.col
    const idx = row * 5 + col
    if (idx >= 0 && idx < 25) {
      grid[idx] = state || u
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
const buffedUnitIds = ref(new Set())
const debuffedUnitIds = ref(new Set())
const healedUnitIds = ref(new Set())
const movedUnitIds = ref(new Set())
let animationTimer = null
let hitClearTimer = null
const logContainer = ref(null)

// 倍速控制：基础间隔450ms（降低3倍，原来150ms）
const BASE_INTERVAL = 450
const speedOptions = [1, 2, 3]
const playbackSpeed = ref(1)

function getInterval() {
  return Math.round(BASE_INTERVAL / playbackSpeed.value)
}

function handleSetSpeed(speed) {
  playbackSpeed.value = speed
  // 重启动画定时器以应用新速度
  if (animationTimer) {
    stopAnimation()
    startAnimation()
  }
}

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
  const buffed = buffedUnitIds.value.has(unit.id) ? ' cell-buffed' : ''
  const debuffed = debuffedUnitIds.value.has(unit.id) ? ' cell-debuffed' : ''
  const healed = healedUnitIds.value.has(unit.id) ? ' cell-healed' : ''
  const moved = movedUnitIds.value.has(unit.id) ? ' cell-moved' : ''
  return cls + acting + hit + buffed + debuffed + healed + moved
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
    if (entry.skillType === 'debuff') return 'log-debuff'
    if (entry.skillType === 'changeOrder')
      return entry.success ? 'log-move' : 'log-skill'
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
        if (entry.success) {
          const posInfo = `(${entry.oldRow + 1},${entry.oldCol + 1})→(${entry.newRow + 1},${entry.newCol + 1})`
          if (entry.swapped) {
            return `🔀 ${casterLabel}${entry.casterName} 发动 [${entry.skillLabel}] ${targetLabel}${entry.targetName} 与 ${targetLabel}${entry.swapTargetName} 互换位置！${posInfo}`
          }
          return `🔀 ${casterLabel}${entry.casterName} 发动 [${entry.skillLabel}] 将 ${targetLabel}${entry.targetName} 移动到了新位置！${posInfo}`
        }
        return `🔀 ${casterLabel}${entry.casterName} 发动 [${entry.skillLabel}] 但未命中 ${targetLabel}${entry.targetName}`
      case 'sanRecover':
        return `💚 ${casterLabel}${entry.casterName} 发动 [${entry.skillLabel}] → ${targetLabel}${entry.targetName} 恢复 ${entry.healAmount} SAN`
      default:
        return `${casterLabel}${entry.casterName} 使用技能`
    }
  }
  return JSON.stringify(entry)
}

const BUFF_TYPE_LABEL = {
  attack: '攻击',
  defense: '防御',
  speed: '速度',
  san: 'SAN'
}

function processLogEntry(entry) {
  const map = unitState.value
  // 清除上一轮的特效状态
  if (hitClearTimer) {
    clearTimeout(hitClearTimer)
    hitClearTimer = null
  }
  hitUnitIds.value = new Set()
  buffedUnitIds.value = new Set()
  debuffedUnitIds.value = new Set()
  healedUnitIds.value = new Set()
  movedUnitIds.value = new Set()

  let needRefreshState = false

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
      // 浮动伤害数字
      const koText = defender.currentSan <= 0 ? ' 💀' : ''
      addEffect(entry.defender, `-${entry.damage}${koText}`, 'damage')
      needRefreshState = true
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
        const koText = target.currentSan <= 0 ? ' 💀' : ''
        addEffect(entry.target, `✨-${entry.damage}${koText}`, 'damage')
        needRefreshState = true
      }
    }
    if (entry.skillType === 'buff') {
      buffedUnitIds.value = new Set([entry.target])
      const label = BUFF_TYPE_LABEL[entry.buffType] || entry.buffType
      addEffect(entry.target, `⬆️${label}+${entry.value}`, 'buff')
    }
    if (entry.skillType === 'debuff') {
      debuffedUnitIds.value = new Set([entry.target])
      const label = BUFF_TYPE_LABEL[entry.debuffType] || entry.debuffType
      addEffect(entry.target, `⬇️${label}-${entry.value}`, 'debuff')
    }
    if (entry.skillType === 'sanRecover') {
      const target = map.get(entry.target)
      if (target) {
        target.currentSan = entry.targetRemainSan
        needRefreshState = true
      }
      healedUnitIds.value = new Set([entry.target])
      addEffect(entry.target, `+${entry.healAmount} SAN`, 'heal')
    }
    if (entry.skillType === 'changeOrder' && entry.success) {
      // 更新单位的棋盘位置
      const moved = new Set()
      const target = map.get(entry.target)
      if (target) {
        target.row = entry.newRow
        target.col = entry.newCol
        moved.add(entry.target)
        addEffect(entry.target, '🔀 移动', 'move')
      }
      if (entry.swapped && entry.swapTarget) {
        const swapTarget = map.get(entry.swapTarget)
        if (swapTarget) {
          swapTarget.row = entry.oldRow
          swapTarget.col = entry.oldCol
          moved.add(entry.swapTarget)
          addEffect(entry.swapTarget, '🔀 互换', 'move')
        }
      }
      movedUnitIds.value = moved
      needRefreshState = true
    }
  }

  // 强制触发响应式更新（解决 Map 内部对象变更不触发 computed 重算的问题）
  if (needRefreshState) {
    unitState.value = new Map(unitState.value)
  }

  // 自动清除特效状态（延长显示时间使效果更明显）
  const clearDelay = Math.max(300, Math.round(600 / playbackSpeed.value))
  hitClearTimer = setTimeout(() => {
    actingUnitIds.value = new Set()
    hitUnitIds.value = new Set()
    buffedUnitIds.value = new Set()
    debuffedUnitIds.value = new Set()
    healedUnitIds.value = new Set()
    movedUnitIds.value = new Set()
  }, clearDelay)
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
  animationTimer = setInterval(playNextLog, getInterval())
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
  /* background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.05); */
  opacity: 0;
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
.log-debuff {
  color: #f87171;
  font-style: italic;
}
.log-heal {
  color: #6ee7b7;
}
.log-move {
  color: #60a5fa;
  font-weight: 600;
}

/* 倍速按钮 */
.speed-btn {
  padding: 2px 8px;
  border-radius: 10px;
  border: 1px solid rgba(200, 160, 80, 0.4);
  background: rgba(50, 50, 80, 0.6);
  color: #e5e7eb;
  cursor: pointer;
  transition: all 0.2s;
  line-height: 1.4;
}
.speed-btn:hover {
  border-color: rgba(200, 160, 80, 0.8);
}
.speed-btn--active {
  background: rgba(200, 160, 80, 0.5);
  border-color: #f5c842;
  color: #f5c842;
  font-weight: bold;
}

/* 增益动画 */
.cell-buffed {
  border-color: rgba(52, 211, 153, 0.8) !important;
  box-shadow: 0 0 10px rgba(52, 211, 153, 0.5);
  animation: buffGlow 0.5s ease-in-out;
}

/* 减益动画 */
.cell-debuffed {
  border-color: rgba(248, 113, 113, 0.8) !important;
  box-shadow: 0 0 10px rgba(248, 113, 113, 0.5);
  animation: debuffGlow 0.5s ease-in-out;
}

/* 恢复动画 */
.cell-healed {
  border-color: rgba(110, 231, 183, 0.8) !important;
  box-shadow: 0 0 12px rgba(110, 231, 183, 0.6);
  animation: healPulse 0.5s ease-in-out;
}

/* 位移动画 */
.cell-moved {
  border-color: rgba(96, 165, 250, 0.8) !important;
  box-shadow: 0 0 12px rgba(96, 165, 250, 0.6);
  animation: moveSlide 0.5s ease-in-out;
}

@keyframes buffGlow {
  0% {
    box-shadow: 0 0 0 rgba(52, 211, 153, 0);
  }
  50% {
    box-shadow: 0 0 16px rgba(52, 211, 153, 0.8);
    transform: scale(1.05);
  }
  100% {
    box-shadow: 0 0 10px rgba(52, 211, 153, 0.5);
  }
}

@keyframes debuffGlow {
  0% {
    box-shadow: 0 0 0 rgba(248, 113, 113, 0);
  }
  50% {
    box-shadow: 0 0 16px rgba(248, 113, 113, 0.8);
    transform: scale(0.95);
  }
  100% {
    box-shadow: 0 0 10px rgba(248, 113, 113, 0.5);
  }
}

@keyframes healPulse {
  0% {
    box-shadow: 0 0 0 rgba(110, 231, 183, 0);
  }
  30% {
    box-shadow: 0 0 20px rgba(110, 231, 183, 0.9);
    transform: scale(1.08);
  }
  100% {
    box-shadow: 0 0 12px rgba(110, 231, 183, 0.6);
  }
}

@keyframes moveSlide {
  0% {
    opacity: 0;
    transform: scale(0.3) rotate(-10deg);
  }
  30% {
    opacity: 1;
    transform: scale(1.2) rotate(5deg);
  }
  60% {
    transform: scale(0.9) rotate(-2deg);
  }
  100% {
    opacity: 1;
    transform: scale(1) rotate(0deg);
  }
}

/* 浮动效果指示器 */
.effect-float {
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  pointer-events: none;
  z-index: 20;
  font-weight: bold;
  font-size: 11px;
  white-space: nowrap;
  animation: effectFloatUp 1.2s ease-out forwards;
  text-shadow:
    0 1px 3px rgba(0, 0, 0, 0.9),
    0 0 6px rgba(0, 0, 0, 0.5);
}
.effect-damage {
  color: #ff4444;
  font-size: 13px;
}
.effect-buff {
  color: #34d399;
  font-size: 12px;
}
.effect-debuff {
  color: #ff6b6b;
  font-size: 12px;
}
.effect-heal {
  color: #6ee7b7;
  font-size: 12px;
}
.effect-move {
  color: #60a5fa;
  font-size: 14px;
}

@keyframes effectFloatUp {
  0% {
    transform: translateX(-50%) translateY(0) scale(0.5);
    opacity: 0;
  }
  15% {
    transform: translateX(-50%) translateY(-8px) scale(1.3);
    opacity: 1;
  }
  100% {
    transform: translateX(-50%) translateY(-30px) scale(0.8);
    opacity: 0;
  }
}
</style>

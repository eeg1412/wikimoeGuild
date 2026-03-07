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
                    >{{ `${unit.row + 1}-${unit.col + 1}` }}</span
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
                  <!-- 行动准备度条 -->
                  <div v-if="unit.alive" class="act-bar-bg">
                    <div
                      class="act-bar-fill"
                      :style="{ width: actionReadiness(unit) + '%' }"
                    />
                  </div>
                  <div v-else class="act-bar-bg">
                    <div class="act-bar-fill" style="width: 0%"></div>
                  </div>
                  <!-- 符文技能蓄力进度条（SP） -->
                  <div
                    v-if="runeProgress(unit) >= 0 && unit.alive"
                    class="rune-bar-bg"
                  >
                    <div
                      class="rune-bar-fill"
                      :style="{
                        width: runeProgress(unit) + '%',
                        ...spBarColor(unit)
                      }"
                    />
                  </div>
                  <div v-else class="rune-bar-bg">
                    <div class="rune-bar-fill" style="width: 0%"></div>
                  </div>
                  <!-- 浮动效果指示器 -->
                  <div
                    v-for="(effect, eIdx) in getEffects(unit.id)"
                    :key="effect.id"
                    class="effect-float"
                    :class="'effect-' + effect.type"
                    :style="{ '--effect-idx': eIdx }"
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
                    >{{ `${unit.row + 1}-${unit.col + 1}` }}</span
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
                  <!-- 行动准备度条 -->
                  <div v-if="unit.alive" class="act-bar-bg">
                    <div
                      class="act-bar-fill"
                      :style="{ width: actionReadiness(unit) + '%' }"
                    />
                  </div>
                  <div v-else class="act-bar-bg">
                    <div class="act-bar-fill" style="width: 0%"></div>
                  </div>
                  <!-- 符文技能蓄力进度条（SP） -->
                  <div
                    v-if="runeProgress(unit) >= 0 && unit.alive"
                    class="rune-bar-bg"
                  >
                    <div
                      class="rune-bar-fill"
                      :style="{
                        width: runeProgress(unit) + '%',
                        ...spBarColor(unit)
                      }"
                    />
                  </div>
                  <div v-else class="rune-bar-bg">
                    <div class="rune-bar-fill" style="width: 0%"></div>
                  </div>
                  <!-- 浮动效果指示器 -->
                  <div
                    v-for="(effect, eIdx) in getEffects(unit.id)"
                    :key="effect.id"
                    class="effect-float"
                    :class="'effect-' + effect.type"
                    :style="{ '--effect-idx': eIdx }"
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
          class="flex items-center justify-center gap-2 py-1 mt-1 shrink-0 flex-wrap sticky bottom-[-8px] bg-gray-800/80 rounded-4xl z-[51] ring-1 ring-white/20"
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

      <!-- 符文石激活 Cut-in 特效 -->
      <Transition name="cutin">
        <div
          v-if="showRuneCutIn && runeCutInData"
          class="rune-cutin-overlay"
          :class="{
            'rune-cutin-overlay--ally': runeCutInData.isCasterAlly,
            'rune-cutin-overlay--enemy': !runeCutInData.isCasterAlly
          }"
        >
          <!-- 背景斜纹 -->
          <div class="cutin-bg-stripes"></div>

          <!-- 中心光晕 -->

          <!-- 主卡片 -->
          <div
            class="cutin-card"
            :class="`cutin-card--${runeCutInData.runeStoneRarity}`"
          >
            <!-- 粒子特效层（现在在卡片内显示） -->
            <div class="cutin-particles">
              <div
                v-for="i in 12"
                :key="i"
                class="cutin-particle"
                :style="{
                  top: Math.random() * 100 + '%',
                  left: runeCutInData.isCasterAlly ? '-20%' : '120%',
                  animationDelay: Math.random() * 0.6 + 's',
                  animationDuration: 0.4 + Math.random() * 0.4 + 's',
                  width: 20 + Math.random() * 60 + 'px',
                  height: '2px',
                  opacity: 0.2 + Math.random() * 0.5
                }"
              ></div>
            </div>

            <div class="cutin-card-inner">
              <!-- 冒险者头像 -->
              <div
                class="cutin-avatar-wrap"
                :class="`cutin-avatar-wrap--${runeCutInData.runeStoneRarity}`"
                :style="
                  runeCutInData.casterElement
                    ? {
                        borderColor: getElementColor(
                          runeCutInData.casterElement
                        ),
                        boxShadow: `0 0 20px ${getElementColor(runeCutInData.casterElement)}cc, 0 0 8px ${getElementColor(runeCutInData.casterElement)}88`
                      }
                    : {}
                "
              >
                <GameAdventurerAvatar
                  :adventurer="{
                    adventurerId: runeCutInData.casterId,
                    defaultAvatarId: runeCutInData.defaultAvatarId,
                    hasCustomAvatar: runeCutInData.hasCustomAvatar,
                    customAvatarUpdatedAt: runeCutInData.customAvatarUpdatedAt,
                    isDemon: runeCutInData.isDemon
                  }"
                  class="cutin-avatar"
                />
              </div>

              <!-- 信息区 -->
              <div class="cutin-info">
                <p class="cutin-caster-name">{{ runeCutInData.casterName }}</p>
                <div class="cutin-meta-row">
                  <span
                    class="cutin-rarity-badge"
                    :class="`cutin-rarity-badge--${runeCutInData.runeStoneRarity}`"
                  >
                    {{
                      RARITY_LABELS[runeCutInData.runeStoneRarity] ||
                      runeCutInData.runeStoneRarity
                    }}
                  </span>
                  <span
                    class="cutin-level-text"
                    :class="`cutin-level-text--${runeCutInData.runeStoneRarity}`"
                  >
                    Lv.{{ runeCutInData.runeStoneLevel }}
                  </span>
                </div>
                <div class="cutin-skill-list">
                  <p
                    v-for="(
                      skillEffect, skillIdx
                    ) in runeCutInData.skillEffects"
                    :key="`${skillEffect.skillType}-${skillIdx}`"
                    class="cutin-skill-effect"
                    :class="`cutin-skill--${skillEffect.skillType}`"
                    :style="getCutInSkillStyle(skillEffect)"
                  >
                    {{ getCutInSkillIcon(skillEffect) }}
                    {{ formatCutInSkillText(skillEffect) }}
                  </p>
                </div>
                <div
                  v-if="
                    runeCutInData.targets && runeCutInData.targets.length > 0
                  "
                  class="cutin-target-row"
                >
                  <span class="cutin-target-label">目标</span>
                  <div class="cutin-target-tags">
                    <div
                      v-for="(tgt, tgtIdx) in runeCutInData.targets"
                      :key="tgt.target || tgtIdx"
                      class="cutin-target-tag"
                    >
                      <div
                        class="cutin-target-avatar-wrap"
                        :class="{ 'cutin-target--ally': tgt.isTargetAlly }"
                      >
                        <GameAdventurerAvatar
                          :adventurer="{
                            adventurerId: tgt.target,
                            defaultAvatarId: tgt.targetDefaultAvatarId,
                            hasCustomAvatar: tgt.targetHasCustomAvatar,
                            customAvatarUpdatedAt:
                              tgt.targetCustomAvatarUpdatedAt,
                            isDemon: tgt.targetIsDemon
                          }"
                          class="cutin-target-avatar"
                        />
                      </div>
                      <span
                        class="cutin-target-name"
                        :class="{ 'cutin-target--ally': tgt.isTargetAlly }"
                        :title="tgt.targetName"
                        >{{ tgt.targetName }}</span
                      >
                    </div>
                  </div>
                </div>
                <!-- 持续进度条 -->
                <div class="cutin-timer-bar">
                  <div
                    :key="cutInKey"
                    class="cutin-timer-fill"
                    :class="`cutin-timer-fill--${runeCutInData.runeStoneRarity}`"
                    :style="{
                      animationDuration: runeCutInData.duration + 'ms'
                    }"
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Transition>
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

const ELEMENT_EMOJIS = {
  1: '🪨',
  2: '🌊',
  3: '🔥',
  4: '🌪️',
  5: '☀️',
  6: '🌑'
}

const ELEMENT_NAME_TO_KEY = {
  地: '1',
  水: '2',
  火: '3',
  风: '4',
  光明: '5',
  黑暗: '6'
}

const SKILL_TYPE_ICONS = {
  buff: '⬆️',
  debuff: '⬇️',
  sanRecover: '💚',
  changeOrder: '🔀',
  attack: '⚔️'
}

const ELEMENT_SKILL_COLORS = {
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

function resolveSkillElementKey(skillEffect) {
  const rawElement = skillEffect?.skillElement
  if (rawElement && ELEMENT_EMOJIS[String(rawElement)]) {
    return String(rawElement)
  }

  const sourceText = `${skillEffect?.skillEffectText || ''} ${skillEffect?.skillLabel || ''}`
  if (sourceText.includes('光明')) return ELEMENT_NAME_TO_KEY.光明
  if (sourceText.includes('黑暗')) return ELEMENT_NAME_TO_KEY.黑暗
  if (sourceText.includes('地')) return ELEMENT_NAME_TO_KEY.地
  if (sourceText.includes('水')) return ELEMENT_NAME_TO_KEY.水
  if (sourceText.includes('火')) return ELEMENT_NAME_TO_KEY.火
  if (sourceText.includes('风')) return ELEMENT_NAME_TO_KEY.风

  return null
}

function inferSkillType(skill) {
  if (skill?.skillType) return skill.skillType
  const sourceText = `${skill?.skillEffectText || ''} ${skill?.skillLabel || ''}`
  if (sourceText.includes('恢复') && sourceText.includes('SAN')) {
    return 'sanRecover'
  }
  if (sourceText.includes('改变排序') || sourceText.includes('互换')) {
    return 'changeOrder'
  }
  if (sourceText.includes('属性攻击') || resolveSkillElementKey(skill)) {
    return 'attack'
  }
  if (sourceText.includes('-')) {
    return 'debuff'
  }
  if (sourceText.includes('+')) {
    return 'buff'
  }
  return 'unknown'
}

function getCutInSkillIcon(skillEffect) {
  if (skillEffect?.skillType === 'attack') {
    const elementKey = resolveSkillElementKey(skillEffect)
    return ELEMENT_EMOJIS[elementKey] || '❓'
  }
  return SKILL_TYPE_ICONS[skillEffect?.skillType] || '✨'
}

function formatCutInSkillText(skillEffect) {
  if (skillEffect?.skillType !== 'attack') {
    return skillEffect?.skillEffectText || ''
  }

  if (typeof skillEffect?.skillValue === 'number') {
    return `伤害 ${skillEffect.skillValue}`
  }

  const num = String(skillEffect?.skillEffectText || '').match(/\d+/)?.[0]
  return num ? `伤害 ${num}` : '伤害'
}

function getCutInSkillStyle(skillEffect) {
  if (skillEffect?.skillType !== 'attack') {
    return null
  }
  const elementKey = resolveSkillElementKey(skillEffect)
  return {
    color: ELEMENT_SKILL_COLORS[elementKey] || '#f87171'
  }
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

// ── 防止息屏 (Wake Lock) ──
const wakeLock = ref(null)

async function requestWakeLock() {
  if ('wakeLock' in navigator) {
    try {
      wakeLock.value = await navigator.wakeLock.request('screen')
      console.log('Wake Lock is active')
    } catch (err) {
      console.error(`${err.name}, ${err.message}`)
    }
  }
}

async function releaseWakeLock() {
  if (wakeLock.value) {
    try {
      await wakeLock.value.release()
      wakeLock.value = null
      console.log('Wake Lock released')
    } catch (err) {
      console.error(`${err.name}, ${err.message}`)
    }
  }
}

const attackerIdSet = computed(
  () => new Set(props.attackerUnits.map(u => u.id))
)

function isAllyId(id) {
  if (!id) return false
  return attackerIdSet.value.has(id)
}

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

// 将被延迟的 AT 条百分比更新立即写入 unitDelayMap
function applyPendingDelays() {
  if (actingUnitPendingDelays.size > 0) {
    const newMap = new Map(unitDelayMap.value)
    for (const [id, pct] of actingUnitPendingDelays) {
      newMap.set(id, pct)
    }
    unitDelayMap.value = newMap
    actingUnitPendingDelays = new Map()
  }
}

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
    map.set(u.id, {
      ...u,
      side: 'attacker',
      alive: true,
      currentSan: u.maxSan,
      currentSp: 0,
      maxSp: 1000
    })
  }
  for (const u of props.defenderUnits) {
    map.set(u.id, {
      ...u,
      side: 'defender',
      alive: true,
      currentSan: u.maxSan,
      currentSp: 0,
      maxSp: 1000
    })
  }
  unitState.value = map
}

// 行动准备度：返回 0-100（延迟值越低代表越快行动，即越接近 100%）
function actionReadiness(unit) {
  if (!unit || !unit.alive) return 0
  const pct = unitDelayMap.value.get(unit.id)
  return pct === undefined ? 0 : pct
}

// SP 条动态颜色：根据百分比从深紫色渐变成亮橙色，告知玩家即将释放大招
function spBarColor(unit) {
  const pct = runeProgress(unit)
  const t = Math.max(0, Math.min(1, (pct < 0 ? 0 : pct) / 100))
  // 渐变起始色：深紫 #4c1d95 (76,29,149) → 鲜橙 #f97316 (249,115,22)
  const r1 = Math.round(76 + (249 - 76) * t)
  const g1 = Math.round(29 + (115 - 29) * t)
  const b1 = Math.round(149 + (22 - 149) * t)
  // 渐变结束色：中紫 #7c3aed (124,58,237) → 亮黄橙 #fbbf24 (251,191,36)
  const r2 = Math.round(124 + (251 - 124) * t)
  const g2 = Math.round(58 + (191 - 58) * t)
  const b2 = Math.round(237 + (36 - 237) * t)
  // 发光强度随百分比增强（0% 几乎无光，100% 强烈橙光）
  const glowAlpha = (0.15 + t * 0.85).toFixed(2)
  const glowSpread = Math.round(2 + t * 6)
  return {
    background: `linear-gradient(90deg, rgb(${r1},${g1},${b1}), rgb(${r2},${g2},${b2}))`,
    boxShadow: `0 0 ${glowSpread}px rgba(${r2},${g2},50, ${glowAlpha})`
  }
}

// 符文技能进度：返回 0-100（SP百分比）
function runeProgress(unit) {
  if (!unit || !unit.hasRuneStone) return -1
  const maxSp = unit.maxSp || 1000
  if (maxSp <= 0) return 0
  return Math.min(100, Math.max(0, Math.round((unit.currentSp / maxSp) * 100)))
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
// 各单位行动准备度：unitId → 0-100 百分比（越高表示距下次行动越近）
const unitDelayMap = ref(new Map())
const currentLogIndex = ref(0)
const actingUnitIds = ref(new Set())
const hitUnitIds = ref(new Set())
const counterHitUnitIds = ref(new Set()) // 受到克制攻击的单位
const buffedUnitIds = ref(new Set())
const debuffedUnitIds = ref(new Set())
const healedUnitIds = ref(new Set())
const movedUnitIds = ref(new Set())
let animationTimer = null
let hitClearTimer = null
// 待应用的行动单位 AT 条更新（金边消失后才清零）
let actingUnitPendingDelays = new Map()
const logContainer = ref(null)

// ── 符文石激活 Cut-in 特效 ──
const showRuneCutIn = ref(false)
const runeCutInData = ref(null)
let cutInTimer = null
// 每次新 cut-in 播放时自增，强制重建 timer-fill 元素以重启 CSS animation
const cutInKey = ref(0)
// 待播放的符文激活队列（同一次激活合并为一个cut in）
const runeCutInQueue = []
// 当前一组 cut-in 对应的符文技能效果，等全部 cut-in 播放完后统一应用
let pendingRuneSkillLogsAfterCutIn = []
// cut-in 结束后的下一阶段回调（用于攻击前/攻击/攻击后 3 阶段演出）
let nextPhaseCallback = null

const RARITY_LABELS = { normal: '普通', rare: '稀有', legendary: '传说' }

function getCutInDuration(rarity) {
  const base = rarity === 'legendary' ? 1400 : 1200
  return Math.max(400, Math.round(base / playbackSpeed.value))
}

/**
 * cut-in 全部完成后的恢复逻辑：
 * 若存在阶段回调（preAttack cut-in 结束后去执行攻击阶段）则调用它，否则恢复主动画。
 */
function _resumeAfterCutIn() {
  if (nextPhaseCallback) {
    const cb = nextPhaseCallback
    nextPhaseCallback = null
    cb()
  } else {
    startAnimation()
  }
}

/**
 * 从队列中取下一个技能展示 cut-in，若队列为空则恢复主动画
 */
function processNextCutIn() {
  // 当前回调触发时，上一段定时器已经完成，先清空句柄，避免后续入队被误判为“仍在播放”
  cutInTimer = null

  if (runeCutInQueue.length === 0) {
    hideCutInEffect()
    _resumeAfterCutIn()
    return
  }
  const cutInItem = runeCutInQueue.shift()
  const duration = getCutInDuration(cutInItem.runeStoneRarity)

  if (
    Array.isArray(cutInItem._runeSkillLogs) &&
    cutInItem._runeSkillLogs.length
  ) {
    pendingRuneSkillLogsAfterCutIn.push(...cutInItem._runeSkillLogs)
  }

  // cut-in 播放前先应用该施法者的 SP 归零，这样 SP 条动画在每个 cut-in 期间都可见
  if (cutInItem._casterSpUpdate) {
    const unit = unitState.value.get(cutInItem._casterSpUpdate.id)
    if (unit) {
      unit.currentSp = cutInItem._casterSpUpdate.sp
      unitState.value = new Map(unitState.value)
    }
  }

  const skillEffects = (cutInItem.skills || []).map(skill => ({
    skillLabel: skill.skillLabel,
    skillType: skill.skillType,
    skillEffectText: skill.skillEffectText,
    skillElement: skill.skillElement,
    skillValue: skill.skillValue,
    isTargetAlly: skill.isTargetAlly,
    target: skill.target,
    targetName: skill.targetName,
    targetDefaultAvatarId: skill.targetDefaultAvatarId,
    targetHasCustomAvatar: skill.targetHasCustomAvatar,
    targetCustomAvatarUpdatedAt: skill.targetCustomAvatarUpdatedAt,
    targetIsDemon: skill.targetIsDemon
  }))
  const firstSkill = skillEffects[0] || null

  // 从skillEffects去重构建目标列表（按target id去重）
  const seenTargetKeys = new Set()
  const targets = []
  for (const skill of skillEffects) {
    if (!skill.targetName) continue
    const key = skill.target || skill.targetName
    if (!seenTargetKeys.has(key)) {
      seenTargetKeys.add(key)
      targets.push({
        target: skill.target,
        targetName: skill.targetName,
        isTargetAlly: skill.isTargetAlly,
        targetDefaultAvatarId: skill.targetDefaultAvatarId,
        targetHasCustomAvatar: skill.targetHasCustomAvatar,
        targetCustomAvatarUpdatedAt: skill.targetCustomAvatarUpdatedAt,
        targetIsDemon: skill.targetIsDemon
      })
    }
  }

  // 获取施法者元素类型，用于 cut-in 头像渐变边框颜色
  const casterUnit = unitState.value.get(cutInItem.casterId)
  const casterElement = casterUnit?.element || null

  runeCutInData.value = {
    ...cutInItem,
    casterElement,
    isCombined: skillEffects.length > 1,
    skillEffects,
    targets,
    skillType: firstSkill?.skillType,
    isTargetAlly: firstSkill?.isTargetAlly,
    target: firstSkill?.target,
    targetName: firstSkill?.targetName,
    targetDefaultAvatarId: firstSkill?.targetDefaultAvatarId,
    targetHasCustomAvatar: firstSkill?.targetHasCustomAvatar,
    targetCustomAvatarUpdatedAt: firstSkill?.targetCustomAvatarUpdatedAt,
    targetIsDemon: firstSkill?.targetIsDemon,
    duration
  }
  // 每次新 cut-in 自增 key，强制 Vue 销毁并重建 cutin-timer-fill 元素，重启 CSS animation
  cutInKey.value++
  showRuneCutIn.value = true
  cutInTimer = setTimeout(() => {
    // 队列中还有内容时直接切下一条，避免中间空窗导致闪动
    if (runeCutInQueue.length > 0) {
      processNextCutIn()
      return
    }
    // 最后一条播放结束后再执行离场
    showRuneCutIn.value = false
    cutInTimer = setTimeout(() => {
      cutInTimer = null
      hideCutInEffect()
      const clearDelay = applyCutInRuneSkillLogs(pendingRuneSkillLogsAfterCutIn)
      pendingRuneSkillLogsAfterCutIn = []
      if (clearDelay > 0) {
        cutInTimer = setTimeout(() => {
          cutInTimer = null
          _resumeAfterCutIn()
        }, clearDelay)
        return
      }
      _resumeAfterCutIn()
    }, 50)
  }, duration)
}

/**
 * 接收 runeActivate 条目，将所有技能入队并启动队列播放
 */
function enqueueCutIn(entry) {
  // 兼容旧格式（单技能）和新格式（skills 数组）
  const skills = entry.skills ?? [
    {
      skillLabel: entry.skillLabel,
      skillType: entry.skillType,
      isAllyTarget: entry.isAllyTarget,
      skillEffectText: entry.skillEffectText,
      skillElement: entry.skillElement,
      skillValue: entry.skillValue,
      target: entry.target,
      targetName: entry.targetName,
      targetDefaultAvatarId: entry.targetDefaultAvatarId,
      targetHasCustomAvatar: entry.targetHasCustomAvatar,
      targetCustomAvatarUpdatedAt: entry.targetCustomAvatarUpdatedAt,
      targetIsDemon: entry.targetIsDemon
    }
  ]
  const normalizedSkills = skills.map(skill => {
    const skillType = inferSkillType(skill)
    const skillLabel = skill.skillLabel || ''
    return {
      ...skill,
      skillType,
      skillLabel,
      isTargetAlly: isAllyId(skill.target),
      skillEffectText: skill.skillEffectText
    }
  })

  runeCutInQueue.push({
    casterId: entry.caster,
    casterName: entry.casterName,
    isCasterAlly: isAllyId(entry.caster),
    runeStoneRarity: entry.runeStoneRarity,
    runeStoneLevel: entry.runeStoneLevel,
    defaultAvatarId: entry.defaultAvatarId,
    hasCustomAvatar: entry.hasCustomAvatar,
    customAvatarUpdatedAt: entry.customAvatarUpdatedAt,
    isDemon: entry.isDemon,
    skills: normalizedSkills,
    // 施法者 SP 归零的更新，在对应 cut-in 播放前才应用（使 SP 条动画在每个 cut-in 期间可见）
    _casterSpUpdate: entry._casterSpUpdate ?? null,
    // 与该次 runeActivate 绑定的 runeSkill 日志，全部 cut-in 结束后统一应用
    _runeSkillLogs: entry._runeSkillLogs ?? []
  })

  if (!showRuneCutIn.value && !cutInTimer) {
    processNextCutIn()
  }
}

function hideCutInEffect() {
  showRuneCutIn.value = false
  runeCutInData.value = null
}

function consumeRuneSkillLogsForCutIn(casterId) {
  const runeSkillLogs = []
  while (currentLogIndex.value < props.battleLog.length) {
    const nextEntry = props.battleLog[currentLogIndex.value]
    if (nextEntry.type === 'runeSkill' && nextEntry.caster === casterId) {
      runeSkillLogs.push(nextEntry)
      displayedLogs.value.push(nextEntry)
      currentLogIndex.value++
      continue
    }
    break
  }
  return runeSkillLogs
}

function applyCutInRuneSkillLogs(runeSkillLogs) {
  if (!Array.isArray(runeSkillLogs) || runeSkillLogs.length === 0) return 0

  const map = unitState.value
  const newActing = new Set()
  const newHit = new Set()
  const newCounterHit = new Set()
  const newBuffed = new Set()
  const newDebuffed = new Set()
  const newHealed = new Set()
  const newMoved = new Set()
  let needRefreshState = false

  for (const entry of runeSkillLogs) {
    if (!entry || entry.type !== 'runeSkill') continue

    newActing.add(entry.caster)

    if (entry.skillType === 'attack') {
      const target = map.get(entry.target)
      // 若目标已阵亡，跳过 HP 更新，防止因演出顺序差异导致血条异常回升
      if (target && !target.alive) continue
      if (target) {
        target.currentSan = entry.targetRemainSan
        if (typeof entry.targetCurrentSp === 'number') {
          target.currentSp = entry.targetCurrentSp
        }
        if (target.currentSan <= 0) target.alive = false
        const koText = target.currentSan <= 0 ? ' 💀' : ''
        const elementEmoji = ELEMENT_EMOJIS[entry.skillElement] || ''
        const attackIcon = elementEmoji || SKILL_TYPE_ICONS.attack
        if (entry.elementCounter) {
          newCounterHit.add(entry.target)
          addEffect(
            entry.target,
            `${attackIcon}-${entry.damage}${koText}`,
            'damage-counter'
          )
        } else {
          newHit.add(entry.target)
          addEffect(
            entry.target,
            `${attackIcon}-${entry.damage}${koText}`,
            'damage'
          )
        }
        needRefreshState = true
      }
    }

    if (entry.skillType === 'buff') {
      newBuffed.add(entry.target)
      const label = BUFF_TYPE_LABEL[entry.buffType] || entry.buffType
      addEffect(
        entry.target,
        `${SKILL_TYPE_ICONS.buff}${label}+${entry.value}`,
        'buff'
      )
    }

    if (entry.skillType === 'debuff') {
      newDebuffed.add(entry.target)
      const label = BUFF_TYPE_LABEL[entry.debuffType] || entry.debuffType
      addEffect(
        entry.target,
        `${SKILL_TYPE_ICONS.debuff}${label}-${entry.value}`,
        'debuff'
      )
    }

    if (entry.skillType === 'sanRecover') {
      const target = map.get(entry.target)
      // 若目标已阵亡，跳过 HP 恢复，防止血条异常回升
      if (target && !target.alive) continue
      if (target) {
        target.currentSan = entry.targetRemainSan
        needRefreshState = true
      }
      newHealed.add(entry.target)
      addEffect(
        entry.target,
        `${SKILL_TYPE_ICONS.sanRecover}+${entry.healAmount}`,
        'heal'
      )
    }

    if (entry.skillType === 'changeOrder' && entry.success) {
      const target = map.get(entry.target)
      let swapTarget = null

      if (entry.swapped && entry.swapTarget) {
        swapTarget = map.get(entry.swapTarget) || null
      }

      if (!swapTarget && target) {
        for (const unit of map.values()) {
          if (unit.id === target.id) continue
          if (unit.side !== target.side) continue
          if (unit.row === entry.newRow && unit.col === entry.newCol) {
            swapTarget = unit
            break
          }
        }
      }

      if (target) {
        target.row = entry.newRow
        target.col = entry.newCol
        newMoved.add(entry.target)
        addEffect(entry.target, '🔀 移动', 'move')
      }

      if (swapTarget) {
        swapTarget.row = entry.oldRow
        swapTarget.col = entry.oldCol
        newMoved.add(swapTarget.id)
        addEffect(swapTarget.id, '🔀 互换', 'move')
      }

      needRefreshState = true
    }
  }

  actingUnitIds.value = newActing
  hitUnitIds.value = newHit
  counterHitUnitIds.value = newCounterHit
  buffedUnitIds.value = newBuffed
  debuffedUnitIds.value = newDebuffed
  healedUnitIds.value = newHealed
  movedUnitIds.value = newMoved

  if (needRefreshState) {
    unitState.value = new Map(unitState.value)
  }

  if (hitClearTimer) {
    clearTimeout(hitClearTimer)
    hitClearTimer = null
  }
  const clearDelay = Math.max(300, Math.round(600 / playbackSpeed.value))
  hitClearTimer = setTimeout(() => {
    actingUnitIds.value = new Set()
    hitUnitIds.value = new Set()
    counterHitUnitIds.value = new Set()
    buffedUnitIds.value = new Set()
    debuffedUnitIds.value = new Set()
    healedUnitIds.value = new Set()
    movedUnitIds.value = new Set()
  }, clearDelay)

  return clearDelay
}

/**
 * 检查战斗是否已分出胜负（攻击方全灭 或 防守方全灭）
 * 用于在攻击结算后、cut-in 触发前进行判断，若已决出胜负则跳过 cut-in 演出
 */
function isBattleDecided() {
  const units = [...unitState.value.values()]
  const anyAttackerAlive = units.some(u => isAllyId(u.id) && u.alive)
  const anyDefenderAlive = units.some(u => !isAllyId(u.id) && u.alive)
  return !anyAttackerAlive || !anyDefenderAlive
}

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
  const counterHit = counterHitUnitIds.value.has(unit.id)
    ? ' cell-hit-counter'
    : ''
  const buffed = buffedUnitIds.value.has(unit.id) ? ' cell-buffed' : ''
  const debuffed = debuffedUnitIds.value.has(unit.id) ? ' cell-debuffed' : ''
  const healed = healedUnitIds.value.has(unit.id) ? ' cell-healed' : ''
  const moved = movedUnitIds.value.has(unit.id) ? ' cell-moved' : ''
  return cls + acting + hit + counterHit + buffed + debuffed + healed + moved
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
    if (entry.skillType === 'attack' && entry.elementCounter)
      return 'log-attack-counter'
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
  if (entry.type === 'runeActivate') return ''
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
      case 'attack': {
        const counterMark = entry.elementCounter ? ' 克制!' : ''
        return `✨ ${casterLabel}${entry.casterName} 发动 [${entry.skillLabel}] → ${targetLabel}${entry.targetName} ${entry.damage} 伤害${counterMark}`
      }
      case 'buff':
        const buffLabel = BUFF_TYPE_LABEL[entry.buffType] || entry.buffType
        return `⬆️ ${casterLabel}${entry.casterName} 发动 [${entry.skillLabel}] → ${targetLabel}${entry.targetName} ${buffLabel}+${entry.value}`
      case 'debuff':
        const debuffLabel =
          BUFF_TYPE_LABEL[entry.debuffType] || entry.debuffType
        return `⬇️ ${casterLabel}${entry.casterName} 发动 [${entry.skillLabel}] → ${targetLabel}${entry.targetName} ${debuffLabel}-${entry.value}`
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
  if (entry.type === 'runeActivate') {
    const caster = unitState.value.get(entry.caster)
    if (caster && typeof entry.casterCurrentSp === 'number') {
      caster.currentSp = entry.casterCurrentSp
      unitState.value = new Map(unitState.value)
    }
    return
  }

  const map = unitState.value

  // 在处理新 log 之前，先应用并清除上一轮待定的 AT 更新
  // 这样如果连续多个回合没有特效，AT 条也能正常刷新
  applyPendingDelays()

  // 清除上一轮的特效状态
  if (hitClearTimer) {
    clearTimeout(hitClearTimer)
    hitClearTimer = null
    // 之前已经 apply 过了，这里确保状态彻底干净
  }
  hitUnitIds.value = new Set()
  buffedUnitIds.value = new Set()
  debuffedUnitIds.value = new Set()
  healedUnitIds.value = new Set()
  movedUnitIds.value = new Set()

  let needRefreshState = false

  if (entry.type === 'roundStart') {
    currentRound.value = entry.round
    // 直接应用本回合行动前的 AT 条值（机制：金边消失时再取下一个 roundStart 的后置值，与金边同帧更新）
    if (Array.isArray(entry.unitDelays) && entry.unitDelays.length > 0) {
      const minD = Math.min(...entry.unitDelays.map(d => d.delay))
      const newMap = new Map()
      for (const { id, delay, baseDelay } of entry.unitDelays) {
        const base = baseDelay || 1
        const pct = Math.max(
          0,
          Math.min(100, Math.round((1 - (delay - minD) / base) * 100))
        )
        newMap.set(id, pct)
      }
      unitDelayMap.value = newMap
    }
    if (Array.isArray(entry.spChanges)) {
      for (const spEntry of entry.spChanges) {
        const unit = map.get(spEntry.id)
        if (unit && typeof spEntry.currentSp === 'number') {
          unit.currentSp = spEntry.currentSp
          needRefreshState = true
        }
      }
    }
    if (needRefreshState) {
      unitState.value = new Map(unitState.value)
    }
    return
  }
  if (entry.type === 'attack') {
    actingUnitIds.value = new Set([entry.attacker])
    const attacker = map.get(entry.attacker)
    if (attacker && typeof entry.attackerCurrentSp === 'number') {
      attacker.currentSp = entry.attackerCurrentSp
      needRefreshState = true
    }
    const defender = map.get(entry.defender)
    if (defender) {
      defender.currentSan = entry.defenderRemainSan
      if (typeof entry.defenderCurrentSp === 'number') {
        defender.currentSp = entry.defenderCurrentSp
      }
      if (defender.currentSan <= 0) defender.alive = false
      // 克制攻击使用专用震动动画
      if (entry.elementCounter) {
        counterHitUnitIds.value = new Set([entry.defender])
      } else {
        hitUnitIds.value = new Set([entry.defender])
      }
      const koText = defender.currentSan <= 0 ? ' 💀' : ''
      addEffect(
        entry.defender,
        `-${entry.damage}${koText}`,
        entry.elementCounter ? 'damage-counter' : 'damage'
      )
      needRefreshState = true
    }
  }
  if (entry.type === 'runeSkill') {
    actingUnitIds.value = new Set([entry.caster])
    if (entry.skillType === 'attack') {
      const target = map.get(entry.target)
      // 防御性检查：如果目标已阵亡，跳过 HP 更新
      if (target && !target.alive) {
        /* skip */
      } else if (target) {
        target.currentSan = entry.targetRemainSan
        if (typeof entry.targetCurrentSp === 'number') {
          target.currentSp = entry.targetCurrentSp
        }
        if (target.currentSan <= 0) target.alive = false
        const koText = target.currentSan <= 0 ? ' 💀' : ''
        const elementEmoji = ELEMENT_EMOJIS[entry.skillElement] || ''
        const attackIcon = elementEmoji || SKILL_TYPE_ICONS.attack
        if (entry.elementCounter) {
          counterHitUnitIds.value = new Set([entry.target])
          addEffect(
            entry.target,
            `${attackIcon}-${entry.damage}${koText}`,
            'damage-counter'
          )
        } else {
          hitUnitIds.value = new Set([entry.target])
          addEffect(
            entry.target,
            `${attackIcon}-${entry.damage}${koText}`,
            'damage'
          )
        }
        needRefreshState = true
      }
    }
    if (entry.skillType === 'buff') {
      buffedUnitIds.value = new Set([entry.target])
      const label = BUFF_TYPE_LABEL[entry.buffType] || entry.buffType
      addEffect(
        entry.target,
        `${SKILL_TYPE_ICONS.buff}${label}+${entry.value}`,
        'buff'
      )
    }
    if (entry.skillType === 'debuff') {
      debuffedUnitIds.value = new Set([entry.target])
      const label = BUFF_TYPE_LABEL[entry.debuffType] || entry.debuffType
      addEffect(
        entry.target,
        `${SKILL_TYPE_ICONS.debuff}${label}-${entry.value}`,
        'debuff'
      )
    }
    if (entry.skillType === 'sanRecover') {
      const target = map.get(entry.target)
      // 防御性检查：已阵亡目标不恢复 HP
      if (target && target.alive) {
        target.currentSan = entry.targetRemainSan
        needRefreshState = true
      }
      healedUnitIds.value = new Set([entry.target])
      addEffect(
        entry.target,
        `${SKILL_TYPE_ICONS.sanRecover}+${entry.healAmount}`,
        'heal'
      )
    }
    if (entry.skillType === 'changeOrder' && entry.success) {
      // 更新单位的棋盘位置
      // 兜底：若日志未提供可用 swapTarget，则按当前位置查找占位者并互换，避免重叠导致“少人”
      const moved = new Set()
      const target = map.get(entry.target)
      let swapTarget = null

      if (entry.swapped && entry.swapTarget) {
        swapTarget = map.get(entry.swapTarget) || null
      }

      if (!swapTarget && target) {
        for (const unit of map.values()) {
          if (unit.id === target.id) continue
          if (unit.side !== target.side) continue
          if (unit.row === entry.newRow && unit.col === entry.newCol) {
            swapTarget = unit
            break
          }
        }
      }

      if (target) {
        target.row = entry.newRow
        target.col = entry.newCol
        moved.add(entry.target)
        addEffect(entry.target, '🔀 移动', 'move')
      }

      if (swapTarget) {
        swapTarget.row = entry.oldRow
        swapTarget.col = entry.oldCol
        moved.add(swapTarget.id)
        addEffect(swapTarget.id, '🔀 互换', 'move')
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
    counterHitUnitIds.value = new Set()
    buffedUnitIds.value = new Set()
    debuffedUnitIds.value = new Set()
    healedUnitIds.value = new Set()
    movedUnitIds.value = new Set()
    // 金边消失后，再将行动单位的 AT 条清零（触发清零动画）
    applyPendingDelays()
  }, clearDelay)
}

const animationFinished = ref(false)

/**
 * 批量处理当前回合所有同时出手的条目（3阶段演出版本）：
 * 阶段1（攻击前）：triggerTiming='before' 的 runeActivate → cut-in 展示 → 应用技能效果
 * 阶段2（攻击）：attack 条目 → 同时金边/红边展示
 * 阶段3（攻击后）：triggerTiming='after' 的 runeActivate → cut-in 展示 → 应用技能效果
 */
function batchProcessCurrentRound() {
  // ① 立即停止 setInterval，防止游离 tick 提前调用 applyPendingDelays
  stopAnimation()

  // ② 若上一轮的金边清除定时器还在跑，立即结算
  if (hitClearTimer) {
    clearTimeout(hitClearTimer)
    hitClearTimer = null
    applyPendingDelays()
  }

  const map = unitState.value
  const preAttackCutIns = [] // triggerTiming='before' 的 cut-in
  const attackEntries = [] // attack 日志条目
  const postAttackCutIns = [] // triggerTiming='after' 的 cut-in

  // === 扫描本回合所有条目：消费 runeSkill 日志并按阶段分类 ===
  while (currentLogIndex.value < props.battleLog.length) {
    const entry = props.battleLog[currentLogIndex.value]
    if (entry.type === 'roundStart') break
    currentLogIndex.value++
    displayedLogs.value.push(entry)

    if (entry.type === 'runeActivate') {
      // SP 延迟到 cut-in 播放前应用，使 SP 条动画可见
      const runeSkillLogs = consumeRuneSkillLogsForCutIn(entry.caster)
      const cutInEntry = {
        ...entry,
        _casterSpUpdate:
          typeof entry.casterCurrentSp === 'number'
            ? { id: entry.caster, sp: entry.casterCurrentSp }
            : null,
        _runeSkillLogs: runeSkillLogs
      }
      if (entry.triggerTiming === 'before') {
        preAttackCutIns.push(cutInEntry)
      } else {
        postAttackCutIns.push(cutInEntry)
      }
      continue
    }

    if (entry.type === 'attack') {
      attackEntries.push(entry)
      continue
    }

    // 兜底：独立的 runeSkill 条目（理论上不会出现，防御性处理）
    if (entry.type === 'runeSkill') {
      postAttackCutIns.push({
        casterId: entry.caster,
        casterName: entry.casterName,
        isCasterAlly: isAllyId(entry.caster),
        runeStoneRarity: 'normal',
        runeStoneLevel: 1,
        defaultAvatarId: null,
        hasCustomAvatar: false,
        customAvatarUpdatedAt: null,
        isDemon: false,
        skills: [],
        _casterSpUpdate: null,
        _runeSkillLogs: [entry]
      })
    }
  }

  // 日志区域滚动到底部
  nextTick(() => {
    if (logContainer.value) {
      logContainer.value.scrollTop = logContainer.value.scrollHeight
    }
  })

  // === 攻击阶段：展示攻击效果，结束后触发 post-attack cut-in 或恢复动画 ===
  function executeAttackPhase() {
    const newActing = new Set()
    const newHit = new Set()
    const newCounterHit = new Set()
    let needRefreshState = false

    for (const entry of attackEntries) {
      newActing.add(entry.attacker)
      const attacker = map.get(entry.attacker)
      if (attacker && typeof entry.attackerCurrentSp === 'number') {
        attacker.currentSp = entry.attackerCurrentSp
        needRefreshState = true
      }
      const defender = map.get(entry.defender)
      if (defender) {
        defender.currentSan = entry.defenderRemainSan
        if (typeof entry.defenderCurrentSp === 'number') {
          defender.currentSp = entry.defenderCurrentSp
        }
        if (defender.currentSan <= 0) defender.alive = false
        const koText = defender.currentSan <= 0 ? ' 💀' : ''
        if (entry.elementCounter) {
          newCounterHit.add(entry.defender)
          addEffect(
            entry.defender,
            `-${entry.damage}${koText}`,
            'damage-counter'
          )
        } else {
          newHit.add(entry.defender)
          addEffect(entry.defender, `-${entry.damage}${koText}`, 'damage')
        }
        needRefreshState = true
      }
    }

    // 一次性写入视觉状态（同时金边 / 同时红边）
    actingUnitIds.value = newActing
    hitUnitIds.value = newHit
    counterHitUnitIds.value = newCounterHit
    buffedUnitIds.value = new Set()
    debuffedUnitIds.value = new Set()
    healedUnitIds.value = new Set()
    movedUnitIds.value = new Set()

    if (needRefreshState) {
      unitState.value = new Map(unitState.value)
    }

    // 若无攻击条目，跳过 hitClearTimer 直接进入下一阶段
    if (attackEntries.length === 0) {
      if (postAttackCutIns.length > 0 && !isBattleDecided()) {
        for (const ra of postAttackCutIns) enqueueCutIn(ra)
      } else {
        startAnimation()
      }
      return
    }

    // ③ 统一清除定时器：金边消失、AT 条归零与 post-attack cut-in 触发严格同帧
    const clearDelay = Math.max(300, Math.round(600 / playbackSpeed.value))
    hitClearTimer = setTimeout(() => {
      hitClearTimer = null
      actingUnitIds.value = new Set()
      hitUnitIds.value = new Set()
      counterHitUnitIds.value = new Set()
      buffedUnitIds.value = new Set()
      debuffedUnitIds.value = new Set()
      healedUnitIds.value = new Set()
      movedUnitIds.value = new Set()

      // 「与金边消失同帧」更新 AT 条
      const nextRound = props.battleLog
        .slice(currentLogIndex.value)
        .find(e => e.type === 'roundStart')
      if (
        nextRound &&
        Array.isArray(nextRound.unitDelays) &&
        nextRound.unitDelays.length > 0
      ) {
        const minD = Math.min(...nextRound.unitDelays.map(d => d.delay))
        const newMap = new Map(unitDelayMap.value)
        for (const { id, delay, baseDelay } of nextRound.unitDelays) {
          const base = baseDelay || 1
          const pct = Math.max(
            0,
            Math.min(100, Math.round((1 - (delay - minD) / base) * 100))
          )
          newMap.set(id, pct)
        }
        unitDelayMap.value = newMap
      }

      if (postAttackCutIns.length > 0 && !isBattleDecided()) {
        for (const ra of postAttackCutIns) enqueueCutIn(ra)
        // processNextCutIn → _resumeAfterCutIn → startAnimation
      } else {
        startAnimation()
      }
    }, clearDelay)
  }

  // === 阶段调度：攻击前 cut-in → 攻击阶段 → 攻击后 cut-in → 动画恢复 ===
  if (preAttackCutIns.length > 0 && !isBattleDecided()) {
    // pre-attack cut-in 结束后 _resumeAfterCutIn 会调用 executeAttackPhase
    nextPhaseCallback = executeAttackPhase
    for (const ra of preAttackCutIns) enqueueCutIn(ra)
  } else {
    executeAttackPhase()
  }
}

function playNextLog() {
  if (currentLogIndex.value >= props.battleLog.length) {
    stopAnimation()
    animationFinished.value = true
    releaseWakeLock() // 演出自然结束时释放
    return
  }
  const entry = props.battleLog[currentLogIndex.value]

  // roundStart：先处理本条（AT 条 / SP / 回合数），再批量处理本轮所有同时行动
  if (entry.type === 'roundStart') {
    processLogEntry(entry)
    displayedLogs.value.push(entry)
    currentLogIndex.value++
    batchProcessCurrentRound()
    return
  }

  // 兜底：若非 roundStart 条目游离在外（理论上不应发生），按原逻辑逐条处理
  if (entry.type === 'runeActivate') {
    currentLogIndex.value++
    stopAnimation()
    enqueueCutIn({
      ...entry,
      _casterSpUpdate:
        typeof entry.casterCurrentSp === 'number'
          ? { id: entry.caster, sp: entry.casterCurrentSp }
          : null,
      _runeSkillLogs: consumeRuneSkillLogsForCutIn(entry.caster)
    })
    return
  }

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
  if (animationTimer) clearInterval(animationTimer)
  animationTimer = setInterval(playNextLog, getInterval())
  // 立即触发第一次，消除 cut-in/hitClearTimer 结束后等待第一个间隔的尴尬感
  playNextLog()
}

function stopAnimation() {
  if (animationTimer) {
    clearInterval(animationTimer)
    animationTimer = null
  }
}

function handleSkip() {
  // 清除 cut-in 队列和定时器
  if (cutInTimer) {
    clearTimeout(cutInTimer)
    cutInTimer = null
  }
  if (hitClearTimer) {
    clearTimeout(hitClearTimer)
    hitClearTimer = null
  }
  runeCutInQueue.length = 0
  pendingRuneSkillLogsAfterCutIn = []
  nextPhaseCallback = null
  hideCutInEffect()
  stopAnimation()
  // 跳过时立即释放锁
  releaseWakeLock()
  while (currentLogIndex.value < props.battleLog.length) {
    const entry = props.battleLog[currentLogIndex.value]
    if (entry.type !== 'runeActivate') {
      processLogEntry(entry)
      displayedLogs.value.push(entry)
    }
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
  // 等待弹窗弹出动画结束后再开始播放演出
  setTimeout(() => {
    startAnimation()
  }, 800)
  startSkipCountdown()
  // 演出开始时请求防止息屏
  requestWakeLock()
})

onUnmounted(() => {
  window.removeEventListener('resize', onResize)
  if (window.visualViewport) {
    window.visualViewport.removeEventListener('resize', onResize)
  }
  stopAnimation()
  // 保底销毁时释放
  releaseWakeLock()
  if (skipTimer) {
    clearInterval(skipTimer)
    skipTimer = null
  }
  if (hitClearTimer) {
    clearTimeout(hitClearTimer)
    hitClearTimer = null
  }
  if (cutInTimer) {
    clearTimeout(cutInTimer)
    cutInTimer = null
  }
  runeCutInQueue.length = 0
  pendingRuneSkillLogsAfterCutIn = []
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

/* 克制命中：幅度更大的震动（带小幅度旋转的摇摆） */
.cell-hit-counter {
  border-color: rgba(255, 140, 0, 0.9) !important;
  box-shadow:
    0 0 16px rgba(255, 140, 0, 0.8),
    0 0 4px rgba(255, 200, 0, 0.6);
  animation: hitShakeCounter 0.5s ease-in-out;
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

/* 克制命中大幅度震动（幅度更大，带旋转摇摆） */
@keyframes hitShakeCounter {
  0% {
    transform: translateX(0) rotate(0deg);
  }
  10% {
    transform: translateX(-7px) rotate(-4deg);
    background: rgba(255, 140, 0, 0.4);
  }
  25% {
    transform: translateX(8px) rotate(4deg);
    background: rgba(255, 140, 0, 0.35);
  }
  40% {
    transform: translateX(-6px) rotate(-3deg);
    background: rgba(255, 140, 0, 0.25);
  }
  55% {
    transform: translateX(5px) rotate(2deg);
    background: rgba(255, 140, 0, 0.15);
  }
  70% {
    transform: translateX(-3px) rotate(-1deg);
  }
  85% {
    transform: translateX(2px) rotate(0.5deg);
  }
  100% {
    transform: translateX(0) rotate(0deg);
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

/* 符文技能蓄力进度条 */
.rune-bar-bg {
  width: 90%;
  height: 2px;
  background: rgba(167, 139, 250, 0.2);
  border-radius: 2px;
  margin-top: 1px;
  overflow: hidden;
}

.rune-bar-fill {
  height: 100%;
  width: 0%;
  border-radius: 2px;
  /* background 由 spBarColor() 内联样式动态计算 */
  transition:
    width 0.3s ease,
    background 0.5s ease,
    box-shadow 0.5s ease;
}

/* 行动准备度条（每个单位格内，显示距下次行动的准备程度） */
.act-bar-bg {
  width: 90%;
  height: 2px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
  margin-top: 1px;
  overflow: hidden;
}

.act-bar-fill {
  height: 100%;
  border-radius: 2px;
  background: linear-gradient(90deg, #0891b2, #22d3ee);
  transition: width 0.35s ease;
  box-shadow: 0 0 3px rgba(34, 211, 238, 0.55);
}

.battle-log-area {
  flex: 1;
  min-height: 100px;
  overflow-y: auto;
  background: rgba(0, 0, 0, 0.4);
  border-radius: 8px;
  padding: 6px 8px;
  scrollbar-width: thin;
  scrollbar-color: rgba(200, 160, 80, 0.3) transparent;
  margin-top: 5px;
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
  color: #f87171;
}
.log-buff {
  color: #34d399;
}
.log-debuff {
  color: #a78bfa;
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
  top: calc(var(--effect-idx, 0) * -18px);
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
/* 克制伤害浮动文字：更大、加粗、橙色 */
.effect-damage-counter {
  color: #ff8c00;
  font-size: 16px;
  font-weight: 900;
  text-shadow:
    0 0 8px rgba(255, 140, 0, 0.8),
    0 1px 4px rgba(0, 0, 0, 0.9),
    0 0 3px rgba(255, 50, 0, 0.6);
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

/* ══════════════════════════════════════
   符文石激活 Cut-in 特效
   ══════════════════════════════════════ */

/* Transition 动画 */
.cutin-enter-active {
  animation: cutinOverlayIn 0.18s ease-out;
}
.cutin-leave-active {
  animation: cutinOverlayOut 0.18s ease-in forwards;
}
@keyframes cutinOverlayIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
@keyframes cutinOverlayOut {
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
}

/* 覆盖整个 battle-animation-overlay */
.rune-cutin-overlay {
  position: absolute;
  inset: 0;
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background: rgba(4, 0, 18, 0.6);
}

/* .rune-cutin-overlay--ally {
  background:
    radial-gradient(circle at 50% 50%, rgba(16, 70, 54, 0.22), transparent 65%),
    rgba(4, 0, 18, 0.6);
}

.rune-cutin-overlay--enemy {
  background:
    radial-gradient(
      circle at 50% 50%,
      rgba(104, 22, 32, 0.24),
      transparent 65%
    ),
    rgba(4, 0, 18, 0.6);
} */

/* 背景斜纹 */
.cutin-bg-stripes {
  position: absolute;
  inset: 0;
  background-image: repeating-linear-gradient(
    -55deg,
    transparent,
    transparent 10px,
    rgba(120, 80, 220, 0.04) 10px,
    rgba(120, 80, 220, 0.04) 11px
  );
  pointer-events: none;
}

/* 粒子特效层 */
.cutin-particles {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 1;
}

.rune-cutin-overlay--ally .cutin-particle {
  animation-name: particleLTR;
  animation-timing-function: linear;
  animation-iteration-count: infinite;
}

.rune-cutin-overlay--enemy .cutin-particle {
  animation-name: particleRTL;
  animation-timing-function: linear;
  animation-iteration-count: infinite;
}

.cutin-particle {
  position: absolute;
  /* 基础设为透明 */
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0) 0%,
    rgba(255, 255, 255, 0.8) 50%,
    rgba(255, 255, 255, 0) 100%
  );
  border-radius: 2px;
  filter: blur(1px);
}

@keyframes particleLTR {
  0% {
    transform: translateX(0);
    opacity: 0;
  }
  10% {
    opacity: 0.8;
  }
  90% {
    opacity: 0.8;
  }
  100% {
    transform: translateX(500px);
    opacity: 0;
  }
}

@keyframes particleRTL {
  0% {
    transform: translateX(0);
    opacity: 0;
  }
  10% {
    opacity: 0.8;
  }
  90% {
    opacity: 0.8;
  }
  100% {
    transform: translateX(-500px);
    opacity: 0;
  }
}

/* 中心光晕 */
.cutin-glow {
  position: absolute;
  inset: 0;
  pointer-events: none;
}
.cutin-glow--normal {
  background: radial-gradient(
    ellipse 60% 50% at 50% 50%,
    rgba(156, 163, 175, 0.12) 0%,
    transparent 70%
  );
}
.cutin-glow--rare {
  background: radial-gradient(
    ellipse 70% 55% at 50% 50%,
    rgba(96, 165, 250, 0.18) 0%,
    transparent 70%
  );
}
.cutin-glow--legendary {
  background: radial-gradient(
    ellipse 75% 60% at 50% 50%,
    rgba(245, 200, 66, 0.2) 0%,
    transparent 70%
  );
  animation: legendaryGlow 1.2s ease-in-out infinite alternate;
}

/* 主卡片 */
.cutin-card {
  position: relative;
  background: rgba(12, 4, 30, 0.96);
  border-radius: 14px;
  padding: 18px 22px;
  width: min(88vw, 460px);
  overflow: hidden;
  animation: cutinCardEnter 0.32s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
  border-width: 2px;
  border-style: solid;
  z-index: 10; /* 确保卡片在最上层 */
}
.rune-cutin-overlay--ally .cutin-card {
  border-color: rgba(52, 211, 153, 0.4);
}
.rune-cutin-overlay--enemy .cutin-card {
  border-color: rgba(248, 113, 113, 0.4);
}
.cutin-card--normal {
  /* border: 1px solid rgba(156, 163, 175, 0.35); */
  box-shadow:
    0 0 20px rgba(156, 163, 175, 0.15),
    inset 0 1px 0 rgba(255, 255, 255, 0.04);
}
.cutin-card--rare {
  /* border: 1px solid rgba(96, 165, 250, 0.45); */
  box-shadow:
    0 0 28px rgba(96, 165, 250, 0.25),
    inset 0 1px 0 rgba(96, 165, 250, 0.08);
}
.cutin-card--legendary {
  /* border: 1px solid rgba(245, 200, 66, 0.6); */
  box-shadow:
    0 0 36px rgba(245, 200, 66, 0.3),
    0 0 60px rgba(245, 200, 66, 0.1),
    inset 0 1px 0 rgba(245, 200, 66, 0.1);
}

@keyframes cutinCardEnter {
  0% {
    opacity: 0;
    transform: scale(0.72) translateY(16px);
  }
  65% {
    transform: scale(1.04) translateY(-3px);
  }
  100% {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

/* 卡片内部布局 */
.cutin-card-inner {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  gap: 16px;
}

/* 头像容器 */
.cutin-avatar-wrap {
  flex-shrink: 0;
  width: 76px;
  height: 76px;
  border-radius: 50%;
  border: 3px solid;
  overflow: hidden;
}
.cutin-avatar-wrap--normal {
  border-color: #9ca3af;
  box-shadow: 0 0 16px rgba(156, 163, 175, 0.5);
}
.cutin-avatar-wrap--rare {
  border-color: #60a5fa;
  box-shadow: 0 0 20px rgba(96, 165, 250, 0.65);
}
.cutin-avatar-wrap--legendary {
  border-color: #f5c842;
  box-shadow:
    0 0 24px rgba(245, 200, 66, 0.8),
    0 0 8px rgba(245, 200, 66, 0.5);
  animation: legendaryAvatarPulse 1s ease-in-out infinite alternate;
}
@keyframes legendaryAvatarPulse {
  from {
    box-shadow:
      0 0 20px rgba(245, 200, 66, 0.6),
      0 0 6px rgba(245, 200, 66, 0.4);
  }
  to {
    box-shadow:
      0 0 32px rgba(245, 200, 66, 0.95),
      0 0 12px rgba(245, 200, 66, 0.6);
  }
}

.cutin-avatar {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

/* 信息区 */
.cutin-info {
  flex: 1;
  min-width: 0;
}

.cutin-caster-name {
  font-size: 20px;
  font-weight: 700;
  color: #f0e6ff;
  line-height: 1.2;
  margin-bottom: 6px;
  text-shadow: 0 0 12px rgba(167, 139, 250, 0.7);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.cutin-meta-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 7px;
}

/* 稀有度徽章 */
.cutin-rarity-badge {
  font-size: 11px;
  font-weight: 600;
  padding: 2px 9px;
  border-radius: 10px;
  letter-spacing: 0.5px;
  flex-shrink: 0;
}
.cutin-rarity-badge--normal {
  background: rgba(156, 163, 175, 0.18);
  border: 1px solid rgba(156, 163, 175, 0.4);
  color: #d1d5db;
}
.cutin-rarity-badge--rare {
  background: rgba(96, 165, 250, 0.18);
  border: 1px solid rgba(96, 165, 250, 0.45);
  color: #93c5fd;
}
.cutin-rarity-badge--legendary {
  background: rgba(245, 200, 66, 0.2);
  border: 1px solid rgba(245, 200, 66, 0.55);
  color: #fde68a;
}

/* 等级文字 */
.cutin-level-text {
  font-size: 14px;
  font-weight: 700;
  font-family: 'Courier New', monospace;
}
.cutin-level-text--normal {
  color: #9ca3af;
}
.cutin-level-text--rare {
  color: #60a5fa;
}
.cutin-level-text--legendary {
  color: #f5c842;
  text-shadow: 0 0 8px rgba(245, 200, 66, 0.6);
}

/* 技能效果文字 */
.cutin-skill-effect {
  font-size: 13px;
  color: #c4b5fd;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 3px;
  line-height: 1.4;
}
.cutin-skill-list {
  margin-bottom: 6px;
}
.cutin-skill-list .cutin-skill-effect:last-child {
  margin-bottom: 0;
}
.cutin-skill--attack {
  color: #f87171; /* 浅红色 */
}
.cutin-skill--buff {
  color: #60a5fa; /* 浅蓝色 */
}
.cutin-skill--debuff {
  color: #fb923c; /* 橙色 */
}
.cutin-skill--changeOrder {
  color: #a78bfa; /* 紫色 */
}
.cutin-skill--sanRecover {
  color: #4ade80; /* 绿色 */
}

.cutin-target-row {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 10px;
  min-width: 0;
  flex-wrap: nowrap;
}

.cutin-target-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  min-width: 0;
  flex: 1;
}

.cutin-target-tag {
  display: flex;
  align-items: center;
  gap: 4px;
  min-width: 0;
}

.cutin-target-label {
  font-size: 11px;
  color: #9ca3af;
  flex-shrink: 0;
}

.cutin-target-avatar-wrap {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  overflow: hidden;
  border: 1px solid #ef4444; /* 默认敌方红色 */
  flex-shrink: 0;
}
.cutin-target-avatar-wrap.cutin-target--ally {
  border-color: #4ade80; /* 我方绿色 */
}

.cutin-target-avatar {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.cutin-target-name {
  font-size: 12px;
  color: #fca5a5; /* 默认敌方红肉色 */
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.cutin-target-name.cutin-target--ally {
  color: #86efac; /* 我方浅绿色 */
}

/* 倒计时进度条 */
.cutin-timer-bar {
  width: 100%;
  height: 3px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
  overflow: hidden;
}
.cutin-timer-fill {
  height: 100%;
  border-radius: 2px;
  width: 100%;
  transform-origin: left;
  animation: cutinTimerShrink linear forwards;
}
.cutin-timer-fill--normal {
  background: #9ca3af;
}
.cutin-timer-fill--rare {
  background: linear-gradient(90deg, #3b82f6, #60a5fa);
}
.cutin-timer-fill--legendary {
  background: linear-gradient(90deg, #d97706, #f5c842, #a78bfa);
}
@keyframes cutinTimerShrink {
  from {
    transform: scaleX(1);
  }
  to {
    transform: scaleX(0);
  }
}
</style>

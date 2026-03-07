<template>
  <!-- ==================== 选择素材弹窗 ==================== -->
  <el-dialog
    v-model="materialPickVisible"
    title="🔮 选择素材符文石（将被销毁）"
    align-center
    destroy-on-close
    v-bind="previewLockProps"
  >
    <p class="text-xs text-gray-500 dark:text-gray-400 mb-3">
      仅显示与装备符文石<strong>稀有度相同</strong>、等级 ≤ 冒险家综合等级
      (Lv.{{ comprehensiveLevel }}) 的未装备符文石。
    </p>
    <div v-if="materialLoading" class="flex justify-center py-8">
      <span class="animate-spin inline-block text-2xl">⏳</span>
    </div>
    <div
      v-else-if="materialOptions.length === 0"
      class="text-center py-8 text-gray-400 text-sm"
    >
      暂无可用的素材符文石
    </div>
    <RuneStoneSelectPanel
      v-else
      :rune-stones="materialOptions"
      @select="handleMaterialSelect"
    >
      <template #action="{ runeStone }">
        <el-button
          type="primary"
          size="small"
          :loading="previewLoading"
          :disabled="previewLoading"
          @click.stop="handleMaterialSelect(runeStone)"
        >
          选择
        </el-button>
      </template>
    </RuneStoneSelectPanel>
  </el-dialog>

  <!-- ==================== 预览结果弹窗 ==================== -->
  <el-dialog
    v-model="previewVisible"
    title="🔮 合成预览结果"
    width="360px"
    align-center
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    :show-close="false"
  >
    <div v-if="previewData" class="space-y-3">
      <!-- 等级变化 -->
      <div class="text-center">
        <p class="text-lg font-bold" :class="rarityClass(previewData.rarity)">
          {{ rarityName(previewData.rarity) }}符文石
        </p>
        <p class="text-sm text-gray-400">
          等级
          <span>{{ prevMainLevel }}</span>
          →
          <span
            :class="
              previewData.level > prevMainLevel
                ? 'text-green-500 font-bold'
                : previewData.level < prevMainLevel
                  ? 'text-red-500 font-bold'
                  : ''
            "
            >{{ previewData.level }}</span
          >
          <template v-if="previewData.level !== prevMainLevel">
            <span
              :class="
                previewData.level > prevMainLevel
                  ? 'text-green-500'
                  : 'text-red-500'
              "
            >
              ({{ previewData.level > prevMainLevel ? '↑' : '↓'
              }}{{ Math.abs(previewData.level - prevMainLevel) }})
            </span>
          </template>
        </p>
      </div>

      <!-- 与主石对比 -->
      <div
        v-if="mainRuneStone"
        class="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 space-y-2 text-xs text-gray-500 dark:text-gray-400"
      >
        <p class="font-semibold text-gray-600 dark:text-gray-300 mb-1">
          📊 与主石对比
        </p>

        <!-- 主动技能变化 -->
        <div>
          <p class="font-semibold text-gray-600 dark:text-gray-300 mb-1">
            ⚡ 主动技能变化
          </p>
          <template v-if="synthesisSkillDiff.removed.length">
            <div
              v-for="(s, i) in synthesisSkillDiff.removed"
              :key="'sr' + i"
              class="bg-red-50 dark:bg-red-900/20 rounded px-2 py-1 mb-1"
            >
              <span class="text-red-500 font-bold">- 移除：</span>
              <span class="text-red-400">{{ s.label }}</span>
            </div>
          </template>
          <template v-if="synthesisSkillDiff.added.length">
            <div
              v-for="(s, i) in synthesisSkillDiff.added"
              :key="'sa' + i"
              class="bg-green-50 dark:bg-green-900/20 rounded px-2 py-1 mb-1"
            >
              <span class="text-green-500 font-bold">+ 新增：</span>
              <span class="text-green-400">{{ s.label }}</span>
            </div>
          </template>
          <template v-if="synthesisSkillDiff.kept.length">
            <div
              v-for="(s, i) in synthesisSkillDiff.kept"
              :key="'sk' + i"
              class="rounded px-2 py-1 mb-1"
            >
              <span class="text-gray-400">= 保留：{{ s.label }}</span>
            </div>
          </template>
          <p
            v-if="
              !synthesisSkillDiff.removed.length &&
              !synthesisSkillDiff.added.length &&
              !synthesisSkillDiff.kept.length
            "
            class="text-gray-400"
          >
            无主动技能
          </p>
        </div>

        <!-- 被动增益变化 -->
        <div>
          <p class="font-semibold text-gray-600 dark:text-gray-300 mb-1">
            🔮 被动增益变化
          </p>
          <template v-if="synthesisBuffDiff.removed.length">
            <div
              v-for="(b, i) in synthesisBuffDiff.removed"
              :key="'br' + i"
              class="bg-red-50 dark:bg-red-900/20 rounded px-2 py-1 mb-1"
            >
              <span class="text-red-500 font-bold">- 移除：</span>
              <span class="text-red-400"
                >{{ buffTypeName(b.buffType) }} Lv.{{ b.buffLevel }}</span
              >
            </div>
          </template>
          <template v-if="synthesisBuffDiff.added.length">
            <div
              v-for="(b, i) in synthesisBuffDiff.added"
              :key="'ba' + i"
              class="bg-green-50 dark:bg-green-900/20 rounded px-2 py-1 mb-1"
            >
              <span class="text-green-500 font-bold">+ 新增：</span>
              <span class="text-green-400"
                >{{ buffTypeName(b.buffType) }} Lv.{{ b.buffLevel }}</span
              >
            </div>
          </template>
          <template v-if="synthesisBuffDiff.changed.length">
            <div
              v-for="(c, i) in synthesisBuffDiff.changed"
              :key="'bc' + i"
              class="bg-blue-50 dark:bg-blue-900/20 rounded px-2 py-1 mb-1"
            >
              <span class="text-blue-500 font-bold">~ 变化：</span>
              <span class="text-blue-400"
                >{{ buffTypeName(c.buffType) }} Lv.{{ c.oldLevel }} → Lv.{{
                  c.newLevel
                }}
                <span
                  :class="
                    c.newLevel > c.oldLevel ? 'text-green-500' : 'text-red-500'
                  "
                >
                  ({{ c.newLevel > c.oldLevel ? '↑' : '↓'
                  }}{{ Math.abs(c.newLevel - c.oldLevel) }})
                </span>
              </span>
            </div>
          </template>
          <template v-if="synthesisBuffDiff.kept.length">
            <div
              v-for="(b, i) in synthesisBuffDiff.kept"
              :key="'bk' + i"
              class="rounded px-2 py-1 mb-1"
            >
              <span class="text-gray-400"
                >= 保留：{{ buffTypeName(b.buffType) }} Lv.{{
                  b.buffLevel
                }}</span
              >
            </div>
          </template>
          <p
            v-if="
              !synthesisBuffDiff.removed.length &&
              !synthesisBuffDiff.added.length &&
              !synthesisBuffDiff.changed.length &&
              !synthesisBuffDiff.kept.length
            "
            class="text-gray-400"
          >
            无被动增益
          </p>
        </div>
      </div>

      <!-- 合成后符文石完整信息 -->
      <RuneStoneInfoCard :rune-stone="previewData" />

      <p class="text-sm text-red-500 font-bold text-center">
        ⚠️ 素材符文石已被销毁，此操作不可撤销
      </p>
      <p class="text-xs text-center text-gray-400">
        倒计时：<span class="text-yellow-500">{{ countdown }}</span> 秒
      </p>

      <div class="flex gap-3 pt-1">
        <el-button
          type="danger"
          class="flex-1"
          :loading="confirmLoading"
          :disabled="confirmLoading"
          @click="handleConfirm(false)"
        >
          放弃
        </el-button>
        <el-button
          type="primary"
          class="flex-1"
          :loading="confirmLoading"
          :disabled="confirmLoading"
          @click="handleConfirm(true)"
        >
          接受合成
        </el-button>
      </div>
    </div>
  </el-dialog>
</template>

<script setup>
import { ref, computed, onUnmounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  getMyRuneStonesApi,
  previewSynthesisApi,
  confirmSynthesisApi
} from '@/api/game/runeStone.js'
import { getAdventurerDetailApi } from '@/api/game/adventurer.js'
import { runeStoneActiveSkillDataBase } from 'shared/utils/gameDatabase.js'
import RuneStoneSelectPanel from '@/components/RuneStoneSelectPanel.vue'
import RuneStoneInfoCard from '@/components/RuneStoneInfoCard.vue'
import { useDialogRoute } from '@/composables/useDialogRoute.js'
import { useDialogLock } from '@/composables/useDialogLock.js'

const props = defineProps({
  /** 冒险家 ID，合成完成后用于刷新冒险家数据 */
  adventurerId: { type: String, required: true }
})

const emit = defineEmits(['updated'])

// ── 内部状态 ──
const { visible: materialPickVisible } = useDialogRoute('rsMaterial')
const materialLoading = ref(false)
const materialOptions = ref([])

const previewVisible = ref(false)
const previewLoading = ref(false)
const { dialogLockProps: previewLockProps } = useDialogLock(
  () => previewLoading.value
)
const previewData = ref(null)
const previewToken = ref('')
const confirmLoading = ref(false)
const countdown = ref(0)
const prevMainLevel = ref(0)

// 当前打开时传入的主符文石信息（响应式，供 computed 使用）
const mainRuneStone = ref(null)
let _decodedExp = 0
let _countdownTimer = null

// 响应式综合等级（用于模板显示）
const comprehensiveLevel = ref(1)

// ── 对外暴露 ──
/**
 * 打开合成流程
 * @param {object} mainRuneStone - 主符文石对象（已装备）
 * @param {number} compLevel - 冒险家综合等级
 */
async function open(mainRuneStone_arg, compLevel) {
  mainRuneStone.value = mainRuneStone_arg
  comprehensiveLevel.value = compLevel
  materialOptions.value = []
  materialLoading.value = true
  materialPickVisible.value = true
  try {
    const res = await getMyRuneStonesApi({
      equipped: 'false',
      rarity: mainRuneStone_arg.rarity,
      sort: 'level_desc',
      pageSize: 1000
    })
    materialOptions.value = (res.data.data?.list || []).filter(
      rs =>
        rs.level <= compLevel &&
        !rs.listedOnMarket &&
        rs._id !== mainRuneStone_arg._id
    )
  } catch {
    materialOptions.value = []
  } finally {
    materialLoading.value = false
  }
}

defineExpose({ open })

// ── 稀有度工具 ──

function rarityName(r) {
  return { normal: '普通', rare: '稀有', legendary: '传说' }[r] || r
}
function rarityClass(r) {
  return (
    {
      normal: 'text-gray-600 dark:text-gray-300',
      rare: 'text-blue-500',
      legendary: 'text-yellow-500'
    }[r] || ''
  )
}

// ── 技能 / 增益辅助 ──
const allSkillsMap = computed(() => {
  const map = new Map()
  for (const s of runeStoneActiveSkillDataBase()) {
    map.set(s.value, s)
  }
  return map
})

function getSkillInfo(skillId) {
  return allSkillsMap.value.get(skillId) || null
}

function buffTypeName(t) {
  return (
    { attack: '攻击', defense: '防御', speed: '速度', san: 'SAN值' }[t] || t
  )
}

// ── 合成对比：主动技能差异 ──
const synthesisSkillDiff = computed(() => {
  const result = { removed: [], added: [], kept: [] }
  if (!mainRuneStone.value || !previewData.value) return result

  const oldSkills = (mainRuneStone.value.activeSkills || []).map(
    s => s.skillId || s
  )
  const newSkills = (previewData.value.activeSkills || []).map(
    s => s.skillId || s
  )

  const oldMap = new Map()
  for (const id of oldSkills) oldMap.set(id, (oldMap.get(id) || 0) + 1)
  const newMap = new Map()
  for (const id of newSkills) newMap.set(id, (newMap.get(id) || 0) + 1)

  const allIds = new Set([...oldMap.keys(), ...newMap.keys()])
  for (const id of allIds) {
    const oldCount = oldMap.get(id) || 0
    const newCount = newMap.get(id) || 0
    const info = getSkillInfo(id)
    const label = info ? info.label : id
    const shared = Math.min(oldCount, newCount)
    for (let i = 0; i < shared; i++) result.kept.push({ skillId: id, label })
    for (let i = 0; i < oldCount - shared; i++)
      result.removed.push({ skillId: id, label })
    for (let i = 0; i < newCount - shared; i++)
      result.added.push({ skillId: id, label })
  }
  return result
})

// ── 合成对比：被动增益差异 ──
const synthesisBuffDiff = computed(() => {
  const result = { removed: [], added: [], changed: [], kept: [] }
  if (!mainRuneStone.value || !previewData.value) return result

  const oldBuffs = mainRuneStone.value.passiveBuffs || []
  const newBuffs = previewData.value.passiveBuffs || []

  const oldByType = new Map()
  for (const b of oldBuffs) oldByType.set(b.buffType, b)
  const newByType = new Map()
  for (const b of newBuffs) newByType.set(b.buffType, b)

  const allTypes = new Set([...oldByType.keys(), ...newByType.keys()])
  for (const type of allTypes) {
    const oldBuff = oldByType.get(type)
    const newBuff = newByType.get(type)
    if (oldBuff && !newBuff) {
      result.removed.push(oldBuff)
    } else if (!oldBuff && newBuff) {
      result.added.push(newBuff)
    } else if (oldBuff && newBuff) {
      if (oldBuff.buffLevel !== newBuff.buffLevel) {
        result.changed.push({
          buffType: type,
          oldLevel: oldBuff.buffLevel,
          newLevel: newBuff.buffLevel
        })
      } else {
        result.kept.push(oldBuff)
      }
    }
  }
  return result
})

// ── JWT 解码 ──
function decodeJwt(token) {
  try {
    const base64Url = token.split('.')[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const json = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )
    return JSON.parse(json)
  } catch {
    return null
  }
}

// ── 倒计时 ──
function startCountdown(exp) {
  _decodedExp = exp
  clearInterval(_countdownTimer)
  const tick = () => {
    const diff = _decodedExp - Math.floor(Date.now() / 1000)
    if (diff > 0) {
      countdown.value = diff
    } else {
      countdown.value = 0
      clearInterval(_countdownTimer)
      previewVisible.value = false
      ElMessage.warning('合成预览已超时，素材已被销毁')
      reloadAdventurer()
    }
  }
  tick()
  _countdownTimer = setInterval(tick, 1000)
}

async function reloadAdventurer() {
  try {
    const res = await getAdventurerDetailApi(props.adventurerId)
    emit('updated', res.data.data)
  } catch {
    // ignore
  }
}

// ── 选择素材后预览合成 ──
async function handleMaterialSelect(material) {
  if (!mainRuneStone.value || previewLoading.value) return
  try {
    await ElMessageBox.confirm(
      '此操作将立刻销毁素材符文石，是否确认合成？',
      '确认合成',
      { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' }
    )
  } catch {
    return
  }
  previewLoading.value = true
  try {
    const res = await previewSynthesisApi({
      mainRuneStoneId: mainRuneStone.value._id,
      materialRuneStoneId: material._id
    })
    const data = res.data.data
    previewToken.value = data.previewToken
    const decoded = decodeJwt(data.previewToken)
    previewData.value = decoded ? decoded.preview : data.preview
    prevMainLevel.value = mainRuneStone.value.level
    materialPickVisible.value = false
    previewVisible.value = true
    if (decoded?.exp) {
      startCountdown(decoded.exp)
    }
  } catch {
    // 错误已由拦截器处理
  } finally {
    previewLoading.value = false
  }
}

// ── 确认或放弃合成 ──
async function handleConfirm(accept) {
  const label = accept ? '接受合成' : '放弃合成'
  const msg = accept
    ? '确定接受合成结果，覆盖主符文石属性？'
    : '确定放弃本次合成？主符文石将保持原状。'
  try {
    await ElMessageBox.confirm(msg, label, {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
  } catch {
    return
  }
  confirmLoading.value = true
  try {
    await confirmSynthesisApi({ previewToken: previewToken.value, accept })
    ElMessage.success(accept ? '合成成功！' : '已放弃合成')
    clearInterval(_countdownTimer)
    previewVisible.value = false
    await reloadAdventurer()
  } catch {
    // 错误已由拦截器处理
  } finally {
    confirmLoading.value = false
  }
}

onUnmounted(() => {
  clearInterval(_countdownTimer)
})
</script>

<template>
  <el-dialog
    v-model="dialogVisible"
    title="机器人详情"
    width="720px"
    destroy-on-close
    append-to-body
    align-center
  >
    <div v-if="detailLoading" v-loading="true" style="min-height: 200px"></div>
    <template v-else-if="detailData">
      <el-descriptions :column="2" border size="small" class="mb-4">
        <el-descriptions-item label="公会名">
          {{ detailData.playerInfo?.guildName || '—' }}
        </el-descriptions-item>
        <el-descriptions-item label="阵容倾向">
          {{
            tendencyMap[detailData.bot?.formationTendency || 'balanced'] || '—'
          }}
        </el-descriptions-item>
        <el-descriptions-item label="公会等级">
          Lv.{{ detailData.playerInfo?.guildLevel || 1 }}
        </el-descriptions-item>
        <el-descriptions-item label="金币">
          {{ formatNumberWithCommas(detailData.playerInfo?.gold || 0) }}
        </el-descriptions-item>
        <el-descriptions-item label="冒险家数量">
          {{ detailData.playerInfo?.adventurerCount || 0 }}
        </el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag
            :type="detailData.bot?.isActive ? 'success' : 'info'"
            size="small"
          >
            {{ detailData.bot?.isActive ? '活跃' : '停用' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="累计行动">
          {{ formatNumberWithCommas(detailData.bot?.totalActions || 0) }}
        </el-descriptions-item>
        <el-descriptions-item label="上次行动">
          {{
            detailData.bot?.lastTickAt
              ? formatDate(detailData.bot.lastTickAt)
              : '—'
          }}
        </el-descriptions-item>
      </el-descriptions>

      <h4 class="mb-2">库存</h4>
      <el-descriptions :column="3" border size="small" class="mb-4">
        <el-descriptions-item label="攻击水晶">
          {{ formatNumberWithCommas(detailData.inventory?.attackCrystal || 0) }}
        </el-descriptions-item>
        <el-descriptions-item label="防御水晶">
          {{
            formatNumberWithCommas(detailData.inventory?.defenseCrystal || 0)
          }}
        </el-descriptions-item>
        <el-descriptions-item label="速度水晶">
          {{ formatNumberWithCommas(detailData.inventory?.speedCrystal || 0) }}
        </el-descriptions-item>
        <el-descriptions-item label="SAN水晶">
          {{ formatNumberWithCommas(detailData.inventory?.sanCrystal || 0) }}
        </el-descriptions-item>
        <el-descriptions-item label="符文碎片">
          {{ formatNumberWithCommas(detailData.inventory?.runeFragment || 0) }}
        </el-descriptions-item>
      </el-descriptions>

      <el-divider />
      <h4 class="mb-2">阵容</h4>
      <p class="text-xs text-gray-400 mb-3">
        ↑ 前排（面向敌人） · ↓ 后排 · 点击头像查看冒险家详情
      </p>
      <div v-if="formationBoards.length" class="grid grid-cols-1 gap-4 mb-4">
        <div
          v-for="formation in formationBoards"
          :key="formation._id || formation.slot"
          class="rounded-xl border border-amber-200 dark:border-amber-900/60 bg-linear-to-br from-amber-50 to-white dark:from-gray-900 dark:to-gray-800 p-3"
        >
          <div class="flex items-start justify-between gap-3 mb-3">
            <div class="min-w-0">
              <p
                class="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate"
              >
                槽{{ formation.slot }} ·
                {{ formation.name || `阵容${formation.slot}` }}
              </p>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                已放置 {{ formation.memberCount }} 名冒险家
              </p>
            </div>
            <el-tag type="warning" effect="plain" size="small">棋盘预览</el-tag>
          </div>

          <div class="flex justify-center w-full overflow-hidden">
            <FormationPreviewGrid :grid="formation.displayGrid" />
          </div>
        </div>
      </div>
      <el-empty v-else description="暂无已配置阵容" :image-size="60" />

      <el-divider />
      <h4 class="mb-2">最近行动</h4>
      <template v-if="detailData.bot?.lastActions?.length">
        <ResponsiveTable :data="paginatedActions" stripe size="small">
          <ResponsiveTableColumn label="行动" min-width="100">
            <template #default="{ row }">
              {{ actionNameMap[row.action] || row.action }}
            </template>
          </ResponsiveTableColumn>
          <ResponsiveTableColumn label="详情" min-width="200">
            <template #default="{ row }">
              {{ formatActionDetail(row.detail) }}
            </template>
          </ResponsiveTableColumn>
          <ResponsiveTableColumn label="时间" min-width="160">
            <template #default="{ row }">
              {{ row.timestamp ? formatDate(row.timestamp) : '—' }}
            </template>
          </ResponsiveTableColumn>
        </ResponsiveTable>
        <div class="flex justify-end mt-4">
          <el-pagination
            v-model:current-page="actionPagination.page"
            v-model:page-size="actionPagination.pageSize"
            :total="detailData.bot.lastActions.length"
            :page-sizes="[10, 20, 50]"
            layout="total, sizes, prev, pager, next"
            background
            size="small"
          />
        </div>
      </template>
      <el-empty v-else description="暂无行动记录" :image-size="60" />
    </template>
  </el-dialog>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import FormationPreviewGrid from '@/components/FormationPreviewGrid.vue'
import { getBotDetailApi } from '@/api/admin/bot.js'
import { formatDate, formatNumberWithCommas } from '@shared'
import { ROLE_TAG_MAP } from 'shared/constants/index.js'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  botId: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['update:modelValue'])

const dialogVisible = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value)
})

const tendencyMap = {
  balanced: '均衡型',
  aggressive: '攻击型',
  defensive: '防御型',
  assassin: '刺客型'
}

const actionNameMap = {
  idle: '发呆',
  settleCrystals: '结算水晶',
  claimMails: '领取邮件',
  formationManage: '阵容管理',
  recruitAdventurer: '招募冒险家',
  levelUpStats: '升级属性',
  guildUpgrade: '公会升级',
  dungeonBattle: '地牢战斗',
  switchDungeon: '切换地牢',
  arena: '竞技场',
  mineExplore: '矿场探索',
  runeStoneManage: '符文石管理',
  marketTrade: '市场交易'
}

const roleMap = {
  tank: `${ROLE_TAG_MAP[2].emoji} ${ROLE_TAG_MAP[2].label}`,
  dps: `${ROLE_TAG_MAP[1].emoji} ${ROLE_TAG_MAP[1].label}`,
  assassin: `${ROLE_TAG_MAP[3].emoji} ${ROLE_TAG_MAP[3].label}`,
  balanced: `${ROLE_TAG_MAP[4].emoji} ${ROLE_TAG_MAP[4].label}`
}

const legacyDetailLabelMap = {
  attackCrystal: '攻击水晶',
  defenseCrystal: '防御水晶',
  speedCrystal: '速度水晶',
  sanCrystal: 'SAN水晶'
}

const detailLoading = ref(false)
const detailData = ref(null)
const actionPagination = reactive({ page: 1, pageSize: 10 })

const paginatedActions = computed(() => {
  const actions = detailData.value?.bot?.lastActions || []
  const start = (actionPagination.page - 1) * actionPagination.pageSize
  const sortedActions = [...actions].sort((left, right) => {
    const leftTime = left?.timestamp ? new Date(left.timestamp).getTime() : 0
    const rightTime = right?.timestamp ? new Date(right.timestamp).getTime() : 0
    return rightTime - leftTime
  })
  return sortedActions.slice(start, start + actionPagination.pageSize)
})

const formationBoards = computed(() => {
  const formations = detailData.value?.formations || []
  const roles = detailData.value?.bot?.adventurerRoles || {}
  const adventurerMap = new Map(
    (detailData.value?.adventurers || []).map(adv => {
      const advId = String(adv._id)
      const role = roles[advId] || ''
      return [
        advId,
        {
          ...adv,
          botRole: role,
          botRoleLabel: roleMap[role] || ''
        }
      ]
    })
  )

  return formations
    .map(formation => {
      const displayGrid = Array.from({ length: 5 }, (_, rowIndex) =>
        Array.from({ length: 5 }, (_, colIndex) => {
          const cell = formation.grid?.[rowIndex]?.[colIndex]
          if (!cell) return null

          if (typeof cell === 'object' && !Array.isArray(cell)) {
            const cellId = String(cell._id || cell.id || '')
            return (
              adventurerMap.get(cellId) || {
                ...cell,
                botRole: roles[cellId] || '',
                botRoleLabel: roleMap[roles[cellId]] || ''
              }
            )
          }

          return adventurerMap.get(String(cell)) || null
        })
      )
      const memberCount = displayGrid.flat().filter(Boolean).length

      return {
        ...formation,
        displayGrid,
        memberCount
      }
    })
    .filter(formation => formation.memberCount > 0)
})

watch(
  () => [props.modelValue, props.botId],
  async ([visible, botId]) => {
    if (!visible || !botId) return
    actionPagination.page = 1
    await loadDetail(botId)
  },
  { immediate: true }
)

async function loadDetail(botId) {
  detailLoading.value = true
  try {
    const res = await getBotDetailApi(botId)
    detailData.value = res.data.data
  } catch (err) {
    ElMessage.error({
      message: err?.response?.data?.message || '获取详情失败',
      showClose: true
    })
    dialogVisible.value = false
  } finally {
    detailLoading.value = false
  }
}

function formatActionDetail(detail) {
  if (!detail) return '—'

  let formatted = detail
  for (const [rawLabel, localizedLabel] of Object.entries(
    legacyDetailLabelMap
  )) {
    formatted = formatted.replaceAll(rawLabel, localizedLabel)
  }

  return formatted
    .replace(/\bnormal\b/g, '普通')
    .replace(/\brare\b/g, '稀有')
    .replace(/\blegendary\b/g, '传说')
    .replace(/Lv\.(\d+)\((\d+),(\d+)\)/g, 'Lv.$1矿格')
    .replace(/@(?=\d+)/g, '，单价')
    .replace(/→/g, '，')
}
</script>

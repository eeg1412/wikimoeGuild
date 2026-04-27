<template>
  <div class="w-full py-6" style="min-height: 60vh">
    <!-- 页面标题 -->
    <div class="mb-6 text-center">
      <h1 class="rpg-title text-2xl font-bold text-gray-800 dark:text-gray-100">
        <PixelIcon name="attack" /> 冒险家公会
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
        <PixelIcon name="gold" /> {{ formatNumberWithCommas(playerInfo?.gold ?? 0) }} 金币
      </p>
      <el-button
        type="warning"
        round
        :loading="recruiting"
        :disabled="recruiting || adventurers.length >= maxAdventurerCap"
        @click="handleRecruit"
      >
        <PixelIcon name="gold" /> 招募冒险家（{{
          formatNumberWithCommas(gameSettings.adventurerRecruitPrice ?? 10000)
        }}
        金币）
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
        <PixelIcon :name="tag.emoji" :size="16" /> {{ tag.label }}
      </el-button>
      <el-button
        :type="filterTag === 'none' ? 'primary' : 'default'"
        size="small"
        @click="handleFilterTag('none')"
      >
        <PixelIcon name="tag" /> 未设定
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
          <PixelIcon name="rune" /> 批量装备符文石 ({{ selectedIds.size }})
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
          <PixelIcon name="notice" /> 批量升级+10
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
          <PixelIcon name="notice" /> 批量降级-10
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
        @click="handleOpenFormationUpgradeMax"
        @command="handleOpenFormationUpgrade"
      >
        <PixelIcon name="notice" /> 按阵容升到最高等级
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item :command="10">+10级</el-dropdown-item>
            <el-dropdown-item :command="5">+5级</el-dropdown-item>
            <el-dropdown-item :command="1">+1级</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="flex justify-center py-12">
      <span class="animate-spin inline-block text-4xl"><PixelIcon name="timer" /></span>
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
                <PixelIcon :name="ROLE_TAG_MAP[adv.roleTag].emoji" :size="14" />
                {{ ROLE_TAG_MAP[adv.roleTag].label }}
              </template>
              <template v-else><PixelIcon name="tag" /> 未设定</template>
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
                <PixelIcon :name="tag.emoji" :size="18" />
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
          <PixelIcon name="attack" />
          {{
            formatNumberWithUnits(
              calculateCombatPower(adv, adv.runeStone || null)
            )
          }}
        </p>

        <!-- 装备状态标签 -->
        <div
          v-if="adv.runeStone"
          class="mt-1 text-xs px-1.5 py-0.5 rounded-full border cursor-pointer hover:opacity-80 text-center w-full"
          :class="runeStoneCardClass(adv.runeStone.rarity)"
          @click.stop="handleShowRuneStoneManage(adv)"
        >
          <PixelIcon name="rune" /> {{ rarityName(adv.runeStone.rarity) }} Lv.{{ adv.runeStone.level }}
        </div>

        <!-- 属性升降级按钮 -->
        <el-button
          type="warning"
          size="small"
          class="mt-1 w-full"
          style="font-size: 12px"
          @click.stop="handleOpenStatUpgrade(adv)"
        >
          <PixelIcon name="notice" /> 升降级
        </el-button>
      </div>

      <!-- 快捷入口 -->
      <div class="col-span-full text-center mt-4 mb-2">
        <el-button type="primary" text size="small" @click="goToFormation">
          <PixelIcon name="notice" /> 前往阵容配置
        </el-button>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-else class="text-center py-16 text-gray-400 dark:text-gray-600">
      <span class="text-5xl mb-3 block"><PixelIcon name="attack" /></span>
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
      append-to-body
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
      :title="batchReportDialogTitle"
      width="90%"
      style="max-width: 700px"
      align-center
      destroy-on-close
      class="game-dialog"
      v-bind="batchRatioLockProps"
      append-to-body
    >
      <div class="relative">
        <div
          v-if="batchReportData.length"
          class="text-sm"
          :class="{
            'pointer-events-none select-none opacity-60': batchRatioLoading
          }"
        >
          <!-- 总览 -->
          <div
            class="mb-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg text-center"
          >
            <p>
              共 <b>{{ batchReportData.length }}</b> 名冒险家，
              <span class="text-green-500"
                >{{
                  batchReportData.filter(i => !i.error).length
                }}
                名可操作</span
              >
              <span
                v-if="batchReportData.some(i => i.error)"
                class="text-red-400 ml-1"
              >
                {{ batchReportData.filter(i => i.error).length }} 名将被跳过
              </span>
              <template
                v-if="batchReportMode === BATCH_REPORT_MODE_FORMATION_MAX"
              >
                ，按低等级优先自动升级到当前资源可达最高等级
              </template>
              <template v-else>
                ，每人 {{ batchReportDirection === 'up' ? '+' : '-'
                }}{{ batchReportTotalPerAdv }} 级
              </template>
            </p>
            <p class="mt-1">
              <PixelIcon name="gold" /> 总金币:
              <span class="text-yellow-500 font-bold">{{
                formatNumberWithCommas(batchReportTotalGold)
              }}</span>
              <span class="text-xs text-gray-400 ml-1">
                (当前:
                {{ formatNumberWithCommas(playerInfo?.gold ?? 0) }})
              </span>
              <span
                v-if="batchReportDirection === 'down'"
                class="text-xs text-gray-400 ml-1"
              >
                ({{
                  formatNumberWithCommas(
                    gameSettings?.adventurerLevelDownGoldPrice ?? 1000
                  )
                }}<PixelIcon name="gold" />/级)
              </span>
            </p>
            <p v-if="batchReportDirection === 'up'" class="mt-1 space-x-2">
              <span
                ><PixelIcon name="attack" /> 攻击水晶:
                {{
                  formatNumberWithCommas(batchReportTotalCrystals.attackCrystal)
                }}</span
              >
              <span
                ><PixelIcon name="defense" /> 防御水晶:
                {{
                  formatNumberWithCommas(
                    batchReportTotalCrystals.defenseCrystal
                  )
                }}</span
              >
              <span
                ><PixelIcon name="speed" /> 速度水晶:
                {{
                  formatNumberWithCommas(batchReportTotalCrystals.speedCrystal)
                }}</span
              >
              <span
                ><PixelIcon name="san" /> SAN水晶:
                {{
                  formatNumberWithCommas(batchReportTotalCrystals.sanCrystal)
                }}</span
              >
            </p>
            <!-- 自动升级公会等级提示 -->
            <p
              v-if="
                batchReportDirection === 'up' && batchReportGuildUpgradeInfo
              "
              class="mt-2 text-green-500 text-xs"
            >
              <PixelIcon name="dungeon" /> 满足公会升级条件，升级时将自动升级公会等级至 Lv.{{
                batchReportGuildUpgradeInfo.targetGuildLevel
              }}（额外消耗
              {{
                formatNumberWithCommas(
                  batchReportGuildUpgradeInfo.totalGuildFee
                )
              }}
              金币）
            </p>
          </div>

          <!-- 每个冒险家详情 -->
          <div class="overflow-y-auto space-y-2 batch-report-list">
            <div
              v-for="item in batchReportData"
              :key="item.adventurerId"
              class="p-2 border rounded-lg dark:border-gray-600 flex gap-2 items-start"
              :class="{ 'opacity-50': item.error }"
            >
              <!-- 冒险家头像 -->
              <div class="shrink-0">
                <GameAdventurerAvatar
                  :adventurer="item.adventurerObj"
                  class="w-10 h-10 rounded-full object-cover border-2"
                  :style="{
                    borderColor: getElementColor(item.adventurerObj?.elements)
                  }"
                />
              </div>
              <!-- 信息区 -->
              <div class="flex-1 min-w-0">
                <p class="font-medium truncate">{{ item.name }}</p>
                <div class="grid grid-cols-2 sm:grid-cols-4 gap-1 text-xs mt-1">
                  <span
                    ><PixelIcon name="attack" /> Lv.{{ item.currentLevels.attack }} → Lv.{{
                      item.newLevels.attack
                    }}</span
                  >
                  <span
                    ><PixelIcon name="defense" /> Lv.{{ item.currentLevels.defense }} → Lv.{{
                      item.newLevels.defense
                    }}</span
                  >
                  <span
                    ><PixelIcon name="speed" /> Lv.{{ item.currentLevels.speed }} → Lv.{{
                      item.newLevels.speed
                    }}</span
                  >
                  <span
                    ><PixelIcon name="san" /> Lv.{{ item.currentLevels.san }} → Lv.{{
                      item.newLevels.san
                    }}</span
                  >
                </div>
                <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  综合 {{ item.currentLevels.comprehensive }} →
                  {{ item.newLevels.comprehensive }} | 金币:
                  {{ formatNumberWithCommas(item.goldCost) }}
                  <template v-if="batchReportDirection === 'up'">
                    | 水晶: 攻{{
                      formatNumberWithCommas(item.crystalCost.attack)
                    }}
                    防{{
                      formatNumberWithCommas(item.crystalCost.defense)
                    }}
                    速{{ formatNumberWithCommas(item.crystalCost.speed) }} SAN{{
                      formatNumberWithCommas(item.crystalCost.san)
                    }}
                  </template>
                </p>
                <p v-if="item.error" class="text-xs text-red-500 mt-1">
                  <PixelIcon name="warning" /> {{ item.error }}
                </p>
                <p
                  v-else-if="item.warning"
                  class="text-xs text-orange-500 dark:text-orange-400 mt-1"
                >
                  <PixelIcon name="warning" /> {{ item.warning }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div
          v-if="batchRatioLoading"
          class="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 rounded-lg bg-white/72 dark:bg-black/55 backdrop-blur-[1px]"
        >
          <div
            class="h-8 w-8 rounded-full border-2 border-yellow-500 border-t-transparent animate-spin"
          />
          <p class="text-sm font-medium text-gray-700 dark:text-gray-200">
            正在处理升级，请稍候...
          </p>
        </div>
      </div>
      <template #footer>
        <el-button
          :disabled="batchRatioLoading"
          @click="batchReportVisible = false"
        >
          取消
        </el-button>
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

    <!-- ==================== 批量升降级结果报表弹窗 ==================== -->
    <el-dialog
      v-model="batchResultVisible"
      :title="batchResultDialogTitle"
      width="90%"
      style="max-width: 700px"
      align-center
      destroy-on-close
      class="game-dialog"
      append-to-body
    >
      <div v-if="batchResultData" class="text-sm">
        <!-- 结果总览 -->
        <div
          class="mb-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg text-center"
        >
          <p class="text-lg font-bold text-green-500 mb-1">
            {{ batchResultDirection === 'up' ? 'success 升级完成' : 'notice 降级完成' }}
          </p>
          <p>
            <span class="text-green-500 font-bold"
              >{{ batchResultData.successList.length }} 名成功</span
            >
            <span
              v-if="batchResultData.skippedList.length > 0"
              class="text-red-400 ml-2"
            >
              {{ batchResultData.skippedList.length }} 名被跳过
            </span>
          </p>
          <p class="mt-1">
            <PixelIcon name="gold" /> 消耗金币:
            <span class="text-yellow-500 font-bold">{{
              formatNumberWithCommas(batchResultData.totalGoldSpent)
            }}</span>
            <span class="text-xs text-gray-400 ml-1">
              (剩余:
              {{ formatNumberWithCommas(batchResultData.remainingGold) }})
            </span>
          </p>
          <p v-if="batchResultDirection === 'up'" class="mt-1 space-x-2">
            <span
              ><PixelIcon name="attack" /> 消耗攻击水晶:
              {{
                formatNumberWithCommas(
                  batchResultData.totalCrystalsSpent.attackCrystal
                )
              }}</span
            >
            <span
              ><PixelIcon name="defense" /> 防御水晶:
              {{
                formatNumberWithCommas(
                  batchResultData.totalCrystalsSpent.defenseCrystal
                )
              }}</span
            >
            <span
              ><PixelIcon name="speed" /> 速度水晶:
              {{
                formatNumberWithCommas(
                  batchResultData.totalCrystalsSpent.speedCrystal
                )
              }}</span
            >
            <span
              ><PixelIcon name="san" /> SAN水晶:
              {{
                formatNumberWithCommas(
                  batchResultData.totalCrystalsSpent.sanCrystal
                )
              }}</span
            >
          </p>
          <p
            v-if="batchResultDirection === 'up'"
            class="mt-1 text-xs text-gray-400 space-x-2"
          >
            <span
              >剩余: <PixelIcon name="attack" />{{
                formatNumberWithCommas(
                  batchResultData.remainingCrystals.attackCrystal
                )
              }}</span
            >
            <span
              ><PixelIcon name="defense" />{{
                formatNumberWithCommas(
                  batchResultData.remainingCrystals.defenseCrystal
                )
              }}</span
            >
            <span
              ><PixelIcon name="speed" />{{
                formatNumberWithCommas(
                  batchResultData.remainingCrystals.speedCrystal
                )
              }}</span
            >
            <span
              ><PixelIcon name="san" />{{
                formatNumberWithCommas(
                  batchResultData.remainingCrystals.sanCrystal
                )
              }}</span
            >
          </p>
          <!-- 公会升级结果 -->
          <p
            v-if="batchResultData.guildUpgraded"
            class="mt-2 text-green-500 font-bold"
          >
            <PixelIcon name="dungeon" /> 公会等级已升级至 Lv.{{ batchResultData.newGuildLevel }}！
          </p>
        </div>

        <!-- 每个冒险家升级结果 -->
        <div class="overflow-y-auto space-y-2 batch-report-list">
          <div
            v-for="item in batchResultData.successList"
            :key="item.adventurerId"
            class="p-2 border rounded-lg flex gap-2 items-start border-green-300 dark:border-green-700"
          >
            <!-- 冒险家头像 -->
            <div class="shrink-0">
              <GameAdventurerAvatar
                :adventurer="item.adventurerObj"
                class="w-10 h-10 rounded-full object-cover border-2"
                :style="{
                  borderColor: getElementColor(item.adventurerObj?.elements)
                }"
              />
            </div>
            <!-- 信息区 -->
            <div class="flex-1 min-w-0">
              <p class="font-medium truncate">
                {{ item.adventurerName }}
                <span class="text-green-500 text-xs ml-1"><PixelIcon name="check" /> 成功</span>
              </p>
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-1 text-xs mt-1">
                <span
                  ><PixelIcon name="attack" /> Lv.{{ item.oldLevels.attack }} → Lv.{{
                    item.newLevels.attackLevel
                  }}</span
                >
                <span
                  ><PixelIcon name="defense" /> Lv.{{ item.oldLevels.defense }} → Lv.{{
                    item.newLevels.defenseLevel
                  }}</span
                >
                <span
                  ><PixelIcon name="speed" /> Lv.{{ item.oldLevels.speed }} → Lv.{{
                    item.newLevels.speedLevel
                  }}</span
                >
                <span
                  ><PixelIcon name="san" /> Lv.{{ item.oldLevels.san }} → Lv.{{
                    item.newLevels.SANLevel
                  }}</span
                >
              </div>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                综合 {{ item.oldLevels.comprehensive }} →
                {{ item.newLevels.comprehensiveLevel }}
                <span class="text-green-500 ml-1">
                  (+{{
                    item.newLevels.comprehensiveLevel -
                    item.oldLevels.comprehensive
                  }}
                  级)
                </span>
              </p>
              <p
                v-if="item.warning"
                class="text-xs text-orange-500 dark:text-orange-400 mt-1"
              >
                <PixelIcon name="warning" /> {{ item.warning }}
              </p>
            </div>
          </div>
          <!-- 跳过的冒险家 -->
          <div
            v-for="item in batchResultData.skippedList"
            :key="'skip-' + item.adventurerId"
            class="p-2 border rounded-lg dark:border-gray-600 flex gap-2 items-start opacity-50"
          >
            <div class="shrink-0">
              <GameAdventurerAvatar
                :adventurer="item.adventurerObj"
                class="w-10 h-10 rounded-full object-cover border-2 border-gray-400"
              />
            </div>
            <div class="flex-1 min-w-0">
              <p class="font-medium truncate">
                {{ item.adventurerName }}
                <span class="text-red-400 text-xs ml-1"><PixelIcon name="warning" /> 跳过</span>
              </p>
              <p class="text-xs text-red-400 mt-1">
                {{ item.skipReason }}
              </p>
            </div>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button type="primary" @click="batchResultVisible = false">
          关闭
        </el-button>
      </template>
    </el-dialog>

    <!-- ==================== 按阵容升级弹窗 ==================== -->
    <el-dialog
      v-model="formationSelectVisible"
      :title="formationUpgradeDialogTitle"
      width="90%"
      style="max-width: 600px"
      align-center
      destroy-on-close
      class="game-dialog"
      v-bind="formationUpgradeLockProps"
      append-to-body
    >
      <!-- 阵容选择 -->
      <div v-if="!formationSelectedId" class="space-y-3">
        <p class="text-sm text-gray-500 dark:text-gray-400 text-center">
          {{ formationUpgradeDescription }}
        </p>
        <div v-if="formationListLoading" class="flex justify-center py-6">
          <span class="animate-spin inline-block text-2xl"><PixelIcon name="timer" /></span>
        </div>
        <div v-else class="space-y-2">
          <!-- 竞技场阵容 -->
          <div
            v-if="arenaFormationOption"
            class="rpg-card rounded-xl p-3 cursor-pointer hover:border-yellow-400 transition-colors border border-gray-300 dark:border-gray-600"
            @click="handleSelectFormation('arena')"
          >
            <p class="font-medium text-sm"><PixelIcon name="attack" /> 当前竞技场阵容</p>
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
              <PixelIcon name="list" /> {{ f.name }}（槽位{{ f.slot }}）
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
          <el-button
            size="small"
            :disabled="formationUpgradeLoading"
            @click="handleBackToFormationList"
          >
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
                <PixelIcon name="attack" />
                {{
                  formatNumberWithUnits(
                    calculateCombatPower(adv, adv.runeStone || null)
                  )
                }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <template v-if="formationSelectedId">
          <el-button
            :disabled="formationUpgradeLoading"
            @click="formationSelectVisible = false"
          >
            取消
          </el-button>
          <el-button
            type="primary"
            :loading="formationUpgradeLoading"
            :disabled="
              formationSelectedAdvIds.size === 0 || formationUpgradeLoading
            "
            @click="handleFormationUpgradePreview"
          >
            {{ formationUpgradePreviewButtonText }}
          </el-button>
        </template>
        <template v-else>
          <el-button
            :disabled="formationUpgradeLoading"
            @click="formationSelectVisible = false"
          >
            关闭
          </el-button>
        </template>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  getMyAdventurersApi,
  recruitAdventurerApi,
  setRoleTagApi,
  batchEquipBestRuneStonesApi,
  batchRatioDistributeApi,
  batchFixedUpgradeApi,
  formationMaxUpgradeApi
} from '@/api/game/adventurer.js'
import { getGameSettingsApi } from '@/api/game/config.js'
import { useGameUser } from '@/composables/useGameUser.js'
import { useDialogRoute } from '@/composables/useDialogRoute.js'
import { useDialogLock } from '@/composables/useDialogLock.js'
import { ROLE_TAG_MAP } from 'shared/constants/index.js'
import {
  getMaxAdventurerCount,
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
import {
  formatNumberWithUnits,
  formatNumberWithCommas
} from 'shared/utils/utils.js'
import { getMyFormationsApi } from '@/api/game/formation.js'
import { getArenaFormationApi } from '@/api/game/arena.js'

const FORMATION_UPGRADE_MODE_FIXED = 'fixed'
const FORMATION_UPGRADE_MODE_MAX = 'max'
const BATCH_REPORT_MODE_FIXED = 'fixed'
const BATCH_REPORT_MODE_FORMATION_MAX = 'formationMax'

const router = useRouter()
const route = useRoute()
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
  { value: 'notInAny', label: 'notice 未配置任何阵容' }
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
        opts.push({ value: 'arena', label: 'attack 竞技场阵容' })
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
            label: `list ${f.name || '阵容' + f.slot}（槽${f.slot}）`
          })
        }
      }
    }

    opts.push({ value: 'notInAny', label: 'notice 未配置任何阵容' })
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
    ElMessage.success({ message: '招募成功！', showClose: true })
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
    ElMessage.success({
      message: `批量装备完成，${equipped} 名冒险家已装备符文石`,
      showClose: true
    })
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
const {
  visible: batchReportVisible,
  setVisibleSilently: setBatchReportVisibleSilently
} = useDialogRoute('batchReport')
const batchReportData = ref([])
const batchReportDirection = ref('up')
const batchReportMode = ref(BATCH_REPORT_MODE_FIXED)
const batchReportTotalPerAdv = ref(0)
const batchReportTotalGold = ref(0)
const batchReportTotalCrystals = ref({
  attackCrystal: 0,
  defenseCrystal: 0,
  speedCrystal: 0,
  sanCrystal: 0
})
const batchReportHasError = ref(false)
const batchReportGuildUpgradeInfo = ref(null)
const batchReportGuildUpgradeNeedFirst = ref(false)

// ── 批量升降级结果报表 ──
const {
  visible: batchResultVisible,
  setVisibleSilently: setBatchResultVisibleSilently
} = useDialogRoute('batchResult')
const batchResultData = ref(null)
const batchResultDirection = ref('up')
const batchResultMode = ref(BATCH_REPORT_MODE_FIXED)

const batchReportDialogTitle = computed(() => {
  if (batchReportMode.value === BATCH_REPORT_MODE_FORMATION_MAX) {
    return '按阵容升级到最高等级预览'
  }
  return `批量${batchReportDirection.value === 'up' ? '升级' : '降级'}预览`
})

const batchResultDialogTitle = computed(() => {
  if (batchResultMode.value === BATCH_REPORT_MODE_FORMATION_MAX) {
    return '按阵容升级到最高等级结果'
  }
  return `批量${batchResultDirection.value === 'up' ? '升级' : '降级'}结果`
})

function createZeroCrystalCost() {
  return {
    attack: 0,
    defense: 0,
    speed: 0,
    san: 0
  }
}

function createZeroCrystalInventory() {
  return {
    attackCrystal: 0,
    defenseCrystal: 0,
    speedCrystal: 0,
    sanCrystal: 0
  }
}

function buildAdventurerMap() {
  const adventurerMap = new Map()
  for (const adventurer of adventurers.value) {
    adventurerMap.set(adventurer._id, adventurer)
  }
  return adventurerMap
}

function sortByAdventurerOrder(items, orderedIds) {
  const orderMap = new Map(orderedIds.map((id, index) => [id, index]))
  return [...items].sort((left, right) => {
    const leftOrder = orderMap.get(left.adventurerId) ?? Number.MAX_SAFE_INTEGER
    const rightOrder =
      orderMap.get(right.adventurerId) ?? Number.MAX_SAFE_INTEGER
    return leftOrder - rightOrder
  })
}

function normalizeFormationMaxReportItem(item, adventurerMap, error = '') {
  const currentLevels = item.oldLevels || {
    attack: 0,
    defense: 0,
    speed: 0,
    san: 0,
    comprehensive: 0
  }
  const nextLevels = item.newLevels
    ? {
        attack: item.newLevels.attackLevel,
        defense: item.newLevels.defenseLevel,
        speed: item.newLevels.speedLevel,
        san: item.newLevels.SANLevel,
        comprehensive: item.newLevels.comprehensiveLevel
      }
    : { ...currentLevels }

  return {
    adventurerId: item.adventurerId,
    adventurerObj: adventurerMap.get(item.adventurerId) || null,
    name: item.adventurerName,
    alloc: item.allocation || createZeroCrystalCost(),
    currentLevels,
    newLevels: nextLevels,
    goldCost: item.goldCost || 0,
    crystalCost: item.crystalCost || createZeroCrystalCost(),
    error
  }
}

function normalizeBatchLevelSnapshot(levels) {
  return {
    attack: levels?.attack ?? levels?.attackLevel ?? 0,
    defense: levels?.defense ?? levels?.defenseLevel ?? 0,
    speed: levels?.speed ?? levels?.speedLevel ?? 0,
    san: levels?.san ?? levels?.SANLevel ?? 0,
    comprehensive: levels?.comprehensive ?? levels?.comprehensiveLevel ?? 0
  }
}

function normalizeFixedBatchReportItem(
  item,
  adventurerMap,
  error = '',
  warning = ''
) {
  const currentLevels = normalizeBatchLevelSnapshot(item.oldLevels)
  const nextLevels = normalizeBatchLevelSnapshot(item.newLevels)

  return {
    adventurerId: item.adventurerId,
    adventurerObj: adventurerMap.get(item.adventurerId) || null,
    name: item.adventurerName,
    alloc: item.allocation || createZeroCrystalCost(),
    currentLevels,
    newLevels: nextLevels,
    goldCost: item.goldCost || 0,
    crystalCost: item.crystalCost || createZeroCrystalCost(),
    error,
    warning: warning || item.warning || ''
  }
}

function applyFixedBatchUpgradePreviewData(data, orderedIds, totalLevels) {
  const adventurerMap = buildAdventurerMap()
  const previewItems = sortByAdventurerOrder(
    [
      ...(data.successList || []).map(item =>
        normalizeFixedBatchReportItem(item, adventurerMap, '', item.warning)
      ),
      ...(data.skippedList || []).map(item =>
        normalizeFixedBatchReportItem(
          item,
          adventurerMap,
          item.skipReason || '当前无法升级'
        )
      )
    ],
    orderedIds
  )

  batchReportMode.value = BATCH_REPORT_MODE_FIXED
  batchReportDirection.value = 'up'
  batchReportTotalPerAdv.value = totalLevels
  batchReportData.value = previewItems
  batchReportTotalGold.value = data.adventurerGoldSpent || 0
  batchReportTotalCrystals.value =
    data.totalCrystalsSpent || createZeroCrystalInventory()
  batchReportGuildUpgradeInfo.value = data.guildUpgradeInfo || null
  batchReportGuildUpgradeNeedFirst.value = false
  batchReportHasError.value = previewItems.every(item => !!item.error)
}

function buildFixedBatchResultData(data, orderedIds) {
  const adventurerMap = buildAdventurerMap()

  return {
    successList: sortByAdventurerOrder(data.successList || [], orderedIds).map(
      item => ({
        ...item,
        adventurerObj: adventurerMap.get(item.adventurerId) || null
      })
    ),
    skippedList: sortByAdventurerOrder(data.skippedList || [], orderedIds).map(
      item => ({
        ...item,
        adventurerObj: adventurerMap.get(item.adventurerId) || null
      })
    ),
    totalGoldSpent: data.totalGoldSpent || 0,
    remainingGold: data.remainingGold ?? playerInfo.value?.gold ?? 0,
    totalCrystalsSpent: data.totalCrystalsSpent || createZeroCrystalInventory(),
    remainingCrystals: data.remainingCrystals || createZeroCrystalInventory(),
    guildUpgraded: !!data.guildUpgradeInfo,
    newGuildLevel: data.newGuildLevel || playerInfo.value?.guildLevel || 1
  }
}

function applyFormationMaxPreviewData(data, orderedIds) {
  const adventurerMap = buildAdventurerMap()
  const previewItems = sortByAdventurerOrder(
    [
      ...(data.successList || []).map(item =>
        normalizeFormationMaxReportItem(item, adventurerMap)
      ),
      ...(data.skippedList || []).map(item =>
        normalizeFormationMaxReportItem(
          item,
          adventurerMap,
          item.skipReason || '当前无法升级'
        )
      )
    ],
    orderedIds
  )

  batchReportMode.value = BATCH_REPORT_MODE_FORMATION_MAX
  batchReportDirection.value = 'up'
  batchReportTotalPerAdv.value = 0
  batchReportData.value = previewItems
  batchReportTotalGold.value = data.adventurerGoldSpent || 0
  batchReportTotalCrystals.value =
    data.totalCrystalsSpent || createZeroCrystalInventory()
  batchReportGuildUpgradeInfo.value = data.guildUpgradeInfo || null
  batchReportGuildUpgradeNeedFirst.value = false
  batchReportHasError.value = previewItems.every(item => !!item.error)
}

function buildFormationMaxResultData(data, orderedIds) {
  const adventurerMap = buildAdventurerMap()
  return {
    successList: sortByAdventurerOrder(data.successList || [], orderedIds).map(
      item => ({
        ...item,
        adventurerObj: adventurerMap.get(item.adventurerId) || null
      })
    ),
    skippedList: sortByAdventurerOrder(data.skippedList || [], orderedIds).map(
      item => ({
        ...item,
        adventurerObj: adventurerMap.get(item.adventurerId) || null
      })
    ),
    totalGoldSpent: data.totalGoldSpent || 0,
    remainingGold: data.remainingGold ?? playerInfo.value?.gold ?? 0,
    totalCrystalsSpent: data.totalCrystalsSpent || createZeroCrystalInventory(),
    remainingCrystals: data.remainingCrystals || createZeroCrystalInventory(),
    guildUpgraded: !!data.guildUpgradeInfo,
    newGuildLevel: data.newGuildLevel || playerInfo.value?.guildLevel || 1
  }
}

function normalizeCurrentLevelsFromResult(newLevels) {
  return {
    attack: newLevels.attackLevel,
    defense: newLevels.defenseLevel,
    speed: newLevels.speedLevel,
    san: newLevels.SANLevel,
    comprehensive: newLevels.comprehensiveLevel
  }
}

function calculateBatchUpgradeAllocationCost(currentLevels, allocation) {
  const crystalBase = gameSettings.value.adventurerLevelUpCrystalBase ?? 100
  const goldBase = gameSettings.value.adventurerLevelUpGoldBase ?? 500
  const statLevels = {
    attack: currentLevels.attack,
    defense: currentLevels.defense,
    speed: currentLevels.speed,
    san: currentLevels.san
  }
  const crystalCost = createZeroCrystalCost()
  let goldCost = 0

  for (const [statType, totalLevels] of Object.entries(allocation || {})) {
    if (totalLevels <= 0) continue

    let currentLevel = statLevels[statType] || 1
    for (let index = 0; index < totalLevels; index += 1) {
      const crystal = getAdventurerLevelUpCrystalCost(currentLevel, crystalBase)
      const gold = getAdventurerLevelUpGoldCost(currentLevel, goldBase)
      crystalCost[statType] += crystal
      goldCost += gold
      currentLevel += 1
    }
  }

  return { goldCost, crystalCost }
}

function createBatchReportBaseItem(adventurer) {
  const currentLevels = {
    attack: adventurer.attackLevel || 1,
    defense: adventurer.defenseLevel || 1,
    speed: adventurer.speedLevel || 1,
    san: adventurer.SANLevel || 1,
    comprehensive: adventurer.comprehensiveLevel || 1
  }

  return {
    adventurerId: adventurer._id,
    adventurerObj: adventurer,
    name: adventurer.name,
    alloc: createZeroCrystalCost(),
    currentLevels,
    newLevels: { ...currentLevels },
    goldCost: 0,
    crystalCost: createZeroCrystalCost(),
    error: '',
    warning: ''
  }
}

async function handleOpenBatchRatioUpgradePreview(totalLevels) {
  batchRatioLoading.value = true
  try {
    const selectedAdventurers = adventurers.value.filter(adventurer =>
      selectedIds.value.has(adventurer._id)
    )
    const orderedAdventurerIds = selectedAdventurers.map(
      adventurer => adventurer._id
    )
    const res = await batchFixedUpgradeApi({
      adventurerIds: orderedAdventurerIds,
      totalLevels,
      preview: true
    })

    applyFixedBatchUpgradePreviewData(
      res.data.data,
      orderedAdventurerIds,
      totalLevels
    )
    batchReportVisible.value = true
  } catch {
    // handled by interceptor
  } finally {
    batchRatioLoading.value = false
  }
}

async function handleOpenBatchRatioReport(direction, totalLevels) {
  if (selectedIds.value.size === 0) {
    ElMessage.warning({ message: '请先选中冒险家', showClose: true })
    return
  }

  if (direction === 'up') {
    await handleOpenBatchRatioUpgradePreview(totalLevels)
    return
  }

  batchReportMode.value = BATCH_REPORT_MODE_FIXED
  batchReportDirection.value = direction
  batchReportTotalPerAdv.value = totalLevels
  batchReportGuildUpgradeInfo.value = null
  batchReportGuildUpgradeNeedFirst.value = false

  const downPricePerLevel =
    gameSettings.value.adventurerLevelDownGoldPrice ?? 1000

  let totalGold = 0
  const totalCrystalsAcc = createZeroCrystalInventory()
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

    const effectiveLevels = totalLevels

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
      newLevels.attack -= alloc.attack
      newLevels.defense -= alloc.defense
      newLevels.speed -= alloc.speed
      newLevels.san -= alloc.san
      newLevels.comprehensive =
        newLevels.attack +
        newLevels.defense +
        newLevels.speed +
        newLevels.san -
        3
    }

    reportItems.push({
      adventurerId: adv._id,
      adventurerObj: adv,
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
  if (batchReportMode.value === BATCH_REPORT_MODE_FORMATION_MAX) {
    await handleConfirmFormationMaxUpgrade()
    return
  }

  if (batchReportDirection.value === 'up') {
    await handleConfirmBatchRatioUpgradeWithGuildPhases()
    return
  }

  batchRatioLoading.value = true
  try {
    const ops = batchReportData.value
      .filter(item => !item.error)
      .map(item => ({
        adventurerId: item.adventurerId,
        direction: batchReportDirection.value,
        totalLevels: batchReportTotalPerAdv.value
      }))

    let guildUpgraded = false
    let newGuildLevel = playerInfo.value?.guildLevel || 1

    if (ops.length === 0 && !guildUpgraded) return

    // 记录升级前的等级（用于结果报表）
    const oldLevelsMap = new Map()
    for (const item of batchReportData.value) {
      oldLevelsMap.set(item.adventurerId, { ...item.currentLevels })
    }

    let results = []
    let skipped = []
    let updatedPlayerInfo = null
    let updatedInventory = null

    if (ops.length > 0) {
      const res = await batchRatioDistributeApi({ operations: ops })
      const data = res.data.data
      results = data.results || []
      skipped = data.skipped || []
      updatedPlayerInfo = data.playerInfo
      updatedInventory = data.inventory
    }

    // 构建结果报表数据
    const advMap = new Map()
    for (const adv of adventurers.value) {
      advMap.set(adv._id, adv)
    }

    const successList = results.map(r => ({
      ...r,
      adventurerObj: advMap.get(r.adventurerId) || null,
      oldLevels: oldLevelsMap.get(r.adventurerId) || {}
    }))

    const allSkipped = [
      ...skipped.map(s => ({
        ...s,
        adventurerObj: advMap.get(s.adventurerId) || null
      })),
      ...batchReportData.value
        .filter(i => i.error)
        .map(i => ({
          adventurerId: i.adventurerId,
          adventurerName: i.name,
          adventurerObj: i.adventurerObj,
          skipReason: i.error
        }))
    ]

    batchResultMode.value = batchReportMode.value
    batchResultDirection.value = batchReportDirection.value
    batchResultData.value = {
      successList,
      skippedList: allSkipped,
      totalGoldSpent:
        batchReportTotalGold.value +
        (guildUpgraded ? batchReportGuildUpgradeInfo.value.totalGuildFee : 0),
      remainingGold: updatedPlayerInfo?.gold ?? playerInfo.value?.gold ?? 0,
      totalCrystalsSpent: { ...batchReportTotalCrystals.value },
      remainingCrystals: {
        attackCrystal: updatedInventory?.attackCrystal ?? 0,
        defenseCrystal: updatedInventory?.defenseCrystal ?? 0,
        speedCrystal: updatedInventory?.speedCrystal ?? 0,
        sanCrystal: updatedInventory?.sanCrystal ?? 0
      },
      guildUpgraded,
      newGuildLevel
    }

    selectedIds.value = new Set()
    await fetchAdventurers()
    await fetchPlayerInfo()
    await switchBatchReportToResultDialog()
  } catch {
    // handled by interceptor
  } finally {
    batchRatioLoading.value = false
  }
}

async function switchBatchReportToResultDialog() {
  const dlg = route.query.dlg
  const stack = (Array.isArray(dlg) ? dlg : dlg ? [dlg] : [])
    .flatMap(item => item.split(','))
    .filter(Boolean)
    .filter(key => key !== 'batchReport')

  if (!stack.includes('batchResult')) {
    stack.push('batchResult')
  }

  const nextQuery = { ...route.query }
  nextQuery.dlg = stack.join(',')

  await router.replace({ query: nextQuery })
  setBatchReportVisibleSilently(false, false)
  setBatchResultVisibleSilently(true, true)
  await nextTick()
}

async function handleConfirmBatchRatioUpgradeWithGuildPhases() {
  const orderedAdventurerIds = batchReportData.value.map(
    item => item.adventurerId
  )
  if (orderedAdventurerIds.length === 0) return

  batchRatioLoading.value = true
  try {
    const res = await batchFixedUpgradeApi({
      adventurerIds: orderedAdventurerIds,
      totalLevels: batchReportTotalPerAdv.value,
      preview: false
    })

    batchResultMode.value = BATCH_REPORT_MODE_FIXED
    batchResultDirection.value = 'up'
    batchResultData.value = buildFixedBatchResultData(
      res.data.data,
      orderedAdventurerIds
    )

    selectedIds.value = new Set()
    await fetchAdventurers()
    await fetchPlayerInfo()
    await switchBatchReportToResultDialog()
  } catch {
    // handled by interceptor
  } finally {
    batchRatioLoading.value = false
  }
}

async function handleConfirmFormationMaxUpgrade() {
  const orderedAdventurerIds = [...selectedIds.value]
  if (orderedAdventurerIds.length === 0) return

  batchRatioLoading.value = true
  try {
    const res = await formationMaxUpgradeApi({
      adventurerIds: orderedAdventurerIds,
      preview: false
    })
    const data = res.data.data

    batchResultMode.value = BATCH_REPORT_MODE_FORMATION_MAX
    batchResultDirection.value = 'up'
    batchResultData.value = buildFormationMaxResultData(
      data,
      orderedAdventurerIds
    )

    selectedIds.value = new Set()
    await fetchAdventurers()
    await fetchPlayerInfo()
    await switchBatchReportToResultDialog()
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
const formationUpgradeMode = ref(FORMATION_UPGRADE_MODE_FIXED)
const formationUpgradeLevels = ref(10)
const formationOptions = ref([])
const arenaFormationOption = ref(null)
const formationSelectedId = ref(null)
const formationAdvList = ref([])
const formationSelectedAdvIds = ref(new Set())

const formationUpgradeDialogTitle = computed(() => {
  if (formationUpgradeMode.value === FORMATION_UPGRADE_MODE_MAX) {
    return 'notice 按阵容升级到最高等级'
  }
  return 'notice 按阵容升级'
})

const formationUpgradeDescription = computed(() => {
  if (formationUpgradeMode.value === FORMATION_UPGRADE_MODE_MAX) {
    return '选择阵容后，将优先升级等级较低的冒险家，直到当前资源可达的最高等级'
  }
  return `选择阵容后，将对阵容中的冒险家批量升级 +${formationUpgradeLevels.value} 级`
})

const formationUpgradePreviewButtonText = computed(() => {
  if (formationUpgradeMode.value === FORMATION_UPGRADE_MODE_MAX) {
    return '预览最高等级方案'
  }
  return '预览升级报表'
})

// 保存原始阵容数据以便查找冒险家
let formationDataCache = []
let arenaFormationCache = null

async function openFormationUpgradeSelector(mode, levels = 0) {
  formationUpgradeMode.value = mode
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

async function handleOpenFormationUpgrade(levels) {
  await openFormationUpgradeSelector(FORMATION_UPGRADE_MODE_FIXED, levels)
}

async function handleOpenFormationUpgradeMax() {
  await openFormationUpgradeSelector(FORMATION_UPGRADE_MODE_MAX)
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

async function handleFormationUpgradePreview() {
  if (formationSelectedAdvIds.value.size === 0) {
    ElMessage.warning({ message: '请先选中冒险家', showClose: true })
    return
  }

  const orderedAdventurerIds = [...formationSelectedAdvIds.value]

  if (formationUpgradeMode.value === FORMATION_UPGRADE_MODE_MAX) {
    formationUpgradeLoading.value = true
    try {
      const res = await formationMaxUpgradeApi({
        adventurerIds: orderedAdventurerIds,
        preview: true
      })

      selectedIds.value = new Set(orderedAdventurerIds)
      applyFormationMaxPreviewData(res.data.data, orderedAdventurerIds)
      formationSelectVisible.value = false

      setTimeout(() => {
        batchReportVisible.value = true
      }, 300)
    } catch {
      // handled by interceptor
    } finally {
      formationUpgradeLoading.value = false
    }
    return
  }

  const advIds = new Set(orderedAdventurerIds)
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

.batch-report-list {
  max-height: calc(50dvh - 100px);
  scrollbar-width: thin;
}
.batch-report-list::-webkit-scrollbar {
  width: 4px;
}
.batch-report-list::-webkit-scrollbar-thumb {
  background: rgba(150, 150, 150, 0.4);
  border-radius: 2px;
}
</style>

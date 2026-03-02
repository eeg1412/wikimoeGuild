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
            <p class="text-xs text-gray-400">开始时间</p>
            <p class="text-sm font-mono text-gray-600 dark:text-gray-300">
              {{ formatTime(arenaInfo.season.startTime) }}
            </p>
          </div>
          <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-2 text-center">
            <p class="text-xs text-gray-400">结束时间</p>
            <p class="text-sm font-mono text-gray-600 dark:text-gray-300">
              {{ formatTime(arenaInfo.season.endTime) }}
            </p>
          </div>
          <div
            class="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-2 text-center"
          >
            <p class="text-xs text-gray-400">奖池总额</p>
            <p class="text-sm font-bold text-yellow-500">
              🪙 {{ arenaInfo.season.poolAmount?.toLocaleString() }}
            </p>
          </div>
          <div
            class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-2 text-center"
          >
            <p class="text-xs text-gray-400">每战奖金</p>
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
      <template v-if="!arenaInfo.registration">
        <div class="rpg-card rounded-xl p-4 mb-4 text-center">
          <p class="text-gray-500 dark:text-gray-400 mb-3">你还未报名本赛季</p>
          <p class="text-sm text-red-400 mb-3">
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
            <p class="text-sm text-gray-500 dark:text-gray-400 mb-2">
              📋 阵容预览（{{ formationPreviewCount }} 名冒险家）
            </p>
            <div class="arena-grid-board mx-auto">
              <div
                v-for="(row, rIdx) in formationPreview.grid"
                :key="rIdx"
                class="arena-grid-row"
              >
                <div
                  v-for="(cell, cIdx) in row"
                  :key="`${rIdx}-${cIdx}`"
                  class="arena-grid-cell"
                  :class="{
                    'arena-grid-cell--occupied': cell
                  }"
                >
                  <span class="arena-grid-cell-seq">{{
                    rIdx * 5 + cIdx + 1
                  }}</span>
                  <template v-if="cell">
                    <GameAdventurerAvatar
                      :adventurer="cell"
                      class="w-full h-full rounded object-cover pointer-events-none select-none"
                    />
                    <div
                      v-for="indicator in getPassiveIndicators(cell)"
                      :key="indicator.position"
                      class="passive-indicator"
                      :class="'passive-indicator--' + indicator.position"
                      :style="{ backgroundColor: indicator.color }"
                      :title="indicator.label"
                    />
                    <div
                      class="absolute bottom-0 left-0 right-0 text-center bg-black/50 text-[10px] text-white leading-tight py-px truncate"
                    >
                      {{ cell.name }}
                    </div>
                    <!-- 标记图标 -->
                    <span
                      v-if="cell.roleTag && ROLE_TAG_MAP[cell.roleTag]"
                      class="absolute top-0 right-0 z-10 bg-black/65 rounded-bl text-xs leading-none p-0.5"
                    >
                      {{ ROLE_TAG_MAP[cell.roleTag].emoji }}
                    </span>
                  </template>
                </div>
              </div>
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
              <p class="text-xs text-gray-400">竞技点</p>
              <p class="text-lg font-bold text-yellow-500">
                {{ arenaInfo.registration?.points ?? 500 }}
              </p>
            </div>
            <div>
              <p class="text-xs text-gray-400">剩余挑战</p>
              <p class="text-lg font-bold text-blue-500">
                {{ arenaInfo.registration?.challengeUses ?? 0 }}
              </p>
            </div>
            <div>
              <p class="text-xs text-gray-400">对战次数</p>
              <p class="text-lg font-bold text-green-500">
                {{ arenaInfo.registration?.totalBattleCount ?? 0 }}
              </p>
            </div>
          </div>
          <p
            v-if="arenaInfo.nextRecoverIn"
            class="text-center text-xs text-gray-400 mt-2"
          >
            ⏰ 下次恢复: {{ Math.ceil(arenaInfo.nextRecoverIn / 60) }} 分钟后
          </p>
        </div>

        <!-- 标签切换 -->
        <div class="flex flex-wrap justify-center gap-2 mb-4">
          <el-button
            :type="arenaTab === 'match' ? 'primary' : 'default'"
            size="small"
            @click="handleSwitchArenaTab('match')"
          >
            🎯 匹配对手
          </el-button>
          <el-button
            :type="arenaTab === 'formation' ? 'primary' : 'default'"
            size="small"
            @click="handleSwitchArenaTab('formation')"
          >
            🏗️ 阵容管理
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
                :key="opponent._id"
                class="rpg-card rounded-xl p-3"
              >
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-3 min-w-0">
                    <div
                      class="w-10 h-10 rounded-lg overflow-hidden flex items-center justify-center bg-gray-200 dark:bg-gray-700 cursor-pointer"
                      @click.stop="handleGuildIconClick(opponent)"
                    >
                      <img
                        v-if="opponent.isNpc"
                        :src="`/publicgame/guildicon/${opponent.npcGuildIconId || 1}.webp`"
                        class="w-full h-full object-cover"
                        alt="NPC公会"
                      />
                      <GameGuildIcon
                        v-else
                        :account-id="opponent.accountId"
                        :has-custom-guild-icon="opponent.hasCustomGuildIcon"
                        :custom-guild-icon-updated-at="
                          opponent.customGuildIconUpdatedAt
                        "
                        class="w-full h-full object-cover"
                      />
                    </div>
                    <div class="min-w-0">
                      <p
                        class="text-sm font-semibold text-gray-700 dark:text-gray-200 truncate"
                      >
                        {{ opponent.guildName }}
                      </p>
                      <p class="text-sm text-gray-400">
                        竞技点: {{ opponent.points }}
                      </p>
                    </div>
                  </div>
                  <el-button
                    type="danger"
                    size="small"
                    :loading="challengeLoading === opponent._id"
                    :disabled="
                      !!challengeLoading ||
                      challengedOpponents.has(opponent._id) ||
                      (arenaInfo.registration?.challengeUses ?? 0) <= 0
                    "
                    @click="handleChallenge(opponent)"
                  >
                    {{
                      challengedOpponents.has(opponent._id)
                        ? '✅ 已挑战'
                        : '⚔️ 挑战'
                    }}
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

        <!-- ===== 阵容管理 ===== -->
        <div v-if="arenaTab === 'formation'">
          <div v-if="arenaFormationLoading" class="flex justify-center py-8">
            <span class="animate-spin inline-block text-2xl">⏳</span>
          </div>
          <template v-else>
            <p class="text-sm text-gray-400 text-center mb-2">
              ↑ 前排（面向敌人）· ↓ 后排
            </p>
            <p class="text-sm text-red-400 text-center mb-2">
              ⚠️ 已锁定的冒险家不能移除，只能调整位置或添加新冒险家
            </p>
            <FormationGrid
              v-model="arenaGrid"
              :locked-ids="arenaLockedAdventurers"
              class="mb-4"
              @cell-click="handleArenaCellClick"
              @clear-cell="handleClearArenaCell"
            />

            <p class="text-center text-sm text-gray-400 mb-4">
              已放置 {{ arenaPlacedCount }} 名冒险家
            </p>

            <div class="flex justify-center gap-3 mb-4">
              <el-button
                type="primary"
                :loading="arenaFormationSaving"
                :disabled="arenaFormationSaving"
                @click="handleSaveArenaFormation"
              >
                💾 保存阵容
              </el-button>
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
                    <GameGuildIcon
                      v-if="player.accountId"
                      :account-id="player.accountId"
                      :has-custom-guild-icon="player.hasCustomGuildIcon"
                      :custom-guild-icon-updated-at="
                        player.customGuildIconUpdatedAt
                      "
                      class="w-8 h-8 rounded-lg object-cover cursor-pointer"
                      @click="handleLeaderboardGuildClick(player)"
                    />
                    <div>
                      <p
                        class="text-sm font-semibold text-gray-700 dark:text-gray-200"
                      >
                        {{ player.guildName }}
                      </p>
                      <p class="text-sm text-gray-400">
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
                      <span class="ml-1">{{ log.opponentName || '未知' }}</span>
                    </p>
                    <p class="text-sm text-gray-400 mt-0.5">
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
                        class="text-sm"
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
                    <span class="text-gray-400 text-sm">▶</span>
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

    <!-- ===== 竞技场阵容选择冒险家弹窗 ===== -->
    <el-dialog
      v-model="arenaPickDialogVisible"
      title="选择冒险家"
      width="340px"
      align-center
      :destroy-on-close="true"
    >
      <div v-if="arenaAdventurersLoading" class="text-center py-6">
        <span class="animate-spin inline-block text-2xl">⏳</span>
      </div>
      <template v-else>
        <!-- 当前格子上的冒险家 -->
        <div
          v-if="arenaCellAdventurer"
          class="mb-3 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg"
        >
          <div class="flex items-center gap-2">
            <GameAdventurerAvatar
              :adventurer="arenaCellAdventurer"
              class="w-8 h-8 rounded-full"
            />
            <span
              class="text-sm font-semibold text-gray-700 dark:text-gray-200"
            >
              {{ arenaCellAdventurer.name }}
            </span>
            <span
              v-if="isAdventurerLocked(arenaCellAdventurer._id)"
              class="text-xs text-yellow-500 border border-yellow-500 px-1 rounded"
            >
              🔒 已锁定
            </span>
            <el-button
              v-if="!isAdventurerLocked(arenaCellAdventurer._id)"
              type="danger"
              text
              size="small"
              @click="removeFromArenaCell"
            >
              移除
            </el-button>
          </div>
        </div>

        <!-- 分组 Tabs -->
        <el-tabs v-model="arenaPickTab" class="mb-2">
          <el-tab-pane label="未放置" name="unplaced" />
          <el-tab-pane label="已放置" name="placed" />
        </el-tabs>

        <!-- 可选列表 -->
        <div class="space-y-1 max-h-60 overflow-y-auto">
          <div
            v-for="adv in arenaFilteredPickAdventurers"
            :key="adv._id"
            class="flex items-center gap-2 p-2 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            @click="placeArenaAdventurer(adv)"
          >
            <div class="relative shrink-0">
              <GameAdventurerAvatar
                :adventurer="adv"
                class="w-8 h-8 rounded-full border"
                :style="{ borderColor: getElementColor(adv.elements) }"
              />
              <div
                v-for="indicator in getPassiveIndicators(adv)"
                :key="indicator.position"
                class="passive-dot"
                :class="'passive-dot--' + indicator.position"
                :style="{ backgroundColor: indicator.color }"
                :title="indicator.label"
              />
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm text-gray-700 dark:text-gray-200 truncate">
                {{ adv.name }}
              </p>
              <p class="text-xs text-gray-400">
                {{ getElementName(adv.elements) }} · Lv.{{
                  adv.comprehensiveLevel || 1
                }}
              </p>
            </div>
            <span
              v-if="isArenaPlaced(adv._id)"
              class="text-xs text-yellow-500 border border-yellow-500 px-1 rounded"
            >
              已放置
            </span>
          </div>
        </div>

        <div
          v-if="arenaFilteredPickAdventurers.length === 0"
          class="text-center py-4 text-gray-400 text-sm"
        >
          暂无可添加的冒险家
        </div>
      </template>
    </el-dialog>

    <!-- ===== 战斗结果弹窗 ===== -->
    <el-dialog
      v-model="battleResultVisible"
      title="⚔️ 战斗结果"
      width="340px"
      align-center
      destroy-on-close
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
      destroy-on-close
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
              <p class="text-sm text-gray-400">挑战方</p>
            </div>
            <div class="text-xl font-bold text-gray-400 px-2">VS</div>
            <div class="text-center flex-1">
              <p class="font-semibold text-red-500">
                🏰
                {{ logDetail.defenderGuildName }}
              </p>
              <p class="text-sm text-gray-400">防守方</p>
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
            <!-- 挑战方阵容（转置+列倒序：右侧为小序号） -->
            <div>
              <p class="text-sm text-gray-400 mb-1 text-center">挑战方阵容</p>
              <div class="grid grid-cols-5 gap-0.5">
                <template v-for="r in 5" :key="'a' + r">
                  <template v-for="c in 5" :key="'a' + r + '-' + c">
                    <div
                      class="aspect-square rounded border flex items-center justify-center overflow-hidden relative"
                      :class="
                        getUnitAt(logDetail.attackerUnits, 5 - c, r - 1)
                          ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700'
                          : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                      "
                      :title="
                        getUnitTooltip(
                          getUnitAt(logDetail.attackerUnits, 5 - c, r - 1)
                        )
                      "
                    >
                      <template
                        v-if="getUnitAt(logDetail.attackerUnits, 5 - c, r - 1)"
                      >
                        <GameAdventurerAvatar
                          :adventurer="
                            getUnitAt(logDetail.attackerUnits, 5 - c, r - 1)
                          "
                          class="w-full h-full object-cover"
                        />
                        <span
                          class="absolute bottom-0 right-0 bg-black/60 text-white text-[10px] leading-none px-0.5 rounded-tl"
                          >{{ (5 - c) * 5 + (r - 1) + 1 }}</span
                        >
                      </template>
                    </div>
                  </template>
                </template>
              </div>
            </div>
            <!-- 防守方阵容（转置+列正序：左侧为小序号） -->
            <div>
              <p class="text-sm text-gray-400 mb-1 text-center">防守方阵容</p>
              <div class="grid grid-cols-5 gap-0.5">
                <template v-for="r in 5" :key="'d' + r">
                  <template v-for="c in 5" :key="'d' + r + '-' + c">
                    <div
                      class="aspect-square rounded border flex items-center justify-center overflow-hidden relative"
                      :class="
                        getUnitAt(logDetail.defenderUnits, c - 1, r - 1)
                          ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700'
                          : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                      "
                      :title="
                        getUnitTooltip(
                          getUnitAt(logDetail.defenderUnits, c - 1, r - 1)
                        )
                      "
                    >
                      <template
                        v-if="getUnitAt(logDetail.defenderUnits, c - 1, r - 1)"
                      >
                        <GameAdventurerAvatar
                          :adventurer="
                            getUnitAt(logDetail.defenderUnits, c - 1, r - 1)
                          "
                          class="w-full h-full object-cover"
                        />
                        <span
                          class="absolute bottom-0 left-0 bg-black/60 text-white text-[10px] leading-none px-0.5 rounded-tr"
                          >{{ (c - 1) * 5 + (r - 1) + 1 }}</span
                        >
                      </template>
                    </div>
                  </template>
                </template>
              </div>
            </div>
          </div>

          <!-- 单位详情列表 -->
          <div class="space-y-2">
            <p class="text-sm text-gray-400">👥 冒险家属性快照</p>
            <div class="max-h-60 overflow-y-auto space-y-1">
              <!-- 挑战方 -->
              <p class="text-xs font-semibold text-blue-500 mt-1">
                挑战方 · {{ logDetail.attackerGuildName }}
              </p>
              <div
                v-for="unit in logDetail.attackerUnits"
                :key="'au-' + unit.adventurerId + unit.row + unit.col"
                class="bg-blue-50 dark:bg-blue-900/20 rounded p-2 text-sm flex items-center gap-2"
              >
                <GameAdventurerAvatar
                  :adventurer="unit"
                  class="w-8 h-8 rounded-full shrink-0"
                />
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
              <!-- 防守方 -->
              <p class="text-xs font-semibold text-red-500 mt-2">
                防守方 · {{ logDetail.defenderGuildName }}
              </p>
              <div
                v-for="unit in logDetail.defenderUnits"
                :key="'du-' + unit.adventurerId + unit.row + unit.col"
                class="bg-red-50 dark:bg-red-900/20 rounded p-2 text-sm flex items-center gap-2"
              >
                <GameAdventurerAvatar
                  :adventurer="unit"
                  class="w-8 h-8 rounded-full shrink-0"
                />
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

          <p class="text-sm text-gray-400 text-center">
            {{ formatTime(logDetail.createdAt) }}
          </p>
        </div>
      </template>
    </el-dialog>

    <!-- 公会信息弹窗 -->
    <GuildInfoDialog
      v-model="guildInfoDialogVisible"
      :player-info-id="guildInfoPlayerInfoId"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import FormationGrid from '@/components/FormationGrid.vue'
import {
  getArenaInfoApi,
  registerArenaApi,
  getMatchListApi,
  challengeOpponentApi,
  getLeaderboardApi,
  getMyBattleLogsApi,
  getBattleLogDetailApi,
  getArenaFormationApi,
  updateArenaFormationApi
} from '@/api/game/arena.js'
import {
  getMyFormationsApi,
  getFormationDetailApi
} from '@/api/game/formation.js'
import { getMyAdventurersApi } from '@/api/game/adventurer.js'
import { useGameUser } from '@/composables/useGameUser.js'
import BattleAnimation from '@/components/BattleAnimation.vue'
import {
  createEmptyGrid,
  isAdventurerPlaced,
  placeAdventurerOnGrid,
  getPassiveIndicators,
  getElementColor,
  getElementName,
  ELEMENT_MAP
} from '@/composables/useFormationGrid.js'
import { useDialogRoute } from '@/composables/useDialogRoute.js'
import { ROLE_TAG_MAP } from 'shared/constants/index.js'

const router = useRouter()
const { isLoggedIn, fetchPlayerInfo } = useGameUser()
if (!isLoggedIn.value) {
  router.replace({ name: 'GameLogin' })
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
const challengedOpponents = ref(new Set())

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
const { visible: battleResultVisible } = useDialogRoute('battleResult')
const battleResult = ref(null)
const showBattleAnimation = ref(false)

// 战斗记录详情
const { visible: logDetailVisible } = useDialogRoute('logDetail')

// 公会信息弹窗
const { visible: guildInfoDialogVisible } = useDialogRoute('guildInfo')
const guildInfoPlayerInfoId = ref('')

function handleGuildIconClick(opponent) {
  if (opponent.isNpc) return // NPC 无公会详情
  guildInfoPlayerInfoId.value = opponent.playerInfoId
  guildInfoDialogVisible.value = true
}

function handleLeaderboardGuildClick(player) {
  if (!player.playerInfoId) return
  guildInfoPlayerInfoId.value = player.playerInfoId
  guildInfoDialogVisible.value = true
}
const logDetailLoading = ref(false)
const logDetail = ref(null)

// 竞技场阵容管理
const arenaFormationLoading = ref(false)
const arenaFormationSaving = ref(false)
const arenaGrid = ref(createEmptyGrid())
const arenaLockedAdventurers = ref([])

const arenaAllAdventurers = ref([])
const arenaAdventurersLoading = ref(false)
const { visible: arenaPickDialogVisible } = useDialogRoute('arenaPick')
const arenaPickRow = ref(0)
const arenaPickCol = ref(0)

const arenaPlacedCount = computed(() => {
  let count = 0
  for (const row of arenaGrid.value) {
    for (const cell of row) {
      if (cell) count++
    }
  }
  return count
})

function getArenaCell(row, col) {
  return arenaGrid.value[row]?.[col] || null
}

function isAdventurerLocked(advId) {
  return arenaLockedAdventurers.value.some(
    id => id === advId || id.toString() === advId?.toString()
  )
}

function isArenaPlaced(advId) {
  return isAdventurerPlaced(arenaGrid.value, advId)
}

const arenaCellAdventurer = computed(() => {
  return getArenaCell(arenaPickRow.value, arenaPickCol.value)
})

const arenaPickTab = ref('unplaced')

const arenaFilteredPickAdventurers = computed(() => {
  if (arenaPickTab.value === 'placed') {
    return arenaAllAdventurers.value.filter(adv => isArenaPlaced(adv._id))
  }
  return arenaAllAdventurers.value.filter(adv => !isArenaPlaced(adv._id))
})

function handleArenaCellClick(row, col) {
  arenaPickRow.value = row
  arenaPickCol.value = col
  arenaPickDialogVisible.value = true
}

function placeArenaAdventurer(adv) {
  placeAdventurerOnGrid(
    arenaGrid.value,
    arenaPickRow.value,
    arenaPickCol.value,
    adv
  )
  arenaPickDialogVisible.value = false
}

function removeFromArenaCell() {
  const cell = arenaGrid.value[arenaPickRow.value][arenaPickCol.value]
  if (cell && isAdventurerLocked(cell._id)) {
    ElMessage.warning('已锁定的冒险家不能移除')
    return
  }
  arenaGrid.value[arenaPickRow.value][arenaPickCol.value] = null
  arenaPickDialogVisible.value = false
}

function handleClearArenaCell(row, col) {
  const cell = arenaGrid.value[row][col]
  if (!cell) return
  if (isAdventurerLocked(cell._id)) {
    ElMessage.warning('已锁定的冒险家不能移除')
    return
  }
  arenaGrid.value[row][col] = null
}

async function fetchArenaFormation() {
  arenaFormationLoading.value = true
  try {
    const [formRes, advRes] = await Promise.all([
      getArenaFormationApi(),
      getMyAdventurersApi()
    ])
    const data = formRes.data.data || {}
    arenaLockedAdventurers.value = (data.lockedAdventurers || []).map(id =>
      id.toString()
    )
    arenaAllAdventurers.value = advRes.data.data || []

    // 构建阵容网格
    // 优先用 getMyAdventurersApi 返回的完整数据（含 passiveBuffType 等字段），
    // 保证被动增益色块等 UI 能正常显示
    const advMap = new Map(
      arenaAllAdventurers.value.map(a => [a._id.toString(), a])
    )
    const newGrid = createEmptyGrid()
    if (data.grid && Array.isArray(data.grid)) {
      for (let r = 0; r < 5; r++) {
        for (let c = 0; c < 5; c++) {
          const advData = data.grid[r]?.[c]
          if (advData && typeof advData === 'object' && advData._id) {
            newGrid[r][c] = advMap.get(advData._id.toString()) || advData
          }
        }
      }
    }
    arenaGrid.value = newGrid
  } catch {
    // 错误已由拦截器处理
  } finally {
    arenaFormationLoading.value = false
  }
}

async function handleSaveArenaFormation() {
  // 验证所有已锁定冒险家仍在阵容中
  const currentIds = arenaGrid.value
    .flat()
    .filter(c => c !== null)
    .map(c => c._id)
  for (const lockedId of arenaLockedAdventurers.value) {
    if (
      !currentIds.includes(lockedId) &&
      !currentIds.some(id => id.toString() === lockedId.toString())
    ) {
      ElMessage.error('已锁定的冒险家不能移除')
      return
    }
  }

  const gridData = arenaGrid.value.map(row =>
    row.map(cell => (cell ? cell._id : null))
  )

  arenaFormationSaving.value = true
  try {
    await updateArenaFormationApi({ grid: gridData })
    ElMessage.success('竞技场阵容保存成功！')
    // 重新加载阵容以更新锁定列表
    await fetchArenaFormation()
    // 刷新竞技场信息
    fetchArenaInfo()
  } catch {
    // 错误已由拦截器处理
  } finally {
    arenaFormationSaving.value = false
  }
}

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
  } catch {
    // 错误已由拦截器处理
  } finally {
    registerLoading.value = false
  }
}

function handleSwitchArenaTab(tab) {
  arenaTab.value = tab
  if (tab === 'match') {
    fetchMatchList()
  } else if (tab === 'formation') {
    fetchArenaFormation()
  } else if (tab === 'leaderboard') {
    fetchLeaderboard()
  } else if (tab === 'logs') {
    fetchBattleLogs()
  }
}

async function fetchMatchList() {
  matchLoading.value = true
  challengedOpponents.value = new Set()
  try {
    const res = await getMatchListApi()
    matchList.value = res.data.data?.opponents || []
  } catch {
    matchList.value = []
  } finally {
    matchLoading.value = false
  }
}

async function handleChallenge(opponent) {
  const id = opponent._id
  challengeLoading.value = id
  try {
    const res = await challengeOpponentApi({
      registrationId: opponent.registrationId
    })
    const result = res.data.data
    // 添加便捷字段供模板使用
    result.isWin = result.battleResult.winner === 'attacker'
    result.isDraw = result.battleResult.winner === 'draw'
    result.rounds = result.battleResult.rounds
    battleResult.value = result
    // 记录已挑战过的对手
    challengedOpponents.value.add(id)
    // 先展示战斗演出
    showBattleAnimation.value = true
    // 刷新状态
    await fetchArenaInfo()
    await fetchPlayerInfo()
  } catch {
    // 错误已由拦截器处理
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
  if (logDetailLoading.value) return
  logDetailLoading.value = true
  logDetail.value = null
  try {
    const res = await getBattleLogDetailApi(log._id)
    logDetail.value = res.data.data || null
    logDetailVisible.value = true
  } catch {
    // 错误已由拦截器处理
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
  if (arenaInfo.value.registration) {
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

.arena-grid-board {
  max-width: 320px;
}

.arena-grid-board-inner {
  display: grid;
  grid-template-columns: repeat(5, 56px);
  gap: 4px;
}

.arena-grid-row {
  display: flex;
  gap: 4px;
}

.arena-grid-cell {
  width: 56px;
  height: 56px;
  border: 2px dashed rgba(200, 160, 80, 0.4);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.05);
  transition:
    border-color 0.2s,
    background 0.2s;
}

.arena-grid-cell:hover {
  border-color: rgba(200, 160, 80, 0.8);
  background: rgba(255, 200, 50, 0.1);
}

.arena-grid-cell--occupied {
  border-style: solid;
  border-color: rgba(200, 160, 80, 0.6);
}

.arena-grid-cell--draggable {
  cursor: grab;
  touch-action: none;
  -webkit-user-select: none;
  user-select: none;
}

.arena-grid-cell--draggable:active {
  cursor: grabbing;
}

.arena-grid-cell--ghost {
  opacity: 0.4;
  background: rgba(255, 200, 50, 0.25) !important;
  border-color: rgba(255, 200, 50, 0.8) !important;
}

.arena-grid-cell-seq {
  position: absolute;
  top: 1px;
  left: 3px;
  font-size: 10px;
  color: rgba(140, 120, 80, 0.6);
  line-height: 1;
  pointer-events: none;
  z-index: 1;
}

.dark .arena-grid-cell {
  background: rgba(30, 25, 20, 0.5);
}

/* 被动增益元素色块 */
.passive-indicator {
  position: absolute;
  z-index: 2;
  border-radius: 2px;
  opacity: 0.85;
  pointer-events: none;
}
.passive-indicator--left {
  left: 0;
  top: 20%;
  bottom: 20%;
  width: 4px;
}
.passive-indicator--right {
  right: 0;
  top: 20%;
  bottom: 20%;
  width: 4px;
}
.passive-indicator--top {
  top: 0;
  left: 20%;
  right: 20%;
  height: 4px;
}
.passive-indicator--bottom {
  bottom: 0;
  left: 20%;
  right: 20%;
  height: 4px;
  z-index: 3;
}

/* 清除按钮 */
.clear-btn {
  position: absolute;
  top: 1px;
  left: 1px;
  z-index: 10;
  cursor: pointer;
  font-size: 10px;
  line-height: 1;
  color: #fff;
  background: rgba(220, 60, 60, 0.75);
  border-radius: 3px;
  padding: 1px 3px;
  opacity: 0.7;
  transition: opacity 0.2s;
}
.clear-btn:hover {
  opacity: 1;
  background: rgba(240, 40, 40, 0.9);
}

/* 选择列表中的被动增益色点 */
.passive-dot {
  position: absolute;
  border-radius: 2px;
  opacity: 0.85;
  pointer-events: none;
}
.passive-dot--left {
  left: -2px;
  top: 25%;
  bottom: 25%;
  width: 3px;
}
.passive-dot--right {
  right: -2px;
  top: 25%;
  bottom: 25%;
  width: 3px;
}
.passive-dot--top {
  top: -2px;
  left: 25%;
  right: 25%;
  height: 3px;
}
.passive-dot--bottom {
  bottom: -2px;
  left: 25%;
  right: 25%;
  height: 3px;
}

@media (max-width: 400px) {
  .arena-grid-board-inner {
    grid-template-columns: repeat(5, 48px);
  }
  .arena-grid-cell {
    width: 48px;
    height: 48px;
  }
}
</style>

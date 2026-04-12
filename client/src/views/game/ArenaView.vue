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
              🪙 {{ formatNumberWithCommas(arenaInfo.season.poolAmount ?? 0) }}
            </p>
          </div>
          <div
            class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-2 text-center"
          >
            <p class="text-xs text-gray-400">每战奖金</p>
            <p class="text-sm font-bold text-blue-500">
              🪙 {{ formatNumberWithCommas(arenaInfo.season.battleGold) }}
            </p>
          </div>
        </div>
        <div v-else class="text-center text-gray-400 text-sm py-4">
          暂无进行中的赛季
        </div>
      </div>

      <!-- ===== 休赛期/结算中提示 ===== -->
      <div
        v-if="
          arenaInfo.status === 'offseason' || arenaInfo.status === 'settling'
        "
        class="rpg-card rounded-xl p-4 mb-4 text-center"
      >
        <p class="text-lg font-bold text-yellow-500 mb-2">
          {{ arenaInfo.status === 'settling' ? '⏳ 赛季结算中' : '🏖️ 休赛期' }}
        </p>
        <p class="text-sm text-gray-500 dark:text-gray-400">
          {{ arenaInfo.message }}
        </p>
        <template
          v-if="
            arenaInfo.status === 'offseason' && arenaInfo.nextSeasonStartTime
          "
        >
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-2">
            预计下一赛季开始时间：<span class="font-mono text-blue-500">{{
              formatTime(arenaInfo.nextSeasonStartTime)
            }}</span>
          </p>
        </template>
        <template v-if="arenaInfo.registration">
          <div class="mt-3 grid grid-cols-3 gap-2 text-center">
            <div>
              <p class="text-xs text-gray-400">最终竞技点</p>
              <p class="text-lg font-bold text-yellow-500">
                {{ formatNumberWithCommas(arenaInfo.registration.points ?? 0) }}
              </p>
            </div>
            <div>
              <p class="text-xs text-gray-400">对战次数</p>
              <p class="text-lg font-bold text-green-500">
                {{ arenaInfo.registration.totalBattleCount ?? 0 }}
              </p>
            </div>
            <div>
              <p class="text-xs text-gray-400">状态</p>
              <p class="text-sm font-bold text-orange-500">等待结算</p>
            </div>
          </div>
        </template>
      </div>

      <!-- ===== 以下内容仅在赛季进行中时显示 ===== -->
      <template v-if="arenaInfo.status === 'active'">
        <!-- ===== 未报名状态 ===== -->
        <template v-if="!arenaInfo.registration">
          <div class="rpg-card rounded-xl p-4 mb-4 text-center">
            <p class="text-gray-500 dark:text-gray-400 mb-3">
              你还未报名本赛季
            </p>
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
              <div class="flex justify-center">
                <FormationGrid
                  :cellSize="60"
                  :model-value="formationPreview.grid"
                  show-role-tag
                  :role-tag-list="ROLE_TAGS"
                  :role-tag-loading="previewRoleTagLoading"
                  @set-role-tag="handlePreviewRoleTag"
                  :canDragMode="false"
                  :locked-ids="
                    formationPreview.grid.flatMap(row =>
                      row.map(cell => cell?._id).filter(Boolean)
                    )
                  "
                />
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
                  {{
                    formatNumberWithCommas(
                      arenaInfo.registration?.points ?? 500
                    )
                  }}
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

          <!-- 自动对战按钮 -->
          <div class="flex justify-center mb-4">
            <el-button
              type="warning"
              size="small"
              :disabled="(arenaInfo.registration?.challengeUses ?? 0) <= 0"
              @click="handleStartAutoArena"
            >
              ⚡ 自动对战
            </el-button>
          </div>

          <!-- ===== 匹配对手 ===== -->
          <div v-if="arenaTab === 'match'">
            <div v-if="matchLoading" class="flex justify-center py-8">
              <span class="animate-spin inline-block text-2xl">⏳</span>
            </div>
            <template v-else>
              <!-- 我方战斗力展示 -->
              <div
                v-if="arenaCombatPower > 0"
                class="mb-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm flex items-center justify-between"
              >
                <span class="text-gray-500 dark:text-gray-400"
                  >🏰 我方竞技场战斗力</span
                >
                <span class="font-mono font-bold text-blue-500">{{
                  formatNumberWithUnits(arenaCombatPower)
                }}</span>
              </div>
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
                        <p
                          class="text-sm font-semibold text-amber-500 dark:text-amber-400"
                        >
                          🏆 竞技点:
                          {{ formatNumberWithCommas(opponent.points) }}
                        </p>
                        <p
                          v-if="opponent.combatPower != null"
                          class="text-xs text-orange-400 font-mono"
                        >
                          ⚔️ 战斗力:
                          {{ formatNumberWithUnits(opponent.combatPower) }}
                          <template v-if="arenaCombatPower > 0">
                            <span
                              v-if="arenaCombatPower > opponent.combatPower"
                              class="text-green-500 ml-1"
                              >↑+{{
                                formatNumberWithUnits(
                                  arenaCombatPower - opponent.combatPower
                                )
                              }}</span
                            >
                            <span
                              v-else-if="
                                arenaCombatPower < opponent.combatPower
                              "
                              class="text-red-400 ml-1"
                              >↓{{
                                formatNumberWithUnits(
                                  arenaCombatPower - opponent.combatPower
                                )
                              }}</span
                            >
                            <span v-else class="text-gray-400 ml-1">持平</span>
                          </template>
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
              <div class="flex flex-col items-center mt-4 gap-1">
                <p v-if="matchRefreshedAt" class="text-xs text-gray-400">
                  数据更新时间: {{ formatRefreshedAt(matchRefreshedAt) }}
                </p>
                <el-button
                  text
                  size="small"
                  :loading="matchLoading || matchRefreshPending"
                  :disabled="
                    refreshCooldown > 0 || matchLoading || matchRefreshPending
                  "
                  @click="handleRefreshMatchList"
                >
                  {{
                    refreshCooldown > 0
                      ? `🔄 刷新对手 (${refreshCooldown}s)`
                      : '🔄 刷新对手'
                  }}
                </el-button>
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
                show-role-tag
                :role-tag-list="ROLE_TAGS"
                :role-tag-loading="arenaRoleTagLoading"
                class="mb-4"
                @cell-click="handleArenaCellClick"
                @clear-cell="handleClearArenaCell"
                @set-role-tag="handleArenaGridRoleTag"
              />

              <p class="text-center text-sm text-gray-400 mb-2">
                已放置 {{ arenaPlacedCount }} 名冒险家
              </p>
              <p class="text-center text-sm text-orange-400 font-mono mb-4">
                ⚔️ 综合战斗力: {{ formatNumberWithUnits(arenaCombatPower) }}
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
                      >{{ formatNumberWithCommas(player.points) }} pt</span
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
                          log.opponentName || '未知'
                        }}</span>
                      </p>
                      <p class="text-sm text-gray-400 mt-0.5">
                        {{ formatTime(log.createdAt) }}
                        · {{ log.rounds }} 回合
                        <span
                          v-if="log.goldEarned > 0"
                          class="text-yellow-500 ml-1"
                          >+🪙{{ formatNumberWithCommas(log.goldEarned) }}</span
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
                          {{
                            log.isWin ? '胜利' : log.isDraw ? '平局' : '失败'
                          }}
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
                          }}{{ formatNumberWithCommas(log.pointsChange) }} pt
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
                  size="small"
                  @current-change="fetchBattleLogs"
                />
              </div>
            </template>
          </div>
        </template>
      </template>
      <!-- ===== 赛季进行中内容结束 ===== -->
    </template>

    <!-- ===== 竞技场阵容选择冒险家弹窗 ===== -->
    <el-dialog
      v-model="arenaPickDialogVisible"
      title="选择冒险家"
      width="340px"
      align-center
      :destroy-on-close="true"
      append-to-body
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
      append-to-body
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
              }}{{ formatNumberWithCommas(battleResult.pointsChange) }}
            </span>
          </p>
          <p v-if="battleResult.goldEarned > 0">
            <span class="text-gray-400">获得金币:</span>
            <span class="ml-2 text-yellow-500 font-bold"
              >🪙 {{ formatNumberWithCommas(battleResult.goldEarned) }}</span
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
      append-to-body
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
              >+🪙{{ formatNumberWithCommas(logDetail.goldEarned) }}</span
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
                          >{{ `${6 - c}-${r}` }}</span
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
                          >{{ `${c}-${r}` }}</span
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
                    ❤️{{ unit.SANLevel }}
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
                    ❤️{{ unit.SANLevel }}
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

    <!-- 冒险家详情弹窗 -->
    <AdventurerDetailDialog
      v-model="arenaAdvDetailVisible"
      :adventurer-id="arenaAdvDetailId"
      show-manage
      @updated="handleArenaAdvDetailUpdated"
    >
      <template #footer>
        <div class="flex justify-center gap-2 mt-2">
          <el-button size="small" @click="handleArenaDetailReplace"
            >🔄 替换</el-button
          >
          <el-button
            v-if="!isAdventurerLocked(arenaAdvDetailId)"
            type="danger"
            size="small"
            @click="handleArenaDetailRemove"
            >🗑️ 移除</el-button
          >
        </div>
      </template>
    </AdventurerDetailDialog>

    <!-- 公会信息弹窗 -->
    <GuildInfoDialog
      v-model="guildInfoDialogVisible"
      :player-info-id="guildInfoPlayerInfoId"
    />

    <!-- ===== 自动竞技场对战弹窗 ===== -->
    <el-dialog
      v-model="autoArenaDialogVisible"
      title="⚡ 自动竞技场对战"
      width="400px"
      align-center
      :close-on-click-modal="!autoArenaRunning"
      :close-on-press-escape="!autoArenaRunning"
      :show-close="!autoArenaRunning"
      append-to-body
      @opened="handleAutoArenaDialogOpened"
      @close="handleAutoArenaDialogClose"
      @closed="handleAutoArenaDialogClosed"
    >
      <div class="text-center space-y-4">
        <!-- 战斗场次 -->
        <p class="text-2xl font-bold text-yellow-500 dark:text-yellow-400">
          {{ autoArenaBattleDisplay }}
        </p>

        <!-- 公会图标对战场景 -->
        <div class="auto-arena-stage">
          <div class="auto-arena-duel-frame">
            <Transition
              name="auto-arena-duel-fade"
              mode="out-in"
              @after-enter="handleAutoArenaSceneEntered"
            >
              <!-- 结算完成 -->
              <div
                v-if="autoArenaShowSettlement"
                key="auto-arena-settlement"
                class="auto-arena-duel-settlement"
              >
                <p class="auto-arena-duel-settlement__title">结算完成</p>
                <p class="auto-arena-duel-settlement__status">
                  {{ autoArenaStatusText }}
                </p>
                <div class="auto-arena-duel-settlement__stats">
                  <span>总场次 {{ autoArenaTotalCount }}</span>
                  <span>胜利 {{ autoArenaWinCount }}</span>
                  <span>平局 {{ autoArenaDrawCount }}</span>
                  <span>失败 {{ autoArenaLoseCount }}</span>
                </div>
                <p
                  class="text-sm mt-2"
                  :class="
                    autoArenaTotalPointsChange >= 0
                      ? 'text-green-400'
                      : 'text-red-400'
                  "
                >
                  竞技点变化:
                  {{ autoArenaTotalPointsChange >= 0 ? '+' : ''
                  }}{{ formatNumberWithCommas(autoArenaTotalPointsChange) }}
                </p>
              </div>
              <!-- 对战场景 -->
              <div
                v-else-if="autoArenaSceneReady"
                :key="autoArenaSceneKey"
                class="auto-arena-duel-scene"
                :class="{
                  'is-battling': autoArenaScenePhase === 'battle',
                  'is-settling': autoArenaScenePhase === 'settling'
                }"
              >
                <!-- 我方公会 -->
                <div
                  class="auto-arena-duel-side auto-arena-duel-side--ally"
                  :class="{
                    'is-defeated': autoArenaSceneLoser === 'ally'
                  }"
                >
                  <div
                    class="auto-arena-duel-side__halo auto-arena-duel-side__halo--ally"
                  ></div>
                  <img
                    :src="autoArenaMyGuildIconUrl"
                    class="auto-arena-duel-avatar"
                  />
                  <span
                    class="auto-arena-duel-side__label"
                    :title="autoArenaMyGuildName"
                  >
                    {{ autoArenaMyGuildName }}
                  </span>
                </div>

                <!-- 碰撞效果 -->
                <div
                  class="auto-arena-duel-impact"
                  :class="{ active: autoArenaScenePhase === 'battle' }"
                >
                  <div class="auto-arena-duel-impact-core"></div>
                  <div
                    class="auto-arena-duel-impact-wave auto-arena-duel-impact-wave--outer"
                  ></div>
                  <div
                    class="auto-arena-duel-impact-wave auto-arena-duel-impact-wave--inner"
                  ></div>
                  <span
                    v-for="spark in autoArenaSparkSeeds"
                    :key="spark.id"
                    class="auto-arena-duel-spark"
                    :style="spark.style"
                  ></span>
                </div>

                <!-- 对方公会 -->
                <div
                  class="auto-arena-duel-side auto-arena-duel-side--enemy"
                  :class="{
                    'is-defeated': autoArenaSceneLoser === 'enemy'
                  }"
                >
                  <div
                    class="auto-arena-duel-side__halo auto-arena-duel-side__halo--enemy"
                  ></div>
                  <img
                    :src="autoArenaCurrentOpponentIconUrl"
                    class="auto-arena-duel-avatar"
                  />
                  <span
                    class="auto-arena-duel-side__label"
                    :title="autoArenaCurrentOpponent?.guildName || '对手'"
                  >
                    {{ autoArenaCurrentOpponent?.guildName || '对手' }}
                  </span>
                </div>
              </div>
              <!-- 加载中 -->
              <div
                v-else-if="autoArenaInitialLoading"
                key="auto-arena-loading"
                class="auto-arena-duel-loading"
              >
                <span class="auto-arena-duel-loading__spinner"></span>
                <p class="auto-arena-duel-loading__text">正在匹配最佳对手...</p>
              </div>
            </Transition>
            <p
              v-if="
                !autoArenaDialogClosing &&
                !autoArenaSceneReady &&
                !autoArenaInitialLoading &&
                !autoArenaShowSettlement
              "
              class="text-gray-400 text-sm py-6"
            >
              等待战斗数据...
            </p>
          </div>

          <div class="auto-arena-timer-card">
            <p class="auto-arena-timer-card__label">用时</p>
            <p class="auto-arena-timer-card__value">
              {{ autoArenaTimerText }}
            </p>
            <p class="auto-arena-timer-card__hint">
              {{ autoArenaCountdownHint }}
            </p>
          </div>
        </div>

        <!-- 状态信息 -->
        <div
          class="space-y-2 auto-arena-summary"
          :class="{
            'auto-arena-summary--hidden': autoArenaShowSettlement
          }"
        >
          <p class="text-sm text-gray-500 dark:text-gray-400">
            {{ autoArenaStatusText }}
          </p>
          <div class="flex justify-center gap-4 text-sm flex-wrap">
            <span class="text-green-500">
              ✅ 胜利: {{ autoArenaWinCount }}
            </span>
            <span class="text-gray-400">
              🤝 平局: {{ autoArenaDrawCount }}
            </span>
            <span class="text-red-400">
              ❌ 失败: {{ autoArenaLoseCount }}
            </span>
          </div>
          <p class="text-xs text-gray-400">
            已挑战: {{ autoArenaTotalCount }} 次 | 竞技点变化:
            <span
              :class="
                autoArenaTotalPointsChange >= 0
                  ? 'text-green-400'
                  : 'text-red-400'
              "
            >
              {{ autoArenaTotalPointsChange >= 0 ? '+' : ''
              }}{{ formatNumberWithCommas(autoArenaTotalPointsChange) }}
            </span>
            | 金币: +{{ formatNumberWithCommas(autoArenaTotalGold) }}
          </p>
        </div>
      </div>
      <template #footer>
        <el-button
          v-if="autoArenaRunning"
          type="danger"
          @click="handleStopAutoArena"
        >
          停止自动对战
        </el-button>
        <el-button v-else type="primary" @click="handleCloseAutoArenaDialog">
          关闭
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
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
import { getMyAdventurersApi, setRoleTagApi } from '@/api/game/adventurer.js'
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

// ── 角色标记 ──
const ROLE_TAGS = Object.entries(ROLE_TAG_MAP).map(([value, info]) => ({
  value,
  ...info
}))
import AdventurerDetailDialog from '@/components/AdventurerDetailDialog.vue'
import { calculateCombatPower } from 'shared/utils/gameDatabase.js'
import {
  formatNumberWithUnits,
  formatNumberWithCommas
} from 'shared/utils/utils.js'

const router = useRouter()
const { isLoggedIn, fetchPlayerInfo, playerInfo, guildIconUrl } = useGameUser()
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
const previewRoleTagLoading = ref(false)

async function handlePreviewRoleTag(row, col, tagValue) {
  const cell = formationPreview.value?.grid?.[row]?.[col]
  if (!cell || previewRoleTagLoading.value) return
  const newTag = cell.roleTag === tagValue ? '' : tagValue
  previewRoleTagLoading.value = true
  try {
    const res = await setRoleTagApi(cell._id, { roleTag: newTag })
    formationPreview.value.grid[row][col] = { ...cell, ...res.data.data }
  } catch {
    // 错误已由拦截器处理
  } finally {
    previewRoleTagLoading.value = false
  }
}

const arenaRoleTagLoading = ref(false)
async function handleArenaGridRoleTag(row, col, tagValue) {
  const cell = arenaGrid.value[row]?.[col]
  if (!cell || arenaRoleTagLoading.value) return
  const newTag = cell.roleTag === tagValue ? '' : tagValue
  arenaRoleTagLoading.value = true
  try {
    const res = await setRoleTagApi(cell._id, { roleTag: newTag })
    const updated = { ...cell, ...res.data.data }
    arenaGrid.value[row][col] = updated
    const idx = arenaAllAdventurers.value.findIndex(a => a._id === cell._id)
    if (idx !== -1) {
      arenaAllAdventurers.value[idx] = {
        ...arenaAllAdventurers.value[idx],
        ...res.data.data
      }
    }
  } catch {
    // 错误已由拦截器处理
  } finally {
    arenaRoleTagLoading.value = false
  }
}

const arenaTab = ref('match')
const MATCH_LIST_REFRESH_COOLDOWN_MS = 10000
const MATCH_LIST_REFRESH_SAFETY_MS = 500

// 匹配对手
const matchList = ref([])
const matchLoading = ref(false)
const matchRefreshPending = ref(false)
const challengeLoading = ref(null)
const challengedOpponents = ref(new Set())
const matchRefreshedAt = ref(null)
const refreshCooldown = ref(0)
let refreshCooldownTimer = null
let matchRefreshReadyAt = 0
let matchForceRefreshPromise = null

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

const arenaCombatPower = computed(() => {
  let total = 0
  for (const row of arenaGrid.value) {
    for (const cell of row) {
      if (cell) {
        total += calculateCombatPower(cell, cell.runeStone || null)
      }
    }
  }
  return total
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

// ── 竞技场阵容冒险家详情弹窗 ──
const { visible: arenaAdvDetailVisible } = useDialogRoute('arenaAdvDetail')
const arenaAdvDetailId = ref('')
const arenaAdvDetailRow = ref(0)
const arenaAdvDetailCol = ref(0)

function handleArenaCellClick(row, col) {
  const cell = getArenaCell(row, col)
  if (cell) {
    // 已放置冒险家 → 显示详情弹窗
    arenaAdvDetailId.value = cell._id
    arenaAdvDetailRow.value = row
    arenaAdvDetailCol.value = col
    arenaAdvDetailVisible.value = true
  } else {
    // 空格子 → 打开选择弹窗
    arenaPickRow.value = row
    arenaPickCol.value = col
    arenaPickDialogVisible.value = true
  }
}

function handleArenaAdvDetailUpdated(updatedAdv) {
  // 同步更新阵容网格上的冒险家数据
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 5; c++) {
      if (arenaGrid.value[r][c]?._id === updatedAdv._id) {
        arenaGrid.value[r][c] = updatedAdv
      }
    }
  }
  // 也更新冒险家列表
  const idx = arenaAllAdventurers.value.findIndex(a => a._id === updatedAdv._id)
  if (idx !== -1) {
    arenaAllAdventurers.value[idx] = updatedAdv
  }
}

function handleArenaDetailReplace() {
  arenaAdvDetailVisible.value = false
  arenaPickRow.value = arenaAdvDetailRow.value
  arenaPickCol.value = arenaAdvDetailCol.value
  setTimeout(() => {
    arenaPickDialogVisible.value = true
  }, 300)
}

function handleArenaDetailRemove() {
  const cell =
    arenaGrid.value[arenaAdvDetailRow.value]?.[arenaAdvDetailCol.value]
  if (cell && isAdventurerLocked(cell._id)) {
    ElMessage.warning({ message: '已锁定的冒险家不能移除', showClose: true })
    return
  }
  arenaGrid.value[arenaAdvDetailRow.value][arenaAdvDetailCol.value] = null
  arenaAdvDetailVisible.value = false
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
    ElMessage.warning({ message: '已锁定的冒险家不能移除', showClose: true })
    return
  }
  arenaGrid.value[arenaPickRow.value][arenaPickCol.value] = null
  arenaPickDialogVisible.value = false
}

function handleClearArenaCell(row, col) {
  const cell = arenaGrid.value[row][col]
  if (!cell) return
  if (isAdventurerLocked(cell._id)) {
    ElMessage.warning({ message: '已锁定的冒险家不能移除', showClose: true })
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
      ElMessage.error({ message: '已锁定的冒险家不能移除', showClose: true })
      return
    }
  }

  const gridData = arenaGrid.value.map(row =>
    row.map(cell => (cell ? cell._id : null))
  )

  arenaFormationSaving.value = true
  try {
    await updateArenaFormationApi({ grid: gridData })
    ElMessage.success({ message: '竞技场阵容保存成功！', showClose: true })
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
    ElMessage.warning({ message: '请选择阵容', showClose: true })
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
    ElMessage.success({ message: '报名成功！', showClose: true })
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
    // 加载竞技场阵容，以便显示我方战斗力
    fetchArenaFormation()
  } else if (tab === 'formation') {
    fetchArenaFormation()
  } else if (tab === 'leaderboard') {
    fetchLeaderboard()
  } else if (tab === 'logs') {
    fetchBattleLogs()
  }
}

async function fetchMatchList(forceRefresh = false) {
  if (forceRefresh) {
    return refreshMatchListWithLock()
  }

  matchLoading.value = true
  try {
    const res = await getMatchListApi()
    applyMatchListData(res.data.data, { forceRefresh: false })
  } catch {
    matchList.value = []
  } finally {
    matchLoading.value = false
  }
}

function applyMatchListData(data, options = {}) {
  const forceRefresh = options.forceRefresh === true
  matchList.value = data?.opponents || []
  matchList.value.sort((a, b) => (b.points ?? 0) - (a.points ?? 0))

  if (data?.refreshedAt) {
    updateMatchRefreshWindow(data.refreshedAt, forceRefresh)
  }

  if (forceRefresh) {
    challengedOpponents.value = new Set()
    return
  }

  challengedOpponents.value = new Set(data?.challengedIds || [])
}

function updateMatchRefreshWindow(refreshedAt, forceRefresh = false) {
  const refreshedAtMs = new Date(refreshedAt).getTime()
  const now = Date.now()

  matchRefreshedAt.value = new Date(refreshedAtMs)

  if (forceRefresh) {
    matchRefreshReadyAt = Math.max(
      matchRefreshReadyAt,
      now + MATCH_LIST_REFRESH_COOLDOWN_MS + MATCH_LIST_REFRESH_SAFETY_MS
    )
  } else {
    const remainingMs = Math.max(
      0,
      MATCH_LIST_REFRESH_COOLDOWN_MS - (now - refreshedAtMs)
    )
    matchRefreshReadyAt = Math.max(
      matchRefreshReadyAt,
      now + remainingMs + MATCH_LIST_REFRESH_SAFETY_MS
    )
  }

  startRefreshCooldown()
}

function getMatchRefreshRemainingMs() {
  return Math.max(0, matchRefreshReadyAt - Date.now())
}

function getRefreshRetryMs(err) {
  const message = err.response?.data?.message || err.message || ''
  const matched = message.match(/请(\d+)秒后再试/)
  if (!matched) return 0
  return Number(matched[1]) * 1000 + MATCH_LIST_REFRESH_SAFETY_MS
}

async function waitForMatchRefresh(runToken) {
  const initialRemainingMs = getMatchRefreshRemainingMs()
  if (initialRemainingMs <= 0) {
    refreshCooldown.value = 0
    return true
  }

  autoArenaCooldownSeconds.value = Math.ceil(initialRemainingMs / 1000)
  autoArenaStatusText.value = `⏳ 等待刷新冷却 (${autoArenaCooldownSeconds.value}s)...`

  const ready = await new Promise(resolve => {
    clearAutoArenaCooldownTimer()
    autoArenaCooldownTimer = setInterval(() => {
      if (!autoArenaRunning.value || runToken !== autoArenaRunToken) {
        clearAutoArenaCooldownTimer()
        autoArenaCooldownSeconds.value = 0
        resolve(false)
        return
      }

      const remainingMs = getMatchRefreshRemainingMs()
      autoArenaCooldownSeconds.value = Math.ceil(remainingMs / 1000)
      autoArenaStatusText.value = `⏳ 等待刷新冷却 (${autoArenaCooldownSeconds.value}s)...`

      if (remainingMs <= 0) {
        clearAutoArenaCooldownTimer()
        autoArenaCooldownSeconds.value = 0
        resolve(true)
      }
    }, 250)
  })

  return ready
}

async function refreshMatchListWithLock(options = {}) {
  const runToken = options.runToken
  const waitForCooldown = options.waitForCooldown === true
  const autoRetryOnCooldown = options.autoRetryOnCooldown === true

  if (matchForceRefreshPromise) {
    return await matchForceRefreshPromise
  }

  matchForceRefreshPromise = (async () => {
    let retryCount = 0
    matchRefreshPending.value = true

    try {
      while (retryCount < 3) {
        if (waitForCooldown) {
          const ready = await waitForMatchRefresh(runToken)
          if (!ready) return false
        } else if (getMatchRefreshRemainingMs() > 0) {
          startRefreshCooldown()
          return false
        }

        try {
          const res = await getMatchListApi({ refresh: '1' })
          applyMatchListData(res.data.data, { forceRefresh: true })
          return true
        } catch (err) {
          const retryMs = getRefreshRetryMs(err)
          if (retryMs <= 0) {
            return false
          }

          matchRefreshReadyAt = Math.max(
            matchRefreshReadyAt,
            Date.now() + retryMs
          )
          startRefreshCooldown()

          if (!autoRetryOnCooldown) {
            return false
          }

          retryCount += 1
        }
      }

      return false
    } finally {
      matchRefreshPending.value = false
      matchForceRefreshPromise = null
    }
  })()

  return await matchForceRefreshPromise
}

function startRefreshCooldown() {
  if (refreshCooldownTimer) {
    clearInterval(refreshCooldownTimer)
    refreshCooldownTimer = null
  }
  if (!matchRefreshedAt.value) return
  const calcRemaining = () => {
    return Math.max(0, Math.ceil(getMatchRefreshRemainingMs() / 1000))
  }
  refreshCooldown.value = calcRemaining()
  if (refreshCooldown.value > 0) {
    refreshCooldownTimer = setInterval(() => {
      refreshCooldown.value = calcRemaining()
      if (refreshCooldown.value <= 0) {
        clearInterval(refreshCooldownTimer)
        refreshCooldownTimer = null
      }
    }, 500)
  }
}

async function handleRefreshMatchList() {
  await refreshMatchListWithLock()
}

function formatRefreshedAt(date) {
  if (!date) return ''
  const d = new Date(date)
  const pad = n => String(n).padStart(2, '0')
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
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
  return `${unit.name} | ⚔️${unit.attackLevel} 🛡️${unit.defenseLevel} 💨${unit.speedLevel} ❤️${unit.SANLevel}`
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

// ══════════════════════════════════════════
// ═══════ 自动竞技场对战 ════════════════
// ══════════════════════════════════════════

const AUTO_ARENA_ROUND_DELAY_MS = 3000
const AUTO_ARENA_SCENE_SWITCH_MS = 260

const { visible: autoArenaDialogVisible } = useDialogRoute('autoArena')
const autoArenaRunning = ref(false)
const autoArenaWinCount = ref(0)
const autoArenaDrawCount = ref(0)
const autoArenaLoseCount = ref(0)
const autoArenaTotalCount = ref(0)
const autoArenaTotalPointsChange = ref(0)
const autoArenaTotalGold = ref(0)
const autoArenaTimerText = ref('00:00')
const autoArenaStatusText = ref('准备中...')
const autoArenaCooldownSeconds = ref(0)
const autoArenaDisplayCount = ref(0)
const autoArenaRequestPending = ref(false)
const autoArenaSceneKey = ref(0)
const autoArenaScenePhase = ref('idle')
const autoArenaSceneLoser = ref('')
const autoArenaSceneBattlePending = ref(false)
const autoArenaCurrentOpponent = ref(null)
const autoArenaStartPending = ref(false)
const autoArenaDialogClosing = ref(false)

let autoArenaStartTime = null
let autoArenaCooldownTimer = null
let autoArenaTimerInterval = null
let autoArenaSceneDelayTimer = null
let autoArenaRunToken = 0
let autoArenaWakeLock = null

const autoArenaSparkSeeds = [
  {
    id: 'spark-1',
    style: {
      '--spark-angle': '-28deg',
      '--spark-distance': '24px',
      '--spark-delay': '0s',
      '--spark-size': '16px'
    }
  },
  {
    id: 'spark-2',
    style: {
      '--spark-angle': '24deg',
      '--spark-distance': '26px',
      '--spark-delay': '0.08s',
      '--spark-size': '18px'
    }
  },
  {
    id: 'spark-3',
    style: {
      '--spark-angle': '78deg',
      '--spark-distance': '20px',
      '--spark-delay': '0.04s',
      '--spark-size': '14px'
    }
  },
  {
    id: 'spark-4',
    style: {
      '--spark-angle': '138deg',
      '--spark-distance': '22px',
      '--spark-delay': '0.12s',
      '--spark-size': '15px'
    }
  },
  {
    id: 'spark-5',
    style: {
      '--spark-angle': '204deg',
      '--spark-distance': '25px',
      '--spark-delay': '0.03s',
      '--spark-size': '17px'
    }
  },
  {
    id: 'spark-6',
    style: {
      '--spark-angle': '256deg',
      '--spark-distance': '19px',
      '--spark-delay': '0.1s',
      '--spark-size': '13px'
    }
  },
  {
    id: 'spark-7',
    style: {
      '--spark-angle': '316deg',
      '--spark-distance': '23px',
      '--spark-delay': '0.06s',
      '--spark-size': '16px'
    }
  }
]

// ── 计算属性 ──
const autoArenaMyGuildName = computed(() => {
  return (
    arenaInfo.value.registration?.guildName ||
    playerInfo.value?.guildName ||
    '我的公会'
  )
})

const autoArenaMyGuildIconUrl = computed(() => {
  return guildIconUrl.value
})

const autoArenaCurrentOpponentIconUrl = computed(() => {
  const op = autoArenaCurrentOpponent.value
  if (!op) return ''
  return getAutoArenaOpponentGuildIconUrl(op)
})

function getAutoArenaOpponentGuildIconUrl(opponent) {
  if (opponent.isNpc) {
    return `/publicgame/guildicon/${opponent.npcGuildIconId || 1}.webp`
  }
  if (opponent.hasCustomGuildIcon) {
    const t = opponent.customGuildIconUpdatedAt
      ? new Date(opponent.customGuildIconUpdatedAt).getTime()
      : ''
    return `/uploads/custom-guild-icon/${opponent.accountId}.png${t ? '?t=' + t : ''}`
  }
  return `/uploads/default-guild-icon/${opponent.accountId}.png`
}

const autoArenaSceneReady = computed(() => {
  return !!autoArenaCurrentOpponent.value
})

const autoArenaInitialLoading = computed(() => {
  if (!autoArenaDialogVisible.value) return false
  if (autoArenaDialogClosing.value) return false
  if (autoArenaDisplayCount.value > 0 || autoArenaTotalCount.value > 0) {
    return false
  }
  if (autoArenaStartPending.value) return true
  return autoArenaRunning.value || autoArenaRequestPending.value
})

const autoArenaShowSettlement = computed(() => {
  return !autoArenaRunning.value && autoArenaTotalCount.value > 0
})

const autoArenaCountdownHint = computed(() => {
  if (autoArenaRunning.value && autoArenaCooldownSeconds.value > 0) {
    return `下一场将在 ${autoArenaCooldownSeconds.value} 秒后开始`
  }
  if (autoArenaRequestPending.value) {
    return autoArenaDisplayCount.value > 0
      ? '正在判定战斗结果...'
      : '当前战斗进行中...'
  }
  if (autoArenaRunning.value) {
    return '正在寻找最佳对手...'
  }
  if (autoArenaTotalCount.value > 0) {
    return '自动对战已结束'
  }
  return '等待自动对战开始'
})

const autoArenaBattleDisplay = computed(() => {
  if (autoArenaRunning.value) {
    return `⚔️ 第 ${autoArenaDisplayCount.value || 1} 场对战`
  }
  if (autoArenaTotalCount.value > 0) {
    return `⚔️ 共完成 ${autoArenaTotalCount.value} 场对战`
  }
  return '⚔️ 准备中…'
})

/**
 * 寻找下一个自动对战对手
 * 策略：
 * - 优先挑战竞技点高于自己的对手（按积分从高到低）
 * - 若无高积分对手，且之前没输给过高积分对手，且未尝试过刷新 → 返回 needRefresh
 * - 刷新后仍无高积分对手 / 或曾输给过高积分对手 → 从高到低挑战剩余对手
 * - 列表全部打完 → needRefresh
 * @param {boolean} lostToHigher - 本轮是否曾输给过高积分对手
 * @param {boolean} alreadyRefreshed - 本轮是否已经刷新过（刷新后仍无高积分对手时不再刷新）
 * @returns {{ opponent, needRefresh: boolean }}
 */
function findNextAutoArenaOpponent(lostToHigher, alreadyRefreshed) {
  const myPoints = arenaInfo.value.registration?.points ?? 500
  const unchallenged = matchList.value.filter(
    op => !challengedOpponents.value.has(op._id)
  )

  if (unchallenged.length === 0) {
    return { opponent: null, needRefresh: true }
  }

  // 按积分从高到低排序
  unchallenged.sort((a, b) => (b.points ?? 0) - (a.points ?? 0))

  // 分成高积分和低积分两组
  const higherOps = unchallenged.filter(op => (op.points ?? 0) > myPoints)

  if (higherOps.length > 0) {
    // 优先挑战最高积分对手
    return { opponent: higherOps[0], needRefresh: false }
  }

  // 没有高积分对手了
  if (!lostToHigher && !alreadyRefreshed) {
    // 之前全胜高积分对手，且还没刷新过 → 刷新一次寻找新的高积分对手
    return { opponent: null, needRefresh: true }
  }

  // 曾输给过高积分对手 或 已经刷新过 → 按积分从高到低打剩余对手
  return { opponent: unchallenged[0], needRefresh: false }
}

// ── 场景管理 ──
function clearAutoArenaSceneDelayTimer() {
  if (autoArenaSceneDelayTimer) {
    clearTimeout(autoArenaSceneDelayTimer)
    autoArenaSceneDelayTimer = null
  }
}

function resetAutoArenaSceneState() {
  clearAutoArenaSceneDelayTimer()
  autoArenaSceneBattlePending.value = false
  autoArenaSceneKey.value = 0
  autoArenaCurrentOpponent.value = null
  autoArenaScenePhase.value = 'idle'
  autoArenaSceneLoser.value = ''
}

function setAutoArenaSceneResult(winner) {
  autoArenaScenePhase.value = 'settling'
  if (winner === 'attacker') {
    autoArenaSceneLoser.value = 'enemy'
  } else if (winner === 'defender') {
    autoArenaSceneLoser.value = 'ally'
  } else {
    autoArenaSceneLoser.value = ''
  }
}

function handleAutoArenaSceneEntered() {
  if (!autoArenaSceneBattlePending.value) return
  autoArenaSceneBattlePending.value = false
  autoArenaScenePhase.value = autoArenaRunning.value ? 'battle' : 'idle'
}

// ── 计时器管理 ──
function formatAutoArenaTimer(ms) {
  const totalSec = Math.floor(ms / 1000)
  const min = Math.floor(totalSec / 60)
    .toString()
    .padStart(2, '0')
  const sec = (totalSec % 60).toString().padStart(2, '0')
  return `${min}:${sec}`
}

function syncAutoArenaTimerText() {
  if (!autoArenaStartTime) {
    autoArenaTimerText.value = '00:00'
    return
  }
  autoArenaTimerText.value = formatAutoArenaTimer(
    Date.now() - autoArenaStartTime
  )
}

function startAutoArenaTimer() {
  autoArenaStartTime = Date.now()
  syncAutoArenaTimerText()
  autoArenaTimerInterval = setInterval(syncAutoArenaTimerText, 1000)
}

function stopAutoArenaTimer() {
  syncAutoArenaTimerText()
  if (autoArenaTimerInterval) {
    clearInterval(autoArenaTimerInterval)
    autoArenaTimerInterval = null
  }
  autoArenaStartTime = null
}

function clearAutoArenaCooldownTimer() {
  if (autoArenaCooldownTimer) {
    clearInterval(autoArenaCooldownTimer)
    autoArenaCooldownTimer = null
  }
}

// ── Wake Lock ──
async function acquireAutoArenaWakeLock() {
  try {
    if ('wakeLock' in navigator) {
      autoArenaWakeLock = await navigator.wakeLock.request('screen')
    }
  } catch {
    // not supported
  }
}

function releaseAutoArenaWakeLock() {
  if (autoArenaWakeLock) {
    autoArenaWakeLock.release().catch(() => {})
    autoArenaWakeLock = null
  }
}

// ── 刷新对手列表（自动对战用） ──
async function autoArenaRefreshMatchList(runToken) {
  autoArenaStatusText.value = '🔄 刷新对手列表...'
  return await refreshMatchListWithLock({
    runToken,
    waitForCooldown: true,
    autoRetryOnCooldown: true
  })
}

// ── 对话框管理 ──
function handleStartAutoArena() {
  if (autoArenaRunning.value) return
  if ((arenaInfo.value.registration?.challengeUses ?? 0) <= 0) {
    ElMessage.warning({ message: '挑战次数不足', showClose: true })
    return
  }
  autoArenaDialogClosing.value = false
  resetAutoArenaDialogState()
  autoArenaStartPending.value = true
  autoArenaDialogVisible.value = true
}

async function handleAutoArenaDialogOpened() {
  autoArenaDialogClosing.value = false
  if (!autoArenaStartPending.value) return
  autoArenaStartPending.value = false
  const started = await startAutoArena()
  if (!started && !autoArenaRunning.value) {
    autoArenaDialogVisible.value = false
  }
}

function handleAutoArenaDialogClose() {
  autoArenaDialogClosing.value = true
  autoArenaStartPending.value = false
}

function handleAutoArenaDialogClosed() {
  autoArenaDialogClosing.value = false
  if (autoArenaRunning.value) return
  resetAutoArenaDialogState()
  // 静默同步服务端状态
  getArenaInfoApi()
    .then(res => {
      arenaInfo.value = res.data.data || {}
    })
    .catch(() => {})
  fetchPlayerInfo()
}

function handleCloseAutoArenaDialog() {
  if (autoArenaRunning.value) return
  autoArenaDialogClosing.value = true
  autoArenaDialogVisible.value = false
}

function resetAutoArenaDialogState() {
  resetAutoArenaSceneState()
  autoArenaWinCount.value = 0
  autoArenaDrawCount.value = 0
  autoArenaLoseCount.value = 0
  autoArenaTotalCount.value = 0
  autoArenaTotalPointsChange.value = 0
  autoArenaTotalGold.value = 0
  autoArenaTimerText.value = '00:00'
  autoArenaStatusText.value = '准备中...'
  autoArenaCooldownSeconds.value = 0
  autoArenaDisplayCount.value = 0
  autoArenaRequestPending.value = false
}

// ── 核心流程 ──
// 追踪本轮是否曾输给过高积分对手
let autoArenaLostToHigher = false
// 追踪是否刷新后仍无高积分对手（防止重复刷新）
let autoArenaRefreshedNoHigher = false

async function startAutoArena() {
  if (autoArenaRunning.value) return false

  resetAutoArenaSceneState()
  autoArenaRunning.value = true
  autoArenaWinCount.value = 0
  autoArenaDrawCount.value = 0
  autoArenaLoseCount.value = 0
  autoArenaTotalCount.value = 0
  autoArenaTotalPointsChange.value = 0
  autoArenaTotalGold.value = 0
  autoArenaTimerText.value = '00:00'
  autoArenaStatusText.value = '正在寻找最佳对手...'
  autoArenaCooldownSeconds.value = 0
  autoArenaDisplayCount.value = 0
  autoArenaRequestPending.value = false
  autoArenaLostToHigher = false
  autoArenaRefreshedNoHigher = false

  const runToken = ++autoArenaRunToken
  await acquireAutoArenaWakeLock()
  startAutoArenaTimer()

  // 确保有对手列表
  if (matchList.value.length === 0) {
    await fetchMatchList(false)
  }

  // 寻找第一个对手并设置场景
  const found = await findAndSetupNextOpponent(runToken, false)
  if (!found) {
    handleStopAutoArena({ finalStatusText: '⚠️ 未找到合适对手' })
    return false
  }

  // 立即发起第一场挑战（无冷却）
  await executeAutoArenaChallenge(runToken)
  return true
}

/**
 * 寻找最佳对手并设置对战场景
 * 策略：优先挑战高积分对手，全胜后刷新；输过则继续挑战低积分对手
 * @param {number} runToken
 * @param {boolean} useTransition - 是否使用场景过渡动画
 */
async function findAndSetupNextOpponent(runToken, useTransition) {
  autoArenaStatusText.value = '正在寻找最佳对手...'

  let result = findNextAutoArenaOpponent(
    autoArenaLostToHigher,
    autoArenaRefreshedNoHigher
  )

  // 需要刷新时，执行刷新并重新查找
  if (
    result.needRefresh &&
    !result.opponent &&
    autoArenaRunning.value &&
    runToken === autoArenaRunToken
  ) {
    autoArenaStatusText.value = '🔍 刷新对手列表...'

    const refreshed = await autoArenaRefreshMatchList(runToken)
    if (!autoArenaRunning.value || runToken !== autoArenaRunToken) return false
    if (!refreshed) return false

    // 刷新后重置 lostToHigher（新的列表可能有新的高积分对手）
    autoArenaLostToHigher = false
    // 标记已刷新过，后续不再因无高积分对手而重复刷新
    autoArenaRefreshedNoHigher = true
    result = findNextAutoArenaOpponent(
      autoArenaLostToHigher,
      autoArenaRefreshedNoHigher
    )

    // 如果刷新后有高积分对手了，重置标记（下次打完高积分后可以再刷新一次）
    if (result.opponent) {
      const myPoints = arenaInfo.value.registration?.points ?? 500
      if ((result.opponent.points ?? 0) > myPoints) {
        autoArenaRefreshedNoHigher = false
      }
    }
  }

  const bestOpponent = result.opponent
  if (!bestOpponent) return false

  // 设置场景
  autoArenaCurrentOpponent.value = bestOpponent
  autoArenaSceneLoser.value = ''

  if (useTransition) {
    autoArenaSceneKey.value++
    autoArenaSceneBattlePending.value = true
  } else {
    autoArenaScenePhase.value = 'battle'
  }

  return true
}

/**
 * 向当前显示的对手发起挑战
 */
async function executeAutoArenaChallenge(runToken) {
  if (!autoArenaRunning.value || runToken !== autoArenaRunToken) return

  const opponent = autoArenaCurrentOpponent.value
  if (!opponent) return

  autoArenaStatusText.value = `⚔️ 正在挑战「${opponent.guildName}」...`
  autoArenaRequestPending.value = true

  // 挑战前记录对手积分是否高于自己（使用最新积分比较）
  const myPointsBefore = arenaInfo.value.registration?.points ?? 500
  const opponentIsHigher = (opponent.points ?? 0) > myPointsBefore

  try {
    const res = await challengeOpponentApi({
      registrationId: opponent.registrationId
    })

    if (runToken !== autoArenaRunToken) return
    autoArenaRequestPending.value = false

    const result = res.data.data
    const winner = result.battleResult.winner

    // 更新统计
    autoArenaDisplayCount.value++
    autoArenaTotalCount.value++
    autoArenaTotalPointsChange.value += result.pointsChange
    autoArenaTotalGold.value += result.goldEarned || 0

    // 标记已挑战
    challengedOpponents.value.add(opponent._id)

    // 更新本地竞技场状态（避免触发全局loading）
    if (arenaInfo.value.registration) {
      arenaInfo.value.registration.points = result.newPoints
      arenaInfo.value.registration.challengeUses = Math.max(
        (arenaInfo.value.registration.challengeUses || 0) - 1,
        0
      )
      arenaInfo.value.registration.totalBattleCount =
        (arenaInfo.value.registration.totalBattleCount || 0) + 1
    }

    if (winner === 'attacker') {
      autoArenaWinCount.value++
      setAutoArenaSceneResult('attacker')
      autoArenaStatusText.value = `✅ 击败「${opponent.guildName}」+${formatNumberWithCommas(result.pointsChange)} pt`
    } else if (winner === 'draw') {
      autoArenaDrawCount.value++
      setAutoArenaSceneResult('draw')
      autoArenaStatusText.value = `🤝 与「${opponent.guildName}」平局`
    } else {
      // defender wins → 失败
      autoArenaLoseCount.value++
      setAutoArenaSceneResult('defender')
      autoArenaStatusText.value = `💀 败给「${opponent.guildName}」${result.pointsChange} pt`

      // 如果输给了高积分对手，标记以便后续不再刷新、继续挑战低积分对手
      if (opponentIsHigher) {
        autoArenaLostToHigher = true
      }
    }

    // 不论胜负，都继续（除非触发停止条件）
    fetchPlayerInfo()

    if (runToken !== autoArenaRunToken || !autoArenaRunning.value) return

    // 停止条件1：单次失败竞技点下降 >= 100
    if (result.pointsChange <= -100) {
      handleStopAutoArena({
        finalStatusText: `💀 单次竞技点下降 ${result.pointsChange}，自动对战结束`
      })
      return
    }

    // 停止条件2：本轮总竞技点收益 < -100
    if (autoArenaTotalPointsChange.value < -100) {
      handleStopAutoArena({
        finalStatusText: `💀 总竞技点收益 ${autoArenaTotalPointsChange.value}，自动对战结束`
      })
      return
    }

    // 停止条件3：挑战次数用完
    if ((arenaInfo.value.registration?.challengeUses ?? 0) <= 0) {
      handleStopAutoArena({
        finalStatusText: '📋 挑战次数已用完，自动对战结束'
      })
      return
    }

    // 260ms 后切换到下一个对手场景，然后开始冷却
    scheduleTransitionAndCooldown(runToken)
  } catch (err) {
    if (runToken !== autoArenaRunToken) return
    autoArenaRequestPending.value = false

    const errMsg = err.response?.data?.message || err.message || '请求失败'
    if (errMsg.includes('挑战次数不足')) {
      handleStopAutoArena({
        finalStatusText: '📋 挑战次数已用完，自动对战结束'
      })
    } else {
      handleStopAutoArena({ finalStatusText: `❌ ${errMsg}` })
    }
  }
}

/**
 * 胜利/平局后的场景切换和冷却
 * 流程：展示击败效果 260ms → 切换到下一个对手场景(战斗动画) → 3 秒冷却 → 发起挑战
 */
function scheduleTransitionAndCooldown(runToken) {
  clearAutoArenaSceneDelayTimer()

  autoArenaSceneDelayTimer = setTimeout(async () => {
    autoArenaSceneDelayTimer = null
    if (!autoArenaRunning.value || runToken !== autoArenaRunToken) return

    // 寻找下一个对手并切换场景（带过渡动画）
    const found = await findAndSetupNextOpponent(runToken, true)
    if (!found) {
      if (autoArenaRunning.value && runToken === autoArenaRunToken) {
        handleStopAutoArena({
          finalStatusText: '⚠️ 连续多次未找到合适对手，已停止'
        })
      }
      return
    }

    // 开始 3 秒冷却，冷却期间展示新对手的战斗动画
    startAutoArenaBattleCooldown(runToken)
  }, AUTO_ARENA_SCENE_SWITCH_MS)
}

/**
 * 战斗冷却倒计时，结束后发起挑战
 */
function startAutoArenaBattleCooldown(runToken) {
  clearAutoArenaCooldownTimer()
  const delaySec = Math.ceil(AUTO_ARENA_ROUND_DELAY_MS / 1000)
  autoArenaCooldownSeconds.value = delaySec

  autoArenaCooldownTimer = setInterval(() => {
    if (!autoArenaRunning.value || runToken !== autoArenaRunToken) {
      clearAutoArenaCooldownTimer()
      return
    }
    autoArenaCooldownSeconds.value--
    if (autoArenaCooldownSeconds.value <= 0) {
      clearAutoArenaCooldownTimer()
      autoArenaCooldownSeconds.value = 0
      // 冷却结束，向当前显示的对手发起挑战
      executeAutoArenaChallenge(runToken)
    }
  }, 1000)
}

function handleStopAutoArena(options = {}) {
  const finalStatusText = options?.finalStatusText || ''
  autoArenaRunToken++

  autoArenaRunning.value = false
  autoArenaRequestPending.value = false
  clearAutoArenaCooldownTimer()
  clearAutoArenaSceneDelayTimer()
  autoArenaSceneBattlePending.value = false
  stopAutoArenaTimer()
  releaseAutoArenaWakeLock()
  autoArenaCooldownSeconds.value = 0
  if (finalStatusText) {
    autoArenaStatusText.value = finalStatusText
  } else if (
    autoArenaStatusText.value.startsWith('⚔️') ||
    autoArenaStatusText.value.startsWith('正在')
  ) {
    autoArenaStatusText.value = '已停止'
  }
}

function cleanupAutoArena() {
  if (autoArenaRunning.value) {
    handleStopAutoArena()
  }
  clearAutoArenaCooldownTimer()
  clearAutoArenaSceneDelayTimer()
  if (autoArenaTimerInterval) {
    clearInterval(autoArenaTimerInterval)
    autoArenaTimerInterval = null
  }
  releaseAutoArenaWakeLock()
}

onMounted(async () => {
  await Promise.all([fetchArenaInfo(), fetchFormations()])
  if (arenaInfo.value.registration) {
    fetchMatchList()
    // 同时加载竞技场阵容，以便在匹配界面显示己方战斗力
    fetchArenaFormation()
  }
})

onBeforeUnmount(() => {
  if (refreshCooldownTimer) {
    clearInterval(refreshCooldownTimer)
    refreshCooldownTimer = null
  }
  cleanupAutoArena()
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

/* ══════════════════════════════════════════ */
/* ═══════ 自动竞技场对战样式 ════════════ */
/* ══════════════════════════════════════════ */

.auto-arena-stage {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.auto-arena-duel-frame {
  position: relative;
  min-height: 178px;
  padding: 20px 16px;
  overflow: hidden;
  border-radius: 22px;
  border: 1px solid rgba(148, 163, 184, 0.18);
  background:
    radial-gradient(
      circle at 18% 24%,
      rgba(59, 130, 246, 0.22),
      transparent 34%
    ),
    radial-gradient(
      circle at 82% 28%,
      rgba(248, 113, 113, 0.18),
      transparent 32%
    ),
    linear-gradient(180deg, rgba(11, 18, 32, 0.96), rgba(20, 26, 43, 0.98));
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.08),
    inset 0 -24px 48px rgba(15, 23, 42, 0.34),
    0 18px 40px rgba(2, 6, 23, 0.28);
}

.auto-arena-duel-frame::before {
  content: '';
  position: absolute;
  inset: 10px;
  border-radius: 18px;
  border: 1px solid rgba(255, 255, 255, 0.06);
  pointer-events: none;
}

.auto-arena-duel-frame::after {
  content: '';
  position: absolute;
  inset: 0;
  background:
    linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.05), transparent),
    radial-gradient(circle at center, rgba(250, 204, 21, 0.08), transparent 48%);
  opacity: 0.55;
  pointer-events: none;
}

.auto-arena-duel-scene {
  position: relative;
  z-index: 1;
  min-height: 138px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
}

.auto-arena-duel-loading {
  position: relative;
  z-index: 1;
  min-height: 138px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;
}

.auto-arena-duel-loading__spinner {
  width: 42px;
  height: 42px;
  border-radius: 999px;
  border: 3px solid rgba(148, 163, 184, 0.22);
  border-top-color: rgba(250, 204, 21, 0.96);
  border-right-color: rgba(96, 165, 250, 0.88);
  box-shadow: 0 0 16px rgba(250, 204, 21, 0.18);
  animation: autoArenaLoadingSpin 0.8s linear infinite;
}

.auto-arena-duel-loading__text {
  margin: 0;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.06em;
  color: rgba(226, 232, 240, 0.82);
}

.auto-arena-duel-settlement {
  position: relative;
  z-index: 1;
  min-height: 138px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  text-align: center;
}

.auto-arena-duel-settlement__title {
  margin: 0;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.18em;
  color: rgba(148, 163, 184, 0.86);
}

.auto-arena-duel-settlement__status {
  margin: 0;
  font-size: 18px;
  font-weight: 800;
  color: rgba(248, 250, 252, 0.96);
}

.auto-arena-duel-settlement__stats {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
  font-size: 12px;
  color: rgba(191, 219, 254, 0.82);
}

.auto-arena-duel-settlement__stats span {
  padding: 6px 10px;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.42);
  border: 1px solid rgba(148, 163, 184, 0.12);
}

.auto-arena-duel-side {
  position: relative;
  flex: 0 0 108px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  transition:
    opacity 0.3s ease,
    filter 0.3s ease,
    transform 0.3s ease;
}

.auto-arena-duel-side__halo {
  position: absolute;
  top: 6px;
  width: 74px;
  height: 74px;
  border-radius: 18px;
  filter: blur(18px);
  opacity: 0.82;
}

.auto-arena-duel-side__halo--ally {
  background: radial-gradient(
    circle,
    rgba(96, 165, 250, 0.52),
    transparent 72%
  );
}

.auto-arena-duel-side__halo--enemy {
  background: radial-gradient(
    circle,
    rgba(248, 113, 113, 0.52),
    transparent 72%
  );
}

.auto-arena-duel-avatar {
  position: relative;
  z-index: 1;
  width: 68px;
  height: 68px;
  border-radius: 18px;
  border: 3px solid rgba(200, 160, 80, 0.6);
  object-fit: cover;
  background: rgba(15, 23, 42, 0.82);
  box-shadow:
    0 10px 24px rgba(15, 23, 42, 0.35),
    inset 0 1px 0 rgba(255, 255, 255, 0.18);
  transition:
    opacity 0.3s ease,
    filter 0.3s ease,
    transform 0.3s ease;
}

.auto-arena-duel-side--ally .auto-arena-duel-avatar {
  border-color: rgba(96, 165, 250, 0.7);
  box-shadow:
    0 10px 24px rgba(15, 23, 42, 0.35),
    0 0 18px rgba(96, 165, 250, 0.25);
}

.auto-arena-duel-side--enemy .auto-arena-duel-avatar {
  border-color: rgba(248, 113, 113, 0.7);
  box-shadow:
    0 10px 24px rgba(15, 23, 42, 0.35),
    0 0 18px rgba(248, 113, 113, 0.25);
}

.auto-arena-duel-side__label {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 100px;
  padding: 0 4px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.04em;
  color: rgba(226, 232, 240, 0.84);
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.auto-arena-duel-side.is-defeated {
  filter: grayscale(1);
  opacity: 0.48;
  transform: scale(0.96);
}

.auto-arena-duel-scene.is-battling .auto-arena-duel-side--ally {
  animation: autoArenaDuelAdvance 0.68s cubic-bezier(0.42, 0, 0.24, 1) infinite;
}

.auto-arena-duel-scene.is-battling .auto-arena-duel-side--enemy {
  animation: autoArenaDuelBrace 0.68s cubic-bezier(0.42, 0, 0.24, 1) infinite;
}

.auto-arena-duel-impact {
  position: relative;
  flex: 1;
  min-width: 84px;
  max-width: 120px;
  height: 96px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition:
    opacity 0.3s ease,
    transform 0.3s ease;
}

.auto-arena-duel-impact:not(.active) {
  opacity: 0.36;
  transform: scale(0.92);
}

.auto-arena-duel-impact-core {
  position: absolute;
  width: 22px;
  height: 22px;
  border-radius: 999px;
  background: radial-gradient(
    circle,
    rgba(255, 255, 255, 0.98) 0%,
    rgba(254, 240, 138, 0.95) 24%,
    rgba(251, 191, 36, 0.92) 48%,
    rgba(249, 115, 22, 0.18) 74%,
    transparent 76%
  );
  box-shadow:
    0 0 18px rgba(251, 191, 36, 0.72),
    0 0 30px rgba(249, 115, 22, 0.34);
}

.auto-arena-duel-impact.active .auto-arena-duel-impact-core {
  animation: autoArenaDuelCorePulse 0.62s ease-out infinite;
}

.auto-arena-duel-impact-wave {
  position: absolute;
  border-radius: 999px;
  border: 1px solid rgba(253, 224, 71, 0.72);
  opacity: 0;
}

.auto-arena-duel-impact-wave--outer {
  width: 28px;
  height: 28px;
}

.auto-arena-duel-impact-wave--inner {
  width: 18px;
  height: 18px;
  border-color: rgba(255, 255, 255, 0.76);
}

.auto-arena-duel-impact.active .auto-arena-duel-impact-wave--outer {
  animation: autoArenaDuelWave 0.62s ease-out infinite;
}

.auto-arena-duel-impact.active .auto-arena-duel-impact-wave--inner {
  animation: autoArenaDuelWave 0.62s ease-out infinite 0.12s;
}

.auto-arena-duel-spark {
  position: absolute;
  width: 4px;
  height: var(--spark-size, 16px);
  border-radius: 999px;
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0),
    rgba(255, 248, 220, 0.96) 28%,
    rgba(251, 191, 36, 0.92) 60%,
    rgba(249, 115, 22, 0.12)
  );
  box-shadow: 0 0 8px rgba(251, 191, 36, 0.36);
  opacity: 0;
  transform-origin: 50% calc(100% - 2px);
}

.auto-arena-duel-impact.active .auto-arena-duel-spark {
  animation: autoArenaDuelSpark 0.62s ease-out infinite;
  animation-delay: var(--spark-delay, 0s);
}

.auto-arena-timer-card {
  padding: 12px 16px;
  border-radius: 18px;
  border: 1px solid rgba(148, 163, 184, 0.16);
  background: linear-gradient(
    180deg,
    rgba(15, 23, 42, 0.78),
    rgba(15, 23, 42, 0.56)
  );
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.05),
    0 10px 28px rgba(15, 23, 42, 0.2);
}

.auto-arena-timer-card__label {
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.22em;
  color: rgba(148, 163, 184, 0.9);
}

.auto-arena-timer-card__value {
  margin-top: 6px;
  font-size: 34px;
  line-height: 1;
  font-weight: 800;
  color: #f8fafc;
  font-family: 'JetBrains Mono', 'Consolas', 'SFMono-Regular', monospace;
  text-shadow: 0 0 16px rgba(250, 204, 21, 0.18);
}

.auto-arena-timer-card__hint {
  margin-top: 6px;
  font-size: 12px;
  color: rgba(191, 219, 254, 0.82);
}

.auto-arena-summary {
  transition: opacity 0.2s ease;
}

.auto-arena-summary--hidden {
  opacity: 0;
}

.auto-arena-duel-fade-enter-active,
.auto-arena-duel-fade-leave-active {
  transition:
    opacity 0.3s ease,
    transform 0.3s ease,
    filter 0.3s ease;
}

.auto-arena-duel-fade-enter-from,
.auto-arena-duel-fade-leave-to {
  opacity: 0;
  transform: translateY(6px) scale(0.94);
  filter: blur(4px);
}

@keyframes autoArenaDuelAdvance {
  0%,
  100% {
    transform: translateX(0) translateY(0) scale(1);
  }
  40% {
    transform: translateX(10px) translateY(-2px) scale(1.04);
  }
  70% {
    transform: translateX(4px) translateY(1px) scale(1.01);
  }
}

@keyframes autoArenaDuelBrace {
  0%,
  100% {
    transform: translateX(0) translateY(0) scale(1);
  }
  32% {
    transform: translateX(-8px) translateY(1px) scale(0.97) rotate(-2deg);
  }
  58% {
    transform: translateX(3px) translateY(-1px) scale(1.01) rotate(1deg);
  }
}

@keyframes autoArenaDuelCorePulse {
  0% {
    transform: scale(0.72);
    opacity: 0.7;
  }
  52% {
    transform: scale(1.18);
    opacity: 1;
  }
  100% {
    transform: scale(0.86);
    opacity: 0.8;
  }
}

@keyframes autoArenaDuelWave {
  0% {
    opacity: 0.76;
    transform: scale(0.42);
  }
  100% {
    opacity: 0;
    transform: scale(2.8);
  }
}

@keyframes autoArenaLoadingSpin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

@keyframes autoArenaDuelSpark {
  0% {
    opacity: 0;
    transform: rotate(var(--spark-angle, 0deg)) translateY(0) scaleY(0.72);
  }
  18% {
    opacity: 1;
  }
  100% {
    opacity: 0;
    transform: rotate(var(--spark-angle, 0deg))
      translateY(calc(var(--spark-distance, 22px) * -1)) scaleY(1.18);
  }
}

@media (max-width: 480px) {
  .auto-arena-duel-side {
    flex-basis: 92px;
  }

  .auto-arena-duel-side__label {
    max-width: 88px;
  }

  .auto-arena-duel-avatar {
    width: 56px;
    height: 56px;
  }
}
</style>

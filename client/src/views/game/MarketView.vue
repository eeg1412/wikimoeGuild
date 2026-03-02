<template>
  <div class="w-full py-6" style="min-height: 60vh">
    <!-- 页面标题 -->
    <div class="mb-6 text-center">
      <h1 class="rpg-title text-2xl font-bold text-gray-800 dark:text-gray-100">
        🏪 交易市场
      </h1>
      <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
        官方市场 & 自由市场
      </p>
    </div>

    <!-- 顶部标签页 -->
    <el-tabs v-model="activeTab" class="market-tabs mb-4">
      <el-tab-pane label="🏛️ 官方市场" name="official" />
      <el-tab-pane label="📦 素材交易" name="material" />
      <el-tab-pane label="💎 符文石交易" name="runeStone" />
    </el-tabs>

    <!-- ===== 官方市场 ===== -->
    <div v-if="activeTab === 'official'">
      <div v-if="officialLoading" class="flex justify-center py-12">
        <span class="animate-spin inline-block text-4xl">⏳</span>
      </div>
      <template v-else>
        <!-- 收购价格 / 出售价格 -->
        <div class="rpg-card rounded-xl p-4 mb-4">
          <div class="flex items-center justify-between mb-3">
            <span class="text-sm font-semibold text-gray-700 dark:text-gray-200"
              >💰 官方市场报价</span
            >
          </div>
          <div class="grid grid-cols-2 gap-3 text-sm">
            <div
              class="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 text-center"
            >
              <p class="text-sm text-gray-400 mb-1">收购单价</p>
              <p class="text-lg font-bold text-green-500">
                🪙 {{ officialInfo.buyPrice }}
              </p>
              <p class="text-xs text-gray-400">官方从你手中收购</p>
            </div>
            <div
              class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 text-center"
            >
              <p class="text-sm text-gray-400 mb-1">出售单价</p>
              <p class="text-lg font-bold text-blue-500">
                🪙 {{ officialInfo.sellPrice }}
              </p>
              <p class="text-xs text-gray-400">从官方购买</p>
            </div>
          </div>
        </div>

        <!-- 卖给官方 -->
        <div class="rpg-card rounded-xl p-4 mb-4">
          <h3
            class="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3"
          >
            📤 出售水晶给官方
          </h3>
          <!-- 玩家水晶持有量 -->
          <div class="grid grid-cols-2 gap-2 mb-3">
            <div
              v-for="c in crystalList"
              :key="'own-' + c.key"
              class="flex items-center gap-1.5 bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2 text-sm"
            >
              <span>{{ c.icon }}</span>
              <span class="text-gray-600 dark:text-gray-300">{{ c.name }}</span>
              <span class="ml-auto font-mono" :style="{ color: c.color }">{{
                playerInventory[c.key] ?? 0
              }}</span>
            </div>
          </div>
          <div class="flex items-center gap-2 mb-3">
            <el-select
              v-model="sellCrystalType"
              class="flex-1"
              placeholder="选择水晶类型"
              size="small"
            >
              <el-option
                v-for="c in crystalList"
                :key="c.key"
                :label="`${c.icon} ${c.name}水晶`"
                :value="c.key"
              />
            </el-select>
            <el-input-number
              v-model="sellCrystalQty"
              :min="1"
              :max="99999"
              size="small"
              class="w-28!"
            />
          </div>
          <div class="flex gap-2 mb-3">
            <el-button
              size="small"
              :loading="sellOfficialLoading"
              :disabled="sellOfficialLoading"
              @click="handleQuickSellToOfficial(10)"
              >快速 10</el-button
            >
            <el-button
              size="small"
              :loading="sellOfficialLoading"
              :disabled="sellOfficialLoading"
              @click="handleQuickSellToOfficial(100)"
              >快速 100</el-button
            >
            <el-button
              size="small"
              :loading="sellOfficialLoading"
              :disabled="sellOfficialLoading"
              @click="handleQuickSellToOfficial(1000)"
              >快速 1000</el-button
            >
          </div>
          <div class="text-sm text-gray-400 mb-2">
            预计获得:
            <span class="text-yellow-500 font-semibold"
              >🪙
              {{
                (sellCrystalQty * officialInfo.buyPrice).toLocaleString()
              }}</span
            >
          </div>
          <el-button
            type="success"
            class="w-full"
            size="small"
            :loading="sellOfficialLoading"
            :disabled="sellOfficialLoading"
            @click="handleSellToOfficial"
          >
            确认出售
          </el-button>
        </div>

        <!-- 从官方购买 -->
        <div class="rpg-card rounded-xl p-4 mb-4">
          <h3
            class="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3"
          >
            📥 从官方购买水晶
          </h3>
          <!-- 库存展示 -->
          <div class="grid grid-cols-2 gap-2 mb-3">
            <div
              v-for="c in crystalList"
              :key="c.key"
              class="flex items-center gap-1.5 bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2 text-sm"
            >
              <span>{{ c.icon }}</span>
              <span class="text-gray-600 dark:text-gray-300">{{ c.name }}</span>
              <span class="ml-auto font-mono" :style="{ color: c.color }">{{
                officialInfo.stock?.[c.key] ?? 0
              }}</span>
            </div>
          </div>
          <div class="flex items-center gap-2 mb-3">
            <el-select
              v-model="buyCrystalType"
              class="flex-1"
              placeholder="选择水晶类型"
              size="small"
            >
              <el-option
                v-for="c in crystalList"
                :key="c.key"
                :label="`${c.icon} ${c.name}水晶`"
                :value="c.key"
              />
            </el-select>
            <el-input-number
              v-model="buyCrystalQty"
              :min="1"
              :max="99999"
              size="small"
              class="w-28!"
            />
          </div>
          <div class="text-sm text-gray-400 mb-2">
            需要花费:
            <span class="text-yellow-500 font-semibold"
              >🪙
              {{
                (buyCrystalQty * officialInfo.sellPrice).toLocaleString()
              }}</span
            >
          </div>
          <el-button
            type="primary"
            class="w-full"
            size="small"
            :loading="buyOfficialLoading"
            :disabled="buyOfficialLoading"
            @click="handleBuyFromOfficial"
          >
            确认购买
          </el-button>
        </div>

        <!-- 出售符文石给官方 -->
        <div class="rpg-card rounded-xl p-4 mb-4">
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-200">
              💎 出售符文石给官方
            </h3>
            <el-button
              type="primary"
              text
              size="small"
              :loading="officialRsLoading"
              @click="loadOfficialRuneStones"
            >
              刷新列表
            </el-button>
          </div>

          <!-- 官方收购价 -->
          <div
            v-if="officialInfo.runeStoneOfficialPrices"
            class="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3 mb-3"
          >
            <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">
              💰 官方符文石收购报价
            </p>
            <div class="flex flex-wrap gap-2 text-xs">
              <span class="text-gray-600 dark:text-gray-300"
                >普通: 🪙
                {{ officialInfo.runeStoneOfficialPrices.normal }}</span
              >
              <span class="text-blue-500"
                >稀有: 🪙 {{ officialInfo.runeStoneOfficialPrices.rare }}</span
              >
              <span class="text-yellow-500"
                >传说: 🪙
                {{ officialInfo.runeStoneOfficialPrices.legendary }}</span
              >
            </div>
          </div>

          <!-- 稀有度筛选 -->
          <div class="flex items-center gap-2 mb-3">
            <el-select
              v-model="officialRsRarityFilter"
              size="small"
              placeholder="稀有度筛选"
              clearable
              style="width: 120px"
              @change="filterOfficialRuneStones"
            >
              <el-option label="普通" value="normal" />
              <el-option label="稀有" value="rare" />
              <el-option label="传说" value="legendary" />
            </el-select>
          </div>

          <div v-if="officialRsLoading" class="flex justify-center py-6">
            <span class="animate-spin inline-block text-2xl">⏳</span>
          </div>
          <div
            v-else-if="filteredOfficialRuneStones.length === 0"
            class="text-center py-6 text-gray-400 text-sm"
          >
            暂无可出售的符文石（需未装备且未上架）
          </div>
          <div v-else class="space-y-3">
            <div
              v-for="rs in filteredOfficialRuneStones"
              :key="rs._id"
              class="rpg-card rounded-xl p-3"
            >
              <!-- 顶部信息 -->
              <div class="flex items-center gap-3 mb-2">
                <div
                  class="w-10 h-10 rounded-lg flex items-center justify-center text-lg"
                  :class="rarityBgClass(rs.rarity)"
                >
                  💎
                </div>
                <div>
                  <p
                    class="text-sm font-semibold"
                    :class="rarityTextClass(rs.rarity)"
                  >
                    {{ rarityName(rs.rarity) }}符文石
                  </p>
                  <p class="text-sm text-gray-400">Lv.{{ rs.level }}</p>
                </div>
                <div class="ml-auto text-right">
                  <p class="text-xs text-gray-400">收购价</p>
                  <p class="text-sm text-yellow-500 font-semibold">
                    🪙
                    {{
                      officialInfo.runeStoneOfficialPrices?.[
                        rs.rarity
                      ]?.toLocaleString()
                    }}
                  </p>
                </div>
              </div>
              <!-- 完整技能/增益卡片 -->
              <RuneStoneInfoCard :rune-stone="rs" />
              <!-- 出售按钮 -->
              <div class="mt-3">
                <el-button
                  type="success"
                  class="w-full"
                  size="small"
                  :loading="sellRsOfficialLoading === rs._id"
                  :disabled="!!sellRsOfficialLoading"
                  @click="handleSellRuneStoneToOfficial(rs)"
                >
                  出售给官方
                </el-button>
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>

    <!-- ===== 素材交易 ===== -->
    <div v-if="activeTab === 'material'">
      <!-- 二级标签 -->
      <div class="flex justify-center gap-2 mb-4">
        <el-button
          :type="materialSubTab === 'sell' ? 'primary' : 'default'"
          size="small"
          @click="switchMaterialTab('sell')"
        >
          贩卖中
        </el-button>
        <el-button
          :type="materialSubTab === 'buy' ? 'primary' : 'default'"
          size="small"
          @click="switchMaterialTab('buy')"
        >
          求购中
        </el-button>
        <el-button
          :type="materialSubTab === 'my' ? 'warning' : 'default'"
          size="small"
          @click="switchMaterialTab('my')"
        >
          我的
        </el-button>
      </div>

      <!-- 筛选面板 -->
      <div v-if="materialSubTab !== 'my'" class="rpg-card rounded-xl p-3 mb-4">
        <div class="flex flex-wrap items-center gap-2">
          <el-select
            v-model="matFilter.materialType"
            placeholder="材料类型"
            clearable
            size="small"
            class="w-32!"
          >
            <el-option
              v-for="m in materialTypes"
              :key="m.key"
              :label="`${m.icon} ${m.name}`"
              :value="m.key"
            />
          </el-select>
          <el-button
            type="primary"
            text
            size="small"
            @click="handleFilterMaterial"
            >筛选</el-button
          >
        </div>
      </div>

      <!-- 我的 - 发布出售 -->
      <div v-if="materialSubTab === 'my'" class="rpg-card rounded-xl p-4 mb-4">
        <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">
          📝 发布出售
        </h3>
        <div class="flex flex-wrap items-center gap-2 mb-3">
          <el-select
            v-model="matSellForm.materialType"
            placeholder="材料类型"
            size="small"
            class="w-32!"
          >
            <el-option
              v-for="m in materialTypes"
              :key="m.key"
              :label="`${m.icon} ${m.name}`"
              :value="m.key"
            />
          </el-select>
          <el-input-number
            v-model="matSellForm.quantity"
            :min="1"
            :max="99999"
            size="small"
            class="w-24!"
            placeholder="数量"
          />
          <el-input-number
            v-model="matSellForm.unitPrice"
            :min="1"
            :max="2000000000"
            :step="100"
            size="small"
            class="w-32!"
            placeholder="单价"
          />
        </div>
        <div class="text-sm text-gray-400 mb-2">
          将扣除:
          <span class="text-yellow-500 font-semibold"
            >{{ matSellForm.quantity }} 个素材</span
          >
          <template v-if="matSellForm.unitPrice">
            ，预计获得:
            <span class="text-yellow-500 font-semibold"
              >🪙
              {{
                (matSellForm.quantity * matSellForm.unitPrice).toLocaleString()
              }}</span
            >
          </template>
        </div>
        <el-button
          type="primary"
          class="w-full"
          size="small"
          :loading="createMatSellLoading"
          :disabled="createMatSellLoading"
          @click="handleCreateMaterialSellOrder"
        >
          发布出售
        </el-button>
      </div>

      <!-- 我的 - 发布求购 -->
      <div v-if="materialSubTab === 'my'" class="rpg-card rounded-xl p-4 mb-4">
        <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">
          📝 发布求购
        </h3>
        <div class="flex flex-wrap items-center gap-2 mb-3">
          <el-select
            v-model="matBuyForm.materialType"
            placeholder="材料类型"
            size="small"
            class="w-32!"
          >
            <el-option
              v-for="m in materialTypes"
              :key="m.key"
              :label="`${m.icon} ${m.name}`"
              :value="m.key"
            />
          </el-select>
          <el-input-number
            v-model="matBuyForm.quantity"
            :min="1"
            :max="99999"
            size="small"
            class="w-24!"
            placeholder="数量"
          />
          <el-input-number
            v-model="matBuyForm.unitPrice"
            :min="1"
            :max="2000000000"
            :step="100"
            size="small"
            class="w-32!"
            placeholder="单价"
          />
        </div>
        <div class="text-sm text-gray-400 mb-2">
          需冻结金币:
          <span class="text-yellow-500 font-semibold"
            >🪙
            {{
              matBuyForm.unitPrice
                ? (matBuyForm.quantity * matBuyForm.unitPrice).toLocaleString()
                : '--'
            }}</span
          >
        </div>
        <el-button
          type="warning"
          class="w-full"
          size="small"
          :loading="createMatBuyLoading"
          :disabled="createMatBuyLoading"
          @click="handleCreateMaterialBuyOrder"
        >
          发布求购
        </el-button>
      </div>

      <!-- 订单列表 -->
      <div v-if="matOrdersLoading" class="flex justify-center py-8">
        <span class="animate-spin inline-block text-2xl">⏳</span>
      </div>
      <template v-else>
        <div
          v-if="matOrders.length === 0"
          class="text-center py-8 text-gray-400 text-sm"
        >
          暂无订单
        </div>
        <div v-else class="space-y-2">
          <div
            v-for="order in matOrders"
            :key="order._id"
            class="rpg-card rounded-xl p-3"
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span>{{ getMaterialIcon(order.materialType) }}</span>
                <div>
                  <p
                    class="text-sm font-semibold text-gray-700 dark:text-gray-200"
                  >
                    {{ getMaterialName(order.materialType) }}
                    <span class="text-xs text-gray-400 font-normal ml-1"
                      >x{{ order.quantity }}</span
                    >
                    <span
                      v-if="materialSubTab === 'my'"
                      class="text-xs ml-1 px-1.5 py-0.5 rounded-full"
                      :class="
                        order.orderType === 'sell'
                          ? 'text-green-500 border border-green-500'
                          : 'text-blue-500 border border-blue-500'
                      "
                    >
                      {{ order.orderType === 'sell' ? '出售' : '求购' }}
                    </span>
                  </p>
                  <p class="text-sm text-gray-400">
                    单价 🪙 {{ order.unitPrice?.toLocaleString() }} · 总价 🪙
                    {{ (order.quantity * order.unitPrice).toLocaleString() }}
                  </p>
                  <p
                    v-if="order.guildName"
                    class="text-xs text-gray-400 mt-0.5"
                  >
                    {{ order.guildName }}
                  </p>
                </div>
              </div>
              <div class="flex flex-col items-end gap-1">
                <template v-if="materialSubTab === 'my'">
                  <el-button
                    type="danger"
                    text
                    size="small"
                    :loading="cancelMatLoading === order._id"
                    :disabled="!!cancelMatLoading"
                    @click="handleCancelMaterialOrder(order)"
                  >
                    下架
                  </el-button>
                </template>
                <template v-else>
                  <el-button
                    type="primary"
                    size="small"
                    :loading="fulfillMatLoading === order._id"
                    :disabled="!!fulfillMatLoading"
                    @click="openFulfillDialog(order)"
                  >
                    {{ order.orderType === 'sell' ? '购买' : '出售' }}
                  </el-button>
                </template>
              </div>
            </div>
          </div>
        </div>

        <!-- 分页 -->
        <div
          v-if="matOrdersTotal > matPageSize"
          class="flex justify-center mt-4"
        >
          <el-pagination
            v-model:current-page="matPage"
            :page-size="matPageSize"
            :total="matOrdersTotal"
            layout="prev, pager, next"
            small
            @current-change="fetchMaterialOrders"
          />
        </div>
      </template>
    </div>

    <!-- 素材交易数量确认弹窗 -->
    <el-dialog
      v-model="fulfillDialogVisible"
      :title="
        fulfillDialogOrder?.orderType === 'sell' ? '购买素材' : '出售素材'
      "
      width="340px"
      align-center
      destroy-on-close
    >
      <div v-if="fulfillDialogOrder" class="space-y-3">
        <div class="text-sm text-gray-600 dark:text-gray-300">
          {{ getMaterialName(fulfillDialogOrder.materialType) }}
          · 单价 🪙 {{ fulfillDialogOrder.unitPrice?.toLocaleString() }} · 剩余
          x{{ fulfillDialogOrder.quantity }}
        </div>
        <div class="flex items-center gap-2">
          <span class="text-sm text-gray-500">数量:</span>
          <el-input-number
            v-model="fulfillQty"
            :min="1"
            :max="fulfillDialogOrder.quantity"
            size="small"
            class="flex-1"
          />
          <el-button text size="small" @click="handleFulfillSetMax"
            >全部</el-button
          >
        </div>
        <div class="text-sm text-gray-400">
          <template v-if="fulfillDialogOrder.orderType === 'sell'">
            需花费:
            <span class="text-yellow-500 font-semibold"
              >🪙
              {{
                (fulfillQty * fulfillDialogOrder.unitPrice).toLocaleString()
              }}</span
            >
          </template>
          <template v-else>
            将获得:
            <span class="text-yellow-500 font-semibold"
              >🪙
              {{
                (fulfillQty * fulfillDialogOrder.unitPrice).toLocaleString()
              }}</span
            >
          </template>
        </div>
      </div>
      <template #footer>
        <el-button size="small" @click="fulfillDialogVisible = false"
          >取消</el-button
        >
        <el-button
          type="primary"
          size="small"
          :loading="!!fulfillMatLoading"
          :disabled="!!fulfillMatLoading"
          @click="handleFulfillMaterialOrder"
        >
          确认{{ fulfillDialogOrder?.orderType === 'sell' ? '购买' : '出售' }}
        </el-button>
      </template>
    </el-dialog>

    <!-- ===== 符文石交易 ===== -->
    <div v-if="activeTab === 'runeStone'">
      <div class="flex justify-center gap-2 mb-4">
        <el-button
          :type="rsSubTab === 'market' ? 'primary' : 'default'"
          size="small"
          @click="switchRsTab('market')"
        >
          贩卖中
        </el-button>
        <el-button
          :type="rsSubTab === 'my' ? 'warning' : 'default'"
          size="small"
          @click="switchRsTab('my')"
        >
          我的
        </el-button>
      </div>

      <!-- 稀有度筛选 -->
      <div class="flex items-center gap-2 mb-3">
        <el-select
          v-model="rsMarketRarityFilter"
          size="small"
          placeholder="稀有度筛选"
          clearable
          style="width: 120px"
          @change="handleRsMarketRarityChange"
        >
          <el-option label="普通" value="normal" />
          <el-option label="稀有" value="rare" />
          <el-option label="传说" value="legendary" />
        </el-select>
      </div>

      <!-- 上架符文石 -->
      <div v-if="rsSubTab === 'my'" class="rpg-card rounded-xl p-4 mb-4">
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-200">
            📝 上架符文石
          </h3>
          <el-button
            type="primary"
            text
            size="small"
            :loading="myRuneStonesLoading"
            @click="loadMyRuneStones"
          >
            刷新列表
          </el-button>
        </div>

        <!-- 官方收购价参考 -->
        <div
          v-if="officialInfo.runeStoneOfficialPrices"
          class="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3 mb-3"
        >
          <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">
            ⚠️ 低于官方收购价的符文石将被官方立即收购
          </p>
          <div class="flex flex-wrap gap-2 text-xs">
            <span class="text-gray-600 dark:text-gray-300"
              >普通: 🪙 {{ officialInfo.runeStoneOfficialPrices.normal }}</span
            >
            <span class="text-blue-500"
              >稀有: 🪙 {{ officialInfo.runeStoneOfficialPrices.rare }}</span
            >
            <span class="text-yellow-500"
              >传说: 🪙
              {{ officialInfo.runeStoneOfficialPrices.legendary }}</span
            >
          </div>
        </div>

        <div v-if="myRuneStonesLoading" class="flex justify-center py-6">
          <span class="animate-spin inline-block text-2xl">⏳</span>
        </div>
        <div
          v-else-if="filteredMyRuneStones.length === 0"
          class="text-center py-6 text-gray-400 text-sm"
        >
          暂无可上架的符文石（需未装备且未上架）
        </div>
        <div v-else class="space-y-3">
          <div
            v-for="rs in filteredMyRuneStones"
            :key="rs._id"
            class="rpg-card rounded-xl p-3"
          >
            <!-- 顶部信息 -->
            <div class="flex items-center gap-3 mb-2">
              <div
                class="w-10 h-10 rounded-lg flex items-center justify-center text-lg"
                :class="rarityBgClass(rs.rarity)"
              >
                💎
              </div>
              <div>
                <p
                  class="text-sm font-semibold"
                  :class="rarityTextClass(rs.rarity)"
                >
                  {{ rarityName(rs.rarity) }}符文石
                </p>
                <p class="text-sm text-gray-400">Lv.{{ rs.level }}</p>
              </div>
            </div>
            <!-- 完整技能/增益卡片 -->
            <RuneStoneInfoCard :rune-stone="rs" />
            <!-- 价格输入 & 上架按钮 -->
            <div class="flex items-center gap-2 mt-3">
              <el-input-number
                v-model="rsListPriceMap[rs._id]"
                :min="1"
                :max="2000000000"
                :step="100"
                size="small"
                class="flex-1"
                placeholder="设置价格"
                controls-position="right"
              />
              <el-button
                type="primary"
                size="small"
                :loading="createRsListingLoading === rs._id"
                :disabled="!!createRsListingLoading"
                @click="handleCreateRuneStoneListing(rs)"
              >
                上架出售
              </el-button>
            </div>
          </div>
        </div>
      </div>

      <!-- 符文石列表 -->
      <div v-if="rsListingsLoading" class="flex justify-center py-8">
        <span class="animate-spin inline-block text-2xl">⏳</span>
      </div>
      <template v-else>
        <div
          v-if="rsListings.length === 0"
          class="text-center py-8 text-gray-400 text-sm"
        >
          暂无符文石上架
        </div>
        <div v-else class="space-y-2">
          <div
            v-for="listing in rsListings"
            :key="listing._id"
            class="rpg-card rounded-xl p-3"
          >
            <!-- 顶部：图标、名称、价格、操作 -->
            <div class="flex items-center justify-between mb-2">
              <div class="flex items-center gap-2">
                <div
                  class="w-10 h-10 rounded-lg flex items-center justify-center text-lg"
                  :class="rarityBgClass(listing.runeStone?.rarity)"
                >
                  💎
                </div>
                <div>
                  <p
                    class="text-sm font-semibold"
                    :class="rarityTextClass(listing.runeStone?.rarity)"
                  >
                    {{ rarityName(listing.runeStone?.rarity) }}符文石
                    <span class="text-xs text-gray-400 font-normal"
                      >Lv.{{ listing.runeStone?.level }}</span
                    >
                  </p>
                  <p class="text-sm text-yellow-500 font-semibold">
                    🪙 {{ listing.price?.toLocaleString() }}
                  </p>
                  <p
                    v-if="listing.guildName"
                    class="text-xs text-gray-400 mt-0.5"
                  >
                    {{ listing.guildName }}
                  </p>
                </div>
              </div>
              <div>
                <template v-if="listing.isMine">
                  <el-button
                    type="danger"
                    text
                    size="small"
                    :loading="cancelRsLoading === listing._id"
                    :disabled="!!cancelRsLoading"
                    @click="handleCancelRuneStoneListing(listing)"
                  >
                    下架
                  </el-button>
                </template>
                <template v-else>
                  <el-button
                    type="primary"
                    size="small"
                    :loading="buyRsLoading === listing._id"
                    :disabled="!!buyRsLoading"
                    @click="handleBuyRuneStone(listing)"
                  >
                    购买
                  </el-button>
                </template>
              </div>
            </div>
            <!-- 完整技能/增益卡片 -->
            <RuneStoneInfoCard :rune-stone="listing.runeStone" />
          </div>
        </div>

        <!-- 分页 -->
        <div
          v-if="rsListingsTotal > rsPageSize"
          class="flex justify-center mt-4"
        >
          <el-pagination
            v-model:current-page="rsPage"
            :page-size="rsPageSize"
            :total="rsListingsTotal"
            layout="prev, pager, next"
            small
            @current-change="fetchRuneStoneListings"
          />
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  getOfficialMarketInfoApi,
  sellCrystalToOfficialApi,
  buyCrystalFromOfficialApi,
  listMaterialSellOrdersApi,
  listMaterialBuyOrdersApi,
  createMaterialSellOrderApi,
  createMaterialBuyOrderApi,
  fulfillMaterialSellOrderApi,
  fulfillMaterialBuyOrderApi,
  cancelMaterialOrderApi,
  listMyMaterialOrdersApi,
  listRuneStoneListingsApi,
  createRuneStoneListingApi,
  buyRuneStoneListingApi,
  cancelRuneStoneListingApi,
  listMyRuneStoneListingsApi,
  sellRuneStoneToOfficialApi
} from '@/api/game/market.js'
import { getMyRuneStonesApi } from '@/api/game/runeStone.js'
import { getMyInventoryApi } from '@/api/game/inventory.js'
import { useGameUser } from '@/composables/useGameUser.js'
import RuneStoneInfoCard from '@/components/RuneStoneInfoCard.vue'
import { useDialogRoute } from '@/composables/useDialogRoute.js'

const router = useRouter()
const { isLoggedIn, fetchPlayerInfo } = useGameUser()
if (!isLoggedIn.value) {
  router.replace({ name: 'GameLogin' })
}

const crystalList = [
  { key: 'attackCrystal', name: '攻击', icon: '⚔️', color: '#e05c4f' },
  { key: 'defenseCrystal', name: '防御', icon: '🛡️', color: '#4fa3e0' },
  { key: 'speedCrystal', name: '速度', icon: '💨', color: '#6abf69' },
  { key: 'sanCrystal', name: 'SAN值', icon: '❤️', color: '#c070e0' }
]

const materialTypes = [
  { key: 'attackCrystal', name: '攻击水晶', icon: '⚔️' },
  { key: 'defenseCrystal', name: '防御水晶', icon: '🛡️' },
  { key: 'speedCrystal', name: '速度水晶', icon: '💨' },
  { key: 'sanCrystal', name: 'SAN值水晶', icon: '❤️' },
  { key: 'runeFragment', name: '符文石碎片', icon: '🔮' }
]

function getMaterialIcon(type) {
  return materialTypes.find(m => m.key === type)?.icon || '📦'
}
function getMaterialName(type) {
  return materialTypes.find(m => m.key === type)?.name || type
}

// ===== 标签页 =====
const activeTab = ref('official')

// ===== 官方市场 =====
const officialLoading = ref(false)
const officialInfo = ref({ buyPrice: 0, sellPrice: 0, stock: {} })

const sellCrystalType = ref('attackCrystal')
const sellCrystalQty = ref(1)
const sellOfficialLoading = ref(false)

const buyCrystalType = ref('attackCrystal')
const buyCrystalQty = ref(1)
const buyOfficialLoading = ref(false)

// 玩家水晶库存
const playerInventory = ref({})

async function fetchPlayerInventory() {
  try {
    const res = await getMyInventoryApi()
    playerInventory.value = res.data.data || {}
  } catch {}
}

async function fetchOfficialInfo() {
  officialLoading.value = true
  try {
    const res = await getOfficialMarketInfoApi()
    officialInfo.value = res.data.data || {}
  } catch {
  } finally {
    officialLoading.value = false
  }
}

async function handleSellToOfficial() {
  try {
    await ElMessageBox.confirm(
      `确定出售 ${sellCrystalQty.value} 个${getMaterialName(sellCrystalType.value)}？预计获得 ${(sellCrystalQty.value * officialInfo.value.buyPrice).toLocaleString()} 金币`,
      '确认出售',
      { confirmButtonText: '出售', cancelButtonText: '取消' }
    )
  } catch {
    return
  }

  sellOfficialLoading.value = true
  try {
    await sellCrystalToOfficialApi({
      crystalType: sellCrystalType.value,
      quantity: sellCrystalQty.value
    })
    ElMessage.success('出售成功！')
    await fetchOfficialInfo()
    await fetchPlayerInfo()
    await fetchPlayerInventory()
  } catch {
    // 错误已由拦截器处理
  } finally {
    sellOfficialLoading.value = false
  }
}

async function handleQuickSellToOfficial(qty) {
  sellOfficialLoading.value = true
  try {
    await sellCrystalToOfficialApi({
      crystalType: sellCrystalType.value,
      quantity: qty
    })
    ElMessage.success('出售成功！')
    await fetchOfficialInfo()
    await fetchPlayerInfo()
    await fetchPlayerInventory()
  } catch {
    // 错误已由拦截器处理
  } finally {
    sellOfficialLoading.value = false
  }
}

async function handleBuyFromOfficial() {
  try {
    await ElMessageBox.confirm(
      `确定购买 ${buyCrystalQty.value} 个${getMaterialName(buyCrystalType.value)}？需花费 ${(buyCrystalQty.value * officialInfo.value.sellPrice).toLocaleString()} 金币`,
      '确认购买',
      { confirmButtonText: '购买', cancelButtonText: '取消' }
    )
  } catch {
    return
  }

  buyOfficialLoading.value = true
  try {
    await buyCrystalFromOfficialApi({
      crystalType: buyCrystalType.value,
      quantity: buyCrystalQty.value
    })
    ElMessage.success('购买成功！')
    await fetchOfficialInfo()
    await fetchPlayerInfo()
    await fetchPlayerInventory()
  } catch {
    // 错误已由拦截器处理
  } finally {
    buyOfficialLoading.value = false
  }
}

// ===== 素材交易 =====
const materialSubTab = ref('sell')
const matFilter = reactive({ materialType: '' })
const matOrders = ref([])
const matOrdersLoading = ref(false)
const matPage = ref(1)
const matPageSize = 20
const matOrdersTotal = ref(0)

const matSellForm = reactive({
  materialType: 'attackCrystal',
  quantity: 1,
  unitPrice: null
})
const matBuyForm = reactive({
  materialType: 'attackCrystal',
  quantity: 1,
  unitPrice: null
})
const createMatSellLoading = ref(false)
const createMatBuyLoading = ref(false)
const fulfillMatLoading = ref(null)
const cancelMatLoading = ref(null)

// 素材交易数量确认弹窗
const { visible: fulfillDialogVisible } = useDialogRoute('fulfillDialog')
const fulfillDialogOrder = ref(null)
const fulfillQty = ref(1)

function switchMaterialTab(tab) {
  materialSubTab.value = tab
  matPage.value = 1
  fetchMaterialOrders()
}

function handleFilterMaterial() {
  matPage.value = 1
  fetchMaterialOrders()
}

async function fetchMaterialOrders() {
  matOrdersLoading.value = true
  try {
    const params = { page: matPage.value, pageSize: matPageSize }
    if (materialSubTab.value !== 'my' && matFilter.materialType) {
      params.materialType = matFilter.materialType
    }
    let res
    if (materialSubTab.value === 'my') {
      res = await listMyMaterialOrdersApi({ ...params, status: 'active' })
      matOrders.value = res.data.data?.list || []
      matOrdersTotal.value = res.data.data?.total || 0
    } else if (materialSubTab.value === 'sell') {
      res = await listMaterialSellOrdersApi(params)
      matOrders.value = res.data.data?.list || []
      matOrdersTotal.value = res.data.data?.total || 0
    } else {
      res = await listMaterialBuyOrdersApi(params)
      matOrders.value = res.data.data?.list || []
      matOrdersTotal.value = res.data.data?.total || 0
    }
  } catch {
    matOrders.value = []
  } finally {
    matOrdersLoading.value = false
  }
}

async function handleCreateMaterialSellOrder() {
  if (!matSellForm.unitPrice || matSellForm.unitPrice <= 0) {
    ElMessage.warning('请设置单价')
    return
  }
  try {
    await ElMessageBox.confirm(
      `确定发布出售 ${matSellForm.quantity} 个 ${getMaterialName(matSellForm.materialType)}？\n单价: ${matSellForm.unitPrice.toLocaleString()} 金币`,
      '确认发布出售',
      { confirmButtonText: '确认发布', cancelButtonText: '取消' }
    )
  } catch {
    return
  }

  createMatSellLoading.value = true
  try {
    await createMaterialSellOrderApi({
      materialType: matSellForm.materialType,
      quantity: matSellForm.quantity,
      unitPrice: matSellForm.unitPrice
    })
    ElMessage.success('出售订单发布成功！')
    await fetchMaterialOrders()
    await fetchPlayerInfo()
    await fetchPlayerInventory()
  } catch {
    // 错误已由拦截器处理
  } finally {
    createMatSellLoading.value = false
  }
}

async function handleCreateMaterialBuyOrder() {
  if (!matBuyForm.unitPrice || matBuyForm.unitPrice <= 0) {
    ElMessage.warning('请设置单价')
    return
  }
  const totalCost = matBuyForm.quantity * matBuyForm.unitPrice
  try {
    await ElMessageBox.confirm(
      `确定发布求购 ${matBuyForm.quantity} 个 ${getMaterialName(matBuyForm.materialType)}？\n单价: ${matBuyForm.unitPrice.toLocaleString()} 金币\n将冻结: ${totalCost.toLocaleString()} 金币`,
      '确认发布求购',
      { confirmButtonText: '确认发布', cancelButtonText: '取消' }
    )
  } catch {
    return
  }

  createMatBuyLoading.value = true
  try {
    await createMaterialBuyOrderApi({
      materialType: matBuyForm.materialType,
      quantity: matBuyForm.quantity,
      unitPrice: matBuyForm.unitPrice
    })
    ElMessage.success('求购订单发布成功！')
    await fetchMaterialOrders()
    await fetchPlayerInfo()
  } catch {
    // 错误已由拦截器处理
  } finally {
    createMatBuyLoading.value = false
  }
}

function openFulfillDialog(order) {
  fulfillDialogOrder.value = order
  fulfillQty.value = order.quantity
  fulfillDialogVisible.value = true
}

function handleFulfillSetMax() {
  if (fulfillDialogOrder.value) {
    fulfillQty.value = fulfillDialogOrder.value.quantity
  }
}

async function handleFulfillMaterialOrder() {
  const order = fulfillDialogOrder.value
  if (!order) return
  const isSell = order.orderType === 'sell'

  fulfillMatLoading.value = order._id
  try {
    if (isSell) {
      await fulfillMaterialSellOrderApi(order._id, {
        quantity: fulfillQty.value
      })
    } else {
      await fulfillMaterialBuyOrderApi(order._id, {
        quantity: fulfillQty.value
      })
    }
    ElMessage.success('交易完成！')
    fulfillDialogVisible.value = false
    await fetchMaterialOrders()
    await fetchPlayerInfo()
    await fetchPlayerInventory()
  } catch {
    // 错误已由拦截器处理
  } finally {
    fulfillMatLoading.value = null
  }
}

async function handleCancelMaterialOrder(order) {
  try {
    await ElMessageBox.confirm('确定下架该订单？素材或金币将退还', '确认下架', {
      confirmButtonText: '下架',
      cancelButtonText: '取消',
      type: 'warning'
    })
  } catch {
    return
  }

  cancelMatLoading.value = order._id
  try {
    await cancelMaterialOrderApi(order._id)
    ElMessage.success('已下架，资源已退还')
    await fetchMaterialOrders()
    await fetchPlayerInfo()
  } catch {
    // 错误已由拦截器处理
  } finally {
    cancelMatLoading.value = null
  }
}

// ===== 符文石交易 =====
const rsSubTab = ref('market')
const rsListings = ref([])
const rsListingsLoading = ref(false)
const rsPage = ref(1)
const rsPageSize = 20
const rsListingsTotal = ref(0)

const myRuneStones = ref([])
const myRuneStonesLoading = ref(false)
const rsListPriceMap = reactive({})
const createRsListingLoading = ref(null)
const buyRsLoading = ref(null)
const cancelRsLoading = ref(null)

// 符文石市场稀有度筛选
const rsMarketRarityFilter = ref('')

// 「我的」上架列表客户端筛选(复用rsMarketRarityFilter)
const filteredMyRuneStones = computed(() => {
  if (!rsMarketRarityFilter.value) return myRuneStones.value
  return myRuneStones.value.filter(
    rs => rs.rarity === rsMarketRarityFilter.value
  )
})

// ===== 官方市场 - 出售符文石 =====
const officialRuneStones = ref([])
const officialRsLoading = ref(false)
const sellRsOfficialLoading = ref(null)
const officialRsRarityFilter = ref('')

const filteredOfficialRuneStones = computed(() => {
  if (!officialRsRarityFilter.value) return officialRuneStones.value
  return officialRuneStones.value.filter(
    rs => rs.rarity === officialRsRarityFilter.value
  )
})

function filterOfficialRuneStones() {
  // 仅触发 computed 重算，无需额外操作
}

async function loadOfficialRuneStones() {
  officialRsLoading.value = true
  try {
    const res = await getMyRuneStonesApi({ pageSize: 999 })
    officialRuneStones.value = (res.data.data?.list || []).filter(
      rs => !rs.equippedBy && !rs.listedOnMarket
    )
  } catch {
  } finally {
    officialRsLoading.value = false
  }
}

async function handleSellRuneStoneToOfficial(rs) {
  const officialPrices = officialInfo.value.runeStoneOfficialPrices || {}
  const price = officialPrices[rs.rarity] || 0
  try {
    await ElMessageBox.confirm(
      `确定将这块 ${rarityName(rs.rarity)} Lv.${rs.level} 符文石出售给官方？\n获得: ${price.toLocaleString()} 金币`,
      '确认出售给官方',
      { confirmButtonText: '确认出售', cancelButtonText: '取消' }
    )
  } catch {
    return
  }

  sellRsOfficialLoading.value = rs._id
  try {
    const res = await sellRuneStoneToOfficialApi({ runeStoneId: rs._id })
    const data = res.data.data
    ElMessage.success(
      `出售成功！获得 ${(data?.goldEarned || price).toLocaleString()} 金币`
    )
    await loadOfficialRuneStones()
    await fetchPlayerInfo()
  } catch {
    // 错误已由拦截器处理
  } finally {
    sellRsOfficialLoading.value = null
  }
}

function handleRsMarketRarityChange() {
  rsPage.value = 1
  fetchRuneStoneListings()
}

function switchRsTab(tab) {
  rsSubTab.value = tab
  rsPage.value = 1
  fetchRuneStoneListings()
  if (tab === 'my') {
    loadMyRuneStones()
  }
}

async function fetchRuneStoneListings() {
  rsListingsLoading.value = true
  try {
    const params = { page: rsPage.value, pageSize: rsPageSize }
    if (rsMarketRarityFilter.value) {
      params.rarity = rsMarketRarityFilter.value
    }
    let res
    if (rsSubTab.value === 'my') {
      res = await listMyRuneStoneListingsApi({ ...params, status: 'active' })
      let list = (res.data.data?.list || []).map(l => ({
        ...l,
        isMine: true
      }))
      // 「我的」上架列表客户端筛选稀有度
      if (rsMarketRarityFilter.value) {
        list = list.filter(
          l => l.runeStone?.rarity === rsMarketRarityFilter.value
        )
      }
      rsListings.value = list
    } else {
      res = await listRuneStoneListingsApi(params)
      rsListings.value = (res.data.data?.list || []).map(l => ({
        ...l,
        isMine: false
      }))
    }
    rsListingsTotal.value = res.data.data?.total || 0
  } catch {
    rsListings.value = []
  } finally {
    rsListingsLoading.value = false
  }
}

async function loadMyRuneStones() {
  myRuneStonesLoading.value = true
  try {
    const res = await getMyRuneStonesApi({ pageSize: 999 })
    // 只显示未装备且未上架的
    myRuneStones.value = (res.data.data?.list || []).filter(
      rs => !rs.equippedBy && !rs.listedOnMarket
    )
  } catch {
  } finally {
    myRuneStonesLoading.value = false
  }
}

async function handleCreateRuneStoneListing(rs) {
  const price = rsListPriceMap[rs._id]
  if (!price || price <= 0) {
    ElMessage.warning('请设置价格')
    return
  }

  // 检查是否低于官方收购价
  const officialPrices = officialInfo.value.runeStoneOfficialPrices || {}
  const officialPrice = officialPrices[rs.rarity]
  if (officialPrice && price <= officialPrice) {
    try {
      await ElMessageBox.confirm(
        `你设置的价格 ${price.toLocaleString()} 金币低于或等于官方收购价 ${officialPrice.toLocaleString()} 金币，该符文石将被官方立即收购，你将获得 ${officialPrice.toLocaleString()} 金币。是否继续？`,
        '⚠️ 官方收购提示',
        {
          confirmButtonText: '确认出售给官方',
          cancelButtonText: '取消',
          type: 'warning'
        }
      )
    } catch {
      return
    }
  } else {
    try {
      await ElMessageBox.confirm(
        `确定以 ${price.toLocaleString()} 金币的价格上架该 ${rarityName(rs.rarity)} Lv.${rs.level} 符文石？`,
        '确认上架',
        { confirmButtonText: '确认上架', cancelButtonText: '取消' }
      )
    } catch {
      return
    }
  }

  createRsListingLoading.value = rs._id
  try {
    const res = await createRuneStoneListingApi({
      runeStoneId: rs._id,
      price
    })
    const result = res.data.data
    if (result?.officialPurchased) {
      await ElMessageBox.alert(
        `你的 ${rarityName(rs.rarity)} Lv.${rs.level} 符文石已被官方市场以 ${result.goldEarned.toLocaleString()} 金币收购！`,
        '🏛️ 官方收购完成',
        { confirmButtonText: '确定', type: 'success' }
      )
      await fetchPlayerInfo()
    } else {
      ElMessage.success('符文石已上架！')
    }
    delete rsListPriceMap[rs._id]
    await loadMyRuneStones()
    await fetchRuneStoneListings()
  } catch {
    // 错误已由拦截器处理
  } finally {
    createRsListingLoading.value = null
  }
}

async function handleBuyRuneStone(listing) {
  try {
    await ElMessageBox.confirm(
      `确定购买这个${rarityName(listing.runeStone?.rarity)}符文石？花费 ${listing.price?.toLocaleString()} 金币`,
      '确认购买',
      { confirmButtonText: '购买', cancelButtonText: '取消' }
    )
  } catch {
    return
  }

  buyRsLoading.value = listing._id
  try {
    await buyRuneStoneListingApi(listing._id)
    ElMessage.success('购买成功！')
    await fetchRuneStoneListings()
    await fetchPlayerInfo()
  } catch {
    // 错误已由拦截器处理
  } finally {
    buyRsLoading.value = null
  }
}

async function handleCancelRuneStoneListing(listing) {
  try {
    await ElMessageBox.confirm('确定下架该符文石？', '确认下架', {
      confirmButtonText: '下架',
      cancelButtonText: '取消',
      type: 'warning'
    })
  } catch {
    return
  }

  cancelRsLoading.value = listing._id
  try {
    await cancelRuneStoneListingApi(listing._id)
    ElMessage.success('已下架，符文石已退还')
    await fetchRuneStoneListings()
  } catch {
    // 错误已由拦截器处理
  } finally {
    cancelRsLoading.value = null
  }
}

// ===== 工具函数 =====
function rarityName(r) {
  return { normal: '普通', rare: '稀有', legendary: '传说' }[r] || r
}
function rarityTextClass(r) {
  return (
    {
      normal: 'text-gray-600 dark:text-gray-300',
      rare: 'text-blue-500',
      legendary: 'text-yellow-500'
    }[r] || ''
  )
}
function rarityBgClass(r) {
  return (
    {
      normal: 'bg-gray-200 dark:bg-gray-700',
      rare: 'bg-blue-100 dark:bg-blue-900/30',
      legendary: 'bg-yellow-100 dark:bg-yellow-900/30'
    }[r] || ''
  )
}

onMounted(() => {
  fetchOfficialInfo()
  fetchPlayerInventory()
  loadOfficialRuneStones()
})

// 切换顶级标签时自动加载对应数据
watch(activeTab, tab => {
  if (tab === 'material') {
    fetchMaterialOrders()
  } else if (tab === 'runeStone') {
    fetchRuneStoneListings()
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
.market-tabs :deep(.el-tabs__nav-wrap) {
  justify-content: center;
}
</style>

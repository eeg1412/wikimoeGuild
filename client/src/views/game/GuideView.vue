<template>
  <div class="w-full py-6">
    <!-- 页面标题 -->
    <div class="text-center mb-6">
      <span class="text-5xl mb-3 block">📖</span>
      <h2 class="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-1">
        新手手册
      </h2>
      <p class="text-sm text-gray-500 dark:text-gray-400">
        了解游戏的各个系统，快速上手冒险之旅
      </p>
    </div>

    <!-- Tab 切换 -->
    <div class="guide-tabs mb-4">
      <div class="flex flex-wrap gap-1 justify-center px-1">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          class="guide-tab-btn"
          :class="{ 'guide-tab-btn--active': activeTab === tab.key }"
          @click="handleSwitchTab(tab.key)"
        >
          <span class="mr-1">{{ tab.icon }}</span>
          <span>{{ tab.label }}</span>
        </button>
      </div>
    </div>

    <!-- 内容区域 -->
    <div class="rpg-card rounded-xl p-5">
      <!-- 游戏概览 -->
      <div v-if="activeTab === 'overview'">
        <h3 class="guide-section-title">🗺️ 游戏概览</h3>
        <p class="guide-text mb-4">
          这是一款放置类的冒险公会经营游戏。你将建立自己的公会，招募冒险家，探索地下迷宫，收集资源与符文石，不断壮大公会力量！
        </p>

        <div class="guide-card mb-4">
          <h4 class="guide-subtitle">🎯 核心游戏流程</h4>
          <div class="guide-flow">
            <div class="guide-flow-item">
              <span class="guide-flow-icon">🏰</span>
              <span class="guide-flow-text">地下迷宫刷素材/符文石</span>
            </div>
            <span class="guide-flow-arrow">→</span>
            <div class="guide-flow-item">
              <span class="guide-flow-icon">⚔️</span>
              <span class="guide-flow-text">升级冒险家</span>
            </div>
            <span class="guide-flow-arrow">→</span>
            <div class="guide-flow-item">
              <span class="guide-flow-icon">👹</span>
              <span class="guide-flow-text">挑战迷宫军团</span>
            </div>
            <span class="guide-flow-arrow">→</span>
            <div class="guide-flow-item">
              <span class="guide-flow-icon">⬆️</span>
              <span class="guide-flow-text">升级迷宫</span>
            </div>
            <span class="guide-flow-arrow">→</span>
            <div class="guide-flow-item">
              <span class="guide-flow-icon">💎</span>
              <span class="guide-flow-text">获取更高级符文石</span>
            </div>
          </div>
        </div>

        <div class="guide-card">
          <h4 class="guide-subtitle">🎮 其他玩法</h4>
          <ul class="guide-list">
            <li>在<strong>自由市场</strong>与其他玩家交易素材和符文石</li>
            <li>在<strong>矿场</strong>手动挖掘获取水晶和符文石</li>
            <li>在<strong>竞技场</strong>与其他玩家对战，赢取金币和荣誉</li>
            <li>每种素材最大堆叠数量为 <strong>9,999,999</strong></li>
          </ul>
        </div>
      </div>

      <!-- 冒险家 -->
      <div v-if="activeTab === 'adventurer'">
        <h3 class="guide-section-title">⚔️ 冒险家系统</h3>

        <div class="guide-card mb-4">
          <h4 class="guide-subtitle">📌 基本信息</h4>
          <ul class="guide-list">
            <li>注册时自动获取 <strong>1 名</strong>冒险家</li>
            <li>
              可通过支付
              <strong>{{ gameSettings.adventurerRecruitPrice }}</strong> 🪙
              招募更多冒险家
            </li>
            <li>每个账号最多可招募 <strong>50 名</strong>冒险家</li>
          </ul>
        </div>

        <div class="guide-card mb-4">
          <h4 class="guide-subtitle">📊 冒险家属性</h4>
          <div class="overflow-x-auto">
            <table class="guide-table">
              <thead>
                <tr>
                  <th>属性</th>
                  <th>基础值</th>
                  <th>说明</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>⚔️ 攻击</td>
                  <td>100</td>
                  <td>实际攻击 = 基础值 × 攻击等级</td>
                </tr>
                <tr>
                  <td>🛡️ 防御</td>
                  <td>100</td>
                  <td>实际防御 = 基础值 × 防御等级</td>
                </tr>
                <tr>
                  <td>💨 速度</td>
                  <td>100</td>
                  <td>实际速度 = 基础值 × 速度等级</td>
                </tr>
                <tr>
                  <td>🧠 SAN</td>
                  <td>150</td>
                  <td>实际SAN = 基础值 × SAN等级，归0则无法战斗</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p class="guide-note mt-2">
            💡 综合等级 = 攻击 + 防御 + 速度 + SAN 四项等级总和
          </p>
        </div>

        <div class="guide-card mb-4">
          <h4 class="guide-subtitle">🔮 元素系统</h4>
          <p class="guide-text mb-2">
            每名冒险家拥有一种元素属性，元素之间存在克制关系：
          </p>
          <div class="guide-element-chain">
            <div class="guide-element-group">
              <span class="guide-element">🌊 水</span>
              <span class="guide-element-arrow">→</span>
              <span class="guide-element">🔥 火</span>
              <span class="guide-element-arrow">→</span>
              <span class="guide-element">🌪️ 风</span>
              <span class="guide-element-arrow">→</span>
              <span class="guide-element">🪨 地</span>
              <span class="guide-element-arrow">→</span>
              <span class="guide-element">🌊 水</span>
            </div>
            <div class="guide-element-group mt-2">
              <span class="guide-element">☀️ 光明</span>
              <span class="guide-element-arrow">↔</span>
              <span class="guide-element">🌑 黑暗</span>
            </div>
          </div>
          <p class="guide-note mt-2">
            ⚠️ 被克制时受到的伤害为 <strong>150%</strong>
          </p>
        </div>

        <div class="guide-card mb-4">
          <h4 class="guide-subtitle">⬆️ 属性升级</h4>
          <p class="text-sm text-gray-500 dark:text-gray-400 mb-2">
            升级消耗根据当前属性等级动态变化：<br />
            水晶消耗 = ⌊基础值 × (1 + 当前等级 × 0.1)⌋<br />
            金币消耗 = ⌊基础值 × (1 + 当前等级 × 0.1)⌋
          </p>
          <div class="overflow-x-auto">
            <table class="guide-table">
              <thead>
                <tr>
                  <th>升级项</th>
                  <th>
                    所需水晶（基础
                    {{ gameSettings.adventurerLevelUpCrystalBase ?? 100 }}）
                  </th>
                  <th>
                    所需金币（基础
                    {{ gameSettings.adventurerLevelUpGoldBase ?? 500 }}）
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>⚔️ 攻击等级</td>
                  <td>攻击水晶 × 公式</td>
                  <td>金币 × 公式</td>
                </tr>
                <tr>
                  <td>🛡️ 防御等级</td>
                  <td>防御水晶 × 公式</td>
                  <td>金币 × 公式</td>
                </tr>
                <tr>
                  <td>💨 速度等级</td>
                  <td>速度水晶 × 公式</td>
                  <td>金币 × 公式</td>
                </tr>
                <tr>
                  <td>🧠 SAN等级</td>
                  <td>SAN水晶 × 公式</td>
                  <td>金币 × 公式</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p class="text-xs text-gray-400 mt-1">
            冒险家综合等级上限由公会等级决定（公会等级 × 10）
          </p>
        </div>

        <div class="guide-card mb-4">
          <h4 class="guide-subtitle">⬇️ 属性降级</h4>
          <p class="text-sm text-gray-500 dark:text-gray-400 mb-2">
            可以使用金币降低某个属性的等级：<br />
            降级费用 = 降级层数 × 每级固定消耗（默认
            {{ gameSettings.adventurerLevelDownGoldPrice ?? 1000 }}
            金币）。<br />
            属性最低降至 1 级。属性降级不退还升级时消耗的水晶与金币。
          </p>
        </div>

        <div class="guide-card">
          <h4 class="guide-subtitle">✨ 个性化</h4>
          <ul class="guide-list">
            <li>
              可消耗
              <strong>{{ gameSettings.adventurerCustomAvatarPrice }}</strong> 🪙
              自定义冒险家<strong>头像</strong>
            </li>
            <li>
              可消耗
              <strong>{{ gameSettings.adventurerCustomNamePrice }}</strong> 🪙
              自定义冒险家<strong>名字</strong>
            </li>
          </ul>
        </div>
      </div>

      <!-- 战斗系统 -->
      <div v-if="activeTab === 'battle'">
        <h3 class="guide-section-title">⚔️ 战斗系统</h3>

        <div class="guide-card mb-4">
          <h4 class="guide-subtitle">🏗️ 阵容配置</h4>
          <ul class="guide-list">
            <li>最多可预设 <strong>10 种</strong>阵容配置</li>
            <li>
              在 <strong>5×5</strong> 的棋盘上配置最多
              <strong>25 名</strong>冒险家
            </li>
          </ul>
        </div>

        <div class="guide-card mb-4">
          <h4 class="guide-subtitle">📜 战斗规则</h4>
          <ul class="guide-list">
            <li>战斗在 <strong>5×5</strong> 的棋盘上进行，回合制结算</li>
            <li>
              冒险家只能攻击<strong>敌方最前排</strong>，消灭第一排后才能攻击第二排
            </li>
            <li>
              基于冒险家的速度进行 10000 / ((速度 + 100) ^ 0.8)
              换算计算<strong>延迟值</strong>，延迟值达到触发点的冒险家会行动。避免极大速度差时低速者无法出手的现象，同时保证高速冒险家的属性收益
            </li>
            <li>
              伤害计算：(攻击 × 攻击) / (攻击 + 防御) =
              实际伤害（最少1点），伤害会减少目标 SAN 值
            </li>
            <li>
              等级压制（普通攻击）：比较双方<strong>综合等级</strong>，当防守方高于进攻方约
              <strong>10级</strong
              >开始有感，<strong>20级</strong>会明显更吃力。结算时会降低进攻方有效攻击并提高防守方有效防御（有上下限，避免过度压制）
            </li>
            <li>冒险家 SAN 归 0 则无法继续战斗</li>
          </ul>
        </div>

        <div class="guide-card mb-4">
          <h4 class="guide-subtitle">💎 符文石触发</h4>
          <ul class="guide-list">
            <li>冒险家 <strong>SP 达到 1000</strong> 时触发符文石主动效果</li>
            <li>每回合开始时，存活冒险家会获得 <strong>40 SP</strong></li>
            <li>每次主动攻击后，冒险家会获得 <strong>180 SP</strong></li>
            <li>
              受到伤害后会根据剩余 SAN 获得 SP：<strong
                >40 + floor((1 - 剩余SAN/最大SAN) × 120)</strong
              >
            </li>
            <li>主动效果 = 基础值 × 符文石等级</li>
            <li>
              攻击类符文石同样套用等级压制，但对比口径为：<strong
                >符文石等级 vs 目标冒险家综合等级</strong
              >
            </li>
            <li>符文石有攻击前和攻击后两种触发时机</li>
            <li>
              同一冒险家在同一触发时机内同时触发多个符文技能时，会合并为<strong
                >一次cut in</strong
              >并分行展示；仅攻击前/攻击后分属不同触发时机会展示两次
            </li>
            <li>符文石攻击的伤害数字会显示对应元素emoji</li>
          </ul>
        </div>

        <div class="guide-card">
          <h4 class="guide-subtitle">🏁 结束判定</h4>
          <ul class="guide-list">
            <li>一方全员 SAN 归 0 → 判负</li>
            <li>双方同时全员 SAN 归 0 → 平局</li>
            <li>
              超过 <strong>200 回合</strong>未分胜负 → 比较双方剩余 SAN
              总和占比，高者胜
            </li>
          </ul>
        </div>
      </div>

      <!-- 地下迷宫 -->
      <div v-if="activeTab === 'dungeon'">
        <h3 class="guide-section-title">🏰 地下迷宫</h3>

        <div class="guide-card mb-4">
          <h4 class="guide-subtitle">📌 基本玩法</h4>
          <ul class="guide-list">
            <li>
              在迷宫放置冒险家，自动产出<strong>攻击/防御/速度/SAN水晶</strong>
            </li>
            <li>
              每 <strong>1 分钟</strong>随机产出一种水晶，累计后可点击结算
            </li>
            <li>
              产物数量 = 分钟数 × 产出倍率 / 100，最大上限
              <strong>99,999</strong>
            </li>
            <li>同时有概率掉落对应迷宫等级的<strong>符文石</strong></li>
          </ul>
        </div>

        <div class="guide-card mb-4">
          <h4 class="guide-subtitle">🔄 迷宫切换</h4>
          <ul class="guide-list">
            <li>每 <strong>3 秒</strong>可切换一次迷宫</li>
            <li>每 <strong>1 小时</strong>获得 1 次切换机会</li>
            <li>最多储存 <strong>24 次</strong>切换机会</li>
            <li>切换迷宫时有概率发现<strong>矿场</strong></li>
          </ul>
        </div>

        <div class="guide-card mb-4">
          <h4 class="guide-subtitle">👹 迷宫军团</h4>
          <ul class="guide-list">
            <li>挑战并击败迷宫军团可<strong>升级迷宫等级</strong></li>
            <li>击败军团必定掉落 <strong>1 个传说级符文石</strong></li>
          </ul>
        </div>

        <div class="guide-card">
          <h4 class="guide-subtitle">💎 符文石掉率</h4>
          <ul class="guide-list">
            <li>
              掉率由后台设定（当前 <strong>{{ runeDropPercent }}%</strong>）
            </li>
            <li>掉落后按稀有度再次随机：</li>
          </ul>
          <div class="overflow-x-auto mt-2">
            <table class="guide-table">
              <thead>
                <tr>
                  <th>稀有度</th>
                  <th>默认概率</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>⬜ 普通</td>
                  <td>{{ normalRunePercent }}%</td>
                </tr>
                <tr>
                  <td>🟦 稀有</td>
                  <td>{{ rareRunePercent }}%</td>
                </tr>
                <tr>
                  <td>🟧 传说</td>
                  <td>{{ legendaryRunePercent }}%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- 符文石 -->
      <div v-if="activeTab === 'rune'">
        <h3 class="guide-section-title">💎 符文石系统</h3>

        <div class="guide-card mb-4">
          <h4 class="guide-subtitle">📌 基本信息</h4>
          <ul class="guide-list">
            <li>
              符文石包含<strong>主动技能</strong>和<strong>被动增益</strong>
            </li>
            <li>每名冒险家可装备 <strong>1 个</strong>符文石</li>
            <li>符文石等级必须 ≤ 冒险家综合等级</li>
            <li>装备中的符文石<strong>不可升级</strong></li>
          </ul>
        </div>

        <div class="guide-card mb-4">
          <h4 class="guide-subtitle">⭐ 稀有度对比</h4>
          <div class="overflow-x-auto">
            <table class="guide-table">
              <thead>
                <tr>
                  <th>稀有度</th>
                  <th>主动技能</th>
                  <th>被动增益</th>
                  <th>被动等级</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>⬜ 普通</td>
                  <td>1 条</td>
                  <td>2 条</td>
                  <td>1~10</td>
                </tr>
                <tr>
                  <td>🟦 稀有</td>
                  <td>2 条</td>
                  <td>4 条</td>
                  <td>11~20</td>
                </tr>
                <tr>
                  <td>🟧 传说</td>
                  <td>3 条</td>
                  <td>6 条</td>
                  <td>21~30</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p class="guide-note mt-2">
            💡 被动增益 = 对应属性 × (增益等级 × 品质系数)
          </p>
          <div class="overflow-x-auto mt-2">
            <table class="guide-table">
              <thead>
                <tr>
                  <th>品质</th>
                  <th>系数</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>⬜ 普通</td>
                  <td>0.0012</td>
                </tr>
                <tr>
                  <td>🟦 稀有</td>
                  <td>0.0022</td>
                </tr>
                <tr>
                  <td>🟧 传说</td>
                  <td>0.0033</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="guide-card mb-4">
          <h4 class="guide-subtitle">🔨 符文石分解</h4>
          <p class="guide-text mb-2">
            分解符文石可获得<strong>符文石碎片</strong>，数量 = 稀有度系数 ×
            符文石等级
          </p>
          <div class="overflow-x-auto">
            <table class="guide-table">
              <thead>
                <tr>
                  <th>稀有度</th>
                  <th>系数</th>
                  <th>示例 (Lv.5)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>⬜ 普通</td>
                  <td>10</td>
                  <td>50 碎片</td>
                </tr>
                <tr>
                  <td>🟦 稀有</td>
                  <td>100</td>
                  <td>500 碎片</td>
                </tr>
                <tr>
                  <td>🟧 传说</td>
                  <td>500</td>
                  <td>2500 碎片</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="guide-card mb-4">
          <h4 class="guide-subtitle">⬆️ 符文石升级</h4>
          <p class="guide-text mb-2">升级所需碎片 = 稀有度系数 × 当前等级</p>
          <div class="overflow-x-auto">
            <table class="guide-table">
              <thead>
                <tr>
                  <th>稀有度</th>
                  <th>每级费用</th>
                  <th>示例 (Lv.5→6)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>⬜ 普通</td>
                  <td>100 × 等级</td>
                  <td>500 碎片</td>
                </tr>
                <tr>
                  <td>🟦 稀有</td>
                  <td>1000 × 等级</td>
                  <td>5000 碎片</td>
                </tr>
                <tr>
                  <td>🟧 传说</td>
                  <td>5000 × 等级</td>
                  <td>25000 碎片</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="guide-card">
          <h4 class="guide-subtitle">🔀 符文石合成</h4>
          <ul class="guide-list">
            <li>两个<strong>相同稀有度</strong>的未装备符文石可以合成</li>
            <li>合成后等级 = 两个符文石的平均值（向下取整）</li>
            <li>技能和被动增益由两颗符文石随机交叉产生</li>
            <li>分为【主符文石】和【素材符文石】，合成后素材符文石销毁</li>
            <li>合成前可预览结果，选择采用或放弃</li>
          </ul>
        </div>
      </div>

      <!-- 交易市场 -->
      <div v-if="activeTab === 'market'">
        <h3 class="guide-section-title">🏪 交易市场</h3>

        <div class="guide-card mb-4">
          <h4 class="guide-subtitle">🏛️ 官方市场</h4>
          <ul class="guide-list">
            <li>
              <strong>水晶收购</strong>：官方以
              <strong>{{ gameSettings.officialCrystalBuyPrice }}</strong> 🪙/个
              收购玩家的各种水晶
            </li>
            <li>
              <strong>水晶贩卖</strong>：官方以
              <strong>{{ gameSettings.officialCrystalSellPrice }}</strong> 🪙/个
              出售水晶
            </li>
            <li>收购和售卖价格由后台设定</li>
          </ul>
        </div>

        <div class="guide-card mb-4">
          <h4 class="guide-subtitle">🤝 自由市场 · 素材交易</h4>
          <ul class="guide-list">
            <li>
              <strong>出售</strong
              >：将水晶/符文石碎片挂到市场贩卖，发布时扣除对应数量的素材
            </li>
            <li><strong>求购</strong>：发布求购信息，发布时扣除设定的金币</li>
            <li>可随时下架并赎回素材或金币</li>
            <li>
              价格不得低于系统设定的最低价格（当前
              <strong>{{ gameSettings.freeMarketMinPrice }}</strong> 🪙）
            </li>
          </ul>
        </div>

        <div class="guide-card">
          <h4 class="guide-subtitle">💎 自由市场 · 符文石交易</h4>
          <ul class="guide-list">
            <li>可将<strong>未装备</strong>的符文石挂到市场贩卖</li>
            <li>发布时暂扣符文石到市场</li>
            <li>可随时下架赎回符文石</li>
            <li>
              价格不得低于系统设定的最低价格（当前
              <strong>{{ gameSettings.freeMarketRuneStoneMinPrice }}</strong>
              🪙）
            </li>
          </ul>
        </div>
      </div>

      <!-- 竞技场 -->
      <div v-if="activeTab === 'arena'">
        <h3 class="guide-section-title">🏆 竞技场</h3>

        <div class="guide-card mb-4">
          <h4 class="guide-subtitle">📌 参赛规则</h4>
          <ul class="guide-list">
            <li>需要先<strong>报名</strong>参赛，报名时选择阵容</li>
            <li>
              报名后冒险家锁定至赛季结束，不可替换，只能添加新冒险家或调整位置
            </li>
            <li>初始竞技点：<strong>500</strong></li>
            <li>
              获胜增加竞技点（两人差值，10~100），失败扣除相同分数，平局不变
            </li>
          </ul>
        </div>

        <div class="guide-card mb-4">
          <h4 class="guide-subtitle">⚔️ 对战机制</h4>
          <ul class="guide-list">
            <li>系统匹配竞技点 <strong>±500</strong> 范围内的 10 名对手</li>
            <li>不足时系统自动补充 <strong>NPC</strong></li>
            <li>
              每次对战可获得
              <strong>{{ gameSettings.arenaBattleGold }}</strong> 🪙 奖励
            </li>
            <li>报名时有 <strong>24 次</strong>挑战机会</li>
            <li>之后每 <strong>1 小时</strong>恢复 1 次，最多 24 次</li>
          </ul>
        </div>

        <div class="guide-card mb-4">
          <h4 class="guide-subtitle">🏅 赛季奖励</h4>
          <div class="overflow-x-auto">
            <table class="guide-table">
              <thead>
                <tr>
                  <th>名次</th>
                  <th>奖池占比</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>🥇 第一名</td>
                  <td>60%</td>
                </tr>
                <tr>
                  <td>🥈 第二名</td>
                  <td>30%</td>
                </tr>
                <tr>
                  <td>🥉 第三名</td>
                  <td>10%</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p class="guide-note mt-2">
            💡 赛季（<strong>{{ gameSettings.seasonDays }}</strong> 天）期间完成
            24 次主动战斗可获得
            <strong>{{ gameSettings.arenaParticipationReward }}</strong> 🪙
            参与奖。奖池总额
            <strong>{{ gameSettings.arenaPoolAmount }}</strong> 🪙
          </p>
        </div>

        <div class="guide-card">
          <h4 class="guide-subtitle">📋 对战记录</h4>
          <ul class="guide-list">
            <li>可查看主动挑战和被挑战的对战记录</li>
            <li>记录保存 <strong>7 天</strong></li>
            <li>奖励通过<strong>邮箱系统</strong>发放</li>
          </ul>
        </div>
      </div>

      <!-- 矿场 -->
      <div v-if="activeTab === 'mine'">
        <h3 class="guide-section-title">⛏️ 矿场系统</h3>

        <div class="guide-card mb-4">
          <h4 class="guide-subtitle">📌 矿场发现</h4>
          <ul class="guide-list">
            <li>切换迷宫时有概率发现矿场</li>
            <li>矿场等级 = 切换时的迷宫等级</li>
            <li>所有矿场<strong>全玩家共享</strong></li>
            <li>发现矿场的玩家成为<strong>矿主</strong></li>
          </ul>
        </div>

        <div class="guide-card mb-4">
          <h4 class="guide-subtitle">💣 扫雷玩法</h4>
          <ul class="guide-list">
            <li>矿场为 <strong>10×10</strong> 的区域</li>
            <li>随机分布 <strong>10~30 个</strong>奖励区域</li>
            <li>格子默认未知，需要挖矿才能揭开</li>
            <li>数字大于 0 的格子可获得水晶（数字 × 10 个）</li>
            <li>
              遇到奖励区域需<strong>挑战军团</strong>，胜利获得 100 个水晶 + 1
              个符文石
            </li>
            <li>已探索的格子对<strong>所有玩家公开</strong></li>
          </ul>
        </div>

        <div class="guide-card mb-4">
          <h4 class="guide-subtitle">⏱️ 挖矿机会</h4>
          <ul class="guide-list">
            <li>注册时有 <strong>24 次</strong>挖矿机会</li>
            <li>每 <strong>1 小时</strong>恢复 1 次</li>
            <li>最多储存 <strong>24 次</strong></li>
            <li>挑战已暴露的奖励区域<strong>无需消耗</strong>机会</li>
            <li>挑战军团冷却时间 <strong>3 秒</strong></li>
          </ul>
        </div>

        <div class="guide-card">
          <h4 class="guide-subtitle">👑 矿主特权</h4>
          <ul class="guide-list">
            <li>
              其他玩家在你的矿场获得水晶时，你将<strong>额外获得 10 个</strong
              >相同水晶
            </li>
            <li>水晶实时到账</li>
            <li>可查看近 <strong>7 天</strong>的矿主收益</li>
          </ul>
        </div>
      </div>

      <!-- 其他系统 -->
      <div v-if="activeTab === 'other'">
        <h3 class="guide-section-title">📬 其他系统</h3>

        <div class="guide-card mb-4">
          <h4 class="guide-subtitle">📬 邮箱系统</h4>
          <ul class="guide-list">
            <li>游戏内邮箱系统，用于接收消息和领取奖励</li>
            <li>可领取邮件中的<strong>物品和金币</strong></li>
            <li>邮件有效期 <strong>1 个月</strong>，过期自动删除</li>
            <li>过期后无法领取邮件内的物品</li>
          </ul>
        </div>

        <div class="guide-card">
          <h4 class="guide-subtitle">⚙️ 公会设置</h4>
          <ul class="guide-list">
            <li>
              可消耗 <strong>{{ gameSettings.guildCustomLogoPrice }}</strong> 🪙
              修改<strong>公会标志</strong>
            </li>
            <li>
              可消耗 <strong>{{ gameSettings.guildChangeNamePrice }}</strong> 🪙
              修改<strong>公会名字</strong>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getGameSettingsApi } from '@/api/game/config'

const route = useRoute()
const router = useRouter()

const tabs = [
  { key: 'overview', label: '游戏概览', icon: '🗺️' },
  { key: 'adventurer', label: '冒险家', icon: '⚔️' },
  { key: 'battle', label: '战斗系统', icon: '⚔️' },
  { key: 'dungeon', label: '地下迷宫', icon: '🏰' },
  { key: 'rune', label: '符文石', icon: '💎' },
  { key: 'market', label: '交易市场', icon: '🏪' },
  { key: 'arena', label: '竞技场', icon: '🏆' },
  { key: 'mine', label: '矿场', icon: '⛏️' },
  { key: 'other', label: '其他', icon: '📬' }
]

const activeTab = ref(route.query.tab || 'overview')

// 游戏配置
const gameSettings = ref({
  adventurerRecruitPrice: 10000,
  adventurerCustomAvatarPrice: 5000,
  adventurerCustomNamePrice: 1000,
  guildCustomLogoPrice: 5000,
  guildChangeNamePrice: 1000,
  runeStoneDropRate: 100,
  normalRuneStoneRate: 8000,
  rareRuneStoneRate: 1500,
  legendaryRuneStoneRate: 500,
  officialCrystalBuyPrice: 100,
  officialCrystalSellPrice: 10000,
  freeMarketMinPrice: 100,
  freeMarketRuneStoneMinPrice: 100,
  arenaPoolAmount: 100000,
  arenaParticipationReward: 500,
  arenaBattleGold: 50,
  seasonDays: 3
})

// 计算属性：将万分比转为百分比显示
const runeDropPercent = computed(() => {
  return (gameSettings.value.runeStoneDropRate / 100)
    .toFixed(2)
    .replace(/\.?0+$/, '')
})
const normalRunePercent = computed(() => {
  return (gameSettings.value.normalRuneStoneRate / 100)
    .toFixed(2)
    .replace(/\.?0+$/, '')
})
const rareRunePercent = computed(() => {
  return (gameSettings.value.rareRuneStoneRate / 100)
    .toFixed(2)
    .replace(/\.?0+$/, '')
})
const legendaryRunePercent = computed(() => {
  return (gameSettings.value.legendaryRuneStoneRate / 100)
    .toFixed(2)
    .replace(/\.?0+$/, '')
})

function handleSwitchTab(key) {
  activeTab.value = key
  router.replace({ query: { tab: key } })
}

function fetchGameSettings() {
  getGameSettingsApi().then(res => {
    if (res.data.code === 0) {
      const data = res.data.data
      Object.keys(gameSettings.value).forEach(key => {
        if (data[key] !== undefined) {
          gameSettings.value[key] = data[key]
        }
      })
    }
  })
}

onMounted(() => {
  fetchGameSettings()
})
</script>

<style scoped>
/* Tab 按钮 */
.guide-tab-btn {
  display: inline-flex;
  align-items: center;
  padding: 6px 12px;
  border-radius: 9999px;
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;
  transition: all 0.2s;
  background: var(--el-fill-color-light, #f5f7fa);
  color: var(--el-text-color-regular, #606266);
  border: 1px solid transparent;
  cursor: pointer;
}

.guide-tab-btn:hover {
  background: var(--el-color-primary-light-9, #ecf5ff);
  color: var(--el-color-primary, #409eff);
}

.guide-tab-btn--active {
  background: var(--el-color-primary-light-9, #ecf5ff);
  color: var(--el-color-primary, #409eff);
  border-color: var(--el-color-primary-light-7, #a0cfff);
  font-weight: 600;
}

/* 暗黑模式 tab */
:root.dark .guide-tab-btn {
  background: #2a2a2a;
  color: #a0a0a0;
}

:root.dark .guide-tab-btn:hover {
  background: #1a3a5c;
  color: #79bbff;
}

:root.dark .guide-tab-btn--active {
  background: #1a3a5c;
  color: #79bbff;
  border-color: #2a5a8c;
}

/* 章节标题 */
.guide-section-title {
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 2px solid var(--el-border-color-lighter, #ebeef5);
  color: var(--el-text-color-primary, #303133);
}

:root.dark .guide-section-title {
  border-bottom-color: #3a3a3a;
  color: #e0e0e0;
}

/* 内容卡片 */
.guide-card {
  background: var(--el-fill-color-lighter, #fafafa);
  border-radius: 12px;
  padding: 16px;
  border: 1px solid var(--el-border-color-extra-light, #f2f6fc);
}

:root.dark .guide-card {
  background: #1e1e1e;
  border-color: #333;
}

/* 子标题 */
.guide-subtitle {
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 10px;
  color: var(--el-text-color-primary, #303133);
}

:root.dark .guide-subtitle {
  color: #d0d0d0;
}

/* 文本 */
.guide-text {
  font-size: 14px;
  line-height: 1.7;
  color: var(--el-text-color-regular, #606266);
}

:root.dark .guide-text {
  color: #b0b0b0;
}

/* 列表 */
.guide-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.guide-list li {
  position: relative;
  padding-left: 18px;
  padding-top: 4px;
  padding-bottom: 4px;
  font-size: 14px;
  line-height: 1.7;
  color: var(--el-text-color-regular, #606266);
}

.guide-list li::before {
  content: '•';
  position: absolute;
  left: 4px;
  color: var(--el-color-primary, #409eff);
  font-weight: bold;
}

:root.dark .guide-list li {
  color: #b0b0b0;
}

/* 提示 */
.guide-note {
  font-size: 13px;
  padding: 8px 12px;
  background: var(--el-color-warning-light-9, #fdf6ec);
  border-radius: 8px;
  color: var(--el-color-warning-dark-2, #b88230);
  border: 1px solid var(--el-color-warning-light-8, #faecd8);
}

:root.dark .guide-note {
  background: #2a2517;
  color: #d4a846;
  border-color: #3a3020;
}

/* 表格 */
.guide-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.guide-table th,
.guide-table td {
  padding: 8px 12px;
  text-align: left;
  border-bottom: 1px solid var(--el-border-color-lighter, #ebeef5);
}

.guide-table th {
  font-weight: 600;
  color: var(--el-text-color-primary, #303133);
  background: var(--el-fill-color, #f5f7fa);
  font-size: 13px;
}

.guide-table td {
  color: var(--el-text-color-regular, #606266);
}

:root.dark .guide-table th {
  background: #252525;
  color: #d0d0d0;
  border-bottom-color: #3a3a3a;
}

:root.dark .guide-table td {
  color: #b0b0b0;
  border-bottom-color: #333;
}

/* 流程展示 */
.guide-flow {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  justify-content: center;
}

.guide-flow-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 10px 8px;
  background: var(--el-fill-color, #f5f7fa);
  border-radius: 10px;
  min-width: 70px;
}

:root.dark .guide-flow-item {
  background: #252525;
}

.guide-flow-icon {
  font-size: 24px;
}

.guide-flow-text {
  font-size: 11px;
  color: var(--el-text-color-regular, #606266);
  text-align: center;
  line-height: 1.3;
}

:root.dark .guide-flow-text {
  color: #b0b0b0;
}

.guide-flow-arrow {
  font-size: 18px;
  color: var(--el-color-primary, #409eff);
  font-weight: bold;
}

/* 元素链 */
.guide-element-chain {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.guide-element-group {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  justify-content: center;
}

.guide-element {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 4px 10px;
  background: var(--el-fill-color, #f5f7fa);
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;
}

:root.dark .guide-element {
  background: #252525;
  color: #d0d0d0;
}

.guide-element-arrow {
  font-size: 16px;
  color: var(--el-color-primary, #409eff);
  font-weight: bold;
}
</style>

#!/usr/bin/env node

/**
 * 数据回滚脚本
 *
 * 功能：
 * 1. 将所有冒险家的属性等级重置为 1，综合等级重置为 1
 * 2. 卸下所有冒险家装备的符文石
 * 3. 按旧版固定费率（50水晶 + 500金币/次）退还升级消耗的资源
 * 4. 将所有玩家的迷宫等级重置为 1
 * 5. 将所有玩家的公会等级重置为 1
 * 6. 清除所有矿场数据和矿主收益日志
 *
 * 用法：
 *   node server/scripts/rollback-adventurer-levels.js [--dry-run]
 *
 * 参数：
 *   --dry-run   仅预览变更，不实际写入数据库
 */

import dotenv from 'dotenv'
import mongoose from 'mongoose'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

// 加载环境变量
dotenv.config({
  path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../.env')
})

const mongodbUri =
  process.env.MONGODB_URI || 'mongodb://localhost:27017/wikimoe-guild'

const isDryRun = process.argv.includes('--dry-run')

// ── 旧版升级费率（回滚时按此退还） ──
const OLD_CRYSTAL_COST_PER_LEVEL = 50
const OLD_GOLD_COST_PER_LEVEL = 500

// ── 模型定义（脚本内联，避免依赖启动流程） ──

const adventurerSchema = new mongoose.Schema(
  {
    account: { type: mongoose.Schema.Types.ObjectId, index: true },
    attackLevel: { type: Number, default: 1 },
    defenseLevel: { type: Number, default: 1 },
    speedLevel: { type: Number, default: 1 },
    SANLevel: { type: Number, default: 1 },
    comprehensiveLevel: { type: Number, default: 1 },
    runeStone: { type: mongoose.Schema.Types.ObjectId, default: null }
  },
  { strict: false }
)
const Adventurer = mongoose.model('game_adventurer', adventurerSchema)

const runeStoneSchema = new mongoose.Schema(
  {
    account: { type: mongoose.Schema.Types.ObjectId, index: true },
    equippedBy: { type: mongoose.Schema.Types.ObjectId, default: null }
  },
  { strict: false }
)
const RuneStone = mongoose.model('game_rune_stone', runeStoneSchema)

const inventorySchema = new mongoose.Schema({
  account: { type: mongoose.Schema.Types.ObjectId, unique: true, index: true },
  attackCrystal: { type: Number, default: 0 },
  defenseCrystal: { type: Number, default: 0 },
  speedCrystal: { type: Number, default: 0 },
  sanCrystal: { type: Number, default: 0 },
  runeFragment: { type: Number, default: 0 }
})
const Inventory = mongoose.model('game_player_inventory', inventorySchema)

const playerInfoSchema = new mongoose.Schema({
  account: { type: mongoose.Schema.Types.ObjectId, unique: true, index: true },
  gold: { type: Number, default: 0 },
  dungeonsLevel: { type: Number, default: 1 },
  selectedDungeonsLevel: { type: Number, default: 1 },
  guildLevel: { type: Number, default: 1 },
  adventurerCount: { type: Number, default: 0 }
})
const PlayerInfo = mongoose.model('game_player_info', playerInfoSchema)

const mineSchema = new mongoose.Schema({}, { strict: false })
const Mine = mongoose.model('game_mine', mineSchema)

const mineRevenueSchema = new mongoose.Schema({}, { strict: false })
const MineRevenue = mongoose.model('game_mine_revenue', mineRevenueSchema)

const MAX_MATERIAL = 9999999
const MAX_GOLD = 2000000000

async function run() {
  console.log(
    isDryRun ? '🔍 [DRY RUN] 仅预览，不写入数据库\n' : '⚠️  即将执行回滚操作\n'
  )

  await mongoose.connect(mongodbUri)
  console.log('✅ 已连接到数据库\n')

  // ── Step 1: 计算每个玩家需要退还的资源 ──
  console.log('📊 Step 1: 扫描所有冒险家，计算退还资源...')

  const adventurers = await Adventurer.find({}).lean()
  console.log(`   共 ${adventurers.length} 名冒险家`)

  // 按 account 分组统计退还量
  const refundMap = new Map() // accountId -> { attackCrystal, defenseCrystal, speedCrystal, sanCrystal, gold }

  let totalLevelsReset = 0

  for (const adv of adventurers) {
    const accountId = adv.account.toString()
    if (!refundMap.has(accountId)) {
      refundMap.set(accountId, {
        attackCrystal: 0,
        defenseCrystal: 0,
        speedCrystal: 0,
        sanCrystal: 0,
        gold: 0
      })
    }
    const ref = refundMap.get(accountId)

    // 每个属性从 1 升到 N 需要 (N-1) 次升级
    const attackUps = (adv.attackLevel || 1) - 1
    const defenseUps = (adv.defenseLevel || 1) - 1
    const speedUps = (adv.speedLevel || 1) - 1
    const sanUps = (adv.SANLevel || 1) - 1

    ref.attackCrystal += attackUps * OLD_CRYSTAL_COST_PER_LEVEL
    ref.defenseCrystal += defenseUps * OLD_CRYSTAL_COST_PER_LEVEL
    ref.speedCrystal += speedUps * OLD_CRYSTAL_COST_PER_LEVEL
    ref.sanCrystal += sanUps * OLD_CRYSTAL_COST_PER_LEVEL

    const totalUps = attackUps + defenseUps + speedUps + sanUps
    ref.gold += totalUps * OLD_GOLD_COST_PER_LEVEL
    totalLevelsReset += totalUps
  }

  console.log(`   共有 ${refundMap.size} 个玩家需要退还资源`)
  console.log(`   总计重置 ${totalLevelsReset} 次升级\n`)

  // 打印汇总
  let totalRefundGold = 0
  let totalRefundAttack = 0
  let totalRefundDefense = 0
  let totalRefundSpeed = 0
  let totalRefundSan = 0

  for (const ref of refundMap.values()) {
    totalRefundGold += ref.gold
    totalRefundAttack += ref.attackCrystal
    totalRefundDefense += ref.defenseCrystal
    totalRefundSpeed += ref.speedCrystal
    totalRefundSan += ref.sanCrystal
  }

  console.log('   退还资源汇总:')
  console.log(`   🪙 金币:       ${totalRefundGold.toLocaleString()}`)
  console.log(`   ⚔️ 攻击水晶:   ${totalRefundAttack.toLocaleString()}`)
  console.log(`   🛡️ 防御水晶:   ${totalRefundDefense.toLocaleString()}`)
  console.log(`   💨 速度水晶:   ${totalRefundSpeed.toLocaleString()}`)
  console.log(`   ❤️ SAN水晶:    ${totalRefundSan.toLocaleString()}`)
  console.log()

  if (isDryRun) {
    console.log('── [DRY RUN] 以下操作将在正式执行时进行 ──\n')
  }

  // ── Step 2: 重置所有冒险家等级 ──
  console.log('📊 Step 2: 重置所有冒险家等级为 1...')
  if (!isDryRun) {
    const advResult = await Adventurer.updateMany(
      {},
      {
        $set: {
          attackLevel: 1,
          defenseLevel: 1,
          speedLevel: 1,
          SANLevel: 1,
          comprehensiveLevel: 1,
          runeStone: null
        }
      }
    )
    console.log(`   ✅ 已重置 ${advResult.modifiedCount} 名冒险家\n`)
  } else {
    console.log(`   将重置 ${adventurers.length} 名冒险家\n`)
  }

  // ── Step 2.5: 卸下所有符文石 ──
  console.log('📊 Step 2.5: 卸下所有冒险家的符文石...')
  if (!isDryRun) {
    const rsResult = await RuneStone.updateMany(
      { equippedBy: { $ne: null } },
      { $set: { equippedBy: null } }
    )
    console.log(`   ✅ 已卸下 ${rsResult.modifiedCount} 块符文石\n`)
  } else {
    const equippedCount = await RuneStone.countDocuments({
      equippedBy: { $ne: null }
    })
    console.log(`   将卸下 ${equippedCount} 块符文石\n`)
  }

  // ── Step 3: 退还资源到玩家背包和金币 ──
  console.log('📊 Step 3: 退还资源...')
  // eslint-disable-next-line no-unused-vars
  let refundCount = 0
  for (const [accountId, ref] of refundMap) {
    if (
      ref.gold === 0 &&
      ref.attackCrystal === 0 &&
      ref.defenseCrystal === 0 &&
      ref.speedCrystal === 0 &&
      ref.sanCrystal === 0
    ) {
      continue
    }

    if (!isDryRun) {
      // 退还水晶
      await Inventory.updateOne(
        { account: new mongoose.Types.ObjectId(accountId) },
        {
          $inc: {
            attackCrystal: ref.attackCrystal,
            defenseCrystal: ref.defenseCrystal,
            speedCrystal: ref.speedCrystal,
            sanCrystal: ref.sanCrystal
          }
        }
      )

      // 使用 $inc 退还金币，但要注意上限
      await PlayerInfo.updateOne(
        { account: new mongoose.Types.ObjectId(accountId) },
        { $inc: { gold: ref.gold } }
      )
    }
    refundCount++
  }
  console.log(
    `   ${isDryRun ? '将退还' : '✅ 已退还'} ${refundCount} 个玩家的资源\n`
  )

  // ── Step 4: 修正背包和金币溢出 ──
  if (!isDryRun) {
    console.log('📊 Step 4: 修正溢出值...')

    // 修正水晶溢出
    for (const field of [
      'attackCrystal',
      'defenseCrystal',
      'speedCrystal',
      'sanCrystal'
    ]) {
      await Inventory.updateMany(
        { [field]: { $gt: MAX_MATERIAL } },
        { $set: { [field]: MAX_MATERIAL } }
      )
    }

    // 修正金币溢出
    await PlayerInfo.updateMany(
      { gold: { $gt: MAX_GOLD } },
      { $set: { gold: MAX_GOLD } }
    )
    console.log('   ✅ 溢出值已修正\n')
  }

  // ── Step 5: 重置迷宫等级和公会等级 ──
  console.log('📊 Step 5: 重置迷宫等级和公会等级...')
  if (!isDryRun) {
    const infoResult = await PlayerInfo.updateMany(
      {},
      {
        $set: {
          dungeonsLevel: 1,
          selectedDungeonsLevel: 1,
          guildLevel: 1
        }
      }
    )
    console.log(
      `   ✅ 已重置 ${infoResult.modifiedCount} 个玩家的迷宫和公会等级\n`
    )
  } else {
    const infoCount = await PlayerInfo.countDocuments()
    console.log(`   将重置 ${infoCount} 个玩家的迷宫和公会等级\n`)
  }

  // ── Step 6: 清除矿场数据 ──
  console.log('📊 Step 6: 清除矿场数据...')
  if (!isDryRun) {
    const mineCount = await Mine.countDocuments()
    const revenueCount = await MineRevenue.countDocuments()
    await Mine.deleteMany({})
    await MineRevenue.deleteMany({})
    console.log(
      `   ✅ 已删除 ${mineCount} 个矿场 和 ${revenueCount} 条收益日志\n`
    )
  } else {
    const mineCount = await Mine.countDocuments()
    const revenueCount = await MineRevenue.countDocuments()
    console.log(`   将删除 ${mineCount} 个矿场 和 ${revenueCount} 条收益日志\n`)
  }

  // ── 完成 ──
  console.log('─'.repeat(60))
  if (isDryRun) {
    console.log('🔍 [DRY RUN] 预览完成，未修改任何数据')
    console.log('   如需正式执行，请去掉 --dry-run 参数重新运行')
  } else {
    console.log('✅ 回滚完成！')
    console.log('   所有冒险家等级已重置为 1')
    console.log('   所有符文石已卸下')
    console.log('   升级消耗的水晶和金币已退还')
    console.log('   迷宫等级和公会等级已重置为 1')
    console.log('   矿场数据已清除')
  }
  console.log('─'.repeat(60))
}

run()
  .catch(err => {
    console.error('❌ 执行失败:', err)
    process.exit(1)
  })
  .finally(() => {
    mongoose.disconnect()
  })

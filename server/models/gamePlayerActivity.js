import mongoose from 'mongoose'

/**
 * 玩家动态（Capped Collection，限制 64MB）
 *
 * 动态类型 (type):
 *   - guild_created:    创建公会
 *   - rune_stone_found: 矿场中获得符文石
 *   - arena_top3:       竞技场赛季前三名
 *   - mine_discovered:  发现矿场
 *   - market_listing:   发布素材/符文石出售或求购
 *   - guild_upgrade:    公会升级
 *   - dungeon_victory:  地牢通关胜利
 *   - arena_victory:    竞技场匹配胜利
 */
const gamePlayerActivitySchema = new mongoose.Schema(
  {
    // 动态类型
    type: {
      type: String,
      required: true,
      enum: [
        'guild_created',
        'rune_stone_found',
        'arena_top3',
        'mine_discovered',
        'market_listing',
        'guild_upgrade',
        'dungeon_victory',
        'arena_victory'
      ],
      index: true
    },
    // 关联玩家账号（可选，赛季结算时可能批量写入）
    account: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'game_player_accounts',
      index: true
    },
    // 公会名称（记录时快照，无需 join 查询）
    guildName: {
      type: String,
      trim: true
    },
    // 动态标题
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200
    },
    // 动态内容/描述
    content: {
      type: String,
      trim: true,
      maxlength: 500
    },
    // 附加数据（各类型自定义字段）
    extra: {
      type: Object,
      default: {}
    }
  },
  { timestamps: true }
)

const GamePlayerActivity = mongoose.model(
  'game_player_activities',
  gamePlayerActivitySchema
)

/**
 * 确保集合为 Capped Collection（64MB）
 * 如果集合已存在且非 capped，则跳过（需手动迁移）
 */
export async function ensureCappedCollection() {
  const db = mongoose.connection.db
  const collName = 'game_player_activities'
  try {
    const collections = await db.listCollections({ name: collName }).toArray()
    if (collections.length === 0) {
      // 集合不存在，创建 capped collection
      await db.createCollection(collName, {
        capped: true,
        size: 64 * 1024 * 1024, // 64MB
        max: 100000 // 最多 10 万条
      })
      // 创建索引
      const col = db.collection(collName)
      await col.createIndex({ type: 1 })
      await col.createIndex({ account: 1 })
      await col.createIndex({ createdAt: -1 })
    }
  } catch (err) {
    // 如果集合已是 capped，忽略错误
    if (err.codeName !== 'NamespaceExists') {
      console.error(
        '[GamePlayerActivity] 创建 capped collection 失败:',
        err.message
      )
    }
  }
}

export default GamePlayerActivity

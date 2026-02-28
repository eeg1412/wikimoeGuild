import mongoose from 'mongoose'

/**
 * 竞技场战斗日志
 */
const gameArenaBattleLogSchema = new mongoose.Schema(
  {
    season: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'game_arena_season',
      required: true,
      index: true
    },
    // 挑战者
    attacker: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'game_player_accounts',
      required: true,
      index: true
    },
    attackerGuildName: String,
    // 防守者（NPC时为null）
    defender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'game_player_accounts',
      default: null,
      index: true
    },
    defenderGuildName: String,
    // 是否是NPC
    isNPC: {
      type: Boolean,
      default: false
    },
    // 战斗结果: attacker / defender / draw
    winner: {
      type: String,
      required: true,
      enum: ['attacker', 'defender', 'draw']
    },
    // 竞技点变动
    pointsChange: {
      type: Number,
      default: 0
    },
    // 战斗回合数
    rounds: {
      type: Number,
      default: 0
    },
    // 获得金币
    goldEarned: {
      type: Number,
      default: 0
    },
    // 战斗系统版本号
    battleVersion: {
      type: Number,
      default: 1
    },
    // 战斗数据快照 - 静态保存冒险家战斗属性
    attackerUnits: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },
    defenderUnits: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },
    // 战斗回放日志
    battleLog: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },
    // 7天后自动删除
    expireAt: {
      type: Date,
      default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      index: { expires: 0 }
    }
  },
  { timestamps: true }
)

gameArenaBattleLogSchema.set('toJSON', {
  transform(_doc, ret) {
    return ret
  }
})

const gameArenaBattleLog = mongoose.model(
  'game_arena_battle_log',
  gameArenaBattleLogSchema
)
export default gameArenaBattleLog

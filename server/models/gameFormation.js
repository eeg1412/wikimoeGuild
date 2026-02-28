import mongoose from 'mongoose'

const gameFormationSchema = new mongoose.Schema(
  {
    account: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'game_player_accounts',
      required: true,
      index: true
    },
    // 阵容名称
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 20,
      default: '阵容'
    },
    // 阵容序号 1-10
    slot: {
      type: Number,
      required: true,
      min: 1,
      max: 10
    },
    // 5x5 棋盘，存储冒险家ID，null表示空位
    // grid[row][col], row 0-4, col 0-4
    grid: {
      type: [
        [
          {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'game_adventurer',
            default: null
          }
        ]
      ],
      default: () => Array.from({ length: 5 }, () => Array(5).fill(null))
    }
  },
  {
    timestamps: true
  }
)

// 同一账号同一slot唯一
gameFormationSchema.index({ account: 1, slot: 1 }, { unique: true })

gameFormationSchema.set('toJSON', {
  transform(_doc, ret) {
    return ret
  }
})

const gameFormation = mongoose.model('game_formation', gameFormationSchema)

export default gameFormation

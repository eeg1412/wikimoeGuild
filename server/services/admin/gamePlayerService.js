import GamePlayerAccount from '../../models/gamePlayerAccounts.js'
import GamePlayerInfo from '../../models/gamePlayerInfos.js'

/**
 * 玩家列表（分页）
 */
export async function list({ page = 1, pageSize = 20, email, guildName }) {
  page = Math.max(1, Number(page))
  pageSize = Math.min(100, Math.max(1, Number(pageSize)))

  // 先根据条件查找账号
  const accountFilter = {}
  if (email) {
    accountFilter.email = { $regex: email, $options: 'i' }
  }

  const infoFilter = {}
  if (guildName) {
    infoFilter.guildName = { $regex: guildName, $options: 'i' }
  }

  // 通过 aggregate 联表查询
  const pipeline = [
    {
      $lookup: {
        from: 'game_player_accounts',
        localField: 'account',
        foreignField: '_id',
        as: 'accountInfo'
      }
    },
    { $unwind: '$accountInfo' },
    ...(email
      ? [{ $match: { 'accountInfo.email': { $regex: email, $options: 'i' } } }]
      : []),
    ...(guildName
      ? [{ $match: { guildName: { $regex: guildName, $options: 'i' } } }]
      : []),
    { $sort: { createdAt: -1 } },
    {
      $facet: {
        list: [
          { $skip: (page - 1) * pageSize },
          { $limit: pageSize },
          {
            $project: {
              _id: 1,
              account: 1,
              guildName: 1,
              hasCustomGuildIcon: 1,
              mapCanChangeUses: 1,
              miningCanUses: 1,
              createdAt: 1,
              updatedAt: 1,
              'accountInfo.email': 1,
              'accountInfo.createdAt': 1
            }
          }
        ],
        total: [{ $count: 'count' }]
      }
    }
  ]

  const [result] = await GamePlayerInfo.aggregate(pipeline)
  const list = result?.list || []
  const total = result?.total?.[0]?.count || 0

  return { list, total }
}

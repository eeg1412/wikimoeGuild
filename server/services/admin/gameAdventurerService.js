import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import GameAdventurer from '../../models/gameAdventurer.js'
import GamePlayerInfo from '../../models/gamePlayerInfos.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const CUSTOM_AVATAR_DIR = path.resolve(
  __dirname,
  '../../public/uploads/custom-adventurer-avatar'
)

/**
 * 冒险家列表（分页）
 */
export async function list({ page = 1, pageSize = 20, name, guildName }) {
  page = Math.max(1, Number(page))
  pageSize = Math.min(100, Math.max(1, Number(pageSize)))

  const pipeline = [
    {
      $lookup: {
        from: 'game_player_infos',
        localField: 'account',
        foreignField: 'account',
        as: 'playerInfo'
      }
    },
    { $unwind: { path: '$playerInfo', preserveNullAndEmptyArrays: true } },
    ...(name ? [{ $match: { name: { $regex: name, $options: 'i' } } }] : []),
    ...(guildName
      ? [
          {
            $match: {
              'playerInfo.guildName': { $regex: guildName, $options: 'i' }
            }
          }
        ]
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
              name: 1,
              elements: 1,
              passiveBuffType: 1,
              defaultAvatarId: 1,
              hasCustomAvatar: 1,
              customAvatarUpdatedAt: 1,
              attackLevel: 1,
              defenseLevel: 1,
              speedLevel: 1,
              SANLevel: 1,
              createdAt: 1,
              'playerInfo.guildName': 1,
              'playerInfo._id': 1
            }
          }
        ],
        total: [{ $count: 'count' }]
      }
    }
  ]

  const [result] = await GameAdventurer.aggregate(pipeline)
  return {
    list: result.list || [],
    total: result.total[0]?.count || 0,
    page,
    pageSize
  }
}

/**
 * 修改冒险家名字
 */
export async function rename(id, name) {
  const adventurer = await GameAdventurer.findById(id)
  if (!adventurer) {
    const err = new Error('冒险家不存在')
    err.statusCode = 404
    err.expose = true
    throw err
  }

  // 检测敏感词
  if (global.$sensitiveFilter && global.$sensitiveFilter.contains(name)) {
    const err = new Error('名字包含违禁词')
    err.statusCode = 400
    err.expose = true
    throw err
  }

  adventurer.name = name
  await adventurer.save()
  return adventurer
}

/**
 * 重置冒险家头像为默认
 */
export async function resetAvatar(id) {
  const adventurer = await GameAdventurer.findById(id)
  if (!adventurer) {
    const err = new Error('冒险家不存在')
    err.statusCode = 404
    err.expose = true
    throw err
  }

  if (!adventurer.hasCustomAvatar) {
    const err = new Error('该冒险家未设置自定义头像')
    err.statusCode = 400
    err.expose = true
    throw err
  }

  // 删除自定义头像文件（若存在）
  const avatarFilePath = path.join(CUSTOM_AVATAR_DIR, `${id}.webp`)
  try {
    await fs.promises.unlink(avatarFilePath)
  } catch {
    // 文件不存在时忽略错误
  }

  adventurer.hasCustomAvatar = false
  adventurer.customAvatarUpdatedAt = null
  await adventurer.save()
}

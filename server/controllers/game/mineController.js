import * as mineService from '../../services/game/mineService.js'

/**
 * 获取矿场列表
 */
export async function listMines(req, res, next) {
  try {
    const { page, pageSize, minLevel, maxLevel } = req.query
    const result = await mineService.listMines({
      page: parseInt(page) || 1,
      pageSize: parseInt(pageSize) || 20,
      minLevel: minLevel ? parseInt(minLevel) : undefined,
      maxLevel: maxLevel ? parseInt(maxLevel) : undefined
    })
    res.success(result, '获取矿场列表成功')
  } catch (error) {
    next(error)
  }
}

/**
 * 获取矿场详情
 */
export async function getMineDetail(req, res, next) {
  try {
    const { mineId } = req.params
    if (!mineId || !/^[0-9a-fA-F]{24}$/.test(mineId)) {
      return res.paramError('无效的矿场ID')
    }
    const result = await mineService.getMineDetail(mineId)
    res.success(result, '获取矿场详情成功')
  } catch (error) {
    next(error)
  }
}

/**
 * 获取挖矿信息
 */
export async function getMiningInfo(req, res, next) {
  try {
    const accountId = req.player.id
    const result = await mineService.getMiningInfo(accountId)
    res.success(result, '获取挖矿信息成功')
  } catch (error) {
    next(error)
  }
}

/**
 * 挖矿（探索格子）
 */
export async function digCell(req, res, next) {
  try {
    const accountId = req.player.id
    const { mineId } = req.params
    const { row, col, formationSlot } = req.body

    if (!mineId || !/^[0-9a-fA-F]{24}$/.test(mineId)) {
      return res.paramError('无效的矿场ID')
    }

    const parsedRow = parseInt(row)
    const parsedCol = parseInt(col)
    if (
      isNaN(parsedRow) ||
      isNaN(parsedCol) ||
      parsedRow < 0 ||
      parsedRow > 9 ||
      parsedCol < 0 ||
      parsedCol > 9
    ) {
      return res.paramError('无效的坐标')
    }

    const parsedSlot = formationSlot ? parseInt(formationSlot) : null
    if (
      parsedSlot !== null &&
      (isNaN(parsedSlot) || parsedSlot < 1 || parsedSlot > 10)
    ) {
      return res.paramError('无效的阵容编号')
    }

    const result = await mineService.digCell(
      accountId,
      mineId,
      parsedRow,
      parsedCol,
      parsedSlot
    )
    res.success(result, '挖矿完成')
  } catch (error) {
    next(error)
  }
}

/**
 * 获取矿主收益
 */
export async function getOwnerRevenue(req, res, next) {
  try {
    const accountId = req.player.id
    const { page, pageSize } = req.query
    const result = await mineService.getOwnerRevenue(accountId, {
      page: parseInt(page) || 1,
      pageSize: parseInt(pageSize) || 20
    })
    res.success(result, '获取矿主收益成功')
  } catch (error) {
    next(error)
  }
}

/**
 * 矿场 SSE 实时推送
 */
export async function sseConnect(req, res, next) {
  try {
    const accountId = req.player.id
    const { mineId } = req.params

    if (!mineId || !/^[0-9a-fA-F]{24}$/.test(mineId)) {
      return res.paramError('无效的矿场ID')
    }

    // 设置 SSE 响应头
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no'
    })

    // 发送初始连接成功消息
    res.write(`data: ${JSON.stringify({ type: 'connected' })}\n\n`)

    // 注册 SSE 客户端
    mineService.registerSSEClient(mineId, accountId, res)

    // 心跳（每30秒）
    const heartbeatTimer = setInterval(() => {
      try {
        res.write(': heartbeat\n\n')
      } catch {
        clearInterval(heartbeatTimer)
      }
    }, 30000)

    // 清理
    req.on('close', () => {
      clearInterval(heartbeatTimer)
    })
  } catch (error) {
    next(error)
  }
}

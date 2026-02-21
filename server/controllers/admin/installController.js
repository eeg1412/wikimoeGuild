import * as installService from '../../services/admin/installService.js'

/**
 * 检查是否已初始化
 */
export async function checkInited(req, res, next) {
  try {
    const inited = await installService.checkInited()
    res.success({ inited }, inited ? '已完成初始化' : '未初始化')
  } catch (error) {
    next(error)
  }
}

/**
 * 执行站点初始化
 * 若已初始化则直接关闭连接（类似 nginx 444）
 */
export async function install(req, res, next) {
  try {
    const result = await installService.install(req.body)
    if (result === null) {
      // 已安装，444：关闭连接不返回任何内容
      return res.socket?.destroy()
    }
    res.success(null, '初始化成功')
  } catch (error) {
    next(error)
  }
}

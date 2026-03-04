import cron from 'node-cron'
import { settleCurrentSeason } from '../services/game/arenaService.js'
import logger from '../utils/logger.js'

/**
 * 初始化定时任务
 * 赛季结束日凌晨3点开始结算奖励
 */
export function initCronJobs() {
  // 每天凌晨3点检查是否需要结算赛季
  cron.schedule('0 3 * * *', async () => {
    logger.info('[Cron] 开始检查竞技场赛季结算...')
    try {
      const result = await settleCurrentSeason()
      logger.info(`[Cron] 竞技场赛季结算结果: ${result.message}`)
    } catch (error) {
      logger.error('[Cron] 竞技场赛季结算失败:', error)
    }
  })

  // // 服务启动时也检查一次，防止因服务重启导致定时任务未执行
  // setTimeout(async () => {
  //   logger.info('[Cron] 服务启动，检查是否有未结算的赛季...')
  //   try {
  //     const result = await settleCurrentSeason()
  //     logger.info(`[Cron] 启动结算检查结果: ${result.message}`)
  //   } catch (error) {
  //     logger.error('[Cron] 启动结算检查失败:', error)
  //   }
  // }, 5000) // 延迟5秒等待数据库连接就绪

  logger.info('[Cron] 定时任务已初始化')
}

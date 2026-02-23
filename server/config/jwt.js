/**
 * JWT 业务配置
 * 过期时间由程序员根据业务需求直接修改此处，不通过环境变量控制。
 *
 * 双 Token 机制：
 *  - accessToken：短效，用于接口鉴权（15 分钟）
 *  - refreshToken：长效，仅用于刷新 accessToken
 */
export const JWT_CONFIG = {
  /**
   * 玩家端 token 配置
   */
  player: {
    /** 接口鉴权 token 有效期 */
    accessTokenExpiresIn: '15m',
    /** 刷新 token 有效期（普通登录） */
    refreshTokenExpiresIn: '24h',
    /** 刷新 token 有效期（保持登录状态） */
    rememberMeRefreshTokenExpiresIn: '365d'
  },

  /**
   * 管理后台 token 配置
   */
  admin: {
    /** 接口鉴权 token 有效期 */
    accessTokenExpiresIn: '15m',
    /** 刷新 token 有效期（普通登录） */
    refreshTokenExpiresIn: '2h',
    /** 刷新 token 有效期（保持登录状态） */
    rememberMeRefreshTokenExpiresIn: '365d'
  }
}

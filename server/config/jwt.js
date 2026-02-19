/**
 * JWT 业务配置
 * 过期时间由程序员根据业务需求直接修改此处，不通过环境变量控制。
 */
export const JWT_CONFIG = {
  /**
   * 用户界面 token 配置
   * 用于普通用户登录后的身份凭证
   */
  user: {
    expiresIn: '7d'
  },

  /**
   * 管理后台 token 配置
   * 有效期更短，降低管理端 token 泄露的风险
   */
  admin: {
    expiresIn: '2h'
  }
}

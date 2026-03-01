import nodemailer from 'nodemailer'

/**
 * 发送邮件
 * @param {object} options
 * @param {string|string[]} options.to       - 收件人
 * @param {string}          options.subject  - 邮件主题
 * @param {string}          [options.text]   - 纯文本内容
 * @param {string}          [options.html]   - HTML 内容
 * @returns {Promise<import('nodemailer').SentMessageInfo>}
 */
export async function sendMail({ to, subject, text, html }) {
  const emailSettings = global.$globalConfig?.emailSettings || {}
  const {
    emailSmtpHost,
    emailSmtpPort,
    emailSmtpSecure,
    emailSender,
    emailPassword
  } = emailSettings

  if (!emailSmtpHost || !emailSender || !emailPassword) {
    const err = new Error('邮件服务未配置，请先在管理后台完成邮件配置')
    err.statusCode = 500
    err.expose = true
    throw err
  }

  const transporter = nodemailer.createTransport({
    host: emailSmtpHost,
    port: Number(emailSmtpPort) || 465,
    secure: emailSmtpSecure !== false,
    auth: {
      user: emailSender,
      pass: emailPassword
    }
  })

  const siteTitle =
    global.$globalConfig?.siteSettings?.siteTitle || 'WikimoeGuild'

  const info = await transporter.sendMail({
    from: `"${siteTitle}" <${emailSender}>`,
    to: Array.isArray(to) ? to.join(', ') : to,
    subject,
    text,
    html
  })

  return info
}

/**
 * 发送验证码邮件
 * @param {string} to    - 收件人邮箱
 * @param {string} code  - 验证码
 * @param {'register'|'resetPassword'} type - 场景
 */
export async function sendVerifyCodeMail(to, code, type = 'register') {
  const siteTitle =
    global.$globalConfig?.siteSettings?.siteTitle || 'WikimoeGuild'

  const sceneMap = {
    register: '注册',
    resetPassword: '重置密码',
    guestBind: '绑定邮箱'
  }
  const scene = sceneMap[type] || '验证'

  const subject = `【${siteTitle}】${scene}验证码`
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;border:1px solid #e5e7eb;border-radius:8px;">
      <h2 style="color:#374151;margin-bottom:16px;">${siteTitle}</h2>
      <p style="color:#6b7280;margin-bottom:8px;">您正在进行 <strong>${scene}</strong> 操作，验证码为：</p>
      <div style="font-size:32px;font-weight:bold;letter-spacing:8px;color:#2563eb;text-align:center;padding:16px 0;">
        ${code}
      </div>
      <p style="color:#9ca3af;font-size:13px;margin-top:16px;">验证码有效期 <strong>15 分钟</strong>，请勿泄露给他人。</p>
    </div>
  `

  return sendMail({ to, subject, html })
}

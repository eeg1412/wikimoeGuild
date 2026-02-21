import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PUBLIC_DIR = path.resolve(__dirname, '../public')

/**
 * 将 base64 字符串保存为图片文件
 * @param {string} base64String - base64 图片字符串（必须包含 data:image/...;base64, 前缀）
 * @param {string} folderName - 保存文件夹名（相对于 public/uploads/），必须项
 * @param {string} filename - 文件名，必须项
 * @returns {Promise<string>} 返回文件的相对路径 (/uploads/folder/filename)
 * @throws {Error} 验证失败时抛出错误
 */
export async function saveBase64Image(base64String, folderName, filename) {
  // 1. 验证必填参数
  if (!base64String || typeof base64String !== 'string') {
    throw new Error('base64String 是必填项')
  }

  if (!folderName || typeof folderName !== 'string') {
    throw new Error('folderName 是必填项')
  }

  if (!filename || typeof filename !== 'string') {
    throw new Error('filename 是必填项')
  }

  // 2. 验证 base64 格式和提取数据（必须包含 MIME 类型前缀）
  const base64Match = base64String.match(
    /^data:image\/([a-zA-Z0-9+.-]*);base64,(.+)$/
  )
  if (!base64Match) {
    throw new Error('base64 格式不正确，必须包含 data:image/...;base64, 前缀')
  }

  const mimeType = base64Match[1]
  const base64Data = base64Match[2]

  // 3. 验证 MIME 类型
  const validMimeTypes = ['png', 'jpeg', 'jpg', 'gif', 'webp', 'svg+xml']
  if (!validMimeTypes.includes(mimeType)) {
    throw new Error(`不支持的图片格式: ${mimeType}`)
  }

  // 4. 验证 base64 数据大小（1MB 限制）
  const maxSize = 1024 * 1024 // 1MB
  if (base64Data.length > maxSize) {
    throw new Error(
      `图片文件过大，不能超过 1MB (当前: ${(base64Data.length / 1024 / 1024).toFixed(2)}MB)`
    )
  }

  // 5. 解析并验证 buffer 内容（magic bytes 检查）
  let buffer
  try {
    buffer = Buffer.from(base64Data, 'base64')
  } catch (e) {
    throw new Error('base64 数据损坏或无效')
  }

  if (!isValidImageBuffer(buffer)) {
    throw new Error('图片内容验证失败，magic bytes 不匹配')
  }

  // 6. 验证文件夹路径安全性（防止路径穿越）
  if (
    folderName.includes('..') ||
    folderName.startsWith('/') ||
    folderName.includes('\\')
  ) {
    throw new Error('无效的文件夹路径')
  }

  // 7. 验证文件名安全性
  if (
    filename.includes('../') ||
    filename.includes('..\\') ||
    filename.includes('/') ||
    filename.includes('\\')
  ) {
    throw new Error('文件名包含非法字符')
  }

  // 8. 构建完整的文件夹路径
  const uploadDir = path.join(PUBLIC_DIR, 'uploads', folderName)

  // 确保路径在 PUBLIC_DIR/uploads 下
  const resolvedPath = path.resolve(uploadDir)
  const allowedPath = path.resolve(PUBLIC_DIR, 'uploads')
  if (!resolvedPath.startsWith(allowedPath)) {
    throw new Error('文件夹路径超出允许范围')
  }

  // 9. 创建文件夹（如果不存在）
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true })
  }

  // 10. 保存文件
  const filePath = path.join(uploadDir, filename)

  try {
    fs.writeFileSync(filePath, buffer)
  } catch (e) {
    throw new Error(`保存图片文件失败: ${e.message}`)
  }

  // 返回相对 URL 路径
  return `/uploads/${folderName}/${filename}`
}

/**
 * 验证 buffer 是否为有效的图片
 * @param {Buffer} buffer
 * @returns {boolean}
 */
function isValidImageBuffer(buffer) {
  if (buffer.length < 8) return false

  // PNG: 89 50 4E 47
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return true
  }

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return true
  }

  // GIF: 47 49 46
  if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46) {
    return true
  }

  // WebP: RIFF ... WEBP
  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return true
  }

  return false
}

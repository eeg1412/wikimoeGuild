import { writeFileSync, mkdirSync } from 'fs'
import { deflateSync } from 'zlib'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export function generateIconByObjectId(objectId) {
  const outputDir = join(
    __dirname,
    '..',
    'public',
    'uploads',
    'default-guild-icon'
  )

  mkdirSync(outputDir, { recursive: true })

  const outputPath = join(outputDir, `${objectId}.png`)

  const timestamp = parseInt(objectId.slice(0, 8), 16)
  const counter = parseInt(objectId.slice(-6), 16)

  const size = 128
  const block = 16
  const grid = size / block

  let seed = counter ^ 0x9e3779b9 ^ timestamp

  function rand() {
    seed = (seed * 1664525 + 1013904223) >>> 0
    return seed / 0xffffffff
  }

  const hue = counter % 360

  function hslToRgb(h, s, l) {
    s /= 100
    l /= 100
    const k = n => (n + h / 30) % 12
    const a = s * Math.min(l, 1 - l)
    const f = n =>
      l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))
    return [
      Math.round(255 * f(0)),
      Math.round(255 * f(8)),
      Math.round(255 * f(4))
    ]
  }

  const bgColor = hslToRgb(hue, 35, 92)
  const mainColor = hslToRgb(hue, 65, 55)
  const darkColor = hslToRgb(hue, 65, 40)

  const blocks = []

  for (let y = 0; y < grid; y++) {
    blocks[y] = []
    for (let x = 0; x < grid / 2; x++) {
      blocks[y][x] = rand()
    }
  }

  const raw = Buffer.alloc((size * 4 + 1) * size)

  for (let y = 0; y < size; y++) {
    const rowStart = y * (size * 4 + 1)
    raw[rowStart] = 0

    for (let x = 0; x < size; x++) {
      const gx = Math.floor(x / block)
      const gy = Math.floor(y / block)

      const value = gx < grid / 2 ? blocks[gy][gx] : blocks[gy][grid - gx - 1]

      let color = bgColor

      if (value > 0.5) color = value > 0.85 ? darkColor : mainColor

      const i = rowStart + 1 + x * 4

      raw[i] = color[0]
      raw[i + 1] = color[1]
      raw[i + 2] = color[2]
      raw[i + 3] = 255
    }
  }

  const compressed = deflateSync(raw)

  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])

  function chunk(type, data) {
    const len = Buffer.alloc(4)
    len.writeUInt32BE(data.length)
    const name = Buffer.from(type)
    const crcBuf = Buffer.alloc(4)
    crcBuf.writeUInt32BE(crc32(Buffer.concat([name, data])))
    return Buffer.concat([len, name, data, crcBuf])
  }

  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8
  ihdr[9] = 6

  const pngBuffer = Buffer.concat([
    signature,
    chunk('IHDR', ihdr),
    chunk('IDAT', compressed),
    chunk('IEND', Buffer.alloc(0))
  ])

  writeFileSync(outputPath, pngBuffer)

  return `/uploads/default-guild-icon/${objectId}.png`
}

function crc32(buf) {
  const table = crc32.table || (crc32.table = makeTable())
  let crc = -1
  for (let i = 0; i < buf.length; i++)
    crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xff]
  return (crc ^ -1) >>> 0
}

function makeTable() {
  const table = []
  for (let i = 0; i < 256; i++) {
    let c = i
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    table[i] = c >>> 0
  }
  return table
}

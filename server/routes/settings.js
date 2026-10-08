import { Router } from 'express'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { db } from '../db.js'
import { authMiddleware } from '../middleware/auth.js'
import { adminMiddleware } from '../middleware/admin.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const router = Router()

const RANKING_CATEGORIES = ['学习', '行为', '健康', '其他']

// 收款信息默认值（与历史硬编码内容保持一致）
export const DEFAULT_PAYMENT_INFO = {
  wechatPhone: '13604023002',
  qrCodeUrl: '/wechat-pay-qrcode.png',
}

// 允许的收款码图片类型与体积上限（2MB）
const QR_ALLOWED_MIME = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/gif': 'gif',
}
const QR_MAX_BYTES = 2 * 1024 * 1024

async function readPaymentInfo() {
  const row = await db.prepare("SELECT value FROM settings WHERE `key` = 'paymentInfo'").get()
  let stored = {}
  if (row?.value) {
    try {
      const parsed = JSON.parse(row.value)
      if (parsed && typeof parsed === 'object') stored = parsed
    } catch {
      stored = {}
    }
  }
  return {
    wechatPhone: typeof stored.wechatPhone === 'string' && stored.wechatPhone.trim()
      ? stored.wechatPhone.trim()
      : DEFAULT_PAYMENT_INFO.wechatPhone,
    qrCodeUrl: typeof stored.qrCodeUrl === 'string' && stored.qrCodeUrl.trim()
      ? stored.qrCodeUrl.trim()
      : DEFAULT_PAYMENT_INFO.qrCodeUrl,
  }
}

// 校验收款码地址：仅接受站内相对路径或 http(s) 绝对地址
function normalizeQrCodeUrl(raw) {
  const value = String(raw ?? '').trim()
  if (!value) {
    return { url: '' }
  }
  if (value.length > 2048) {
    return { error: '收款码地址过长' }
  }
  if (value.startsWith('/') && !value.startsWith('//')) {
    return { url: value }
  }
  if (/^https?:\/\//i.test(value)) {
    try {
      return { url: new URL(value).toString() }
    } catch {
      return { error: '收款码地址格式不正确' }
    }
  }
  return { error: '收款码地址需以 / 或 http(s):// 开头' }
}

async function buildCategoryRankings(students, classId) {
  const categoryRows = await db.prepare(`
    SELECT student_id, category, SUM(points) as category_points
    FROM evaluation_records
    WHERE class_id = ?
    GROUP BY student_id, category
  `).all(classId)

  const pointsByStudent = {}
  for (const row of categoryRows) {
    if (!pointsByStudent[row.student_id]) {
      pointsByStudent[row.student_id] = {}
    }
    pointsByStudent[row.student_id][row.category] = row.category_points
  }

  const categoryRankings = {}
  for (const category of RANKING_CATEGORIES) {
    categoryRankings[category] = students
      .map(student => ({
        ...student,
        category_points: pointsByStudent[student.id]?.[category] ?? 0,
      }))
      .filter(student => student.category_points !== 0)
      .sort((a, b) => {
        if (b.category_points !== a.category_points) {
          return b.category_points - a.category_points
        }
        return b.pet_level - a.pet_level
      })
  }

  return categoryRankings
}

// 获取设置（公开接口）
router.get('/', async (req, res) => {
  const settings = await db.prepare('SELECT `key`, value FROM settings').all()
  const result = {}
  for (const s of settings) {
    result[s.key] = JSON.parse(s.value)
  }
  res.json(result)
})

// 获取收款信息（公开接口，供会员页展示）
router.get('/payment', async (req, res) => {
  res.json(await readPaymentInfo())
})

// 获取收款信息（管理员，含默认值标记）
router.get('/payment/admin', adminMiddleware, async (req, res) => {
  res.json({ ...(await readPaymentInfo()), defaults: DEFAULT_PAYMENT_INFO })
})

// 保存收款信息（管理员）
router.put('/payment', adminMiddleware, async (req, res) => {
  const { wechatPhone, qrCodeUrl } = req.body || {}

  const phone = String(wechatPhone ?? '').trim()
  if (!phone) {
    return res.status(400).json({ error: '请填写管理员微信号' })
  }
  if (phone.length > 64) {
    return res.status(400).json({ error: '管理员微信号过长' })
  }

  const normalized = normalizeQrCodeUrl(qrCodeUrl)
  if (normalized.error) {
    return res.status(400).json({ error: normalized.error })
  }
  if (!normalized.url) {
    return res.status(400).json({ error: '请填写收款码图片地址' })
  }

  const payload = JSON.stringify({ wechatPhone: phone, qrCodeUrl: normalized.url })
  const existing = await db.prepare("SELECT `key` FROM settings WHERE `key` = 'paymentInfo'").get()
  if (existing) {
    await db.prepare("UPDATE settings SET value = ? WHERE `key` = 'paymentInfo'").run(payload)
  } else {
    await db.prepare("INSERT INTO settings (`key`, value) VALUES ('paymentInfo', ?)").run(payload)
  }

  res.json({
    success: true,
    message: '收款信息已保存',
    ...(await readPaymentInfo()),
  })
})

// 上传收款码图片（管理员，存为 data URL 直接入库）
router.post('/payment/qrcode', adminMiddleware, async (req, res) => {
  const { dataUrl } = req.body || {}
  const value = String(dataUrl ?? '')
  const match = /^data:([\w.+-]+\/[\w.+-]+);base64,(.+)$/i.exec(value)
  if (!match) {
    return res.status(400).json({ error: '图片格式不正确，请上传 PNG/JPG/WEBP/GIF' })
  }

  const mime = match[1].toLowerCase()
  if (!QR_ALLOWED_MIME[mime]) {
    return res.status(400).json({ error: '仅支持 PNG、JPG、WEBP、GIF 格式的图片' })
  }

  let buffer
  try {
    buffer = Buffer.from(match[2], 'base64')
  } catch {
    return res.status(400).json({ error: '图片数据解析失败' })
  }
  if (!buffer.length) {
    return res.status(400).json({ error: '图片内容为空' })
  }
  if (buffer.length > QR_MAX_BYTES) {
    return res.status(400).json({ error: '图片不能超过 2MB' })
  }

  // 保存到 server/public/uploads，通过 /api/uploads 静态访问，避免撑大数据库
  const uploadsDir = path.resolve(__dirname, '../public/uploads')
  await fs.promises.mkdir(uploadsDir, { recursive: true })
  const filename = `wechat-qrcode-${Date.now()}.${QR_ALLOWED_MIME[mime]}`
  await fs.promises.writeFile(path.join(uploadsDir, filename), buffer)

  res.json({ success: true, qrCodeUrl: `/api/uploads/${filename}` })
})

// 修复经验值（将 pet_exp 与 total_points 同步）
router.post('/fix-exp', authMiddleware, async (req, res) => {
  // Sync pet_exp with total_points for students with pets (只处理当前用户的班级)
  const result = await db.prepare(`
    UPDATE students SET pet_exp = GREATEST(0, total_points)
    WHERE pet_type IS NOT NULL
    AND class_id IN (SELECT id FROM classes WHERE user_id = ?)
  `).run(req.userId)
  res.json({ success: true, updated: result.changes })
})

// 获取排行榜
router.get('/ranking/:classId', authMiddleware, async (req, res) => {
  // 验证班级归属
  const cls = await db.prepare('SELECT * FROM classes WHERE id = ?').get(req.params.classId)
  if (!cls || cls.user_id !== req.userId) {
    return res.status(403).json({ error: '无权访问此班级' })
  }

  const ranking = await db.prepare(`
    SELECT s.*,
           (SELECT COUNT(*) FROM badges WHERE student_id = s.id) as badge_count
    FROM students s
    WHERE s.class_id = ?
    ORDER BY s.total_points DESC, s.pet_level DESC
  `).all(req.params.classId)

  const categoryRankings = await buildCategoryRankings(ranking, req.params.classId)

  res.json({ ranking, categoryRankings })
})

export default router

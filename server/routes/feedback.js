import { Router } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { db } from '../db.js'
import { authMiddleware } from '../middleware/auth.js'
import { adminMiddleware } from '../middleware/admin.js'

const router = Router()

const FEEDBACK_TYPES = ['suggestion', 'bug', 'billing', 'other']

// 提交反馈（公开：老师/游客均可，无需登录）
router.post('/', async (req, res) => {
  const { type, content, contact } = req.body || {}
  const text = String(content ?? '').trim()
  if (text.length < 5) {
    return res.status(400).json({ error: '请至少填写 5 个字，方便我们理解' })
  }
  if (text.length > 2000) {
    return res.status(400).json({ error: '内容过长，请精简到 2000 字以内' })
  }
  if (!FEEDBACK_TYPES.includes(type)) {
    return res.status(400).json({ error: '反馈类型不正确' })
  }

  await db.prepare(`
    INSERT INTO feedbacks (id, type, content, contact, status, created_at)
    VALUES (?, ?, ?, ?, 'pending', ?)
  `).run(uuidv4(), type, text, String(contact ?? '').slice(0, 64), Date.now())

  res.json({ success: true, message: '感谢反馈！我们会认真查看每一条建议' })
})

// 反馈列表（管理员）
router.get('/all', adminMiddleware, async (req, res) => {
  const rows = await db.prepare(`
    SELECT * FROM feedbacks ORDER BY created_at DESC LIMIT 200
  `).all()

  res.json({
    feedbacks: rows.map(row => ({
      id: row.id,
      type: row.type,
      content: row.content,
      contact: row.contact,
      status: row.status,
      createdAt: Number(row.created_at),
    })),
  })
})

// 标记反馈已处理（管理员）
router.put('/:id/status', adminMiddleware, async (req, res) => {
  const status = String(req.body?.status ?? '')
  if (!['pending', 'done'].includes(status)) {
    return res.status(400).json({ error: '状态不正确' })
  }
  const result = await db.prepare('UPDATE feedbacks SET status = ? WHERE id = ?').run(status, req.params.id)
  if (!result.changes) {
    return res.status(404).json({ error: '反馈不存在' })
  }
  res.json({ success: true })
})

export default router

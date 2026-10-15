import { Router } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { db } from '../db.js'
import { authMiddleware } from '../middleware/auth.js'
import { adminMiddleware } from '../middleware/admin.js'
import { isValidPhone } from '../utils/phone.js'

const router = Router()

// ===== 家长订阅（公开：家长在分享页留下手机号，订阅孩子被表扬的通知） =====
router.post('/subscribe', async (req, res) => {
  const { studentId, phone } = req.body || {}

  if (!studentId) {
    return res.status(400).json({ error: '参数不完整' })
  }
  if (!isValidPhone(phone)) {
    return res.status(400).json({ error: '请输入正确的手机号' })
  }

  const student = await db.prepare('SELECT id FROM students WHERE id = ?').get(studentId)
  if (!student) {
    return res.status(404).json({ error: '学生不存在' })
  }

  const existing = await db.prepare(
    'SELECT id FROM parent_subscribes WHERE student_id = ? AND phone = ?'
  ).get(studentId, String(phone).trim())
  if (existing) {
    return res.json({ success: true, message: '已订阅，有新的表扬会及时通知你' })
  }

  await db.prepare(`
    INSERT INTO parent_subscribes (id, student_id, phone, channel, created_at)
    VALUES (?, ?, ?, 'sms', ?)
  `).run(uuidv4(), studentId, String(phone).trim(), Date.now())

  res.json({ success: true, message: '订阅成功！有新的表扬会及时通知你' })
})

// ===== 管理端：家长通知 =====
// 订阅与通知概览
router.get('/overview', adminMiddleware, async (req, res) => {
  const [subscribes, logs] = await Promise.all([
    db.prepare(`
      SELECT ps.id, ps.student_id, ps.phone, ps.created_at, s.name AS student_name, c.name AS class_name
      FROM parent_subscribes ps
      JOIN students s ON s.id = ps.student_id
      JOIN classes c ON c.id = s.class_id
      ORDER BY ps.created_at DESC
      LIMIT 200
    `).all(),
    db.prepare(`
      SELECT * FROM notify_logs ORDER BY created_at DESC LIMIT 100
    `).all(),
  ])

  res.json({
    subscribes: subscribes.map(row => ({
      id: row.id,
      studentId: row.student_id,
      phone: row.phone,
      studentName: row.student_name,
      className: row.class_name,
      createdAt: Number(row.created_at),
    })),
    logs: logs.map(row => ({
      id: row.id,
      studentId: row.student_id,
      studentName: row.student_name,
      className: row.class_id,
      content: row.content,
      channel: row.channel,
      status: row.status,
      createdAt: Number(row.created_at),
      sentAt: row.sent_at ? Number(row.sent_at) : null,
    })),
  })
})

// 创建家长通知（记录待发送；短信/公众号通道接入后自动发出）
router.post('/', adminMiddleware, async (req, res) => {
  const { studentId, content } = req.body || {}
  const text = String(content ?? '').trim()
  if (!studentId || !text) {
    return res.status(400).json({ error: '请选择学生并填写通知内容' })
  }
  if (text.length > 200) {
    return res.status(400).json({ error: '通知内容不超过 200 字' })
  }

  const student = await db.prepare(`
    SELECT s.id, s.name, s.class_id, c.name AS class_name
    FROM students s JOIN classes c ON c.id = s.class_id
    WHERE s.id = ?
  `).get(studentId)
  if (!student) {
    return res.status(404).json({ error: '学生不存在' })
  }

  await db.prepare(`
    INSERT INTO notify_logs (id, student_id, student_name, class_id, content, channel, status, created_at)
    VALUES (?, ?, ?, ?, ?, 'sms', 'pending', ?)
  `).run(uuidv4(), student.id, student.name, student.class_id, text, Date.now())

  // TODO: 接入短信/微信公众号模板消息通道后，在这里按 parent_subscribes 订阅手机号实际发送
  res.json({ success: true, message: '通知已记录（发送通道接入后自动发出）' })
})

// 标记通知已发送（管理员手动确认）
router.put('/:id/sent', adminMiddleware, async (req, res) => {
  const result = await db.prepare(
    "UPDATE notify_logs SET status = 'sent', sent_at = ? WHERE id = ?"
  ).run(Date.now(), req.params.id)
  if (!result.changes) {
    return res.status(404).json({ error: '通知不存在' })
  }
  res.json({ success: true })
})

export default router

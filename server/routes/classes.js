import { Router } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { db } from '../db.js'
import { authMiddleware } from '../middleware/auth.js'
import { grantWelcomeVipIfEligible } from '../utils/welcomeVip.js'
import { normalizeVipRow } from './vip.js'

const router = Router()
const DEMO_CLASS_ID = 'demo-class-2026'

// 获取班级列表（只返回当前用户的班级）
router.get('/', authMiddleware, async (req, res) => {
  const classes = await db.prepare('SELECT * FROM classes WHERE user_id = ? ORDER BY created_at DESC').all(req.userId)
  res.json({ classes })
})

// 演示班级始终通过游客账户读取，避免与当前登录老师的班级列表混在一起。
router.get('/demo', authMiddleware, async (req, res) => {
  const demoClass = await db.prepare('SELECT * FROM classes WHERE id = ?').get(DEMO_CLASS_ID)
  if (!demoClass) {
    return res.status(404).json({ error: '演示班级不存在' })
  }
  const students = await db.prepare(
    'SELECT * FROM students WHERE class_id = ? ORDER BY total_points DESC, name'
  ).all(DEMO_CLASS_ID)
  const records = await db.prepare(`
    SELECT er.*, s.name AS student_name
    FROM evaluation_records er
    JOIN students s ON er.student_id = s.id
    WHERE er.class_id = ?
    ORDER BY er.timestamp DESC
    LIMIT 20
  `).all(DEMO_CLASS_ID)
  const totalRow = await db.prepare(
    'SELECT COUNT(*) AS total FROM evaluation_records WHERE class_id = ?'
  ).get(DEMO_CLASS_ID)
  const total = totalRow.total

  res.json({ class: demoClass, students, records, total })
})

// 获取班级学生列表（与前端 /classes/:classId/students 路径对齐）
router.get('/:classId/students', authMiddleware, async (req, res) => {
  const classInfo = await db.prepare('SELECT user_id FROM classes WHERE id = ?').get(req.params.classId)
  if (!classInfo) {
    return res.status(404).json({ error: '班级不存在' })
  }
  if (classInfo.user_id !== req.userId) {
    return res.status(403).json({ error: '无权访问此班级' })
  }
  const students = await db.prepare(
    'SELECT * FROM students WHERE class_id = ? ORDER BY total_points DESC, name'
  ).all(req.params.classId)
  res.json({ students })
})

// 创建班级（关联当前用户）
router.post('/', authMiddleware, async (req, res) => {
  const { name } = req.body
  const id = uuidv4()
  const now = Date.now()

  await db.prepare('INSERT INTO classes (id, user_id, name, created_at, updated_at) VALUES (?, ?, ?, ?, ?)')
    .run(id, req.userId, name, now, now)

  const welcomeVip = await grantWelcomeVipIfEligible(db, req.userId, id)
  const vip = welcomeVip
    ? normalizeVipRow(await db.prepare('SELECT * FROM class_vip_subscriptions WHERE class_id = ?').get(id))
    : null

  res.json({
    id,
    user_id: req.userId,
    name,
    created_at: now,
    updated_at: now,
    welcomeVipGranted: Boolean(welcomeVip),
    vip,
  })
})

// 更新班级
router.put('/:id', authMiddleware, async (req, res) => {
  const { name } = req.body
  const classInfo = await db.prepare('SELECT user_id FROM classes WHERE id = ?').get(req.params.id)

  if (!classInfo) {
    return res.status(404).json({ error: '班级不存在' })
  }
  if (classInfo.user_id !== req.userId) {
    return res.status(403).json({ error: '无权修改' })
  }

  const now = Date.now()
  await db.prepare('UPDATE classes SET name = ?, updated_at = ? WHERE id = ?').run(name, now, req.params.id)
  res.json({ success: true })
})

// 删除班级
router.delete('/:id', authMiddleware, async (req, res) => {
  const classInfo = await db.prepare('SELECT user_id FROM classes WHERE id = ?').get(req.params.id)

  if (!classInfo) {
    return res.status(404).json({ error: '班级不存在' })
  }
  if (classInfo.user_id !== req.userId) {
    return res.status(403).json({ error: '无权删除' })
  }

  // Delete students in this class first
  await db.prepare('DELETE FROM students WHERE class_id = ?').run(req.params.id)
  await db.prepare('DELETE FROM classes WHERE id = ?').run(req.params.id)
  res.json({ success: true })
})

// ===== 班级分享（班级码） =====
// 获取或生成班级分享密钥
router.get('/:id/share-token', authMiddleware, async (req, res) => {
  const classInfo = await db.prepare('SELECT id, user_id, share_token FROM classes WHERE id = ?').get(req.params.id)
  if (!classInfo) {
    return res.status(404).json({ error: '班级不存在' })
  }
  if (classInfo.user_id !== req.userId) {
    return res.status(403).json({ error: '无权访问' })
  }

  let token = classInfo.share_token
  if (!token) {
    token = uuidv4().replace(/-/g, '')
    await db.prepare('UPDATE classes SET share_token = ? WHERE id = ?').run(token, req.params.id)
  }
  res.json({ shareToken: token })
})

// 重置分享密钥（旧链接立即失效）
router.post('/:id/share-token/reset', authMiddleware, async (req, res) => {
  const classInfo = await db.prepare('SELECT id, user_id FROM classes WHERE id = ?').get(req.params.id)
  if (!classInfo) {
    return res.status(404).json({ error: '班级不存在' })
  }
  if (classInfo.user_id !== req.userId) {
    return res.status(403).json({ error: '无权访问' })
  }

  const token = uuidv4().replace(/-/g, '')
  await db.prepare('UPDATE classes SET share_token = ? WHERE id = ?').run(token, req.params.id)
  res.json({ shareToken: token })
})

// ===== 学年管理 =====
// 归档 / 恢复班级
router.put('/:id/archive', authMiddleware, async (req, res) => {
  const { archived } = req.body || {}
  const classInfo = await db.prepare('SELECT id, user_id FROM classes WHERE id = ?').get(req.params.id)
  if (!classInfo) {
    return res.status(404).json({ error: '班级不存在' })
  }
  if (classInfo.user_id !== req.userId) {
    return res.status(403).json({ error: '无权操作' })
  }

  await db.prepare('UPDATE classes SET archived = ?, updated_at = ? WHERE id = ?')
    .run(archived ? 1 : 0, Date.now(), req.params.id)
  res.json({ success: true, archived: Boolean(archived) })
})

// 复制班级到新学年（复制班级与学生名单，不带评价记录）
router.post('/:id/copy', authMiddleware, async (req, res) => {
  const source = await db.prepare('SELECT id, user_id, name FROM classes WHERE id = ?').get(req.params.id)
  if (!source) {
    return res.status(404).json({ error: '班级不存在' })
  }
  if (source.user_id !== req.userId) {
    return res.status(403).json({ error: '无权操作' })
  }

  const now = Date.now()
  const newId = uuidv4()
  await db.prepare('INSERT INTO classes (id, user_id, name, created_at, updated_at, archived) VALUES (?, ?, ?, ?, ?, 0)')
    .run(newId, req.userId, `${source.name}（新学年）`, now, now)

  const students = await db.prepare('SELECT name, student_no FROM students WHERE class_id = ?').all(req.params.id)
  for (const student of students) {
    await db.prepare(`
      INSERT INTO students (id, class_id, name, student_no, total_points, pet_level, pet_exp, created_at)
      VALUES (?, ?, ?, ?, 0, 1, 0, ?)
    `).run(uuidv4(), newId, student.name, student.student_no, now)
  }

  res.json({ success: true, class: { id: newId, name: `${source.name}（新学年）`, studentCount: students.length } })
})

export default router

import { Router } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { db } from '../db.js'
import { hashPassword, verifyPassword } from '../utils/password.js'
import { generateToken, verifyToken } from '../utils/token.js'
import { authMiddleware } from '../middleware/auth.js'
import { sendTeacherRegisterNotice } from '../services/showDocPushService.js'
import { isValidPhone } from '../utils/phone.js'
import { markWelcomeVipEligible } from '../utils/welcomeVip.js'
import { registerRateLimit, loginRateLimit } from '../middleware/rateLimit.js'

const router = Router()

// 注册
router.post('/register', registerRateLimit, async (req, res) => {
  const { username, password } = req.body

  if (!username || !password) {
    return res.status(400).json({ error: '手机号和密码不能为空' })
  }

  if (!isValidPhone(username)) {
    return res.status(400).json({ error: '请输入正确的手机号' })
  }

  if (password.length < 6) {
    return res.status(400).json({ error: '密码至少6位' })
  }

  const existingUser = await db.prepare('SELECT id FROM users WHERE username = ?').get(username)
  if (existingUser) {
    return res.status(400).json({ error: '该手机号已注册' })
  }

  const userId = uuidv4()
  const passwordHash = hashPassword(password)

  const createdAt = Date.now()
  await db.prepare('INSERT INTO users (id, username, password_hash, is_guest, created_at) VALUES (?, ?, ?, ?, ?)')
    .run(userId, username, passwordHash, 0, createdAt)

  await markWelcomeVipEligible(db, userId)

  void sendTeacherRegisterNotice(username, new Date(createdAt))

  const token = generateToken(userId)
  res.json({
    success: true,
    token,
    user: { id: userId, username, isGuest: false },
    welcomeVip: {
      months: 1,
      message: '创建首个班级后自动开通 1 个月灵犀计划',
    },
  })
})

// 登录
router.post('/login', loginRateLimit, async (req, res) => {
  const { username, password } = req.body

  if (!username || !password) {
    return res.status(400).json({ error: '手机号和密码不能为空' })
  }

  const user = await db.prepare('SELECT id, username, password_hash, is_guest FROM users WHERE username = ?').get(username)

  if (!user) {
    return res.status(401).json({ error: '手机号或密码错误' })
  }

  if (!verifyPassword(password, user.password_hash)) {
    return res.status(401).json({ error: '手机号或密码错误' })
  }

  const token = generateToken(user.id)
  res.json({
    success: true,
    token,
    user: { id: user.id, username: user.username, isGuest: !!user.is_guest }
  })
})

// ===== 忘记密码 =====
// 验证码暂存内存（单实例部署足够；多实例需换 Redis）。TTL 5 分钟，同号 60 秒内不可重发。
const RESET_CODE_TTL_MS = 5 * 60 * 1000
const RESET_CODE_RESEND_COOLDOWN_MS = 60 * 1000
const resetCodeStore = new Map()

router.post('/reset-code', loginRateLimit, async (req, res) => {
  const { username } = req.body

  if (!username || !isValidPhone(username)) {
    return res.status(400).json({ error: '请输入正确的手机号' })
  }

  const now = Date.now()
  const existing = resetCodeStore.get(username)
  if (existing && existing.sentAt + RESET_CODE_RESEND_COOLDOWN_MS > now) {
    const waitSeconds = Math.ceil((existing.sentAt + RESET_CODE_RESEND_COOLDOWN_MS - now) / 1000)
    return res.status(429).json({ error: `请 ${waitSeconds} 秒后再获取验证码` })
  }

  const user = await db.prepare('SELECT id FROM users WHERE username = ? AND is_guest = 0').get(username)
  // 统一返回成功，避免通过接口探测手机号是否注册
  if (user) {
    const code = String(Math.floor(100000 + Math.random() * 900000))
    resetCodeStore.set(username, { code, expiresAt: now + RESET_CODE_TTL_MS, sentAt: now })
    // TODO: 接入短信通道后，在这里发送验证码短信
    if (process.env.NODE_ENV === 'development') {
      console.log(`[reset-code] ${username} 验证码: ${code}`)
    }
  }

  res.json({ success: true, message: '如该手机号已注册，验证码将在 5 分钟内有效' })
})

router.post('/reset-password', loginRateLimit, async (req, res) => {
  const { username, code, password } = req.body

  if (!username || !isValidPhone(username)) {
    return res.status(400).json({ error: '请输入正确的手机号' })
  }
  if (!code || !password) {
    return res.status(400).json({ error: '验证码和新密码不能为空' })
  }
  if (password.length < 6) {
    return res.status(400).json({ error: '密码至少6位' })
  }

  const stored = resetCodeStore.get(username)
  if (!stored || stored.expiresAt < Date.now()) {
    resetCodeStore.delete(username)
    return res.status(400).json({ error: '验证码已过期，请重新获取' })
  }
  if (stored.code !== String(code).trim()) {
    return res.status(400).json({ error: '验证码不正确' })
  }

  const user = await db.prepare('SELECT id FROM users WHERE username = ? AND is_guest = 0').get(username)
  if (!user) {
    resetCodeStore.delete(username)
    return res.status(400).json({ error: '验证码不正确' })
  }

  await db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hashPassword(password), user.id)
  resetCodeStore.delete(username)

  res.json({ success: true, message: '密码已重置，请使用新密码登录' })
})

// 获取当前用户信息（含班级与使用统计）
router.get('/me', authMiddleware, async (req, res) => {
  const user = await db.prepare('SELECT id, username, is_guest, created_at FROM users WHERE id = ?').get(req.userId)
  if (!user) {
    return res.status(404).json({ error: '用户不存在' })
  }

  const classes = await db.prepare(`
    SELECT
      c.id,
      c.name,
      c.created_at,
      c.updated_at,
      (SELECT COUNT(*) FROM students s WHERE s.class_id = c.id) AS student_count
    FROM classes c
    WHERE c.user_id = ?
    ORDER BY c.created_at DESC
  `).all(req.userId)

  const evaluationCountRow = await db.prepare(`
    SELECT COUNT(*) AS count
    FROM evaluation_records er
    JOIN classes c ON er.class_id = c.id
    WHERE c.user_id = ?
  `).get(req.userId)
  const evaluationCount = evaluationCountRow?.count || 0

  const taskCountRow = await db.prepare(`
    SELECT COUNT(*) AS count
    FROM class_tasks t
    JOIN classes c ON t.class_id = c.id
    WHERE c.user_id = ?
  `).get(req.userId)
  const taskCount = taskCountRow?.count || 0

  const badgeCountRow = await db.prepare(`
    SELECT COUNT(*) AS count
    FROM badges b
    JOIN students s ON b.student_id = s.id
    JOIN classes c ON s.class_id = c.id
    WHERE c.user_id = ?
  `).get(req.userId)
  const badgeCount = badgeCountRow?.count || 0

  const studentCount = classes.reduce((sum, cls) => sum + (cls.student_count || 0), 0)

  res.json({
    user: {
      id: user.id,
      username: user.username,
      isGuest: !!user.is_guest,
      createdAt: user.created_at,
      accountType: user.is_guest ? '游客' : '教师'
    },
    stats: {
      classCount: classes.length,
      studentCount,
      evaluationCount,
      taskCount,
      badgeCount
    },
    classes: classes.map(cls => ({
      id: cls.id,
      name: cls.name,
      studentCount: cls.student_count || 0,
      createdAt: cls.created_at,
      updatedAt: cls.updated_at
    }))
  })
})

export default router

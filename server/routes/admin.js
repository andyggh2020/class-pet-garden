import { Router } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { db } from '../db.js'
import { ADMIN_USERNAME, adminMiddleware } from '../middleware/admin.js'
import { hashPassword } from '../utils/password.js'
import { deleteClassData, deleteUserData, DEMO_CLASS_ID } from '../utils/adminCleanup.js'
import { normalizeVipRow, VIP_PLANS } from './vip.js'

const router = Router()

router.use(adminMiddleware)

// 数据备份：导出全站数据（所有业务表）为 JSON 供管理员下载
const BACKUP_TABLES = [
  'users',
  'classes',
  'students',
  'badges',
  'evaluation_rules',
  'evaluation_records',
  'settings',
  'class_tasks',
  'task_completions',
  'class_vip_subscriptions',
]

// 管理工作台：全站运营统计
router.get('/dashboard', async (req, res, next) => {
  try {
    const now = Date.now()
    const DAY = 86400000
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const t0 = todayStart.getTime()
    const weekStart = t0 - 6 * DAY

    const [teachers, classes, students, vipAll, records7d, activeAuthors] = await Promise.all([
      db.prepare('SELECT id, created_at FROM users WHERE is_guest = 0').all(),
      db.prepare('SELECT id, user_id, created_at FROM classes').all(),
      db.prepare('SELECT id, created_at FROM students').all(),
      db.prepare(`
        SELECT s.class_id, s.plan, s.status, s.started_at, s.expires_at, c.name AS class_name
        FROM class_vip_subscriptions s
        LEFT JOIN classes c ON c.id = s.class_id
      `).all(),
      db.prepare('SELECT class_id, timestamp FROM evaluation_records WHERE timestamp >= ?').all(weekStart),
      db.prepare(`
        SELECT DISTINCT c.user_id AS uid
        FROM evaluation_records r
        JOIN classes c ON c.id = r.class_id
        WHERE r.timestamp >= ?
      `).all(weekStart),
    ])

    const activeVips = vipAll.filter(v => v.status === 'active' && v.expires_at > now)
    const priceOf = plan => VIP_PLANS[plan]?.price || 0

    // 近 7 天每日趋势（含今天）
    const days = []
    for (let i = 0; i < 7; i++) {
      const start = weekStart + i * DAY
      days.push({
        date: new Date(start).toISOString().slice(5, 10).replace('-', '/'),
        start,
        end: start + DAY,
        teachers: 0,
        classes: 0,
        students: 0,
        records: 0,
        income: 0,
      })
    }
    const inDay = (ts) => {
      const d = days.find(x => ts >= x.start && ts < x.end)
      return d || null
    }
    for (const u of teachers) { const d = inDay(Number(u.created_at)); if (d) d.teachers++ }
    for (const c of classes) { const d = inDay(Number(c.created_at)); if (d) d.classes++ }
    for (const s of students) { const d = inDay(Number(s.created_at)); if (d) d.students++ }
    for (const r of records7d) { const d = inDay(Number(r.timestamp)); if (d) d.records++ }
    for (const v of vipAll) {
      if (v.status !== 'active') continue
      const d = inDay(Number(v.started_at))
      if (d) d.income += priceOf(v.plan)
    }

    const expiringSoon = activeVips
      .filter(v => v.expires_at <= now + 7 * DAY)
      .map(v => ({
        className: v.class_name || '未知班级',
        plan: v.plan,
        planLabel: VIP_PLANS[v.plan]?.label || v.plan,
        expiresAt: v.expires_at,
        daysLeft: Math.max(0, Math.ceil((v.expires_at - now) / DAY)),
      }))
      .sort((a, b) => a.expiresAt - b.expiresAt)

    res.json({
      totals: {
        teachers: teachers.length,
        classes: classes.length,
        students: students.length,
        activeVip: activeVips.length,
      },
      today: {
        teachers: teachers.filter(u => Number(u.created_at) >= t0).length,
        classes: classes.filter(c => Number(c.created_at) >= t0).length,
        students: students.filter(s => Number(s.created_at) >= t0).length,
        records: records7d.filter(r => Number(r.timestamp) >= t0).length,
        income: days[6].income,
      },
      income: {
        total: vipAll.filter(v => v.status === 'active').reduce((sum, v) => sum + priceOf(v.plan), 0),
        today: days[6].income,
      },
      trend: days.map(({ date, teachers: t, classes: c, students: s, records: r, income: i }) => ({
        date, teachers: t, classes: c, students: s, records: r, income: i,
      })),
      metrics: {
        activeAuthors: activeAuthors.length,
        vipCoverage: classes.length ? Math.round(activeVips.length / classes.length * 100) : 0,
        expiringCount: expiringSoon.length,
        records7d: records7d.length,
      },
      expiringSoon,
    })
  } catch (error) {
    next(error)
  }
})

router.get('/backup', async (req, res, next) => {
  try {
    const tables = {}
    for (const table of BACKUP_TABLES) {
      // 表名均为白名单常量，非用户输入，安全
      tables[table] = await db.prepare(`SELECT * FROM ${table}`).all()
    }
    const payload = {
      app: 'class-pet-garden',
      version: 1,
      exportedAt: Date.now(),
      tables,
    }
    const body = JSON.stringify(payload)
    const stamp = new Date().toISOString().slice(0, 19).replace(/[-:T]/g, '')
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    res.setHeader('Content-Disposition', `attachment; filename="class-pet-garden-backup-${stamp}.json"`)
    res.send(body)
  } catch (error) {
    next(error)
  }
})

async function getClassById(classId) {
  return await db.prepare(`
    SELECT c.id, c.name, c.user_id, u.username AS owner_username, u.is_guest AS owner_is_guest
    FROM classes c
    LEFT JOIN users u ON u.id = c.user_id
    WHERE c.id = ?
  `).get(classId)
}

async function listAllClassesWithVip() {
  const classes = await db.prepare(`
    SELECT
      c.id,
      c.name,
      c.created_at,
      c.user_id,
      u.username AS owner_username,
      u.is_guest AS owner_is_guest,
      (SELECT COUNT(*) FROM students s WHERE s.class_id = c.id) AS student_count
    FROM classes c
    LEFT JOIN users u ON u.id = c.user_id
    ORDER BY c.created_at DESC
  `).all()

  const vipRows = await db.prepare('SELECT * FROM class_vip_subscriptions').all()
  const vipMap = Object.fromEntries(vipRows.map(row => [row.class_id, normalizeVipRow(row)]))

  return classes.map(cls => ({
    id: cls.id,
    name: cls.name,
    studentCount: cls.student_count || 0,
    createdAt: cls.created_at,
    ownerUsername: cls.owner_username || '未知',
    ownerIsGuest: !!cls.owner_is_guest,
    isDemo: cls.id === DEMO_CLASS_ID,
    vip: vipMap[cls.id] || null,
  }))
}

router.get('/classes', async (req, res) => {
  const classes = await listAllClassesWithVip()
  const activeCount = classes.filter(cls => cls.vip?.isActive).length

  res.json({
    classes,
    summary: {
      totalClasses: classes.length,
      activeVipCount: activeCount,
      inactiveCount: classes.length - activeCount,
    },
  })
})

router.put('/classes/:id', async (req, res) => {
  const { name } = req.body
  const trimmedName = String(name || '').trim()
  if (!trimmedName) {
    return res.status(400).json({ error: '班级名称不能为空' })
  }

  const classInfo = await getClassById(req.params.id)
  if (!classInfo) {
    return res.status(404).json({ error: '班级不存在' })
  }

  const now = Date.now()
  await db.prepare('UPDATE classes SET name = ?, updated_at = ? WHERE id = ?').run(trimmedName, now, req.params.id)
  res.json({ success: true })
})

router.delete('/classes/:id', async (req, res) => {
  const classInfo = await getClassById(req.params.id)
  if (!classInfo) {
    return res.status(404).json({ error: '班级不存在' })
  }
  if (req.params.id === DEMO_CLASS_ID) {
    return res.status(400).json({ error: '演示班级不能删除' })
  }

  const classId = req.params.id
  await deleteClassData(db, classId)

  res.json({ success: true })
})

router.put('/vip/authorize', async (req, res) => {
  const { classId, isVip, expiresAt } = req.body
  if (!classId) {
    return res.status(400).json({ error: '请选择班级' })
  }

  const classInfo = await getClassById(classId)
  if (!classInfo) {
    return res.status(404).json({ error: '班级不存在' })
  }
  if (classId === DEMO_CLASS_ID) {
    return res.status(400).json({ error: '演示班级不支持 VIP 授权' })
  }

  const now = Date.now()
  const existing = await db.prepare('SELECT * FROM class_vip_subscriptions WHERE class_id = ?').get(classId)

  if (!isVip) {
    if (existing) {
      await db.prepare('DELETE FROM class_vip_subscriptions WHERE class_id = ?').run(classId)
    }
    return res.json({
      success: true,
      classId,
      className: classInfo.name,
      vip: null,
      message: '已取消 VIP 授权',
    })
  }

  const parsedExpiresAt = Number(expiresAt)
  if (!parsedExpiresAt || Number.isNaN(parsedExpiresAt)) {
    return res.status(400).json({ error: '请设置有效的 VIP 到期时间' })
  }
  if (parsedExpiresAt <= now) {
    return res.status(400).json({ error: 'VIP 到期时间必须晚于当前时间' })
  }

  const startedAt = existing?.started_at || now
  if (existing) {
    await db.prepare(`
      UPDATE class_vip_subscriptions
      SET plan = 'manual', status = 'active', started_at = ?, expires_at = ?, updated_at = ?
      WHERE class_id = ?
    `).run(startedAt, parsedExpiresAt, now, classId)
  } else {
    await db.prepare(`
      INSERT INTO class_vip_subscriptions (id, class_id, plan, status, started_at, expires_at, created_at, updated_at)
      VALUES (?, ?, 'manual', 'active', ?, ?, ?, ?)
    `).run(uuidv4(), classId, startedAt, parsedExpiresAt, now, now)
  }

  const vip = normalizeVipRow(
    await db.prepare('SELECT * FROM class_vip_subscriptions WHERE class_id = ?').get(classId)
  )

  res.json({
    success: true,
    classId,
    className: classInfo.name,
    vip,
    message: 'VIP 授权已保存',
  })
})

// ===== 订单管理（会员开通确认） =====
// 全部订单（可按 status 过滤）
router.get('/orders', async (req, res) => {
  const status = typeof req.query.status === 'string' ? req.query.status : ''
  const rows = status
    ? await db.prepare(`
        SELECT o.*, c.name AS class_name, u.username AS teacher_username
        FROM orders o
        LEFT JOIN classes c ON c.id = o.class_id
        LEFT JOIN users u ON u.id = o.user_id
        WHERE o.status = ?
        ORDER BY o.created_at DESC
        LIMIT 200
      `).all(status)
    : await db.prepare(`
        SELECT o.*, c.name AS class_name, u.username AS teacher_username
        FROM orders o
        LEFT JOIN classes c ON c.id = o.class_id
        LEFT JOIN users u ON u.id = o.user_id
        ORDER BY o.created_at DESC
        LIMIT 200
      `).all()

  res.json({
    orders: rows.map(row => ({
      id: row.id,
      orderNo: row.order_no,
      userId: row.user_id,
      teacherUsername: row.teacher_username || '未知',
      classId: row.class_id,
      className: row.class_name || '未知班级',
      plan: row.plan,
      planLabel: VIP_PLANS[row.plan]?.label || row.plan,
      amount: row.amount,
      status: row.status,
      createdAt: Number(row.created_at),
      confirmedAt: row.confirmed_at ? Number(row.confirmed_at) : null,
    })),
  })
})

// 确认收款：开通/续期班级 VIP + 订单状态 + 通知教师
router.put('/orders/:id/confirm', async (req, res) => {
  const order = await db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id)
  if (!order) {
    return res.status(404).json({ error: '订单不存在' })
  }
  if (order.status !== 'pending') {
    return res.status(400).json({ error: '仅待确认订单可以确认' })
  }

  const planInfo = VIP_PLANS[order.plan]
  if (!planInfo) {
    return res.status(400).json({ error: '订单方案无效' })
  }

  const now = Date.now()
  const existing = await db.prepare('SELECT * FROM class_vip_subscriptions WHERE class_id = ?').get(order.class_id)
  // 续期：以原到期时间与当前时间中较晚者为基准
  const base = existing && existing.status === 'active' && existing.expires_at > now
    ? existing.expires_at
    : now
  const expiresAt = base + planInfo.days * 86400000

  if (existing) {
    await db.prepare(`
      UPDATE class_vip_subscriptions
      SET plan = ?, status = 'active', expires_at = ?, updated_at = ?
      WHERE class_id = ?
    `).run(order.plan, expiresAt, now, order.class_id)
  } else {
    await db.prepare(`
      INSERT INTO class_vip_subscriptions (id, class_id, plan, status, started_at, expires_at, created_at, updated_at)
      VALUES (?, ?, ?, 'active', ?, ?, ?, ?)
    `).run(uuidv4(), order.class_id, order.plan, base, expiresAt, now, now)
  }

  await db.prepare(
    "UPDATE orders SET status = 'confirmed', confirmed_at = ?, confirmed_by = ? WHERE id = ?"
  ).run(now, 'admin', order.id)

  const cls = await db.prepare('SELECT name FROM classes WHERE id = ?').get(order.class_id)
  await db.prepare(`
    INSERT INTO notifications (id, user_id, type, title, content, is_read, created_at)
    VALUES (?, ?, 'vip', ?, ?, 0, ?)
  `).run(
    uuidv4(),
    order.user_id,
    '会员已开通',
    `班级「${cls?.name || ''}」的${planInfo.label || order.plan}已生效，到期时间 ${new Date(expiresAt).toLocaleDateString('zh-CN')}。`,
    now,
  )

  res.json({ success: true, message: '已确认收款并开通会员', expiresAt })
})

// 取消订单（管理员）
router.put('/orders/:id/cancel', async (req, res) => {
  const order = await db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id)
  if (!order) {
    return res.status(404).json({ error: '订单不存在' })
  }
  if (order.status !== 'pending') {
    return res.status(400).json({ error: '仅待确认订单可以取消' })
  }
  await db.prepare("UPDATE orders SET status = 'cancelled' WHERE id = ?").run(order.id)
  res.json({ success: true, message: '订单已取消' })
})

async function listAllMembers() {
  const rows = await db.prepare(`
    SELECT
      u.id,
      u.username,
      u.created_at,
      (SELECT COUNT(*) FROM classes c WHERE c.user_id = u.id) AS class_count,
      (
        SELECT COUNT(*)
        FROM students s
        JOIN classes c ON s.class_id = c.id
        WHERE c.user_id = u.id
      ) AS student_count
    FROM users u
    WHERE u.is_guest = 0 AND LOWER(u.username) != LOWER(?)
    ORDER BY u.created_at DESC
  `).all(ADMIN_USERNAME)

  return rows.map(row => ({
    id: row.id,
    username: row.username,
    createdAt: row.created_at,
    classCount: row.class_count || 0,
    studentCount: row.student_count || 0,
  }))
}

router.get('/users', async (req, res) => {
  const members = await listAllMembers()
  res.json({
    members,
    summary: {
      totalMembers: members.length,
      totalClasses: members.reduce((sum, item) => sum + item.classCount, 0),
      totalStudents: members.reduce((sum, item) => sum + item.studentCount, 0),
    },
  })
})

router.get('/users/:id/detail', async (req, res) => {
  const user = await db.prepare('SELECT id, username, is_guest, created_at FROM users WHERE id = ?').get(req.params.id)
  if (!user) {
    return res.status(404).json({ error: '用户不存在' })
  }

  const classes = await db.prepare(`
    SELECT id, name, created_at
    FROM classes
    WHERE user_id = ?
    ORDER BY created_at DESC
  `).all(user.id)

  const result = []
  for (const cls of classes) {
    const students = await db.prepare(`
      SELECT id, name, student_no, total_points, pet_type, pet_level
      FROM students
      WHERE class_id = ?
      ORDER BY total_points DESC, pet_level DESC
    `).all(cls.id)

    result.push({
      id: cls.id,
      name: cls.name,
      createdAt: cls.created_at,
      studentCount: students.length,
      students: students.map(s => ({
        id: s.id,
        name: s.name,
        studentNo: s.student_no,
        totalPoints: s.total_points,
        petType: s.pet_type,
        petLevel: s.pet_level,
      })),
    })
  }

  res.json({
    user: { id: user.id, username: user.username, createdAt: user.created_at },
    classes: result,
  })
})

router.put('/users/:id/password', async (req, res) => {
  const { password } = req.body
  const trimmedPassword = String(password || '')
  if (trimmedPassword.length < 6) {
    return res.status(400).json({ error: '密码至少6位' })
  }

  const user = await db.prepare('SELECT id, username, is_guest FROM users WHERE id = ?').get(req.params.id)
  if (!user) {
    return res.status(404).json({ error: '用户不存在' })
  }
  if (user.is_guest) {
    return res.status(400).json({ error: '不能修改游客账户密码' })
  }
  if (user.username.toLowerCase() === ADMIN_USERNAME.toLowerCase()) {
    return res.status(400).json({ error: '不能在此修改管理员密码' })
  }

  await db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hashPassword(trimmedPassword), user.id)
  res.json({ success: true, message: '密码已重置' })
})

router.delete('/users/:id', async (req, res) => {
  if (req.params.id === req.userId) {
    return res.status(400).json({ error: '不能删除当前登录账户' })
  }

  const user = await db.prepare('SELECT id, username, is_guest FROM users WHERE id = ?').get(req.params.id)
  if (!user) {
    return res.status(404).json({ error: '用户不存在' })
  }
  if (user.is_guest) {
    return res.status(400).json({ error: '不能删除游客账户' })
  }
  if (user.username.toLowerCase() === ADMIN_USERNAME.toLowerCase()) {
    return res.status(400).json({ error: '不能删除管理员账户' })
  }

  await deleteUserData(db, user.id)
  res.json({ success: true })
})

export default router

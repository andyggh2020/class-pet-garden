import { Router } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { db } from '../db.js'
import { authMiddleware } from '../middleware/auth.js'
import { VIP_PLANS } from './vip.js'

const router = Router()

function generateOrderNo() {
  const now = new Date()
  const stamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`
  const rand = String(Math.floor(Math.random() * 1000000)).padStart(6, '0')
  return `CPG${stamp}${rand}`
}

// 创建订单（登录态）：选定自己班级的方案，生成待确认订单
router.post('/', authMiddleware, async (req, res) => {
  const { classId, plan } = req.body || {}

  if (!classId || !plan) {
    return res.status(400).json({ error: '请选择班级和方案' })
  }
  const planInfo = VIP_PLANS[plan]
  if (!planInfo || planInfo.price <= 0) {
    return res.status(400).json({ error: '方案不存在' })
  }

  const cls = await db.prepare('SELECT id, name, user_id FROM classes WHERE id = ?').get(classId)
  if (!cls || cls.user_id !== req.userId) {
    return res.status(403).json({ error: '无权操作该班级' })
  }

  // 同一班级已有待确认订单时直接复用，避免重复下单
  const pending = await db.prepare(
    "SELECT * FROM orders WHERE class_id = ? AND status = 'pending'"
  ).get(classId)
  if (pending) {
    return res.json({ success: true, order: pending, reused: true })
  }

  const now = Date.now()
  const order = {
    id: uuidv4(),
    order_no: generateOrderNo(),
    user_id: req.userId,
    class_id: classId,
    plan,
    amount: planInfo.price,
    status: 'pending',
    created_at: now,
  }
  await db.prepare(`
    INSERT INTO orders (id, order_no, user_id, class_id, plan, amount, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, 'pending', ?)
  `).run(order.id, order.order_no, order.user_id, order.class_id, order.plan, order.amount, order.created_at)

  res.json({ success: true, order, reused: false })
})

// 我的订单列表（登录态）
router.get('/', authMiddleware, async (req, res) => {
  const rows = await db.prepare(`
    SELECT o.*, c.name AS class_name
    FROM orders o
    LEFT JOIN classes c ON c.id = o.class_id
    WHERE o.user_id = ?
    ORDER BY o.created_at DESC
    LIMIT 100
  `).all(req.userId)

  res.json({
    orders: rows.map(row => ({
      id: row.id,
      orderNo: row.order_no,
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

// 查询单笔订单状态（登录态，会员页轮询用）
router.get('/:orderNo', authMiddleware, async (req, res) => {
  const row = await db.prepare(`
    SELECT o.*, c.name AS class_name
    FROM orders o
    LEFT JOIN classes c ON c.id = o.class_id
    WHERE o.order_no = ? AND o.user_id = ?
  `).get(req.params.orderNo, req.userId)

  if (!row) {
    return res.status(404).json({ error: '订单不存在' })
  }

  res.json({
    order: {
      id: row.id,
      orderNo: row.order_no,
      classId: row.class_id,
      className: row.class_name || '未知班级',
      plan: row.plan,
      planLabel: VIP_PLANS[row.plan]?.label || row.plan,
      amount: row.amount,
      status: row.status,
      createdAt: Number(row.created_at),
      confirmedAt: row.confirmed_at ? Number(row.confirmed_at) : null,
    },
  })
})

// 取消自己的待确认订单（登录态）
router.post('/:orderNo/cancel', authMiddleware, async (req, res) => {
  const row = await db.prepare(
    "SELECT * FROM orders WHERE order_no = ? AND user_id = ?"
  ).get(req.params.orderNo, req.userId)

  if (!row) {
    return res.status(404).json({ error: '订单不存在' })
  }
  if (row.status !== 'pending') {
    return res.status(400).json({ error: '仅待确认订单可以取消' })
  }

  await db.prepare("UPDATE orders SET status = 'cancelled' WHERE id = ?").run(row.id)
  res.json({ success: true, message: '订单已取消' })
})

export default router

import { Router } from 'express'
import { db } from '../db.js'

const router = Router()

router.get('/students/:studentId/share', async (req, res) => {
  const student = await db.prepare(`
    SELECT
      s.id,
      s.name,
      s.student_no,
      s.total_points,
      s.pet_type,
      s.pet_level,
      s.pet_exp,
      c.name AS class_name
    FROM students s
    JOIN classes c ON s.class_id = c.id
    WHERE s.id = ?
  `).get(req.params.studentId)

  if (!student) {
    return res.status(404).json({ error: '学生不存在' })
  }

  const records = await db.prepare(`
    SELECT id, points, reason, category, timestamp
    FROM evaluation_records
    WHERE student_id = ?
    ORDER BY timestamp DESC
    LIMIT 50
  `).all(req.params.studentId)

  res.json({ student, records })
})

// 班级分享页数据（公开，需携带班级分享密钥 k 参数）
router.get('/classes/:classId/share', async (req, res) => {
  const cls = await db.prepare(`
    SELECT id, name, created_at, share_token FROM classes WHERE id = ?
  `).get(req.params.classId)

  if (!cls) {
    return res.status(404).json({ error: '班级不存在' })
  }
  // 未生成分享密钥的班级不开放匿名访问
  if (!cls.share_token || cls.share_token !== req.query.k) {
    return res.status(403).json({ error: '分享链接无效或已重置' })
  }

  const studentCountRow = await db.prepare(
    'SELECT COUNT(*) AS count FROM students WHERE class_id = ?'
  ).get(req.params.classId)

  const topStudents = await db.prepare(`
    SELECT name, total_points, pet_type, pet_level
    FROM students
    WHERE class_id = ?
    ORDER BY total_points DESC
    LIMIT 10
  `).all(req.params.classId)

  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const todayRecordsRow = await db.prepare(
    'SELECT COUNT(*) AS count FROM evaluation_records WHERE class_id = ? AND timestamp >= ?'
  ).get(req.params.classId, todayStart.getTime())

  res.json({
    class: {
      id: cls.id,
      name: cls.name,
      createdAt: Number(cls.created_at),
      studentCount: studentCountRow?.count || 0,
      todayEvaluations: todayRecordsRow?.count || 0,
    },
    topStudents,
  })
})

export default router

import { verifyToken } from '../utils/token.js'
import { db } from '../db.js'

export async function resolveAuthPayload(token) {
  if (token === 'guest') {
    const guest = await db.prepare('SELECT id FROM users WHERE username = ?').get('guest')
    return guest ? { userId: guest.id } : null
  }
  return verifyToken(token)
}

export async function authMiddleware(req, res, next) {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '') || ''
    const payload = await resolveAuthPayload(token)

    if (!payload) {
      return res.status(401).json({ error: '未登录或登录已过期' })
    }

    // token 签名有效但用户已不存在（换库/清库后旧 token），统一按登录过期处理
    const user = await db.prepare('SELECT id FROM users WHERE id = ?').get(payload.userId)
    if (!user) {
      return res.status(401).json({ error: '登录已过期，请重新登录' })
    }

    req.userId = payload.userId
    next()
  } catch (error) {
    next(error)
  }
}

export async function optionalAuthMiddleware(req, res, next) {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '') || ''
    const payload = verifyToken(token)

    if (payload) {
      req.userId = payload.userId
    }

    next()
  } catch (error) {
    next(error)
  }
}

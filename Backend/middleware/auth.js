const jwt = require('jsonwebtoken')

function getBearerToken(req) {
  const header = req.headers.authorization
  if (!header) return null
  const [type, token] = header.split(' ')
  if (type !== 'Bearer' || !token) return null
  return token
}

function verifyToken(token) {
  const secret = process.env.JWT_SECRET || 'dev-secret'
  return jwt.verify(token, secret)
}

function optionalAuth(req, res, next) {
  try {
    const token = getBearerToken(req)
    if (!token) return next()
    const payload = verifyToken(token)
    req.user = payload
    return next()
  } catch (err) {
    // Optional auth: if token invalid, treat as unauthenticated.
    return next()
  }
}

function requireAuth(req, res, next) {
  try {
    const token = getBearerToken(req)
    if (!token) return res.status(401).json({ message: 'Missing Authorization token' })
    const payload = verifyToken(token)
    req.user = payload
    return next()
  } catch (err) {
    return res.status(401).json({ message: 'Invalid Authorization token' })
  }
}

function requireAdmin(req, res, next) {
  if (!req.user) return res.status(401).json({ message: 'Authentication required' })
  if (req.user.role !== 'Admin') return res.status(403).json({ message: 'Admin access required' })
  return next()
}

function signToken(payload) {
  const secret = process.env.JWT_SECRET || 'dev-secret'
  const expiresIn = process.env.JWT_EXPIRES_IN || '8h'
  return jwt.sign(payload, secret, { expiresIn })
}

module.exports = {
  optionalAuth,
  requireAuth,
  requireAdmin,
  signToken,
}


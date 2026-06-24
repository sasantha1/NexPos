const router = require('express').Router()

const bcrypt = require('bcryptjs')

const { getPool } = require('../db')
const { optionalAuth, requireAuth, signToken } = require('../middleware/auth')

router.post('/register', async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body || {}
    const nameText = (name || '').toString().trim()
    const emailNorm = (email || '').toString().trim().toLowerCase()
    const passwordText = (password || '').toString()
    const roleText = (role || 'Cashier').toString().trim()
    const allowedRoles = new Set(['Admin', 'Manager', 'Cashier'])

    if (!nameText || !emailNorm || !passwordText) {
      return res.status(400).json({ message: 'name, email and password are required' })
    }
    if (passwordText.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' })
    }
    if (!allowedRoles.has(roleText)) {
      return res.status(400).json({ message: 'Invalid role' })
    }

    const pool = getPool()
    const [existing] = await pool.query('SELECT id FROM employees WHERE LOWER(email) = ? LIMIT 1', [emailNorm])
    if (existing[0]) return res.status(409).json({ message: 'Email already registered' })

    const employeeId = emailNorm.replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || `emp-${Date.now()}`
    const passwordHash = bcrypt.hashSync(passwordText, 10)

    await pool.query(
      `
        INSERT INTO employees (id, name, email, role, password_hash, sales_count, total_sales)
        VALUES (?, ?, ?, ?, ?, 0, 0)
      `,
      [employeeId, nameText, emailNorm, roleText, passwordHash]
    )

    const token = signToken({ sub: employeeId, role: roleText, email: emailNorm })
    res.status(201).json({
      token,
      employee: {
        id: employeeId,
        name: nameText,
        email: emailNorm,
        role: roleText,
      },
    })
  } catch (err) {
    next(err)
  }
})

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body || {}
    const emailNorm = (email || '').toString().trim().toLowerCase()
    const passwordText = (password || '').toString()
    if (!emailNorm || !passwordText) return res.status(400).json({ message: 'email and password are required' })

    const pool = getPool()
    const [rows] = await pool.query(
      'SELECT id, name, email, role, password_hash, sales_count, total_sales FROM employees WHERE LOWER(email) = ? LIMIT 1',
      [emailNorm]
    )
    const employee = rows[0]
    if (!employee) return res.status(401).json({ message: 'Invalid credentials' })

    const passwordHash = employee.password_hash
    if (!passwordHash) return res.status(401).json({ message: 'Invalid credentials' })
    const ok = await bcrypt.compare(passwordText, passwordHash)
    if (!ok) return res.status(401).json({ message: 'Invalid credentials' })

    const token = signToken({ sub: employee.id, role: employee.role, email: employee.email })
    res.json({
      token,
      employee: {
        id: employee.id,
        name: employee.name,
        email: employee.email,
        role: employee.role,
      },
    })
  } catch (err) {
    next(err)
  }
})

router.get('/me', requireAuth, async (req, res, next) => {
  try {
    res.json({ user: req.user })
  } catch (err) {
    next(err)
  }
})

module.exports = router


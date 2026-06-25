const router = require('express').Router()

const { getPool } = require('../db')
const { optionalAuth } = require('../middleware/auth')

function parseDays(range) {
  const r = (range || '').toString().toLowerCase()
  if (r.includes('90')) return 90
  if (r.includes('30')) return 30
  return 7
}

function formatLabel(date) {
  return date.toLocaleDateString('en-US', { month: 'short', day: '2-digit' })
}

function formatTime(date) {
  if (!date) return '—'
  const d = date instanceof Date ? date : new Date(date)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false })
}

function toMoney(n) {
  const x = Number(n)
  return Number.isFinite(x) ? Math.round(x * 100) / 100 : 0
}

function parseReportDate(dateStr) {
  const value = (dateStr || '').toString().trim()
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value
  return new Date().toISOString().slice(0, 10)
}

router.get('/z-report', optionalAuth, async (req, res, next) => {
  try {
    const pool = getPool()
    const reportDate = parseReportDate(req.query.date)
    const startTs = `${reportDate} 00:00:00`
    const endTs = `${reportDate} 23:59:59`

    const [finRows] = await pool.query(
      `
        SELECT
          COALESCE(SUM(subtotal), 0) AS grossSales,
          COALESCE(SUM(discount_total), 0) AS totalDiscounts,
          COALESCE(SUM(tax_total), 0) AS taxCollected,
          COALESCE(SUM(total), 0) AS totalCollected,
          COUNT(*) AS transactions,
          MIN(created_at) AS sessionStart,
          MAX(created_at) AS sessionEnd,
          MAX(tax_rate) AS taxRate
        FROM orders
        WHERE created_at BETWEEN ? AND ?
      `,
      [startTs, endTs]
    )
    const fin = finRows[0] || {}
    const grossSales = toMoney(fin.grossSales)
    const totalDiscounts = toMoney(fin.totalDiscounts)
    const totalRefunds = 0
    const netRevenue = toMoney(grossSales - totalDiscounts - totalRefunds)
    const taxCollected = toMoney(fin.taxCollected)
    const totalCollected = toMoney(fin.totalCollected)
    const taxRate = toMoney(fin.taxRate)

    const [laborRows] = await pool.query(
      `
        SELECT
          COALESCE(e.name, 'Unknown') AS name,
          COUNT(*) AS transactions,
          COALESCE(SUM(o.total), 0) AS total
        FROM orders o
        LEFT JOIN employees e ON e.id = o.employee_id
        WHERE o.created_at BETWEEN ? AND ?
        GROUP BY o.employee_id, e.name
        ORDER BY total DESC
      `,
      [startTs, endTs]
    )

    const [catRows] = await pool.query(
      `
        SELECT
          p.category,
          COALESCE(SUM(oi.quantity), 0) AS qty,
          COALESCE(SUM(oi.line_total), 0) AS gross
        FROM order_items oi
        JOIN orders o ON o.id = oi.order_id
        JOIN products p ON p.id = oi.product_id
        WHERE o.created_at BETWEEN ? AND ?
        GROUP BY p.category
        ORDER BY gross DESC
        LIMIT 5
      `,
      [startTs, endTs]
    )

    const cashTotal = totalCollected

    let storeName = 'NexPos'
    let storeId = '#0001'
    let register = 'POS-01'
    try {
      const [settingsRows] = await pool.query(`SELECT \`key\`, value FROM settings_kv WHERE \`key\` = 'business' LIMIT 1`)
      const business = settingsRows[0]?.value
      const parsed = typeof business === 'object' ? business : business ? JSON.parse(business) : null
      if (parsed) {
        storeName = parsed.name || storeName
        storeId = parsed.storeId || storeId
        register = parsed.register || register
      }
    } catch {
      // keep defaults
    }

    res.json({
      date: reportDate,
      sessionStart: formatTime(fin.sessionStart),
      sessionEnd: formatTime(fin.sessionEnd),
      register,
      storeId,
      storeName,
      financial: {
        grossSales,
        totalDiscounts,
        totalRefunds,
        netRevenue,
        taxRate,
        taxCollected,
        totalCollected,
      },
      tender: {
        cash: { expected: cashTotal, actual: cashTotal },
        card: { expected: 0, actual: 0 },
        mobile: { expected: 0, actual: 0 },
        discrepancy: 0,
      },
      labor: laborRows.map((r) => ({
        name: r.name,
        transactions: Number(r.transactions || 0),
        total: toMoney(r.total),
      })),
      topCategories: catRows.map((r, i) => ({
        rank: i + 1,
        category: r.category || 'Uncategorized',
        qty: Number(r.qty || 0),
        gross: toMoney(r.gross),
      })),
    })
  } catch (err) {
    next(err)
  }
})

router.get('/summary', optionalAuth, async (req, res, next) => {
  try {
    const pool = getPool()
    const days = parseDays(req.query.range)

    const now = new Date()
    const start = new Date(now)
    start.setHours(0, 0, 0, 0)
    start.setDate(start.getDate() - (days - 1))

    const end = new Date(now)
    end.setHours(23, 59, 59, 999)

    const startTs = start.toISOString().slice(0, 19).replace('T', ' ')
    const endTs = end.toISOString().slice(0, 19).replace('T', ' ')

    // Daily trend
    const [trendRows] = await pool.query(
      `
        SELECT DATE(created_at) as d, COALESCE(SUM(total), 0) as revenue, COUNT(*) as txCount
        FROM orders
        WHERE created_at BETWEEN ? AND ?
        GROUP BY DATE(created_at)
        ORDER BY DATE(created_at) ASC
      `,
      [startTs, endTs]
    )

    // DATE(created_at) comes as 'YYYY-MM-DD' in MySQL.
    const byDate = new Map(trendRows.map((r) => [r.d, r]))

    const labels = []
    const points = []
    const txPoints = []
    for (let i = 0; i < days; i++) {
      const d = new Date(start)
      d.setDate(start.getDate() + i)
      const key = d.toISOString().slice(0, 10)
      const row = byDate.get(key)
      labels.push(formatLabel(d))
      points.push(Number(row?.revenue || 0))
      txPoints.push(Number(row?.txCount || 0))
    }

    // Summary stats
    const [summaryRows] = await pool.query(
      `
        SELECT
          COALESCE(SUM(total), 0) AS totalRevenue,
          COUNT(*) AS transactions,
          COALESCE(AVG(total), 0) AS avgOrderValue,
          COUNT(DISTINCT customer_id) AS customersInRange
        FROM orders
        WHERE created_at BETWEEN ? AND ?
      `,
      [startTs, endTs]
    )
    const sum = summaryRows[0] || {}
    const totalRevenue = Number(sum.totalRevenue || 0)
    const transactions = Number(sum.transactions || 0)
    const avgOrderValue = Number(sum.avgOrderValue || 0)
    const customersInRange = Number(sum.customersInRange || 0)

    // If no customers in range (e.g. all orders have null customer), fall back to all customers.
    let totalCustomers = customersInRange
    if (!totalCustomers) {
      const [custRows] = await pool.query('SELECT COUNT(*) AS total FROM customers')
      totalCustomers = Number(custRows[0]?.total || 0)
    }

    // Sales by category (revenue share)
    const [catRows] = await pool.query(
      `
        SELECT p.category, COALESCE(SUM(oi.line_total), 0) as revenue
        FROM order_items oi
        JOIN orders o ON o.id = oi.order_id
        JOIN products p ON p.id = oi.product_id
        WHERE o.created_at BETWEEN ? AND ?
        GROUP BY p.category
        ORDER BY p.category ASC
      `,
      [startTs, endTs]
    )

    const catMap = new Map(catRows.map((r) => [r.category, Number(r.revenue || 0)]))
    const categories = Array.from(catMap.keys())
    const total = totalRevenue || 0
    let segments = categories.map((c) => {
      const revenue = catMap.get(c) || 0
      const pct = total > 0 ? Math.round((revenue / total) * 100) : 0
      return { label: c, value: pct }
    })

    // Ensure donut sum is 100 by adjusting the last segment (prevents SVG math drift).
    const segTotal = segments.reduce((s, x) => s + x.value, 0)
    if (segments.length && segTotal !== 100) {
      segments[segments.length - 1].value += 100 - segTotal
    }

    res.json({
      stats: {
        totalRevenue,
        transactions,
        avgOrderValue,
        totalCustomers,
      },
      trend: {
        labels,
        points,
      },
      salesByCategory: segments,
      // useful for client debugging
      rangeDays: days,
      rangeStart: startTs,
      rangeEnd: endTs,
    })
  } catch (err) {
    next(err)
  }
})

module.exports = router


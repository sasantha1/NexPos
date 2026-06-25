const router = require('express').Router()

const { getPool } = require('../db')
const { optionalAuth, requireAuth, requireAdmin } = require('../middleware/auth')

const DEFAULTS = {
  business: {
    name: 'NexPos',
    address: '',
    phone: '',
    email: '',
    taxId: '',
    storeId: '#0001',
    register: 'POS-01',
  },
  systemPrefs: {
    systemName: 'NexPos',
    soundEffects: true,
    lowStockAlerts: true,
    loyaltyProgram: true,
  },
  tax: {
    defaultTaxRate: 0,
    appliedTaxRate: 0,
  },
  receipts: {
    printReceipts: true,
    emailReceipts: false,
    receiptHeaderText: 'THANK YOU FOR SHOPPING!',
    receiptFooterText: 'Returns accepted in 14 days\nFollow us on IG: @nexpos',
  },
  hardware: {
    receiptPrinter: true,
    barcodeScanner: true,
    cardReader: false,
  },
  security: {
    requirePin: false,
    autoLogout: false,
  },
}

function safeValue(value) {
  if (value === null || value === undefined) return null
  if (typeof value === 'object') return value
  try {
    return JSON.parse(value)
  } catch {
    return null
  }
}

function mergeDefaults(key, saved) {
  const base = DEFAULTS[key] || {}
  return { ...base, ...(saved || {}) }
}

router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const pool = getPool()
    const keys = Object.keys(DEFAULTS)
    const [rows] = await pool.query(
      `SELECT \`key\`, value FROM settings_kv WHERE \`key\` IN (${keys.map(() => '?').join(',')})`,
      keys
    )

    const out = { ...DEFAULTS }
    for (const r of rows) {
      const parsed = safeValue(r.value)
      if (parsed) out[r.key] = mergeDefaults(r.key, parsed)
    }
    res.json(out)
  } catch (err) {
    next(err)
  }
})

router.put('/', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const pool = getPool()
    const body = req.body || {}

    const toUpsert = {
      business: mergeDefaults('business', body.business),
      systemPrefs: mergeDefaults('systemPrefs', body.systemPrefs),
      tax: mergeDefaults('tax', body.tax),
      receipts: mergeDefaults('receipts', body.receipts),
      hardware: mergeDefaults('hardware', body.hardware),
      security: mergeDefaults('security', body.security),
    }

    const conn = await pool.getConnection()
    try {
      await conn.beginTransaction()
      for (const key of Object.keys(toUpsert)) {
        const jsonValue = JSON.stringify(toUpsert[key])
        await conn.query(
          `
            INSERT INTO settings_kv (\`key\`, \`value\`)
            VALUES (?, ?)
            ON DUPLICATE KEY UPDATE \`value\` = ?
          `,
          [key, jsonValue, jsonValue]
        )
      }
      await conn.commit()
    } catch (err) {
      await conn.rollback()
      throw err
    } finally {
      conn.release()
    }

    res.json({ ok: true })
  } catch (err) {
    next(err)
  }
})

module.exports = router

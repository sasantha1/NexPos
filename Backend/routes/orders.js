const router = require('express').Router()

const { getPool } = require('../db')
const { optionalAuth } = require('../middleware/auth')

function normalizeCode(code) {
  return (code || '').toString().trim().toUpperCase()
}

function toMoney(n) {
  const x = Number(n)
  return Number.isFinite(x) ? Math.round(x * 100) / 100 : 0
}

function isWeightProduct(product) {
  return (product?.sell_mode || 'unit') === 'weight'
}

function getPackageSize(product) {
  const size = Number(product?.package_size)
  return Number.isFinite(size) && size > 0 ? size : 1
}

function formatSoldAmount(product, amount) {
  const unit = product?.package_unit || 'piece'
  const value = Number(amount)
  if (unit === 'bottle') {
    if (value === 0.5) return '1/2 bottle'
    if (value === 0.25) return '1/4 bottle'
    if (value === 1) return '1 bottle'
    return `${value} bottle`
  }
  return `${value}${unit}`
}

function calcLinePricing(product, quantity) {
  const qty = Number(quantity)
  if (isWeightProduct(product)) {
    const packageSize = getPackageSize(product)
    const lineTotal = toMoney(Number(product.price) * (qty / packageSize))
    const unitPrice = toMoney(Number(product.price) / packageSize)
    return { quantity: qty, unitPrice, lineTotal }
  }
  const unitQty = Math.floor(qty)
  const unitPrice = toMoney(Number(product.price))
  return { quantity: unitQty, unitPrice, lineTotal: toMoney(unitPrice * unitQty) }
}

router.post('/checkout', optionalAuth, async (req, res, next) => {
  try {
    const pool = getPool()
    const { items, customerId, employeeId, discountCode } = req.body || {}

    if (!Array.isArray(items) || items.length === 0) return res.status(400).json({ message: 'items[] is required' })

    const normalizedItems = items
      .map((it) => ({
        productId: (it.productId || it.id || it.product_id || '').toString(),
        quantity: Number(it.quantity || it.qty || 0),
      }))
      .filter((x) => x.productId && Number.isFinite(x.quantity) && x.quantity > 0)

    if (!normalizedItems.length) return res.status(400).json({ message: 'items must contain productId + quantity > 0' })

    const discountCodeNorm = normalizeCode(discountCode)

    const conn = await pool.getConnection()
    try {
      await conn.beginTransaction()

      // Lock products + inventory rows
      const productIds = normalizedItems.map((x) => x.productId)
      const uniqIds = Array.from(new Set(productIds))
      const [products] = await conn.query(
        `SELECT id, name, price, sell_mode, package_size, package_unit FROM products WHERE id IN (${uniqIds.map(() => '?').join(',')}) FOR UPDATE`,
        uniqIds
      )
      const productMap = new Map(products.map((p) => [p.id, p]))
      for (const it of normalizedItems) {
        if (!productMap.get(it.productId)) return res.status(404).json({ message: `Product not found: ${it.productId}` })
      }

      const [invRows] = await conn.query(
        `SELECT product_id, stock FROM inventory_items WHERE product_id IN (${uniqIds.map(() => '?').join(',')}) FOR UPDATE`,
        uniqIds
      )
      const invMap = new Map(invRows.map((r) => [r.product_id, Number(r.stock)]))

      // Stock check + subtotal
      let subtotal = 0
      const pricedItems = []
      for (const it of normalizedItems) {
        const product = productMap.get(it.productId)
        const currentStock = invMap.get(it.productId)
        if (currentStock === undefined) return res.status(404).json({ message: `Inventory not found for: ${it.productId}` })
        const pricing = calcLinePricing(product, it.quantity)
        if (currentStock < pricing.quantity) {
          return res.status(400).json({ message: `Insufficient stock for ${product.name}` })
        }
        subtotal += pricing.lineTotal
        pricedItems.push({ ...it, product, ...pricing })
      }

      subtotal = toMoney(subtotal)

      // Discount (optional)
      let discountTotal = 0
      let appliedDiscountId = null
      if (discountCodeNorm) {
        const [dRows] = await conn.query(
          `
            SELECT id, type, value
            FROM discounts
            WHERE code = ? AND active = TRUE
            LIMIT 1
          `,
          [discountCodeNorm]
        )
        const d = dRows[0]
        if (d) {
          appliedDiscountId = d.id
          if (d.type === 'percentage') discountTotal = subtotal * (Number(d.value) / 100)
          else discountTotal = Number(d.value)
          discountTotal = Math.min(discountTotal, subtotal)
        }
      }

      const taxBase = Math.max(0, subtotal - discountTotal)
      // Tax disabled: system requirement (bill should show no tax).
      const appliedTaxRate = 0
      const taxTotal = 0
      const total = taxBase

      // Insert order
      const [orderResult] = await conn.query(
        `
          INSERT INTO orders (customer_id, employee_id, discount_code, discount_id, tax_rate, subtotal, discount_total, tax_total, total)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          customerId || null,
          employeeId || null,
          discountCodeNorm || null,
          appliedDiscountId,
          appliedTaxRate,
          subtotal,
          discountTotal,
          taxTotal,
          total,
        ]
      )
      const orderId = orderResult.insertId

      // Insert items + decrement inventory
      for (const it of pricedItems) {
        const product = it.product
        const soldLabel = isWeightProduct(product) ? formatSoldAmount(product, it.quantity) : null
        const productName = soldLabel ? `${product.name} (${soldLabel})` : product.name

        await conn.query(
          `
            INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, line_total)
            VALUES (?, ?, ?, ?, ?, ?)
          `,
          [orderId, it.productId, productName, it.quantity, it.unitPrice, it.lineTotal]
        )

        await conn.query(
          `UPDATE inventory_items SET stock = stock - ? WHERE product_id = ?`,
          [it.quantity, it.productId]
        )
      }

      // Update customer totals if provided
      if (customerId) {
        await conn.query(
          `
            UPDATE customers
            SET total_spent = total_spent + ?
            WHERE id = ?
          `,
          [total, customerId]
        )
      }

      // Update employee aggregates if provided
      if (employeeId) {
        await conn.query(
          `
            UPDATE employees
            SET sales_count = sales_count + 1,
                total_sales = total_sales + ?
            WHERE id = ?
          `,
          [total, employeeId]
        )
      }

      await conn.commit()
      res.json({
        ok: true,
        orderId,
        subtotal,
        discountTotal,
        taxTotal,
        total,
      })
    } catch (err) {
      await conn.rollback()
      throw err
    }
  } catch (err) {
    next(err)
  } finally {
    // Connection handled in transaction block
  }
})

module.exports = router


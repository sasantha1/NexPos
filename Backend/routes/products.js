const router = require('express').Router()

const { getPool } = require('../db')
const { optionalAuth } = require('../middleware/auth')

// GET /products?search=
router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const pool = getPool()
    const search = (req.query.search || '').toString().trim()

    let sql = `
      SELECT p.id, p.name, p.description, p.barcode, p.category, p.price,
             p.sell_mode, p.package_size, p.package_unit, i.stock
      FROM products p
      JOIN inventory_items i ON i.product_id = p.id
    `
    const params = []

    if (search) {
      sql += `
        WHERE p.name LIKE ? OR p.barcode LIKE ? OR p.category LIKE ? OR p.description LIKE ?
      `
      const q = `%${search}%`
      params.push(q, q, q, q)
    }

    sql += ' ORDER BY p.name ASC'

    const [rows] = await pool.query(sql, params)
    res.json({
      items: rows.map((r) => ({
        id: r.id,
        name: r.name,
        description: r.description,
        barcode: r.barcode,
        category: r.category,
        price: Number(r.price),
        sellMode: r.sell_mode || 'unit',
        packageSize: Number(r.package_size ?? 1),
        packageUnit: r.package_unit || 'piece',
        stock: Number(r.stock),
      })),
    })
  } catch (err) {
    next(err)
  }
})

router.post('/', optionalAuth, async (req, res, next) => {
  try {
    const pool = getPool()
    const { id, name, description, barcode, category, price, stock, sellMode, packageSize, packageUnit } = req.body || {}

    if (!name || !barcode || !category) return res.status(400).json({ message: 'name, barcode, category are required' })

    const productId = (id || barcode).toString()
    const priceNum = Number(price)
    const stockNum = Number(stock)
    const sellModeVal = (sellMode || 'unit').toString()
    const packageSizeNum = Number(packageSize ?? 1)
    const packageUnitVal = (packageUnit || 'piece').toString()
    if (!Number.isFinite(priceNum) || priceNum < 0) return res.status(400).json({ message: 'price must be a number >= 0' })
    if (!Number.isFinite(stockNum) || stockNum < 0) return res.status(400).json({ message: 'stock must be a number >= 0' })
    if (!Number.isFinite(packageSizeNum) || packageSizeNum <= 0) return res.status(400).json({ message: 'packageSize must be > 0' })

    const conn = await pool.getConnection()
    try {
      await conn.beginTransaction()

      await conn.query(
        `
        INSERT INTO products (id, name, description, barcode, category, price, sell_mode, package_size, package_unit)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          name = VALUES(name),
          description = VALUES(description),
          barcode = VALUES(barcode),
          category = VALUES(category),
          price = VALUES(price),
          sell_mode = VALUES(sell_mode),
          package_size = VALUES(package_size),
          package_unit = VALUES(package_unit)
        `,
        [productId, name, description || null, barcode, category, priceNum, sellModeVal, packageSizeNum, packageUnitVal]
      )

      await conn.query(
        `
        INSERT INTO inventory_items (product_id, stock)
        VALUES (?, ?)
        ON DUPLICATE KEY UPDATE stock = VALUES(stock)
        `,
        [productId, stockNum]
      )

      await conn.commit()
    } catch (err) {
      await conn.rollback()
      throw err
    } finally {
      conn.release()
    }

    res.status(201).json({ ok: true, id: productId })
  } catch (err) {
    next(err)
  }
})

router.put('/:id', optionalAuth, async (req, res, next) => {
  try {
    const pool = getPool()
    const productId = req.params.id
    const { name, description, barcode, category, price, stock, sellMode, packageSize, packageUnit } = req.body || {}

    if (!productId || !name || !barcode || !category) return res.status(400).json({ message: 'name, barcode, category are required' })

    const priceNum = Number(price)
    const stockNum = Number(stock)
    const sellModeVal = (sellMode || 'unit').toString()
    const packageSizeNum = Number(packageSize ?? 1)
    const packageUnitVal = (packageUnit || 'piece').toString()
    if (!Number.isFinite(priceNum) || priceNum < 0) return res.status(400).json({ message: 'price must be a number >= 0' })
    if (!Number.isFinite(stockNum) || stockNum < 0) return res.status(400).json({ message: 'stock must be a number >= 0' })
    if (!Number.isFinite(packageSizeNum) || packageSizeNum <= 0) return res.status(400).json({ message: 'packageSize must be > 0' })

    const conn = await pool.getConnection()
    try {
      await conn.beginTransaction()

      await conn.query(
        `
        UPDATE products
        SET name = ?, description = ?, barcode = ?, category = ?, price = ?, sell_mode = ?, package_size = ?, package_unit = ?
        WHERE id = ?
        `,
        [name, description || null, barcode, category, priceNum, sellModeVal, packageSizeNum, packageUnitVal, productId]
      )

      await conn.query(
        `
        INSERT INTO inventory_items (product_id, stock)
        VALUES (?, ?)
        ON DUPLICATE KEY UPDATE stock = VALUES(stock)
        `,
        [productId, stockNum]
      )

      await conn.commit()
    } catch (err) {
      await conn.rollback()
      throw err
    } finally {
      conn.release()
    }

    res.json({ ok: true, id: productId })
  } catch (err) {
    next(err)
  }
})

router.delete('/:id', optionalAuth, async (req, res, next) => {
  try {
    const pool = getPool()
    const productId = req.params.id

    const conn = await pool.getConnection()
    try {
      await conn.beginTransaction()

      // If product has been sold before, order_items keeps references.
      // Remove those rows first so product deletion can proceed.
      const [deletedOrderItems] = await conn.query(
        'DELETE FROM order_items WHERE product_id = ?',
        [productId]
      )

      const [deletedProduct] = await conn.query(
        'DELETE FROM products WHERE id = ?',
        [productId]
      )

      if (deletedProduct.affectedRows === 0) {
        await conn.rollback()
        return res.status(404).json({ message: 'Product not found' })
      }

      await conn.commit()
      res.json({
        ok: true,
        id: productId,
        removedOrderItems: Number(deletedOrderItems.affectedRows || 0),
      })
    } catch (err) {
      await conn.rollback()
      throw err
    } finally {
      conn.release()
    }
  } catch (err) {
    next(err)
  }
})

module.exports = router


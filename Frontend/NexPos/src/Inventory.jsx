import { useEffect, useMemo, useState } from 'react'
import './Inventory.css'
import { getInventoryItems, getInventoryStats, updateInventoryStock } from './api/inventoryApi'

function money(amount) {
  return `Rs. ${amount.toFixed(2)}`
}

function IconSearch() {
  return (
    <svg className="inv-searchIcon" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M21 21l-4.35-4.35"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle
        cx="11"
        cy="11"
        r="7"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
    </svg>
  )
}

function IconBox() {
  return (
    <svg className="inv-cardIcon" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M21 8l-9-5-9 5 9 5 9-5z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M3 8v10l9 5 9-5V8"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M12 13v10"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}

function IconAlert() {
  return (
    <svg className="inv-cardIcon" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 9v4"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M12 17h.01"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function IconBolt() {
  return (
    <svg className="inv-cardIcon" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M13 2L3 14h9l-1 10 10-12h-9l1-10z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function IconMoney() {
  return (
    <svg className="inv-cardIcon" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 1v22"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M17 5H9.5a3.5 3.5 0 0 0 0 7H14a3.5 3.5 0 0 1 0 7H6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

const LOW_STOCK_THRESHOLD = 20

export default function Inventory() {
  // TODO: Replace mock state with API calls:
  // - GET /inventory/stats
  // - GET /inventory/items
  // - PATCH /inventory/items/:id (or /inventory/adjust)
  const [rows, setRows] = useState([])
  const [stats, setStats] = useState({
    totalProducts: 0,
    lowStockItems: 0,
    outOfStock: 0,
    inventoryValue: 0,
  })
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')

  const [adjusting, setAdjusting] = useState(null) // row id
  const [adjustValue, setAdjustValue] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return rows
    return rows.filter((r) => {
      return (
        r.product.toLowerCase().includes(q) ||
        r.barcode.toLowerCase().includes(q) ||
        r.category.toLowerCase().includes(q)
      )
    })
  }, [rows, query])

  const statusStats = useMemo(() => {
    // For the status badge label colors, we keep the same threshold logic as the UI.
    return {
      lowStockItems: rows.filter((r) => r.stock > 0 && r.stock <= LOW_STOCK_THRESHOLD).length,
      outOfStock: rows.filter((r) => r.stock === 0).length,
      totalProducts: rows.length,
    }
  }, [rows])

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      try {
        const [itemsRes, statsRes] = await Promise.all([getInventoryItems(''), getInventoryStats()])
        if (cancelled) return
        setRows(itemsRes?.items || [])
        setStats({
          totalProducts: Number(statsRes?.totalProducts || 0),
          lowStockItems: Number(statsRes?.lowStockItems || 0),
          outOfStock: Number(statsRes?.outOfStock || 0),
          inventoryValue: Number(statsRes?.inventoryValue || 0),
        })
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  function statusFor(stock) {
    if (stock === 0) return { label: 'Out of Stock', tone: 'out' }
    if (stock <= LOW_STOCK_THRESHOLD) return { label: 'Low Stock', tone: 'low' }
    return { label: 'In Stock', tone: 'in' }
  }

  function openAdjust(rowId) {
    setAdjusting(rowId)
    setAdjustValue('')
  }

  function closeAdjust() {
    setAdjusting(null)
    setAdjustValue('')
  }

  function applyAdjust() {
    const row = rows.find((r) => r.id === adjusting)
    if (!row) return
    const next = Number(adjustValue)
    if (!Number.isFinite(next) || next < 0) return

    updateInventoryStock(row.id, next)
      .then(() => getInventoryItems('').then((res) => res?.items || []))
      .then((items) => setRows(items))
      .then(() => getInventoryStats())
      .then((s) =>
        setStats({
          totalProducts: Number(s?.totalProducts || 0),
          lowStockItems: Number(s?.lowStockItems || 0),
          outOfStock: Number(s?.outOfStock || 0),
          inventoryValue: Number(s?.inventoryValue || 0),
        })
      )
      .finally(() => {
        closeAdjust()
      })
  }

  return (
    <div className="inv-page">
      <div className="inv-header">
        <div>
          <div className="inv-title">Inventory Management</div>
          <div className="inv-subtitle">Track and manage your product stock levels</div>
        </div>
      </div>

      <div className="inv-statsRow">
        <div className="inv-stat inv-statTotal">
          <div className="inv-statTop">
            <div className="inv-statLabel">Total Products</div>
            <IconBox />
          </div>
          <div className="inv-statValue">{loading ? '—' : stats.totalProducts}</div>
        </div>
        <div className="inv-stat inv-statLow">
          <div className="inv-statTop">
            <div className="inv-statLabel">Low Stock Items</div>
            <IconAlert />
          </div>
          <div className="inv-statValue inv-statValueLow">{loading ? '—' : stats.lowStockItems}</div>
        </div>
        <div className="inv-stat inv-statOut">
          <div className="inv-statTop">
            <div className="inv-statLabel">Out of Stock</div>
            <IconBolt />
          </div>
          <div className="inv-statValue inv-statValueOut">{loading ? '—' : stats.outOfStock}</div>
        </div>
        <div className="inv-stat inv-statValueBox">
          <div className="inv-statTop">
            <div className="inv-statLabel">Inventory Value</div>
            <IconMoney />
          </div>
          <div className="inv-statValue inv-statValueMoney">{loading ? '—' : money(stats.inventoryValue)}</div>
        </div>
      </div>

      <div className="inv-tableControls">
        <div className="inv-tableTitle">Stock Levels</div>
        <div className="inv-searchWrap">
          <IconSearch />
          <input
            className="inv-searchInput"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products..."
            aria-label="Search products"
          />
        </div>
      </div>

      <div className="inv-tableWrap">
        <table className="inv-table" role="table" aria-label="Inventory stock table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Barcode</th>
              <th>Category</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Stock Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan="7" className="inv-empty">
                  No items found.
                </td>
              </tr>
            ) : (
              filtered.map((r) => {
                const st = statusFor(r.stock)
                return (
                  <tr key={r.id}>
                    <td className="inv-cellProduct">{r.product}</td>
                    <td>{r.barcode}</td>
                    <td>{r.category}</td>
                    <td>{money(r.price)}</td>
                    <td>{r.stock}</td>
                    <td>
                      <span className={`inv-status inv-status-${st.tone}`}>{st.label}</span>
                    </td>
                    <td>
                      <button className="inv-adjustBtn" type="button" onClick={() => openAdjust(r.id)}>
                        Adjust
                      </button>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {adjusting ? (
        <div className="inv-modalBackdrop" role="dialog" aria-modal="true" aria-label="Adjust stock">
          <div className="inv-modal">
            <div className="inv-modalHeader">
              <div className="inv-modalTitle">Adjust Stock</div>
              <button className="inv-modalClose" type="button" onClick={closeAdjust} aria-label="Close">
                ×
              </button>
            </div>
            <div className="inv-modalBody">
              <div className="inv-modalHint">Set the new stock quantity:</div>
              <input
                className="inv-modalInput"
                value={adjustValue}
                onChange={(e) => setAdjustValue(e.target.value)}
                inputMode="numeric"
                placeholder="Enter quantity"
                aria-label="New stock quantity"
              />
            </div>
            <div className="inv-modalFooter">
              <button className="inv-modalSecondary" type="button" onClick={closeAdjust}>
                Cancel
              </button>
              <button className="inv-modalPrimary" type="button" onClick={applyAdjust} disabled={adjustValue.trim().length === 0}>
                Save
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}


import { useEffect, useMemo, useState } from 'react'
import './Discount.css'
import {
  listDiscounts,
  createDiscount,
  updateDiscount,
  toggleDiscountActive,
  deleteDiscount,
} from './api/discountsApi'

function money(amount) {
  return `Rs. ${amount.toFixed(2)}`
}

function IconTag() {
  return (
    <svg className="dis-cardIcon" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M3 12l9 9 9-9-9-9H6l-3 3v6z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M7.5 7.5h.01" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

function IconCheck() {
  return (
    <svg className="dis-cardIcon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M20 6L9 17l-5-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function IconX() {
  return (
    <svg className="dis-cardIcon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M18 6L6 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M6 6l12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function IconSearch() {
  return (
    <svg className="dis-searchIcon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M21 21l-4.35-4.35" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth="2" />
    </svg>
  )
}

function IconPlus() {
  return (
    <svg className="dis-plusIcon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 5v14M5 12h14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function IconEdit() {
  return (
    <svg className="dis-actionIcon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 20h9" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path
        d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4 11.5-11.5z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function IconTrash() {
  return (
    <svg className="dis-actionIcon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3 6h18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M8 6V4h8v2" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M6 6l1 16h10l1-16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M10 11v6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M14 11v6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function normalizeCode(code) {
  return code.trim().toUpperCase()
}

export default function Discount() {
  // TODO: replace mock state with API calls:
  // - GET /discounts
  // - POST /discounts
  // - PUT /discounts/:id
  // - DELETE /discounts/:id
  const [rows, setRows] = useState([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)

  const [modalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState('add') // add|edit
  const [editingId, setEditingId] = useState(null)

  const [form, setForm] = useState({
    name: '',
    type: 'percentage',
    value: '',
    code: '',
    active: true,
  })

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      try {
        const res = await listDiscounts('')
        if (cancelled) return
        setRows(res?.items || [])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return rows
    return rows.filter((r) => {
      const code = (r.code ?? '').toLowerCase()
      return (
        r.name.toLowerCase().includes(q) ||
        code.includes(q) ||
        r.type.toLowerCase().includes(q) ||
        (r.active ? 'active' : 'inactive').includes(q)
      )
    })
  }, [rows, query])

  const stats = useMemo(() => {
    const total = rows.length
    const active = rows.filter((r) => r.active).length
    const inactive = total - active
    return { total, active, inactive }
  }, [rows])

  function openAdd() {
    setModalMode('add')
    setEditingId(null)
    setForm({ name: '', type: 'percentage', value: '', code: '', active: true })
    setModalOpen(true)
  }

  function openEdit(row) {
    setModalMode('edit')
    setEditingId(row.id)
    setForm({
      name: row.name,
      type: row.type,
      value: String(row.value),
      code: row.code ?? '',
      active: row.active,
    })
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
  }

  function save() {
    const name = form.name.trim()
    const valueNum = Number(form.value)
    const code = normalizeCode(form.code)

    if (!name) return
    if (!Number.isFinite(valueNum) || valueNum < 0) return
    if (form.type !== 'percentage' && form.type !== 'fixed') return

    if (modalMode === 'add') {
      const id = `${code || name}`.toLowerCase().replace(/\s+/g, '-')
      createDiscount({ id, name, type: form.type, value: valueNum, code: code || null, active: form.active })
        .then(() => listDiscounts(''))
        .then((res) => setRows(res?.items || []))
        .finally(() => closeModal())
    } else {
      if (!editingId) return
      updateDiscount(editingId, { name, type: form.type, value: valueNum, code: code || null, active: form.active })
        .then(() => listDiscounts(''))
        .then((res) => setRows(res?.items || []))
        .finally(() => closeModal())
    }
  }

  function del(rowId) {
    deleteDiscount(rowId)
      .then(() => listDiscounts(''))
      .then((res) => setRows(res?.items || []))
  }

  function toggleActive(rowId) {
    const row = rows.find((r) => r.id === rowId)
    const nextActive = !row?.active
    toggleDiscountActive(rowId, nextActive)
      .then(() => listDiscounts(''))
      .then((res) => setRows(res?.items || []))
  }

  function formatValue(r) {
    if (r.type === 'percentage') return `${r.value}%`
    return money(r.value)
  }

  return (
    <div className="dis-page">
      <div className="dis-header">
        <div>
          <div className="dis-title">Discounts & Promotions</div>
          <div className="dis-subtitle">Manage discounts, coupons, and promotional offers</div>
        </div>

        <button className="dis-addBtn" type="button" onClick={openAdd}>
          <IconPlus />
          <span>Add Discount</span>
        </button>
      </div>

      <div className="dis-statsRow">
        <div className="dis-stat dis-statTotal">
          <div className="dis-statTop">
            <div className="dis-statLabel">Total Discounts</div>
            <IconTag />
          </div>
          <div className="dis-statValue">{stats.total}</div>
        </div>
        <div className="dis-stat dis-statActive">
          <div className="dis-statTop">
            <div className="dis-statLabel">Active Discounts</div>
            <IconCheck />
          </div>
          <div className="dis-statValue dis-statValueActive">{stats.active}</div>
        </div>
        <div className="dis-stat dis-statInactive">
          <div className="dis-statTop">
            <div className="dis-statLabel">Inactive Discounts</div>
            <IconX />
          </div>
          <div className="dis-statValue dis-statValueInactive">{stats.inactive}</div>
        </div>
      </div>

      <div className="dis-card">
        <div className="dis-cardHeader">
          <div className="dis-cardTitle">All Discounts</div>
          <div className="dis-searchWrap">
            <IconSearch />
            <input
              className="dis-searchInput"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search discounts..."
              aria-label="Search discounts"
            />
          </div>
        </div>

        <div className="dis-tableScroll">
          <table className="dis-table" role="table" aria-label="Discounts table">
            <thead>
              <tr>
                <th>Discount</th>
                <th>Type</th>
                <th>Value</th>
                <th>Code</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="6" className="dis-empty">
                    No discounts found.
                  </td>
                </tr>
              ) : (
                filtered.map((r) => (
                  <tr key={r.id}>
                    <td className="dis-cellName">{r.name}</td>
                    <td className="dis-cellType">{r.type === 'percentage' ? 'Percentage' : 'Rs Fixed'}</td>
                    <td className="dis-cellValue">{formatValue(r)}</td>
                    <td className="dis-cellCode">{r.code || '—'}</td>
                    <td>
                      <button
                        type="button"
                        className={`dis-switch ${r.active ? 'active' : 'inactive'}`}
                        onClick={() => toggleActive(r.id)}
                        aria-label={`Set ${r.name} to ${r.active ? 'inactive' : 'active'}`}
                      >
                        <span className="dis-switchKnob" aria-hidden="true" />
                      </button>
                    </td>
                    <td>
                      <div className="dis-actions">
                        <button className="dis-editBtn" type="button" onClick={() => openEdit(r)} aria-label={`Edit ${r.name}`}>
                          <IconEdit />
                        </button>
                        <button className="dis-delBtn" type="button" onClick={() => del(r.id)} aria-label={`Delete ${r.name}`}>
                          <IconTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen ? (
        <div className="dis-modalBackdrop" role="dialog" aria-modal="true" aria-label="Add/Edit discount">
          <div className="dis-modal">
            <div className="dis-modalHeader">
              <div className="dis-modalTitle">{modalMode === 'add' ? 'Add Discount' : 'Edit Discount'}</div>
              <button className="dis-modalClose" type="button" onClick={closeModal} aria-label="Close">
                ×
              </button>
            </div>

            <div className="dis-modalBody">
              <div className="dis-formGrid">
                <label className="dis-label">
                  <div className="dis-labelText">Discount name</div>
                  <input className="dis-input" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
                </label>
                <label className="dis-label">
                  <div className="dis-labelText">Type</div>
                  <select className="dis-input" value={form.type} onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}>
                    <option value="percentage">Percentage</option>
                    <option value="fixed">Fixed</option>
                  </select>
                </label>
                <label className="dis-label">
                  <div className="dis-labelText">{form.type === 'percentage' ? 'Percentage value' : 'Fixed value (Rs)'}</div>
                  <input
                    className="dis-input"
                    inputMode="decimal"
                    value={form.value}
                    onChange={(e) => setForm((p) => ({ ...p, value: e.target.value }))}
                  />
                </label>
                <label className="dis-label">
                  <div className="dis-labelText">Code</div>
                  <input className="dis-input" value={form.code} onChange={(e) => setForm((p) => ({ ...p, code: e.target.value }))} placeholder="Optional" />
                </label>
                <label className="dis-label dis-labelStatus">
                  <div className="dis-labelText">Status</div>
                  <div className="dis-statusRow">
                    <button
                      type="button"
                      className={`dis-statusPill ${form.active ? 'active' : ''}`}
                      onClick={() => setForm((p) => ({ ...p, active: true }))}
                    >
                      Active
                    </button>
                    <button
                      type="button"
                      className={`dis-statusPill ${!form.active ? 'active' : ''}`}
                      onClick={() => setForm((p) => ({ ...p, active: false }))}
                    >
                      Inactive
                    </button>
                  </div>
                </label>
              </div>
            </div>

            <div className="dis-modalFooter">
              <button className="dis-modalSecondary" type="button" onClick={closeModal}>
                Cancel
              </button>
              <button className="dis-modalPrimary" type="button" onClick={save}>
                Save
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}


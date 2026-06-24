import { useEffect, useMemo, useState } from 'react'
import './Customer.css'
import { listCustomers, createCustomer, updateCustomer, deleteCustomer } from './api/customersApi'

function money(amount) {
  return `Rs. ${amount.toFixed(2)}`
}

function IconPlus() {
  return (
    <svg className="cus-plusIcon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 5v14M5 12h14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function IconSearch() {
  return (
    <svg className="cus-searchIcon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M21 21l-4.35-4.35" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth="2" />
    </svg>
  )
}

function IconStar() {
  return (
    <svg className="cus-statIcon" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function IconUser() {
  return (
    <svg className="cus-statIcon" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  )
}

function IconDollar() {
  return (
    <svg className="cus-statIcon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 1v22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
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

function IconEdit() {
  return (
    <svg className="cus-actionIcon" viewBox="0 0 24 24" aria-hidden="true">
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
    <svg className="cus-actionIcon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3 6h18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M8 6V4h8v2" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M6 6l1 16h10l1-16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M10 11v6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M14 11v6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function initialsFromName(name) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  const a = parts[0]?.[0] ?? ''
  const b = parts[1]?.[0] ?? ''
  return (a + b).toUpperCase()
}

function avatarTone(id) {
  const tones = [
    { bg: 'rgba(34,197,94,0.16)', br: 'rgba(34,197,94,0.35)', fg: 'rgba(209,250,229,0.95)' },
    { bg: 'rgba(59,130,246,0.16)', br: 'rgba(59,130,246,0.35)', fg: 'rgba(219,234,254,0.95)' },
    { bg: 'rgba(168,85,247,0.16)', br: 'rgba(168,85,247,0.35)', fg: 'rgba(237,233,254,0.95)' },
    { bg: 'rgba(245,158,11,0.16)', br: 'rgba(245,158,11,0.35)', fg: 'rgba(254,243,199,0.95)' },
  ]
  let hash = 0
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0
  return tones[hash % tones.length]
}

export default function Customer() {
  // TODO: replace mock state with API calls:
  // - GET /customers
  // - POST /customers
  // - PUT /customers/:id
  // - DELETE /customers/:id
  const [rows, setRows] = useState([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)

  const [modalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState('add') // add | edit
  const [editingId, setEditingId] = useState(null)

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    loyaltyPoints: '',
    totalSpent: '',
  })

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      try {
        const res = await listCustomers('')
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
      return (
        r.name.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q) ||
        r.phone.toLowerCase().includes(q)
      )
    })
  }, [rows, query])

  const stats = useMemo(() => {
    const totalCustomers = rows.length
    const totalLoyaltyPoints = rows.reduce((sum, r) => sum + r.loyaltyPoints, 0)
    const revenue = rows.reduce((sum, r) => sum + r.totalSpent, 0)
    return { totalCustomers, totalLoyaltyPoints, revenue }
  }, [rows])

  function openAdd() {
    setModalMode('add')
    setEditingId(null)
    setForm({ name: '', email: '', phone: '', loyaltyPoints: '', totalSpent: '' })
    setModalOpen(true)
  }

  function openEdit(row) {
    setModalMode('edit')
    setEditingId(row.id)
    setForm({
      name: row.name,
      email: row.email,
      phone: row.phone,
      loyaltyPoints: String(row.loyaltyPoints),
      totalSpent: String(row.totalSpent),
    })
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
  }

  function save() {
    const name = form.name.trim()
    const email = form.email.trim()
    const phone = form.phone.trim()
    const loyaltyPoints = Number(form.loyaltyPoints)
    const totalSpent = Number(form.totalSpent)

    if (!name || !email || !phone) return
    if (!Number.isFinite(loyaltyPoints) || loyaltyPoints < 0) return
    if (!Number.isFinite(totalSpent) || totalSpent < 0) return

    if (modalMode === 'add') {
      const id = email.toLowerCase()
      createCustomer({ id, name, email, phone, loyaltyPoints, totalSpent })
        .then(() => listCustomers(''))
        .then((res) => setRows(res?.items || []))
        .finally(() => closeModal())
    } else {
      if (!editingId) return
      updateCustomer(editingId, { name, email, phone, loyaltyPoints, totalSpent })
        .then(() => listCustomers(''))
        .then((res) => setRows(res?.items || []))
        .finally(() => closeModal())
    }
  }

  function del(rowId) {
    deleteCustomer(rowId)
      .then(() => listCustomers(''))
      .then((res) => setRows(res?.items || []))
  }

  return (
    <div className="cus-page">
      <div className="cus-topBar">
        <div>
          <div className="cus-title">Customers</div>
          <div className="cus-subtitle">Manage your customer database and loyalty program</div>
        </div>

        <button className="cus-addBtn" type="button" onClick={openAdd}>
          <IconPlus />
          <span>Add Customer</span>
        </button>
      </div>

      <div className="cus-statsRow">
        <div className="cus-stat cus-statTotal">
          <div className="cus-statTop">
            <div className="cus-statLabel">Total Customers</div>
            <IconUser />
          </div>
          <div className="cus-statValue">{stats.totalCustomers}</div>
        </div>

        <div className="cus-stat cus-statPoints">
          <div className="cus-statTop">
            <div className="cus-statLabel">Total Loyalty Points</div>
            <IconStar />
          </div>
          <div className="cus-statValue">{stats.totalLoyaltyPoints}</div>
        </div>

        <div className="cus-stat cus-statRevenue">
          <div className="cus-statTop">
            <div className="cus-statLabel">Customer Revenue</div>
            <IconDollar />
          </div>
          <div className="cus-statValue cus-statValueMoney">{money(stats.revenue)}</div>
        </div>
      </div>

      <div className="cus-card">
        <div className="cus-cardHeader">
          <div className="cus-cardTitle">Customer List</div>
          <div className="cus-searchWrap">
            <IconSearch />
            <input
              className="cus-searchInput"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search customers..."
              aria-label="Search customers"
            />
          </div>
        </div>

        <div className="cus-tableScroll">
          <table className="cus-table" role="table" aria-label="Customers table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Contact</th>
                <th>Loyalty Points</th>
                <th>Total Spent</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="5" className="cus-empty">
                    No customers found.
                  </td>
                </tr>
              ) : (
                filtered.map((r) => {
                  const tone = avatarTone(r.id)
                  return (
                    <tr key={r.id}>
                      <td className="cus-cellCustomer">
                        <div className="cus-customerRow">
                          <div
                            className="cus-avatar"
                            style={{
                              background: tone.bg,
                              borderColor: tone.br,
                              color: tone.fg,
                            }}
                            aria-hidden="true"
                          >
                            {initialsFromName(r.name)}
                          </div>
                          <div>
                            <div className="cus-customerName">{r.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="cus-contact">
                        <div className="cus-contactEmail">{r.email}</div>
                        <div className="cus-contactPhone">{r.phone}</div>
                      </td>
                      <td className="cus-points">
                        <span className="cus-pointsStar" aria-hidden="true">
                          ★
                        </span>
                        {r.loyaltyPoints}
                      </td>
                      <td className="cus-spent">{money(r.totalSpent)}</td>
                      <td>
                        <div className="cus-actions">
                          <button className="cus-editBtn" type="button" onClick={() => openEdit(r)} aria-label={`Edit ${r.name}`}>
                            <IconEdit />
                          </button>
                          <button className="cus-delBtn" type="button" onClick={() => del(r.id)} aria-label={`Delete ${r.name}`}>
                            <IconTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen ? (
        <div className="cus-modalBackdrop" role="dialog" aria-modal="true" aria-label="Add/Edit customer">
          <div className="cus-modal">
            <div className="cus-modalHeader">
              <div className="cus-modalTitle">{modalMode === 'add' ? 'Add Customer' : 'Edit Customer'}</div>
              <button className="cus-modalClose" type="button" onClick={closeModal} aria-label="Close">
                ×
              </button>
            </div>
            <div className="cus-modalBody">
              <div className="cus-formGrid">
                <label className="cus-label">
                  <div className="cus-labelText">Full name</div>
                  <input className="cus-input" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
                </label>
                <label className="cus-label">
                  <div className="cus-labelText">Email</div>
                  <input className="cus-input" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} />
                </label>
                <label className="cus-label">
                  <div className="cus-labelText">Phone</div>
                  <input className="cus-input" value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} />
                </label>
                <label className="cus-label">
                  <div className="cus-labelText">Loyalty Points</div>
                  <input
                    className="cus-input"
                    inputMode="numeric"
                    value={form.loyaltyPoints}
                    onChange={(e) => setForm((p) => ({ ...p, loyaltyPoints: e.target.value }))}
                  />
                </label>
                <label className="cus-label">
                  <div className="cus-labelText">Total Spent</div>
                  <input
                    className="cus-input"
                    inputMode="decimal"
                    value={form.totalSpent}
                    onChange={(e) => setForm((p) => ({ ...p, totalSpent: e.target.value }))}
                  />
                </label>
              </div>
            </div>
            <div className="cus-modalFooter">
              <button className="cus-modalSecondary" type="button" onClick={closeModal}>
                Cancel
              </button>
              <button
                className="cus-modalPrimary"
                type="button"
                onClick={save}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}


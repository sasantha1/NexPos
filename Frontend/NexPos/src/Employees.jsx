import { useEffect, useMemo, useState } from 'react'
import './Employees.css'
import { listEmployees, createEmployee, updateEmployee, deleteEmployee } from './api/employeesApi'

function money(amount) {
  return `Rs. ${amount.toFixed(2)}`
}

function IconPlus() {
  return (
    <svg className="emp-plusIcon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 5v14M5 12h14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function IconSearch() {
  return (
    <svg className="emp-searchIcon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M21 21l-4.35-4.35" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth="2" />
    </svg>
  )
}

function IconUsers() {
  return (
    <svg className="emp-cardIcon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function IconCart() {
  return (
    <svg className="emp-cardIcon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6 6h15l-1.5 9h-13z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M6 6l-2-2" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="9" cy="20" r="1" fill="none" stroke="currentColor" strokeWidth="2" />
      <circle cx="18" cy="20" r="1" fill="none" stroke="currentColor" strokeWidth="2" />
    </svg>
  )
}

function IconMoney() {
  return (
    <svg className="emp-cardIcon" viewBox="0 0 24 24" aria-hidden="true">
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
    <svg className="emp-actionIcon" viewBox="0 0 24 24" aria-hidden="true">
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
    <svg className="emp-actionIcon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3 6h18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M8 6V4h8v2" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M6 6l1 16h10l1-16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M10 11v6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M14 11v6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

const ROLE_OPTIONS = ['Admin', 'Manager', 'Cashier']

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

function roleTone(role) {
  if (role === 'Admin') return { cls: 'emp-roleAdmin', bg: 'rgba(239,68,68,0.12)', br: 'rgba(239,68,68,0.35)' }
  if (role === 'Manager') return { cls: 'emp-roleManager', bg: 'rgba(59,130,246,0.12)', br: 'rgba(59,130,246,0.35)' }
  return { cls: 'emp-roleCashier', bg: 'rgba(34,197,94,0.12)', br: 'rgba(34,197,94,0.35)' }
}

export default function Employees() {
  // TODO: replace with API:
  // - GET /employees
  // - POST /employees
  // - PUT /employees/:id
  // - DELETE /employees/:id
  const [rows, setRows] = useState([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)

  const [modalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState('add') // add|edit
  const [editingId, setEditingId] = useState(null)

  const [form, setForm] = useState({
    name: '',
    email: '',
    role: 'Cashier',
    salesCount: '',
    totalSales: '',
  })

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      try {
        const res = await listEmployees('')
        if (cancelled) return
        setRows((res?.items || []).map((r) => ({ ...r, isYou: false })))
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
    return rows.filter((r) => r.name.toLowerCase().includes(q) || r.email.toLowerCase().includes(q) || r.role.toLowerCase().includes(q))
  }, [rows, query])

  const stats = useMemo(() => {
    const totalEmployees = rows.length
    const totalTransactions = rows.reduce((sum, r) => sum + r.salesCount, 0)
    const totalSales = rows.reduce((sum, r) => sum + r.totalSales, 0)
    return { totalEmployees, totalTransactions, totalSales }
  }, [rows])

  function openAdd() {
    setModalMode('add')
    setEditingId(null)
    setForm({ name: '', email: '', role: 'Cashier', salesCount: '', totalSales: '' })
    setModalOpen(true)
  }

  function openEdit(row) {
    setModalMode('edit')
    setEditingId(row.id)
    setForm({
      name: row.name,
      email: row.email,
      role: row.role,
      salesCount: String(row.salesCount),
      totalSales: String(row.totalSales),
    })
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
  }

  function save() {
    const name = form.name.trim()
    const email = form.email.trim()
    const salesCount = Number(form.salesCount)
    const totalSales = Number(form.totalSales)

    if (!name || !email) return
    if (!Number.isFinite(salesCount) || salesCount < 0) return
    if (!Number.isFinite(totalSales) || totalSales < 0) return

    if (modalMode === 'add') {
      const id = email.toLowerCase()
      createEmployee({ id, name, email, role: form.role, salesCount, totalSales })
        .then(() => listEmployees(''))
        .then((res) => setRows((res?.items || []).map((r) => ({ ...r, isYou: false }))))
        .finally(() => closeModal())
    } else {
      if (!editingId) return
      updateEmployee(editingId, { name, email, role: form.role, salesCount, totalSales })
        .then(() => listEmployees(''))
        .then((res) => setRows((res?.items || []).map((r) => ({ ...r, isYou: false }))))
        .finally(() => closeModal())
    }
  }

  function del(rowId) {
    deleteEmployee(rowId)
      .then(() => listEmployees(''))
      .then((res) => setRows((res?.items || []).map((r) => ({ ...r, isYou: false }))))
  }

  return (
    <div className="emp-page">
      <div className="emp-header">
        <div>
          <div className="emp-title">Employees</div>
          <div className="emp-subtitle">Manage staff accounts and track performance</div>
        </div>
        <button className="emp-addBtn" type="button" onClick={openAdd}>
          <IconPlus />
          <span>Add Employee</span>
        </button>
      </div>

      <div className="emp-statsRow">
        <div className="emp-stat emp-statTotal">
          <div className="emp-statTop">
            <div className="emp-statLabel">Total Employees</div>
            <IconUsers />
          </div>
          <div className="emp-statValue">{stats.totalEmployees}</div>
        </div>

        <div className="emp-stat emp-statTx">
          <div className="emp-statTop">
            <div className="emp-statLabel">Total Transactions</div>
            <IconCart />
          </div>
          <div className="emp-statValue emp-statValueTx">{stats.totalTransactions}</div>
        </div>

        <div className="emp-stat emp-statSales">
          <div className="emp-statTop">
            <div className="emp-statLabel">Total Sales</div>
            <IconMoney />
          </div>
          <div className="emp-statValue emp-statValueMoney">{money(stats.totalSales)}</div>
        </div>
      </div>

      <div className="emp-card">
        <div className="emp-cardHeader">
          <div className="emp-cardTitle">Staff Directory</div>
          <div className="emp-searchWrap">
            <IconSearch />
            <input
              className="emp-searchInput"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search employees..."
              aria-label="Search employees"
            />
          </div>
        </div>

        <div className="emp-tableScroll">
          <table className="emp-table" role="table" aria-label="Employees table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Email</th>
                <th>Role</th>
                <th>Sales Count</th>
                <th>Total Sales</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="6" className="emp-empty">
                    No employees found.
                  </td>
                </tr>
              ) : (
                filtered.map((r) => {
                  const tone = roleTone(r.role)
                  const av = avatarTone(r.id)
                  return (
                    <tr key={r.id}>
                      <td className="emp-cellEmployee">
                        <div className="emp-employeeCell">
                          <div
                            className="emp-avatar"
                            style={{ background: av.bg, borderColor: av.br, color: av.fg }}
                            aria-hidden="true"
                          >
                            {initialsFromName(r.name)}
                          </div>
                          <div>
                            <div className="emp-employeeName">{r.name}</div>
                            {r.isYou ? <span className="emp-youPill">You</span> : null}
                          </div>
                        </div>
                      </td>
                      <td className="emp-email">{r.email}</td>
                      <td>
                        <span className={`emp-role ${tone.cls}`} style={{ background: tone.bg, borderColor: tone.br }}>
                          {r.role}
                        </span>
                      </td>
                      <td className="emp-salesCount">{r.salesCount}</td>
                      <td className="emp-totalSales">{money(r.totalSales)}</td>
                      <td>
                        <div className="emp-actions">
                          <button className="emp-editBtn" type="button" onClick={() => openEdit(r)} aria-label={`Edit ${r.name}`}>
                            <IconEdit />
                          </button>
                          <button className="emp-delBtn" type="button" onClick={() => del(r.id)} aria-label={`Delete ${r.name}`}>
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
        <div className="emp-modalBackdrop" role="dialog" aria-modal="true" aria-label="Add/Edit employee">
          <div className="emp-modal">
            <div className="emp-modalHeader">
              <div className="emp-modalTitle">{modalMode === 'add' ? 'Add Employee' : 'Edit Employee'}</div>
              <button className="emp-modalClose" type="button" onClick={closeModal} aria-label="Close">
                ×
              </button>
            </div>
            <div className="emp-modalBody">
              <div className="emp-formGrid">
                <label className="emp-label">
                  <div className="emp-labelText">Full name</div>
                  <input className="emp-input" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
                </label>
                <label className="emp-label">
                  <div className="emp-labelText">Email</div>
                  <input className="emp-input" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} />
                </label>
                <label className="emp-label">
                  <div className="emp-labelText">Role</div>
                  <select className="emp-input emp-select" value={form.role} onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}>
                    {ROLE_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="emp-label">
                  <div className="emp-labelText">Sales Count</div>
                  <input
                    className="emp-input"
                    inputMode="numeric"
                    value={form.salesCount}
                    onChange={(e) => setForm((p) => ({ ...p, salesCount: e.target.value }))}
                  />
                </label>
                <label className="emp-label">
                  <div className="emp-labelText">Total Sales</div>
                  <input
                    className="emp-input"
                    inputMode="decimal"
                    value={form.totalSales}
                    onChange={(e) => setForm((p) => ({ ...p, totalSales: e.target.value }))}
                  />
                </label>
              </div>
            </div>
            <div className="emp-modalFooter">
              <button className="emp-modalSecondary" type="button" onClick={closeModal}>
                Cancel
              </button>
              <button className="emp-modalPrimary" type="button" onClick={save}>
                Save
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}


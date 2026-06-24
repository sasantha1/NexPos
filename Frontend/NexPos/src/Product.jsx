import { useEffect, useMemo, useState } from 'react'
import './Product.css'
import { listProducts, createProduct, updateProduct, deleteProduct } from './api/productsApi'

function money(amount) {
  return `Rs. ${amount.toFixed(2)}`
}

function IconSearch() {
  return (
    <svg className="prd-searchIcon" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M21 21l-4.35-4.35"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth="2" />
    </svg>
  )
}

function IconBox() {
  return (
    <svg className="prd-headerIcon" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M21 8.5V16a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M3.5 7.5 12 3l8.5 4.5L12 12 3.5 7.5z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function IconPlus() {
  return (
    <svg className="prd-plusIcon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 5v14M5 12h14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function IconEdit() {
  return (
    <svg className="prd-actionIcon" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 20h9"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
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
    <svg className="prd-actionIcon" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M3 6h18"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M8 6V4h8v2"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M6 6l1 16h10l1-16"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M10 11v6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M14 11v6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

export default function Product() {
  // TODO: replace with real API:
  // - GET /products
  // - POST /products
  // - PUT /products/:id
  // - DELETE /products/:id
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')

  const [modalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState('add') // 'add' | 'edit'
  const [errorMessage, setErrorMessage] = useState('')
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: '',
    description: '',
    barcode: '',
    category: '',
    price: '',
    stock: '',
  })
  const [editingId, setEditingId] = useState(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      try {
        const res = await listProducts('')
        if (cancelled) return
        setRows(res?.items || [])
      } catch {
        if (cancelled) return
        setRows([])
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
        r.description.toLowerCase().includes(q) ||
        r.barcode.toLowerCase().includes(q) ||
        r.category.toLowerCase().includes(q)
      )
    })
  }, [rows, query])

  function openAdd() {
    setErrorMessage('')
    setModalMode('add')
    setEditingId(null)
    setForm({ name: '', description: '', barcode: '', category: '', price: '', stock: '' })
    setModalOpen(true)
  }

  function openEdit(row) {
    setErrorMessage('')
    setModalMode('edit')
    setEditingId(row.id)
    setForm({
      name: row.name,
      description: row.description,
      barcode: row.barcode,
      category: row.category,
      price: String(row.price),
      stock: String(row.stock),
    })
    setModalOpen(true)
  }

  function closeModal() {
    if (saving) return
    setModalOpen(false)
    setErrorMessage('')
  }

  async function save() {
    const price = Number(form.price)
    const stock = Number(form.stock)
    if (!form.name.trim() || !form.barcode.trim() || !form.category.trim()) {
      setErrorMessage('Please fill Product name, Barcode, and Category.')
      return
    }
    if (!Number.isFinite(price) || !Number.isFinite(stock) || price < 0 || stock < 0) {
      setErrorMessage('Price and Stock must be valid numbers.')
      return
    }

    setSaving(true)
    setErrorMessage('')

    try {
      if (modalMode === 'add') {
        const id = form.barcode.trim()
        await createProduct({
          id,
          name: form.name.trim(),
          description: form.description.trim(),
          barcode: form.barcode.trim(),
          category: form.category.trim(),
          price,
          stock,
        })
      } else {
        if (!editingId) return
        await updateProduct(editingId, {
          name: form.name.trim(),
          description: form.description.trim(),
          barcode: form.barcode.trim(),
          category: form.category.trim(),
          price,
          stock,
        })
      }

      const res = await listProducts('')
      setRows(res?.items || [])
      setModalOpen(false)
      setErrorMessage('')
    } catch (err) {
      setErrorMessage(err?.message || 'Failed to save product.')
    } finally {
      setSaving(false)
    }
  }

  function del(rowId) {
    setErrorMessage('')
    deleteProduct(rowId)
      .then(() => listProducts(''))
      .then((res) => setRows(res?.items || []))
      .catch((err) => setErrorMessage(err?.message || 'Failed to delete product.'))
  }

  return (
    <div className="prd-page">
      <div className="prd-topBar">
        <div>
          <div className="prd-title">Products</div>
          <div className="prd-subtitle">Manage your product catalog</div>
        </div>

        <button className="prd-addBtn" type="button" onClick={openAdd}>
          <IconPlus />
          <span>Add Product</span>
        </button>
      </div>

      <div className="prd-card">
        <div className="prd-cardHeader">
          <div className="prd-headerLeft">
            <IconBox />
            <div className="prd-headerText">Product Catalog</div>
          </div>

          <div className="prd-searchWrap">
            <IconSearch />
            <input
              className="prd-searchInput"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search products..."
              aria-label="Search products"
            />
          </div>
        </div>

        <div className="prd-tableScroll">
          <table className="prd-table" role="table" aria-label="Products table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Barcode</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="prd-empty">
                    Loading...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="6" className="prd-empty">
                    No products found.
                  </td>
                </tr>
              ) : (
                filtered.map((r) => (
                  <tr key={r.id}>
                    <td className="prd-cellProduct">
                      <div className="prd-productName">{r.name}</div>
                      <div className="prd-productDesc">{r.description}</div>
                    </td>
                    <td>{r.barcode}</td>
                    <td>{r.category}</td>
                    <td className="prd-price">{money(r.price)}</td>
                    <td>{r.stock}</td>
                    <td>
                      <div className="prd-actions">
                        <button className="prd-editBtn" type="button" onClick={() => openEdit(r)} aria-label={`Edit ${r.name}`}>
                          <IconEdit />
                        </button>
                        <button className="prd-delBtn" type="button" onClick={() => del(r.id)} aria-label={`Delete ${r.name}`}>
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
        <div className="prd-modalBackdrop" role="dialog" aria-modal="true" aria-label="Add/Edit product">
          <div className="prd-modal">
            <div className="prd-modalHeader">
              <div className="prd-modalTitle">{modalMode === 'add' ? 'Add Product' : 'Edit Product'}</div>
              <button className="prd-modalClose" type="button" onClick={closeModal} aria-label="Close">
                ×
              </button>
            </div>

            <div className="prd-modalBody">
              <div className="prd-formGrid">
                <label className="prd-label">
                  <div className="prd-labelText">Product name</div>
                  <input className="prd-input" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
                </label>
                <label className="prd-label">
                  <div className="prd-labelText">Description</div>
                  <input
                    className="prd-input"
                    value={form.description}
                    onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  />
                </label>
                <label className="prd-label">
                  <div className="prd-labelText">Barcode</div>
                  <input className="prd-input" value={form.barcode} onChange={(e) => setForm((p) => ({ ...p, barcode: e.target.value }))} />
                </label>
                <label className="prd-label">
                  <div className="prd-labelText">Category</div>
                  <input className="prd-input" value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))} />
                </label>
                <label className="prd-label">
                  <div className="prd-labelText">Price</div>
                  <input className="prd-input" inputMode="decimal" value={form.price} onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))} />
                </label>
                <label className="prd-label">
                  <div className="prd-labelText">Stock</div>
                  <input className="prd-input" inputMode="numeric" value={form.stock} onChange={(e) => setForm((p) => ({ ...p, stock: e.target.value }))} />
                </label>
              </div>
              {errorMessage ? <div className="prd-empty" style={{ marginTop: 10 }}>{errorMessage}</div> : null}
            </div>

            <div className="prd-modalFooter">
              <button className="prd-modalSecondary" type="button" onClick={closeModal} disabled={saving}>
                Cancel
              </button>
              <button className="prd-modalPrimary" type="button" onClick={save} disabled={saving}>
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}


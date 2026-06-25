import { useEffect, useMemo, useRef, useState } from 'react'
import './Dashboard.css'
import Inventory from './Inventory.jsx'
import Product from './Product.jsx'
import Customer from './Customer.jsx'
import Employees from './Employees.jsx'
import Report from './Report.jsx'
import Discount from './Discount.jsx'
import Settings from './Settings.jsx'
import { getSettings } from './api/settingsApi'
import { resolveDiscountByCode } from './api/discountsApi'
import { checkout as checkoutOrder } from './api/ordersApi'
import { listProducts } from './api/productsApi'
import { createCustomer, listCustomers } from './api/customersApi'

const NAV_ITEMS = [
  { id: 'sales', label: 'Sales' },
  { id: 'inventory', label: 'Inventory' },
  { id: 'products', label: 'Products' },
  { id: 'customers', label: 'Customers' },
  { id: 'employees', label: 'Employees' },
  { id: 'reports', label: 'Reports' },
  { id: 'discounts', label: 'Discounts' },
  { id: 'settings', label: 'Settings' },
]

const ROLE_NAV_ACCESS = {
  Admin: NAV_ITEMS.map((x) => x.id),
  Manager: ['sales', 'inventory', 'products', 'customers', 'employees', 'reports', 'discounts'],
  Cashier: ['sales'],
}

function money(amount) {
  return `Rs. ${amount.toFixed(2)}`
}

function receiptAmount(amount) {
  return Number(amount || 0).toFixed(2)
}

function formatBillNo(orderId) {
  if (!orderId) return '—'
  const year = new Date().getFullYear()
  return `INV-${year}-${orderId}`
}

function formatReceiptDate(date) {
  if (!date) return ''
  const d = date instanceof Date ? date : new Date(date)
  return d.toISOString().slice(0, 10)
}

function formatReceiptTime(date) {
  if (!date) return ''
  const d = date instanceof Date ? date : new Date(date)
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
}

function formatPaymentLabel(receipt) {
  if (!receipt) return ''
  const method = receipt.paymentMethod
  if (method === 'card') {
    const last4 = (receipt.cardNumber || '').replace(/\s/g, '').slice(-4)
    return last4 ? `Visa (Ending ${last4})` : 'Card'
  }
  if (method === 'mobile') return receipt.mobileNumber ? `Mobile (${receipt.mobileNumber})` : 'Mobile Wallet'
  if (method === 'online') return receipt.onlineAccountNumber ? `Online (${receipt.onlineAccountNumber})` : 'Online'
  if (method === 'cash') return 'Cash'
  return method ? String(method).toUpperCase() : ''
}

function truncateText(text, max = 16) {
  const value = (text || '').toString()
  return value.length > max ? `${value.slice(0, max - 1)}…` : value
}

function IconPlus() {
  return (
    <svg className="pos-btnIcon" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 5v14M5 12h14"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}

function IconMinus() {
  return (
    <svg className="pos-btnIcon" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M5 12h14"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}

function IconTrash() {
  return (
    <svg className="pos-btnIcon" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M4 7h16"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M10 11v6M14 11v6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M6 7l1 14h10l1-14"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M9 7V4h6v3"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function IconTag() {
  return (
    <svg className="pos-btnIcon" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M3 12l9 9 9-9-9-9H6l-3 3v6z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M7.5 7.5h.01"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  )
}

function IconCard() {
  return (
    <svg className="pos-btnIcon" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M3 7h18v10H3V7z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M3 10h18"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}

function IconLogout() {
  return (
    <svg className="pos-btnIcon" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M10 17l5-5-5-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M15 12H3"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M21 21V3"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}

function NavIconSales() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M4 19V5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M8 19V9"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M12 19V12"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M16 19V7"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M20 19V10"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}

function NavIconInventory() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M3 7l9-4 9 4-9 4-9-4z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M3 7v10l9 4 9-4V7"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M12 11v10"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}

function NavIconProducts() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M3 8l9-5 9 5-9 5-9-5z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M3 8v8l9 5 9-5V8"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M12 13v8"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}

function NavIconCustomers() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M22 21v-2a3 3 0 0 0-2-2.83"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M16 3.13a4 4 0 0 1 0 7.75"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}

function NavIconEmployees() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M23 21v-2a4 4 0 0 0-3-3.87"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M16 3.13a4 4 0 0 1 0 7.75"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}

function NavIconReports() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M4 19V5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v14"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M8 13h2v-3H8v3z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M12 13h2V7h-2v6z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M16 13h2V10h-2v3z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function NavIconDiscounts() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M20 12v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-7"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M4 12l3-3"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M17 9l3 3"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M9 15l6-6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}

function NavIconSettings() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 15.5A3.5 3.5 0 1 0 12 8.5a3.5 3.5 0 0 0 0 7z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V22a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06A2 2 0 1 1 3.6 18.7l.06-.06A1.65 1.65 0 0 0 4 16.82 1.65 1.65 0 0 0 2.5 15H2a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06A2 2 0 1 1 6.44 4.3l.06.06A1.65 1.65 0 0 0 8.32 4a1.65 1.65 0 0 0 1-1.51V2a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06A2 2 0 1 1 20.4 6.44l-.06.06A1.65 1.65 0 0 0 20 8.32c0 .64.38 1.23.97 1.5.3.14.6.22.93.22H22a2 2 0 1 1 0 4h-.09c-.33 0-.64.08-.93.22-.59.27-.97.86-.97 1.5z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

const NAV_ICONS_BY_ID = {
  sales: <NavIconSales />,
  inventory: <NavIconInventory />,
  products: <NavIconProducts />,
  customers: <NavIconCustomers />,
  employees: <NavIconEmployees />,
  reports: <NavIconReports />,
  discounts: <NavIconDiscounts />,
  settings: <NavIconSettings />,
}

export default function Dashboard({ user, onLogout }) {
  const [activeNav, setActiveNav] = useState('sales')
  const [activeCategory, setActiveCategory] = useState('')
  const [cart, setCart] = useState({})
  const [discountCode, setDiscountCode] = useState('')
  const [appliedDiscount, setAppliedDiscount] = useState(null)
  const [productQuery, setProductQuery] = useState('')
  const [barcodeQuery, setBarcodeQuery] = useState('')
  const [taxRatePct, setTaxRatePct] = useState(8.5)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [cashReceived, setCashReceived] = useState('')
  const [cardNumber, setCardNumber] = useState('')
  const [mobileNumber, setMobileNumber] = useState('')
  const [onlineAccountNumber, setOnlineAccountNumber] = useState('')
  const [isCompletingSale, setIsCompletingSale] = useState(false)
  const [checkoutError, setCheckoutError] = useState('')
  const [products, setProducts] = useState([])
  const allowedNavIds = useMemo(() => {
    const role = user?.role || 'Cashier'
    return ROLE_NAV_ACCESS[role] || ['sales']
  }, [user?.role])

  const visibleNavItems = useMemo(
    () => NAV_ITEMS.filter((item) => allowedNavIds.includes(item.id)),
    [allowedNavIds]
  )

  useEffect(() => {
    if (!allowedNavIds.includes(activeNav)) setActiveNav('sales')
  }, [allowedNavIds, activeNav])


  const [showReceiptModal, setShowReceiptModal] = useState(false)
  const [receipt, setReceipt] = useState(null)
  const receiptRef = useRef(null)
  const [downloadingBill, setDownloadingBill] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [showCustomerModal, setShowCustomerModal] = useState(false)
  const [customerModalView, setCustomerModalView] = useState('list')
  const [customerQuery, setCustomerQuery] = useState('')
  const [customers, setCustomers] = useState([])
  const [customersLoading, setCustomersLoading] = useState(false)
  const [customerError, setCustomerError] = useState('')
  const [customerSaving, setCustomerSaving] = useState(false)
  const [newCustomerForm, setNewCustomerForm] = useState({ name: '', email: '', phone: '' })

  const [businessInfo, setBusinessInfo] = useState({
    name: 'NexPos',
    address: '',
    phone: '',
    taxId: '',
  })
  const [receiptTexts, setReceiptTexts] = useState({
    header: '',
    footer: '',
  })

  useEffect(() => {
    let cancelled = false
    async function loadTax() {
      try {
        const res = await getSettings()
        if (cancelled) return
        const fromSettings = res?.tax?.appliedTaxRate ?? res?.tax?.defaultTaxRate
        const next = Number(fromSettings)
        setTaxRatePct(Number.isFinite(next) ? next : 8.5)

        setBusinessInfo({
          name: res?.business?.name || 'NexPos',
          address: res?.business?.address || '',
          phone: res?.business?.phone || '',
          taxId: res?.business?.taxId || '',
        })

        setReceiptTexts({
          header: res?.receipts?.receiptHeaderText || 'THANK YOU FOR SHOPPING!',
          footer: res?.receipts?.receiptFooterText || 'Returns accepted in 14 days\nFollow us on IG: @nexpos',
        })
      } catch {
        // keep default
      }
    }
    loadTax()
    return () => {
      cancelled = true
    }
  }, [])

  async function refreshProducts() {
    try {
      const res = await listProducts('')
      const items = res?.items || []
      setProducts(items)
      if (!activeCategory && items.length > 0) setActiveCategory(items[0].category)
    } catch {
      setProducts([])
    }
  }

  useEffect(() => {
    refreshProducts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (activeNav === 'sales') refreshProducts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeNav])

  async function loadCustomers(search = '') {
    setCustomersLoading(true)
    try {
      const res = await listCustomers(search)
      setCustomers(res?.items || [])
    } catch {
      setCustomers([])
    } finally {
      setCustomersLoading(false)
    }
  }

  function openCustomerModal() {
    setCustomerModalView('list')
    setCustomerQuery('')
    setCustomerError('')
    setNewCustomerForm({ name: '', email: '', phone: '' })
    setShowCustomerModal(true)
    loadCustomers('')
  }

  function closeCustomerModal() {
    setShowCustomerModal(false)
    setCustomerError('')
  }

  function selectCustomer(customer) {
    setSelectedCustomer(customer)
    closeCustomerModal()
  }

  function clearSelectedCustomer() {
    setSelectedCustomer(null)
  }

  async function saveNewCustomer() {
    const name = newCustomerForm.name.trim()
    const email = newCustomerForm.email.trim()
    const phone = newCustomerForm.phone.trim()
    if (!name || !email) {
      setCustomerError('Name and email are required.')
      return
    }

    setCustomerSaving(true)
    setCustomerError('')
    try {
      const res = await createCustomer({
        name,
        email,
        phone: phone || null,
        loyaltyPoints: 0,
        totalSpent: 0,
      })
      selectCustomer({
        id: res?.id || email.toLowerCase(),
        name,
        email,
        phone,
        loyaltyPoints: 0,
        totalSpent: 0,
      })
    } catch (err) {
      setCustomerError(err?.message || 'Could not add customer.')
    } finally {
      setCustomerSaving(false)
    }
  }

  useEffect(() => {
    if (!showCustomerModal || customerModalView !== 'list') return undefined
    const timer = window.setTimeout(() => {
      loadCustomers(customerQuery.trim())
    }, 250)
    return () => window.clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showCustomerModal, customerModalView, customerQuery])

  const categories = useMemo(() => {
    const values = Array.from(new Set(products.map((p) => p.category).filter(Boolean)))
    return values.length ? values : ['All']
  }, [products])

  useEffect(() => {
    if (!categories.includes(activeCategory)) {
      setActiveCategory(categories[0] || '')
    }
  }, [categories, activeCategory])

  const visibleProducts = useMemo(() => {
    const q1 = productQuery.trim().toLowerCase()
    const q2 = barcodeQuery.trim().toLowerCase()
    const hasSearch = q1.length > 0 || q2.length > 0

    return products.filter((p) => {
      // When searching, show matches from all categories.
      if (!hasSearch && activeCategory && activeCategory !== 'All' && p.category !== activeCategory) return false
      const matchesName = q1.length === 0 ? true : p.name.toLowerCase().includes(q1)
      const matchesBarcode = q2.length === 0 ? true : p.barcode.toLowerCase().includes(q2) || p.id.toLowerCase().includes(q2)
      return matchesName && matchesBarcode
    })
  }, [products, activeCategory, productQuery, barcodeQuery])

  const cartItems = useMemo(() => {
    const items = []
    for (const [productId, qty] of Object.entries(cart)) {
      if (!qty) continue
      const product = products.find((p) => p.id === productId)
      if (!product) continue
      items.push({ product, qty })
    }
    // Stable order: by insertion order of current product list
    items.sort((a, b) => products.findIndex((p) => p.id === a.product.id) - products.findIndex((p) => p.id === b.product.id))
    return items
  }, [cart, products])

  const subtotal = useMemo(() => {
    return cartItems.reduce((sum, { product, qty }) => sum + product.price * qty, 0)
  }, [cartItems])

  const discountAmount = useMemo(() => {
    if (!appliedDiscount?.active) return 0
    if (appliedDiscount.type === 'percentage') {
      const pct = Number(appliedDiscount.value || 0)
      if (!Number.isFinite(pct) || pct <= 0) return 0
      return subtotal * (pct / 100)
    }
    if (appliedDiscount.type === 'fixed') {
      const fixed = Number(appliedDiscount.value || 0)
      if (!Number.isFinite(fixed) || fixed <= 0) return 0
      return Math.min(subtotal, fixed)
    }
    return 0
  }, [appliedDiscount, subtotal])

  const taxedBase = Math.max(0, subtotal - discountAmount)
  const tax = 0
  const total = taxedBase + tax

  function setQty(productId, nextQty) {
    setCart((prev) => {
      const qty = Math.max(0, nextQty)
      const copy = { ...prev }
      if (qty === 0) delete copy[productId]
      else copy[productId] = qty
      return copy
    })
  }

  function adjust(productId, delta) {
    setCart((prev) => {
      const current = prev[productId] ?? 0
      const next = current + delta
      const product = products.find((p) => p.id === productId)
      const stock = Number(product?.stock ?? 0)
      const copy = { ...prev }
      if (next <= 0) delete copy[productId]
      else copy[productId] = Math.min(next, Math.max(0, stock))
      return copy
    })
  }

  const cashNumber = Number(cashReceived || 0)
  const cashChange = Math.max(0, cashNumber - total)
  const cashShort = Math.max(0, total - cashNumber)
  const canCompleteSale =
    subtotal > 0 &&
    !isCompletingSale &&
    (paymentMethod !== 'cash' || (Number.isFinite(cashNumber) && cashNumber >= total)) &&
    (paymentMethod !== 'card' || cardNumber.trim().length >= 8) &&
    (paymentMethod !== 'mobile' || mobileNumber.trim().length >= 8) &&
    (paymentMethod !== 'online' || onlineAccountNumber.trim().length >= 6)

  function openPaymentModal() {
    setPaymentMethod('cash')
    setCashReceived(total.toFixed(2))
    setCardNumber('')
    setMobileNumber('')
    setOnlineAccountNumber('')
    setCheckoutError('')
    setShowPaymentModal(true)
  }

  function closePaymentModal() {
    if (isCompletingSale) return
    setShowPaymentModal(false)
    setCheckoutError('')
  }

  function decodeJwtPayload(token) {
    try {
      const parts = token.split('.')
      if (parts.length < 2) return null
      const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/')
      const json = atob(payload)
      return JSON.parse(json)
    } catch {
      return null
    }
  }

  function currentUserLabel() {
    try {
      const token = localStorage.getItem('token')
      if (!token) return 'John Admin'
      const payload = decodeJwtPayload(token)
      const email = payload?.email
      const role = payload?.role
      if (email) return role ? `${role} (${email})` : email
    } catch {
      // ignore
    }
    return 'John Admin'
  }

  async function downloadBillPdf(bill) {
    if (!receiptRef.current || !bill) return
    if (downloadingBill) return
    setDownloadingBill(true)
    try {
      const { default: html2canvas } = await import('html2canvas')
      const { jsPDF } = await import('jspdf')
      const canvas = await html2canvas(receiptRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
      })

      const imgData = canvas.toDataURL('image/png')
      const pdfWidth = 80
      const pdfHeight = Math.max((canvas.height * pdfWidth) / canvas.width, 40)
      const pdf = new jsPDF({ unit: 'mm', format: [pdfWidth, pdfHeight] })
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)

      const safeId = bill?.orderId ? String(bill.orderId) : 'unknown'
      pdf.save(`nexpos-bill-${safeId}.pdf`)
    } finally {
      setDownloadingBill(false)
    }
  }

  async function applyDiscountCode() {
    const nextCode = discountCode.trim()
    if (!nextCode) {
      setAppliedDiscount(null)
      return
    }
    try {
      const next = await resolveDiscountByCode(nextCode)
      setAppliedDiscount(next)
      if (!next) setCheckoutError('Invalid discount code')
      else setCheckoutError('')
    } catch {
      setAppliedDiscount(null)
      setCheckoutError('Could not validate discount code')
    }
  }

  async function completeSale() {
    setIsCompletingSale(true)
    setCheckoutError('')
    try {
      const cartSnapshot = cartItems.map(({ product, qty }) => ({
        id: product.id,
        name: product.name,
        qty,
        unitPrice: Number(product.price),
      }))

      const payload = {
        items: cartItems.map(({ product, qty }) => ({ productId: product.id, quantity: qty })),
        customerId: selectedCustomer?.id || null,
        employeeId: user?.id || null,
        discountCode: appliedDiscount?.code || null,
      }
      const res = await checkoutOrder(payload)
      if (!res?.ok) throw new Error(res?.message || 'Checkout failed')

      const orderSubtotal = Number(res.subtotal ?? subtotal)
      const orderDiscountTotal = Number(res.discountTotal ?? discountAmount)
      const orderTaxTotal = Number(res.taxTotal ?? 0)
      const orderNet = orderSubtotal - orderDiscountTotal
      const orderTotal = Number(res.total ?? orderNet + orderTaxTotal)
      const cashNumber = paymentMethod === 'cash' ? Number(cashReceived || 0) : 0
      const cashBalance = paymentMethod === 'cash' ? cashNumber - orderTotal : 0
      const paidAmount = paymentMethod === 'cash' ? cashNumber : orderTotal

      const distDenom = Math.max(orderSubtotal, 0.00001)
      const receiptItems = cartSnapshot.map((it) => {
        const lineAmount = it.unitPrice * it.qty
        const discountLine = orderDiscountTotal > 0 ? (lineAmount / distDenom) * orderDiscountTotal : 0
        const netLine = lineAmount - discountLine
        return {
          ...it,
          lineAmount,
          discountLine,
          netLine,
        }
      })

      const now = new Date()
      const receiptUser = currentUserLabel()

      setReceipt({
        orderId: res.orderId,
        dateTime: now,
        user: receiptUser,
        cashierName: user?.name || 'Cashier',
        customerName: selectedCustomer?.name || 'Walk-in Customer',
        paymentMethod,
        cashAmount: cashNumber,
        paidAmount,
        balance: cashBalance,
        cardNumber: paymentMethod === 'card' ? cardNumber : '',
        mobileNumber: paymentMethod === 'mobile' ? mobileNumber : '',
        onlineAccountNumber: paymentMethod === 'online' ? onlineAccountNumber : '',
        totals: {
          amount: orderSubtotal,
          discount: orderDiscountTotal,
          tax: orderTaxTotal,
          taxRate: taxRatePct,
          netAmount: orderNet,
          totalDue: orderTotal,
        },
        items: receiptItems,
      })

      setCart({})
      setDiscountCode('')
      setAppliedDiscount(null)
      setSelectedCustomer(null)
      setShowPaymentModal(false)
      setShowReceiptModal(true)
      await refreshProducts()
    } catch (err) {
      setCheckoutError(err?.message || 'Checkout failed')
    } finally {
      setIsCompletingSale(false)
    }
  }

  return (
    <div className="pos-root">
      <aside className="pos-sidebar">
        <div className="pos-brand">
          <img className="pos-brand-logo" src="/logo.png" alt="NexPos" />
          <div>
            <div className="pos-brand-title">NexPos</div>
            <div className="pos-brand-subtitle">Wholesale and Retail</div>
          </div>
        </div>

        <nav className="pos-nav" aria-label="Sidebar navigation">
          {visibleNavItems.map((item) => (
            <button
              key={item.id}
              className={`pos-navItem ${activeNav === item.id ? 'active' : ''}`}
              onClick={() => setActiveNav(item.id)}
              type="button"
            >
              <span className="pos-navIcon" aria-hidden="true">
                {NAV_ICONS_BY_ID[item.id]}
              </span>
              <span className="pos-navLabel">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="pos-admin">
          <div className="pos-admin-left">
            <div>
              <div className="pos-admin-name">{user?.name || 'User'}</div>
              <div className="pos-admin-role">{user?.role || 'Cashier'}</div>
            </div>
          </div>
          <button className="pos-admin-logout" type="button" onClick={onLogout}>
            <IconLogout />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {activeNav === 'inventory' ? (
        <main className="pos-main pos-inventoryMain">
          <Inventory />
        </main>
      ) : activeNav === 'products' ? (
        <main className="pos-main pos-inventoryMain">
          <Product />
        </main>
      ) : activeNav === 'customers' ? (
        <main className="pos-main pos-inventoryMain">
          <Customer />
        </main>
      ) : activeNav === 'employees' ? (
        <main className="pos-main pos-inventoryMain">
          <Employees />
        </main>
      ) : activeNav === 'reports' ? (
        <main className="pos-main pos-inventoryMain">
          <Report />
        </main>
      ) : activeNav === 'discounts' ? (
        <main className="pos-main pos-inventoryMain">
          <Discount />
        </main>
      ) : activeNav === 'settings' ? (
        <main className="pos-main pos-inventoryMain">
          <Settings />
        </main>
      ) : (
        <>
          <main className="pos-main">
            <div className="pos-searchBar" role="search" aria-label="Product search">
              <input
                className="pos-searchInput"
                value={productQuery}
                onChange={(e) => setProductQuery(e.target.value)}
                placeholder="Search products..."
                aria-label="Search products"
              />
              <input
                className="pos-searchInput pos-searchInputBarcode"
                value={barcodeQuery}
                onChange={(e) => setBarcodeQuery(e.target.value)}
                placeholder="Search barcode..."
                aria-label="Search barcode"
              />
            </div>

            <div className="pos-categories" role="tablist" aria-label="Product categories">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  className={`pos-pill ${activeCategory === cat ? 'active' : ''}`}
                  onClick={() => setActiveCategory(cat)}
                  role="tab"
                  aria-selected={activeCategory === cat}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="pos-grid" aria-label="Products">
              {visibleProducts.map((p) => {
                const qty = cart[p.id] ?? 0
                const isInCart = qty > 0
                const stock = Number(p.stock ?? 0)
                const isOut = stock <= 0
                return (
                  <button
                    key={p.id}
                    type="button"
                    className={`pos-productCard ${isInCart ? 'inCart' : ''}`}
                    onClick={() => adjust(p.id, 1)}
                    aria-label={`Add ${p.name} to order`}
                    disabled={isOut}
                  >
                    <div className="pos-productName">{p.name}</div>
                    <div className="pos-productBottom">
                      <div className="pos-productPrice">{money(p.price)}</div>
                      {isOut ? (
                        <div className="pos-productQty">Out</div>
                      ) : isInCart ? (
                        <div className="pos-productQty">x{qty}</div>
                      ) : (
                        <div className="pos-productAdd" aria-hidden="true">
                          <span className="pos-productAddSymbol">+</span>
                        </div>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          </main>

          <section className="pos-orderPanel" aria-label="Current order">
            <div className="pos-orderHeader">
              <div>
                <div className="pos-orderTitle">Current Order</div>
                <div className="pos-orderHint">Checkout</div>
              </div>
              <button
                className="pos-clearBtn"
                type="button"
                onClick={() => {
                  setCart({})
                  setDiscountCode('')
                  setAppliedDiscount(null)
                  setSelectedCustomer(null)
                }}
              >
                <IconTrash />
                <span>Clear</span>
              </button>
            </div>

            {selectedCustomer ? (
              <div className="pos-customerRow pos-customerRowSelected">
                <div className="pos-customerText">
                  <div className="pos-customerTitle">{selectedCustomer.name}</div>
                  <div className="pos-customerSub">
                    {selectedCustomer.phone || selectedCustomer.email || 'Customer linked to order'}
                  </div>
                </div>
                <button className="pos-customerChangeBtn" type="button" onClick={openCustomerModal}>
                  Change
                </button>
                <button className="pos-customerRemoveBtn" type="button" onClick={clearSelectedCustomer} aria-label="Remove customer">
                  ×
                </button>
              </div>
            ) : (
              <button className="pos-customerRow pos-customerRowBtn" type="button" onClick={openCustomerModal}>
                <div className="pos-customerText">
                  <div className="pos-customerTitle">Add Customer</div>
                  <div className="pos-customerSub">Optional — search or create</div>
                </div>
              </button>
            )}

            <div className="pos-cartList">
              {cartItems.length === 0 ? (
                <div className="pos-emptyCart">Click products to add them to the order.</div>
              ) : (
                cartItems.map(({ product, qty }) => (
                  <div key={product.id} className="pos-cartRow">
                    <div className="pos-cartMain">
                      <div className="pos-cartName">{product.name}</div>
                      <div className="pos-cartUnit">{money(product.price)} cash</div>
                    </div>
                    <div className="pos-qtyControls">
                      <button
                        className="pos-qtyBtn"
                        type="button"
                        onClick={() => adjust(product.id, -1)}
                        aria-label={`Decrease ${product.name}`}
                      >
                        <IconMinus />
                      </button>
                      <div className="pos-qtyNum" aria-label={`Quantity ${qty}`}>
                        {qty}
                      </div>
                      <button
                        className="pos-qtyBtn"
                        type="button"
                        onClick={() => adjust(product.id, 1)}
                        aria-label={`Increase ${product.name}`}
                      >
                        <IconPlus />
                      </button>
                    </div>
                    <div className="pos-cartTotal">{money(product.price * qty)}</div>
                  </div>
                ))
              )}
            </div>

            <div className="pos-divider" />

            <div className="pos-discountBlock">
              <div className="pos-fieldLabel">Discount code</div>
              <div className="pos-discountRow">
                <input
                  className="pos-input"
                  value={discountCode}
                  onChange={(e) => setDiscountCode(e.target.value)}
                  placeholder="Discount code"
                  aria-label="Discount code"
                />
                <button
                  className="pos-applyBtn"
                  type="button"
                  onClick={applyDiscountCode}
                  disabled={cartItems.length === 0}
                >
                  <IconTag />
                  <span>Apply</span>
                </button>
              </div>
            </div>

            <div className="pos-summary">
              <div className="pos-summaryRow">
                <div className="pos-summaryLabel">Subtotal</div>
                <div className="pos-summaryValue">{money(subtotal)}</div>
              </div>
              <div className="pos-summaryRow">
                <div className="pos-summaryLabel">Discount</div>
                <div className="pos-summaryValue">
                  {discountAmount > 0 ? `-${money(discountAmount)}` : money(0)}
                </div>
              </div>
              <div className="pos-summaryRow pos-summaryTotal">
                <div className="pos-summaryLabel">Total</div>
                <div className="pos-summaryValue pos-summaryValueTotal">{money(total)}</div>
              </div>
            </div>

            <button
              className="pos-checkoutBtn"
              type="button"
              disabled={subtotal <= 0}
              onClick={openPaymentModal}
            >
              <IconCard />
              <span>Checkout {money(total)}</span>
            </button>
          </section>

          {showPaymentModal ? (
            <div className="pos-payBackdrop" role="dialog" aria-modal="true" aria-label="Complete Payment">
              <div className="pos-payModal">
                <button className="pos-payClose" type="button" onClick={closePaymentModal} aria-label="Close payment dialog">
                  ×
                </button>

                <div className="pos-payTitle">Complete Payment</div>
                <div className="pos-paySub">Amount Due</div>
                <div className="pos-payAmount">{money(total)}</div>

                <div className="pos-payMethods">
                  {[
                    { id: 'cash', label: 'Cash' },
                    { id: 'card', label: 'Card' },
                    { id: 'mobile', label: 'Mobile' },
                    { id: 'online', label: 'Online' },
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      className={`pos-payMethod ${paymentMethod === m.id ? 'active' : ''}`}
                      onClick={() => setPaymentMethod(m.id)}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>

                {paymentMethod === 'cash' ? (
                  <>
                    <div className="pos-payLabel">Cash Amount</div>
                    <div className="pos-payInputRow">
                      <span className="pos-payInputPrefix">Rs.</span>
                      <input
                        className="pos-payInput"
                        value={cashReceived}
                        onChange={(e) => setCashReceived(e.target.value.replace(/[^0-9.]/g, ''))}
                        inputMode="decimal"
                        placeholder="Enter cash amount"
                        aria-label="Cash amount"
                      />
                      <button
                        type="button"
                        className="pos-payExactBtn"
                        onClick={() => setCashReceived(total.toFixed(2))}
                      >
                        Exact
                      </button>
                    </div>
                    <div className="pos-payMeta">
                      <div className="pos-payMetaRow">
                        <span>Change</span>
                        <strong>{money(cashChange)}</strong>
                      </div>
                      {cashShort > 0 ? (
                        <div className="pos-payMetaWarn">Need {money(cashShort)} more to complete cash payment.</div>
                      ) : null}
                    </div>
                  </>
                ) : null}

                {paymentMethod === 'card' ? (
                  <>
                    <div className="pos-payLabel">Card Number</div>
                    <input
                      className="pos-payInput"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      inputMode="numeric"
                      placeholder="Enter card number"
                      aria-label="Card number"
                    />
                  </>
                ) : null}

                {paymentMethod === 'mobile' ? (
                  <>
                    <div className="pos-payLabel">Mobile Number</div>
                    <input
                      className="pos-payInput"
                      value={mobileNumber}
                      onChange={(e) => setMobileNumber(e.target.value)}
                      inputMode="tel"
                      placeholder="Enter mobile number"
                      aria-label="Mobile number"
                    />
                  </>
                ) : null}

                {paymentMethod === 'online' ? (
                  <>
                    <div className="pos-payLabel">Account Number</div>
                    <input
                      className="pos-payInput"
                      value={onlineAccountNumber}
                      onChange={(e) => setOnlineAccountNumber(e.target.value)}
                      inputMode="numeric"
                      placeholder="Enter account number"
                      aria-label="Account number"
                    />
                  </>
                ) : null}

                {checkoutError ? <div className="pos-payError">{checkoutError}</div> : null}

                <button className="pos-payComplete" type="button" disabled={!canCompleteSale} onClick={completeSale}>
                  {isCompletingSale ? 'Processing...' : 'Complete Sale'}
                </button>
              </div>
            </div>
          ) : null}

          {showCustomerModal ? (
            <div className="pos-payBackdrop" role="dialog" aria-modal="true" aria-label="Add customer">
              <div className="pos-customerModal">
                <button className="pos-payClose" type="button" onClick={closeCustomerModal} aria-label="Close customer dialog">
                  ×
                </button>

                <div className="pos-customerModalTitle">
                  {customerModalView === 'add' ? 'Add New Customer' : 'Select Customer'}
                </div>

                {customerModalView === 'list' ? (
                  <>
                    <input
                      className="pos-input pos-customerSearch"
                      value={customerQuery}
                      onChange={(e) => setCustomerQuery(e.target.value)}
                      placeholder="Search by name, email, or phone..."
                      aria-label="Search customers"
                    />

                    <div className="pos-customerList">
                      {customersLoading ? (
                        <div className="pos-customerListEmpty">Loading customers...</div>
                      ) : customers.length === 0 ? (
                        <div className="pos-customerListEmpty">No customers found.</div>
                      ) : (
                        customers.map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            className="pos-customerListItem"
                            onClick={() => selectCustomer(c)}
                          >
                            <div className="pos-customerListName">{c.name}</div>
                            <div className="pos-customerListMeta">
                              {c.email}{c.phone ? ` · ${c.phone}` : ''}
                            </div>
                          </button>
                        ))
                      )}
                    </div>

                    <button
                      className="pos-customerAddNewBtn"
                      type="button"
                      onClick={() => {
                        setCustomerModalView('add')
                        setCustomerError('')
                      }}
                    >
                      + Add New Customer
                    </button>
                  </>
                ) : (
                  <>
                    <div className="pos-customerForm">
                      <label className="pos-customerField">
                        <span>Full name</span>
                        <input
                          className="pos-input"
                          value={newCustomerForm.name}
                          onChange={(e) => setNewCustomerForm((p) => ({ ...p, name: e.target.value }))}
                          placeholder="Customer name"
                        />
                      </label>
                      <label className="pos-customerField">
                        <span>Email</span>
                        <input
                          className="pos-input"
                          value={newCustomerForm.email}
                          onChange={(e) => setNewCustomerForm((p) => ({ ...p, email: e.target.value }))}
                          placeholder="email@example.com"
                        />
                      </label>
                      <label className="pos-customerField">
                        <span>Phone</span>
                        <input
                          className="pos-input"
                          value={newCustomerForm.phone}
                          onChange={(e) => setNewCustomerForm((p) => ({ ...p, phone: e.target.value }))}
                          placeholder="Phone number (optional)"
                        />
                      </label>
                    </div>

                    {customerError ? <div className="pos-payError">{customerError}</div> : null}

                    <div className="pos-customerModalActions">
                      <button
                        className="pos-customerSecondaryBtn"
                        type="button"
                        onClick={() => {
                          setCustomerModalView('list')
                          setCustomerError('')
                        }}
                      >
                        Back
                      </button>
                      <button
                        className="pos-customerPrimaryBtn"
                        type="button"
                        onClick={saveNewCustomer}
                        disabled={customerSaving}
                      >
                        {customerSaving ? 'Saving...' : 'Save Customer'}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          ) : null}

          {showReceiptModal ? (
            <div className="pos-receiptBackdrop" role="dialog" aria-modal="true" aria-label="Receipt">
              <div className="pos-receiptModal">
                <div className="pos-receiptActions pos-receiptHideOnPrint">
                  <button
                    className="pos-receiptBtn"
                    type="button"
                    onClick={() => downloadBillPdf(receipt)}
                    disabled={!receipt || downloadingBill}
                  >
                    {downloadingBill ? 'Downloading...' : 'Download PDF'}
                  </button>
                  <button
                    className="pos-receiptBtn pos-receiptBtnPrimary"
                    type="button"
                    onClick={() => window.print()}
                    disabled={!receipt}
                  >
                    Print
                  </button>
                  <button
                    className="pos-receiptClose"
                    type="button"
                    onClick={() => {
                      setShowReceiptModal(false)
                      setReceipt(null)
                    }}
                    aria-label="Close receipt"
                  >
                    ×
                  </button>
                </div>

                <div className="pos-receiptPrintArea" ref={receiptRef}>
                  <div className="pos-receiptTicket">
                    <div className="pos-rcptLogoWrap">
                      <img className="pos-rcptLogo" src="/logo.png" alt="NexPos" />
                    </div>

                    <div className="pos-rcptStoreName">{businessInfo.name || 'NexPos'}</div>
                    {businessInfo.address ? <div className="pos-rcptCenter">{businessInfo.address}</div> : null}
                    {businessInfo.phone ? <div className="pos-rcptCenter">Tel: {businessInfo.phone}</div> : null}
                    {businessInfo.taxId ? <div className="pos-rcptCenter">Tax ID: {businessInfo.taxId}</div> : null}

                    <div className="pos-rcptSpacer" />

                    <div className="pos-rcptMetaGrid">
                      <div className="pos-rcptMetaLine">
                        <span>Date: {formatReceiptDate(receipt?.dateTime)}</span>
                        <span>Time: {formatReceiptTime(receipt?.dateTime)}</span>
                      </div>
                      <div className="pos-rcptMetaLine">
                        <span>Bill No: {formatBillNo(receipt?.orderId)}</span>
                        <span>Cashier: {receipt?.cashierName || ''}</span>
                      </div>
                      <div className="pos-rcptMetaFull">Customer: {receipt?.customerName || 'Walk-in Customer'}</div>
                    </div>

                    <div className="pos-rcptRuleLight" />

                    <table className="pos-rcptTable" role="table" aria-label="Receipt items">
                      <thead>
                        <tr>
                          <th>ITEM</th>
                          <th>QTY</th>
                          <th>PRICE</th>
                          <th>TOTAL</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(receipt?.items || []).map((it) => (
                          <tr key={it.id}>
                            <td className="pos-rcptItemName">{truncateText(it.name, 16)}</td>
                            <td>{it.qty}</td>
                            <td>{receiptAmount(it.unitPrice)}</td>
                            <td>{receiptAmount(it.lineAmount || it.unitPrice * it.qty)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    <div className="pos-rcptRuleLight" />

                    <div className="pos-rcptSummary">
                      <div className="pos-rcptSummaryRow">
                        <span>SUBTOTAL:</span>
                        <span>{money(receipt?.totals?.amount || 0)}</span>
                      </div>
                      <div className="pos-rcptSummaryRow">
                        <span>TAX/VAT ({receipt?.totals?.taxRate || 0}%):</span>
                        <span>{money(receipt?.totals?.tax || 0)}</span>
                      </div>
                      <div className="pos-rcptSummaryRow">
                        <span>DISCOUNT:</span>
                        <span>-{money(receipt?.totals?.discount || 0)}</span>
                      </div>
                    </div>

                    <div className="pos-rcptRuleLight" />

                    <div className="pos-rcptGrandTotal">
                      <span>GRAND TOTAL:</span>
                      <strong>{money(receipt?.totals?.totalDue || 0)}</strong>
                    </div>

                    <div className="pos-rcptRuleLight" />

                    <div className="pos-rcptPayment">
                      <div className="pos-rcptPaymentLine">Payment Method: {formatPaymentLabel(receipt)}</div>
                      <div className="pos-rcptSummaryRow">
                        <span>Paid Amount:</span>
                        <span>{money(receipt?.paidAmount || 0)}</span>
                      </div>
                      <div className="pos-rcptSummaryRow">
                        <span>Change:</span>
                        <span>{money(receipt?.balance || 0)}</span>
                      </div>
                    </div>

                    <div className="pos-rcptSpacer" />

                    {receiptTexts.header ? <div className="pos-rcptFooterMsg">{receiptTexts.header}</div> : null}
                    {receiptTexts.footer ? <div className="pos-rcptFooterMsg">{receiptTexts.footer}</div> : null}

                    <div className="pos-rcptSpacer" />

                    <div className="pos-rcptQrPlaceholder">[ QR CODE ]</div>
                    <div className="pos-rcptQrHint">Scan to view e-receipt online</div>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </>
      )}
    </div>
  )
}


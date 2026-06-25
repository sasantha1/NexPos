import { useEffect, useMemo, useRef, useState } from 'react'
import './Report.css'
import { getReportsSummary, getZReport } from './api/reportsApi'
import { getSettings } from './api/settingsApi'
import { getInventoryItems, getInventoryStats } from './api/inventoryApi'

function money(amount) {
  return `Rs. ${amount.toFixed(2)}`
}

function IconDollar() {
  return (
    <svg className="rep-cardIcon" viewBox="0 0 24 24" aria-hidden="true">
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

function IconCart() {
  return (
    <svg className="rep-cardIcon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6 6h15l-1.5 9h-13z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M6 6l-2-2" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="9" cy="20" r="1" fill="none" stroke="currentColor" strokeWidth="2" />
      <circle cx="18" cy="20" r="1" fill="none" stroke="currentColor" strokeWidth="2" />
    </svg>
  )
}

function IconChartUp() {
  return (
    <svg className="rep-cardIcon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3 3v18h18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M7 14l4-4 3 3 5-7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function IconUsers() {
  return (
    <svg className="rep-cardIcon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M8.5 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M22 21v-2a3 3 0 0 0-2.2-2.9" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M16.8 3.1a4 4 0 0 1 0 7.8" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function RevenueTrendCard({ points, labels }) {
  const safePoints = Array.isArray(points) && points.length >= 2 ? points : [0, 0, 0, 0, 0, 0, 0]
  const safeXLabels = Array.isArray(labels) && labels.length === safePoints.length ? labels : safePoints.map(() => '')

  const w = 640
  const h = 230
  const padLeft = 42
  const padTop = 22
  const padRight = 18
  const padBottom = 34

  const max = Math.max(...safePoints, 200)
  const min = Math.min(...safePoints, 0)

  const plotW = w - padLeft - padRight
  const plotH = h - padTop - padBottom

  const xFor = (i) => padLeft + (plotW * i) / (safePoints.length - 1 || 1)
  const yFor = (v) => padTop + (plotH - ((v - min) * plotH) / (max - min || 1))

  const d = safePoints
    .map((v, i) => {
      const x = xFor(i)
      const y = yFor(v)
      return `${i === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`
    })
    .join(' ')

  const areaD = `${d} L ${xFor(safePoints.length - 1).toFixed(2)} ${padTop + plotH} L ${xFor(0).toFixed(2)} ${padTop + plotH} Z`

  const yTicks = [0, Math.round(max * 0.35), Math.round(max * 0.7), max]
  const yTickLabels = yTicks.map((t) => t.toLocaleString())

  return (
    <div className="rep-chartCard">
      <div className="rep-chartHeader">
        <div>
          <div className="rep-chartTitle">Revenue Trend</div>
          <div className="rep-chartSubtitle">Daily sales over the selected period</div>
        </div>
      </div>

      <svg className="rep-lineChart" viewBox={`0 0 ${w} ${h}`} role="img" aria-label="Revenue trend chart">
        <defs>
          <linearGradient id="repArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(34,197,94,0.35)" />
            <stop offset="100%" stopColor="rgba(34,197,94,0.03)" />
          </linearGradient>
          <linearGradient id="repLine" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="rgba(34,197,94,0.95)" />
            <stop offset="100%" stopColor="rgba(99,102,241,0.75)" />
          </linearGradient>
        </defs>

        {yTicks.map((t, i) => {
          const y = yFor(t)
          return (
            <g key={t}>
              <line x1={padLeft} x2={w - padRight} y1={y} y2={y} stroke="rgba(255,255,255,0.08)" strokeDasharray="4 6" />
              <text x={padLeft - 12} y={y + 4} textAnchor="end" fill="rgba(255,255,255,0.55)" fontSize="11" fontWeight="800">
                {yTickLabels[i]}
              </text>
            </g>
          )
        })}

        <path d={areaD} fill="url(#repArea)" />
        <path d={d} fill="none" stroke="url(#repLine)" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />

        {safePoints.map((v, i) => {
          const x = xFor(i)
          const y = yFor(v)
          return (
            <g key={`${i}-${v}`}>
              <circle cx={x} cy={y} r="4.6" fill="rgba(34,197,94,0.95)" stroke="rgba(0,0,0,0.2)" strokeWidth="2" />
            </g>
          )
        })}

        {/* X labels */}
        {safePoints.map((_, i) => {
          const x = xFor(i)
          const label = safeXLabels[i] ?? ''
          return (
            <text key={`x-${i}`} x={x} y={h - 12} textAnchor="middle" fill="rgba(255,255,255,0.55)" fontSize="11" fontWeight="800">
              {label}
            </text>
          )
        })}
      </svg>
    </div>
  )
}

function SalesByCategoryCard({ segments, totalRevenue }) {
  const palette = ['#22c55e', '#a78bfa', '#60a5fa', '#f59e0b', '#ef4444', '#14b8a6']
  const safeSegments = Array.isArray(segments) && segments.length ? segments : []
  const total = safeSegments.reduce((s, a) => s + (Number(a.value) || 0), 0) || 100
  const radius = 70
  const circumference = 2 * Math.PI * radius
  const startOffsetBase = circumference * 0.25

  let acc = 0
  return (
    <div className="rep-chartCard">
      <div className="rep-chartHeader">
        <div>
          <div className="rep-chartTitle">Sales by Category</div>
          <div className="rep-chartSubtitle">Inventory value distribution</div>
        </div>
      </div>

      <div className="rep-donutRow">
        <svg className="rep-donut" viewBox="0 0 220 220" role="img" aria-label="Sales by category donut chart">
          <defs>
            <filter id="repGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="3.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <circle cx="110" cy="110" r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="20" />

          {safeSegments.map((seg, idx) => {
            const value = Number(seg.value) || 0
            const color = seg.color || palette[idx % palette.length]
            const len = (value / total) * circumference
            const dashOffset = startOffsetBase + (circumference - acc * (circumference / total))
            acc += value
            return (
              <circle
                key={seg.label}
                cx="110"
                cy="110"
                r={radius}
                fill="none"
                stroke={color}
                strokeWidth="20"
                strokeLinecap="round"
                strokeDasharray={`${len} ${circumference - len}`}
                strokeDashoffset={-dashOffset}
                filter="url(#repGlow)"
              />
            )
          })}

          {/* Center hole */}
          <circle cx="110" cy="110" r="38" fill="#0b0f15" stroke="rgba(255,255,255,0.05)" strokeWidth="2" />

          <text x="110" y="106" textAnchor="middle" fill="rgba(255,255,255,0.75)" fontSize="12" fontWeight="900">
            Total
          </text>
          <text x="110" y="132" textAnchor="middle" fill="rgba(255,255,255,0.95)" fontSize="18" fontWeight="1000">
            {totalRevenue ? `Rs. ${Math.round(totalRevenue).toLocaleString()}` : '—'}
          </text>
        </svg>

        <div className="rep-legend">
          {safeSegments.map((seg, idx) => (
            <div key={seg.label} className="rep-legendRow">
              <span
                className="rep-legendDot"
                style={{ background: seg.color || palette[idx % palette.length] }}
                aria-hidden="true"
              />
              <span className="rep-legendLabel">{seg.label}</span>
              <span className="rep-legendValue">{seg.value}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function InventorySummaryCard({ stats }) {
  const s = stats || {}
  return (
    <div className="rep-chartCard">
      <div className="rep-chartHeader">
        <div>
          <div className="rep-chartTitle">Inventory Summary</div>
        </div>
      </div>
      <div className="rep-invSummary">
        <div className="rep-invRow"><span>Total Products</span><strong>{s.totalProducts ?? 0}</strong></div>
        <div className="rep-invRow"><span>Total Units in Stock</span><strong>{s.totalUnitsInStock ?? 0}</strong></div>
        <div className="rep-invRow"><span>Low Stock Items</span><strong>{s.lowStockItems ?? 0}</strong></div>
        <div className="rep-invRow"><span>Out of Stock</span><strong className="rep-invDanger">{s.outOfStock ?? 0}</strong></div>
      </div>
    </div>
  )
}

function CategoryDistributionCard({ items }) {
  const totals = new Map()
  for (const item of items || []) {
    const category = item.category || 'Other'
    const value = Number(item.stock || 0) * Number(item.price || 0)
    totals.set(category, (totals.get(category) || 0) + value)
  }

  const rows = Array.from(totals.entries())
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5)

  const total = rows.reduce((s, r) => s + r.value, 0) || 1
  const palette = ['#34d399', '#6366f1', '#60a5fa', '#f59e0b', '#ef4444']
  const radius = 82
  const c = 2 * Math.PI * radius
  let acc = 0

  return (
    <div className="rep-chartCard">
      <div className="rep-chartHeader">
        <div>
          <div className="rep-chartTitle">Category Distribution</div>
        </div>
      </div>
      <div className="rep-donutOnly">
        <svg className="rep-donutLg" viewBox="0 0 280 280" role="img" aria-label="Category distribution">
          <circle cx="140" cy="140" r={radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="26" />
          {rows.map((row, idx) => {
            const len = (row.value / total) * c
            const offset = c - acc
            acc += len
            return (
              <circle
                key={row.label}
                cx="140"
                cy="140"
                r={radius}
                fill="none"
                stroke={palette[idx % palette.length]}
                strokeWidth="26"
                strokeLinecap="butt"
                strokeDasharray={`${len} ${c - len}`}
                strokeDashoffset={offset}
                transform="rotate(-90 140 140)"
              />
            )
          })}
        </svg>
        <div className="rep-miniLegend">
          {rows.map((r, i) => (
            <div key={r.label} className="rep-miniLegendRow">
              <span className="rep-legendDot" style={{ background: palette[i % palette.length] }} />
              <span>{r.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function TopProductsByStockValueCard({ items }) {
  const rows = (items || [])
    .map((x) => ({
      id: x.id,
      name: x.name,
      value: Number(x.stock || 0) * Number(x.price || 0),
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5)

  const max = Math.max(...rows.map((r) => r.value), 1)

  return (
    <div className="rep-chartCard rep-full">
      <div className="rep-chartHeader">
        <div>
          <div className="rep-chartTitle">Top Products by Stock Value</div>
          <div className="rep-chartSubtitle">Products with highest inventory value</div>
        </div>
      </div>
      <div className="rep-bars">
        {rows.map((r) => (
          <div key={r.id} className="rep-barRow">
            <div className="rep-barLabel">{r.name}</div>
            <div className="rep-barTrack">
              <div className="rep-barFill" style={{ width: `${(r.value / max) * 100}%` }} />
            </div>
            <div className="rep-barValue">{money(r.value)}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10)
}

function ZReportTemplate({ data, loading, storeName }) {
  if (loading) {
    return (
      <div className="zrep-ticket">
        <div className="zrep-center">Loading daily summary...</div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="zrep-ticket">
        <div className="zrep-center">No Z-Report data available.</div>
      </div>
    )
  }

  const fin = data.financial || {}
  const tender = data.tender || {}

  return (
    <div className="zrep-ticket">
      <div className="zrep-ruleHeavy" />
      <div className="zrep-title">DAILY SUMMARY REPORT (Z-REPORT)</div>
      <div className="zrep-ruleHeavy" />

      <div className="zrep-metaLine">
        <span>Store: {storeName || 'NexPos'}</span>
        <span>ID: {data.storeId || '#0001'}</span>
      </div>
      <div className="zrep-metaLine">
        <span>Date: {data.date}</span>
        <span>Register: {data.register || 'POS-01'}</span>
      </div>
      <div className="zrep-metaFull">Session: {data.sessionStart || '—'} - {data.sessionEnd || '—'}</div>

      <div className="zrep-ruleLight" />
      <div className="zrep-sectionTitle">FINANCIAL SUMMARY</div>
      <div className="zrep-ruleLight" />

      <div className="zrep-row">
        <span>Gross Sales:</span>
        <span>{money(fin.grossSales)}</span>
      </div>
      <div className="zrep-row">
        <span>(-) Total Discounts:</span>
        <span>-{money(fin.totalDiscounts)}</span>
      </div>
      <div className="zrep-row">
        <span>(-) Total Refunds:</span>
        <span>-{money(fin.totalRefunds)}</span>
      </div>
      <div className="zrep-row">
        <span>Net Revenue:</span>
        <span>{money(fin.netRevenue)}</span>
      </div>
      <div className="zrep-row">
        <span>(+) Tax Collected ({fin.taxRate || 0}%):</span>
        <span>{money(fin.taxCollected)}</span>
      </div>

      <div className="zrep-ruleHeavy" />
      <div className="zrep-row zrep-rowTotal">
        <span>TOTAL COLLECTED:</span>
        <strong>{money(fin.totalCollected)}</strong>
      </div>
      <div className="zrep-ruleLight" />

      <div className="zrep-sectionTitle">TENDER RECONCILIATION</div>
      <div className="zrep-ruleLight" />

      <div className="zrep-tenderRow">
        <span>Cash Expected:</span>
        <span>{money(tender.cash?.expected)} | Actual: {money(tender.cash?.actual)}</span>
      </div>
      <div className="zrep-tenderRow">
        <span>Visa/Mastercard:</span>
        <span>{money(tender.card?.expected)} | Actual: {money(tender.card?.actual)}</span>
      </div>
      <div className="zrep-tenderRow">
        <span>Mobile Wallet:</span>
        <span>{money(tender.mobile?.expected)} | Actual: {money(tender.mobile?.actual)}</span>
      </div>
      <div className="zrep-row">
        <span>Discrepancy (Short/Over):</span>
        <span>{money(tender.discrepancy)}</span>
      </div>

      <div className="zrep-ruleLight" />
      <div className="zrep-sectionTitle">LABOR PERFORMANCE</div>
      <div className="zrep-ruleLight" />

      {(data.labor || []).length === 0 ? (
        <div className="zrep-center">No cashier activity recorded.</div>
      ) : (
        (data.labor || []).map((row) => (
          <div key={`${row.name}-${row.transactions}`} className="zrep-laborRow">
            Cashier: {row.name} &nbsp;&nbsp; Transactions: {row.transactions} &nbsp; Total: {money(row.total)}
          </div>
        ))
      )}

      <div className="zrep-ruleLight" />
      <div className="zrep-sectionTitle">TOP PERFORMING CATEGORIES</div>
      <div className="zrep-ruleLight" />

      {(data.topCategories || []).length === 0 ? (
        <div className="zrep-center">No category sales recorded.</div>
      ) : (
        (data.topCategories || []).map((row) => (
          <div key={row.category} className="zrep-categoryRow">
            {row.rank}. {row.category} &nbsp;&nbsp; Qty: {row.qty} &nbsp;&nbsp; Gross: {money(row.gross)}
          </div>
        ))
      )}

      <div className="zrep-spacer" />
    </div>
  )
}

export default function Report() {
  const [range, setRange] = useState('Last 7 days')
  const [activeTab, setActiveTab] = useState('Sales Overview')
  const [loading, setLoading] = useState(true)
  const [report, setReport] = useState(null)
  const [inventoryItems, setInventoryItems] = useState([])
  const [inventoryStats, setInventoryStats] = useState(null)
  const [downloading, setDownloading] = useState(false)
  const [zReport, setZReport] = useState(null)
  const [zReportLoading, setZReportLoading] = useState(false)
  const [zReportDate, setZReportDate] = useState(todayIsoDate())
  const [storeName, setStoreName] = useState('NexPos')
  const exportRef = useRef(null)
  const zReportRef = useRef(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      try {
        const res = await getReportsSummary(range)
        if (cancelled) return
        setReport(res)
      } catch {
        if (cancelled) return
        setReport(null)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [range])

  useEffect(() => {
    let cancelled = false
    async function loadInventory() {
      try {
        const [itemsRes, statsRes] = await Promise.all([getInventoryItems(''), getInventoryStats()])
        if (cancelled) return
        const items = itemsRes?.items || []
        const totalUnitsInStock = items.reduce((s, it) => s + Number(it.stock || 0), 0)
        setInventoryItems(items)
        setInventoryStats({
          totalProducts: Number(statsRes?.totalProducts || 0),
          lowStockItems: Number(statsRes?.lowStockItems || 0),
          outOfStock: Number(statsRes?.outOfStock || 0),
          totalUnitsInStock,
        })
      } catch {
        if (cancelled) return
        setInventoryItems([])
        setInventoryStats({ totalProducts: 0, lowStockItems: 0, outOfStock: 0, totalUnitsInStock: 0 })
      }
    }
    loadInventory()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    async function loadSettings() {
      try {
        const settings = await getSettings()
        if (cancelled) return
        setStoreName(settings?.business?.name || 'NexPos')
      } catch {
        if (!cancelled) setStoreName('NexPos')
      }
    }
    loadSettings()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (activeTab !== 'Daily Z-Report') return undefined
    let cancelled = false
    async function loadZReport() {
      setZReportLoading(true)
      try {
        const res = await getZReport(zReportDate)
        if (cancelled) return
        setZReport(res)
      } catch {
        if (cancelled) return
        setZReport(null)
      } finally {
        if (!cancelled) setZReportLoading(false)
      }
    }
    loadZReport()
    return () => {
      cancelled = true
    }
  }, [activeTab, zReportDate])

  const statCards = useMemo(() => {
    const s = report?.stats
    if (!s) {
      return [
        { label: 'Total Revenue', value: loading ? 'Loading…' : '—', delta: '', tone: 'inc', icon: <IconDollar /> },
        { label: 'Transactions', value: loading ? 'Loading…' : '—', delta: '', tone: 'inc', icon: <IconCart /> },
        { label: 'Avg Order Value', value: loading ? 'Loading…' : '—', delta: '', tone: 'inc', icon: <IconChartUp /> },
        { label: 'Total Customers', value: loading ? 'Loading…' : '—', delta: '', tone: 'inc', icon: <IconUsers /> },
      ]
    }

    return [
      { label: 'Total Revenue', value: money(s.totalRevenue), delta: '', tone: 'inc', icon: <IconDollar /> },
      { label: 'Transactions', value: String(s.transactions), delta: '', tone: 'inc', icon: <IconCart /> },
      { label: 'Avg Order Value', value: money(s.avgOrderValue), delta: '', tone: 'inc', icon: <IconChartUp /> },
      { label: 'Total Customers', value: String(s.totalCustomers), delta: '', tone: 'inc', icon: <IconUsers /> },
    ]
  }, [report, loading])

  async function downloadPdf() {
    const isZReport = activeTab === 'Daily Z-Report'
    const target = isZReport ? zReportRef.current : exportRef.current
    if (!target || downloading) return
    setDownloading(true)
    try {
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import('html2canvas'),
        import('jspdf'),
      ])

      const canvas = await html2canvas(target, {
        scale: 2,
        useCORS: true,
        backgroundColor: isZReport ? '#ffffff' : '#0b0f15',
      })

      const imgData = canvas.toDataURL('image/png')

      if (isZReport) {
        const pdfWidth = 80
        const pdfHeight = Math.max((canvas.height * pdfWidth) / canvas.width, 40)
        const pdf = new jsPDF({ unit: 'mm', format: [pdfWidth, pdfHeight] })
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)
        pdf.save(`nexpos-z-report-${zReportDate}.pdf`)
        return
      }

      const pdf = new jsPDF('p', 'mm', 'a4')

      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      const imgWidth = pageWidth
      const imgHeight = (canvas.height * imgWidth) / canvas.width

      let heightLeft = imgHeight
      let position = 0
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight

      while (heightLeft > 0) {
        position = heightLeft - imgHeight
        pdf.addPage()
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
        heightLeft -= pageHeight
      }

      const safeTab = activeTab.toLowerCase().replace(/\s+/g, '-')
      pdf.save(`nexpos-report-${safeTab}.pdf`)
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="rep-page" ref={exportRef}>
      <div className="rep-header">
        <div>
          <div className="rep-title">Reports & Analytics</div>
          <div className="rep-subtitle">Track your business performance</div>
        </div>

        <div className="rep-headActions">
          {activeTab === 'Daily Z-Report' ? (
            <input
              type="date"
              className="rep-dateInput"
              value={zReportDate}
              onChange={(e) => setZReportDate(e.target.value)}
              aria-label="Z-Report date"
            />
          ) : (
            <div className="rep-range">
              <label className="rep-rangeLabel" htmlFor="repRange">
                Last 7 days
              </label>
              <select id="repRange" className="rep-select" value={range} onChange={(e) => setRange(e.target.value)} aria-label="Select date range">
                <option>Last 7 days</option>
                <option>Last 30 days</option>
                <option>Last 90 days</option>
              </select>
            </div>
          )}
          <button className="rep-downloadBtn" type="button" onClick={downloadPdf} disabled={downloading || (activeTab === 'Daily Z-Report' && zReportLoading)}>
            {downloading ? 'Generating...' : activeTab === 'Daily Z-Report' ? 'Download Z-Report' : 'Download PDF'}
          </button>
        </div>
      </div>

      {activeTab !== 'Daily Z-Report' ? (
        <div className="rep-statsRow">
          {statCards.map((c) => (
            <div key={c.label} className="rep-stat">
              <div className="rep-statTop">
                <div className="rep-statLabel">{c.label}</div>
                <div className="rep-statIcon">{c.icon}</div>
              </div>
              <div className="rep-statValue">{c.value}</div>
              <div className={`rep-delta rep-delta-${c.tone}`}>{c.delta} <span className="rep-deltaSub">from last period</span></div>
            </div>
          ))}
        </div>
      ) : null}

      <div className="rep-tabs" role="tablist" aria-label="Reports tabs">
        {['Sales Overview', 'Product Performance', 'Employee Performance', 'Daily Z-Report'].map((t) => (
          <button
            key={t}
            type="button"
            className={`rep-tab ${activeTab === t ? 'active' : ''}`}
            onClick={() => setActiveTab(t)}
            role="tab"
            aria-selected={activeTab === t}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="rep-chartsGrid">
        {activeTab === 'Daily Z-Report' ? (
          <div className="zrep-wrap" ref={zReportRef}>
            <ZReportTemplate data={zReport} loading={zReportLoading} storeName={zReport?.storeName || storeName} />
          </div>
        ) : activeTab === 'Sales Overview' ? (
          <>
            <RevenueTrendCard points={report?.trend?.points} labels={report?.trend?.labels} />
            <SalesByCategoryCard segments={report?.salesByCategory} totalRevenue={report?.stats?.totalRevenue} />
          </>
        ) : activeTab === 'Product Performance' ? (
          <>
            <InventorySummaryCard stats={inventoryStats} />
            <CategoryDistributionCard items={inventoryItems} />
            <TopProductsByStockValueCard items={inventoryItems} />
          </>
        ) : (
          <>
            <RevenueTrendCard points={report?.trend?.points} labels={report?.trend?.labels} />
            <SalesByCategoryCard segments={report?.salesByCategory} totalRevenue={report?.stats?.totalRevenue} />
          </>
        )}
      </div>
    </div>
  )
}


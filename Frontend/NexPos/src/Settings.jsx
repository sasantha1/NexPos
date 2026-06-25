import { useEffect, useMemo, useState } from 'react'
import './Settings.css'
import { getSettings, updateSettings } from './api/settingsApi'

function IconGear() {
  return (
    <svg className="set-cardIcon" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.65 1.65 0 0 0 15 19.4a1.65 1.65 0 0 0-1.51 1V22a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1.51-1 1.65 1.65 0 0 0-1.82.33l-.06.06A2 2 0 1 1 3.6 18.3l.06-.06A1.65 1.65 0 0 0 4 16.42a1.65 1.65 0 0 0-1.51-1H2a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06A2 2 0 1 1 5.99 3.6l.06.06A1.65 1.65 0 0 0 7.87 4a1.65 1.65 0 0 0 1-1.51V2a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06A2 2 0 1 1 20.4 5.7l-.06.06A1.65 1.65 0 0 0 19.4 7a1.65 1.65 0 0 0 1.51 1H22a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function IconPercent() {
  return (
    <svg className="set-cardIcon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M19 5L5 19" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="7.5" cy="6.5" r="2" fill="none" stroke="currentColor" strokeWidth="2" />
      <circle cx="16.5" cy="17.5" r="2" fill="none" stroke="currentColor" strokeWidth="2" />
    </svg>
  )
}

function IconReceipt() {
  return (
    <svg className="set-cardIcon" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M6 2h12v20l-2-1-2 1-2-1-2 1-2-1-2 1z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M9 6h6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M9 10h6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function IconHardware() {
  return (
    <svg className="set-cardIcon" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M21 7H3v10h18z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M8 7V4h8v3" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M7 17l-2 4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M17 17l2 4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function IconLock() {
  return (
    <svg className="set-cardIcon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M17 11H7v10h10z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M12 16v2" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function Switch({ checked, onChange, ariaLabel }) {
  return (
    <button
      type="button"
      className={`set-switch ${checked ? 'on' : 'off'}`}
      onClick={() => onChange?.(!checked)}
      aria-label={ariaLabel}
    >
      <span className="set-switchKnob" aria-hidden="true" />
    </button>
  )
}

function CardShell({ icon, title, subtitle, right }) {
  return (
    <div className="set-card">
      <div className="set-cardHeader">
        <div className="set-cardHeaderLeft">
          <div className="set-cardIconWrap">{icon}</div>
          <div>
            <div className="set-cardTitle">{title}</div>
            <div className="set-cardSubtitle">{subtitle}</div>
          </div>
        </div>
        {right ? <div className="set-cardHeaderRight">{right}</div> : null}
      </div>
    </div>
  )
}

const TABS = ['General', 'Tax & Pricing', 'Receipts', 'Hardware', 'Security']

export default function Settings({ user }) {
  const [tab, setTab] = useState('General')
  const isAdmin = user?.role === 'Admin'

  const [business, setBusiness] = useState({
    name: 'NexPos',
    address: '',
    phone: '',
    email: '',
    taxId: '',
    storeId: '#0001',
    register: 'POS-01',
  })

  const [systemPrefs, setSystemPrefs] = useState({
    systemName: 'NexPos',
    soundEffects: true,
    lowStockAlerts: true,
    loyaltyProgram: true,
  })

  const [tax, setTax] = useState({
    defaultTaxRate: '0',
    appliedTaxRate: '0',
  })

  const [receipts, setReceipts] = useState({
    printReceipts: true,
    emailReceipts: false,
    receiptHeaderText: 'THANK YOU FOR SHOPPING!',
    receiptFooterText: 'Returns accepted in 14 days\nFollow us on IG: @nexpos',
  })

  const [hardware, setHardware] = useState({
    receiptPrinter: true,
    barcodeScanner: true,
    cardReader: false,
  })

  const [security, setSecurity] = useState({
    requirePin: false,
    autoLogout: false,
  })

  const [saving, setSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const res = await getSettings()
        if (cancelled) return
        if (res?.business) setBusiness((p) => ({ ...p, ...res.business }))
        if (res?.systemPrefs) setSystemPrefs((p) => ({ ...p, ...res.systemPrefs }))
        if (res?.tax) {
          setTax((p) => ({
            ...p,
            defaultTaxRate: String(res.tax.defaultTaxRate ?? p.defaultTaxRate),
            appliedTaxRate: String(res.tax.appliedTaxRate ?? p.appliedTaxRate),
          }))
        }
        if (res?.receipts) setReceipts((p) => ({ ...p, ...res.receipts }))
        if (res?.hardware) setHardware((p) => ({ ...p, ...res.hardware }))
        if (res?.security) setSecurity((p) => ({ ...p, ...res.security }))
      } catch {
        // Keep defaults on error.
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  async function persist(next) {
    if (!isAdmin) return
    setSaving(true)
    setSaveMessage('')
    try {
      await updateSettings(next)
      setSaveMessage('Settings saved.')
    } catch (err) {
      setSaveMessage(err?.message || 'Could not save settings.')
    } finally {
      setSaving(false)
    }
  }

  function buildPayload() {
    return {
      business,
      systemPrefs,
      tax: {
        defaultTaxRate: Number(tax.defaultTaxRate),
        appliedTaxRate: Number(tax.appliedTaxRate),
      },
      receipts,
      hardware,
      security,
    }
  }

  const accessLevels = useMemo(
    () => [
      { role: 'Admin', desc: 'Full access: Settings, Sales, Products, Inventory, Customers, Employees, Reports, Discounts', tone: 'admin' },
      { role: 'Manager', desc: 'Sales, Products, Inventory, Customers, Employees, Reports, Discounts', tone: 'manager' },
      { role: 'Cashier', desc: 'Sales terminal only', tone: 'cashier' },
    ],
    []
  )

  if (!isAdmin) {
    return (
      <div className="set-page">
        <div className="set-header">
          <div>
            <div className="set-title">Settings</div>
            <div className="set-subtitle">Admin access required to configure NexPos.</div>
          </div>
        </div>
        <div className="set-card set-accessDenied">
          Only Admin users can view and update system settings. Contact your administrator.
        </div>
      </div>
    )
  }

  return (
    <div className="set-page">
      <div className="set-header">
        <div>
          <div className="set-title">Settings</div>
          <div className="set-subtitle">Configure NexPos — Admin access for {user?.name || 'Admin'}</div>
        </div>
        {saveMessage ? <div className="set-saveMessage">{saveMessage}</div> : null}
      </div>

      <div className="set-tabs" role="tablist" aria-label="Settings tabs">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            className={`set-tab ${tab === t ? 'active' : ''}`}
            onClick={() => setTab(t)}
            role="tab"
            aria-selected={tab === t}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'General' ? (
        <div className="set-content">
          <div className="set-cardGeneral">
            <div className="set-generalHead">
              <div className="set-generalTitleRow">
                <IconHardware />
                <div>
                  <div className="set-cardTitle">Business Information</div>
                  <div className="set-cardSubtitle">Configure your business details</div>
                </div>
              </div>
              <div />
            </div>

            <div className="set-fields">
              <div className="set-field">
                <div className="set-fieldLabel">Business Name</div>
                <input
                  className="set-editInput"
                  value={business.name}
                  onChange={(e) => setBusiness((p) => ({ ...p, name: e.target.value }))}
                  aria-label="Business Name"
                />
              </div>
              <div className="set-field">
                <div className="set-fieldLabel">System Name</div>
                <input
                  className="set-editInput"
                  value={systemPrefs.systemName}
                  onChange={(e) => setSystemPrefs((p) => ({ ...p, systemName: e.target.value }))}
                  aria-label="System Name"
                />
              </div>
              <div className="set-field">
                <div className="set-fieldLabel">Store ID</div>
                <input
                  className="set-editInput"
                  value={business.storeId || ''}
                  onChange={(e) => setBusiness((p) => ({ ...p, storeId: e.target.value }))}
                  aria-label="Store ID"
                />
              </div>
              <div className="set-field">
                <div className="set-fieldLabel">Register</div>
                <input
                  className="set-editInput"
                  value={business.register || ''}
                  onChange={(e) => setBusiness((p) => ({ ...p, register: e.target.value }))}
                  aria-label="Register"
                />
              </div>
              <div className="set-field">
                <div className="set-fieldLabel">Tax ID</div>
                <input
                  className="set-editInput"
                  value={business.taxId || ''}
                  onChange={(e) => setBusiness((p) => ({ ...p, taxId: e.target.value }))}
                  aria-label="Tax ID"
                />
              </div>
              <div className="set-field">
                <div className="set-fieldLabel">Business Address</div>
                <input
                  className="set-editInput"
                  value={business.address}
                  onChange={(e) => setBusiness((p) => ({ ...p, address: e.target.value }))}
                  aria-label="Business Address"
                />
              </div>
              <div className="set-field">
                <div className="set-fieldLabel">Phone Number</div>
                <input
                  className="set-editInput"
                  value={business.phone}
                  onChange={(e) => setBusiness((p) => ({ ...p, phone: e.target.value }))}
                  aria-label="Phone Number"
                />
              </div>
              <div className="set-field">
                <div className="set-fieldLabel">Email Address</div>
                <input
                  className="set-editInput"
                  value={business.email}
                  onChange={(e) => setBusiness((p) => ({ ...p, email: e.target.value }))}
                  aria-label="Email Address"
                />
              </div>
            </div>

            <div className="set-footerActions">
              <button
                className="set-saveBtn"
                type="button"
                onClick={() => persist(buildPayload())}
                disabled={saving}
              >
                Save Changes
              </button>
            </div>
          </div>

          <div className="set-card">
            <div className="set-preferenceHead">
              <IconGear />
              <div>
                <div className="set-cardTitle">System Preferences</div>
                <div className="set-cardSubtitle">Play with toggles for system behavior</div>
              </div>
            </div>

            <div className="set-prefList">
              <div className="set-prefRow">
                <div>
                  <div className="set-prefTitle">Sound Effects</div>
                  <div className="set-prefSubtitle">Play sounds for transactions</div>
                </div>
                <Switch
                  checked={systemPrefs.soundEffects}
                  onChange={(v) => setSystemPrefs((p) => ({ ...p, soundEffects: v }))}
                  ariaLabel="Toggle sound effects"
                />
              </div>
              <div className="set-prefRow">
                <div>
                  <div className="set-prefTitle">Low Stock Alerts</div>
                  <div className="set-prefSubtitle">Get notified when items are low</div>
                </div>
                <Switch
                  checked={systemPrefs.lowStockAlerts}
                  onChange={(v) => setSystemPrefs((p) => ({ ...p, lowStockAlerts: v }))}
                  ariaLabel="Toggle low stock alerts"
                />
              </div>
              <div className="set-prefRow">
                <div>
                  <div className="set-prefTitle">Loyalty Program</div>
                  <div className="set-prefSubtitle">Enable customer loyalty points</div>
                </div>
                <Switch
                  checked={systemPrefs.loyaltyProgram}
                  onChange={(v) => setSystemPrefs((p) => ({ ...p, loyaltyProgram: v }))}
                  ariaLabel="Toggle loyalty program"
                />
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {tab === 'Tax & Pricing' ? (
        <div className="set-content">
          <div className="set-card">
            <div className="set-taxHead">
              <IconPercent />
              <div>
                <div className="set-cardTitle">Tax Configuration</div>
                <div className="set-cardSubtitle">Set up your tax rates</div>
              </div>
            </div>

            <div className="set-taxGrid">
              <div className="set-field">
                <div className="set-fieldLabel">Default Tax Rate (%)</div>
                <input
                  className="set-editInput set-taxRateInput"
                  inputMode="decimal"
                  value={tax.defaultTaxRate}
                  onChange={(e) => setTax((p) => ({ ...p, defaultTaxRate: e.target.value }))}
                  aria-label="Default Tax Rate"
                />
              </div>
              <div className="set-field set-taxCurrent">
                <div className="set-taxCurrentTitle">Current Settings</div>
                <div className="set-taxCurrentLine">Tax Rate: {tax.appliedTaxRate}%</div>
                <div className="set-taxCurrentSub">Applied to all transactions</div>
              </div>
            </div>

            <div className="set-footerActions">
              <button
                className="set-saveBtn"
                type="button"
                onClick={() =>
                  persist({
                    business,
                    systemPrefs,
                    tax: {
                      defaultTaxRate: Number(tax.defaultTaxRate),
                      appliedTaxRate: Number(tax.appliedTaxRate),
                    },
                    receipts,
                    hardware,
                    security,
                  })
                }
                disabled={saving}
              >
                Save Tax Settings
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {tab === 'Receipts' ? (
        <div className="set-content">
          <div className="set-card">
            <div className="set-receiptHead">
              <IconReceipt />
              <div>
                <div className="set-cardTitle">Receipt Settings</div>
                <div className="set-cardSubtitle">Configure receipt printing and formatting</div>
              </div>
            </div>

            <div className="set-prefList">
              <div className="set-prefRow">
                <div>
                  <div className="set-prefTitle">Print Receipts</div>
                  <div className="set-prefSubtitle">Automatically print after each sale</div>
                </div>
                <Switch checked={receipts.printReceipts} onChange={(v) => setReceipts((p) => ({ ...p, printReceipts: v }))} ariaLabel="Toggle print receipts" />
              </div>
              <div className="set-prefRow">
                <div>
                  <div className="set-prefTitle">Email Receipts</div>
                  <div className="set-prefSubtitle">Send digital receipts to customers</div>
                </div>
                <Switch checked={receipts.emailReceipts} onChange={(v) => setReceipts((p) => ({ ...p, emailReceipts: v }))} ariaLabel="Toggle email receipts" />
              </div>
            </div>

            <div className="set-textFields">
              <div className="set-field">
                <div className="set-fieldLabel">Receipt Header Text</div>
                <textarea
                  className="set-editTextArea"
                  value={receipts.receiptHeaderText}
                  onChange={(e) => setReceipts((p) => ({ ...p, receiptHeaderText: e.target.value }))}
                  aria-label="Receipt Header Text"
                />
              </div>
              <div className="set-field">
                <div className="set-fieldLabel">Receipt Footer Text</div>
                <textarea
                  className="set-editTextArea"
                  value={receipts.receiptFooterText}
                  onChange={(e) => setReceipts((p) => ({ ...p, receiptFooterText: e.target.value }))}
                  aria-label="Receipt Footer Text"
                />
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {tab === 'Hardware' ? (
        <div className="set-content">
          <div className="set-card">
            <div className="set-receiptHead">
              <IconHardware />
              <div>
                <div className="set-cardTitle">Connected Devices</div>
                <div className="set-cardSubtitle">Manage your POS hardware integrations</div>
              </div>
            </div>

            <div className="set-deviceList">
              <div className="set-deviceRow">
                <div>
                  <div className="set-deviceTitle">Receipt Printer</div>
                  <div className="set-deviceSubtitle">Thermal printer connection</div>
                </div>
                <button className="set-deviceAction" type="button">
                  Configure
                </button>
              </div>

              <div className="set-deviceRow">
                <div>
                  <div className="set-deviceTitle">Barcode Scanner</div>
                  <div className="set-deviceSubtitle">USB barcode scanner</div>
                </div>
                <Switch checked={hardware.barcodeScanner} onChange={(v) => setHardware((p) => ({ ...p, barcodeScanner: v }))} ariaLabel="Toggle barcode scanner" />
              </div>

              <div className="set-deviceRow">
                <div>
                  <div className="set-deviceTitle">Card Reader</div>
                  <div className="set-deviceSubtitle">Payment terminal</div>
                </div>
                <button className="set-deviceAction" type="button">
                  Connect
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {tab === 'Security' ? (
        <div className="set-content">
          <div className="set-card">
            <div className="set-receiptHead">
              <IconLock />
              <div>
                <div className="set-cardTitle">Security Settings</div>
                <div className="set-cardSubtitle">Configure access controls and security options</div>
              </div>
            </div>

            <div className="set-prefList">
              <div className="set-prefRow">
                <div>
                  <div className="set-prefTitle">Require PIN for Login</div>
                  <div className="set-prefSubtitle">Employees must enter PIN to access</div>
                </div>
                <Switch checked={security.requirePin} onChange={(v) => setSecurity((p) => ({ ...p, requirePin: v }))} ariaLabel="Toggle PIN for login" />
              </div>
              <div className="set-prefRow">
                <div>
                  <div className="set-prefTitle">Auto Logout</div>
                  <div className="set-prefSubtitle">Automatically logout after inactivity</div>
                </div>
                <Switch checked={security.autoLogout} onChange={(v) => setSecurity((p) => ({ ...p, autoLogout: v }))} ariaLabel="Toggle auto logout" />
              </div>
            </div>

            <div className="set-accessLevels">
              <div className="set-accessTitle">Access Levels</div>
              <div className="set-accessList">
                {accessLevels.map((a) => (
                  <div key={a.role} className={`set-accessRow set-access-${a.tone}`}>
                    <div className="set-accessRole">{a.role}</div>
                    <div className="set-accessDesc">{a.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}


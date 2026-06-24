import { useState } from 'react'
import { login } from './api/authApi'
import './Login.css'

const QUICK_USERS = [
  { role: 'Admin', email: 'john@pos.com' },
  { role: 'Manager', email: 'sarah@pos.com' },
  { role: 'Cashier', email: 'mike@pos.com' },
]

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('john@pos.com')
  const [password, setPassword] = useState('admin123')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await login(email.trim(), password)
      if (!res?.token || !res?.employee) throw new Error('Invalid login response')
      onLogin?.(res)
    } catch (err) {
      setError(err?.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="lg-root">
      <div className="lg-card">
        <div className="lg-brand">NexPos</div>
        <div className="lg-title">Sign In</div>
        <div className="lg-sub">Admin, Manager, and Cashier access</div>

        <div className="lg-quick">
          {QUICK_USERS.map((u) => (
            <button
              key={u.role}
              className="lg-quickBtn"
              type="button"
              onClick={() => {
                setEmail(u.email)
                setPassword('admin123')
              }}
            >
              {u.role}
            </button>
          ))}
        </div>

        <form className="lg-form" onSubmit={handleSubmit}>
          <label className="lg-label">
            <span>Email</span>
            <input value={email} onChange={(e) => setEmail(e.target.value)} className="lg-input" />
          </label>
          <label className="lg-label">
            <span>Password</span>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="lg-input" />
          </label>

          {error ? <div className="lg-error">{error}</div> : null}

          <button className="lg-submit" type="submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  )
}


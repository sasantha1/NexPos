import { useState } from 'react'
import { login } from './api/authApi'
import './Login.css'

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
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
        <div className="lg-brand">
          <img className="lg-logo" src="/logo.png" alt="NexPos" />
        </div>
        <div className="lg-title">NexPos</div>
        <div className="lg-sub">Sign in with your employee account</div>

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


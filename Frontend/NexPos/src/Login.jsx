import { useState } from 'react'
import { login, register } from './api/authApi'
import './Login.css'

const ROLE_OPTIONS = ['Admin', 'Manager', 'Cashier']

export default function Login({ onLogin }) {
  const [isRegisterMode, setIsRegisterMode] = useState(false)
  const [name, setName] = useState('')
  const [role, setRole] = useState('Cashier')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = isRegisterMode
        ? await register({ name: name.trim(), email: email.trim(), password, role })
        : await login(email.trim(), password)
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
        <div className="lg-title">{isRegisterMode ? 'Create Account' : 'Sign In'}</div>
        <div className="lg-sub">{isRegisterMode ? 'Register a staff account to start using NexPos' : 'Sign in with your account'}</div>

        <form className="lg-form" onSubmit={handleSubmit}>
          {isRegisterMode ? (
            <label className="lg-label">
              <span>Full Name</span>
              <input value={name} onChange={(e) => setName(e.target.value)} className="lg-input" />
            </label>
          ) : null}
          <label className="lg-label">
            <span>Email</span>
            <input value={email} onChange={(e) => setEmail(e.target.value)} className="lg-input" />
          </label>
          <label className="lg-label">
            <span>Password</span>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="lg-input" />
          </label>
          {isRegisterMode ? (
            <label className="lg-label">
              <span>Role</span>
              <select value={role} onChange={(e) => setRole(e.target.value)} className="lg-input">
                {ROLE_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          {error ? <div className="lg-error">{error}</div> : null}

          <button className="lg-submit" type="submit" disabled={loading}>
            {loading ? (isRegisterMode ? 'Creating account...' : 'Signing in...') : isRegisterMode ? 'Create Account' : 'Login'}
          </button>

          <button
            className="lg-quickBtn"
            type="button"
            onClick={() => {
              setError('')
              setIsRegisterMode((v) => !v)
            }}
          >
            {isRegisterMode ? 'Already have an account? Sign in' : "Don't have an account? Register"}
          </button>
        </form>
      </div>
    </div>
  )
}


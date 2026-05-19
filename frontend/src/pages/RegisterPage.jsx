import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthContext } from '../context/AuthContext'

export default function RegisterPage() {
  const { register } = useAuthContext()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.password !== form.confirmPassword) { setError('Passwords do not match.'); return }
    if (form.password.length < 8) { setError('Password must be at least 8 characters.'); return }
    setLoading(true)
    setError('')
    try {
      await register(form.name, form.email, form.password)
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-shell">
      <div className="login-bg-grid"/>
      <div className="login-bg-orb"/>
      <div className="login-bg-orb login-bg-orb-2"/>

      <div className="login-card">
        <div className="login-brand">
          <div className="brand-mark">
            <svg viewBox="0 0 24 24" width="22" height="22">
              <circle cx="6"  cy="7"  r="2.5" fill="oklch(0.72 0.17 305)"/>
              <circle cx="18" cy="7"  r="2.5" fill="oklch(0.72 0.16 235)"/>
              <circle cx="12" cy="17" r="2.5" fill="oklch(0.74 0.16 155)"/>
              <line x1="6"  y1="7"  x2="18" y2="7"  stroke="oklch(0.55 0.04 260)" strokeWidth="1"/>
              <line x1="6"  y1="7"  x2="12" y2="17" stroke="oklch(0.55 0.04 260)" strokeWidth="1"/>
              <line x1="18" y1="7"  x2="12" y2="17" stroke="oklch(0.55 0.04 260)" strokeWidth="1"/>
            </svg>
          </div>
          <span className="brand-name">MyNetwork</span>
        </div>

        <h1 className="login-title">Map your people.</h1>
        <p className="login-sub">Build a graph of every contact you have, and how they connect.</p>

        {error && (
          <div style={{
            marginBottom: 16, padding: '10px 14px',
            background: 'oklch(0.70 0.18 25 / 0.12)',
            border: '1px solid oklch(0.70 0.18 25 / 0.35)',
            borderRadius: 8, fontSize: 13, color: 'var(--bad)',
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          <label className="field">
            <span>Full name</span>
            <input
              name="name" type="text" autoComplete="name" required
              value={form.name} onChange={handleChange}
              placeholder="Alex Morgan"
            />
          </label>
          <label className="field">
            <span>Email</span>
            <input
              name="email" type="email" autoComplete="email" required
              value={form.email} onChange={handleChange}
              placeholder="you@example.com"
            />
          </label>
          <label className="field">
            <span>Password <span style={{ color: 'var(--text-dim)', fontWeight: 400 }}>(min 8 chars)</span></span>
            <input
              name="password" type="password" autoComplete="new-password" required
              value={form.password} onChange={handleChange}
              placeholder="••••••••"
            />
          </label>
          <label className="field">
            <span>Confirm password</span>
            <input
              name="confirmPassword" type="password" autoComplete="new-password" required
              value={form.confirmPassword} onChange={handleChange}
              placeholder="••••••••"
            />
          </label>

          <button type="submit" className="btn-primary login-cta" disabled={loading}>
            {loading ? 'Creating account…' : 'Create account'}
            {!loading && <span className="cta-arrow">→</span>}
          </button>
        </form>

        <div className="login-toggle" style={{ marginTop: 20 }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--accent-2)', fontWeight: 500 }}>
            Sign in
          </Link>
        </div>
      </div>

      <aside style={{
        position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'radial-gradient(ellipse at 60% 40%, oklch(0.20 0.03 285 / 0.5), transparent 60%)',
        overflow: 'hidden',
      }}>
        <div style={{ textAlign: 'center', padding: 48 }}>
          <div style={{ fontSize: 48, marginBottom: 24 }}>
            <svg viewBox="0 0 120 120" width="120" height="120">
              <circle cx="20"  cy="30"  r="10" fill="oklch(0.72 0.17 305)" opacity="0.9"/>
              <circle cx="100" cy="30"  r="10" fill="oklch(0.72 0.16 235)" opacity="0.9"/>
              <circle cx="60"  cy="100" r="10" fill="oklch(0.74 0.16 155)" opacity="0.9"/>
              <circle cx="60"  cy="30"  r="6"  fill="oklch(0.76 0.16 55)"  opacity="0.8"/>
              <circle cx="20"  cy="80"  r="6"  fill="oklch(0.74 0.15 25)"  opacity="0.8"/>
              <circle cx="100" cy="80"  r="6"  fill="oklch(0.74 0.07 260)" opacity="0.8"/>
              <line x1="20" y1="30" x2="100" y2="30" stroke="oklch(0.40 0.04 260)" strokeWidth="1.5"/>
              <line x1="20" y1="30" x2="60"  y2="100" stroke="oklch(0.40 0.04 260)" strokeWidth="1.5"/>
              <line x1="100" y1="30" x2="60" y2="100" stroke="oklch(0.40 0.04 260)" strokeWidth="1.5"/>
              <line x1="20" y1="30" x2="60"  y2="30" stroke="oklch(0.40 0.04 260)" strokeWidth="1"/>
              <line x1="100" y1="30" x2="100" y2="80" stroke="oklch(0.40 0.04 260)" strokeWidth="1"/>
              <line x1="20" y1="80" x2="60"  y2="100" stroke="oklch(0.40 0.04 260)" strokeWidth="1"/>
            </svg>
          </div>
          <div style={{ fontSize: 20, fontWeight: 600, letterSpacing: '-0.02em', marginBottom: 8 }}>
            Your network, visualized
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-mut)', maxWidth: 260, margin: '0 auto', lineHeight: 1.6 }}>
            Map every contact and see the shortest path to anyone through your connections.
          </div>
        </div>
      </aside>
    </div>
  )
}

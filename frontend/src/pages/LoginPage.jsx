import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthContext } from '../context/AuthContext'

const MARQUEE_ITEMS = [
  { name: 'Raj Mehta',      role: 'Brand Lead',       cat: '#FBBF24' },
  { name: 'Priya Shah',     role: 'UI Designer',      cat: '#C084FC' },
  { name: 'Sarah Chen',     role: 'Senior Engineer',   cat: '#60A5FA' },
  { name: 'Mike Tanaka',    role: 'Backend Engineer',  cat: '#60A5FA' },
  { name: 'David Okafor',   role: 'CFO',               cat: '#4ADE80' },
  { name: 'Alex Rivera',    role: 'Investor',          cat: '#4ADE80' },
  { name: 'Lina Park',      role: 'Brand Designer',    cat: '#C084FC' },
  { name: 'Tom Becker',     role: 'Growth Lead',       cat: '#FBBF24' },
  { name: 'Kai Nguyen',     role: 'Product Manager',   cat: '#FB923C' },
  { name: 'Omar Haddad',    role: 'ML Engineer',       cat: '#60A5FA' },
  { name: 'Maya Iyer',      role: 'Motion Designer',   cat: '#C084FC' },
  { name: 'Jules Moreau',   role: 'Chief of Staff',    cat: '#94A3B8' },
]

function MarqueeRow({ items, reverse, offset }) {
  const doubled = [...items, ...items]
  return (
    <div
      className="marquee-track"
      style={reverse ? { animationDirection: 'reverse', animationDuration: '65s', paddingLeft: offset || 0 } : {}}
    >
      {doubled.map((p, i) => (
        <div key={i} className="marquee-card" style={{ borderLeftColor: p.cat, borderColor: p.cat }}>
          <span className="marquee-dot" style={{ background: p.cat }}/>
          <span>{p.name}</span>
          <span className="marquee-meta">{p.role}</span>
        </div>
      ))}
    </div>
  )
}

export default function LoginPage() {
  const { login } = useAuthContext()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await login(form.email, form.password)
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed. Please try again.')
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

        <h1 className="login-title">Welcome back.</h1>
        <p className="login-sub">Sign in to see who knows whom.</p>

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
            <span>Email</span>
            <input
              name="email" type="email" autoComplete="email" required
              value={form.email} onChange={handleChange}
              placeholder="you@example.com"
            />
          </label>
          <label className="field">
            <span>Password</span>
            <input
              name="password" type="password" autoComplete="current-password" required
              value={form.password} onChange={handleChange}
              placeholder="••••••••"
            />
          </label>

          <button type="submit" className="btn-primary login-cta" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
            {!loading && <span className="cta-arrow">→</span>}
          </button>
        </form>

        <div className="login-toggle" style={{ marginTop: 20 }}>
          New here?{' '}
          <Link to="/register" style={{ color: 'var(--accent-2)', fontWeight: 500 }}>
            Create an account
          </Link>
        </div>
      </div>

      <aside className="login-marquee" aria-hidden="true">
        <MarqueeRow items={MARQUEE_ITEMS}/>
        <MarqueeRow items={[...MARQUEE_ITEMS].reverse()} reverse offset="60px"/>
      </aside>
    </div>
  )
}

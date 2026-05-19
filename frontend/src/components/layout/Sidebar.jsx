import { NavLink, useNavigate } from 'react-router-dom'
import { useAuthContext } from '../../context/AuthContext'
import { CATEGORIES } from '../../utils/graphHelpers'

const NAV_ITEMS = [
  {
    to: '/dashboard',
    label: 'Dashboard',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
        <circle cx="6" cy="7" r="2"/><circle cx="18" cy="7" r="2"/><circle cx="12" cy="17" r="2"/>
        <line x1="6" y1="7" x2="18" y2="7"/><line x1="6" y1="7" x2="12" y2="17"/>
        <line x1="18" y1="7" x2="12" y2="17"/>
      </svg>
    ),
  },
  {
    to: '/people',
    label: 'Contacts',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
        <circle cx="9" cy="9" r="3.5"/>
        <path d="M2 20a7 7 0 0 1 14 0"/>
        <circle cx="17" cy="8" r="2.5"/>
        <path d="M16 14h1a5 5 0 0 1 5 5"/>
      </svg>
    ),
  },
  {
    to: '/graph',
    label: 'Graph',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
        <circle cx="5" cy="12" r="2"/><circle cx="19" cy="5" r="2"/><circle cx="19" cy="19" r="2"/>
        <line x1="7" y1="12" x2="17" y2="6"/><line x1="7" y1="12" x2="17" y2="18"/>
      </svg>
    ),
  },
  {
    to: '/search',
    label: 'Search',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
        <circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
      </svg>
    ),
  },
]

function getInitials(name = '') {
  return name.split(' ').map(s => s[0]).slice(0, 2).join('').toUpperCase() || 'ME'
}

function getInitialsBg(name = '') {
  const hue = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 360
  return `hsl(${hue}, 50%, 40%)`
}

export default function Sidebar() {
  const { user, logout } = useAuthContext()
  const navigate = useNavigate()

  return (
    <nav className="sidebar">
      <div className="side-brand">
        <div className="brand-mark small">
          <svg viewBox="0 0 24 24" width="16" height="16">
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

      <div className="side-section-label">Workspace</div>
      <ul className="side-nav">
        {NAV_ITEMS.map(({ to, label, icon }) => (
          <li key={to}>
            <NavLink to={to} className={({ isActive }) => isActive ? 'side-link active' : 'side-link'}>
              {({ isActive }) => (
                <>
                  <span className="side-icon">{icon}</span>
                  <span className="side-label">{label}</span>
                  {isActive && <span className="side-marker"/>}
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>

      <div className="side-spacer"/>

      <div className="side-section-label">Account</div>
      <ul className="side-nav">
        <li>
          <button className="side-link" onClick={() => navigate('/people/new')}>
            <span className="side-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
            </span>
            <span className="side-label">Add person</span>
          </button>
        </li>
        {user?.my_person_id && (
          <li>
            <button className="side-link" onClick={() => navigate(`/people/${user.my_person_id}/edit`)}>
              <span className="side-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                  <circle cx="12" cy="8" r="4"/>
                  <path d="M4 20a8 8 0 0 1 16 0"/>
                </svg>
              </span>
              <span className="side-label">Edit my profile</span>
            </button>
          </li>
        )}
      </ul>

      {user && (
        <div className="side-user">
          <div
            className="initials"
            style={{ background: getInitialsBg(user.name), color: '#fff' }}
          >
            {getInitials(user.name)}
          </div>
          <div className="side-user-meta">
            <div className="side-user-name">{user.name}</div>
            <div className="side-user-mail">{user.email}</div>
          </div>
          <button className="icon-btn" onClick={logout} title="Sign out">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </button>
        </div>
      )}
    </nav>
  )
}

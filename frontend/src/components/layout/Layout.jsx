import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import Sidebar from './Sidebar'
import { useAuthContext } from '../../context/AuthContext'

const ROUTE_LABELS = {
  '/dashboard': 'Dashboard',
  '/people':    'Contacts',
  '/graph':     'Graph',
  '/search':    'Search',
}

function TopBar() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const label = ROUTE_LABELS[pathname] ?? 'MyNetwork'

  return (
    <header className="topbar">
      <div className="crumb">
        <span style={{ color: 'var(--text-mut)' }}>MyNetwork</span>
        <span className="crumb-sep">/</span>
        <span className="crumb-active">{label}</span>
      </div>

      <div className="topbar-search" style={{ cursor: 'pointer' }} onClick={() => navigate('/search')}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input placeholder="Search people, skills…" readOnly style={{ cursor: 'pointer' }}/>
        <kbd>⌘K</kbd>
      </div>

      <div className="topbar-actions">
        <button className="icon-btn" title="Notifications">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
        </button>
      </div>
    </header>
  )
}

export default function Layout() {
  return (
    <div className="app">
      <Sidebar />
      <div className="main">
        <TopBar />
        <main className="page" style={{ display: 'flex', flexDirection: 'column' }}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}

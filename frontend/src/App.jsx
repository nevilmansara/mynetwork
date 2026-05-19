import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuthContext } from './context/AuthContext'
import { NetworkProvider } from './context/NetworkContext'

import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import PeoplePage from './pages/PeoplePage'
import PersonDetailPage from './pages/PersonDetailPage'
import PersonEditPage from './pages/PersonEditPage'
import GraphPage from './pages/GraphPage'
import SearchPage from './pages/SearchPage'
import Layout from './components/layout/Layout'

function Spinner() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: '100vh', background: 'var(--bg)',
    }}>
      <div className="spinner" style={{ width: 32, height: 32, borderWidth: 3 }}/>
    </div>
  )
}

function PrivateRoute({ children }) {
  const { isAuthenticated, loading } = useAuthContext()
  if (loading) return <Spinner />
  return isAuthenticated ? children : <Navigate to="/login" replace />
}

function PublicRoute({ children }) {
  const { isAuthenticated, loading } = useAuthContext()
  if (loading) return <Spinner />
  return !isAuthenticated ? children : <Navigate to="/dashboard" replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <NetworkProvider>
          <Routes>
            <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
            <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
            <Route
              path="/"
              element={
                <PrivateRoute>
                  <Layout />
                </PrivateRoute>
              }
            >
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="people" element={<PeoplePage />} />
              <Route path="people/new" element={<PersonEditPage />} />
              <Route path="people/:id/edit" element={<PersonEditPage />} />
              <Route path="people/:id" element={<PersonDetailPage />} />
              <Route path="graph" element={<GraphPage />} />
              <Route path="search" element={<SearchPage />} />
            </Route>
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </NetworkProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

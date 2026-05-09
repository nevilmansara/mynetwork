import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { NetworkProvider } from './context/NetworkContext'

import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import PeoplePage from './pages/PeoplePage'
import PersonDetailPage from './pages/PersonDetailPage'
import GraphPage from './pages/GraphPage'
import SearchPage from './pages/SearchPage'
import Layout from './components/layout/Layout'

function PrivateRoute({ children }) {
  const token = localStorage.getItem('token')
  return token ? children : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <NetworkProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
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
              <Route path="people/:id" element={<PersonDetailPage />} />
              <Route path="graph" element={<GraphPage />} />
              <Route path="search" element={<SearchPage />} />
            </Route>
          </Routes>
        </NetworkProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

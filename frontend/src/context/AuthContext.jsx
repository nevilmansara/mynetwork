import { createContext, useContext, useState, useEffect } from 'react'
import { authService } from '../services/authService'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(localStorage.getItem('token'))
  const [loading, setLoading] = useState(true)

  const isAuthenticated = !!token && !!user

  useEffect(() => {
    const storedToken = localStorage.getItem('token')
    if (!storedToken) {
      setLoading(false)
      return
    }
    authService
      .me()
      .then((res) => {
        setUser(res.data)
      })
      .catch(() => {
        localStorage.removeItem('token')
        setToken(null)
        setUser(null)
      })
      .finally(() => setLoading(false))
  }, [])

  const login = async (email, password) => {
    const res = await authService.login(email, password)
    const { access_token, user: userData } = res.data
    localStorage.setItem('token', access_token)
    setToken(access_token)
    setUser(userData)
    return userData
  }

  const logout = () => {
    localStorage.removeItem('token')
    setToken(null)
    setUser(null)
  }

  const register = async (name, email, password) => {
    await authService.register(name, email, password)
    return login(email, password)
  }

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated, loading, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuthContext() {
  return useContext(AuthContext)
}

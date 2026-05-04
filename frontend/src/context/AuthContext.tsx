import React, { createContext, useContext, useState, useEffect } from 'react'
import { User, LoginPayload, SignupPayload } from '../types'
import { authApi } from '../api/auth'

interface AuthContextType {
  user: User | null
  token: string | null
  isLoading: boolean
  isAuthenticated: boolean
  isAdmin: boolean
  login: (data: LoginPayload) => Promise<void>
  signup: (data: SignupPayload) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('user')
    return saved ? JSON.parse(saved) : null
  })
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'))
  const [isLoading, setIsLoading] = useState(true)

  // verify token on app load
  useEffect(() => {
    if (!token) {
      setIsLoading(false)
      return
    }

    authApi.getMe()
      .then((data) => {
        setUser(data)
        localStorage.setItem('user', JSON.stringify(data))
      })
      .catch(() => {
        // token is invalid, clear everything
        setToken(null)
        setUser(null)
        localStorage.removeItem('token')
        localStorage.removeItem('user')
      })
      .finally(() => setIsLoading(false))
  }, [])

  const login = async (data: LoginPayload) => {
    const res = await authApi.login(data)
    setToken(res.token)
    setUser(res.user)
    localStorage.setItem('token', res.token)
    localStorage.setItem('user', JSON.stringify(res.user))
  }

  const signup = async (data: SignupPayload) => {
    const res = await authApi.signup(data)
    setToken(res.token)
    setUser(res.user)
    localStorage.setItem('token', res.token)
    localStorage.setItem('user', JSON.stringify(res.user))
  }

  const logout = () => {
    setToken(null)
    setUser(null)
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!token && !!user,
        isAdmin: user?.role === 'admin',
        login,
        signup,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}

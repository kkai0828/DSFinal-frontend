// context/AuthContext.tsx
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react'

interface AuthContextType {
  jwtToken: string | null
  isLoggedIn: boolean
  email: string | null
  name: string | null
  role: 'user' | 'host' | 'admin' | null
  phone: string | null
  userId: string | null
  login: (
    token: string,
    email: string,
    name: string,
    role: 'user' | 'host' | 'admin',
    phone: string,
    userId: string
  ) => void
  logout: () => void
}

interface AuthProviderProps {
  children: ReactNode
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [email, setEmail] = useState<string | null>(null)
  const [name, setName] = useState<string | null>(null)
  const [role, setRole] = useState<'user' | 'host' | 'admin' | null>(null)
  const [phone, setPhone] = useState<string | null>(null)
  const [jwtToken, setJwtToken] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    const token = localStorage.getItem('jwt_token')
    const savedEmail = localStorage.getItem('email')
    const savedName = localStorage.getItem('name')
    const savedRole = localStorage.getItem('role') as 'user' | 'host' | 'admin' | null
    const savedPhone = localStorage.getItem('phone')
    const savedUserId = localStorage.getItem('userId')

    if (token) {
      setJwtToken(token)
      setIsLoggedIn(true)
      setEmail(savedEmail)
      setName(savedName)
      setRole(savedRole)
      setPhone(savedPhone)
      setUserId(savedUserId)
    }
  }, [])

  const login = (
    token: string,
    email: string,
    name: string,
    role: 'user' | 'host' | 'admin',
    phone: string,
    userId: string
  ) => {
    setIsLoggedIn(true)
    setJwtToken(token)
    setEmail(email)
    setName(name)
    setRole(role)
    setPhone(phone)
    setUserId(userId)

    localStorage.setItem('jwt_token', token)
    localStorage.setItem('email', email)
    localStorage.setItem('name', name)
    localStorage.setItem('role', role)
    localStorage.setItem('phone', phone)
    localStorage.setItem('userId', userId)
  }

  const logout = () => {
    localStorage.removeItem('jwt_token')
    localStorage.removeItem('email')
    localStorage.removeItem('name')
    localStorage.removeItem('role')
    localStorage.removeItem('phone')
    localStorage.removeItem('userId')

    setIsLoggedIn(false)
    setJwtToken(null)
    setEmail(null)
    setName(null)
    setRole(null)
    setPhone(null)
    setUserId(null)
  }

  return (
    <AuthContext.Provider
      value={{
        jwtToken,
        isLoggedIn,
        email,
        name,
        role,
        phone,
        userId,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

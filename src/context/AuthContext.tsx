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
  username: string | null // Corresponds to userInfo.username from API
  role: 'client' | 'host' |  null
  phone_number: string | null // Corresponds to userInfo.phone_number from API
  userId: string | null
  login: (
    token: string,
    email: string,
    username: string,
    role: 'client' | 'host' ,
    phone_number: string,
    userId: string
  ) => void
  logout: () => void
}

interface AuthProviderProps {
  children: ReactNode
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  console.log('[AuthProvider] Initializing...'); // 初始化日誌
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [email, setEmail] = useState<string | null>(null)
  const [username, setUsername] = useState<string | null>(null)
  const [role, setRole] = useState<'client' | 'host' | null>(null)
  const [phone_number, setPhoneNumber] = useState<string | null>(null)
  const [jwtToken, setJwtToken] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    console.log('[AuthProvider] useEffect running to load from localStorage.');
    try {
      const token = localStorage.getItem('jwt_token')
      const savedEmail = localStorage.getItem('email')
      const savedUsername = localStorage.getItem('username') // This will be what was stored (possibly based on userInfo.username)
      const savedRole = localStorage.getItem('role') as 'client' | 'host' | null
      const savedPhoneNumber = localStorage.getItem('phone_number') // This will be what was stored (possibly based on userInfo.phone_number)
      const savedUserId = localStorage.getItem('userId')

      console.log('[AuthProvider] Token from localStorage:', token);
      console.log('[AuthProvider] Email from localStorage:', savedEmail);
      console.log('[AuthProvider] Username from localStorage:', savedUsername);
      console.log('[AuthProvider] Role from localStorage:', savedRole);
      console.log('[AuthProvider] Phone number from localStorage:', savedPhoneNumber);
      console.log('[AuthProvider] UserID from localStorage:', savedUserId);

      if (token) {
        console.log('[AuthProvider] Token found, setting state.');
        setJwtToken(token)
        setIsLoggedIn(true)
        setEmail(savedEmail)
        setUsername(savedUsername) 
        setRole(savedRole)
        setPhoneNumber(savedPhoneNumber)
        setUserId(savedUserId)
      } else {
        console.log('[AuthProvider] No token found in localStorage.');
      }
    } catch (e) {
      console.error('[AuthProvider] Error reading from localStorage:', e);
    }
  }, [])

  const login = (
    token: string,
    emailInput: string, // Renamed to avoid conflict with state variable
    usernameInput: string,   // Renamed (maps from userInfo.username)
    roleInput: 'client' | 'host' ,
    phone_numberInput: string, // Renamed (maps from userInfo.phone_number)
    userIdInput: string
  ) => {
    console.log('[AuthProvider] login function called with:', 
      { token, emailInput, usernameInput, roleInput, phone_numberInput, userIdInput }
    );
    try {
      localStorage.setItem('jwt_token', token)
      localStorage.setItem('email', emailInput)
      localStorage.setItem('username', usernameInput) // Will store what's passed (i.e., userInfo.username)
      localStorage.setItem('role', roleInput)
      localStorage.setItem('phone_number', phone_numberInput) // Will store what's passed (i.e., userInfo.phone_number)
      localStorage.setItem('userId', userIdInput)
      console.log('[AuthProvider] Data saved to localStorage.');

      setIsLoggedIn(true)
      setJwtToken(token)
      setEmail(emailInput)
      setUsername(usernameInput) 
      setRole(roleInput)
      setPhoneNumber(phone_numberInput)
      setUserId(userIdInput)
      console.log('[AuthProvider] State updated after login.');
    } catch (e) {
      console.error('[AuthProvider] Error writing to localStorage during login:', e);
    }
  }

  const logout = () => {
    console.log('[AuthProvider] logout function called.');
    try {
      localStorage.removeItem('jwt_token')
      localStorage.removeItem('email')
      localStorage.removeItem('username')
      localStorage.removeItem('role')
      localStorage.removeItem('phone_number')
      localStorage.removeItem('userId')
      console.log('[AuthProvider] Data removed from localStorage.');

      setIsLoggedIn(false)
      setJwtToken(null)
      setEmail(null)
      setUsername(null)
      setRole(null)
      setPhoneNumber(null)
      setUserId(null)
      console.log('[AuthProvider] State reset after logout.');
    } catch (e) {
      console.error('[AuthProvider] Error removing from localStorage during logout:', e);
    }
  }

  console.log('[AuthProvider] Rendering with state:', { jwtToken, isLoggedIn, email, username, role, phone_number, userId });

  return (
    <AuthContext.Provider
      value={{
        jwtToken,
        isLoggedIn,
        email,
        username,   
        role,
        phone_number,
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
    console.error('[useAuth] Context not found. Ensure useAuth is within AuthProvider.') // Added error log
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

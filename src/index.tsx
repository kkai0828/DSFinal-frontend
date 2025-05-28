import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import App from './App'
import reportWebVitals from './reportWebVitals'
import { AuthProvider } from './context/AuthContext'

// checkLoginStatus function is no longer needed as AuthProvider handles this
/*
const checkLoginStatus = () => {
  const jwtToken = localStorage.getItem('jwt_token')
  const name = localStorage.getItem('name')
  return { jwtToken, name }
}
*/

const Root = () => {
  // Removed useState for isLoggedIn and name, and the useEffect
  // AuthProvider will handle the auth state internally by reading from localStorage

  return (
    <AuthProvider>
      <App />
    </AuthProvider>
  )
}

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement)
root.render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
)

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals()

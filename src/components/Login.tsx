// components/Login.tsx
import React, { useState } from 'react'
// import axios from 'axios' // No longer needed as we are consistently using fetch
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost' // Fallback for local dev, assuming port 80

const Login: React.FC = () => {
  const [email, setEmail] = useState('') // Renamed for consistency
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')

    try {
      // Step 1: Login to get the access token
      const loginResponse = await fetch('/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
        }),
      })

      if (!loginResponse.ok) {
        const errorText = await loginResponse.text()
        // Try to parse as JSON if backend sends structured error, otherwise use text
        try {
          const errorJson = JSON.parse(errorText);
          throw new Error(errorJson.detail || errorJson.message || errorText);
        } catch (parseError) {
          throw new Error(errorText || '登录失败，请检查您的凭据');
        }
      }

      const loginData = await loginResponse.json()

      if (loginData.access_token) {
        const token = loginData.access_token

        // Step 2: Get user info using the token
        const userInfoResponse = await fetch('/auth/get_user_info', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        })

        if (!userInfoResponse.ok) {
          const errorText = await userInfoResponse.text()
          try {
            const errorJson = JSON.parse(errorText);
            throw new Error(errorJson.detail || errorJson.message || errorText || '获取用户信息失败');
          } catch (parseError) {
             throw new Error(errorText || '获取用户信息失败');
          }
        }

        const userInfo = await userInfoResponse.json()

        // Call login from AuthContext with all user details and token
        login(
          token, // Pass the token itself
          userInfo.email,
          userInfo.username,
          userInfo.role,
          userInfo.phone_number,
          userInfo.id // Assuming AuthContext's login can also store user ID
        )
        navigate('/') // Navigate to homepage
      } else {
        setError('登录失败，未收到访问令牌')
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message || '发生未知错误')
      } else {
        setError('发生未知错误')
      }
    }
  }

  return (
    <div className="create-activity-container">
      <h2>登入</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="email">帳號 (Email):</label> {/* Clarified label */}
          <input
            type="email" // Changed to type="email" for better validation
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)} // Corrected setter
            required
            className="input-region"
          />
        </div>
        <div>
          <label htmlFor="password">密碼:</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="input-region"
          />
        </div>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <button type="submit">登入</button>
      </form>
    </div>
  )
}

export default Login

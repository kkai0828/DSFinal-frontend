import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AuthService from '../services/auth-services'

// API_URL 现在由 AuthService 内部处理，所以这里可以移除或注释掉
// const API_URL = process.env.REACT_APP_API_URL

const Registration: React.FC = () => {
  const [step, setStep] = useState(1)
  const [accountData, setAccountData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [personalData, setPersonalData] = useState({
    name: '',
    // gender: '', // gender 字段似乎在后端注册 API 中未使用，暂时注释
    phone: '',
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const navigate = useNavigate()

  const handleAccountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setAccountData({ ...accountData, [name]: value })
  }

  const handlePersonalChange = (
    e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>
  ) => {
    const { name, value } = e.target
    setPersonalData({ ...personalData, [name]: value })
  }
  const handleSubmitAccount = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (accountData.password !== accountData.confirmPassword) {
      setError('密碼不一致')
      return
    }

    setError('')
    setStep(2) // 轉到第二步
  }

  const handleSubmitPersonal = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('') // 清除之前的错误信息
    setSuccess('') // 清除之前的成功信息

    const registrationData = {
      email: accountData.email,
      password: accountData.password,
      username: personalData.name,
      role: 'user', // 根据 API 文档，role 是必须的
      phone_number: personalData.phone,
    }

    try {
      // 使用 AuthService.register
      const response = await AuthService.register(registrationData)
      
      // axios 的响应数据在 response.data 中
      // 后端成功注册返回 201 和用户信息，我们可以在这里设置成功消息
      // 例如，假设后端返回的数据中有 username
      setSuccess(`用户 ${response.data.username} 注册成功!`)
      setStep(3) // 轉到確認資訊步驟

    } catch (err: any) {
      // axios 的错误响应在 err.response 中
      if (err.response && err.response.data) {
        // 如果后端返回了具体的错误信息 (例如 text/plain)
        if (typeof err.response.data === 'string') {
          setError(err.response.data)
        } else {
          // 如果是其他结构，尝试提取 message，或者显示通用错误
          setError(err.response.data.message || '註冊失敗，請稍後再試')
        }
      } else {
        setError('註冊時發生未知錯誤')
      }
      console.error('Registration failed:', err.response || err.message)
    }
  }

  return (
    <div className="create-activity-container">
      <h2>註冊</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {success && <p style={{ color: 'green' }}>{success}</p>}

      {step === 1 && (
        <form onSubmit={handleSubmitAccount}>
          <div>
            <label>帳號</label>
            <input
              type="text"
              name="email"
              value={accountData.email}
              onChange={handleAccountChange}
              required
              className="input-region"
            />
          </div>
          <div>
            <label>密碼</label>
            <input
              type="password"
              name="password"
              value={accountData.password}
              onChange={handleAccountChange}
              required
              className="input-region"
            />
          </div>
          <div>
            <label>確認密碼</label>
            <input
              type="password"
              name="confirmPassword"
              value={accountData.confirmPassword}
              onChange={handleAccountChange}
              required
              className="input-region"
            />
          </div>
          <button type="submit">下一步</button>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={handleSubmitPersonal}>
          <div>
            <label>姓名</label>
            <input
              type="text"
              name="name"
              value={personalData.name}
              onChange={handlePersonalChange}
              required
              className="input-region"
            />
          </div>
          <div>
            <label>手機</label>
            <input
              type="text"
              name="phone"
              value={personalData.phone}
              onChange={handlePersonalChange}
              required
              className="input-region"
            />
          </div>
          <button type="button" onClick={() => setStep(1)}>
            上一步
          </button>
          <button type="submit">下一步</button>
        </form>
      )}

      {step === 3 && (
        <div>
          <h3>確認資訊</h3>
          <p>帳號: {accountData.email}</p>
          <p>姓名: {personalData.name}</p>
          <p>手機: {personalData.phone}</p>
          <button
            onClick={() => {
              alert('註冊完成')
              navigate('/login') // 導向到登入頁面
            }}
          >
            確認註冊
          </button>
          <button type="button" onClick={() => setStep(2)}>
            上一步
          </button>
        </div>
      )}
    </div>
  )
}

export default Registration

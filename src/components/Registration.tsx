import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
// import AuthService from '../services/auth-services' // Removed import

// API requests will use the proxy defined in package.json

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
    setStep(2)
  }

  const handleSubmitPersonal = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    const registrationData = {
      email: accountData.email,
      password: accountData.password,
      username: personalData.name,
      role: 'user', // Default role
      phone_number: personalData.phone,
    }

    try {
      const response = await fetch('/auth/', { // Using relative path which will be proxied to backend
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registrationData),
      })

      if (!response.ok) {
        const errorText = await response.text() // Get error text from backend
        // Attempt to parse as JSON if backend sends structured error, otherwise use text
        try {
          const errorJson = JSON.parse(errorText);
          throw new Error(errorJson.detail || errorJson.message || errorText); // Use detail or message if available
        } catch (parseError) {
          throw new Error(errorText || '註冊失敗，請檢查您的資料');
        }
      }

      const responseData = await response.json() // Assuming backend returns JSON on success
      
      setSuccess(`用户 ${responseData.username || registrationData.username} 注册成功!`)
      setStep(3)

    } catch (err: any) {
      if (err instanceof Error) {
        setError(err.message || '註冊時發生未知錯誤');
      } else {
        setError('註冊時發生未知錯誤');
      }
      console.error('Registration failed:', err);
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

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

  const handleSubmitPersonal = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    // 驗證 email 格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(accountData.email)) {
      setError('請輸入有效的電子郵件地址')
      return
    }

    // 驗證電話號碼格式（台灣手機號碼格式）
    const phoneRegex = /^09\d{8}$/
    if (!phoneRegex.test(personalData.phone)) {
      setError('請輸入有效的手機號碼（格式：0912345678）')
      return
    }

    // 檢查密碼和確認密碼是否一致
    if (accountData.password !== accountData.confirmPassword) {
      setError('密碼與確認密碼不一致')
      return
    }

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
        let backendErrorMessage = '註冊失敗，請檢查您的資料'; // Default message
        // Try to parse JSON error response first
        try {
          const errorData = await response.json();
          if (errorData && (errorData.detail || errorData.message)) {
            backendErrorMessage = errorData.detail || errorData.message;
          } else if (response.statusText) { // Fallback to statusText if JSON is empty or not structured as expected
            backendErrorMessage = response.statusText;
          }
        } catch (jsonError) {
          // If response.json() fails (e.g., response is not JSON or empty), try to get raw text.
          try {
            const errorText = await response.text();
            if (errorText) {
              backendErrorMessage = errorText;
            } else if (response.statusText) { // Fallback if text is empty but statusText exists
                backendErrorMessage = response.statusText;
            }
          } catch (textError) {
            // If both parsing attempts fail, rely on response.statusText if available
            if (response.statusText) {
                backendErrorMessage = response.statusText;
            }
          }
        }

        switch (response.status) {
          case 400: // Bad Request
            setError(`輸入資料有誤 (錯誤碼 ${response.status}): ${backendErrorMessage}`);
            break;
          case 401: // Unauthorized
             setError(`未授權 (錯誤碼 ${response.status}): ${backendErrorMessage}，請檢查您的憑證。`);
            break;
          case 409: // Conflict (e.g., email or username already exists)
            setError(`註冊衝突 (錯誤碼 ${response.status}): ${backendErrorMessage} (例如：該電子郵件或用戶名可能已被註冊)`);
            break;
          case 500: // Internal Server Error
            setError(`伺服器錯誤 (錯誤碼 ${response.status}): ${backendErrorMessage}，請稍後再試`);
            break;
          default: // Other client or server errors
            setError(`註冊失敗 (錯誤碼 ${response.status}): ${backendErrorMessage}`);
        }
        return; // Stop further processing in the try block
      }

      const responseData = await response.json() // Assuming backend returns JSON on success
      
      let successMessage = `用戶 ${responseData.username || registrationData.username} 註冊成功!`
      alert(successMessage)
      navigate('/login')

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

      
          <div>
            <label>帳號</label>
            <input
              type="email"
              name="email"
              value={accountData.email}
              onChange={handleAccountChange}
              required
              className="input-region"
              placeholder='請輸入電子郵件'
            />
          </div>
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
              type="tel"
              name="phone"
              value={personalData.phone}
              onChange={handlePersonalChange}
              required
              className="input-region"
              placeholder="請輸入手機號碼（格式：0912345678）"
              pattern="09[0-9]{8}"
              minLength={10}
              maxLength={10}
              title="請輸入有效的台灣手機號碼（例如：0912345678）"
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
          
          <form onSubmit={handleSubmitPersonal}>
          <button type="submit">
            確認註冊
          </button>
          </form>
    </div>
  )
}

export default Registration

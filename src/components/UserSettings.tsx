// src/components/UserSettings.tsx
import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'

const UserSettings: React.FC = () => {
  // Destructure all relevant fields from useAuth, including phone_number if available
  const { username, email, phone_number, userId, role, login, jwtToken } = useAuth()
  
  const [currentName, setCurrentName] = useState<string>(username || '')
  // Initialize phone from AuthContext if available, otherwise fallback to localStorage, then empty string
  const [phone, setPhone] = useState<string>(phone_number || '')
  

  useEffect(() => {
    setCurrentName(username || '')
  }, [username])

  // Effect to update phone state if authPhoneNumber changes
  useEffect(() => {
    setPhone(phone_number || '')
  }, [phone_number])

  const handleSaveChanges = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!jwtToken || !role || !userId) { // Added userIdToUse check
      alert('未找到有效的登入資訊，請重新登入。')
      return
    }

    try {
      const response = await fetch(`/auth/`, { // Using relative path - reverted from /auth/
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${jwtToken}`, 
        },
        body: JSON.stringify({
          username: currentName,
          phone_number: phone,
          role: role,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: '更新失敗，且無法解析錯誤資訊。' }))
        throw new Error(errorData.message || '更新失敗')
      }

      const updatedUser = await response.json() 
      login(
        jwtToken,   
        email || '', // email is non-editable, use existing email from context/localStorage
        currentName, 
        role, 
        phone,
        userId // Use the existing userId
      )

      alert('資訊更新成功')
    } catch (error: any) {
      console.error('更新失敗:', error) // Keep console.error for debugging developer-side
      alert(`更新失敗: ${error.message}`)
    }
  }
  return (
    <div
      style={{
        maxWidth: '600px',
        margin: '50px auto',
        padding: '20px',
        border: '1px solid #ccc',
        borderRadius: '10px',
        backgroundColor: '#fff',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      }}
    >
      <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>使用者設定</h2>
      <form onSubmit={handleSaveChanges}>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>
            電子郵件
          </label>
          <input
            type="email"
            value={email || ''} 
            disabled 
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '5px',
              border: '1px solid #ccc',
              backgroundColor: '#f9f9f9',
              cursor: 'not-allowed',
            }}
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>姓名</label>
          <input
            type="text"
            value={currentName}
            onChange={(e) => setCurrentName(e.target.value)}
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '5px',
              border: '1px solid #ccc',
            }}
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>
            手機號碼
          </label>
          <input
            type="text"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            minLength={10}
            maxLength={10}
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '5px',
              border: '1px solid #ccc',
            }}
          />
        </div>

        <button
          type="submit"
          style={{
            width: '100%',
            padding: '10px',
            backgroundColor: '#007BFF',
            color: '#fff',
            border: 'none',
            borderRadius: '5px',
            fontSize: '16px',
          }}
        >
          儲存
        </button>
      </form>

      {/* <div style={{ marginTop: '20px', textAlign: 'center' }}> */}
      {/*   <a */}
      {/*     href="/settings/change-password" */}
      {/*     style={{ */}
      {/*       color: '#007BFF', */}
      {/*       textDecoration: 'none', */}
      {/*     }} */}
      {/*   > */}
      {/*     修改密碼 */}
      {/*   </a> */}
      {/* </div> */}
    </div>
  )
}

export default UserSettings

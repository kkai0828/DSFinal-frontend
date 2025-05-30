import React, { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useParams, useNavigate, Link } from 'react-router-dom'

// Consistent Ticket interface based on API responses
interface TicketInfo {
  id: string
  activity_id: string
  seat_number: number | string // API might return string or number
  status: string // e.g., "UNPAID", "SOLD"
  // Add other fields if your /tickets/:id API returns them, e.g., user_id, create_at
}

// Activity details interface (can be shared or defined locally)
interface ActivityDetails {
  id: string
  title: string
  price: number
  // Add other fields if needed, e.g., cover_image, start_time
}

const PaymentPage: React.FC = () => {
  const { id: routeParamId } = useParams<{ id: string }>()
  const ticketId = routeParamId

  const { jwtToken, username, phone_number } = useAuth()
  const navigate = useNavigate()

  const [ticket, setTicket] = useState<TicketInfo | null>(null)
  const [activity, setActivity] = useState<ActivityDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [paymentProcessing, setPaymentProcessing] = useState(false)

  // Mock card details - keeping them disabled as per current UI
  const [cardNumber, setCardNumber] = useState(['1234', '5678', '9012', '3456'])
  const [cvv, setCvv] = useState('123')
  const [expiryMonth, setExpiryMonth] = useState('01')
  const [expiryYear, setExpiryYear] = useState('27')

  useEffect(() => {
    const fetchDetails = async () => {
      if (!ticketId) {
        setError(`錯誤：URL中未提供有效的票據ID (路径参数名为 'id'，解析得到: ${ticketId})`)
        setLoading(false)
        return
      }
      if (!jwtToken) {
        setError('用戶未認證，無法進行操作。')
        setLoading(false)
        return
      }
      
      setLoading(true)
      setError(null)
      setTicket(null)
      setActivity(null)

      try {
        const ticketResponse = await fetch(`/tickets/${ticketId}`, {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${jwtToken}` },
        })

        if (!ticketResponse.ok) {
          const errText = await ticketResponse.text()
          throw new Error(`無法獲取票據詳情 (ID: ${ticketId}, 狀態: ${ticketResponse.status}): ${errText}`)
        }
        const ticketData: TicketInfo = await ticketResponse.json()
        setTicket(ticketData)

        if (ticketData && ticketData.activity_id) {
          const normalizedStatus = typeof ticketData.status === 'string' ? ticketData.status.trim().toUpperCase() : ''

          if (normalizedStatus !== 'UNPAID') {
            if (!error) {
              setError(`此票券 (ID: ${ticketId}) 狀態為 ${normalizedStatus} (原始值: "${ticketData.status}")，無法進行支付。`)
            }
          }
          
          const activityResponse = await fetch(`/activities/${ticketData.activity_id}`, {
            method: 'GET',
          })
          if (!activityResponse.ok) {
            const errText = await activityResponse.text()
          } else {
            const activityDataFromServer = await activityResponse.json()
            const activityToSet = activityDataFromServer.activity || activityDataFromServer
            setActivity(activityToSet)
          }
        } else if (ticketData) {
        }
      } catch (err: any) {
        setError(err.message || '獲取頁面數據時發生錯誤 Catch Block。')
      } finally {
        setLoading(false)
      }
    }

    if (ticketId) {
      fetchDetails()
    } else {
      setError(`錯誤：票據ID在useEffect觸發時無效 (可能是路由問題)。解析得到的ID: ${ticketId}`)
      setLoading(false)
    }
  }, [ticketId, jwtToken, error])

  const handleCardInput = (index: number, value: string) => {
    if (/^\d{0,4}$/.test(value)) {
      const updatedCardNumber = [...cardNumber]
      updatedCardNumber[index] = value
      setCardNumber(updatedCardNumber)
    }
  }

  const handlePayment = async () => {
    if (!ticketId || !jwtToken) {
      setError('無法處理支付：缺少票據ID或用戶認證。')
      return
    }
    if (!ticket || (typeof ticket.status === 'string' ? ticket.status.trim().toUpperCase() : '') !== 'UNPAID') {
      alert('此票券不處於可支付狀態。')
      if (!error && ticket) setError(`票券狀態為 ${ticket.status.toUpperCase()}，無法支付。`)
      else if (!error && !ticket) setError('票券資訊遺失，無法支付。')
      return
    }

    if (cardNumber.some((num) => num.length < 4) || !cvv || !expiryMonth || !expiryYear) {
      alert('請填寫完整的信用卡信息（此為模擬，欄位已禁用）。')
      return
    }

    setPaymentProcessing(true)
    setError(null)

    try {
      const response = await fetch(`/tickets/buy`, { 
        method: 'POST',
        headers: {
          'Content-Type': 'application/json', 
          'Authorization': `Bearer ${jwtToken}`,
        },
        body: JSON.stringify({ ticket_id: ticketId }), 
      })

      if (response.ok) {
        alert('付款成功！')
        navigate(`/myTicket`) 
      } else {
        const errorData = await response.json().catch(() => ({ detail: '付款失敗，請重試。' }))
        throw new Error(errorData.detail || `付款失敗 (${response.status})`)
      }
    } catch (err: any) {
      setError(err.message || '付款處理過程中發生錯誤。')
    } finally {
      setPaymentProcessing(false)
    }
  }

  const canPay = !error && ticket && (typeof ticket.status === 'string' ? ticket.status.trim().toUpperCase() : '') === 'UNPAID'

  if (loading) {
    return <div style={styles.centeredMessage}>正在加載付款信息... (Ticket ID: {ticketId || "未指定"})</div>
  }

  if (error && !ticket) {
    return (
      <div style={styles.centeredMessage}>
        <p style={styles.errorMessageText}>錯誤: {error}</p>
        <Link to="/my-tickets" style={styles.buttonLink}>返回我的訂單</Link>
      </div>
    )
  }

  if (!ticket) {
    return <div style={styles.centeredMessage}>找不到票據信息或票據ID無效 (嘗試的ID: {ticketId || "未提供"})。請返回並重試。</div>
  }

  // UI part - largely kept as is, with data from new state variables
  return (
    <div style={styles.container}>
      <h2 style={styles.header}>安全支付</h2>
      
      {error && (
        <div style={{padding: '10px', backgroundColor: '#f8d7da', color: '#721c24', border: '1px solid #f5c6cb', borderRadius: '5px', marginBottom: '15px', textAlign: 'center'}}>
          注意: {error}
        </div>
      )}

      <div style={styles.summaryBox}>
        <h3>訂單摘要</h3>
        <p><strong>票券 ID:</strong> {ticket.id}</p>
        {activity && (
          <>
            <p><strong>活動:</strong> {activity.title}</p>
            <p><strong>價格:</strong> NT$ {activity.price}</p>
          </>
        )}
        {!activity && ticket && (
             <p>活動資訊載入中或無法顯示...</p>
        )}
        <p><strong>座位號碼:</strong> {String(ticket.seat_number)}</p>
        <p><strong>狀態:</strong> <span style={{ color: (typeof ticket.status === 'string' ? ticket.status.trim().toUpperCase() : '') === 'UNPAID' ? 'red' : 'green' }}>
          {(typeof ticket.status === 'string' ? ticket.status.trim().toUpperCase() : '未知')}
          </span></p>
      </div>

      <div style={styles.summaryBox}>
        <h3>付款信息（模擬）</h3>
        <p><strong>用戶名:</strong> {username}</p>
        <p><strong>電話:</strong> {phone_number}</p>
        {/* Mock Credit Card Form - Kept disabled */}
        <div style={{ marginTop: '20px' }}>
          <label>
            信用卡卡號 (模擬)
            <div style={{ display: 'flex', padding: '4px', gap: '5px' }}>
              {cardNumber.map((num, index) => (
                <input disabled key={index} type="text" value={num} maxLength={4}
                  onChange={(e) => handleCardInput(index, e.target.value)}
                  style={{ width: '40px', padding: '4px', textAlign: 'center' }}
                />
              ))}
            </div>
          </label>
          <label style={{ display: 'block', marginTop: '10px' }}>
            信用卡檢查碼 (模擬)
            <div>
              <input disabled type="text" placeholder="xxx" value={cvv}
                onChange={(e) => /^\d{0,3}$/.test(e.target.value) && setCvv(e.target.value)}
                style={{ width: '40px', padding: '4px', margin: '5px' }}
              />
            </div>
          </label>
          <label style={{ display: 'block', marginTop: '10px' }}>
            信用卡到期日期 (模擬)
            <div style={{ display: 'flex', gap: '10px', padding: '4px' }}>
              <input disabled type="text" placeholder="MM" value={expiryMonth}
                onChange={(e) => /^\d{0,2}$/.test(e.target.value) && setExpiryMonth(e.target.value)}
                style={{ width: '40px', padding: '4px', textAlign: 'center' }}
              />
              <input disabled type="text" placeholder="YY" value={expiryYear}
                onChange={(e) => /^\d{0,4}$/.test(e.target.value) && setExpiryYear(e.target.value)}
                style={{ width: '40px', padding: '4px', textAlign: 'center' }}
              />
            </div>
          </label>
        </div>
      </div>

      <button
        onClick={handlePayment}
        disabled={paymentProcessing || !canPay}
        style={paymentProcessing || !canPay ? {...styles.button, ...styles.disabledButton} : styles.button}
      >
        {paymentProcessing ? '付款處理中...' : '確認付款 (模擬)'}
      </button>
    </div>
  )
}

// Basic styles - consider moving to a CSS file or using a styling library
const styles: { [key: string]: React.CSSProperties } = {
  container: { padding: '20px', maxWidth: '600px', margin: '40px auto', fontFamily: 'Arial, sans-serif', background: '#f9f9f9', borderRadius: '8px', boxShadow: '0 0 15px rgba(0,0,0,0.1)' },
  header: { textAlign: 'center' as 'center', color: '#333', marginBottom: '30px' },
  summaryBox: { background: 'white', padding: '20px', marginBottom: '20px', borderRadius: '6px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' },
  button: { display: 'block', width: '100%', padding: '12px', fontSize: '1rem', fontWeight: 'bold', color: 'white', background: '#28a745', border: 'none', borderRadius: '5px', cursor: 'pointer', transition: 'background-color 0.2s ease' },
  disabledButton: { background: '#ccc', cursor: 'not-allowed' },
  centeredMessage: { display: 'flex', flexDirection: 'column' as 'column', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 160px)', textAlign: 'center' as 'center', padding: '20px' },
  errorMessageText: { color: 'red', marginBottom: '15px' },
  buttonLink: { padding: '10px 20px', background: '#007bff', color: 'white', textDecoration: 'none', borderRadius: '5px' }
  // Add other styles from the original file if needed (cardNumber, cvv, etc. for the form, if it becomes active)
}

export default PaymentPage

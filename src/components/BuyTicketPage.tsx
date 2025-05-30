import React, { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { formatDate } from '../context/kits'

const MAX_TICKETS_PER_USER = 4

interface ActivityDetails {
  id: string
  title: string
  start_time: string
  end_time: string
  price: number
  cover_image: string
}

// Assuming Ticket interface similar to myTicket.tsx for reserved tickets
interface ReservedTicket {
  id: string; // This will be the ticket_id for the /buy call
  user_id: string;
  activity_id: string;
  status: string; // e.g., "RESERVED", "UNPAID"
  // other fields like seat_number, create_at might also be present
}

const BuyTicketPage: React.FC = () => {
  const { id: activityId } = useParams<{ id: string }>()
  const { jwtToken, userId } = useAuth()
  const navigate = useNavigate()

  const [activity, setActivity] = useState<ActivityDetails | null>(null)
  const [quantity, setQuantity] = useState<number>(1)
  const [totalPrice, setTotalPrice] = useState<number>(0)

  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const [purchaseLoading, setPurchaseLoading] = useState<boolean>(false)
  const [purchaseError, setPurchaseError] = useState<string | null>(null)

  // Effect to fetch activity details
  useEffect(() => {
    if (!jwtToken) {
      setError('請先登入才能購票。')
      setLoading(false)
      setActivity(null)
      return
    }

    if (!activityId) {
      setError('無效的活動 ID。')
      setLoading(false)
      setActivity(null)
      return
    }

    const fetchActivityDetails = async () => {
      setLoading(true)
      setError(null)
      setActivity(null)

      try {
        const response = await fetch(`/activities/${activityId}`)
        if (!response.ok) {
          let errorDetail = `無法獲取活動詳情 (${response.status})`
          try {
            const errorData = await response.json()
            errorDetail = errorData.detail || errorDetail
          } catch (jsonError) {
            errorDetail = response.statusText ? `${errorDetail}: ${response.statusText}` : errorDetail
          }
          throw new Error(errorDetail)
        }
        const data: ActivityDetails = await response.json()
        if (data && data.id) {
          setActivity(data)
        } else {
          throw new Error('獲取的活動資料格式不正確或不完整。')
        }
      } catch (err: any) {
        console.error('獲取活動詳情失敗:', err)
        setError(err.message || '獲取活動數據時發生嚴重錯誤。')
        setActivity(null)
      } finally {
        setLoading(false)
      }
    }

    fetchActivityDetails()
  }, [activityId, jwtToken])

  // Effect to calculate total price
  useEffect(() => {
    if (activity && activity.price && quantity > 0) {
      setTotalPrice(activity.price * quantity)
    } else {
      setTotalPrice(0)
    }
  }, [activity, quantity])

  const handleQuantityChange = useCallback((amount: number) => {
    setQuantity(currentQuantity => {
      const newQuantity = currentQuantity + amount
      if (newQuantity >= 1 && newQuantity <= MAX_TICKETS_PER_USER) {
        return newQuantity
      }
      return currentQuantity
    })
  }, [])

  const handleSubmitPurchase = async () => {
    if (!jwtToken || !userId || !activityId || !activity || quantity <= 0) {
      setPurchaseError('訂單資訊不完整，請確認活動詳情、購買數量，並確保您已登入。')
      return
    }

    setPurchaseLoading(true)
    setPurchaseError(null)

    try {
      // Step 1: Reserve tickets
      const reserveResponse = await fetch('/tickets/reserve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${jwtToken}`,
        },
        body: JSON.stringify({
          user_id: userId, // Sending userId as backend /tickets/reserve expects it
          activity_id: activityId,
          num_tickets: quantity,
        }),
      })

      if (!reserveResponse.ok) {
        const errorData = await reserveResponse.json().catch(() => ({}))
        throw new Error(errorData.detail || `預訂票券失敗 (${reserveResponse.status})`)
      }

      const reservedTickets: ReservedTicket[] = await reserveResponse.json()

      if (!reservedTickets || reservedTickets.length === 0) {
        throw new Error('預訂成功，但未收到有效的票券資訊。')
      }

      // If reserve operation was successful
      alert(`成功預訂 ${quantity} 張票！\n活動：${activity.title}\n請前往「我的訂單」完成付款。`)
      navigate('/myTicket') // Navigate to user's tickets page to see unpaid tickets

    } catch (err: any) {
      console.error('票券預訂過程中發生錯誤:', err) // Changed error message slightly
      setPurchaseError(err.message || '票券預訂失敗，請稍後再試或聯繫客服。')
    } finally {
      setPurchaseLoading(false)
    }
  }

  if (!jwtToken) {
    navigate('/login')
  }
  if (loading) {
    return (
      <div className="loading-container" style={styles.centeredMessage}>
        <div className="loading-spinner"></div>
        <p className="mt-3">載入活動資訊中...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="error-message bg-light p-4 text-center rounded" style={styles.centeredMessage}>
        <p className="text-danger">{error}</p>
        <Link to="/" className="btn-primary mt-3">返回首頁</Link>
        {!jwtToken && activityId && (
          <Link to={`/login?redirect=/buy-ticket/${activityId}`} className="btn-secondary mt-3 ms-2">
            前往登入
          </Link>
        )}
      </div>
    )
  }

  if (!activity) {
    return (
      <div className="error-message bg-light p-4 text-center rounded" style={styles.centeredMessage}>
        <p>無法載入活動資料，或指定的活動不存在。</p>
        <Link to="/" className="btn-primary mt-3">返回首頁</Link>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      <p style={styles.breadcrumb}>
        <Link to="/">首頁</Link> / 
        <Link to={`/activity/${activityId}`}>{activity.title || '活動詳情'}</Link> / 
        購票
      </p>
      
      <div style={styles.card}>
        <img 
          src={activity.cover_image} 
          alt={activity.title} 
          style={styles.image}
        />
        <h1 style={styles.title}>{activity.title}</h1>
        <p style={styles.detailItem}>
          <strong>活動時間：</strong>
          {formatDate(activity.start_time)} - {formatDate(activity.end_time)}
        </p>
        <p style={styles.detailItem}>
          <strong>單張票價：</strong>NT$ {activity.price}
        </p>
      </div>

      <div style={styles.card}>
        <h2 style={{ textAlign: 'center' as 'center', marginBottom: '20px' }}>選擇數量</h2>
        <div style={styles.quantityControl}>
          <button 
            onClick={() => handleQuantityChange(-1)} 
            disabled={quantity <= 1 || purchaseLoading}
            style={styles.quantityButton}
          >
            -
          </button>
          <span style={styles.quantityDisplay}>{quantity}</span>
          <button 
            onClick={() => handleQuantityChange(1)} 
            disabled={quantity >= MAX_TICKETS_PER_USER || purchaseLoading}
            style={styles.quantityButton}
          >
            +
          </button>
        </div>
        <p style={{ fontSize: '0.9em', color: '#777', textAlign: 'center' as 'center' }}>
          每帳號限購 {MAX_TICKETS_PER_USER} 張票
        </p>
      </div>

      <div style={styles.card}>
        <div style={styles.totalPrice}>
          總金額：NT$ {totalPrice}
        </div>
        <button 
          onClick={handleSubmitPurchase} 
          disabled={purchaseLoading || quantity <= 0 || !activity.price}
          style={purchaseLoading || !activity.price ? {...styles.button, ...styles.disabledButton} : styles.button}
        >
          {purchaseLoading ? '訂單處理中...' : '確認購買'}
        </button>
        {purchaseError && <p style={styles.errorMessage}>{purchaseError}</p>}
      </div>
    </div>
  )
}

const styles: { [key: string]: React.CSSProperties } = {
  container: { 
    padding: '20px', 
    maxWidth: '700px', 
    margin: '40px auto',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
  },
  card: { 
    border: '1px solid #e0e0e0',
    borderRadius: '8px', 
    padding: '25px',
    marginBottom: '25px', 
    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
    backgroundColor: '#ffffff'
  },
  image: { 
    width: '100%', 
    maxHeight: '350px',
    objectFit: 'cover', 
    borderRadius: '6px',
    marginBottom: '20px',
    border: '1px solid #eee'
  },
  title: { 
    fontSize: '1.75rem',
    fontWeight: '600',
    marginBottom: '15px',
    color: '#333'
  },
  detailItem: { 
    marginBottom: '10px', 
    fontSize: '1rem',
    lineHeight: '1.6',
    color: '#555'
  },
  quantityControl: { 
    display: 'flex', 
    alignItems: 'center', 
    margin: '20px 0', 
    justifyContent: 'center' 
  },
  quantityButton: { 
    fontSize: '1.2rem', 
    padding: '8px 18px',
    margin: '0 12px', 
    cursor: 'pointer', 
    border: '1px solid #ccc', 
    borderRadius: '4px', 
    background: '#f8f8f8',
    color: '#333',
    transition: 'background-color 0.2s ease, box-shadow 0.2s ease'
  },
  quantityDisplay: { 
    fontSize: '1.2rem', 
    fontWeight: '500',
    minWidth: '40px',
    textAlign: 'center' as 'center',
    color: '#333'
  },
  totalPrice: { 
    fontSize: '1.5rem', 
    fontWeight: '600', 
    color: '#1a73e8',
    textAlign: 'right' as 'right', 
    margin: '20px 0' 
  },
  button: { 
    display: 'block', 
    width: '100%', 
    padding: '14px',
    fontSize: '1.1rem',
    fontWeight: '600', 
    color: 'white', 
    background: '#007bff',
    border: 'none', 
    borderRadius: '5px', 
    cursor: 'pointer', 
    textAlign: 'center' as 'center',
    transition: 'background-color 0.2s ease, transform 0.1s ease'
  },
  disabledButton: { 
    background: '#adb5bd',
    cursor: 'not-allowed',
  },
  errorMessage: { 
    color: '#dc3545',
    marginTop: '15px', 
    textAlign: 'center' as 'center',
    fontSize: '0.95rem'
  },
  breadcrumb: { 
    marginBottom: '25px', 
    color: '#6c757d',
    fontSize: '0.9rem'
  },
  centeredMessage: {
    display: 'flex',
    flexDirection: 'column' as 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 'calc(100vh - 160px)',
    textAlign: 'center' as 'center',
    padding: '20px'
  }
}

export default BuyTicketPage

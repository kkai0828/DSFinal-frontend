import React, { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { listArena } from '../context/kits'
import { formatDate } from '../context/kits'

interface Arena {
  id: string
  title: string
  address: string
  capacity: number
}


interface Activity {
  id: string
  on_sale_date: string
  start_time: string
  end_time: string
  price: number
  title: string
  content: string
  cover_image: string
  arena_id: string
  creator_id: string
  is_archived: boolean
}

const ActivityPage: React.FC = () => {
  const { id: activityId } = useParams<{ id: string }>()
  const { jwtToken } = useAuth()
  const navigate = useNavigate()

  const [title, setTitle] = useState('')
  const [price, setPrice] = useState<number | undefined>(undefined)
  const [content, setContent] = useState('')
  const [on_sale_date, setOnSaleDate] = useState('')
  const [start_time, setStartTime] = useState('')
  const [end_time, setEndTime] = useState('')
  const [cover_image, setCoverImg] = useState('')
  const [arena_id, setArenaId] = useState('')
  
  const [arenas, setArenas] = useState<Arena[]>([])
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [triggerFetchCount, setTriggerFetchCount] = useState(0);

    useEffect(() => {
    // console.log('activityId', activityId)

    const fetchActivityDetails = async () => {
      if (!activityId) {
        setError('活動 ID 無效')
        setLoading(false)
        return
      }
      setLoading(true)
      setError(null); // Reset error before fetching
      try {
        const response = await fetch(`/activities/${activityId}`)
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ detail: response.statusText }))
          let detailError = errorData.detail || `無法獲取活動詳情: ${response.status}`;
          if (response.status === 404) {
            detailError = `活動 (ID: ${activityId}) 不存在或已被刪除。`;
          }
          setError(detailError);
          // Clear data states
          setTitle(''); setContent(''); setPrice(undefined); setOnSaleDate(''); setStartTime(''); setEndTime(''); setCoverImg(''); setArenaId(''); setImagePreview(null); 
          return; 
        }
        const data: Activity = await response.json()
        // console.log('data', data)

        if (!data || !data.title) {
            setError(`活動 (ID: ${activityId}) 資料不完整或格式錯誤。`);
            setTitle(''); setContent(''); setPrice(undefined); setOnSaleDate(''); setStartTime(''); setEndTime(''); setCoverImg(''); setArenaId(''); setImagePreview(null); 
            return;
        }
        
        const formatToInputDateTime = (isoDateTime: string | undefined) => {
          if (!isoDateTime) return ''
          const dateObj = new Date(isoDateTime)
          if (isNaN(dateObj.getTime())) return ''
          const year = dateObj.getFullYear()
          const month = String(dateObj.getMonth() + 1).padStart(2, '0')
          const day = String(dateObj.getDate()).padStart(2, '0')
          const hours = String(dateObj.getHours()).padStart(2, '0')
          const minutes = String(dateObj.getMinutes()).padStart(2, '0')
          return `${year}-${month}-${day}T${hours}:${minutes}`
        }

        setTitle(data.title || '')
        setContent(data.content || '')
        setPrice(data.price === null || data.price === undefined ? undefined : Number(data.price))
        setOnSaleDate(formatToInputDateTime(data.on_sale_date))
        setStartTime(formatToInputDateTime(data.start_time))
        setEndTime(formatToInputDateTime(data.end_time))
        setCoverImg(data.cover_image || '')
        if (data.cover_image) {
          setImagePreview(data.cover_image)
        } else {
          setImagePreview(null); // Clear preview if no image
        }
        setArenaId(data.arena_id || '')

      } catch (err: any) {
        console.error('獲取活動詳情失敗:', err)
        setError(err.message || '獲取活動數據時發生錯誤')
        // Clear data states
        setTitle(''); setContent(''); setPrice(undefined); setOnSaleDate(''); setStartTime(''); setEndTime(''); setCoverImg(''); setArenaId(''); setImagePreview(null); 
      } finally {
        setLoading(false)
      }
    }

    if (jwtToken) { 
      listArena(setArenas)
      fetchActivityDetails()
    } else {
      setError("您可能需要登入才能查看此活動的完整內容。");
      setLoading(false)
      // Clear data states if not logged in
      setTitle(''); setContent(''); setPrice(undefined); setOnSaleDate(''); setStartTime(''); setEndTime(''); setCoverImg(''); setArenaId(''); setImagePreview(null); 
    }
  }, [activityId, jwtToken, triggerFetchCount])
  

  // 購票頁面導航
  const handleBuyTicket = () => {
    navigate(`/buy-ticket/${activityId}`) // 假設購票頁面的路徑是 /buy-ticket/活動ID
  }

  const handleRetry = () => {
    setTriggerFetchCount(prev => prev + 1);
  };

  // Loading state
  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p className="mt-3">載入中...</p>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="error-message bg-light p-4 text-center rounded">
        <p className="text-danger">{error}</p>
        <div className="mt-3">
          <button 
            onClick={handleRetry} 
            className="btn-primary me-2" // Added margin for spacing
          >
            重試
          </button>
          <Link to="/" className="btn-secondary">
            返回首頁
          </Link>
        </div>
      </div>
    )
  }

  // If activity data is not loaded successfully after loading is false and no error (e.g. API returned empty or invalid data)
  // We check for title as a proxy for successful data load. Could be any essential field.
  if (!title) {
    return (
      <div className="error-message bg-light p-4 text-center rounded">
        <p>無法載入活動內容，或活動已被移除。</p>
        <Link to="/" className="btn-primary mt-3">
          返回首頁
        </Link>
      </div>
    )
  }

  // Format dates for display
  const eventDate = formatDate(start_time);
  const eventEndDate = formatDate(end_time);
  const onSaleDate = formatDate(on_sale_date);
  
  // Check if ticket is on sale
  const isOnSale = new Date(on_sale_date) <= new Date();
  
  // Get lowest and highest price
  const lowestPrice = price;
  const highestPrice = price;

  return (
    <div className="activity-page">
      {/* Breadcrumb */}
      <div className="breadcrumb mb-4">
        <p>首頁 / 活動資訊 / {title}</p>
      </div>
      
      {/* Hero Section */}
      <div className="activity-hero mb-5">
        <div className="activity-hero-image">
          <img src={cover_image} alt={title} />
        </div>
      </div>
      
      {/* Main Content Grid */}
      <div className="activity-content">
        {/* Event Details */}
        <div className="activity-main">
          <h1 className="activity-title">{title}</h1>
          
          {/* Event Info */}
          <div className="event-info-box mb-4">
            <div className="event-info-item">
              <div className="info-icon">📅</div>
              <div className="info-content">
                <div className="info-label">活動時間</div>
                <div className="info-value">
                  {eventDate === eventEndDate ? eventDate : `${eventDate} ~ ${eventEndDate}`}
                </div>
              </div>
            </div>
            
            <div className="event-info-item">
              <div className="info-icon">📍</div>
              <div className="info-content">
                <div className="info-label">活動地點</div>
                <div className="info-value">
                  {arenas.find(arena => arena.id === arena_id)?.title}
                </div>
                <div className="info-address">{arenas.find(arena => arena.id === arena_id)?.address}</div>
              </div>
            </div>
            
            <div className="event-info-item">
              <div className="info-icon">🎫</div>
              <div className="info-content">
                <div className="info-label">開賣時間</div>
                <div className="info-value">
                  {onSaleDate}
                </div>
                <div className="ticket-status">
                  {isOnSale ? (
                    <span className="status-onsale">現正熱賣中</span>
                  ) : (
                    <span className="status-upcoming">即將開賣</span>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          
          {/* Event Description */}
          <div className="event-description mb-4">
            <h3 className="section-title">活動說明</h3>
            <div className="description-content">
                {content}
            </div>
          </div>
          
          {/* Venue Information */}
          <div className="venue-information mb-4">
            <h3 className="section-title">場地資訊</h3>
            <div className="venue-details">
              <h4>{arenas.find(arena => arena.id === arena_id)?.title}</h4>
              <p>{arenas.find(arena => arena.id === arena_id)?.address}</p>
              <p>容納人數：{arenas.find(arena => arena.id === arena_id)?.capacity}人</p>
            </div>
          </div>
          
          {/* Social Sharing */}
          <div className="social-sharing">
            <h3 className="section-title">分享活動</h3>
            <div className="social-buttons">
              <button className="social-button facebook">Facebook</button>
              <button className="social-button twitter">Twitter</button>
              <button className="social-button line">Line</button>
              <button className="social-button copy">複製連結</button>
            </div>
          </div>
        </div>
        
        {/* Sidebar */}
        <div className="activity-sidebar">
          <div className="ticket-info-card">
            <div className="ticket-price">
              <span className="price-label">票價</span>
              <span className="price-range">
                {lowestPrice === highestPrice 
                  ? `NT$ ${lowestPrice}` 
                  : `NT$ ${lowestPrice} ~ ${highestPrice}`
                }
              </span>
            </div>
            
            
              {jwtToken ? (
              <button 
                onClick={handleBuyTicket} 
                className="btn-buy-ticket"
                disabled={!isOnSale}
              >
                {isOnSale ? '立即購票' : '尚未開賣'}
              </button>
            ) : (
              <Link to="/login" className="btn-login-to-buy">
                登入後購票
              </Link>
            )}
            
            <div className="additional-info mt-3">
              <p className="info-note">
                <span className="note-icon">ℹ️</span> 每帳號限購4張票
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ActivityPage


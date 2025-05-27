import React, { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { getArena } from '../context/kits'
import { formatDate } from '../context/kits'

const API_URL = process.env.REACT_APP_API_URL

interface Arena {
  _id: string
  title: string
  address: string
  capacity: number
}

interface Region {
  region_name: string
  region_price: number
  region_capacity: number
}

interface Activity {
  _id: string
  on_sale_date: string
  start_time: string
  end_time: string
  title: string
  content: string
  cover_img: { type: string; data: number[] }
  price_level_img: { type: string; data: number[] }
  arena_id: string
  creator_id: string
  is_archived: boolean
  regions: Region[]
  category?: string // Optional for categorization
}

const ActivityPage: React.FC = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isLoggedIn } = useAuth()
  const [activity, setActivity] = useState<Activity | null>(null)
  const [arena, setArena] = useState<Arena | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchActivity = async (id: string) => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch(`${API_URL}/activities/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      if (response.ok) {
        const data = await response.json()
        setActivity(data.activity)
        getArena(setArena, data.activity.arena_id)
      } else {
        console.error('Failed to fetch activity:', response.statusText)
        setError('無法載入活動資訊，請稍後再試。')
      }
    } catch (error) {
      console.error('Error fetching activity:', error)
      setError('發生錯誤，請稍後再試。')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchActivity(id!)
  }, [id])

  // 購票頁面導航
  const handleBuyTicket = () => {
    navigate(`/buy-ticket/${id}`) // 假設購票頁面的路徑是 /buy-ticket/活動ID
  }

  // Loading state
  if (isLoading) {
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
        <button 
          onClick={() => fetchActivity(id!)} 
          className="btn-primary mt-3"
        >
          重新載入
        </button>
      </div>
    )
  }

  // If activity data is not loaded yet
  if (!activity) {
    return (
      <div className="error-message bg-light p-4 text-center rounded">
        <p>活動資訊不存在或已被刪除</p>
        <Link to="/" className="btn-primary mt-3">
          返回首頁
        </Link>
      </div>
    )
  }

  // Format dates for display
  const eventDate = formatDate(activity.start_time);
  const eventEndDate = formatDate(activity.end_time);
  const onSaleDate = formatDate(activity.on_sale_date);
  
  // Check if ticket is on sale
  const isOnSale = new Date(activity.on_sale_date) <= new Date();
  
  // Get lowest and highest price
  const prices = activity.regions.map(region => region.region_price);
  const lowestPrice = Math.min(...prices);
  const highestPrice = Math.max(...prices);

  return (
    <div className="activity-page">
      {/* Breadcrumb */}
      <div className="breadcrumb mb-4">
        <p>首頁 / 活動資訊 / {activity.title}</p>
      </div>
      
      {/* Hero Section */}
      <div className="activity-hero mb-5">
        <div className="activity-hero-image">
          <img src={`data:image/jpeg;base64,${activity.cover_img.data}`} alt={activity.title} />
        </div>
      </div>
      
      {/* Main Content Grid */}
      <div className="activity-content">
        {/* Event Details */}
        <div className="activity-main">
          <h1 className="activity-title">{activity.title}</h1>
          
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
                  {arena?.title}
                </div>
                <div className="info-address">{arena?.address}</div>
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
          
          {/* Price Level Image */}
          {activity.price_level_img && (
            <div className="price-level-image mb-4">
              <h3 className="section-title">座位圖</h3>
              <img 
                src={`data:image/jpeg;base64,${activity.price_level_img.data}`} 
                alt="座位圖" 
                className="img-fluid rounded"
              />
            </div>
          )}
          
          {/* Event Description */}
          <div className="event-description mb-4">
            <h3 className="section-title">活動說明</h3>
            <div className="description-content">
              {activity.content.split('\n').map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
          </div>
          
          {/* Venue Information */}
          <div className="venue-information mb-4">
            <h3 className="section-title">場地資訊</h3>
            <div className="venue-details">
              <h4>{arena?.title}</h4>
              <p>{arena?.address}</p>
              <p>容納人數：{arena?.capacity}人</p>
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
            
            <div className="ticket-regions mb-4">
              <h4 className="region-title">票區資訊</h4>
              <ul className="region-list">
                {activity.regions.map((region, index) => (
                  <li key={index} className="region-item">
                    <span className="region-name">{region.region_name}</span>
                    <span className="region-price">NT$ {region.region_price}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            {isLoggedIn ? (
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


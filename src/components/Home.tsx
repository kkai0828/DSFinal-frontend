// src/components/Home.tsx
import React, { useState, useEffect} from 'react'
import Widget from './widget'
import { useAuth } from '../context/AuthContext'


interface Activity {
  id: string
  on_sale_date: string
  start_time: string
  end_time: string
  title: string
  content: string
  price: number
  cover_image: string
  arena_id: string
  creator_id: string
  is_achieved?: boolean
  num_ticket?: number
}


const Home: React.FC = () => {
  const { jwtToken } = useAuth()
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const response = await fetch('/activities/', {
          method: 'GET',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${jwtToken}`
          },
        })

        if (response.ok) {
          const data = await response.json()
          if (Array.isArray(data)) {
            setActivities(data)
          } else if (data && Array.isArray(data.activities)) {
            setActivities(data.activities)
          } else {
            console.error('API 返回的數據格式不符合預期:', data)
            setActivities([])
            setError('無法正確解析活動數據。')
          }
        } else {
          setError('無法載入活動資訊，請稍後再試。')
          console.error('Failed to fetch activities:', response.statusText)
          setActivities([])
        }
      } catch (error) {
        setError('發生錯誤，請稍後再試。')
        console.error('Error fetching activities:', error)
        setActivities([])
      } finally {
        setLoading(false)
      }
    }

    if (jwtToken) {
      setLoading(true)
      fetchActivities()
    } else {
      setLoading(false)
      setActivities([])
    }
  }, [jwtToken])

  
  // Loading state
  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p className="mt-3">載入活動中...</p>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="error-message bg-light p-4 text-center rounded">
        <p className="text-danger">{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="btn-primary mt-3"
        >
          重新載入
        </button>
      </div>
    )
  }

  // 如果沒有 token 並且沒有加載，可以顯示一個不同的視圖或提示用戶登錄
  if (!jwtToken && !loading && !error) {
    return (
      <div className="home-page text-center">
        <div className="breadcrumb mb-3">
          <p>首頁 / 節目資訊</p>
        </div>
        <div className="hero-banner mb-5">
          <h1 className="hero-title">探索精彩活動</h1>
          <p className="hero-subtitle">
            從音樂會、戲劇表演到體育賽事，tixkraft為您帶來最好的現場體驗
          </p>
        </div>
        <p>請先<a href="/login">登入</a>以查看更多活動。</p>
        {/* 或者顯示一些公開的、不需要登錄的活動 */}
      </div>
    )
  }

  return (
    <div className="home-page">
      {/* Breadcrumb */}
      <div className="breadcrumb mb-3">
        <p>首頁 / 節目資訊</p>
      </div>

      {/* Hero Banner */}
      <div className="hero-banner mb-5">
        <h1 className="hero-title">探索精彩活動</h1>
        <p className="hero-subtitle">
          從音樂會、戲劇表演到體育賽事，tixkraft為您帶來最好的現場體驗
        </p>
      </div>
      
      {/* Featured Events Section */}
      {Array.isArray(activities) && activities.length > 0 ? (
        <section className="mb-5">
          <h2 className="section-title">精選活動</h2>
          <div className="featured-events-slider">
            {activities.map((activity) => (
              <Widget
                key={activity.id}
                id={activity.id}
                path={'activity'}
                title={activity.title}
                on_sale_date={activity.on_sale_date}
                start_date={activity.start_time}
                end_date={activity.end_time}
                imageUrl={activity.cover_image}
              />
            ))}
          </div>
        </section>
      ) : (
        !loading && !error && (
          <div className="text-center">
            <p>目前沒有精選活動，敬請期待！</p>
          </div>
        )
      )}
    </div>
  )
}

export default Home

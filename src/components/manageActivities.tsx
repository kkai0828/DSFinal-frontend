import React, { useState, useEffect, useCallback } from 'react'
import Widget from './widget'
import { useAuth } from '../context/AuthContext'


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

const ManageActivities = () => {
  const { jwtToken, role } = useAuth()
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        setLoading(true)
        const response = await fetch('/activities/list_activities/host', {
          method: 'GET',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${jwtToken}`
          },
        })

        if (response.ok) {
          const data = await response.json()
          // 假設 API 直接返回活動數組，如果不是，請根據 console.log 的結果調整
          if (Array.isArray(data)) {
            setActivities(data)
          } else if (data && Array.isArray(data.activities)) {
            setActivities(data.activities)
          } else {
            console.error('API 返回的數據格式不符合預期:', data);
            setActivities([]); // 設置為空數組以避免 map 錯誤
            setError('無法正確解析活動數據。');
          }
        } else {
          setError('無法載入活動資訊，請稍後再試。')
          console.error('Failed to fetch activities:', response.statusText)
        }
      } catch (error) {
        setError('發生錯誤，請稍後再試。')
        console.error('Error fetching activities:', error)
      } finally {
        setLoading(false)
      }
    }

    if (jwtToken) { // 只在有 token 時才獲取數據
      fetchActivities()
    }
  }, [jwtToken]) // 添加 jwtToken 到依賴數組
  if (role !== 'host') {
    return <h2>Permissions denied</h2>
  }
  return (
    <div>
      <p style={{ letterSpacing: '1.3px', color: '#666', fontSize: '14px' }}>
        管理活動
      </p>
      <div className="featured-events-slider">
        {loading && <p>載入活動中...</p>} 
        {error && <p style={{color: 'red'}}>{error}</p>}
        {!loading && !error && (!Array.isArray(activities) || activities.length === 0) && (
          <p>尚無活動</p>
        )}
        {!loading && !error && Array.isArray(activities) && activities.length > 0 && (
          activities.map((activity) => (
            <Widget
              key={activity.id}
              id={activity.id}
              path={'editActivity'}
              title={activity.title}
              on_sale_date={activity.on_sale_date}
              start_date={activity.start_time}
              end_date={activity.end_time}
              imageUrl={activity.cover_image}
            />
          ))
        )}
      </div>
    </div>
  )
}

export default ManageActivities

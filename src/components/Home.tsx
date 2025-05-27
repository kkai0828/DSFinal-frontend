// src/components/Home.tsx
import React, { useState, useEffect, useMemo } from 'react'
import Widget from './widget'
import { useAuth } from '../context/AuthContext'

const API_URL = process.env.REACT_APP_API_URL

// Interface definitions
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
  category?: string // Optional category field
  featured?: boolean // Optional featured flag
}

// Sample categories for demo with display names
const EVENT_CATEGORIES = [
  { id: 'all', name: '全部活動' },
  { id: 'concert', name: '演唱會' },
  { id: 'sports', name: '體育賽事' },
  { id: 'theater', name: '戲劇表演' },
  { id: 'exhibition', name: '展覽' },
  { id: 'seminar', name: '講座' }
];
const Home: React.FC = () => {
  const { isLoggedIn } = useAuth()
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState('all')

  // Fetch activities from API
  useEffect(() => {
    const fetchActivities = async () => {
      try {
        setLoading(true)
        const response = await fetch(`${API_URL}/activities/list`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        })

        if (response.ok) {
          const data = await response.json()
          
          // Add random categories and featured status for demo purposes
          // In a real app, these would come from the backend
          const activitiesWithCategories = data.activities.map((activity: Activity, index: number) => ({
            ...activity,
            category: EVENT_CATEGORIES[Math.floor(Math.random() * (EVENT_CATEGORIES.length - 1)) + 1].id,
            // Mark first 3 activities as featured for demonstration
            featured: index < 3
          }))
          
          setActivities(activitiesWithCategories)
          setError(null)
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

    fetchActivities()
  }, [])

  // Filter activities by category if selected
  const filteredActivities = selectedCategory === 'all'
    ? activities
    : activities.filter(activity => activity.category === selectedCategory)

  // Get featured activities
  const featuredActivities = useMemo(() => {
    return activities.filter(activity => activity.featured)
  }, [activities])

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
      
      {/* Category Filter Buttons */}
      <div className="filter-container mb-4">
        {EVENT_CATEGORIES.map(category => (
          <button
            key={category.id}
            className={`filter-button ${selectedCategory === category.id ? 'active' : ''}`}
            onClick={() => setSelectedCategory(category.id)}
          >
            {category.name}
          </button>
        ))}
      </div>
      
      {/* Featured Events Section - Only show if there are featured events and we're viewing all categories */}
      {featuredActivities.length > 0 && selectedCategory === 'all' && (
        <section className="mb-5">
          <h2 className="section-title">精選活動</h2>
          <div className="featured-events-slider">
            {featuredActivities.map((activity) => (
              <Widget
                key={activity._id}
                id={activity._id}
                path={'activity'}
                name={activity.title}
                on_sale_date={activity.on_sale_date}
                start_date={activity.start_time}
                end_date={activity.end_time}
                imageUrl={activity.cover_img}
                category={activity.category}
                featured={true}
              />
            ))}
          </div>
        </section>
      )}
      
      {/* All Events Section */}
      <section className="mb-5">
        <h2 className="section-title">
          {selectedCategory === 'all' 
            ? '所有活動' 
            : EVENT_CATEGORIES.find(c => c.id === selectedCategory)?.name || '活動'}
        </h2>
        
        {/* Empty State */}
        {filteredActivities.length === 0 && (
          <div className="empty-state bg-light p-5 text-center rounded">
            <p>尚無{selectedCategory !== 'all' ? EVENT_CATEGORIES.find(c => c.id === selectedCategory)?.name : ''}節目</p>
          </div>
        )}
        
        {/* Event Grid */}
        {filteredActivities.length > 0 && (
          <div className="event-grid">
            {filteredActivities.map((activity) => (
              <Widget
                key={activity._id}
                id={activity._id}
                path={'activity'}
                name={activity.title}
                on_sale_date={activity.on_sale_date}
                start_date={activity.start_time}
                end_date={activity.end_time}
                imageUrl={activity.cover_img}
                category={activity.category}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

export default Home

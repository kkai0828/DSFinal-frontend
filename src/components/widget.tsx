import { Link } from 'react-router-dom'
import { formatDate } from '../context/kits'
import './Widget.css'

// Category mapping for display
const CATEGORY_MAP: {[key: string]: {name: string, color: string}} = {
  concert: { name: '演唱會', color: '#e91e63' },
  sports: { name: '體育賽事', color: '#2196f3' },
  theater: { name: '戲劇表演', color: '#ff9800' },
  exhibition: { name: '展覽', color: '#4caf50' },
  seminar: { name: '講座', color: '#9c27b0' }
}

interface WidgetProps {
  id: string
  path: string
  imageUrl: { type: string; data: number[] }
  name: string
  on_sale_date: string
  start_date: string
  end_date: string
  category?: string
  featured?: boolean
}

function Widget({
  imageUrl,
  name,
  on_sale_date,
  start_date,
  end_date,
  path,
  id,
  category,
  featured = false,
}: WidgetProps) {
  // const { isLoggedIn } = useAuth() // isLoggedIn was unused

  // Format the date for display
  const dateDisplay = formatDate(start_date) === formatDate(end_date)
    ? formatDate(start_date)
    : `${formatDate(start_date)} ~ ${formatDate(end_date)}`

  // Get category information if available
  const categoryInfo = category ? CATEGORY_MAP[category] : null
  
  return (
    <Link 
      to={`/${path}/${id}`} 
      className={`widget-container ${featured ? 'widget-featured' : ''}`}
    >
      {/* Image area with overlay */}
      <div className="widget-image-container">
        <div
          className="widget-image"
          style={{ backgroundImage: `url(${imageUrl})` }}
        />
        {featured && <div className="featured-badge">精選</div>}
        
        {/* Category tag */}
        {categoryInfo && (
          <div 
            className="category-tag"
            style={{ backgroundColor: categoryInfo.color }}
          >
            {categoryInfo.name}
          </div>
        )}
      </div>

      {/* Content area */}
      <div className="widget-content">
        <p className="widget-date">{dateDisplay}</p>
        <h3 className="widget-name">{name}</h3>
        
        {/* On sale status */}
        <div className="widget-status">
          {new Date(on_sale_date) > new Date() ? (
            <span className="status-upcoming">即將開賣</span>
          ) : (
            <span className="status-onsale">現正熱賣</span>
          )}
        </div>
      </div>
    </Link>
  )
}

export default Widget


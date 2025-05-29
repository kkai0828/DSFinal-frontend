// App.tsx
import React, { useState } from 'react'
import './styles.css'
import {
  useNavigate,
  BrowserRouter as Router,
  Route,
  Routes,
  Link,
  useLocation,
} from 'react-router-dom'
import Home from './components/Home'
import Register from './components/Registration'
import Login from './components/Login'
import { AuthProvider, useAuth } from './context/AuthContext'
import Activity from './components/activity'
import CreateActivity from './components/createActivity'
import MyTicket from './components/myTicket' // 引入MyTicket组件
import UserSettings from './components/UserSettings'
import ChangePassword from './components/ChangePassword'
import BuyTicketPage from './components/BuyTicketPage'
import PaymentPage from './components/PaymentPage'
import ManageActivities from './components/manageActivities'
import EditActivity from './components/editActivity'

// Event categories for filters
const EVENT_CATEGORIES = [
  { id: 'all', name: '全部活動' }
];

// Navigation links component with active state
const NavigationLinks: React.FC = () => {
  const location = useLocation();
  const { isLoggedIn } = useAuth();
  
  // Check if the current route is active
  const isActive = (path: string) => {
    return location.pathname === path ? 'active' : '';
  };
  
  return (
    <>
      <Link to="/" className={`nav-link ${isActive('/')}`}>
        活動資訊
      </Link>
      {isLoggedIn && (
        <Link to="/myTicket" className={`nav-link ${isActive('/myTicket')}`}>
          我的訂單
        </Link>
      )}
      <HostLink />
    </>
  );
};

// Search component for the header
const SearchBar: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Searching for:", searchTerm);
    // navigate(`/search?q=${encodeURIComponent(searchTerm)}`);
  };
  
  return (
    <form className="search-container" onSubmit={handleSearch}>
      <input
        type="text"
        className="search-input"
        placeholder="搜尋活動..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      <span className="search-icon">🔍</span>
    </form>
  );
};

// Category filters component for below the header
const CategoryFilters: React.FC = () => {
  return (
    <div className="category-filters bg-light py-3">
      <div className="container">
        <div className="filter-container">
          <button
            className="filter-button active"
          >
            全部活動
          </button>
        </div>
      </div>
    </div>
  );
};

// Footer component
const Footer: React.FC = () => {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-section">
            <h3>關於我們</h3>
            <p>tixkraft是一個專業票務平台，提供各種活動的售票服務。</p>
          </div>
          <div className="footer-section">
            <h3>幫助中心</h3>
            <ul className="footer-links">
              <li><Link to="/faq">常見問題</Link></li>
              <li><Link to="/contact">聯絡我們</Link></li>
              <li><Link to="/privacy">隱私政策</Link></li>
            </ul>
          </div>
          <div className="footer-section">
            <h3>關注我們</h3>
            <div className="social-links">
              <a href="/#" className="social-link">Facebook</a>
              <a href="/#" className="social-link">Instagram</a>
              <a href="/#" className="social-link">Twitter</a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} tixkraft. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <div className="app-container">
          {/* Header with Navigation */}
          <header className="navbar">
            <div className="container">
              <div className="d-flex justify-content-between align-items-center">
                {/* Logo */}
                <div className="navbar-brand">
                  <Link to="/" className="logo-link">
                    tixkraft
                  </Link>
                </div>
                
                {/* Navigation Links */}
                <nav className="main-nav">
                  <NavigationLinks />
                </nav>
                
                {/* Search Bar */}
                <div className="search-wrapper">
                  <SearchBar />
                </div>
                
                {/* User Account */}
                <div className="user-nav">
                  <LoginDisplay />
                </div>
              </div>
            </div>
          </header>
          
          {/* Category Filters - only show on homepage */}
          <Routes>
            <Route path="/" element={<CategoryFilters />} />
          </Routes>
          
          {/* Main Content */}
          <main className="main-content">
            <div className="container">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/register" element={<Register />} />
                <Route path="/login" element={<Login />} />
                <Route path="/Activity/:id" element={<Activity />} />
                <Route path="/editActivity/:id" element={<EditActivity />} />
                <Route path="/create-activity" element={<CreateActivity />} />
                <Route path="/manage-activity" element={<ManageActivities />} />
                <Route path="/myTicket" element={<MyTicket />} />
                <Route path="/settings" element={<UserSettings />} />
                <Route path="/settings/change-password" element={<ChangePassword />} />
                <Route path="/buy-ticket/:id" element={<BuyTicketPage />} />
                <Route path="/payment/:id" element={<PaymentPage />} />
              </Routes>
            </div>
          </main>
          
          {/* Footer */}
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  )
}

// 顯示用戶名稱或登入按鈕的組件
const LoginDisplay: React.FC = () => {
  const { isLoggedIn, name, logout } = useAuth();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  
  const handleLogout = () => {
    logout();
    navigate('/');
    window.location.reload();
  };
  
  let closeTimeout: NodeJS.Timeout | null = null;
  
  const handleMouseEnter = () => {
    if (closeTimeout) clearTimeout(closeTimeout);
    setShowDropdown(true);
  };
  
  const handleMouseLeave = () => {
    closeTimeout = setTimeout(() => {
      setShowDropdown(false);
    }, 200);
  };
  
  return (
    <>
      {isLoggedIn ? (
        <div 
          className="user-dropdown"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <button className="user-dropdown-toggle">
            <span className="user-icon">👤</span>
            <span>會員帳戶</span>
          </button>
          
          {showDropdown && (
            <div className="dropdown-menu" onMouseEnter={handleMouseEnter}>
              <ul className="dropdown-list">
                <li className="dropdown-item dropdown-user-info">
                  <p>{name}</p>
                </li>
                <li className="dropdown-item">
                  <Link to="/settings" className="dropdown-link">
                    會員資料
                  </Link>
                </li>
                <li className="dropdown-item">
                  <Link to="/myTicket" className="dropdown-link">
                    我的訂單
                  </Link>
                </li>
                <li className="dropdown-item">
                  <button onClick={handleLogout} className="dropdown-button">
                    登出
                  </button>
                </li>
              </ul>
            </div>
          )}
        </div>
      ) : (
        <div className="auth-buttons">
          <Link to="/login" className="auth-link">登入</Link>
          <Link to="/register" className="auth-link auth-register">註冊</Link>
        </div>
      )}
    </>
  )
}
const HostLink: React.FC = () => {
  const { role } = useAuth();
  const location = useLocation();
  
  // Check if route is active
  const isActive = (path: string) => {
    return location.pathname === path ? 'active' : '';
  };
  
  return role === 'host' ? (
    <>
      <Link 
        to="/create-activity" 
        className={`nav-link ${isActive('/create-activity')}`}
      >
        新增活動
      </Link>
      <Link 
        to="/manage-activity" 
        className={`nav-link ${isActive('/manage-activity')}`}
      >
        管理活動
      </Link>
    </>
  ) : null;
}

export default App

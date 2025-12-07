import { useState, useEffect } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useChannels } from '../../hooks/useChannels';
import './Navbar.css';

export function Navbar() {
  const { isAuthenticated, logout } = useAuth();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { channels } = useChannels();
  
  const isVideoPage = location.pathname.startsWith('/videos');
  const [searchInput, setSearchInput] = useState(searchParams.get('search') || '');
  
  // Sync search input with URL params
  useEffect(() => {
    setSearchInput(searchParams.get('search') || '');
  }, [searchParams]);
  
  const handleLogout = async () => {
    await logout();
  };
  
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newParams = new URLSearchParams(searchParams);
    if (searchInput) {
      newParams.set('search', searchInput);
    } else {
      newParams.delete('search');
    }
    newParams.set('page', '1');
    setSearchParams(newParams);
  };
  
  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('sort', e.target.value);
    newParams.set('page', '1');
    setSearchParams(newParams);
  };
  
  const handleChannelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newParams = new URLSearchParams(searchParams);
    if (e.target.value) {
      newParams.set('channel', e.target.value);
    } else {
      newParams.delete('channel');
    }
    newParams.set('page', '1');
    setSearchParams(newParams);
  };
  
  const handleClearFilters = () => {
    setSearchInput('');
    setSearchParams(new URLSearchParams());
  };
  
  const hasFilters = searchParams.get('search') || searchParams.get('channel') || 
                     (searchParams.get('sort') && searchParams.get('sort') !== 'newest');
  
  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          <span className="logo-text">Rainbows, Cupcakes and Unicorns</span>
        </Link>
        
        <div className="navbar-menu">
          <Link to="/" className={`navbar-link ${location.pathname === '/' ? 'active' : ''}`}>
            Home
          </Link>
          
          {isAuthenticated && (
            <Link to="/admin" className="navbar-link">
              Admin
            </Link>
          )}
          
          {isAuthenticated ? (
            <div className="navbar-user">
              <button onClick={handleLogout} className="navbar-button">
                Logout
              </button>
            </div>
          ) : (
            <Link to="/login" className="navbar-button">
              Login
            </Link>
          )}
        </div>
      </div>
      
      {isVideoPage && (
        <div className="navbar-filters">
          <div className="navbar-filters-container">
            <form onSubmit={handleSearchSubmit} className="navbar-search-form">
              <input
                type="text"
                placeholder="Search videos..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="navbar-search-input"
              />
              <button type="submit" className="navbar-search-button">
                🔍
              </button>
            </form>
            
            <div className="navbar-filter-controls">
              <select
                value={searchParams.get('sort') || 'newest'}
                onChange={handleSortChange}
                className="navbar-filter-select"
              >
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
                <option value="popular">Most Popular</option>
              </select>
              
              <select
                value={searchParams.get('channel') || ''}
                onChange={handleChannelChange}
                className="navbar-filter-select"
              >
                <option value="">All Channels</option>
                {channels.map(channel => (
                  <option key={channel.id} value={channel.id}>
                    {channel.name}
                  </option>
                ))}
              </select>
              
              {hasFilters && (
                <button
                  onClick={handleClearFilters}
                  className="navbar-clear-button"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}

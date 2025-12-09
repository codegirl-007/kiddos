import { useState, useEffect } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useChannels } from '../../hooks/useChannels';
import { APPS } from '../../config/apps';

export function Navbar() {
  const { isAuthenticated, logout } = useAuth();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { channels } = useChannels();
  
  // Detect current app from registry
  const getCurrentApp = (pathname: string) => {
    return APPS.find(app => pathname === app.link || pathname.startsWith(app.link + '/'));
  };
  
  const currentApp = getCurrentApp(location.pathname);
  const isVideoApp = currentApp?.id === 'videos';
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
    <>
      <header className="bg-white border-b-4 border-primary sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 py-5">
          <div className="flex items-center gap-3 justify-between">
            <Link to="/" className="flex items-center gap-3">
              <img 
                src="/rainbow.png" 
                alt="Rainbow" 
                className="h-10 w-10 md:h-12 md:w-12 object-contain"
              />
              <h1 className="text-3xl md:text-4xl font-bold text-foreground">Rainbows, Cupcakes & Unicorns</h1>
              <img 
                src="/cupcake.png" 
                alt="Cupcake" 
                className="h-10 w-10 md:h-12 md:w-12 object-contain"
              />
            </Link>
            
            <div className="flex items-center gap-3">
              <Link 
                to="/" 
                className={`text-sm font-semibold px-3 py-2 rounded-full transition-all active:scale-95 ${
                  location.pathname === '/' 
                    ? 'bg-primary text-primary-foreground shadow-md' 
                    : 'bg-white text-foreground border-2 border-primary hover:bg-pink-50'
                }`}
              >
                Home
              </Link>
              
              {isAuthenticated ? (
                <button 
                  onClick={handleLogout} 
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-full font-semibold text-sm hover:bg-primary/90 transition-all active:scale-95 shadow-md"
                >
                  Logout
                </button>
              ) : (
                <Link 
                  to="/login" 
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-full font-semibold text-sm hover:bg-primary/90 transition-all active:scale-95 shadow-md"
                >
                  Login
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>
      
      {isVideoApp && (
        <div className="bg-muted border-b border-border">
          <div className="max-w-5xl mx-auto px-4 py-4">
            <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
              <form onSubmit={handleSearchSubmit} className="flex gap-2 flex-1 max-w-md">
                <input
                  type="text"
                  placeholder="Search videos..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="flex-1 px-4 py-2 border border-border rounded-full bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-colors text-sm font-semibold"
                >
                  🔍
                </button>
              </form>
              
              <div className="flex gap-2 flex-wrap sm:flex-nowrap">
                <select
                  value={searchParams.get('sort') || 'newest'}
                  onChange={handleSortChange}
                  className="px-4 py-2 border border-border rounded-full bg-white text-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="newest">Newest</option>
                  <option value="oldest">Oldest</option>
                  <option value="popular">Most Popular</option>
                </select>
                
                <select
                  value={searchParams.get('channel') || ''}
                  onChange={handleChannelChange}
                  className="px-4 py-2 border border-border rounded-full bg-white text-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
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
                    className="px-4 py-2 border border-border rounded-full bg-white text-sm hover:bg-muted transition-colors whitespace-nowrap"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

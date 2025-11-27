import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import './Navbar.css';

export function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();
  
  const handleLogout = async () => {
    await logout();
  };
  
  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          <span className="logo-icon">📺</span>
        </Link>
        
        <div className="navbar-menu">
          <Link to="/" className="navbar-link">
            Home
          </Link>
          
          {isAuthenticated && (
            <Link to="/admin" className="navbar-link">
              Admin
            </Link>
          )}
          
          {isAuthenticated ? (
            <div className="navbar-user">
              <span className="navbar-username">{user?.username}</span>
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
    </nav>
  );
}


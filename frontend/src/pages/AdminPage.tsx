import { Link } from 'react-router-dom';
import './AdminPage.css';

export function AdminPage() {
  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>Admin Dashboard</h1>
        <p>Manage app settings and configurations</p>
      </div>
      
      <div className="admin-links-grid">
        <Link to="/admin/videos" className="admin-link-card">
          <div className="admin-link-icon">📹</div>
          <h2>Video App</h2>
          <p>Manage YouTube channels and video time limits</p>
        </Link>
        
        <Link to="/admin/speech-sounds" className="admin-link-card">
          <div className="admin-link-icon">🗣️</div>
          <h2>Speech Sounds</h2>
          <p>Manage word groups for speech sound practice</p>
        </Link>
      </div>
    </div>
  );
}




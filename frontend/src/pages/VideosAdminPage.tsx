import { Link } from 'react-router-dom';
import { ChannelManager } from '../components/ChannelManager/ChannelManager';
import { TimeLimitManager } from '../components/TimeLimitManager/TimeLimitManager';
import './AdminPage.css';

export function VideosAdminPage() {
  return (
    <div className="admin-page">
      <div className="admin-header">
        <Link to="/admin" className="back-button">
          ← Back to Admin
        </Link>
        <h1>Video App Settings</h1>
        <p>Manage YouTube channels and video time limits</p>
      </div>
      
      <div className="admin-content">
        <div className="admin-column">
          <ChannelManager />
        </div>
        <div className="admin-column">
          <TimeLimitManager />
        </div>
      </div>
    </div>
  );
}

import { ChannelManager } from '../components/ChannelManager/ChannelManager';
import { TimeLimitManager } from '../components/TimeLimitManager/TimeLimitManager';
import './AdminPage.css';

export function AdminPage() {
  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>Admin Dashboard</h1>
        <p>Manage YouTube channels and video settings</p>
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




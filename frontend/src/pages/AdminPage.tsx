import { ChannelManager } from '../components/ChannelManager/ChannelManager';
import './AdminPage.css';

export function AdminPage() {
  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>Admin Dashboard</h1>
        <p>Manage YouTube channels to display on the home page</p>
      </div>
      
      <ChannelManager />
    </div>
  );
}




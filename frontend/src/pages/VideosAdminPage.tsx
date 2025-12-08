import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChannelManager } from '../components/ChannelManager/ChannelManager';
import { TimeLimitManager } from '../components/TimeLimitManager/TimeLimitManager';
import { videosApi } from '../services/apiClient';
import './AdminPage.css';

export function VideosAdminPage() {
  const [refreshing, setRefreshing] = useState(false);
  const [refreshMessage, setRefreshMessage] = useState<string | null>(null);
  const [refreshError, setRefreshError] = useState<string | null>(null);

  const handleRefreshVideos = async () => {
    setRefreshing(true);
    setRefreshMessage(null);
    setRefreshError(null);

    try {
      const response = await videosApi.refresh();
      const data = response.data;
      setRefreshMessage(
        `Refreshed ${data.channelsRefreshed} channel(s). Added ${data.videosAdded} video(s).`
      );
    } catch (err: any) {
      setRefreshError(err.response?.data?.error?.message || 'Failed to refresh videos');
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-header">
        <Link to="/admin" className="back-button">
          ← Back to Admin
        </Link>
        <h1>Video App Settings</h1>
        <p>Manage YouTube channels and video time limits</p>
        <div style={{ marginTop: '16px' }}>
          <button
            onClick={handleRefreshVideos}
            disabled={refreshing}
            className="refresh-videos-button"
          >
            {refreshing ? 'Refreshing...' : '🔄 Refresh All Videos'}
          </button>
          {refreshMessage && (
            <div className="refresh-message success">{refreshMessage}</div>
          )}
          {refreshError && (
            <div className="refresh-message error">{refreshError}</div>
          )}
        </div>
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

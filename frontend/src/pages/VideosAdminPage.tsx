import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChannelManager } from '../components/ChannelManager/ChannelManager';
import { TimeLimitManager } from '../components/TimeLimitManager/TimeLimitManager';
import { videosApi } from '../services/apiClient';

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
    <div className="min-h-[calc(100vh-60px)] bg-background">
      <div className="bg-card border-b border-border py-8 px-6 text-center">
        <Link 
          to="/admin" 
          className="inline-block mb-4 px-4 py-2 bg-transparent border border-border rounded-md text-foreground text-sm cursor-pointer transition-colors no-underline hover:bg-muted"
        >
          ← Back to Admin
        </Link>
        <h1 className="m-0 mb-2 text-[28px] font-medium text-foreground">Video App Settings</h1>
        <p className="m-0 text-sm text-muted-foreground">Manage YouTube channels and video time limits</p>
        <div className="mt-4">
          <button
            onClick={handleRefreshVideos}
            disabled={refreshing}
            className="px-5 py-2.5 bg-primary text-primary-foreground border-none rounded-lg text-sm font-semibold cursor-pointer transition-all shadow-md hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {refreshing ? 'Refreshing...' : '🔄 Refresh All Videos'}
          </button>
          {refreshMessage && (
            <div className="mt-3 px-3 py-2 rounded-md text-sm font-medium bg-green-100 text-green-800 border border-green-200">
              {refreshMessage}
            </div>
          )}
          {refreshError && (
            <div className="mt-3 px-3 py-2 rounded-md text-sm font-medium bg-red-100 text-red-800 border border-red-200">
              {refreshError}
            </div>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6 max-w-[1600px] mx-auto">
        <div className="flex flex-col">
          <ChannelManager />
        </div>
        <div className="flex flex-col">
          <TimeLimitManager />
        </div>
      </div>
    </div>
  );
}

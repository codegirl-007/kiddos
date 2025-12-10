import { useState, useEffect } from 'react';
import { settingsApi } from '../../services/apiClient';

const formatTime = (minutes: number): string => {
  if (minutes < 1) {
    return `${Math.round(minutes * 60)}s`;
  }
  if (minutes < 60) {
    return `${Math.round(minutes)}m`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  if (mins === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${mins}m`;
};

interface Connection {
  sessionId: string;
  userId?: number;
  username?: string;
  route?: string;
  videoTitle?: string;
  videoChannel?: string;
  timeUsed?: number;
  dailyLimit?: number;
  lastHeartbeat: number;
  connectedAt: number;
}

interface ConnectionStats {
  total: number;
  authenticated: number;
  anonymous: number;
  connections?: Connection[];
}

export function ConnectionTracker() {
  const [stats, setStats] = useState<ConnectionStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await settingsApi.getConnectionStats();
      setStats(response.data);
    } catch (err: any) {
      setError(err.error?.message || 'Failed to load connection stats');
      console.error('Error fetching connection stats:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch stats on mount and periodically
  useEffect(() => {
    fetchStats();
    
    // Refresh every 10 seconds
    const interval = setInterval(fetchStats, 10000);
    
    return () => clearInterval(interval);
  }, []);

  if (isLoading && !stats) {
    return (
      <div className="bg-card rounded-xl p-6 border border-border h-fit">
        <div className="mb-6">
          <h2 className="m-0 mb-2 text-xl font-semibold text-foreground">Active Connections</h2>
          <p className="m-0 text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl p-6 border border-border h-fit">
      <div className="mb-6">
        <h2 className="m-0 mb-2 text-xl font-semibold text-foreground">Active Connections</h2>
        <p className="m-0 text-sm text-muted-foreground">
          Number of users currently connected to the app
        </p>
      </div>

      {error && (
        <div className="px-4 py-3 rounded-md mb-4 text-sm bg-red-50 text-red-800 border border-red-200">
          {error}
        </div>
      )}

      {stats && (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="p-5 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-lg border border-primary/20">
              <div className="text-center">
                <div className="text-4xl font-bold text-primary mb-2">
                  {stats.total}
                </div>
                <div className="text-sm text-muted-foreground font-medium">
                  Total Active Users
                </div>
              </div>
            </div>

            <div className="p-5 bg-muted rounded-lg border border-border">
              <div className="text-center">
                <div className="text-4xl font-bold text-foreground mb-2">
                  {stats.authenticated}
                </div>
                <div className="text-sm text-muted-foreground font-medium">
                  Authenticated
                </div>
              </div>
            </div>

            <div className="p-5 bg-muted rounded-lg border border-border">
              <div className="text-center">
                <div className="text-4xl font-bold text-foreground mb-2">
                  {stats.anonymous}
                </div>
                <div className="text-sm text-muted-foreground font-medium">
                  Anonymous
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchStats}
              disabled={isLoading}
              className="px-4 py-2 bg-transparent text-primary border border-primary rounded-md text-sm font-medium cursor-pointer transition-colors hover:bg-primary hover:text-primary-foreground disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>

          {stats.connections && stats.connections.length > 0 && (
            <div className="mt-6 pt-6 border-t border-border">
              <h3 className="m-0 mb-4 text-base font-semibold text-foreground">Connection Details</h3>
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {stats.connections.map((conn) => {
                  const timeAgo = Math.floor((Date.now() - conn.lastHeartbeat) / 1000);
                  const timeAgoText = timeAgo < 60 ? `${timeAgo}s ago` : `${Math.floor(timeAgo / 60)}m ago`;
                  
                  return (
                    <div
                      key={conn.sessionId}
                      className="p-3 bg-muted rounded-lg border border-border text-sm"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            {conn.username ? (
                              <span className="font-semibold text-foreground">
                                {conn.username}
                              </span>
                            ) : (
                              <span className="text-muted-foreground italic">
                                Anonymous
                              </span>
                            )}
                            <span className="text-xs text-muted-foreground">
                              ({conn.sessionId.substring(0, 8)}...)
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            <span className="font-medium">Route:</span> {conn.route || '/'}
                          </div>
                          {conn.videoTitle && (
                            <div className="text-xs text-muted-foreground mt-1">
                              <span className="font-medium">Video:</span> {conn.videoTitle}
                            </div>
                          )}
                          {conn.videoChannel && (
                            <div className="text-xs text-muted-foreground">
                              <span className="font-medium">Channel:</span> {conn.videoChannel}
                            </div>
                          )}
                          {conn.timeUsed !== undefined && conn.dailyLimit !== undefined && (conn.route === '/videos' || conn.videoTitle) && (
                            <div className="text-xs text-muted-foreground mt-1">
                              <span className="font-medium">Video Time Used:</span> {formatTime(conn.timeUsed)} / {formatTime(conn.dailyLimit)} ({Math.round((conn.timeUsed / conn.dailyLimit) * 100)}%)
                            </div>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground whitespace-nowrap">
                          {timeAgoText}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

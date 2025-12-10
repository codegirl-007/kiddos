/**
 * Connection Tracker Service
 * Tracks active user connections via heartbeat mechanism
 */

interface Connection {
  sessionId: string;
  userId?: number;
  username?: string;
  route?: string;
  videoTitle?: string;
  videoChannel?: string;
  timeUsed?: number; // minutes
  dailyLimit?: number; // minutes
  lastHeartbeat: number;
  connectedAt: number;
}

class ConnectionTracker {
  private connections: Map<string, Connection> = new Map();
  private readonly HEARTBEAT_TIMEOUT = 60 * 1000; // 60 seconds - consider connection dead if no heartbeat
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Clean up stale connections every 30 seconds
    this.cleanupInterval = setInterval(() => {
      this.cleanupStaleConnections();
    }, 30 * 1000);
  }

  /**
   * Register or update a connection heartbeat
   */
  heartbeat(sessionId: string, userId?: number, username?: string, route?: string, videoTitle?: string, videoChannel?: string, timeUsed?: number, dailyLimit?: number): void {
    const now = Date.now();
    const existing = this.connections.get(sessionId);

    if (existing) {
      // Update existing connection
      existing.lastHeartbeat = now;
      if (userId !== undefined) existing.userId = userId;
      if (username !== undefined) existing.username = username;
      if (route !== undefined) existing.route = route;
      if (videoTitle !== undefined) existing.videoTitle = videoTitle;
      if (videoChannel !== undefined) existing.videoChannel = videoChannel;
      if (timeUsed !== undefined) existing.timeUsed = timeUsed;
      if (dailyLimit !== undefined) existing.dailyLimit = dailyLimit;
    } else {
      // New connection
      this.connections.set(sessionId, {
        sessionId,
        userId,
        username,
        route,
        videoTitle,
        videoChannel,
        timeUsed,
        dailyLimit,
        lastHeartbeat: now,
        connectedAt: now
      });
    }
  }

  /**
   * Remove a connection
   */
  disconnect(sessionId: string): void {
    this.connections.delete(sessionId);
  }

  /**
   * Get count of active connections
   */
  getConnectionCount(): number {
    this.cleanupStaleConnections();
    return this.connections.size;
  }

  /**
   * Get all active connections (for admin/debugging)
   */
  getConnections(): Connection[] {
    this.cleanupStaleConnections();
    return Array.from(this.connections.values());
  }

  /**
   * Get connection stats
   */
  getStats(): {
    total: number;
    authenticated: number;
    anonymous: number;
  } {
    this.cleanupStaleConnections();
    const connections = Array.from(this.connections.values());
    const authenticated = connections.filter(c => c.userId !== undefined).length;
    
    return {
      total: connections.length,
      authenticated,
      anonymous: connections.length - authenticated
    };
  }

  /**
   * Remove connections that haven't sent a heartbeat recently
   */
  private cleanupStaleConnections(): void {
    const now = Date.now();
    const stale: string[] = [];

    this.connections.forEach((conn, sessionId) => {
      if (now - conn.lastHeartbeat > this.HEARTBEAT_TIMEOUT) {
        stale.push(sessionId);
      }
    });

    stale.forEach(sessionId => {
      this.connections.delete(sessionId);
    });

    if (stale.length > 0) {
      console.log(`[ConnectionTracker] Cleaned up ${stale.length} stale connection(s)`);
    }
  }

  /**
   * Cleanup on shutdown
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.connections.clear();
  }
}

// Singleton instance
export const connectionTracker = new ConnectionTracker();

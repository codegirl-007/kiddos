import { Response } from 'express';
import { AuthRequest } from '../types/index.js';
import { getSetting, setSetting } from '../config/database.js';
import { connectionTracker } from '../services/connection-tracker.service.js';
import crypto from 'crypto';

/**
 * Heartbeat endpoint - clients ping this to indicate they're active
 * Public endpoint - no auth required
 * Session ID is sent from client (stored in localStorage) to ensure
 * each browser window/tab has a unique connection tracked
 */
export async function heartbeat(req: AuthRequest, res: Response) {
  try {
    // Get session ID from request body (sent by client)
    // Fallback to cookie for backwards compatibility
    let sessionId = req.body.sessionId || req.cookies.session_id;
    
    if (!sessionId) {
      // Generate a new session ID as fallback
      sessionId = crypto.randomBytes(16).toString('hex');
      // Set cookie for backwards compatibility
      res.cookie('session_id', sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000
      });
    }

    // Get route and video info from request body
    const route = req.body.route || '/';
    const videoTitle = req.body.videoTitle;
    const videoChannel = req.body.videoChannel;

    // Register heartbeat (with user info if authenticated, current route, and video info)
    connectionTracker.heartbeat(
      sessionId,
      req.userId,
      req.username,
      route,
      videoTitle,
      videoChannel
    );

    res.json({
      success: true,
      data: {
        sessionId,
        timestamp: Date.now()
      }
    });
  } catch (error: any) {
    console.error('Heartbeat error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'HEARTBEAT_ERROR',
        message: 'Error processing heartbeat'
      }
    });
  }
}

/**
 * Get connection stats - admin only
 */
export async function getConnectionStats(req: AuthRequest, res: Response) {
  try {
    const stats = connectionTracker.getStats();
    const connections = connectionTracker.getConnections();
    
    res.json({
      success: true,
      data: {
        ...stats,
        connections // Include full connection details with routes
      }
    });
  } catch (error: any) {
    console.error('Get connection stats error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'GET_CONNECTION_STATS_ERROR',
        message: 'Error fetching connection stats'
      }
    });
  }
}

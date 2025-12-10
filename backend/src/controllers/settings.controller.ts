import { Response } from 'express';
import { AuthRequest } from '../types/index.js';
import { getSetting, setSetting } from '../config/database.js';
import { connectionTracker } from '../services/connection-tracker.service.js';
import crypto from 'crypto';

export async function getTimeLimit(req: AuthRequest, res: Response) {
  try {
    const limit = await getSetting('daily_time_limit_minutes');
    const defaultLimit = 1; // Default 1 minute for testing
    
    res.json({
      success: true,
      data: {
        dailyLimit: limit ? parseInt(limit, 10) : defaultLimit
      }
    });
  } catch (error: any) {
    console.error('Get time limit error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'GET_TIME_LIMIT_ERROR',
        message: 'Error fetching time limit'
      }
    });
  }
}

export async function setTimeLimit(req: AuthRequest, res: Response) {
  try {
    const { dailyLimit } = req.body;
    
    if (!dailyLimit || typeof dailyLimit !== 'number' || dailyLimit < 1) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_LIMIT',
          message: 'Daily limit must be a number greater than 0'
        }
      });
    }
    
    await setSetting('daily_time_limit_minutes', dailyLimit.toString());
    
    res.json({
      success: true,
      data: {
        dailyLimit
      }
    });
  } catch (error: any) {
    console.error('Set time limit error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SET_TIME_LIMIT_ERROR',
        message: 'Error setting time limit'
      }
    });
  }
}

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

    // Get route, video info, and time limit usage from request body
    const route = req.body.route || '/';
    const videoTitle = req.body.videoTitle;
    const videoChannel = req.body.videoChannel;
    const timeUsed = req.body.timeUsed;
    const dailyLimit = req.body.dailyLimit;

    // Register heartbeat (with user info if authenticated, current route, video info, and time limit usage)
    connectionTracker.heartbeat(
      sessionId,
      req.userId,
      req.username,
      route,
      videoTitle,
      videoChannel,
      timeUsed,
      dailyLimit
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

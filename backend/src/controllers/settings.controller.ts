import { Response } from 'express';
import { AuthRequest } from '../types/index.js';
import { getSetting, setSetting } from '../config/database.js';

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

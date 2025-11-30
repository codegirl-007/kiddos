import jwt from 'jsonwebtoken';
import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types/index.js';
import { env } from '../config/env.js';

export function authMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  // Check for token in Authorization header or cookie
  const token = req.cookies.auth_token || 
                req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication required'
      }
    });
  }
  
  try {
    const decoded = jwt.verify(token, env.jwtSecret) as {
      userId: number;
      username: string;
    };
    
    req.userId = decoded.userId;
    req.username = decoded.username;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: 'Invalid or expired token'
      }
    });
  }
}



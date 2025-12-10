import jwt from 'jsonwebtoken';
import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types/index.js';
import { env } from '../config/env.js';

/**
 * Optional auth middleware - sets user info if token exists but doesn't fail if missing
 * Useful for endpoints that work for both authenticated and anonymous users
 */
export function optionalAuthMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  // Check for token in Authorization header or cookie
  const token = req.cookies.auth_token || 
                req.headers.authorization?.replace('Bearer ', '');
  
  if (token) {
    try {
      const decoded = jwt.verify(token, env.jwtSecret) as {
        userId: number;
        username: string;
      };
      
      req.userId = decoded.userId;
      req.username = decoded.username;
    } catch (error) {
      // Invalid token - just continue without user info
      // Don't set userId/username
    }
  }
  
  // Always continue - this middleware never fails
  next();
}

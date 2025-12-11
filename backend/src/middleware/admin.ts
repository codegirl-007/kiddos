import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types/index.js';
import { db } from '../config/database.js';

/**
 * Admin middleware - ensures user is authenticated AND has admin role
 * Must be used after authMiddleware
 */
export async function adminMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  if (!req.userId) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication required'
      }
    });
  }

  try {
    // Get user role from database
    const result = await db.execute({
      sql: 'SELECT role FROM users WHERE id = ?',
      args: [req.userId]
    });

    if (!result.rows.length) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found'
        }
      });
    }

    const user = result.rows[0];
    const role = user.role as string;

    if (role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Admin access required'
        }
      });
    }

    // User is admin, proceed
    next();
  } catch (error) {
    console.error('Admin middleware error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'ADMIN_CHECK_ERROR',
        message: 'Error checking admin status'
      }
    });
  }
}

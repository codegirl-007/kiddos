import { Response } from 'express';
import { AuthRequest } from '../types/index.js';
import { db } from '../config/database.js';
import { hashPassword, verifyPassword } from '../services/auth.service.js';

export async function getAllUsers(req: AuthRequest, res: Response) {
  try {
    const result = await db.execute({
      sql: 'SELECT id, username, role, created_at, last_login FROM users ORDER BY created_at DESC',
      args: []
    });

    res.json({
      success: true,
      data: result.rows.map(user => ({
        id: user.id,
        username: user.username,
        role: user.role || 'user',
        createdAt: user.created_at,
        lastLogin: user.last_login
      }))
    });
  } catch (error: any) {
    console.error('Get all users error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'GET_USERS_ERROR',
        message: 'Error fetching users'
      }
    });
  }
}

export async function createUser(req: AuthRequest, res: Response) {
  try {
    const { username, password, role } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_FIELDS',
          message: 'Username and password are required'
        }
      });
    }

    // Validate role
    if (role && role !== 'admin' && role !== 'user') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_ROLE',
          message: 'Role must be "admin" or "user"'
        }
      });
    }

    // Validate password length
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'WEAK_PASSWORD',
          message: 'Password must be at least 8 characters long'
        }
      });
    }

    // Check if username already exists
    const existing = await db.execute({
      sql: 'SELECT id FROM users WHERE username = ?',
      args: [username]
    });

    if (existing.rows.length > 0) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'USERNAME_EXISTS',
          message: 'Username already exists'
        }
      });
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Insert user
    const result = await db.execute({
      sql: 'INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)',
      args: [username, passwordHash, role || 'user']
    });

    // Get created user
    const newUserId = Number(result.lastInsertRowid);
    const newUser = await db.execute({
      sql: 'SELECT id, username, role, created_at FROM users WHERE id = ?',
      args: [newUserId]
    });

    res.status(201).json({
      success: true,
      data: {
        id: newUser.rows[0].id,
        username: newUser.rows[0].username,
        role: newUser.rows[0].role || 'user',
        createdAt: newUser.rows[0].created_at
      }
    });
  } catch (error: any) {
    console.error('Create user error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'CREATE_USER_ERROR',
        message: 'Error creating user'
      }
    });
  }
}

export async function updateUser(req: AuthRequest, res: Response) {
  try {
    const userId = parseInt(req.params.id);
    const { username, role } = req.body;

    if (!userId || isNaN(userId)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_USER_ID',
          message: 'Invalid user ID'
        }
      });
    }

    // Prevent self-deletion check (for role changes)
    if (userId === req.userId && role && role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: {
          code: 'CANNOT_DEMOTE_SELF',
          message: 'You cannot change your own role'
        }
      });
    }

    // Validate role if provided
    if (role && role !== 'admin' && role !== 'user') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_ROLE',
          message: 'Role must be "admin" or "user"'
        }
      });
    }

    // Check if user exists
    const existing = await db.execute({
      sql: 'SELECT id FROM users WHERE id = ?',
      args: [userId]
    });

    if (!existing.rows.length) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found'
        }
      });
    }

    // Check username uniqueness if changing username
    if (username) {
      const usernameCheck = await db.execute({
        sql: 'SELECT id FROM users WHERE username = ? AND id != ?',
        args: [username, userId]
      });

      if (usernameCheck.rows.length > 0) {
        return res.status(409).json({
          success: false,
          error: {
            code: 'USERNAME_EXISTS',
            message: 'Username already exists'
          }
        });
      }
    }

    // Build update query dynamically
    const updates: string[] = [];
    const args: any[] = [];

    if (username) {
      updates.push('username = ?');
      args.push(username);
    }

    if (role) {
      updates.push('role = ?');
      args.push(role);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'NO_UPDATES',
          message: 'No fields to update'
        }
      });
    }

    args.push(userId);

    await db.execute({
      sql: `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
      args
    });

    // Get updated user
    const updated = await db.execute({
      sql: 'SELECT id, username, role, created_at, last_login FROM users WHERE id = ?',
      args: [userId]
    });

    res.json({
      success: true,
      data: {
        id: updated.rows[0].id,
        username: updated.rows[0].username,
        role: updated.rows[0].role || 'user',
        createdAt: updated.rows[0].created_at,
        lastLogin: updated.rows[0].last_login
      }
    });
  } catch (error: any) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'UPDATE_USER_ERROR',
        message: 'Error updating user'
      }
    });
  }
}

export async function deleteUser(req: AuthRequest, res: Response) {
  try {
    const userId = parseInt(req.params.id);

    if (!userId || isNaN(userId)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_USER_ID',
          message: 'Invalid user ID'
        }
      });
    }

    // Prevent self-deletion
    if (userId === req.userId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'CANNOT_DELETE_SELF',
          message: 'You cannot delete your own account'
        }
      });
    }

    // Check if user exists
    const existing = await db.execute({
      sql: 'SELECT id FROM users WHERE id = ?',
      args: [userId]
    });

    if (!existing.rows.length) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found'
        }
      });
    }

    // Delete user (cascade will handle related data)
    await db.execute({
      sql: 'DELETE FROM users WHERE id = ?',
      args: [userId]
    });

    res.json({
      success: true,
      data: { message: 'User deleted successfully' }
    });
  } catch (error: any) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'DELETE_USER_ERROR',
        message: 'Error deleting user'
      }
    });
  }
}

export async function changePassword(req: AuthRequest, res: Response) {
  try {
    const userId = parseInt(req.params.id);
    const { password } = req.body;

    if (!userId || isNaN(userId)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_USER_ID',
          message: 'Invalid user ID'
        }
      });
    }

    if (!password) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_PASSWORD',
          message: 'Password is required'
        }
      });
    }

    // Validate password length
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'WEAK_PASSWORD',
          message: 'Password must be at least 8 characters long'
        }
      });
    }

    // Check if user exists
    const existing = await db.execute({
      sql: 'SELECT id FROM users WHERE id = ?',
      args: [userId]
    });

    if (!existing.rows.length) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found'
        }
      });
    }

    // Allow admin to change any password, or user to change their own
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required'
        }
      });
    }

    if (userId !== req.userId) {
      // Check if requester is admin (this should already be checked by middleware, but double-check)
      const requester = await db.execute({
        sql: 'SELECT role FROM users WHERE id = ?',
        args: [req.userId]
      });

      if (!requester.rows.length || requester.rows[0].role !== 'admin') {
        return res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You can only change your own password'
          }
        });
      }
    }

    // Hash new password
    const passwordHash = await hashPassword(password);

    // Update password
    await db.execute({
      sql: 'UPDATE users SET password_hash = ? WHERE id = ?',
      args: [passwordHash, userId]
    });

    res.json({
      success: true,
      data: { message: 'Password changed successfully' }
    });
  } catch (error: any) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'CHANGE_PASSWORD_ERROR',
        message: 'Error changing password'
      }
    });
  }
}

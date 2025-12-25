import { Response } from 'express';
import { AuthRequest } from '../types/index.js';
import { db } from '../config/database.js';
import { createTokens, refreshAccessToken, revokeRefreshToken, verifyPassword, hashPassword } from '../services/auth.service.js';
import { env } from '../config/env.js';
import jwt from 'jsonwebtoken';

export async function login(req: AuthRequest, res: Response) {
  try {
    const { username, password } = req.body;
    
    // Find user
    const result = await db.execute({
      sql: 'SELECT * FROM users WHERE username = ?',
      args: [username]
    });
    
    if (!result.rows.length) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid username or password'
        }
      });
    }
    
    const user = result.rows[0];
    
    // Verify password
    const valid = await verifyPassword(password, user.password_hash as string);
    
    if (!valid) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid username or password'
        }
      });
    }
    
    // Update last login
    await db.execute({
      sql: 'UPDATE users SET last_login = ? WHERE id = ?',
      args: [new Date().toISOString(), user.id]
    });
    
    // Create tokens
    const { accessToken, refreshToken } = await createTokens(
      user.id as number,
      user.username as string
    );
    
    // Set refresh token as httpOnly cookie
    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: env.nodeEnv === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });
    
    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          username: user.username,
          role: user.role || 'user'
        },
        accessToken,
        refreshToken
      }
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'LOGIN_ERROR',
        message: 'An error occurred during login'
      }
    });
  }
}

export async function refresh(req: AuthRequest, res: Response) {
  try {
    const refreshToken = req.cookies.refresh_token || req.body.refreshToken;
    
    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'NO_REFRESH_TOKEN',
          message: 'Refresh token not provided'
        }
      });
    }
    
    const { accessToken } = await refreshAccessToken(refreshToken);
    
    res.json({
      success: true,
      data: { accessToken }
    });
  } catch (error: any) {
    res.status(401).json({
      success: false,
      error: {
        code: 'REFRESH_ERROR',
        message: error.message || 'Failed to refresh token'
      }
    });
  }
}

export async function logout(req: AuthRequest, res: Response) {
  try {
    const refreshToken = req.cookies.refresh_token;
    
    if (refreshToken) {
      try {
        const decoded = jwt.verify(refreshToken, env.jwtRefreshSecret) as { token: string };
        await revokeRefreshToken(decoded.token);
      } catch (error) {
        // Token might be invalid, but we still clear the cookie
        console.error('Error revoking token:', error);
      }
    }
    
    // Clear cookie
    res.clearCookie('refresh_token', {
      httpOnly: true,
      secure: env.nodeEnv === 'production',
      sameSite: 'strict',
      path: '/'
    });
    
    res.json({ success: true });
  } catch (error: any) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'LOGOUT_ERROR',
        message: 'Error during logout'
      }
    });
  }
}

export async function register(req: AuthRequest, res: Response) {
  try {
    const { username, password, dateOfBirth } = req.body;
    
    if (!username || !password || !dateOfBirth) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_FIELDS',
          message: 'Username, password, and date of birth are required'
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

    // Validate date of birth and age
    const birthDate = new Date(dateOfBirth);
    if (isNaN(birthDate.getTime())) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_DATE',
          message: 'Invalid date of birth'
        }
      });
    }

    // Check if user is at least 18 years old
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    const dayDiff = today.getDate() - birthDate.getDate();
    
    let actualAge = age;
    if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
      actualAge--;
    }

    if (actualAge < 18) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'AGE_RESTRICTION',
          message: 'You must be at least 18 years old to register'
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

    // Insert user with 'user' role (never 'admin' for public registration)
    const result = await db.execute({
      sql: 'INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)',
      args: [username, passwordHash, 'user']
    });

    // Get created user
    const newUserId = Number(result.lastInsertRowid);
    const newUser = await db.execute({
      sql: 'SELECT id, username, role FROM users WHERE id = ?',
      args: [newUserId]
    });

    // Automatically log in the newly registered user
    const { accessToken, refreshToken } = await createTokens(
      newUserId,
      username
    );

    // Set refresh token as httpOnly cookie
    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: env.nodeEnv === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: newUser.rows[0].id,
          username: newUser.rows[0].username,
          role: newUser.rows[0].role || 'user'
        },
        accessToken,
        refreshToken
      }
    });
  } catch (error: any) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'REGISTER_ERROR',
        message: 'An error occurred during registration'
      }
    });
  }
}

export async function getCurrentUser(req: AuthRequest, res: Response) {
  try {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User not authenticated'
        }
      });
    }

    const result = await db.execute({
      sql: 'SELECT id, username, role, last_login FROM users WHERE id = ?',
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
    
    res.json({
      success: true,
      data: {
        id: user.id,
        username: user.username,
        role: user.role || 'user',
        lastLogin: user.last_login
      }
    });
  } catch (error: any) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'GET_USER_ERROR',
        message: 'Error fetching user data'
      }
    });
  }
}



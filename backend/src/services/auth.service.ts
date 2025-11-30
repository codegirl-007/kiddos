import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { env } from '../config/env.js';
import { db } from '../config/database.js';

export async function createTokens(userId: number, username: string) {
  // Access token (short-lived)
  const accessToken = jwt.sign(
    { userId, username, type: 'access' },
    env.jwtSecret,
    { expiresIn: env.accessTokenExpiry as string }
  );
  
  // Refresh token (long-lived)
  const refreshTokenValue = crypto.randomBytes(64).toString('hex');
  const refreshToken = jwt.sign(
    { token: refreshTokenValue, userId, type: 'refresh' },
    env.jwtRefreshSecret,
    { expiresIn: env.refreshTokenExpiry as string }
  );
  
  // Store refresh token in database
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days
  
  await db.execute({
    sql: `INSERT INTO refresh_tokens (user_id, token, expires_at)
          VALUES (?, ?, ?)`,
    args: [userId, refreshTokenValue, expiresAt.toISOString()]
  });
  
  return { accessToken, refreshToken };
}

export async function refreshAccessToken(refreshToken: string) {
  try {
    const decoded = jwt.verify(refreshToken, env.jwtRefreshSecret) as {
      token: string;
      userId: number;
    };
    
    // Check if refresh token exists and is valid
    const result = await db.execute({
      sql: `SELECT rt.*, u.username 
            FROM refresh_tokens rt
            JOIN users u ON rt.user_id = u.id
            WHERE rt.token = ? AND rt.expires_at > ?`,
      args: [decoded.token, new Date().toISOString()]
    });
    
    if (!result.rows.length) {
      throw new Error('Invalid refresh token');
    }
    
    const tokenData = result.rows[0];
    
    // Generate new access token
    const accessToken = jwt.sign(
      { userId: tokenData.user_id, username: tokenData.username, type: 'access' },
      env.jwtSecret,
      { expiresIn: env.accessTokenExpiry as string }
    );
    
    return { accessToken };
  } catch (error) {
    throw new Error('Invalid or expired refresh token');
  }
}

export async function revokeRefreshToken(token: string) {
  await db.execute({
    sql: 'DELETE FROM refresh_tokens WHERE token = ?',
    args: [token]
  });
}

export async function revokeAllUserTokens(userId: number) {
  await db.execute({
    sql: 'DELETE FROM refresh_tokens WHERE user_id = ?',
    args: [userId]
  });
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}



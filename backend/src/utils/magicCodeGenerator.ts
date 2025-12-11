import { db } from '../config/database.js';
import crypto from 'crypto';

/**
 * Generate a unique 7-character alphanumeric magic code
 * Format: A-Z (uppercase), 0-9
 * Examples: "ABC1234", "XYZ7890", "KID2024"
 */
export async function generateMagicCode(): Promise<string> {
  const maxAttempts = 10;
  let attempts = 0;
  
  while (attempts < maxAttempts) {
    // Generate 4 random bytes (gives us 8 hex chars, we'll use 7)
    const randomBytes = crypto.randomBytes(4);
    const hexString = randomBytes.toString('hex').toUpperCase();
    
    // Convert to alphanumeric (remove any non-alphanumeric if needed)
    // Take first 7 characters and ensure they're alphanumeric
    let code = '';
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    
    // Generate 7 random characters from our charset
    for (let i = 0; i < 7; i++) {
      const randomIndex = crypto.randomInt(0, chars.length);
      code += chars[randomIndex];
    }
    
    // Check if code already exists
    const existing = await db.execute({
      sql: 'SELECT id FROM settings_profiles WHERE magic_code = ?',
      args: [code]
    });
    
    if (existing.rows.length === 0) {
      return code;
    }
    
    attempts++;
  }
  
  // If we've tried 10 times and still have collisions, something is wrong
  throw new Error('Failed to generate unique magic code after multiple attempts');
}

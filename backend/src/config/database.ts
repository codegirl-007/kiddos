import { createClient } from '@libsql/client';
import { env } from './env.js';

export const db = createClient({
  url: env.tursoUrl,
  authToken: env.tursoAuthToken
});

// Helper function for getting settings
export async function getSetting(key: string): Promise<string | null> {
  const result = await db.execute({
    sql: 'SELECT value FROM settings WHERE key = ?',
    args: [key]
  });
  
  if (result.rows.length === 0) {
    return null;
  }
  
  return result.rows[0].value as string;
}

// Helper function for setting values
export async function setSetting(key: string, value: string): Promise<void> {
  await db.execute({
    sql: `INSERT OR REPLACE INTO settings (key, value, updated_at)
          VALUES (?, ?, ?)`,
    args: [key, value, new Date().toISOString()]
  });
}


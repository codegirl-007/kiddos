import { db } from '../config/database.js';

const migrations = [
  {
    id: 1,
    name: 'initial_schema',
    up: async () => {
      // Create users table
      await db.execute(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          last_login DATETIME
        )
      `);
      await db.execute('CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)');
      
      // Create channels table
      await db.execute(`
        CREATE TABLE IF NOT EXISTS channels (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          custom_url TEXT,
          thumbnail_url TEXT,
          description TEXT,
          subscriber_count INTEGER,
          video_count INTEGER,
          uploads_playlist_id TEXT NOT NULL,
          added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);
      await db.execute('CREATE INDEX IF NOT EXISTS idx_channels_added_at ON channels(added_at DESC)');
      
      // Create videos_cache table
      await db.execute(`
        CREATE TABLE IF NOT EXISTS videos_cache (
          id TEXT PRIMARY KEY,
          channel_id TEXT NOT NULL,
          title TEXT NOT NULL,
          description TEXT,
          thumbnail_url TEXT,
          published_at DATETIME NOT NULL,
          view_count INTEGER,
          like_count INTEGER,
          duration TEXT,
          cached_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (channel_id) REFERENCES channels(id) ON DELETE CASCADE
        )
      `);
      await db.execute('CREATE INDEX IF NOT EXISTS idx_videos_channel_id ON videos_cache(channel_id)');
      await db.execute('CREATE INDEX IF NOT EXISTS idx_videos_published_at ON videos_cache(published_at DESC)');
      await db.execute('CREATE INDEX IF NOT EXISTS idx_videos_cached_at ON videos_cache(cached_at)');
      
      // Create cache_metadata table
      await db.execute(`
        CREATE TABLE IF NOT EXISTS cache_metadata (
          channel_id TEXT PRIMARY KEY,
          last_fetched DATETIME NOT NULL,
          next_page_token TEXT,
          total_results INTEGER,
          fetch_error TEXT,
          FOREIGN KEY (channel_id) REFERENCES channels(id) ON DELETE CASCADE
        )
      `);
      
      // Create refresh_tokens table
      await db.execute(`
        CREATE TABLE IF NOT EXISTS refresh_tokens (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          token TEXT UNIQUE NOT NULL,
          expires_at DATETIME NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `);
      await db.execute('CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token ON refresh_tokens(token)');
      await db.execute('CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id)');
      
      // Create settings table
      await db.execute(`
        CREATE TABLE IF NOT EXISTS settings (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      // Insert default settings
      await db.execute(`INSERT OR IGNORE INTO settings (key, value) VALUES ('cache_duration_minutes', '60')`);
      await db.execute(`INSERT OR IGNORE INTO settings (key, value) VALUES ('videos_per_channel', '50')`);
      await db.execute(`INSERT OR IGNORE INTO settings (key, value) VALUES ('pagination_size', '12')`);
      await db.execute(`INSERT OR IGNORE INTO settings (key, value) VALUES ('initial_setup_complete', 'false')`);
      await db.execute(`INSERT OR IGNORE INTO settings (key, value) VALUES ('refresh_in_progress', 'false')`);
    }
  }
];

export async function runMigrations() {
  // Create migrations tracking table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS migrations (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      executed_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  // Get executed migrations
  const executed = await db.execute('SELECT id FROM migrations');
  const executedIds = new Set(executed.rows.map(r => r.id));
  
  // Run pending migrations
  for (const migration of migrations) {
    if (!executedIds.has(migration.id)) {
      console.log(`Running migration: ${migration.name}...`);
      await migration.up();
      await db.execute({
        sql: 'INSERT INTO migrations (id, name) VALUES (?, ?)',
        args: [migration.id, migration.name]
      });
      console.log(`✓ Migration ${migration.name} completed`);
    }
  }
  
  console.log('✓ All migrations completed');
}


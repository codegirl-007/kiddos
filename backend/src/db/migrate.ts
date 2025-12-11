import { db } from '../config/database.js';
import { isoDurationToSeconds } from '../utils/duration.js';

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
  },
  {
    id: 2,
    name: 'add_duration_seconds',
    up: async () => {
      const columnCheck = await db.execute(`
        SELECT 1 FROM pragma_table_info('videos_cache')
        WHERE name = 'duration_seconds'
      `);

      if (!columnCheck.rows.length) {
        await db.execute(`
          ALTER TABLE videos_cache
          ADD COLUMN duration_seconds INTEGER DEFAULT 0
        `);
      }

      const videos = await db.execute(`
        SELECT id, duration
        FROM videos_cache
      `);

      for (const row of videos.rows) {
        const duration = row.duration as string | null;
        const seconds = duration ? isoDurationToSeconds(duration) : 0;
        await db.execute({
          sql: `UPDATE videos_cache
                SET duration_seconds = ?
                WHERE id = ?`,
          args: [seconds, row.id]
        });
      }

      await db.execute(`
        CREATE INDEX IF NOT EXISTS idx_videos_duration_seconds
        ON videos_cache(duration_seconds)
      `);
    }
  },
  {
    id: 3,
    name: 'add_speech_sounds_tables',
    up: async () => {
      // Create word_groups table
      await db.execute(`
        CREATE TABLE IF NOT EXISTS word_groups (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);
      await db.execute('CREATE INDEX IF NOT EXISTS idx_word_groups_name ON word_groups(name)');
      
      // Create words table
      await db.execute(`
        CREATE TABLE IF NOT EXISTS words (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          word_group_id INTEGER NOT NULL,
          word TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (word_group_id) REFERENCES word_groups(id) ON DELETE CASCADE
        )
      `);
      await db.execute('CREATE INDEX IF NOT EXISTS idx_words_group_id ON words(word_group_id)');
      await db.execute('CREATE INDEX IF NOT EXISTS idx_words_word ON words(word)');
    }
  },
  {
    id: 4,
    name: 'add_user_roles',
    up: async () => {
      try {
        console.log('  Checking if role column exists...');
        const columnCheck = await db.execute(`
          SELECT 1 FROM pragma_table_info('users')
          WHERE name = 'role'
        `);

        if (!columnCheck.rows.length) {
          console.log('  Role column not found, adding it...');
          // Add role column with default 'user'
          await db.execute(`
            ALTER TABLE users
            ADD COLUMN role TEXT DEFAULT 'user' NOT NULL
          `);
          console.log('  ✓ Role column added');
          
          // Create index on role for faster queries
          await db.execute('CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)');
          console.log('  ✓ Index created');
          
          // Set all existing users to 'admin' (backward compatibility)
          // This ensures existing admin users remain admins
          const updateResult = await db.execute(`
            UPDATE users
            SET role = 'admin'
          `);
          console.log(`  ✓ Updated existing users to admin role`);
        } else {
          console.log('  ✓ Role column already exists, skipping');
        }
      } catch (error: any) {
        console.error('  ❌ Error in migration:', error.message);
        throw error;
      }
    }
  },
  {
    id: 5,
    name: 'drop_pets_table',
    up: async () => {
      try {
        console.log('  Checking if pets table exists...');
        // Check if pets table exists by trying to query sqlite_master
        const tableCheck = await db.execute(`
          SELECT name FROM sqlite_master
          WHERE type='table' AND name='pets'
        `);

        console.log(`  Table check result: ${tableCheck.rows.length} rows found`);
        if (tableCheck.rows.length > 0) {
          console.log('  Pets table found, dropping it...');
          await db.execute('DROP TABLE IF EXISTS pets');
          console.log('  ✓ Pets table dropped');
          
          // Verify it was actually dropped
          const verifyCheck = await db.execute(`
            SELECT name FROM sqlite_master
            WHERE type='table' AND name='pets'
          `);
          if (verifyCheck.rows.length === 0) {
            console.log('  ✓ Verified: pets table successfully removed');
          } else {
            throw new Error('DROP TABLE appeared to succeed but table still exists');
          }
        } else {
          console.log('  ✓ Pets table does not exist, skipping');
        }
      } catch (error: any) {
        console.error('  ❌ Error in migration:', error.message);
        console.error('  Full error:', error);
        throw error;
      }
    }
  },
  {
    id: 6,
    name: 'create_settings_profiles',
    up: async () => {
      // Check if tables already exist
      const profilesTableCheck = await db.execute(`
        SELECT name FROM sqlite_master
        WHERE type='table' AND name='settings_profiles'
      `);
      
      if (profilesTableCheck.rows.length === 0) {
        // Create settings_profiles table
        await db.execute(`
          CREATE TABLE settings_profiles (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            magic_code TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL,
            description TEXT,
            created_by INTEGER NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            is_active BOOLEAN DEFAULT 1,
            FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
          )
        `);
        
        // Create indexes
        await db.execute('CREATE INDEX IF NOT EXISTS idx_settings_profiles_magic_code ON settings_profiles(magic_code)');
        await db.execute('CREATE INDEX IF NOT EXISTS idx_settings_profiles_created_by ON settings_profiles(created_by)');
        await db.execute('CREATE INDEX IF NOT EXISTS idx_settings_profiles_is_active ON settings_profiles(is_active)');
        
        // Create settings_profile_values table
        await db.execute(`
          CREATE TABLE settings_profile_values (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            profile_id INTEGER NOT NULL,
            setting_key TEXT NOT NULL,
            setting_value TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (profile_id) REFERENCES settings_profiles(id) ON DELETE CASCADE,
            UNIQUE(profile_id, setting_key)
          )
        `);
        
        // Create indexes
        await db.execute('CREATE INDEX IF NOT EXISTS idx_settings_profile_values_profile_id ON settings_profile_values(profile_id)');
        await db.execute('CREATE INDEX IF NOT EXISTS idx_settings_profile_values_key ON settings_profile_values(setting_key)');
        
        console.log('✓ Created settings_profiles and settings_profile_values tables');
      } else {
        console.log('✓ Settings profiles tables already exist, skipping');
      }
    }
  },
  {
    id: 7,
    name: 'create_word_pronunciations',
    up: async () => {
      // Check if table already exists
      const tableCheck = await db.execute(`
        SELECT name FROM sqlite_master
        WHERE type='table' AND name='word_pronunciations'
      `);
      
      if (tableCheck.rows.length === 0) {
        // Create word_pronunciations table
        await db.execute(`
          CREATE TABLE word_pronunciations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            word_id INTEGER NOT NULL,
            voice_id TEXT NOT NULL DEFAULT 'default',
            audio_data BLOB NOT NULL,
            audio_format TEXT NOT NULL DEFAULT 'mp3',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (word_id) REFERENCES words(id) ON DELETE CASCADE,
            UNIQUE(word_id, voice_id)
          )
        `);
        
        // Create indexes
        await db.execute('CREATE INDEX IF NOT EXISTS idx_word_pronunciations_word_id ON word_pronunciations(word_id)');
        await db.execute('CREATE INDEX IF NOT EXISTS idx_word_pronunciations_voice_id ON word_pronunciations(voice_id)');
        
        console.log('✓ Created word_pronunciations table');
      } else {
        console.log('✓ Word pronunciations table already exists, skipping');
      }
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
  const executed = await db.execute('SELECT id, name FROM migrations ORDER BY id');
  const executedIds = new Set(executed.rows.map(r => r.id));
  
  if (executed.rows.length > 0) {
    console.log('Already executed migrations:');
    executed.rows.forEach((row: any) => {
      console.log(`  - ${row.id}: ${row.name}`);
    });
  }
  
  // Run pending migrations
  for (const migration of migrations) {
    if (!executedIds.has(migration.id)) {
      console.log(`\n🔄 Running migration: ${migration.name} (id: ${migration.id})...`);
      try {
        await migration.up();
        await db.execute({
          sql: 'INSERT INTO migrations (id, name) VALUES (?, ?)',
          args: [migration.id, migration.name]
        });
        console.log(`✅ Migration ${migration.name} completed\n`);
      } catch (error: any) {
        console.error(`❌ Migration ${migration.name} failed:`, error);
        console.error('Error details:', error.message);
        throw error;
      }
    } else {
      console.log(`⏭️  Migration ${migration.name} (id: ${migration.id}) already executed, skipping`);
    }
  }
  
  console.log('✅ All migrations completed');
  
  // Verify critical migrations actually worked - fix if needed
  try {
    // Verify role column exists
    await db.execute('SELECT role FROM users LIMIT 1');
    console.log('✅ Verified: role column exists');
  } catch (error: any) {
    if (error.message?.includes('no such column: role') || error.code === 'SQL_INPUT_ERROR') {
      console.error('⚠️  WARNING: Migration 4 marked as executed but role column missing!');
      console.log('🔧 Attempting to fix by running migration 4 again...');
      
      // Check if migration 4 is marked as executed
      const migration4Check = await db.execute({
        sql: 'SELECT id FROM migrations WHERE id = ?',
        args: [4]
      });
      
      if (migration4Check.rows.length > 0) {
        // Migration is marked as executed but column doesn't exist - fix it
        console.log('  Removing migration 4 from tracking table...');
        await db.execute({
          sql: 'DELETE FROM migrations WHERE id = ?',
          args: [4]
        });
        console.log('  Re-running migration 4...');
        const migration4 = migrations.find(m => m.id === 4);
        if (migration4) {
          await migration4.up();
          await db.execute({
            sql: 'INSERT INTO migrations (id, name) VALUES (?, ?)',
            args: [4, 'add_user_roles']
          });
          console.log('✅ Migration 4 fixed and completed');
        }
      }
    }
  }
  
  // Verify pets table was removed
  try {
    const petsCheck = await db.execute(`
      SELECT name FROM sqlite_master
      WHERE type='table' AND name='pets'
    `);
    
    if (petsCheck.rows.length > 0) {
      console.error('⚠️  WARNING: Migration 5 marked as executed but pets table still exists!');
      console.log('🔧 Attempting to fix by running migration 5 again...');
      
      // Check if migration 5 is marked as executed
      const migration5Check = await db.execute({
        sql: 'SELECT id FROM migrations WHERE id = ?',
        args: [5]
      });
      
      if (migration5Check.rows.length > 0) {
        // Migration is marked as executed but table still exists - fix it
        console.log('  Removing migration 5 from tracking table...');
        await db.execute({
          sql: 'DELETE FROM migrations WHERE id = ?',
          args: [5]
        });
        console.log('  Re-running migration 5...');
        const migration5 = migrations.find(m => m.id === 5);
        if (migration5) {
          await migration5.up();
          await db.execute({
            sql: 'INSERT INTO migrations (id, name) VALUES (?, ?)',
            args: [5, 'drop_pets_table']
          });
          console.log('✅ Migration 5 fixed and completed');
        }
      }
    } else {
      console.log('✅ Verified: pets table does not exist');
    }
  } catch (error: any) {
    console.error('⚠️  Error verifying pets table removal:', error.message);
  }
}


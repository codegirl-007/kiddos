import bcrypt from 'bcrypt';
import { db } from '../config/database.js';
import { env } from '../config/env.js';

export async function createInitialAdmin() {
  const users = await db.execute('SELECT COUNT(*) as count FROM users');
  const count = users.rows[0].count as number;
  
  if (count === 0) {
    const username = env.initialAdminUsername || 'admin';
    const password = env.initialAdminPassword;
    
    if (!password) {
      console.error('❌ FATAL: No users exist and INITIAL_ADMIN_PASSWORD not set');
      console.error('   Please set INITIAL_ADMIN_PASSWORD environment variable');
      process.exit(1);
    }
    
    const hash = await bcrypt.hash(password, 10);
    await db.execute({
      sql: 'INSERT INTO users (username, password_hash) VALUES (?, ?)',
      args: [username, hash]
    });
    
    console.log(`✓ Initial admin user created: ${username}`);
    console.log('  Please change the admin password after first login');
  }
}



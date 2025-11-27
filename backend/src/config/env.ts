import dotenv from 'dotenv';
dotenv.config();

const requiredEnvVars = [
  'TURSO_URL',
  'TURSO_AUTH_TOKEN',
  'YOUTUBE_API_KEY',
  'JWT_SECRET',
  'JWT_REFRESH_SECRET'
] as const;

const optionalEnvVars = {
  PORT: '3000',
  CORS_ORIGIN: 'http://localhost:5173',
  NODE_ENV: 'development',
  ACCESS_TOKEN_EXPIRY: '15m',
  REFRESH_TOKEN_EXPIRY: '7d',
  INITIAL_ADMIN_USERNAME: 'admin'
} as const;

export function validateEnv() {
  const missing: string[] = [];
  
  for (const varName of requiredEnvVars) {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  }
  
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach(v => console.error(`   - ${v}`));
    process.exit(1);
  }
  
  // Set defaults for optional vars
  for (const [key, defaultValue] of Object.entries(optionalEnvVars)) {
    if (!process.env[key]) {
      process.env[key] = defaultValue;
    }
  }
  
  console.log('✓ Environment variables validated');
}

export const env = {
  tursoUrl: process.env.TURSO_URL!,
  tursoAuthToken: process.env.TURSO_AUTH_TOKEN!,
  youtubeApiKey: process.env.YOUTUBE_API_KEY!,
  jwtSecret: process.env.JWT_SECRET!,
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET!,
  port: parseInt(process.env.PORT || '3000'),
  corsOrigin: process.env.CORS_ORIGIN!,
  nodeEnv: process.env.NODE_ENV!,
  accessTokenExpiry: process.env.ACCESS_TOKEN_EXPIRY!,
  refreshTokenExpiry: process.env.REFRESH_TOKEN_EXPIRY!,
  initialAdminUsername: process.env.INITIAL_ADMIN_USERNAME,
  initialAdminPassword: process.env.INITIAL_ADMIN_PASSWORD
};


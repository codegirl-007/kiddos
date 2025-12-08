import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { validateEnv, env } from './config/env.js';
import { runMigrations } from './db/migrate.js';
import { createInitialAdmin } from './setup/initialSetup.js';
import authRoutes from './routes/auth.routes.js';
import channelRoutes from './routes/channels.routes.js';
import videoRoutes from './routes/videos.routes.js';
import settingsRoutes from './routes/settings.routes.js';
import wordGroupsRoutes from './routes/wordGroups.routes.js';
import { errorHandler } from './middleware/errorHandler.js';
import { apiLimiter } from './middleware/rateLimiter.js';

async function startServer() {
  try {
    console.log('🚀 Starting Kiddos Backend...\n');
    
    // 1. Validate environment variables
    validateEnv();
    
    // 2. Run database migrations
    await runMigrations();
    
    // 3. Create initial admin if needed
    await createInitialAdmin();
    
    // 4. Set up Express app
    const app = express();
    
    // Middleware
    app.use(cors({
      origin: env.corsOrigin,
      credentials: true
    }));
    app.use(express.json());
    app.use(cookieParser());
    app.use('/api', apiLimiter);
    
    // Health check (for DigitalOcean)
    app.get('/api/health', (req, res) => {
      res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });
    
    // Routes
    app.use('/api/auth', authRoutes);
    app.use('/api/channels', channelRoutes);
    app.use('/api/videos', videoRoutes);
    app.use('/api/settings', settingsRoutes);
    app.use('/api/word-groups', wordGroupsRoutes);
    
    // Error handling
    app.use(errorHandler);
    
    // Start server
    app.listen(env.port, () => {
      console.log(`\n🚀 Server running on http://localhost:${env.port}`);
      console.log(`📊 Environment: ${env.nodeEnv}`);
      console.log(`🔒 CORS origin: ${env.corsOrigin}`);
      console.log(`\n✨ Backend is ready!\n`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();


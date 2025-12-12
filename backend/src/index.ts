import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { createServer } from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { validateEnv, env } from './config/env.js';
import { runMigrations } from './db/migrate.js';
import { createInitialAdmin } from './setup/initialSetup.js';
import authRoutes from './routes/auth.routes.js';
import channelRoutes from './routes/channels.routes.js';
import videoRoutes from './routes/videos.routes.js';
import settingsRoutes from './routes/settings.routes.js';
import wordGroupsRoutes from './routes/wordGroups.routes.js';
import usersRoutes from './routes/users.routes.js';
import settingsProfilesRoutes from './routes/settingsProfiles.routes.js';
import magicCodeRoutes from './routes/magicCode.routes.js';
import speechSoundsRoutes from './routes/speechSounds.routes.js';
import { errorHandler } from './middleware/errorHandler.js';
import { apiLimiter } from './middleware/rateLimiter.js';
import { createWebSocketServer } from './services/websocket.service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true, limit: '10mb' }));
    app.use(cookieParser());
    
    // Serve uploaded files statically (use absolute path)
    const uploadsPath = path.join(__dirname, '../uploads');
    app.use('/uploads', (req, res, next) => {
      // Set CORS headers for image files to allow pixel data reading
      // Use * for static files since they don't need credentials
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET');
      next();
    }, express.static(uploadsPath));
    
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
    app.use('/api/users', usersRoutes);
    app.use('/api/settings-profiles', settingsProfilesRoutes);
    app.use('/api/magic-code', magicCodeRoutes);
    app.use('/api/speech-sounds', speechSoundsRoutes);
    
    // Error handling
    app.use(errorHandler);
    
    // Create HTTP server
    const server = createServer(app);
    
    // Set up WebSocket server
    createWebSocketServer(server);
    
    // Start server
    server.listen(env.port, () => {
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


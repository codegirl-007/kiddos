# Kiddos - YouTube Channel Video Aggregator

A full-stack application for aggregating and displaying videos from multiple YouTube channels with a protected admin dashboard.

## Tech Stack

**Frontend:**
- React 18 with TypeScript
- Vite for build tooling
- React Router for navigation
- Axios for API calls

**Backend:**
- Node.js with Express
- TypeScript
- Turso (SQLite) database
- JWT authentication with refresh tokens
- bcrypt for password hashing
- YouTube Data API v3

## Features

- 📺 Display videos from multiple YouTube channels
- 🔍 Search and filter videos by channel, date, or popularity
- 🎬 Embedded video player
- 🔐 Protected admin dashboard with JWT authentication
- ⚡ Video caching to reduce YouTube API quota usage
- 📱 Fully responsive design (YouTube-inspired UI)
- ♻️ Token refresh mechanism for seamless authentication

## Setup Instructions

### Prerequisites

- Node.js 18+ installed
- Turso CLI installed
- YouTube Data API v3 key

### 1. Set Up Turso Database

```bash
# Install Turso CLI
curl -sSfL https://get.tur.so/install.sh | bash

# Create database
turso db create kiddos-db

# Get database URL
turso db show kiddos-db

# Create auth token
turso db tokens create kiddos-db
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create .env file from example
cp .env.example .env

# Edit .env with your values:
# - TURSO_URL (from turso db show)
# - TURSO_AUTH_TOKEN (from turso db tokens create)
# - YOUTUBE_API_KEY (from Google Cloud Console)
# - JWT_SECRET (generate a random 32+ character string)
# - JWT_REFRESH_SECRET (generate another random 32+ character string)
# - INITIAL_ADMIN_USERNAME (e.g., "admin")
# - INITIAL_ADMIN_PASSWORD (choose a secure password)

# Run migrations
npm run migrate

# Start development server
npm run dev
```

Backend will run on http://localhost:3000

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create .env file from example
cp .env.example .env

# Edit .env with:
# VITE_API_URL=http://localhost:3000/api

# Start development server
npm run dev
```

Frontend will run on http://localhost:5173

### 4. Run Both Concurrently (Optional)

From the root directory:

```bash
# Install concurrently
npm install

# Run both frontend and backend
npm run dev
```

## Usage

1. **Access the App**: Navigate to http://localhost:5173
2. **View Videos**: The homepage displays all videos from configured channels (public access)
3. **Admin Login**: Click "Login" and use the credentials you set in the backend .env file
4. **Add Channels**: Once logged in, go to the Admin page to add YouTube channels
   - Supports channel IDs (UC...), @handles, or full YouTube URLs
5. **Search & Filter**: Use the search bar and filters on the homepage to find specific videos

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login with username/password
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout and revoke refresh token
- `GET /api/auth/me` - Get current user info

### Channels (Admin protected)
- `GET /api/channels` - Get all channels (public)
- `POST /api/channels` - Add new channel (protected)
- `DELETE /api/channels/:id` - Remove channel (protected)
- `PUT /api/channels/:id/refresh` - Refresh channel data (protected)

### Videos
- `GET /api/videos` - Get videos with pagination/search/filters (public)
- `POST /api/videos/refresh` - Force refresh video cache (protected)

## Environment Variables

### Backend (.env)

```bash
# Required
TURSO_URL=libsql://your-database.turso.io
TURSO_AUTH_TOKEN=your-auth-token-here
YOUTUBE_API_KEY=your-youtube-api-key
JWT_SECRET=your-secret-key-min-32-chars
JWT_REFRESH_SECRET=your-refresh-secret-different-from-above

# Optional (with defaults)
PORT=3000
CORS_ORIGIN=http://localhost:5173
NODE_ENV=development
ACCESS_TOKEN_EXPIRY=15m
REFRESH_TOKEN_EXPIRY=7d

# Initial admin (required on first run)
INITIAL_ADMIN_USERNAME=admin
INITIAL_ADMIN_PASSWORD=change-this-secure-password
```

### Frontend (.env)

```bash
VITE_API_URL=http://localhost:3000/api
```

## YouTube API Key Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable "YouTube Data API v3"
4. Create credentials (API Key)
5. Restrict the key to YouTube Data API v3
6. Copy the API key to your backend .env file

## Security Features

- ✅ Passwords hashed with bcrypt (cost factor: 10)
- ✅ JWT access tokens (15 min expiry)
- ✅ Refresh tokens (7 day expiry, stored in database)
- ✅ httpOnly cookies for refresh tokens
- ✅ CORS configured for specific origins
- ✅ Rate limiting on login and API endpoints
- ✅ Input validation with Zod
- ✅ Parameterized SQL queries (SQL injection prevention)

## Performance Optimizations

- Video caching (1-hour default) to reduce YouTube API calls
- Parallel channel fetching using Promise.allSettled
- Database indexing on frequently queried fields
- Pagination to prevent loading all videos at once
- YouTube's CDN for optimized thumbnails

## YouTube API Quota

The free tier provides 10,000 units/day:
- Channel info request: ~1 unit
- Video list request: ~3-5 units

The app caches videos for 1 hour by default to minimize API usage.

## Production Deployment

### Deploy to DigitalOcean (Recommended - $5/month)

**Quick Start**: See [QUICKSTART.md](./QUICKSTART.md) for a 10-minute deployment guide.

**Detailed Guide**: See [DEPLOYMENT.md](./DEPLOYMENT.md) for complete deployment instructions, troubleshooting, and monitoring.

The app is pre-configured for one-click deployment to DigitalOcean's App Platform using the included `.do/app.yaml` configuration.

### Manual Deployment

#### Backend
1. Build: `npm run build`
2. Start: `npm start`
3. Use PM2 or systemd for process management
4. Set `NODE_ENV=production` in environment
5. Use nginx as reverse proxy
6. Set up SSL certificate (Let's Encrypt)

#### Frontend
1. Build: `npm run build`
2. Serve `dist` folder via nginx or CDN
3. Update `VITE_API_URL` to production backend URL

## Troubleshooting

**Backend won't start:**
- Check all required environment variables are set
- Verify Turso database URL and auth token are correct
- Ensure YouTube API key is valid

**Can't add channels:**
- Verify you're logged in as admin
- Check YouTube API quota hasn't been exceeded
- Ensure channel ID/URL format is correct

**Videos not showing:**
- Add channels from admin dashboard first
- Wait a moment for initial video fetch
- Check backend logs for errors

## License

MIT

## Contributing

Pull requests are welcome! Please ensure all tests pass and follow the existing code style.


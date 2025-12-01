# Deployment Guide - DigitalOcean App Platform

This guide will help you deploy the Kiddos app to DigitalOcean's App Platform.

## Prerequisites

1. **GitHub Repository**: Push your code to GitHub
2. **DigitalOcean Account**: Create an account at https://digitalocean.com
3. **Turso Database**: Have your Turso credentials ready
   - Get from: https://turso.tech
4. **YouTube API Key**: Get from Google Cloud Console
   - Visit: https://console.cloud.google.com
   - Enable YouTube Data API v3
   - Create API key

## Step 1: Prepare Your Repository

1. **Update `.do/app.yaml`**:
   ```bash
   # Edit .do/app.yaml
   # Replace YOUR_GITHUB_USERNAME/kiddos with your actual GitHub repo
   # Example: johndoe/kiddos
   ```

2. **Commit and push to GitHub**:
   ```bash
   git add .
   git commit -m "Add DigitalOcean deployment config"
   git push origin main
   ```

## Step 2: Create App on DigitalOcean

1. Go to https://cloud.digitalocean.com/apps
2. Click **"Create App"**
3. Select **"GitHub"** as source
4. Authorize DigitalOcean to access your repository
5. Select your `kiddos` repository
6. Choose your branch (usually `main`)
7. DigitalOcean will detect `.do/app.yaml` automatically
8. Click **"Next"**

## Step 3: Configure Environment Variables

DigitalOcean will prompt you to fill in the required environment variables (marked as `${VARIABLE}` in app.yaml).

### Required Secrets:

1. **TURSO_URL**
   - Your Turso database URL
   - Example: `libsql://your-database.turso.io`

2. **TURSO_AUTH_TOKEN**
   - Your Turso authentication token
   - Get from Turso dashboard

3. **YOUTUBE_API_KEY**
   - Your YouTube Data API v3 key
   - Get from Google Cloud Console

4. **JWT_SECRET**
   - A long random string (32+ characters)
   - Generate with: `openssl rand -base64 32`

5. **JWT_REFRESH_SECRET**
   - A different long random string (32+ characters)
   - Generate with: `openssl rand -base64 32`

6. **INITIAL_ADMIN_USERNAME**
   - Your admin username (e.g., "admin")

7. **INITIAL_ADMIN_PASSWORD**
   - A secure password for admin account
   - Make it strong!

### Optional Variables:

These will be auto-populated by DigitalOcean:
- `APP_URL` - Automatically set to your frontend URL
- `backend.PUBLIC_URL` - Automatically set to your backend URL

## Step 4: Review and Deploy

1. Review the configuration:
   - **Backend**: Node.js service on Basic XXS ($5/month)
   - **Frontend**: Static site (FREE)
   
2. Choose your datacenter region (default: NYC)

3. Click **"Create Resources"**

4. Wait for deployment (usually 5-10 minutes)

## Step 5: Post-Deployment

### Get Your URLs

After deployment completes, you'll have:
- **Frontend URL**: `https://kiddos-xxxxx.ondigitalocean.app`
- **Backend URL**: `https://kiddos-backend-xxxxx.ondigitalocean.app`

### Update CORS Settings (if needed)

If you have multiple domains or custom domain:

1. Go to your app in DigitalOcean
2. Click on **"backend"** component
3. Go to **"Environment Variables"**
4. Update `CORS_ORIGIN` to include your custom domain
5. Redeploy

## Step 6: Test Your Deployment

1. Visit your frontend URL
2. You should see the video grid
3. Click **"Login"**
4. Use your admin credentials
5. Go to **"Admin"** page
6. Try adding a YouTube channel

## Troubleshooting

### Backend Fails to Start

**Check logs:**
1. Go to your app in DigitalOcean
2. Click on **"backend"** component
3. Go to **"Runtime Logs"**

**Common issues:**
- Missing environment variables
- Invalid Turso credentials
- Invalid YouTube API key

### Frontend Shows API Errors

**Check:**
1. Frontend environment variables
2. Backend is running (check backend URL)
3. CORS is configured correctly
4. Network tab in browser DevTools

### Database Migration Fails

**Solution:**
1. Check Turso database is accessible
2. Verify `TURSO_URL` and `TURSO_AUTH_TOKEN`
3. Check backend logs for specific error

## Monitoring

### View Logs

**Backend logs:**
```
App Platform → Your App → backend → Runtime Logs
```

**Build logs:**
```
App Platform → Your App → backend → Build Logs
```

### View Metrics

```
App Platform → Your App → Insights
```

Shows:
- CPU usage
- Memory usage
- Request count
- Response times

## Updating Your App

### Automatic Deployments

When you push to your GitHub repository, DigitalOcean will automatically:
1. Detect the change
2. Build your app
3. Run tests (if configured)
4. Deploy new version

### Manual Deployments

1. Go to your app in DigitalOcean
2. Click **"Create Deployment"**
3. Select branch
4. Click **"Deploy"**

## Custom Domain (Optional)

1. Go to your app → **Settings** → **Domains**
2. Click **"Add Domain"**
3. Enter your domain name
4. Follow DNS configuration instructions
5. Wait for SSL certificate provisioning

## Cost Breakdown

- **Backend (Basic XXS)**: $5/month
- **Frontend (Static Site)**: FREE
- **Turso Database**: FREE tier (up to 9 GB)
- **Bandwidth**: 100 GB/month included

**Total: ~$5/month**

## Scaling

To upgrade:
1. Go to your app
2. Click on **"backend"** component
3. Go to **"Resources"**
4. Choose a larger instance size
5. Click **"Save"**

Available sizes:
- Basic XXS: $5/month (512 MB RAM)
- Basic XS: $12/month (1 GB RAM)
- Basic S: $25/month (2 GB RAM)

## Support

- **DigitalOcean Docs**: https://docs.digitalocean.com/products/app-platform/
- **Turso Docs**: https://docs.turso.tech
- **YouTube API Docs**: https://developers.google.com/youtube/v3

## Security Checklist

- ✅ All secrets stored as encrypted environment variables
- ✅ CORS configured to only allow your domain
- ✅ JWT tokens use httpOnly cookies
- ✅ Rate limiting enabled on API
- ✅ Admin password is strong
- ✅ HTTPS enabled automatically by DigitalOcean

---

**Ready to deploy?** Follow the steps above and you'll be live in minutes! 🚀




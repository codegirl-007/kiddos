# Quick Start - Deploy to DigitalOcean

**Time to deploy: ~10 minutes**

## Before You Start

Gather these items:
- [ ] GitHub repository URL
- [ ] Turso database URL and auth token ([Get from Turso](https://turso.tech))
- [ ] YouTube API key ([Get from Google](https://console.cloud.google.com))
- [ ] Admin username and password (you choose these)

## Deploy in 4 Steps

### 1. Update Configuration (2 minutes)

Edit `.do/app.yaml` and replace `YOUR_GITHUB_USERNAME/kiddos` with your actual GitHub repo:

```yaml
github:
  repo: johndoe/kiddos  # <-- Change this
  branch: main
```

### 2. Push to GitHub (1 minute)

```bash
git add .
git commit -m "Add DigitalOcean deployment config"
git push origin main
```

### 3. Create App on DigitalOcean (5 minutes)

1. Go to https://cloud.digitalocean.com/apps
2. Click **"Create App"**
3. Select **GitHub** and authorize
4. Select your `kiddos` repository
5. Choose `main` branch
6. DigitalOcean detects `.do/app.yaml` ✨
7. Click **"Next"**

### 4. Add Environment Variables (2 minutes)

Fill in these required values:

```
TURSO_URL = libsql://your-database.turso.io
TURSO_AUTH_TOKEN = your-token-here
YOUTUBE_API_KEY = your-youtube-api-key
JWT_SECRET = (generate with: openssl rand -base64 32)
JWT_REFRESH_SECRET = (generate with: openssl rand -base64 32)
INITIAL_ADMIN_USERNAME = admin
INITIAL_ADMIN_PASSWORD = your-secure-password
```

**Click "Create Resources"** and wait for deployment!

---

## After Deployment

1. Visit your app URL (shown in DigitalOcean)
2. Login with your admin credentials
3. Add YouTube channels in the admin panel
4. Done! 🎉

---

## Need Help?

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions and troubleshooting.

## Cost

- **$5/month** for backend
- **FREE** for frontend
- **FREE** for database (Turso free tier)

**Total: $5/month**



# Deployment Guide

This guide covers deploying LifeHub with the client on Netlify and PocketBase on Railway.

## Architecture

- **Frontend (SvelteKit)**: Deployed on Netlify
- **Backend (PocketBase)**: Deployed on Railway
- **Database**: SQLite (managed by PocketBase on Railway)

## Prerequisites

- GitHub account
- Netlify account ([netlify.com](https://netlify.com))
- Railway account ([railway.app](https://railway.app))
- Your code pushed to a GitHub repository

---

## Part 1: Deploy PocketBase to Railway

### Step 1: Create Railway Project

1. Go to [railway.app](https://railway.app) and sign in
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Choose your `lifehub` repository
5. Railway will detect the `Dockerfile` and `railway.json`

### Step 2: Configure Railway Environment

1. In your Railway project, go to **Variables**
2. Add the following environment variables:
   ```
   PORT=8090
   ```

### Step 3: Add Volume for Data Persistence

1. In Railway, go to your service settings
2. Click **"Volumes"**
3. Add a new volume:
   - **Mount Path**: `/pb_data`
   - **Size**: 1GB (or more as needed)

### Step 4: Deploy

1. Railway will automatically deploy
2. Once deployed, go to **Settings** → **Networking**
3. Click **"Generate Domain"** to get your public URL
4. Copy this URL (e.g., `https://your-app.railway.app`)

### Step 5: Initialize PocketBase Admin

1. Visit your Railway URL: `https://your-app.railway.app/_/`
2. Create your admin account
3. The database will be automatically initialized with migrations

---

## Part 2: Deploy Frontend to Netlify

### Step 1: Create Netlify Site

1. Go to [netlify.com](https://netlify.com) and sign in
2. Click **"Add new site"** → **"Import an existing project"**
3. Choose **GitHub** and select your `lifehub` repository
4. Netlify will auto-detect the build settings from `netlify.toml`

### Step 2: Configure Environment Variables

1. In Netlify, go to **Site settings** → **Environment variables**
2. Add the following variable:
   ```
   VITE_POCKETBASE_URL=https://your-app.railway.app
   ```
   (Replace with your actual Railway URL from Part 1, Step 4)

### Step 3: Deploy

1. Click **"Deploy site"**
2. Netlify will build and deploy your app
3. Once complete, you'll get a URL like `https://your-site.netlify.app`

### Step 4: Custom Domain (Optional)

1. In Netlify, go to **Domain settings**
2. Click **"Add custom domain"**
3. Follow the instructions to configure your DNS

---

## Part 3: Configure CORS in PocketBase

After both deployments are complete:

1. Visit your Railway PocketBase admin: `https://your-app.railway.app/_/`
2. Go to **Settings** → **Application**
3. Add your Netlify URL to **Allowed origins**:
   ```
   https://your-site.netlify.app
   ```
4. If using a custom domain, add that too
5. Click **Save**

---

## Verification

### Test the Deployment

1. Visit your Netlify URL: `https://your-site.netlify.app`
2. Try to sign up or log in
3. Create some test data (locations, tasks, etc.)
4. Verify data persists after page refresh

### Check Logs

**Railway (PocketBase):**
- Go to your Railway project
- Click on your service
- View **Deployments** → **Logs**

**Netlify (Frontend):**
- Go to your Netlify site
- Click **Deploys**
- View build logs for any deployment

---

## Environment Variables Summary

### Railway (PocketBase)
```
PORT=8090
```

### Netlify (Frontend)
```
VITE_POCKETBASE_URL=https://your-app.railway.app
```

---

## Updating the App

### Update Frontend
1. Push changes to your GitHub repository
2. Netlify will automatically rebuild and deploy

### Update PocketBase
1. Push changes to your GitHub repository
2. Railway will automatically rebuild and deploy
3. Migrations in `pocketbase/pb_migrations/` will run automatically

---

## Troubleshooting

### Frontend can't connect to PocketBase
- Check `VITE_POCKETBASE_URL` in Netlify environment variables
- Verify CORS settings in PocketBase admin
- Check Railway service is running

### PocketBase data lost after restart
- Ensure Railway volume is properly mounted to `/pb_data`
- Check volume is attached in Railway settings

### Build fails on Netlify
- Check build logs in Netlify
- Verify all dependencies are in `package.json`
- Ensure Node version is 20 (set in `netlify.toml`)

### Migrations not running
- Check Railway logs for migration errors
- Verify migration files are in `pocketbase/pb_migrations/`
- Ensure Dockerfile copies migrations correctly

---

## Costs

### Railway
- **Free Tier**: $5 credit/month (hobby plan)
- **Pro Plan**: $20/month for more resources
- Volume storage: Included in plan

### Netlify
- **Free Tier**: 100GB bandwidth, 300 build minutes/month
- **Pro Plan**: $19/month for more bandwidth and features

---

## Security Recommendations

1. **Enable HTTPS**: Both Railway and Netlify provide SSL by default
2. **Set Strong Admin Password**: Use a password manager
3. **Backup Data**: Export PocketBase data regularly from admin panel
4. **Environment Variables**: Never commit `.env` files to git
5. **CORS**: Only allow your actual domain(s) in PocketBase settings

---

## Backup Strategy

### Manual Backup
1. Go to PocketBase admin: `https://your-app.railway.app/_/`
2. Go to **Settings** → **Backups**
3. Click **"Create backup"**
4. Download the backup file

### Automated Backups
Consider setting up automated backups using Railway's backup features or external services.

---

## Support

- **Railway Docs**: [docs.railway.app](https://docs.railway.app)
- **Netlify Docs**: [docs.netlify.com](https://docs.netlify.com)
- **PocketBase Docs**: [pocketbase.io/docs](https://pocketbase.io/docs)

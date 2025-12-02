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

### ⚡ Quick Deploy (Recommended)

**Use the official PocketBase Railway template for fastest deployment:**

1. **Click to deploy**: [https://railway.app/template/pocketbase](https://railway.app/template/pocketbase)
2. Click **"Deploy Now"**
3. Sign in to Railway (or create account)
4. Click **"Deploy"**
5. Wait 2-3 minutes for deployment
6. Get your URL from Settings → Public Networking
7. Access admin panel: `https://your-app.up.railway.app/_/`
8. Create your admin account

✅ **Done!** Your PocketBase is now running on Railway with persistent storage.

### 📋 Import Your Schema

After deploying, import your local schema:

#### Export from Local PocketBase

1. **Start your local PocketBase**:
   ```bash
   cd pocketbase
   ./pocketbase serve
   ```

2. **Access local admin panel**:
   - Visit: http://localhost:8090/_/
   - Log in with your admin credentials

3. **Export collections**:
   - Click **Settings** (gear icon) in the left sidebar
   - Click **"Import/Export"** tab
   - Click **"Export collections"** button
   - Save the file as `pb_schema_export.json`

**What gets exported:**
- All collection definitions (appointments, jobs, shifts, tasks, trips)
- Field configurations
- API rules (create, read, update, delete)
- Indexes
- Auth settings

**Note:** This exports only the **schema** (structure), not your actual data (records).

#### Import to Railway PocketBase

1. **Access Railway admin panel**:
   - Visit: `https://your-app.up.railway.app/_/`
   - Log in with the admin account you created

2. **Import collections**:
   - Click **Settings** (gear icon)
   - Click **"Import/Export"** tab
   - Click **"Import collections"** button
   - Select your `pb_schema_export.json` file
   - Click **"Review"**

3. **Review changes**:
   - ✅ Green = New collections to be created
   - 🔵 Blue = Existing collections to be updated
   - ❌ Red = Collections to be deleted (if any)

4. **Confirm import**:
   - Review the changes carefully
   - Click **"Confirm and import"**
   - Wait for import to complete (~5 seconds)

5. **Verify import**:
   - Check the left sidebar for your collections
   - Click on each to verify fields and rules

---

### Alternative: Deploy from Your Repository

If you prefer to deploy from your own GitHub repo:

#### Step 1: Create Railway Project

1. Go to [railway.app](https://railway.app) and sign in
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Choose your `lifehub` repository
5. Railway will detect the `Dockerfile` and `railway.json`

#### Step 2: Configure Railway Settings

1. In your Railway project, go to **Settings**
2. Under **Build**, ensure it says "Dockerfile detected"
3. Railway will automatically set the `PORT` environment variable
4. No additional environment variables needed for basic setup

#### Step 3: Add Volume for Data Persistence

1. In Railway, go to your service settings
2. Click **"Volumes"**
3. Add a new volume:
   - **Mount Path**: `/pb_data`
   - **Size**: 1GB (or more as needed)

#### Step 4: Deploy

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

### Step 1: Push Code to GitHub

```bash
git add .
git commit -m "Configure production deployment"
git push
```

### Step 2: Create Netlify Site

1. Go to [netlify.com](https://netlify.com) and sign in
2. Click **"Add new site"** → **"Import an existing project"**
3. Choose **GitHub** and select your `lifehub` repository
4. Configure build settings:
   - **Build command**: `npm run build`
   - **Publish directory**: `build`
   - **Base directory**: (leave empty)

### Step 3: Configure Environment Variables

In the deploy configuration screen:
1. Click **"Add environment variables"**
2. Add the following variable:
   - **Key**: `PUBLIC_POCKETBASE_URL`
   - **Value**: `https://your-app.railway.app`
   
   (Replace with your actual Railway URL)

### Step 4: Deploy

1. Click **"Deploy site"**
2. Wait 2-3 minutes for build to complete
3. Copy your Netlify URL (e.g., `https://your-app.netlify.app`)

### Step 5: Custom Domain (Optional)

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

### Local Development (.env)
```bash
# Use Railway PocketBase for development
VITE_POCKETBASE_URL=https://your-app.railway.app

# Or use local PocketBase with proxy
# VITE_POCKETBASE_URL=/pb

# Twilio (optional, for SMS notifications)
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_FROM=

# Notification Settings
NOTIFY_TIMEZONE=America/Los_Angeles
REMINDER_LOOKAHEAD_MIN=90
```

### Railway (PocketBase)
```bash
# Railway automatically sets PORT - no manual configuration needed
# Template deployment handles all configuration automatically
```

### Netlify (Frontend)
```bash
PUBLIC_POCKETBASE_URL=https://your-app.railway.app
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

### ❌ "Failed to fetch" Error

**Problem**: Frontend can't connect to PocketBase

**Solutions**:
1. Check CORS settings in PocketBase (Settings → Application → Allowed origins)
2. Verify `PUBLIC_POCKETBASE_URL` is correct in Netlify
3. Make sure Railway PocketBase is running
4. Check browser console for specific error messages

### ❌ Import Failed

**Problem**: Schema import shows errors

**Solutions**:
1. Verify JSON file is valid (check for syntax errors)
2. Check for collection name conflicts
3. Review Railway logs for details
4. Try importing collections one at a time manually

### ❌ Railway Deployment Failed

**Problem**: PocketBase won't start on Railway

**Solutions**:
1. Check Railway deployment logs
2. Verify environment variables are set
3. Make sure volume is attached (for template deployment, this is automatic)
4. Try redeploying

### ❌ Data Not Showing

**Problem**: Collections exist but no data appears

**Solutions**:
1. Check API rules (make sure they allow access)
2. Verify authentication is working
3. Check collection permissions in PocketBase admin
4. Test with admin account first

### ❌ Build Fails on Netlify

**Problem**: Netlify build errors

**Solutions**:
1. Check build logs in Netlify for specific errors
2. Verify all dependencies are in `package.json`
3. Ensure Node version is 20 (set in `netlify.toml`)
4. Try building locally first: `npm run build`

### ❌ PocketBase Data Lost After Restart

**Problem**: Data disappears when Railway restarts

**Solutions**:
1. Ensure Railway volume is properly mounted (template handles this automatically)
2. Check volume is attached in Railway settings
3. Verify `/pb_data` path is correct

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

## Migrating Data (Optional)

If you want to migrate existing data from local to Railway:

### Option 1: Manual Export/Import

1. **Export data from local**:
   - In local admin panel, go to each collection
   - Click the export icon
   - Save as CSV or JSON

2. **Import to Railway**:
   - In Railway admin panel, go to each collection
   - Click the import icon
   - Upload your CSV/JSON file

### Option 2: Use PocketBase API

Create a migration script to copy records via API:

```javascript
// migrate-data.js
const PocketBase = require('pocketbase/cjs');

const localPB = new PocketBase('http://localhost:8090');
const remotePB = new PocketBase('https://your-app.railway.app');

async function migrate() {
  // Authenticate as admin
  await localPB.admins.authWithPassword('local@admin.com', 'password');
  await remotePB.admins.authWithPassword('remote@admin.com', 'password');

  // Migrate each collection
  const collections = ['tasks', 'appointments', 'jobs', 'shifts', 'trips'];
  
  for (const collection of collections) {
    const records = await localPB.collection(collection).getFullList();
    
    for (const record of records) {
      try {
        await remotePB.collection(collection).create(record);
        console.log(`✅ Migrated ${collection}: ${record.id}`);
      } catch (error) {
        console.error(`❌ Failed ${collection}: ${record.id}`, error);
      }
    }
  }
}

migrate();
```

Run with: `node migrate-data.js`

---

## Quick Reference

### Important URLs
```
Local PocketBase:    http://localhost:8090
Local Admin:         http://localhost:8090/_/
Railway PocketBase:  https://your-app.railway.app
Railway Admin:       https://your-app.railway.app/_/
Netlify Frontend:    https://your-app.netlify.app
```

### Common Commands
```bash
# Local development
cd pocketbase && ./pocketbase serve
npm run dev

# Build for production
npm run build

# Deploy (auto via git push)
git add .
git commit -m "Your message"
git push
```

---

## Support

- **Railway Docs**: [docs.railway.app](https://docs.railway.app)
- **Netlify Docs**: [docs.netlify.com](https://docs.netlify.com)
- **PocketBase Docs**: [pocketbase.io/docs](https://pocketbase.io/docs)
- **Railway Discord**: [discord.gg/railway](https://discord.gg/railway)
- **PocketBase Discord**: [discord.gg/pocketbase](https://discord.gg/pocketbase)

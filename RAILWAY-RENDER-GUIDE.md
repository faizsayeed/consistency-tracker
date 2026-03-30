# 🚀 Render + Railway Deployment Guide

## Architecture
- **Render**: Web Service (Node.js Backend + Frontend)
- **Railway**: MySQL Database

---

## Step 1: Set Up Railway MySQL Database

### 1.1 Create Railway Account & Project

1. Go to [railway.app](https://railway.app)
2. Sign up/login with GitHub
3. Click **"New Project"**
4. Select **"Provision MySQL"**
5. Wait for MySQL to provision (takes 1-2 minutes)

### 1.2 Get Database Connection Details

1. Click on your MySQL service
2. Go to **"Connect"** tab
3. Copy the **"MySQL Connection URL"** (looks like):
   ```
   mysql://root:password@containers.railway.app:3306/railway
   ```

4. Or get individual variables from **"Variables"** tab:
   - `MYSQLHOST` - Database host
   - `MYSQLPORT` - Port (usually 3306)
   - `MYSQLUSER` - Username (usually root)
   - `MYSQLPASSWORD` - Password
   - `MYSQLDATABASE` - Database name

---

## Step 2: Deploy to Render

### 2.1 Create Web Service on Render

1. Go to [render.com](https://render.com)
2. Click **"New"** → **"Web Service"**
3. Connect your GitHub repository
4. Configure:

   | Setting | Value |
   |---------|-------|
   | **Name** | `consistency-tracker` |
   | **Environment** | `Node` |
   | **Region** | Choose closest to you |
   | **Branch** | `main` |
   | **Build Command** | `cd backend && npm install` |
   | **Start Command** | `node backend/server.js` |
   | **Plan** | Free |

### 2.2 Add Environment Variables

Click **"Advanced"** → **"Add Environment Variable"** and add these:

```
NODE_ENV=production
PORT=10000

# From Railway MySQL (use your actual values)
DB_HOST=containers.railway.app
DB_USER=root
DB_PASSWORD=your-railway-password
DB_NAME=railway
DB_PORT=3306

# Generate a strong random string
JWT_SECRET=your-super-secret-jwt-key-here

# Optional: Email notifications
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Optional: SMS notifications  
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token
TWILIO_PHONE_NUMBER=+1234567890
```

### 2.3 Deploy

Click **"Create Web Service"**

Wait for deployment (takes 2-3 minutes)

---

## Step 3: Update Frontend API URL

### 3.1 Get Render URL

After deployment, copy your Render URL:
```
https://consistency-tracker.onrender.com
```

### 3.2 Update index.html

Edit `frontend/index.html`:

```html
<script>
    // Production API URL - your Render backend URL
    window.API_URL = 'https://consistency-tracker.onrender.com';
</script>
```

### 3.3 Commit and Push

```bash
git add .
git commit -m "Update production API URL"
git push origin main
```

Render will auto-redeploy with the new settings.

---

## Step 4: Database Connection Verification

### 4.1 Check Render Logs

In Render Dashboard:
1. Click your service
2. Go to **"Logs"** tab
3. Look for:
   ```
   Database connected successfully
   ```

If you see connection errors, check:
- Environment variables are correct
- Railway MySQL is running
- SSL setting is enabled in database.js

### 4.2 Initialize Database Tables

The app auto-creates tables on first start, but you can verify:

1. In Render Dashboard → **"Shell"** tab
2. Run:
   ```bash
   cd backend && npm run setup-db
   ```

---

## Step 5: Test Your App

1. Visit your Render URL: `https://consistency-tracker.onrender.com`
2. Register a new account
3. Add a habit in Dashboard
4. Mark it complete
5. Check Analytics heatmap
6. Verify data persists after refresh

---

## Railway + Render Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    RENDER (Web Service)                  │
│  ┌─────────────────────────────────────────────────┐  │
│  │  Node.js + Express Backend                        │  │
│  │  ├── API Routes (/api/auth, /api/habits, etc.)   │  │
│  │  └── Serves Frontend Static Files                 │  │
│  └─────────────────────────────────────────────────┘  │
│  ┌─────────────────────────────────────────────────┐  │
│  │  Frontend (AngularJS)                           │  │
│  │  └── Served from /frontend directory              │  │
│  └─────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                          │
                          │ MySQL Connection
                          │ (SSL enabled)
                          ▼
┌─────────────────────────────────────────────────────────┐
│                  RAILWAY (MySQL)                         │
│  ┌─────────────────────────────────────────────────┐    │
│  │  MySQL 8.0 Database                             │    │
│  │  ├── users table                                │    │
│  │  ├── habits table                               │    │
│  │  ├── habit_logs table                           │    │
│  │  └── notifications table                        │    │
│  └─────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

---

## Troubleshooting

### Issue: "Cannot connect to database"

**Solution:**
1. Check Railway MySQL is running (green indicator)
2. Verify environment variables in Render:
   ```
   DB_HOST=containers.railway.app
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=your-actual-password
   DB_NAME=railway
   ```
3. Ensure `ssl: { rejectUnauthorized: false }` is in database.js (already done)

### Issue: CORS errors in browser

**Solution:**
Update `backend/server.js` with your Render URL:
```javascript
origin: process.env.NODE_ENV === 'production' 
  ? ['https://consistency-tracker.onrender.com'] 
  : ['http://localhost:3000'],
```

### Issue: Frontend not loading

**Solution:**
1. Check `window.API_URL` is set correctly in index.html
2. Verify static file serving in server.js
3. Check Render logs for errors

### Issue: "Application Error" on Render

**Solution:**
1. Check Render logs for startup errors
2. Verify `npm install` succeeded in build
3. Check all environment variables are set
4. Ensure database connection works

---

## Free Tier Limits

### Render (Free)
- **RAM**: 512 MB
- **CPU**: Shared
- **Sleep**: After 15 min inactivity (cold start ~30s)
- **Bandwidth**: 100 GB/month
- **Build Minutes**: 500/month

### Railway (Free Trial)
- **$5 credit** per month
- MySQL usage: ~$0.50-1/month for light usage
- **Alternative**: Use PlanetScale (free 5GB) if Railway credit runs out

---

## Alternative: Use PlanetScale Instead of Railway

If Railway credits run out:

1. Go to [planetscale.com](https://planetscale.com)
2. Create free database (5GB limit)
3. Get connection string
4. Update Render environment variables with PlanetScale details

---

## Useful Commands

```bash
# Check if your app is working locally with production DB
# (testing before deploy)
cd backend
DB_HOST=containers.railway.app DB_USER=root DB_PASSWORD=xxx DB_NAME=railway npm start

# View Render logs
# (in Render Dashboard → Logs tab)

# Restart service
# (in Render Dashboard → Manual Deploy → Deploy Latest Commit)
```

---

## Quick Checklist

- [ ] Railway MySQL created and running
- [ ] Copied all Railway connection details
- [ ] Created Render Web Service
- [ ] Added all environment variables to Render
- [ ] Updated `window.API_URL` in frontend/index.html
- [ ] Pushed changes to GitHub
- [ ] Verified database connection in logs
- [ ] Tested registration and habit tracking
- [ ] Confirmed heatmap shows data

---

**Need Help?**
- Railway Docs: https://docs.railway.app
- Render Docs: https://render.com/docs
- Railway MySQL Guide: https://docs.railway.app/databases/mysql

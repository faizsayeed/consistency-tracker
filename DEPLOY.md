# 🚀 Consistency Tracker - Render Deployment Guide

## Overview
This guide will help you deploy the Consistency Tracker application to Render (https://render.com).

## Architecture
- **Backend**: Node.js + Express + MySQL
- **Frontend**: AngularJS (static files)
- **Database**: MySQL (Render or external provider)

## Prerequisites
1. [Render](https://render.com) account (free tier available)
2. MySQL database (can use Render or external like PlanetScale, Railway, etc.)
3. Your project pushed to GitHub

---

## Step 1: Prepare Your Repository

### 1.1 Update API Configuration for Production

Update `frontend/js/services.js` to use environment-based API URL:

```javascript
// In services.js, change this line:
app.constant('API_URL', 'http://localhost:3000/api');

// To this (we'll set this in index.html dynamically):
app.constant('API_URL', window.API_URL || 'http://localhost:3000/api');
```

### 1.2 Create Root-Level package.json

Create `package.json` in the root directory:

```json
{
  "name": "consistency-tracker",
  "version": "1.0.0",
  "scripts": {
    "start": "cd backend && npm start"
  },
  "engines": {
    "node": "18.x"
  }
}
```

---

## Step 2: Set Up MySQL Database

### Option A: Render MySQL (Recommended)

1. In Render Dashboard, click **New** → **PostgreSQL** (Render doesn't have MySQL natively)
   - **Alternative**: Use external MySQL provider like:
     - [PlanetScale](https://planetscale.com) (free MySQL)
     - [Railway](https://railway.app)
     - [Aiven](https://aiven.io)
     - [TiDB Cloud](https://tidbcloud.com)

### Option B: PlanetScale (Free MySQL - Recommended)

1. Sign up at [PlanetScale](https://planetscale.com)
2. Create a new database
3. Get connection details (hostname, username, password)
4. You'll get a connection string like:
   ```
   mysql://username:password@host:3306/database
   ```

---

## Step 3: Create Render Services

### 3.1 Create Web Service (Backend)

1. In Render Dashboard, click **New** → **Web Service**
2. Connect your GitHub repository
3. Configure:
   - **Name**: `consistency-tracker`
   - **Environment**: `Node`
   - **Build Command**: `cd backend && npm install`
   - **Start Command**: `cd backend && npm start`
   - **Plan**: Free (or paid for production)

4. Add Environment Variables:
   ```
   NODE_ENV=production
   PORT=10000
   DB_HOST=your-db-host.com
   DB_USER=your-db-username
   DB_PASSWORD=your-db-password
   DB_NAME=consistency_tracker
   DB_PORT=3306
   JWT_SECRET=your-super-secret-jwt-key-here
   
   # Optional: Email notifications (Gmail SMTP)
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-app-password
   
   # Optional: SMS notifications (Twilio)
   TWILIO_ACCOUNT_SID=your-twilio-sid
   TWILIO_AUTH_TOKEN=your-twilio-token
   TWILIO_PHONE_NUMBER=+1234567890
   ```

### 3.2 Create Static Site (Frontend)

1. In Render Dashboard, click **New** → **Static Site**
2. Connect the same GitHub repository
3. Configure:
   - **Name**: `consistency-tracker-frontend`
   - **Build Command**: (leave empty)
   - **Publish Directory**: `frontend`
   
4. Add Environment Variable:
   ```
   API_URL=https://consistency-tracker.onrender.com/api
   ```

---

## Step 4: Update Frontend for Production

### 4.1 Update index.html

In `frontend/index.html`, add before the closing `</body>` tag:

```html
<script>
  // Set API URL for production
  window.API_URL = 'https://your-backend-service.onrender.com/api';
</script>
```

Replace with your actual backend URL from Render.

### 4.2 Update CORS in Backend

In `backend/server.js`, update CORS configuration:

```javascript
// Update CORS to allow your frontend domain
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://consistency-tracker-frontend.onrender.com',
    'https://your-custom-domain.com'
  ],
  credentials: true
}));
```

---

## Step 5: Alternative - Single Service Deployment (Simpler)

Instead of separate services, you can deploy both frontend and backend as one service:

### 5.1 Update Server.js

Modify `backend/server.js` to serve frontend properly:

```javascript
const path = require('path');

// Serve static files from frontend directory
app.use(express.static(path.join(__dirname, '../frontend')));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/habits', habitRoutes);
app.use('/api/logs', logRoutes);

// Serve index.html for all other routes (SPA support)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});
```

### 5.2 Single Service Configuration

In Render, create just one Web Service:
- **Name**: `consistency-tracker`
- **Build Command**: `cd backend && npm install`
- **Start Command**: `node backend/server.js`
- **Plan**: Free

This serves both API and frontend from one URL.

---

## Step 6: Database Migration

### 6.1 Run Database Setup Script

After deployment, run the database setup:

1. In Render, go to your service → **Shell**
2. Run: `cd backend && npm run setup-db`

Or, the server will auto-initialize tables on first start (check `initDatabase()` in server.js).

---

## Step 7: Environment Variables Reference

### Required Variables:

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Environment | `production` |
| `PORT` | Server port | `10000` |
| `DB_HOST` | MySQL host | `db.planetscale.com` |
| `DB_USER` | MySQL username | `username` |
| `DB_PASSWORD` | MySQL password | `password` |
| `DB_NAME` | Database name | `consistency_tracker` |
| `DB_PORT` | MySQL port | `3306` |
| `JWT_SECRET` | JWT signing key | `your-secret-key` |

### Optional Variables (Notifications):

| Variable | Description |
|----------|-------------|
| `EMAIL_HOST` | SMTP host |
| `EMAIL_PORT` | SMTP port |
| `EMAIL_USER` | Email username |
| `EMAIL_PASS` | Email password |
| `TWILIO_ACCOUNT_SID` | Twilio SID |
| `TWILIO_AUTH_TOKEN` | Twilio token |
| `TWILIO_PHONE_NUMBER` | Twilio phone |

---

## Step 8: Testing Deployment

1. Visit your Render URL: `https://consistency-tracker.onrender.com`
2. Register a new account
3. Add a habit
4. Check the heatmap in Analytics
5. Test habit completion

---

## Troubleshooting

### Issue: Database Connection Fails

**Solution**: Check environment variables and ensure MySQL allows connections from Render's IP.

### Issue: Frontend Can't Connect to API

**Solution**: 
- Check CORS settings in backend
- Verify `window.API_URL` in frontend
- Check browser console for errors

### Issue: "Application Error" on Render

**Solution**: 
- Check Render logs
- Ensure all environment variables are set
- Verify `npm install` runs successfully

### Issue: Static Files Not Loading

**Solution**: Check the path in `server.js`:
```javascript
// For single service:
app.use(express.static(path.join(__dirname, '../frontend')));
```

---

## Quick Start Commands

```bash
# Push to GitHub
git add .
git commit -m "Ready for Render deployment"
git push origin main

# Then follow Render dashboard instructions above
```

## Free Tier Limits (Render)

- **Web Service**: 512 MB RAM, sleeps after 15 min inactivity
- **Database**: Use external provider (PlanetScale free tier: 5GB)

## Next Steps

1. Set up custom domain (optional)
2. Configure SSL (auto-enabled by Render)
3. Set up monitoring
4. Configure backup for database

---

**Need help?** 
- Render Docs: https://render.com/docs
- PlanetScale Docs: https://planetscale.com/docs

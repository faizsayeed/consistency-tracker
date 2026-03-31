# 🚀 Complete Hosting Guide - Consistency Tracker

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                │
│              Vercel (Free Static Hosting)                       │
│                     AngularJS App                              │
│         https://consistency-tracker.vercel.app                │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ API Calls
                              │ (CORS Enabled)
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         BACKEND                                 │
│            Render (Free Node.js Hosting)                        │
│              Node.js + Express Server                          │
│         https://consistency-tracker.onrender.com              │
│              ├─ Authentication (/api/auth)                      │
│              ├─ Habits (/api/habits)                          │
│              ├─ Logs (/api/logs)                              │
│              └─ Notifications (Email + SMS)                   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ MySQL Connection
                              │ (SSL Enabled)
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       DATABASE                                  │
│            Railway (Free MySQL Database)                        │
│              MySQL 8.0 with SSL                               │
│              - users table                                      │
│              - habits table                                     │
│              - habit_logs table                                 │
│              - notifications table                              │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    NOTIFICATION SERVICES                        │
│  Email: Resend (3,000 emails/day free)                         │
│  SMS: Twilio (trial) or MessageBird                            │
└─────────────────────────────────────────────────────────────────┘
```

---

## Step 1: Database Setup (Railway)

### 1.1 Create Railway Account
1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub
3. Verify email

### 1.2 Create MySQL Database
1. Click **"New Project"**
2. Select **"Provision MySQL"**
3. Wait for MySQL to show green (running)
4. Click on MySQL service
5. Go to **"Connect"** tab
6. Copy the **MySQL Connection URL** (looks like):
   ```
   mysql://root:password@containers-xxxxx.railway.app:3306/railway
   ```

### 1.3 Save Connection URL
You'll need this for Render. It looks like:
```
mysql://root:swRXOyTWMgWGupKhqkiJSBRcxTkYpxsk@hopper.proxy.rlwy.net:23662/railway
```

---

## Step 2: Backend Deployment (Render)

### 2.1 Create Render Account
1. Go to [render.com](https://render.com)
2. Sign up with GitHub
3. Verify email

### 2.2 Create Web Service
1. Click **"New"** → **"Web Service"**
2. Connect your GitHub repository: `faizsayeed/consistency-tracker`
3. Configure:

   | Setting | Value |
   |---------|-------|
   | **Name** | `consistency-tracker` |
   | **Environment** | `Node` |
   | **Region** | `Oregon (US West)` or closest to you |
   | **Branch** | `main` |
   | **Build Command** | `cd backend && npm install` |
   | **Start Command** | `node backend/server.js` |
   | **Plan** | `Free` |

### 2.3 Add Environment Variables

Click **"Advanced"** → **"Add Environment Variable"**:

**Required Variables:**
```
NODE_ENV=production
PORT=10000
DATABASE_URL=mysql://root:YOUR_PASSWORD@YOUR_HOST:3306/railway
JWT_SECRET=your-random-secret-key-here
```

**Email Notifications (Resend):**
```
EMAIL_HOST=smtp.resend.com
EMAIL_PORT=587
EMAIL_USER=resend
EMAIL_PASS=re_xxxxxxxxxxxxx
```

**SMS Notifications (Twilio - Optional):**
```
TWILIO_SID=ACxxxxxxxxxxxxxxxx
TWILIO_TOKEN=xxxxxxxxxxxxxxxx
TWILIO_PHONE=+1234567890
```

### 2.4 Get Resend API Key (for Email)

1. Go to [resend.com](https://resend.com)
2. Sign up with your email
3. Go to **API Keys** → **"Create API Key"**
4. Copy the key (starts with `re_`)
5. Add to Render as `EMAIL_PASS`

### 2.5 Deploy Backend
1. Click **"Create Web Service"**
2. Wait 2-3 minutes for deployment
3. Check logs for:
   ```
   Database connected successfully
   Database tables initialized
   Notification service initialized
   Server running on http://localhost:10000
   ```

4. Copy your Render URL: `https://consistency-tracker-hz8m.onrender.com`

---

## Step 3: Frontend Deployment (Vercel)

### 3.1 Create Vercel Account
1. Go to [vercel.com](https://vercel.com)
2. Sign up with GitHub
3. Verify email

### 3.2 Create New Project
1. Click **"Add New..."** → **"Project"**
2. Import Git Repository: `faizsayeed/consistency-tracker`
3. Configure:

   | Setting | Value |
   |---------|-------|
   | **Framework Preset** | `Other` |
   | **Build Command** | (leave empty) |
   | **Output Directory** | `frontend` |
   | **Install Command** | (leave empty or `npm install`) |

4. Click **"Deploy"**

### 3.3 Update CORS in Backend

After Vercel deployment, you need to add your Vercel URL to the backend CORS settings.

1. Get your Vercel URL (looks like `https://consistency-tracker-1hqe.vercel.app`)
2. Go to Render → your service → **Environment**
3. OR edit `backend/server.js` and update CORS:

```javascript
const corsOptions = {
  origin: [
    'https://consistency-tracker-1hqe.vercel.app', // <-- your Vercel URL
    'http://localhost:3000',
    'http://localhost:5500'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};
```

4. Push changes to GitHub if you edited the file

---

## Step 4: Update Frontend API URL

### 4.1 Option A: Using Vercel Environment Variables (Recommended)

In your Vercel project:
1. Go to **Settings** → **Environment Variables**
2. Add:
   ```
   VUE_APP_API_URL=https://consistency-tracker-hz8m.onrender.com
   ```

3. Update `frontend/js/services.js`:
```javascript
const API_BASE_URL = window.API_URL || 'https://consistency-tracker-hz8m.onrender.com';
```

### 4.2 Option B: Direct Edit (Quick Fix)

Edit `frontend/js/services.js`:
```javascript
const API_BASE_URL = 'https://consistency-tracker-hz8m.onrender.com';
```

Then push to GitHub and redeploy Vercel.

---

## Step 5: Testing Everything

### 5.1 Test Backend
1. Visit: `https://consistency-tracker-hz8m.onrender.com/api/health`
2. Should return: `{"status":"OK"}`

### 5.2 Test Frontend
1. Visit your Vercel URL
2. Register a new account
3. Add a habit
4. Mark it complete

### 5.3 Test Notifications
1. Edit your profile
2. Enable **Email Notifications**
3. Add your email
4. Create a habit with a reminder time 2 minutes from now
5. Wait and check your email!

---

## Troubleshooting

### Issue: "Database connection failed"
**Solution:**
- Check `DATABASE_URL` is correctly set in Render
- Verify Railway MySQL is running (green dot)
- Check URL format: `mysql://user:pass@host:port/database`

### Issue: "CORS error" in browser
**Solution:**
- Update CORS in `backend/server.js` with your exact Vercel URL
- Push changes and redeploy

### Issue: "Email not sending"
**Solution:**
- Check Resend API key is correct
- Verify sender is verified in Resend dashboard
- Check spam folder

### Issue: "Vercel build failed"
**Solution:**
- Make sure `package.json` doesn't have `ng build` script
- Use `vercel.json` for static site configuration
- Set framework preset to "Other"

### Issue: "Render server crashed"
**Solution:**
- Check all environment variables are set
- Check logs for specific error
- Verify `DATABASE_URL` is valid

---

## Complete Environment Variables Reference

### Render (Backend):
```
NODE_ENV=production
PORT=10000
DATABASE_URL=mysql://root:password@host:3306/railway
JWT_SECRET=random-secret-key

# Email (Resend)
EMAIL_HOST=smtp.resend.com
EMAIL_PORT=587
EMAIL_USER=resend
EMAIL_PASS=re_your_api_key

# SMS (Twilio - Optional)
TWILIO_SID=ACxxxxxxxx
TWILIO_TOKEN=xxxxxxxx
TWILIO_PHONE=+1234567890
```

### Vercel (Frontend):
```
VUE_APP_API_URL=https://consistency-tracker-hz8m.onrender.com
```

---

## Free Tier Limits

| Service | Free Tier |
|---------|-----------|
| **Render** | 512 MB RAM, sleeps after 15 min inactivity |
| **Railway** | $5 credit/month (~500 hours MySQL) |
| **Vercel** | 100 GB bandwidth, 6000 build minutes/month |
| **Resend** | 3,000 emails/day |
| **Twilio** | $15 credit trial |

---

## Quick Commands

```bash
# Push to GitHub
git add .
git commit -m "Update for deployment"
git push origin main

# Check local backend
cd backend
npm start

# Check local frontend
# Just open frontend/index.html in browser
```

---

## Support

- **Render Docs**: https://render.com/docs
- **Vercel Docs**: https://vercel.com/docs
- **Railway Docs**: https://docs.railway.app
- **Resend Docs**: https://resend.com/docs

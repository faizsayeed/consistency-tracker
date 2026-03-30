# Consistency Tracker

A full-stack habit tracking application with heat map visualization, notifications, and SQL database integration.

## Features

1. **Heat Map** - GitHub-style contribution calendar showing your habit completion history
2. **Notifications** - Browser notifications for daily habit reminders
3. **SQL Database** - MySQL backend for persistent data storage
4. **User Authentication** - JWT-based auth with registration and login
5. **Dark Mode** - Theme toggle support
6. **Responsive Design** - Works on desktop and mobile

## Project Structure

```
consistency-tracker/
├── backend/           # Node.js + Express API
│   ├── config/      # Database configuration
│   ├── controllers/ # Route controllers
│   ├── middleware/  # Auth middleware
│   ├── models/      # SQL models
│   ├── routes/      # API routes
│   ├── scripts/     # Setup scripts
│   ├── .env.example # Environment template
│   ├── package.json
│   └── server.js    # Main server file
│
└── frontend/        # AngularJS SPA
    ├── css/
    ├── js/
    ├── views/
    └── index.html
```

## Prerequisites

- Node.js (v14+)
- MySQL Server (XAMPP/WAMP/MAMP or standalone)
- npm

## Setup Instructions

### Step 1: Install MySQL

1. Install MySQL using XAMPP, WAMP, MAMP, or standalone MySQL
2. Start MySQL server
3. Default MySQL credentials (XAMPP):
   - Host: localhost
   - User: root
   - Password: (empty)

### Step 2: Setup Backend

Open terminal and navigate to the backend folder:

```bash
cd "c:\Users\afeef\OneDrive\Desktop\consistency-tracker\backend"
```

Install dependencies:

```bash
npm install
```

Create environment file:

```bash
copy .env.example .env
```

Edit `.env` file with your MySQL credentials:

```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=          # your MySQL password
DB_NAME=consistency_tracker
JWT_SECRET=your-super-secret-key-change-this
PORT=3000
```

Setup the database:

```bash
npm run setup-db
```

Start the server:

```bash
npm start
```

Or for development with auto-restart:

```bash
npm run dev
```

The API will be available at `http://localhost:3000`

### Step 3: Run Frontend

The frontend is a static AngularJS app. You can serve it using any static file server or simply open `index.html` in a browser (for local testing).

**Option A: Using VS Code Live Server**
1. Install "Live Server" extension
2. Right-click on `frontend/index.html`
3. Select "Open with Live Server"

**Option B: Using Python (if installed)**
```bash
cd frontend
python -m http.server 8080
```

**Option C: Using Node.js npx**
```bash
cd frontend
npx serve .
```

**Option D: Direct File Open**
Simply double-click `frontend/index.html` (some features may have CORS limitations)

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/theme` - Update theme preference

### Habits
- `GET /api/habits` - Get all habits
- `POST /api/habits` - Create new habit
- `PUT /api/habits/:id` - Update habit
- `DELETE /api/habits/:id` - Delete habit

### Logs (Habit Tracking)
- `POST /api/logs` - Log habit completion
- `GET /api/logs/date/:date` - Get logs for specific date
- `GET /api/logs/range` - Get logs for date range
- `GET /api/logs/heatmap` - Get heatmap data
- `GET /api/logs/stats` - Get completion statistics

## Database Schema

### Users Table
- id (PK)
- email (unique)
- password (hashed)
- name
- theme
- created_at
- updated_at

### Habits Table
- id (PK)
- user_id (FK)
- name
- category
- description
- reminder_time
- reminder_enabled
- created_at
- updated_at

### Habit_Logs Table
- id (PK)
- habit_id (FK)
- user_id (FK)
- log_date
- completed (boolean)
- created_at
- updated_at

## Features Overview

### 1. Heat Map (Analytics Page)
- GitHub-style contribution grid
- 5 levels of intensity based on completion count
- Shows last 365 days of activity
- Date range filtering available

### 2. Notifications
- Browser-based push notifications
- Set reminder time per habit
- Enable/disable per habit
- Works when browser is open

### 3. SQL Integration
- All data persisted in MySQL
- Proper foreign key relationships
- JWT authentication
- Secure password hashing with bcrypt

## Troubleshooting

### Database Connection Issues
- Ensure MySQL is running
- Check credentials in `.env` file
- Verify database exists: `npm run setup-db`

### CORS Errors
- Backend runs on port 3000
- Frontend should be served from different port (e.g., 5500 for Live Server)
- CORS is enabled in backend for all origins in development

### API Not Responding
- Check if server is running: `npm start`
- Verify PORT 3000 is not in use
- Check console for errors

## Security Notes

- Change JWT_SECRET in production
- Use HTTPS in production
- Set strong MySQL password
- Don't commit `.env` file to version control

## Development

Backend uses:
- Express.js
- MySQL2
- bcryptjs (password hashing)
- jsonwebtoken (JWT auth)
- cors
- node-cron (reminder scheduling)

Frontend uses:
- AngularJS 1.8.2
- Chart.js
- Font Awesome
- No build step required

## License

MIT

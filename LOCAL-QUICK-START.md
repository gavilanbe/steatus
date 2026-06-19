# 🏠 Local Development - Quick Start

Get sTEAtus running locally in under 10 minutes!

## ⚡ Prerequisites (2 minutes)

1. **Docker Desktop** - Download and start it
2. **Node.js 18+** - Already installed ✅
3. **Supabase CLI** - Already installed ✅

---

## 🚀 Quick Start (3 commands)

### 1. Test Setup
```bash
./test-local-setup.sh
```
This checks everything is ready and starts Supabase if needed.

### 2. Start Development
```bash
./start-local-dev.sh
```
This starts everything: database, backend, frontend.

### 3. Open App
Visit: **http://localhost:5174**

---

## 🧪 Test Features (5 minutes)

### 1. Create Account
- Sign up with: `test@example.com` / `password123`
- Username: `testuser`

### 2. Test Moods
- Select different moods including **Shutdown** and **Meltdown**
- Toggle visibility on/off
- Check real-time updates

### 3. Add Friends
- Create another account: `friend@example.com` / `password123`  
- Username: `frienduser`
- Add friend by searching username
- Test mood sharing between accounts

### 4. Test Profile
- Upload profile picture (goes to local storage)
- Update display name
- View profile changes

---

## 🎯 Local URLs

| Service | URL | Purpose |
|---------|-----|---------|
| **App** | http://localhost:5174 | Your React frontend |
| **API** | http://localhost:3001 | Node.js backend (push notifications) |
| **Studio** | http://localhost:54323 | Database admin interface |
| **Database** | localhost:54322 | PostgreSQL direct connection |

---

## 📱 iPhone Testing

### Option 1: Same WiFi
1. Find your computer's IP: `ipconfig getifaddr en0` (Mac)
2. Visit: `http://YOUR_IP:5174` on iPhone
3. Add to home screen as PWA

### Option 2: ngrok (if needed)
```bash
npm install -g ngrok
ngrok http 5174
```
Use the HTTPS URL on your iPhone.

---

## 🗄️ Database Management

### View Data
- **Studio**: http://localhost:54323
- **Tables**: profiles, moods, contacts, mood_acknowledgments
- **Auth**: View users in Authentication tab

### Reset Database
```bash
supabase db reset
```
⚠️ This deletes all data and recreates tables.

### Stop/Start Supabase
```bash
supabase stop    # Stop all services
supabase start   # Start all services
supabase status  # Check what's running
```

---

## 🛠️ Development Commands

### Daily Development
```bash
./start-local-dev.sh    # Start everything
```

### Individual Services
```bash
# Just frontend
npm run dev

# Just backend
cd server && npm run dev

# Just Supabase
supabase start
```

### Logs & Debugging
```bash
supabase logs          # All Supabase logs
supabase logs --db     # Database logs only
docker logs supabase_db_steatus  # Direct PostgreSQL logs
```

---

## 🔧 Customization

### Add New Mood Types
1. Edit: `src/lib/utils.ts` - add to moods array
2. Update: `supabase/migrations/xxx_initial_schema.sql` - add to enum
3. Run: `supabase db reset` to apply changes

### Modify Database Schema
1. Create migration: `supabase migration new my_changes`
2. Edit the SQL file
3. Apply: `supabase db push`

---

## 🚨 Troubleshooting

### Common Issues

**"Docker not running"**
- Open Docker Desktop app
- Wait for it to fully start (green status)

**"Port already in use"**
```bash
lsof -ti:5174 | xargs kill -9  # Kill frontend
lsof -ti:3001 | xargs kill -9  # Kill backend
lsof -ti:54321 | xargs kill -9 # Kill Supabase API
```

**"Supabase won't start"**
```bash
supabase stop
docker system prune -f
supabase start
```

**"Database connection failed"**
```bash
supabase db reset
supabase db push
```

**"Frontend build errors"**
```bash
rm -rf node_modules
npm install
```

---

## 📊 What's Running Locally

✅ **PostgreSQL Database** - Your app data
✅ **Supabase Auth** - User authentication  
✅ **Supabase Storage** - Profile pictures
✅ **Real-time API** - Live mood updates
✅ **REST API** - All database operations
✅ **Studio UI** - Database management
✅ **React Frontend** - Your app interface
✅ **Node.js Backend** - Push notifications

---

## 💡 Pro Tips

- **Data persists** between restarts (until you reset)
- **Real-time works** - open two browser windows to test
- **Storage works** - upload files are stored locally  
- **Auth works** - full signup/login flow
- **All features work** - just like production!

---

## 🎉 You're Ready!

Your local development environment includes:
- ✅ Full Supabase stack (database, auth, storage, real-time)
- ✅ iPhone-optimized PWA features  
- ✅ Real-time mood sharing
- ✅ User profiles with avatars
- ✅ Friend system with acknowledgments
- ✅ All 8 mood types (including Shutdown/Meltdown)

**Happy coding!** 🚀
# 🚀 Quick Start - What You Need To Do

## ⚡ Step 1: Set Up Supabase (15 minutes)

### 1. Create Supabase Project
1. Go to [supabase.com](https://supabase.com) → **New Project**
2. Name: `steatus-app`
3. Generate strong database password
4. Choose region closest to you
5. Wait for setup (2-3 minutes)

### 2. Get Your Keys
Go to **Project Settings → API** and copy:
- **Project URL**: `https://xyz.supabase.co`
- **anon public key**: `eyJhb...` (starts with eyJ)
- **service_role key**: `eyJhb...` (keep secret!)

### 3. Set Up Database
1. Go to **SQL Editor** in Supabase
2. Copy the entire SQL schema from `SETUP-GUIDE.md` (Step 2.1)
3. Paste and **RUN** - this creates all tables and security

### 4. Set Up Storage
1. Go to **Storage** → **Create Bucket**
2. Name: `avatars`, Public: **ON**
3. Go to bucket **Policies** tab
4. Copy the storage policies from `SETUP-GUIDE.md` (Step 4.2) and run them

---

## ⚡ Step 2: Configure Your App (5 minutes)

### 1. Update Environment Variables
Edit `.env` file:
```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_VAPID_PUBLIC_KEY=your-firebase-vapid-key
```

Edit `server/.env` file:
```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key
VAPID_PUBLIC_KEY=your-firebase-vapid-key
VAPID_PRIVATE_KEY=your-firebase-vapid-private-key
VAPID_EMAIL=your-email@example.com
```

### 2. Install Dependencies
```bash
# Run the setup script
./setup-supabase.sh

# Or manually:
npm install @supabase/supabase-js
cd server && npm install @supabase/supabase-js web-push
```

---

## ⚡ Step 3: Get Push Notifications (10 minutes)

### 1. Firebase Setup
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. **Create Project** → name it anything
3. **Project Settings** → **Cloud Messaging** 
4. **Web configuration** → **Generate key pair**
5. Copy the **VAPID key** to your `.env` files

### 2. Service Account (for server)
1. **Project Settings** → **Service Accounts**
2. **Generate new private key** → download JSON
3. Add the private key details to `server/.env`

---

## ⚡ Step 4: Test Everything (5 minutes)

```bash
# Start the app
./start-dev.sh

# Or manually:
# Terminal 1: Frontend
npm run dev

# Terminal 2: Backend (for push notifications)
cd server && npm run dev
```

Visit http://localhost:5174 and:
1. **Sign up** with email/password
2. **Create a mood** 
3. **Add a friend** by username
4. **Test real-time updates**

---

## ⚡ Step 5: Deploy to Production (Optional)

### Quick Deploy Options:

**Option 1: Vercel (Frontend Only - Recommended)**
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy frontend
vercel --prod

# Add environment variables in Vercel dashboard
```

**Option 2: Google Cloud Run (Full Stack)**
```bash
# Update deploy.sh for Supabase
./deploy.sh YOUR_PROJECT_ID
```

---

## 🎯 Key Benefits of This Setup:

✅ **No complex backend** - Supabase handles database, auth, storage
✅ **Real-time updates** - Built into Supabase  
✅ **iPhone optimized** - PWA ready
✅ **Scalable** - Handles thousands of users
✅ **Cost effective** - Free tier goes very far

---

## 💰 Pricing:

**Development**: **FREE**
- Supabase free tier: 500MB database, 50K users
- Firebase: Free push notifications
- Local development: $0

**Production**: **$0-25/month**
- Supabase Pro: $25/month (only when you exceed free limits)
- Vercel/Netlify: Free static hosting
- Domain: ~$12/year

---

## 🆘 Need Help?

**Common Issues:**
- **"Environment variables missing"** → Check your `.env` files match the examples
- **"Database connection failed"** → Verify your Supabase URL and keys
- **"User signup failing"** → Make sure you ran the database schema SQL

**Questions?** Check `SETUP-GUIDE.md` for detailed explanations or ask!

---

**🎉 You'll have a production-ready mood sharing app in under 1 hour!**
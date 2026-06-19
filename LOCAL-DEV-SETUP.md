# 🏠 Local Development Setup with Local Supabase

This guide sets up everything locally - no cloud services needed during development!

## 📋 Prerequisites

- **Docker Desktop** installed and running
- **Node.js 18+** installed
- **Git** installed

---

## ⚡ Step 1: Install Supabase CLI

### macOS (Homebrew)
```bash
brew install supabase/tap/supabase
```

### macOS/Linux (Direct)
```bash
npm install -g supabase
```

### Verify Installation
```bash
supabase --version
```

---

## 🚀 Step 2: Initialize Local Supabase

### 1. Initialize Supabase in Your Project
```bash
# Make sure Docker is running first!
cd /Users/nahuelgavilan/sidehus/steatus

# Initialize Supabase
supabase init
```

### 2. Start Local Supabase
```bash
# This will download and start PostgreSQL, Auth, Storage, etc.
supabase start
```

**This will give you local URLs like:**
- Studio URL: http://localhost:54323
- API URL: http://localhost:54321
- DB URL: postgresql://postgres:postgres@localhost:54322/postgres

---

## 🗄️ Step 3: Set Up Database Schema

### 1. Create Migration File
```bash
# Create a new migration
supabase migration new initial_schema
```

### 2. Add Schema to Migration
Edit the created migration file in `supabase/migrations/` and add our schema:

```sql
-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE mood_type AS ENUM ('calm', 'happy', 'anxious', 'overwhelmed', 'focused', 'tired', 'shutdown', 'meltdown');
CREATE TYPE contact_status AS ENUM ('pending', 'accepted', 'blocked');

-- Users table (extends Supabase auth.users)
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    display_name VARCHAR(100),
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Moods table
CREATE TABLE public.moods (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    mood_type mood_type NOT NULL,
    is_visible BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Contacts/Friends table
CREATE TABLE public.contacts (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    contact_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    status contact_status DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, contact_user_id)
);

-- Mood acknowledgments table
CREATE TABLE public.mood_acknowledgments (
    id SERIAL PRIMARY KEY,
    mood_id INTEGER REFERENCES public.moods(id) ON DELETE CASCADE NOT NULL,
    acknowledged_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(mood_id, acknowledged_by)
);

-- Push notification subscriptions
CREATE TABLE public.push_subscriptions (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    subscription JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_moods_user_created ON public.moods(user_id, created_at DESC);
CREATE INDEX idx_contacts_user ON public.contacts(user_id);
CREATE INDEX idx_contacts_contact_user ON public.contacts(contact_user_id);
CREATE INDEX idx_mood_acks_mood ON public.mood_acknowledgments(mood_id);
CREATE INDEX idx_profiles_username ON public.profiles(username);

-- Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mood_acknowledgments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view all profiles" ON public.profiles
    FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Moods policies  
CREATE POLICY "Users can view visible moods of contacts" ON public.moods
    FOR SELECT USING (
        is_visible = true AND (
            user_id = auth.uid() OR
            EXISTS (
                SELECT 1 FROM public.contacts 
                WHERE contacts.user_id = moods.user_id 
                AND contacts.contact_user_id = auth.uid() 
                AND contacts.status = 'accepted'
            )
        )
    );

CREATE POLICY "Users can insert own moods" ON public.moods
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own moods" ON public.moods
    FOR UPDATE USING (auth.uid() = user_id);

-- Contacts policies
CREATE POLICY "Users can view their contacts" ON public.contacts
    FOR SELECT USING (
        auth.uid() = user_id OR auth.uid() = contact_user_id
    );

CREATE POLICY "Users can create contact requests" ON public.contacts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update contact requests" ON public.contacts
    FOR UPDATE USING (
        auth.uid() = user_id OR auth.uid() = contact_user_id
    );

-- Mood acknowledgments policies
CREATE POLICY "Users can view mood acknowledgments" ON public.mood_acknowledgments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.moods 
            WHERE moods.id = mood_acknowledgments.mood_id 
            AND moods.user_id = auth.uid()
        ) OR acknowledged_by = auth.uid()
    );

CREATE POLICY "Users can acknowledge moods" ON public.mood_acknowledgments
    FOR INSERT WITH CHECK (auth.uid() = acknowledged_by);

-- Push subscriptions policies
CREATE POLICY "Users can manage own subscriptions" ON public.push_subscriptions
    FOR ALL USING (auth.uid() = user_id);

-- Functions
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.profiles (id, username, display_name)
    VALUES (
        new.id,
        COALESCE(new.raw_user_meta_data->>'username', 'user_' || substr(new.id::text, 1, 8)),
        COALESCE(new.raw_user_meta_data->>'display_name', new.email)
    );
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to get current user's mood
CREATE OR REPLACE FUNCTION get_current_mood(user_uuid UUID)
RETURNS TABLE (
    id INTEGER,
    mood_type mood_type,
    is_visible BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE,
    acknowledgment_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        m.id,
        m.mood_type,
        m.is_visible,
        m.created_at,
        COUNT(ma.id) as acknowledgment_count
    FROM public.moods m
    LEFT JOIN public.mood_acknowledgments ma ON m.id = ma.mood_id
    WHERE m.user_id = user_uuid
    GROUP BY m.id, m.mood_type, m.is_visible, m.created_at
    ORDER BY m.created_at DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 3. Apply Migration
```bash
supabase db push
```

---

## 📁 Step 4: Set Up Storage

### 1. Create Storage Bucket
Go to http://localhost:54323 (local Studio) and:
1. Go to **Storage**
2. Create bucket named `avatars`
3. Make it **public**

### 2. Or Create via SQL
```bash
supabase sql --db-url "postgresql://postgres:postgres@localhost:54322/postgres" --file -
```

Then paste:
```sql
-- Create avatars bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true);

-- Storage policies
CREATE POLICY "Users can upload own avatar" ON storage.objects
FOR INSERT WITH CHECK (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update own avatar" ON storage.objects
FOR UPDATE USING (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Anyone can view avatars" ON storage.objects
FOR SELECT USING (bucket_id = 'avatars');
```

---

## ⚙️ Step 5: Update Environment Files

### 1. Local Environment (.env.local)
```bash
# Local Supabase Configuration
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0

# Push Notifications (mock for development)
VITE_VAPID_PUBLIC_KEY=mock-key-for-development
```

### 2. Backend Environment (server/.env.local)
```bash
# Local Supabase Configuration
SUPABASE_URL=http://localhost:54321
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU

# Push Notifications (mock for development) 
VAPID_PUBLIC_KEY=mock-public-key
VAPID_PRIVATE_KEY=mock-private-key  
VAPID_EMAIL=test@example.com

# Server Configuration
NODE_ENV=development
PORT=3001
```

---

## 🔧 Step 6: Update Code for Local Development

### 1. Update Supabase Configuration
Edit `src/lib/supabase.ts` to handle local development:

```typescript
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'http://localhost:54321'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
})
```

---

## 🚀 Step 7: Create Local Development Script

Create `start-local-dev.sh`:

```bash
#!/bin/bash

echo "🏠 Starting sTEAtus Local Development Environment..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker Desktop first."
    exit 1
fi

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "📦 Installing Supabase CLI..."
    npm install -g supabase
fi

# Start Supabase (if not already running)
echo "🗄️ Starting local Supabase..."
supabase start

# Wait for Supabase to be ready
echo "⏳ Waiting for Supabase to be ready..."
sleep 10

# Get Supabase status
echo "📊 Supabase Status:"
supabase status

# Install dependencies if needed
if [ ! -d node_modules ]; then
    echo "📦 Installing frontend dependencies..."
    npm install
fi

if [ ! -d server/node_modules ]; then
    echo "📦 Installing backend dependencies..."
    cd server && npm install && cd ..
fi

# Create local environment files
if [ ! -f .env.local ]; then
    echo "📝 Creating local environment files..."
    cp .env.example .env.local
    # Update with local Supabase URLs
    sed -i '' 's|https://your-project.supabase.co|http://localhost:54321|' .env.local
    sed -i '' 's|your-anon-key-here|eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0|' .env.local
fi

# Kill any existing processes
lsof -ti:3001 | xargs kill -9 2>/dev/null || true
lsof -ti:5174 | xargs kill -9 2>/dev/null || true

# Start backend
echo "🔧 Starting backend server..."
cd server
NODE_OPTIONS="--env-file=../.env.local" npm run dev &
BACKEND_PID=$!
cd ..

# Wait for backend
sleep 3

# Start frontend  
echo "🎨 Starting frontend..."
npm run dev &
FRONTEND_PID=$!

echo ""
echo "✅ Local development environment started!"
echo ""
echo "🎯 URLs:"
echo "  Frontend: http://localhost:5174"
echo "  Backend: http://localhost:3001" 
echo "  Supabase Studio: http://localhost:54323"
echo "  Database: postgresql://postgres:postgres@localhost:54322/postgres"
echo ""
echo "📧 Test Users (create these in Studio or app):"
echo "  test1@example.com / password123"
echo "  test2@example.com / password123"
echo ""
echo "Press Ctrl+C to stop all services"

# Cleanup function
cleanup() {
    echo ""
    echo "🛑 Stopping services..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true
    echo "🗄️ Supabase is still running (use 'supabase stop' to stop it)"
    echo "👋 Goodbye!"
    exit 0
}

trap cleanup INT

# Wait for processes
wait $BACKEND_PID $FRONTEND_PID
```

---

## 🧪 Step 8: Test Everything

### 1. Start Local Development
```bash
chmod +x start-local-dev.sh
./start-local-dev.sh
```

### 2. Test Features
1. **Visit**: http://localhost:5174
2. **Sign up**: Create test accounts
3. **Test moods**: Create and update moods
4. **Test friends**: Add friends, see real-time updates
5. **Test storage**: Upload profile pictures
6. **Supabase Studio**: http://localhost:54323 (view data)

---

## 🔍 Useful Commands

```bash
# Supabase commands
supabase status           # Check what's running
supabase stop            # Stop all services
supabase start           # Start all services
supabase db reset        # Reset database (careful!)
supabase db push         # Apply migrations
supabase gen types typescript --local > src/types/supabase.ts

# View logs
supabase logs           # All logs
supabase logs --db      # Database logs only

# Database access
supabase db connect     # Connect to local DB
```

---

## ✅ Benefits of Local Development

- **🚀 Fast**: No network latency
- **🔒 Private**: All data stays local  
- **💰 Free**: No cloud costs
- **🧪 Testing**: Easy to reset/test
- **✈️ Offline**: Works without internet
- **🔄 Real-time**: Full Supabase features locally

---

## 📱 iPhone Testing

The app will still work as a PWA on iPhone when you:
1. Connect iPhone to same WiFi network
2. Visit your computer's IP address (e.g., http://192.168.1.100:5174)
3. Add to home screen

---

Your complete local development environment is ready! 🎉
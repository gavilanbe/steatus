# 🚀 Complete sTEAtus Setup Guide with Supabase

This guide will walk you through setting up your sTEAtus app with Supabase for authentication, database, storage, and push notifications.

## 📋 Prerequisites

- Node.js 18+ installed
- A Supabase account (free)
- A Google Cloud account (for deployment)
- Your iPhone for testing

---

## 🗄️ Step 1: Set Up Supabase Project

### 1.1 Create Supabase Project
1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Click "New Project"
3. Choose organization, enter project details:
   - **Name**: `steatus-app`
   - **Database Password**: Generate a strong password (save this!)
   - **Region**: Choose closest to your users
4. Wait 2-3 minutes for setup to complete

### 1.2 Get Your Supabase Credentials
1. Go to Project Settings → API
2. Save these values:
   - **Project URL**: `https://your-project.supabase.co`
   - **anon public key**: `eyJ...` (starts with eyJ)
   - **service_role key**: `eyJ...` (keep this secret!)

---

## 🗃️ Step 2: Set Up Database Schema

### 2.1 Create Database Tables
1. In your Supabase dashboard, go to **SQL Editor**
2. Create a new query and paste this schema:

```sql
-- Enable Row Level Security
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret';

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

-- Row Level Security Policies
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

3. Click **RUN** to execute the schema

---

## 🔐 Step 3: Configure Authentication

### 3.1 Enable Authentication Methods
1. Go to **Authentication → Settings**
2. **Site URL**: `http://localhost:5174` (for development)
3. **Redirect URLs**: Add:
   - `http://localhost:5174/**`
   - `https://your-domain.com/**` (for production)

### 3.2 Enable Email Authentication
1. Go to **Authentication → Providers**
2. **Email** should be enabled by default
3. **Confirm email**: Enable this for production
4. **Secure email change**: Enable this

### 3.3 Optional: Enable OAuth (Google, Apple, etc.)
For easier iPhone login, consider enabling:
1. **Apple** (great for iPhone users)
2. **Google** 
3. Follow Supabase docs for each provider setup

---

## 📁 Step 4: Set Up Storage for Avatars

### 4.1 Create Storage Bucket
1. Go to **Storage**
2. Click **Create Bucket**
3. **Name**: `avatars`
4. **Public**: Enable (so users can see profile pictures)
5. Click **Create**

### 4.2 Set Storage Policies
1. Click on the `avatars` bucket
2. Go to **Policies** tab
3. Add these policies:

```sql
-- Allow users to upload their own avatars
CREATE POLICY "Users can upload own avatar" ON storage.objects
FOR INSERT WITH CHECK (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to update their own avatars  
CREATE POLICY "Users can update own avatar" ON storage.objects
FOR UPDATE USING (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow public access to view avatars
CREATE POLICY "Anyone can view avatars" ON storage.objects
FOR SELECT USING (bucket_id = 'avatars');
```

---

## 🔔 Step 5: Set Up Push Notifications

### 5.1 Get Firebase/VAPID Keys
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create new project or use existing
3. Go to **Project Settings → Cloud Messaging**
4. **Web configuration → Generate key pair**
5. Save the **VAPID key**

### 5.2 Configure Service Worker
Create a service worker for push notifications - we'll update this in the code later.

---

## ⚙️ Step 6: Update Your App Code

### 6.1 Update Package Dependencies

```bash
# Frontend - install Supabase client
npm install @supabase/supabase-js

# Backend - we'll simplify this to just handle real-time and push notifications
cd server
npm install @supabase/supabase-js web-push
```

### 6.2 Update Environment Variables

Create/update your environment files:

**Frontend (.env):**
```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_VAPID_PUBLIC_KEY=your-vapid-public-key
```

**Backend (server/.env):**
```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key
VAPID_PUBLIC_KEY=your-vapid-public-key
VAPID_PRIVATE_KEY=your-vapid-private-key
VAPID_EMAIL=your-email@example.com
NODE_ENV=development
PORT=3001
```

---

## 🔧 Step 7: Code Updates (Next Steps)

I'll help you update the code to use Supabase. The main changes:

1. **Frontend**: Replace custom auth with Supabase auth
2. **Backend**: Simplify to handle push notifications and real-time events
3. **Database**: All queries now go through Supabase
4. **Storage**: Avatar uploads to Supabase storage
5. **Real-time**: Use Supabase real-time for live updates

---

## 🚀 Step 8: Deployment Setup

### 8.1 Production Environment Variables
Update your production URLs:
- **Site URL**: Your production domain
- **Redirect URLs**: Add your production domain

### 8.2 Google Cloud Run (Optional)
Since Supabase handles most backend needs, you might only need to deploy:
- Frontend as static site (Vercel, Netlify, or Cloud Run)  
- Small backend for push notifications only

---

## 💰 Cost Breakdown

**Supabase (Free tier includes):**
- 500MB database
- 1GB file storage  
- 100MB transfer
- 50,000 monthly active users
- Real-time subscriptions

**Paid tiers start at $25/month** when you exceed free limits.

**Push Notifications:** Free with Firebase

**Deployment:**
- Frontend: Free (Vercel/Netlify) or ~$5/month
- Backend: ~$0-10/month (Cloud Run)

**Total: $0-35/month** depending on usage

---

## ✅ Next Steps

1. Complete the Supabase setup above
2. Let me know when you're done, and I'll help update all the code
3. We'll test everything works locally
4. Then deploy to production

**Questions to answer:**
- Do you want Apple Sign-In for iPhone users?
- Do you want Google Sign-In as well?
- What domain will you use for production?

Let me know when you've completed the Supabase setup and I'll update all the code!
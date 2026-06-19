# sTEAtus - Complete Documentation

## Table of Contents
1. [Overview](#overview)
2. [Features](#features)
3. [Database Schema](#database-schema)
4. [API Endpoints](#api-endpoints)
5. [Frontend Components](#frontend-components)
6. [Real-time Features](#real-time-features)
7. [Push Notifications](#push-notifications)
8. [Authentication & Security](#authentication--security)
9. [Storage](#storage)
10. [Export Functionality](#export-functionality)
11. [Themes & Accessibility](#themes--accessibility)
12. [Development Setup](#development-setup)

## Overview

sTEAtus is a mood tracking and support network application designed to help users share their emotional state with trusted friends and receive support when needed. The app focuses on neurodivergent-friendly design with emphasis on critical mood states like shutdown and meltdown.

### Tech Stack
- **Frontend**: React + TypeScript, Tailwind CSS, Vite
- **Backend**: Node.js + Express, Socket.io
- **Database**: Supabase (PostgreSQL)
- **Storage**: Supabase Storage
- **Notifications**: Web Push API with VAPID
- **Real-time**: Socket.io + Supabase Realtime

## Features

### 🎭 Mood Tracking
- **8 Mood Types**: calm, happy, anxious, overwhelmed, focused, tired, shutdown, meltdown
- **Visibility Control**: Public/private mood sharing
- **Mood History**: Complete timeline with statistics
- **Real-time Updates**: Instant mood sync across devices
- **Acknowledgment System**: Friends can acknowledge moods

### 👥 Social Features
- **Friend System**: Send, accept, decline friend requests
- **Support Network**: View friends' current moods
- **Friend Codes**: Quick add via TEA-{userPrefix} codes
- **User Search**: Find friends by name or username
- **Online Status**: Real-time presence indicators
- **Contact Management**: Remove friends, block users

### 🔔 Notifications
- **Push Notifications**: Web Push API integration
- **Critical Alerts**: Automatic notifications for shutdown/meltdown states
- **Acknowledgment Notifications**: Alerts when someone acknowledges your mood
- **Service Worker**: Offline notification handling
- **Customizable**: User-controlled notification preferences

### 📊 Analytics & Export
- **Mood Statistics**: Distribution, streaks, trends
- **PDF Reports**: Comprehensive mood analysis
- **CSV Export**: Raw data for external analysis
- **Insights Generation**: AI-powered pattern recognition
- **Time Range Filtering**: Week, month, all-time views

### 🎨 Customization
- **Dark Mode**: Full dark theme support
- **Color Schemes**: Warm, cool, neutral palettes
- **Font Sizes**: Small, medium, large accessibility options
- **Persistent Settings**: Cross-device synchronization
- **Doodle Design**: Hand-drawn, friendly UI aesthetic

### 👤 Profile Management
- **Avatar Upload**: Custom profile pictures via Supabase Storage
- **Profile Editing**: Display name, bio, avatar emoji
- **User Stats**: Mood counts, network size, activity metrics
- **Privacy Controls**: Granular sharing preferences

## Database Schema

### Tables

#### `profiles`
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  bio TEXT,
  avatar_url TEXT,
  avatar_emoji TEXT DEFAULT '😊',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### `moods`
```sql
CREATE TABLE moods (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  mood_type TEXT NOT NULL CHECK (mood_type IN ('calm', 'happy', 'anxious', 'overwhelmed', 'focused', 'tired', 'shutdown', 'meltdown')),
  is_visible BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### `contacts`
```sql
CREATE TABLE contacts (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  contact_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'blocked')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, contact_user_id)
);
```

#### `mood_acknowledgments`
```sql
CREATE TABLE mood_acknowledgments (
  id SERIAL PRIMARY KEY,
  mood_id INTEGER REFERENCES moods(id) ON DELETE CASCADE,
  acknowledged_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(mood_id, acknowledged_by)
);
```

#### `user_settings`
```sql
CREATE TABLE user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  -- Notification settings
  push_enabled BOOLEAN DEFAULT TRUE,
  sound_enabled BOOLEAN DEFAULT FALSE,
  quiet_hours BOOLEAN DEFAULT TRUE,
  mood_updates BOOLEAN DEFAULT TRUE,
  acknowledgments BOOLEAN DEFAULT TRUE,
  -- Privacy settings
  show_to_all BOOLEAN DEFAULT TRUE,
  allow_friend_requests BOOLEAN DEFAULT TRUE,
  share_history BOOLEAN DEFAULT FALSE,
  -- Appearance settings
  dark_mode BOOLEAN DEFAULT FALSE,
  color_scheme TEXT DEFAULT 'warm' CHECK (color_scheme IN ('warm', 'cool', 'neutral')),
  font_size TEXT DEFAULT 'medium' CHECK (font_size IN ('small', 'medium', 'large')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Storage Buckets

#### `avatars`
- **Purpose**: User profile pictures
- **Access**: Public read, authenticated write (own files only)
- **Structure**: `{user_id}/avatar.{ext}`
- **Max Size**: 5MB per file
- **Formats**: jpg, png, gif, webp

### Row Level Security (RLS)

All tables have RLS enabled with policies ensuring users can only:
- Read their own data and friends' visible data
- Write to their own records
- View public profile information
- Access mood data based on friendship status

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Create new account
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/user` - Get current user

### Users
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update profile
- `POST /api/users/upload-avatar` - Upload profile picture

### Moods
- `GET /api/moods` - Get user's mood history
- `POST /api/moods` - Create new mood entry
- `GET /api/moods/current` - Get current mood
- `POST /api/moods/:id/acknowledge` - Acknowledge a mood

### Contacts
- `GET /api/contacts` - Get user's contacts
- `POST /api/contacts/request` - Send friend request
- `PUT /api/contacts/:id/accept` - Accept friend request
- `DELETE /api/contacts/:id` - Remove contact/decline request
- `GET /api/contacts/search` - Search users

### Push Notifications
- `POST /api/push/subscribe` - Subscribe to push notifications
- `POST /api/push/test` - Send test notification
- `POST /api/push/notify-mood` - Trigger mood update notifications
- `POST /api/push/notify-acknowledgment` - Trigger acknowledgment notifications

## Frontend Components

### Pages
- **AuthPage**: Login/signup with animated design
- **Home**: Main dashboard with mood selector and network
- **Friends**: Contact management, search, friend codes
- **Profile**: User profile editing and statistics
- **History**: Mood timeline, analytics, export tools
- **Settings**: All app preferences and configurations
- **Help**: Documentation and support

### Core Components
- **MoodSelector**: 8-mood grid with emoji selection
- **StatusDisplay**: Current mood with visibility toggle
- **SupportNetwork**: Friends list with mood status
- **Navigation**: Bottom tab navigation
- **PushNotificationSetup**: Push notification configuration

### UI Components
- **Button**: Doodle-style buttons with animations
- **Card**: Hand-drawn card containers
- **Drawer**: Mobile-friendly drawer component
- All components support dark mode and theming

### Contexts
- **AuthContext**: Supabase authentication management
- **SocketContext**: Real-time Socket.io connection
- **ThemeContext**: Dark mode and theme preferences

### Hooks
- **useSupabaseMoods**: Mood CRUD operations and real-time updates
- **useSupabaseContacts**: Friend management and search
- **useSupabaseSettings**: User preferences with persistence
- **useSocket**: Socket connection and event handling
- **useTheme**: Theme state management

## Real-time Features

### Socket.io Events

#### Client → Server
- `mood_update`: Broadcast mood change to contacts
- `acknowledge_mood`: Send acknowledgment to mood owner
- `join_room`: Join user-specific room for notifications

#### Server → Client
- `contact_mood_update`: Friend's mood changed
- `mood_acknowledged`: Someone acknowledged your mood
- `user_online`/`user_offline`: Presence updates
- `online_users`: List of currently online contacts

### Supabase Realtime

#### Subscribed Tables
- **moods**: Live mood updates for user and contacts
- **contacts**: Friend request status changes
- **mood_acknowledgments**: Real-time acknowledgment updates
- **user_settings**: Settings synchronization across devices

## Push Notifications

### VAPID Configuration
```javascript
const VAPID_PUBLIC_KEY = 'BEl62iUYgUivxIkv...' // Your public key
```

### Service Worker Features
- **Push Event Handling**: Incoming notification processing
- **Notification Click**: App focus/open on click
- **Background Sync**: Offline mood sync capability
- **Cache Management**: Static asset caching

### Notification Types
1. **Mood Updates**: Friends' critical mood changes (shutdown/meltdown)
2. **Acknowledgments**: When someone acknowledges your mood
3. **System**: App updates and announcements

### Subscription Flow
1. Request notification permission
2. Register service worker
3. Subscribe to push manager
4. Send subscription to server
5. Server stores subscription with user ID

## Authentication & Security

### Supabase Auth Features
- **Email/Password**: Standard authentication
- **Session Management**: Automatic token refresh
- **User Metadata**: Custom user data storage
- **Password Reset**: Email-based reset flow

### Security Measures
- **Row Level Security**: Database-level access control
- **JWT Tokens**: Secure session management
- **CORS Configuration**: Restricted origin access
- **Rate Limiting**: API endpoint protection
- **Input Validation**: Sanitized user inputs

### Privacy Controls
- **Mood Visibility**: Per-mood privacy settings
- **Friend Requests**: Can be disabled by user
- **History Sharing**: Optional mood history visibility
- **Profile Privacy**: Configurable profile information

## Storage

### File Management
- **Avatar Uploads**: 5MB limit, multiple formats
- **Public URLs**: CDN-delivered profile pictures
- **Storage Policies**: User can only modify own files
- **Cleanup**: Automatic old file removal

### File Structure
```
avatars/
├── {user_id}/
│   └── avatar.{ext}
└── ...
```

## Export Functionality

### PDF Reports
- **Comprehensive Analysis**: Mood statistics, trends, insights
- **Visual Charts**: Mood distribution and patterns
- **Time Range Selection**: Week, month, all-time
- **Professional Format**: Clean, printable design

### CSV Export
- **Complete Data**: All mood entries with metadata
- **Analysis Ready**: Compatible with Excel, R, Python
- **Timestamped**: ISO format dates for sorting
- **Privacy Respected**: Only user's own data

### Data Insights
- **Mood Patterns**: Most common moods, streaks
- **Time Analysis**: Weekly averages, trends
- **Positive Ratios**: Mental health indicators
- **Tracking Consistency**: User engagement metrics

## Themes & Accessibility

### Dark Mode
- **System Preference**: Respects OS setting
- **Manual Toggle**: User-controlled switching
- **Complete Coverage**: All components themed
- **High Contrast**: Accessibility-focused colors

### Color Schemes
1. **Warm** (Default): Amber/orange palette
2. **Cool**: Blue/green/purple palette
3. **Neutral**: Gray/monochrome palette

### Font Sizes
- **Small**: 14px base, compact layout
- **Medium**: 16px base, standard layout
- **Large**: 18px base, accessibility-focused

### Accessibility Features
- **High Contrast**: Dark mode with proper ratios
- **Font Scaling**: Respects user preferences
- **Keyboard Navigation**: Full keyboard support
- **Screen Reader**: Semantic HTML structure
- **Color Independence**: Information not color-only

## Development Setup

### Environment Variables

#### Frontend (.env)
```bash
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_SERVER_URL=http://localhost:3001
VITE_VAPID_PUBLIC_KEY=your_vapid_public_key
```

#### Backend (server/.env.local)
```bash
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
VAPID_PUBLIC_KEY=your_vapid_public_key
VAPID_PRIVATE_KEY=your_vapid_private_key
VAPID_EMAIL=your_email@domain.com
FRONTEND_URL=http://localhost:5174
PORT=3001
```

### Scripts
```bash
# Frontend
npm run dev          # Development server
npm run build        # Production build
npm run preview      # Preview build

# Backend
npm run dev          # Development server
npm start            # Production server

# Database
supabase start       # Local Supabase
supabase db reset    # Reset database
supabase migration up # Run migrations
```

### Required Dependencies

#### Frontend
- **Core**: react, typescript, vite
- **UI**: tailwindcss, lucide-react
- **Auth**: @supabase/supabase-js
- **Real-time**: socket.io-client
- **Export**: jspdf, html2canvas, papaparse
- **Notifications**: Web APIs (built-in)

#### Backend
- **Core**: express, nodejs
- **Real-time**: socket.io
- **Database**: @supabase/supabase-js
- **Notifications**: web-push
- **Security**: cors, helmet, express-rate-limit

### File Structure
```
steatus/
├── public/
│   ├── sw.js                     # Service Worker
│   └── manifest.json             # PWA Manifest
├── src/
│   ├── components/
│   │   ├── Auth/                 # Authentication
│   │   ├── pages/                # Main pages
│   │   └── ui/                   # Reusable components
│   ├── contexts/                 # React contexts
│   ├── hooks/                    # Custom hooks
│   ├── lib/                      # Utilities
│   └── styles/                   # CSS files
├── server/
│   ├── src/
│   │   ├── routes/               # API routes
│   │   ├── middleware/           # Express middleware
│   │   ├── lib/                  # Server utilities
│   │   └── config/               # Configuration
│   └── package.json
├── supabase/
│   ├── migrations/               # Database migrations
│   └── config.toml               # Supabase config
└── package.json
```

## Configuration Files

### Tailwind Config
- Custom color palette
- Dark mode class strategy
- Component variants
- Animation utilities

### TypeScript Config
- Strict mode enabled
- Path aliases (@/)
- Modern target (ES2020)
- React JSX support

### Vite Config
- React plugin
- Path aliases
- Environment variables
- Build optimizations

This documentation covers all current features and capabilities of sTEAtus. The application is production-ready with comprehensive user management, real-time features, and accessibility support.
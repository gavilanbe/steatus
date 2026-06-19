# sTEAtus Deployment Guide

## Overview

This guide covers deploying sTEAtus to production environments with proper configuration for all features including real-time updates, push notifications, and file storage.

## Prerequisites

- Node.js 18+ and npm
- Supabase account
- Domain name for production
- SSL certificate (for push notifications)

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Supabase      │
│   (React/Vite)  │───▶│   (Node.js)     │───▶│   (Database)    │
│   - Static      │    │   - API         │    │   - Storage     │
│   - Service     │    │   - Socket.io   │    │   - Auth        │
│     Worker      │    │   - Push        │    │   - Realtime    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Step 1: Supabase Setup

### 1.1 Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Create new project
3. Choose region closest to users
4. Note project URL and anon key

### 1.2 Database Setup
```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Run all migrations
supabase db push
```

### 1.3 Storage Setup
1. Go to Storage in Supabase dashboard
2. Create `avatars` bucket
3. Set public policy:
   ```sql
   CREATE POLICY "Avatar images are publicly accessible" ON storage.objects
   FOR SELECT USING (bucket_id = 'avatars');
   
   CREATE POLICY "Users can upload avatar images" ON storage.objects
   FOR INSERT WITH CHECK (
     bucket_id = 'avatars' 
     AND auth.uid()::text = (storage.foldername(name))[1]
   );
   ```

### 1.4 Environment Variables
```bash
# Add to Supabase project settings
VAPID_PUBLIC_KEY=your_vapid_public_key
VAPID_PRIVATE_KEY=your_vapid_private_key
VAPID_EMAIL=your_email@domain.com
```

## Step 2: Generate VAPID Keys

### 2.1 Using web-push CLI
```bash
npx web-push generate-vapid-keys
```

### 2.2 Using Node.js
```javascript
const webpush = require('web-push');
const vapidKeys = webpush.generateVAPIDKeys();

console.log('Public Key:', vapidKeys.publicKey);
console.log('Private Key:', vapidKeys.privateKey);
```

## Step 3: Backend Deployment

### 3.1 Environment Configuration

Create `server/.env.production`:
```bash
NODE_ENV=production
PORT=3001

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# VAPID Keys for Push Notifications
VAPID_PUBLIC_KEY=your_vapid_public_key
VAPID_PRIVATE_KEY=your_vapid_private_key
VAPID_EMAIL=your_email@domain.com

# Frontend URL
FRONTEND_URL=https://your-domain.com

# Security
CORS_ORIGIN=https://your-domain.com
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### 3.2 Railway Deployment
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Create project
railway project create steatus-backend

# Add environment variables
railway environment add SUPABASE_URL your_url
railway environment add SUPABASE_SERVICE_ROLE_KEY your_key
# ... add all other variables

# Deploy from server directory
cd server
railway up
```

### 3.3 Heroku Deployment
```bash
# Create Heroku app
heroku create steatus-backend

# Set environment variables
heroku config:set SUPABASE_URL=your_url
heroku config:set SUPABASE_SERVICE_ROLE_KEY=your_key
# ... set all other variables

# Deploy
git subtree push --prefix server heroku main
```

### 3.4 DigitalOcean App Platform
```yaml
# app.yaml
name: steatus-backend
services:
- name: api
  source_dir: /server
  github:
    repo: your-username/steatus
    branch: main
  run_command: npm start
  environment_slug: node-js
  instance_count: 1
  instance_size_slug: basic-xxs
  envs:
  - key: SUPABASE_URL
    value: your_url
  - key: SUPABASE_SERVICE_ROLE_KEY
    value: your_key
    type: SECRET
  # ... other environment variables
```

### 3.5 Docker Deployment
```dockerfile
# server/Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3001

USER node

CMD ["npm", "start"]
```

```yaml
# docker-compose.yml
version: '3.8'
services:
  steatus-backend:
    build: ./server
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - SUPABASE_URL=${SUPABASE_URL}
      - SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}
      # ... other environment variables
    restart: unless-stopped
```

## Step 4: Frontend Deployment

### 4.1 Environment Configuration

Create `.env.production`:
```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_SERVER_URL=https://your-backend-domain.com
VITE_VAPID_PUBLIC_KEY=your_vapid_public_key
```

### 4.2 Build Configuration

Update `vite.config.ts`:
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          supabase: ['@supabase/supabase-js'],
          ui: ['lucide-react']
        }
      }
    }
  }
})
```

### 4.3 Vercel Deployment
```json
// vercel.json
{
  "framework": "vite",
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "installCommand": "npm install",
  "functions": {
    "public/sw.js": {
      "includeFiles": "public/sw.js"
    }
  },
  "headers": [
    {
      "source": "/sw.js",
      "headers": [
        {
          "key": "Service-Worker-Allowed",
          "value": "/"
        }
      ]
    },
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        }
      ]
    }
  ]
}
```

```bash
# Deploy to Vercel
npm install -g vercel
vercel --prod
```

### 4.4 Netlify Deployment
```toml
# netlify.toml
[build]
  publish = "dist"
  command = "npm run build"

[build.environment]
  NODE_VERSION = "18"

[[headers]]
  for = "/sw.js"
  [headers.values]
    Service-Worker-Allowed = "/"
    Cache-Control = "no-cache"

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### 4.5 Firebase Hosting
```json
// firebase.json
{
  "hosting": {
    "public": "dist",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ],
    "headers": [
      {
        "source": "/sw.js",
        "headers": [
          {
            "key": "Service-Worker-Allowed",
            "value": "/"
          },
          {
            "key": "Cache-Control",
            "value": "no-cache"
          }
        ]
      }
    ]
  }
}
```

```bash
npm install -g firebase-tools
firebase login
firebase init hosting
firebase deploy --only hosting
```

## Step 5: DNS & SSL Configuration

### 5.1 Domain Setup
1. Point your domain to deployment platform
2. Configure CNAME/A records:
   ```
   @ → your-frontend-deployment
   api → your-backend-deployment
   ```

### 5.2 SSL Certificate
- Most platforms (Vercel, Netlify, Firebase) provide automatic SSL
- For custom deployments, use Let's Encrypt or Cloudflare

### 5.3 CORS Configuration
Update backend CORS settings:
```javascript
// server/src/server.js
app.use(cors({
  origin: [
    'https://your-domain.com',
    'https://www.your-domain.com'
  ],
  credentials: true
}));
```

## Step 6: Monitoring & Analytics

### 6.1 Error Tracking
```bash
npm install @sentry/react @sentry/node
```

Frontend (main.tsx):
```typescript
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "your_sentry_dsn",
  environment: "production"
});
```

Backend (server.js):
```javascript
const Sentry = require("@sentry/node");

Sentry.init({
  dsn: "your_sentry_dsn",
  environment: "production"
});
```

### 6.2 Analytics
```html
<!-- Add to index.html -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_TRACKING_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_TRACKING_ID');
</script>
```

### 6.3 Performance Monitoring
```typescript
// Performance monitoring
const observer = new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    if (entry.entryType === 'navigation') {
      console.log('Page Load Time:', entry.duration);
    }
  }
});
observer.observe({entryTypes: ['navigation', 'paint']});
```

## Step 7: Security Checklist

### 7.1 Environment Variables
- [ ] All secrets in environment variables
- [ ] No hardcoded keys in code
- [ ] Different keys for production/staging

### 7.2 HTTPS
- [ ] SSL certificate installed
- [ ] HTTP redirects to HTTPS
- [ ] HSTS headers configured

### 7.3 Headers
- [ ] CSP headers configured
- [ ] X-Frame-Options set
- [ ] X-Content-Type-Options set
- [ ] Referrer-Policy configured

### 7.4 Database
- [ ] RLS policies enabled
- [ ] Service role key secured
- [ ] Regular backups configured

### 7.5 API Security
- [ ] Rate limiting enabled
- [ ] CORS properly configured
- [ ] Input validation on all endpoints
- [ ] Authentication on protected routes

## Step 8: Performance Optimization

### 8.1 Frontend Optimization
```typescript
// Code splitting
const LazyProfile = lazy(() => import('./components/pages/Profile'));
const LazyHistory = lazy(() => import('./components/pages/History'));

// Image optimization
const Avatar = ({ src, alt }: { src: string, alt: string }) => (
  <img 
    src={src} 
    alt={alt}
    loading="lazy"
    width={40}
    height={40}
  />
);
```

### 8.2 Caching Strategy
```javascript
// Service Worker caching
const CACHE_NAME = 'steatus-v1';
const urlsToCache = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});
```

### 8.3 Database Optimization
```sql
-- Add indexes for better performance
CREATE INDEX idx_moods_user_created ON moods(user_id, created_at DESC);
CREATE INDEX idx_contacts_user_status ON contacts(user_id, status);
CREATE INDEX idx_mood_acks_mood ON mood_acknowledgments(mood_id);
```

## Step 9: Backup Strategy

### 9.1 Database Backups
```bash
# Automated daily backups (cron job)
0 2 * * * supabase db dump --linked > backup-$(date +%Y%m%d).sql
```

### 9.2 Storage Backups
- Configure Supabase Storage backups
- Regular exports of user avatars
- Version control for static assets

## Step 10: Monitoring & Maintenance

### 10.1 Health Checks
```javascript
// Add health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});
```

### 10.2 Log Monitoring
```javascript
// Structured logging
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});
```

### 10.3 Alerts
- Set up alerts for:
  - High error rates
  - Database connection issues
  - Low disk space
  - SSL certificate expiry
  - Performance degradation

## Troubleshooting

### Common Issues

#### Push Notifications Not Working
1. Check VAPID keys are correctly set
2. Verify HTTPS is enabled
3. Check service worker registration
4. Test with browser dev tools

#### Socket.io Connection Issues
1. Check CORS configuration
2. Verify WebSocket support
3. Check firewall settings
4. Test connection manually

#### Database Connection Errors
1. Verify connection string
2. Check RLS policies
3. Monitor connection pool
4. Review query performance

#### Build Failures
1. Check Node.js version compatibility
2. Clear npm cache: `npm cache clean --force`
3. Delete node_modules and reinstall
4. Check for dependency conflicts

## Scaling Considerations

### Horizontal Scaling
- Use load balancers for multiple backend instances
- Configure sticky sessions for Socket.io
- Implement Redis for session storage

### Database Scaling
- Use Supabase connection pooling
- Implement read replicas for analytics
- Consider data archiving strategies

### CDN Integration
- Use CDN for static assets
- Configure proper cache headers
- Implement image optimization

This deployment guide covers all aspects of deploying sTEAtus to production with proper security, performance, and monitoring considerations.
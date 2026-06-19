#!/bin/bash

# sTEAtus Supabase Setup Script
# This script helps you set up the development environment with Supabase

echo "🚀 Setting up sTEAtus with Supabase..."

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "📦 Installing Supabase CLI..."
    npm install -g supabase
fi

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
npm install

# Install backend dependencies (simplified for push notifications only)
echo "📦 Installing backend dependencies..."
cd server
npm install @supabase/supabase-js web-push
cd ..

# Create environment files
echo "📝 Setting up environment files..."

if [ ! -f .env ]; then
    cp .env.example .env
    echo "✏️  Created .env file - please add your Supabase credentials"
else
    echo "✅ .env file already exists"
fi

if [ ! -f server/.env ]; then
    cat > server/.env << 'EOF'
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key

# Push Notifications (Firebase)
VAPID_PUBLIC_KEY=your-vapid-public-key
VAPID_PRIVATE_KEY=your-vapid-private-key
VAPID_EMAIL=your-email@example.com

# Server Configuration
NODE_ENV=development
PORT=3001
EOF
    echo "✏️  Created server/.env file - please add your Supabase credentials"
else
    echo "✅ server/.env file already exists"
fi

echo ""
echo "🔧 Next steps:"
echo "1. Create your Supabase project at https://supabase.com"
echo "2. Run the database schema from SETUP-GUIDE.md"
echo "3. Update your .env files with Supabase credentials"
echo "4. Run: npm run dev (frontend) and cd server && npm run dev (backend)"
echo ""
echo "📖 See SETUP-GUIDE.md for complete instructions"
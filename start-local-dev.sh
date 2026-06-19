#!/bin/bash

echo "🏠 Starting sTEAtus Local Development Environment..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker Desktop first."
    echo "💡 On Mac: Open Docker Desktop app and wait for it to start"
    exit 1
fi

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "📦 Installing Supabase CLI..."
    npm install -g supabase
fi

# Install dependencies if needed
if [ ! -d node_modules ]; then
    echo "📦 Installing frontend dependencies..."
    npm install
fi

if [ ! -d server/node_modules ]; then
    echo "📦 Installing backend dependencies..."
    cd server
    npm install
    cd ..
fi

# Start Supabase (if not already running)
echo "🗄️ Starting local Supabase..."
supabase start

# Wait for Supabase to be ready
echo "⏳ Waiting for Supabase to be ready..."
sleep 10

# Apply database migrations
echo "🔄 Applying database migrations..."
supabase db push

# Get Supabase status and URLs
echo ""
echo "📊 Supabase Status:"
supabase status

# Create storage bucket for avatars
echo "📁 Setting up storage bucket..."
# This will create the avatars bucket if it doesn't exist
supabase storage create avatars --public || echo "Storage bucket may already exist"

# Kill any existing processes on our ports
echo "🔄 Cleaning up existing processes..."
lsof -ti:3001 | xargs kill -9 2>/dev/null || true
lsof -ti:5174 | xargs kill -9 2>/dev/null || true

# Start backend with local environment
echo "🔧 Starting backend server..."
cd server
NODE_ENV=development npm run dev &
BACKEND_PID=$!
cd ..

# Wait for backend to start
sleep 3

# Start frontend with local environment
echo "🎨 Starting frontend..."
# Use local environment file
cp .env.local .env 2>/dev/null || echo "Using existing .env file"
npm run dev &
FRONTEND_PID=$!

echo ""
echo "✅ Local development environment started!"
echo ""
echo "🎯 URLs:"
echo "  📱 Frontend: http://localhost:5174"
echo "  🔧 Backend: http://localhost:3001" 
echo "  🗄️ Supabase Studio: http://localhost:54323"
echo "  💾 Database: postgresql://postgres:postgres@localhost:54322/postgres"
echo ""
echo "🧪 Test Features:"
echo "  1. Visit http://localhost:5174"
echo "  2. Sign up with test@example.com / password123"
echo "  3. Create moods (including Shutdown/Meltdown)"
echo "  4. Add friends and test real-time updates"
echo "  5. Upload profile pictures"
echo ""
echo "📊 Monitor:"
echo "  • View data at http://localhost:54323"
echo "  • Check logs in terminal"
echo "  • Test iPhone by visiting your local IP"
echo ""
echo "Press Ctrl+C to stop all services"

# Cleanup function
cleanup() {
    echo ""
    echo "🛑 Stopping services..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true
    echo ""
    echo "🗄️ To stop Supabase: supabase stop"
    echo "🗄️ To view Supabase status: supabase status" 
    echo ""
    echo "💡 Supabase data persists between restarts"
    echo "🔄 To reset database: supabase db reset"
    echo ""
    echo "👋 Happy coding!"
    exit 0
}

trap cleanup INT

# Wait for processes
wait $BACKEND_PID $FRONTEND_PID
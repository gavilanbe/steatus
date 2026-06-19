#!/bin/bash

echo "🧪 Testing Local Supabase Setup..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker Desktop first."
    exit 1
fi

# Check if Supabase CLI is available
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not installed. Run: npm install -g supabase"
    exit 1
fi

# Check if Supabase is running
if ! curl -s http://localhost:54321/health > /dev/null 2>&1; then
    echo "🗄️ Supabase not running. Starting it now..."
    supabase start
    echo "⏳ Waiting for Supabase to start..."
    sleep 15
fi

# Test Supabase connection
echo "🔌 Testing Supabase connection..."
if curl -s http://localhost:54321/health > /dev/null 2>&1; then
    echo "✅ Supabase API is running"
else
    echo "❌ Cannot connect to Supabase API"
    exit 1
fi

# Test Supabase Studio
echo "🎨 Testing Supabase Studio..."
if curl -s http://localhost:54323 > /dev/null 2>&1; then
    echo "✅ Supabase Studio is accessible"
else
    echo "❌ Cannot access Supabase Studio"
fi

# Test database connection
echo "💾 Testing database connection..."
if supabase db ping > /dev/null 2>&1; then
    echo "✅ Database connection successful"
else
    echo "❌ Database connection failed"
fi

# Show Supabase status
echo ""
echo "📊 Supabase Services Status:"
supabase status

echo ""
echo "🎯 Ready to develop!"
echo ""
echo "📱 Next steps:"
echo "1. Run: ./start-local-dev.sh"
echo "2. Visit: http://localhost:5174"
echo "3. Sign up with test@example.com"
echo "4. Test mood sharing features"
echo ""
echo "🗄️ Supabase Studio: http://localhost:54323"
echo "💾 Database: postgresql://postgres:postgres@localhost:54322/postgres"
#!/bin/bash

# Development startup script for sTEAtus
# This script starts both frontend and backend in development mode

set -e

echo "🚀 Starting sTEAtus development environment..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check if PostgreSQL is running (optional check)
if command -v pg_isready &> /dev/null; then
    if ! pg_isready -q; then
        echo "⚠️  PostgreSQL doesn't seem to be running. Make sure it's started for the backend to work."
    fi
fi

# Create environment files if they don't exist
if [ ! -f .env ]; then
    echo "📝 Creating frontend environment file..."
    cp .env.example .env
    echo "✏️  Please edit .env with your API URL"
fi

if [ ! -f server/.env ]; then
    echo "📝 Creating backend environment file..."
    cp server/.env.example server/.env
    echo "✏️  Please edit server/.env with your database credentials and JWT secret"
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

# Kill any existing processes on our ports
echo "🔄 Cleaning up any existing processes..."
lsof -ti:3001 | xargs kill -9 2>/dev/null || true
lsof -ti:5174 | xargs kill -9 2>/dev/null || true

# Start backend in background
echo "🏗️  Starting backend server..."
cd server
npm run dev &
BACKEND_PID=$!
cd ..

# Wait a moment for backend to start
sleep 3

# Start frontend
echo "🎨 Starting frontend server..."
npm run dev &
FRONTEND_PID=$!

echo ""
echo "✅ Development servers started!"
echo "🎯 Frontend: http://localhost:5174"
echo "🔧 Backend: http://localhost:3001"
echo "📊 Backend API: http://localhost:3001/api"
echo ""
echo "Press Ctrl+C to stop all servers"

# Handle Ctrl+C
cleanup() {
    echo ""
    echo "🛑 Shutting down servers..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true
    echo "👋 Goodbye!"
    exit 0
}

trap cleanup INT

# Wait for processes
wait $BACKEND_PID $FRONTEND_PID
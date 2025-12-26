#!/bin/bash
# start-dev.sh - Start both frontend and backend for local development

echo "🎮 CricSim Pro - Local Development Startup"
echo "=========================================="

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Node is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install it first."
    exit 1
fi

echo -e "${BLUE}📦 Installing dependencies...${NC}"

# Install frontend dependencies
echo -e "${BLUE}Frontend dependencies...${NC}"
npm install

# Install server dependencies
echo -e "${BLUE}Backend dependencies...${NC}"
cd server
npm install
cd ..

echo -e "${GREEN}✅ Dependencies installed!${NC}"
echo ""
echo -e "${YELLOW}Starting services...${NC}"
echo ""

# Start backend in background
echo -e "${BLUE}🚀 Starting backend server (port 4000)...${NC}"
cd server
npm run dev > ../server.log 2>&1 &
SERVER_PID=$!
cd ..

sleep 2

# Start frontend
echo -e "${BLUE}🚀 Starting frontend (port 5173)...${NC}"
npm run dev > frontend.log 2>&1 &
FRONTEND_PID=$!

sleep 3

echo ""
echo -e "${GREEN}✅ All services started!${NC}"
echo ""
echo "📍 Frontend:  http://localhost:5173"
echo "📍 Backend:   http://localhost:4000"
echo ""
echo "📋 Logs:"
echo "   Frontend:  tail -f frontend.log"
echo "   Backend:   tail -f server.log"
echo ""
echo "🎮 Open two browser windows to test multiplayer:"
echo "   1. Create room in first window"
echo "   2. Join in second window"
echo ""
echo "⚠️  Press Ctrl+C to stop all services"
echo ""

# Handle Ctrl+C
trap "kill $SERVER_PID $FRONTEND_PID 2>/dev/null; echo '👋 Goodbye!'" EXIT

# Wait for processes
wait $SERVER_PID $FRONTEND_PID

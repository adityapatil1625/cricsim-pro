# 🎮 CricSim Pro v3 - IPL Auction & Cricket Simulator

A production-ready multiplayer IPL auction and cricket simulation platform with real-time Socket.IO synchronization.

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Features](#features)
3. [Tech Stack](#tech-stack)
4. [Quick Start](#quick-start)
5. [Project Structure](#project-structure)
6. [Installation & Setup](#installation--setup)
7. [Development](#development)
8. [Multiplayer Features](#multiplayer-features)
9. [Deployment](#deployment)
10. [Troubleshooting](#troubleshooting)

---

## Overview

**CricSim Pro v3** is an IPL-themed auction and cricket simulation platform featuring:
- 🏆 **Real IPL Player Database** - 574 players across 8 IPL teams
- 💰 **Dynamic Auction System** - ₹90 Crore purse limit with role-based constraints
- 👥 **Multiplayer Auction** - Real-time synchronized bidding (2+ players)
- 🎉 **Live Celebrations** - Confetti animations and sold player overlays
- 📊 **Live Analytics** - Team stats, sold players, remaining purse tracking
- 📱 **Responsive Design** - Works on desktop and tablets (Tailwind CSS)

---

## Features

### IPL Auction System ✅
- **574 Real IPL Players** organized into 78 auction sets
- **Role Classification**: Wicket-keepers, Batters, All-rounders, Bowlers
- **Squad Management**: 25-player limit with role balance tracking
- **Purse System**: ₹90 Crore budget with real-time tracking
- **Overseas Constraints**: Max 8 overseas players per team
- **Dynamic Bid Increments**: Progressive bid amounts based on current price
- **IPL-style Auction Sets**: Marquee, Capped, Uncapped, Overseas players

### Multiplayer Features ✅
- **Real-time Synchronization**: Socket.IO bidding, queue sync, state management
- **Room System**: Create/join auction rooms with unique 6-digit codes
- **Host Controls**: Start auction, manage auction phases
- **Bid History**: Track all bids with team names and amounts in real-time
- **Auction Log**: Complete activity timeline with timestamps
- **Sold Overlay**: All players see celebratory overlay when player is sold
- **Timer Sync**: Host broadcasts timer to ensure all guests see same countdown
- **Next Player Broadcast**: Host announces next player to all guests simultaneously

### UI/UX Features ✅
- **Modern Dark Theme**: Purple/gold gradient with slate backgrounds
- **Sold Player Celebration**: Confetti bursts + visual overlay when player sells
- **My Squad Panel**: Classified player view by role with stats
- **Teams Overview**: Quick stats for all 8 teams
- **Responsive Layout**: 3-section layout (sidebar | center | sidebar)
- **Alert System**: Purse, squad size, and overseas limit warnings
- **Set Context Display**: Current auction set progress and information

---

## Tech Stack

**Frontend:**
- React 18.3.1 with Hooks
- Tailwind CSS 3.x for styling
- Vite 6.4.1 for bundling
- Socket.IO Client for real-time communication
- Canvas Confetti for celebration effects

**Backend:**
- Node.js 20.x with Express
- Socket.IO for WebSocket communication
- In-memory room management

**Data:**
- 574 Real IPL players dataset
- 78 IPL auction sets
- JSON-based configuration

---

## Quick Start

### Prerequisites
- Node.js 20.x or higher
- npm 11.x or higher

### Windows Quick Launch
```bash
cd c:\Users\adity\Downloads\cricsim-pro-v3\cricsim-pro-v3
start-dev.bat
```

### Mac/Linux Quick Launch
```bash
cd path/to/cricsim-pro-v3
chmod +x start-dev.sh
./start-dev.sh
```

### Manual Setup
```bash
# Install frontend dependencies
npm install

# Start development server (frontend)
npm run dev

# In another terminal, start backend
cd server
npm install
npm run dev

# Frontend runs at http://localhost:5173
# Backend runs at http://localhost:4000
```

---

## Project Structure

```
cricsim-pro-v3/
├── src/
│   ├── components/auction/
│   │   ├── AuctionRoom.jsx              # Main auction orchestration (1000+ lines)
│   │   ├── AuctionPageLayout.jsx        # Layout coordinator
│   │   ├── MySquadPanel.jsx             # Current player squad display
│   │   ├── TeamsOverviewPanel.jsx       # All teams stats
│   │   ├── BidHistorySidebar.jsx        # Bid history tracking
│   │   ├── AuctionAnalytics.jsx         # Footer analytics (6 stat boxes)
│   │   ├── AuctionAlerts.jsx            # Purse/squad warnings
│   │   ├── SetContextDisplay.jsx        # Current set info & progress
│   │   └── AdminControls.jsx            # Host-only controls
│   ├── hooks/
│   │   ├── useAppState.js
│   │   ├── useMatchEngine.js
│   │   └── useMultiplayer.js
│   ├── data/
│   │   ├── iplData.json                 # 574 real IPL players
│   │   └── playerPoolV2.js              # Player processing utilities
│   ├── constants/
│   │   ├── appConstants.js
│   │   └── socketEvents.js
│   ├── socket.js                        # Socket.IO client setup
│   └── utils/
│       ├── auctionEnhanced.js
│       ├── auctionUtils.js
│       └── commentary.js
├── server/
│   ├── server.js                        # Express + Socket.IO server (1000+ lines)
│   ├── package.json
│   └── .env.example
├── public/
├── package.json
├── vite.config.js
├── tailwind.config.cjs
├── postcss.config.cjs
├── Procfile
├── vercel.json
├── start-dev.bat
├── start-dev.sh
└── README.md (this file)
```

---

## Installation & Setup

### 1. Clone/Navigate to Project
```bash
cd c:\Users\adity\Downloads\cricsim-pro-v3\cricsim-pro-v3
```

### 2. Install Dependencies
```bash
# Frontend
npm install

# Backend
cd server
npm install
cd ..
```

### 3. Configure Environment
```bash
# Backend (optional, defaults to port 4000)
cp server/.env.example server/.env
```

### 4. Start Development Servers

**Option A: Automated (Recommended)**
```bash
# Windows
start-dev.bat

# Mac/Linux
./start-dev.sh
```

**Option B: Manual**
```bash
# Terminal 1 - Backend
cd server
npm run dev

# Terminal 2 - Frontend
npm run dev
```

---

## Development

### Available Scripts

**Frontend:**
```bash
npm run dev       # Start Vite dev server (port 5173)
npm run build     # Build for production
npm run preview   # Preview production build
```

**Backend:**
```bash
cd server
npm run dev       # Start with nodemon (auto-reload)
npm start         # Start production server
```

### Key Configuration

**Auction Settings** (`src/components/auction/AuctionRoom.jsx`):
```javascript
const AUCTION_CONFIG = {
  SQUAD_MIN: 18,
  SQUAD_MAX: 25,
  MAX_OVERSEAS: 8,
  TOTAL_PURSE: 1000,
  INITIAL_TIMER: 10,
  BID_TIMER: 10,
  SOLD_TIMER: 3,
};
```

---

## Multiplayer Features

### How It Works

**Auction Flow:**
1. Host builds auction queue from 574 IPL players (organized by auction sets)
2. Host starts auction and emits queue sync to all guests
3. Players are announced one by one with base prices
4. Teams bid in real-time - bids broadcast to all players
5. Timer counts down (synced from host to all guests)
6. At 0 seconds: Player sold to highest bidder or marked unsold
7. Host broadcasts next player announcement to all guests
8. Repeat until all players auctioned

**Real-time Synchronization:**
- ✅ **Bid Broadcasting**: When a team bids, host emits `auctionBid` → Server relays to all guests
- ✅ **Timer Sync**: Host broadcasts `auctionTimerUpdate` every second → All guests sync their countdown
- ✅ **Sold Player Event**: Host emits `auctionPlayerSold` → Server relays to all guests
- ✅ **Next Player Announcement**: Host emits `auctionNextPlayer` → Server relays to all guests
- ✅ **Queue Sync**: Host syncs entire queue at start via `auctionQueueSync`

### Socket.IO Events

**Auction-specific Events:**
```javascript
// Client → Server
'auctionBid'              // Place a bid
'auctionPlayerSold'       // Player sold notification
'auctionPlayerUnsold'     // Player unsold notification
'auctionTimerUpdate'      // Timer broadcast (host only)
'auctionNextPlayer'       // Next player announcement (host only)
'auctionQueueSync'        // Queue synchronization (host only)

// Server → Client
'auctionBidUpdate'        // Broadcast bid to all
'auctionPlayerSold'       // Broadcast sold
'auctionPlayerUnsold'     // Broadcast unsold
'auctionTimerUpdate'      // Broadcast timer
'auctionNextPlayer'       // Broadcast next player
'auctionQueueSync'        // Broadcast queue
```

---

## Deployment

### Backend Deployment (Render.com)

1. **Push code to GitHub**
2. **Go to [render.com](https://render.com)** → Create New → Web Service
3. **Connect your GitHub repo**
4. **Configure:**
   - **Build Command:** `cd server && npm install`
   - **Start Command:** `node server/server.js`
   - **Environment Variables:**
     ```
     PORT=4000
     NODE_ENV=production
     FRONTEND_URL=https://your-vercel-domain.vercel.app
     ```
5. **Deploy** - Note the URL (e.g., `https://cricsim-pro.onrender.com`)

### Frontend Deployment (Vercel)

1. **Update `vercel.json`:**
   ```json
   {
     "env": {
       "VITE_SOCKET_SERVER": "https://cricsim-pro.onrender.com"
     }
   }
   ```

2. **Push to GitHub** - Vercel auto-deploys on push
3. **Test** - Your live multiplayer auction is ready!

---

## Troubleshooting

### Bidding Issues

**Button is disabled:**
- Check if your team has sufficient purse balance
- Ensure squad is not full (max 25 players)
- If team is overseas-heavy, check overseas limit (max 8)
- Wait for another team to bid (no consecutive bidding)

**Bids not syncing:**
- Verify Socket.IO connection: F12 → Network → look for WebSocket
- Ensure both clients are in same room (check room code)
- Restart browser tabs
- Check server logs for errors

### Connection Issues

**Can't connect to backend:**
- Verify backend is running: `http://localhost:4000`
- Check `VITE_SOCKET_SERVER` in `vercel.json`
- Ensure CORS is configured properly in `server/server.js`

**Multiplayer not working:**
- Both players must be in same room
- Host must click "Start Auction"
- Check browser console for WebSocket errors
- Clear browser cache and reload

### Timer/Sync Issues

**Timer out of sync:**
- Host's timer is the source of truth - guests receive broadcasts
- If still out of sync, refresh page
- Check network latency (high latency may cause delays)

**Players not seeing next player:**
- Host must successfully announce next player (after 3.5s delay)
- If stuck, refresh page
- Check server logs for `auctionNextPlayer` events

---

## Key Improvements Made

### Multiplayer Auction Fixes (v3.2)
- ✅ **Player Progression**: Host and guests move to next player simultaneously
- ✅ **Timer Synchronization**: Host broadcasts timer every second to all guests
- ✅ **Bid Button State**: Guests can bid immediately on next player
- ✅ **Sold Overlay**: All players see celebratory overlay when player is sold
- ✅ **Queue Management**: Only host manages queue, guests wait for announcements
- ✅ **Bidding State**: `currentBidder` clears for all clients when player is sold

---

## Architecture

### Real-time Flow Diagram

```
┌─────────────┐                    ┌─────────────┐
│   Guest 1   │                    │   Guest 2   │
│             │                    │             │
│ currentPlayer: null              │ currentPlayer: null
│ currentBidder: null              │ currentBidder: null
│ queue: [...]                     │ queue: [...]
└──────┬──────┘                    └──────┬──────┘
       │                                  │
       │  Socket.IO WebSocket             │
       │  ↑↓                              ↑↓
       └──────────────┬───────────────────┘
                      │
                    Server
                      │
      ┌────────────────────────────────┐
      │  Room Storage (In-Memory)      │
      │  - Players                     │
      │  - Teams & Purses              │
      │  - Auction Queue               │
      │  - Current Player              │
      └────────────────────────────────┘

Host broadcasts every second:
  - auctionTimerUpdate (timer: 10, playerName: "X")
  - Server relays to guests
  - Guests update their timer

Host broadcasts when player sold:
  - auctionPlayerSold (player, teamId, price)
  - Server relays to guests
  - Guests show overlay, update teams

Host announces next player:
  - auctionNextPlayer (player: {...})
  - Server relays to guests
  - All clients show new player simultaneously
```

---

## File Sizes & Stats

📊 **Code Statistics:**
- `src/components/auction/AuctionRoom.jsx` - 1000+ lines
- `server/server.js` - 1000+ lines
- Total project code: 2000+ lines

🔌 **Socket.IO Events:**
- 6 core auction events
- Real-time broadcasting to all connected clients

⚛️ **React Components:**
- 9 auction-specific components
- Custom React hooks for state management
- Responsive Tailwind CSS styling

---

## Next Steps

1. **Test Locally** - Run `start-dev.bat` or `./start-dev.sh`
2. **Understand Flow** - Review the multiplayer features section
3. **Deploy Backend** - Push to Render.com
4. **Deploy Frontend** - Push to Vercel
5. **Play Multiplayer!** - Share room codes with friends

---

## License

MIT License

---

**Built with ❤️ for IPL Auction Lovers** 🏏⚡

*Version: 3.2.0 - Multiplayer Synchronized Auction*  
*Last Updated: January 6, 2026*

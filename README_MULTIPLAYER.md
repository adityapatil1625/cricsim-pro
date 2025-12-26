# CricSim Pro - Multiplayer Implementation

## What's Been Done

I've set up a complete end-to-end multiplayer system for CricSim Pro. Here's what was created:

### Backend (Server)

✅ **`server/server.js`** - Complete Node.js + Express + Socket.IO server with:
- Room creation and management
- Player join/leave handling
- Match state synchronization
- Real-time game event broadcasting
- Automatic cleanup and error handling

✅ **`server/package.json`** - Server dependencies configured

✅ **`server/.env.example`** - Environment variables template

### Frontend

✅ **`src/socket.js`** (Updated) - Enhanced Socket.IO client with:
- Proper error handling
- Reconnection logic
- Connection state logging

✅ **`src/hooks/useMultiplayer.js`** - Custom React hook providing:
- Room creation/joining
- Team setup
- Match control
- Real-time state synchronization
- Event broadcasting

✅ **`src/components/match/OnlineEntry.jsx`** - UI component for:
- Creating new rooms
- Joining existing rooms
- Selecting game modes
- Player name input

✅ **`src/components/match/MultiplayerLobby.jsx`** - UI component for:
- Displaying room code
- Showing connected players
- Ready status management
- Start match button (host only)

### Configuration & Deployment

✅ **`Procfile`** - Render.com deployment configuration

✅ **`vercel.json`** (Updated) - Vercel configuration with CORS setup

✅ **`package.json`** (Updated) - Added server scripts and concurrently

### Documentation

✅ **`MULTIPLAYER_SETUP.md`** - Complete setup guide including:
- Architecture overview
- Local development instructions
- Production deployment steps
- Socket event documentation
- Troubleshooting guide

✅ **`src/AppMultiplayerIntegration.jsx`** - Integration instructions showing:
- Exact code changes needed
- Where to add imports
- How to wire up components
- How to modify match functions
- Socket event handling

✅ **`start-dev.sh`** - Bash script for local development

✅ **`start-dev.bat`** - Batch script for Windows development

## How to Use

### Step 1: Test Locally

**Windows Users:**
```bash
# Run this in the project root:
start-dev.bat
```

**Mac/Linux Users:**
```bash
chmod +x start-dev.sh
./start-dev.sh
```

Or manually:
```bash
# Terminal 1: Backend
cd server
npm install
npm run dev

# Terminal 2: Frontend  
npm install
npm run dev
```

### Step 2: Test Multiplayer Locally

1. Open `http://localhost:5173` in **two different browser windows**
2. In **Window 1**: Click "Play Online" → Select "Create Room" → Enter name → Select mode (1v1)
3. In **Window 2**: Click "Play Online" → Select "Join Room" → Enter code → Enter name
4. Both windows now show the **Multiplayer Lobby**
5. Both select teams (clicking players to form teams)
6. In **Window 1** (host), click "Start Match"
7. Both windows sync to **Match View** with live updates

### Step 3: Deploy to Production

**Backend (Render.com):**

1. Go to https://render.com
2. Create new **Web Service**
3. Connect your GitHub repository
4. Set these values:
   - **Build Command**: `npm install --prefix server`
   - **Start Command**: `node server/server.js`
   - **Environment Variables**:
     ```
     PORT=4000
     FRONTEND_URL=https://cricsim-pro.vercel.app
     ```
5. Deploy and get URL (e.g., `https://cricsim-pro-server.onrender.com`)

**Frontend (Vercel):**

1. Update `vercel.json`:
   ```json
   "env": {
     "VITE_SOCKET_SERVER": "https://cricsim-pro-server.onrender.com"
   }
   ```
2. Push to GitHub (automatic deployment)

## Integration Checklist

To fully integrate multiplayer into your App.jsx, you need to:

- [ ] Import the new components and hook in App.jsx
  ```jsx
  import useMultiplayer from './hooks/useMultiplayer';
  import OnlineEntry from './components/match/OnlineEntry';
  import MultiplayerLobby from './components/match/MultiplayerLobby';
  ```

- [ ] Initialize useMultiplayer hook
- [ ] Add "Play Online" button to Menu
- [ ] Add routing for `online_entry` and `online_lobby` views
- [ ] Modify bowlBall, skipOver, skipInnings to broadcast when host
- [ ] Add socket listeners for matchStateUpdated, ballBowled, etc.
- [ ] Pass broadcast functions to MatchCenter component
- [ ] Test with two players locally
- [ ] Deploy backend
- [ ] Deploy frontend
- [ ] Test live multiplayer

See **`src/AppMultiplayerIntegration.jsx`** for exact code samples.

## Architecture

```
Browser 1 (Host)          Browser 2 (Guest)
      ↓                         ↓
    React App      ← Socket.IO →     React App
      ↓                         ↓
  useMultiplayer           useMultiplayer
      ↓                         ↓
    socket.emit() ←→ Server ←→ socket.on()
                    (Node.js)
                    (Express)
                    (Socket.IO)
```

## Socket Events Flow

### Creating a Room

```
Player 1: createRoom("1v1", "Alice")
    ↓
    socket.emit("createRoom", ...)
    ↓
    Server generates code (ABC12)
    ↓
    socket.on("roomUpdate", room)
    ↓
    Navigate to online_lobby
```

### Joining a Room

```
Player 2: joinRoom("ABC12", "Bob")
    ↓
    socket.emit("joinRoom", ...)
    ↓
    Server validates code exists
    ↓
    socket.on("roomUpdate", room with 2 players)
    ↓
    Both players navigate to online_lobby
```

### Starting Match

```
Host: startMatch()
    ↓
    socket.emit("startMatch", matchState)
    ↓
    Server validates all players ready
    ↓
    socket.on("matchStarted", matchState)
    ↓
    Both navigate to match view
```

### Match Live Sync

```
Host bowls ball → updateMatchState()
    ↓
    socket.emit("updateMatchState", newState)
    ↓
    socket.on("matchStateUpdated", newState)
    ↓
    Guest receives and syncs UI in real-time
```

## Key Files Reference

| File | Purpose |
|------|---------|
| `server/server.js` | Backend server logic |
| `src/socket.js` | Socket.IO client setup |
| `src/hooks/useMultiplayer.js` | Multiplayer logic & events |
| `src/components/match/OnlineEntry.jsx` | Create/Join UI |
| `src/components/match/MultiplayerLobby.jsx` | Room lobby UI |
| `src/AppMultiplayerIntegration.jsx` | Integration guide |
| `MULTIPLAYER_SETUP.md` | Complete documentation |

## Common Issues & Solutions

### "WebSocket connection to ... failed"

**Solution**: Ensure backend server is running and CORS is configured correctly.

```bash
# Check backend is running
curl http://localhost:4000

# Check logs
cd server && npm run dev
```

### Players not syncing during match

**Solution**: Ensure host is calling broadcast functions.

```jsx
// Host should do this in MatchCenter:
if (isHost) {
  broadcastBallBowled(matchState, commentary);
}
```

### Room code invalid

**Solution**: Room codes expire after 6 hours. Create a new room.

### Two players on same team

**Solution**: Check `updateTeamPlayers` is being called before startMatch.

## Next Steps

1. **Integrate App.jsx** - Follow `src/AppMultiplayerIntegration.jsx`
2. **Test Locally** - Run `start-dev.bat` or `start-dev.sh`
3. **Deploy Backend** - Push to Render.com
4. **Deploy Frontend** - Push to Vercel
5. **Test Live** - Create room and play with real players

## Support

For detailed setup instructions, see:
- `MULTIPLAYER_SETUP.md` - Full guide
- `src/AppMultiplayerIntegration.jsx` - Code examples
- `server/server.js` - Backend implementation
- `src/hooks/useMultiplayer.js` - Frontend hook

---

**Status**: ✅ Ready to integrate and deploy

**Remaining**: Integrate changes into App.jsx component

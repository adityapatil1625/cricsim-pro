# CricSim Pro - Multiplayer Setup Guide

## Overview

This guide walks you through setting up the complete multiplayer feature for CricSim Pro. The system uses Socket.IO for real-time communication between players.

## Architecture

- **Frontend**: React app (Vercel deployment)
- **Backend**: Node.js + Express + Socket.IO (Render.com deployment)
- **Communication**: WebSocket + fallback polling
- **State Management**: Local state synchronized via Socket.IO events

## Quick Start

### 1. Local Development

#### Setup Frontend
```bash
cd cricsim-pro-v3
npm install
npm run dev
```
Frontend will run on `http://localhost:5173`

#### Setup Backend
```bash
cd server
npm install
npm run dev
```
Backend will run on `http://localhost:4000`

#### Environment Variables
Create `.env` in the `server/` directory:
```
PORT=4000
FRONTEND_URL=http://localhost:5173
CRICKETDATA_API_KEY=your_api_key_here
```

### 2. Test Multiplayer Locally

1. Open two browser windows to `http://localhost:5173`
2. In first window: Click "Play Online" → "Create Room" → Select "1v1 Match"
3. In second window: Click "Play Online" → "Join Room" → Enter the room code
4. Both select teams
5. Host clicks "Start Match"
6. Match begins with live synchronization

## Production Deployment

### Deploy Backend to Render.com

1. **Sign up** at https://render.com
2. **Create new Web Service**
   - GitHub repo: your-repo-url
   - Build command: `npm install --prefix server`
   - Start command: `node server/server.js`
   - Environment variables:
     ```
     PORT=4000
     FRONTEND_URL=https://cricsim-pro.vercel.app
     CRICKETDATA_API_KEY=your_api_key
     REDIS_URL=optional_redis_url
     ```

3. **Get the deployed URL** (e.g., `https://cricsim-pro-server.onrender.com`)

### Deploy Frontend to Vercel

1. Update `vercel.json`:
   ```json
   {
     "rewrites": [
       { "source": "/(.*)", "destination": "/index.html" }
     ],
     "env": {
       "VITE_SOCKET_SERVER": "https://cricsim-pro-server.onrender.com"
     }
   }
   ```

2. Deploy to Vercel (automatic from GitHub push)

## How It Works

### Creating a Room

```javascript
import useMultiplayer from './hooks/useMultiplayer';

function MyComponent() {
  const { createRoom } = useMultiplayer();
  
  const handleCreate = async () => {
    const response = await createRoom('1v1', 'Player Name');
    console.log('Room code:', response.code);
  };
}
```

### Joining a Room

```javascript
const { joinRoom } = useMultiplayer();

const handleJoin = async () => {
  const response = await joinRoom('ABC12', 'Player Name');
  console.log('Joined room:', response.code);
};
```

### Integrating with Match

```javascript
const {
  isHost,
  broadcastMatchState,
  broadcastBallBowled,
  broadcastSkipOver,
} = useMultiplayer();

// During match, instead of just updating local state:
const handleBowlBall = () => {
  // Update local match state first
  const newState = calculateBallOutcome(matchState);
  
  // If host, broadcast to all players
  if (isHost) {
    broadcastMatchState(newState);
  }
};
```

## Socket Events

### Client → Server

- `createRoom` - Create a new game room
- `joinRoom` - Join an existing room
- `updateTeamPlayers` - Set player's team composition
- `startMatch` - Start the match (host only)
- `updateMatchState` - Update match state during game
- `bowlBall` - Broadcast a bowled ball
- `skipOver` - Skip an over
- `inningsBreak` - Change innings
- `endMatch` - End the match
- `sendMessage` - Send chat message

### Server → Client

- `roomUpdate` - Room state changed (players joined/left)
- `matchStarted` - Match has started
- `matchStateUpdated` - Match state changed
- `ballBowled` - Ball was bowled
- `overSkipped` - Over was skipped
- `inningsChanged` - Innings changed
- `matchEnded` - Match ended
- `playerDisconnected` - Player left the room
- `hostChanged` - New host assigned
- `messageReceived` - Chat message received

## File Structure

```
cricsim-pro-v3/
├── src/
│   ├── components/
│   │   └── match/
│   │       ├── OnlineEntry.jsx (NEW)
│   │       └── MultiplayerLobby.jsx (NEW)
│   ├── hooks/
│   │   ├── useMatchEngine.js
│   │   └── useMultiplayer.js (NEW)
│   ├── socket.js (UPDATED)
│   └── App.jsx (UPDATE NEEDED)
├── server/
│   ├── server.js (NEW)
│   ├── package.json (NEW)
│   └── .env.example (NEW)
├── Procfile (NEW)
└── vercel.json (UPDATED)
```

## Next Steps to Integrate

### 1. Update App.jsx

Import the new components and hook:
```jsx
import useMultiplayer from './hooks/useMultiplayer';
import OnlineEntry from './components/match/OnlineEntry';
import MultiplayerLobby from './components/match/MultiplayerLobby';
```

Initialize the hook:
```jsx
const multiplayerHook = useMultiplayer();
```

Add routing:
```jsx
{view === 'online_entry' && (
  <OnlineEntry
    onCreateRoom={multiplayerHook.createRoom}
    onJoinRoom={multiplayerHook.joinRoom}
    onBack={() => setView('menu')}
    isLoading={multiplayerHook.loading}
    error={multiplayerHook.error}
  />
)}
```

### 2. Update MatchCenter

Modify to use broadcast functions:
```jsx
// In MatchCenter component
const handleBowlBall = () => {
  // ... existing logic ...
  
  if (isOnline && isHost) {
    broadcastBallBowled(newMatchState, commentary);
  }
};
```

### 3. Listen to Multiplayer Events

Use the socket event listeners to update the UI in real-time.

## Troubleshooting

### WebSocket Connection Failed

1. Check server is running: `http://localhost:4000` (development)
2. Check CORS in server configuration
3. Check VITE_SOCKET_SERVER URL is correct
4. Check firewall/network settings

### Players Not Syncing

1. Ensure host is calling broadcast functions
2. Check socket.io events are being emitted (browser DevTools)
3. Verify room exists on server
4. Check for JavaScript errors in console

### Room Not Found

1. Verify room code is correct
2. Check room hasn't expired (6 hour timeout)
3. Ensure other player is still connected

## Performance Tips

- Use Redis for production room persistence
- Implement room cleanup for empty rooms
- Add rate limiting for socket events
- Compress match state data for faster sync
- Consider game-specific optimizations

## Future Enhancements

- [ ] Implement Redis for distributed server
- [ ] Add chat/voice communication
- [ ] Implement spectator mode
- [ ] Add match statistics and replays
- [ ] Mobile app support
- [ ] Matchmaking system
- [ ] Leaderboards
- [ ] Replay system

## Support

For issues or questions, refer to:
- Socket.IO documentation: https://socket.io/docs/
- React documentation: https://react.dev/
- Render.com deployment: https://render.com/docs/

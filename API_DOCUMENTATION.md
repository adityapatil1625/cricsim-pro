# CricSim Pro API Documentation

## Overview
CricSim Pro uses a combination of REST endpoints and Socket.IO real-time events for communication between the client and server.

---

## REST API Endpoints

### Health Check
```
GET /
```
**Response:**
```json
{
  "message": "CricSim Pro Server Running",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Player Search
```
GET /api/players/search?query={searchQuery}
```
**Query Parameters:**
- `query` (required): Player name to search for

**Response:**
```json
{
  "players": [
    {
      "id": "player-1",
      "name": "Virat Kohli",
      "role": "Bat",
      "avg": 52.5,
      "sr": 142.8,
      "img": "url-to-image"
    }
  ]
}
```

**Error Response:**
```json
{
  "players": [],
  "error": "CRICKETDATA_API_KEY not configured"
}
```

---

## Socket.IO Events

### Connection Events

#### `connection`
Fired when a client connects to the Socket.IO server.

```javascript
socket.on('connection', () => {
  // Connected successfully
});
```

#### `disconnect`
Fired when a client disconnects.

```javascript
socket.on('disconnect', () => {
  // Cleanup and rate limit clearing
});
```

---

### Room Management Events

#### Create Room
**Event:** `createRoom`

**Client Emit:**
```javascript
socket.emit('createRoom', {
  playerName: string,
  gameType: 'quick' | 'tournament' | 'auction'
});
```

**Server Response:**
```javascript
socket.on('roomCreated', (roomData) => {
  // roomData: {
  //   code: 'ABC12',
  //   hostPlayerId: 'player-id',
  //   hostName: 'John Doe',
  //   gameType: 'quick'
  // }
});
```

**Error:**
```javascript
socket.on('error', (message) => {
  // Error message from server
});
```

**Rate Limit:** 2 rooms per minute
**Validation:** Player name 2-30 characters

---

#### Join Room
**Event:** `joinRoom`

**Client Emit:**
```javascript
socket.emit('joinRoom', {
  code: string,
  playerName: string
});
```

**Server Response:**
```javascript
socket.on('playerJoined', (player) => {
  // player: {
  //   id: 'player-id',
  //   name: 'Jane Doe',
  //   isHost: false,
  //   joinedAt: timestamp
  // }
});
```

**Rate Limit:** 5 join attempts per 10 seconds
**Validation:** 
- Room code must be 5 alphanumeric characters
- Player name must be 2-30 characters

---

#### Leave Room
**Event:** `leaveRoom`

**Client Emit:**
```javascript
socket.emit('leaveRoom', {
  roomCode: string
});
```

**Server Response:**
```javascript
socket.on('playerLeft', (playerId) => {
  // Player has left the room
});
```

---

### Auction Events

#### Place Bid
**Event:** `auctionBid`

**Client Emit:**
```javascript
socket.emit('auctionBid', {
  roomCode: string,
  playerId: string,
  amount: number,
  teamId: string
});
```

**Server Response:**
```javascript
socket.on('bidPlaced', (bidData) => {
  // bidData: {
  //   playerId: 'player-id',
  //   teamId: 'team-id',
  //   amount: 45,
  //   timestamp: 1234567890
  // }
});
```

**Rate Limit:** 10 bids per 5 seconds
**Validation:**
- Amount must be positive number
- Team must have sufficient purse
- Team squad must not be full

---

#### Player Sold
**Event:** `playerSold`

**Server Emit:**
```javascript
io.to(roomCode).emit('playerSold', {
  playerId: string,
  teamId: string,
  soldPrice: number,
  soldTo: string
});
```

---

### Match Events

#### Start Match
**Event:** `matchStart`

**Client Emit:**
```javascript
socket.emit('matchStart', {
  roomCode: string,
  teamAId: string,
  teamBId: string,
  overs: number
});
```

**Server Response:**
```javascript
socket.on('matchStarted', (matchState) => {
  // matchState: {
  //   matchId: 'match-123',
  //   teamA: { id, name, score },
  //   teamB: { id, name, score },
  //   status: 'live'
  // }
});
```

---

#### Ball Bowled
**Event:** `matchBall`

**Client Emit:**
```javascript
socket.emit('matchBall', {
  roomCode: string,
  matchId: string
});
```

**Server Response:**
```javascript
socket.on('ballResult', (ballData) => {
  // ballData: {
  //   outcome: '0' | '1' | '2' | '3' | '4' | '6' | 'W' | 'Ex',
  //   runs: number,
  //   batsman: { name, id },
  //   bowler: { name, id },
  //   commentary: string,
  //   matchState: { score, ballsBowled, wickets }
  // }
});
```

**Rate Limit:** 100 balls per 60 seconds

---

### Chat Events

#### Send Message
**Event:** `chatMessage`

**Client Emit:**
```javascript
socket.emit('chatMessage', {
  roomCode: string,
  playerId: string,
  message: string
});
```

**Server Broadcast:**
```javascript
socket.on('newMessage', (messageData) => {
  // messageData: {
  //   playerId: string,
  //   playerName: string,
  //   message: string,
  //   timestamp: number
  // }
});
```

**Rate Limit:** 20 messages per 10 seconds
**Validation:**
- Message must be 1-500 characters
- Message trimmed and sanitized

---

### Tournament Events

#### Setup Teams
**Event:** `setupTournament`

**Client Emit:**
```javascript
socket.emit('setupTournament', {
  roomCode: string,
  teams: [
    { name: string, players: [] },
    { name: string, players: [] }
  ]
});
```

**Server Response:**
```javascript
socket.on('tournamentReady', (tournData) => {
  // tournData: {
  //   teams: [],
  //   fixtures: [],
  //   phase: 'league'
  // }
});
```

---

#### Generate Fixtures
**Event:** `generateFixtures`

**Client Emit:**
```javascript
socket.emit('generateFixtures', {
  roomCode: string,
  teams: []
});
```

**Server Response:**
```javascript
socket.on('fixturesGenerated', (fixtures) => {
  // fixtures: [
  //   { matchId, teamA, teamB, date, status }
  // ]
});
```

---

## Rate Limiting

All Socket.IO events are subject to rate limiting to prevent abuse:

| Event | Limit | Window |
|-------|-------|--------|
| `bid` | 10 | 5s |
| `createRoom` | 2 | 1m |
| `joinRoom` | 5 | 10s |
| `matchBall` | 100 | 1m |
| `chat` | 20 | 10s |
| `playerSelect` | 30 | 10s |
| `matchStateUpdate` | 1000 | 1m |
| `cursorMove` | 500 | 10s |

**Rate Limited Response:**
```javascript
{
  allowed: false,
  remaining: 0,
  retryAfterMs: 3000
}
```

---

## Error Handling

### Common Error Responses

**Validation Error:**
```json
{
  "error": "Invalid room code format",
  "code": "VALIDATION_ERROR"
}
```

**Room Not Found:**
```json
{
  "error": "Room not found",
  "code": "ROOM_NOT_FOUND"
}
```

**Rate Limited:**
```json
{
  "error": "Rate limit exceeded. Retry after 3000ms",
  "code": "RATE_LIMITED",
  "retryAfterMs": 3000
}
```

---

## Authentication & Security

- All events are validated on the server before processing
- Player names are validated and sanitized
- Room codes follow strict format rules (5 alphanumeric characters)
- Helmet.js provides security headers
- CORS is configured for allowed origins only
- Rate limiting prevents abuse and DDoS attacks

---

## Socket.IO Connection Options

**Client Configuration:**
```javascript
const socket = io('http://localhost:4000', {
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  reconnectionAttempts: 5
});
```

**Environment Variables:**
- `PORT`: Server port (default: 4000)
- `FRONTEND_URL`: Frontend URL for CORS
- `CRICKETDATA_API_KEY`: Optional API key for cricket data

---

## Example Usage

### Creating a Room

```javascript
// Client
socket.emit('createRoom', {
  playerName: 'John Doe',
  gameType: 'quick'
});

socket.on('roomCreated', (roomData) => {
  console.log('Room created:', roomData.code); // "ABC12"
});

// Server receives validation and creates room
// Room assigned unique ID and added to room manager
```

### Joining a Room

```javascript
// Client
socket.emit('joinRoom', {
  code: 'ABC12',
  playerName: 'Jane Doe'
});

socket.on('playerJoined', (player) => {
  console.log('You joined as:', player.name);
});

socket.on('playerJoined', (player) => {
  console.log('Someone joined:', player.name);
});
```

### Placing a Bid

```javascript
// Client
socket.emit('auctionBid', {
  roomCode: 'ABC12',
  playerId: 'player-123',
  amount: 50,
  teamId: 'team-1'
});

socket.on('bidPlaced', (bidData) => {
  console.log(`Bid placed: ${bidData.amount} lakh for ${bidData.playerId}`);
});
```

---

## Logging

Server logs are structured with timestamps and severity levels:

```
[2024-01-15T10:30:45.123Z] INFO: Client connected (socket-id: abc123)
[2024-01-15T10:30:46.456Z] INFO: Room created (code: ABC12, type: quick)
[2024-01-15T10:30:47.789Z] INFO: Player joined (name: John, room: ABC12)
[2024-01-15T10:30:48.012Z] WARN: Rate limit exceeded (event: bid, socket: abc123)
[2024-01-15T10:30:49.345Z] ERROR: Validation failed (error: Invalid room code)
```

---

## Performance Tips

1. **Batch Updates**: Group multiple state changes before emitting
2. **Debounce Events**: For frequent events like cursor movement, debounce on client
3. **Acknowledge Events**: Use Socket.IO acknowledgment callbacks for critical operations
4. **Monitor Rate Limits**: Check `remaining` property to avoid hitting limits
5. **Clean Disconnections**: Always emit `leaveRoom` before disconnecting

---

## Support

For issues or questions, refer to the main README.md or open an issue on GitHub.

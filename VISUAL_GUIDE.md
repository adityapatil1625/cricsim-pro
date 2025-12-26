# CricSim Pro Multiplayer - Visual Guide

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    INTERNET / NETWORK                        │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│   PLAYER 1              WEBSOCKET              PLAYER 2       │
│   ┌────────────┐         BRIDGE        ┌────────────┐        │
│   │ Browser 1  │◄──────────────────────┤ Browser 2  │        │
│   │ ┌────────┐ │                       │ ┌────────┐ │        │
│   │ │ React  │ │                       │ │ React  │ │        │
│   │ │ App    │ │                       │ │ App    │ │        │
│   │ └────────┘ │                       │ └────────┘ │        │
│   │     ▲      │                       │     ▲      │        │
│   │     │      │                       │     │      │        │
│   │ ┌───┴────┐ │                       │ ┌───┴────┐ │        │
│   │ │ Socket │ │                       │ │ Socket │ │        │
│   │ │ .IO    │ │                       │ │ .IO    │ │        │
│   │ └───┬────┘ │                       │ └───┬────┘ │        │
│   └─────┼──────┘                       └─────┼──────┘        │
│         │                                    │                │
│         └────────────────┬───────────────────┘                │
│                          │                                    │
│                 ┌────────▼─────────┐                          │
│                 │  Node.js Server  │                          │
│                 │  + Socket.IO     │                          │
│                 │                  │                          │
│                 │ ┌──────────────┐ │                          │
│                 │ │ Room Manager │ │                          │
│                 │ └──────────────┘ │                          │
│                 │ ┌──────────────┐ │                          │
│                 │ │ State Sync   │ │                          │
│                 │ └──────────────┘ │                          │
│                 │ ┌──────────────┐ │                          │
│                 │ │ Event Emit   │ │                          │
│                 │ └──────────────┘ │                          │
│                 └──────────────────┘                          │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## Game Flow Diagram

```
START
  │
  ▼
┌─────────────────┐
│  Main Menu      │
│  [Play Online]  │
└────────┬────────┘
         │
         ▼
┌─────────────────────┐      ┌─────────────────────┐
│  Create Room        │  OR  │  Join Room          │
│  - Mode (1v1)       │      │  - Enter Code       │
│  - Name             │      │  - Name             │
└────────┬────────────┘      └────────┬────────────┘
         │                           │
         └───────────┬───────────────┘
                     │
                     ▼
         ┌───────────────────────┐
         │  Socket.IO Event      │
         │  createRoom/joinRoom  │
         └───────────┬───────────┘
                     │
                     ▼ [Server validates]
         ┌───────────────────────┐
         │  roomUpdate Event     │
         │  (broadcast to both)  │
         └───────────┬───────────┘
                     │
         ┌───────────┴───────────┐
         │                       │
         ▼                       ▼
    Player 1                 Player 2
    [Host]                   [Guest]
    ┌──────────┐            ┌──────────┐
    │  Lobby   │            │  Lobby   │
    │ • Code   │            │ • Code   │
    │ • Players│            │ • Players│
    └────┬─────┘            └────┬─────┘
         │                       │
         ▼                       ▼
    [Select Team]           [Select Team]
         │                       │
         └───────────┬───────────┘
                     │
              [Both Teams Ready?]
                  YES │
                      ▼
            ┌──────────────────┐
            │ Host Clicks      │
            │ "Start Match"    │
            └────────┬─────────┘
                     │
                     ▼
          ┌────────────────────┐
          │ startMatch Event   │
          │ (validate state)   │
          └────────┬───────────┘
                   │
                   ▼
          ┌────────────────────┐
          │ matchStarted Event │
          │ (both navigate)    │
          └────────┬───────────┘
                   │
         ┌─────────┴─────────┐
         │                   │
         ▼                   ▼
      [Match View]       [Match View]
      [Controls]         [Read-Only]
         │                   │
         ▼                   ▼
    Bowl Ball            Listen for
    emit state     ◄────► state updates
         │                   │
         ▼                   ▼
    Sync All        Display Updated
    Players         Score/Wickets
         │                   │
         └─────────┬─────────┘
                   │
              [Match End]
                   │
                   ▼
          ┌────────────────────┐
          │ matchEnded Event   │
          │ (show results)     │
          └────────┬───────────┘
                   │
                   ▼
              [Menu]

```

## Socket Event Flow

```
┌──────────────────────────────────────────────────────────┐
│                 ROOM PHASE                               │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  Client 1: createRoom()                                 │
│       ↓                                                  │
│  Emit: createRoom                                       │
│       ↓                                                  │
│       ├──→ Server: Store room                           │
│       ├──→ Server: Add player                           │
│       ├──→ Server: Assign host                          │
│       ↓                                                  │
│  On: roomUpdate ◄─── Server broadcasts room            │
│       ↓                                                  │
│  Client 1: Display lobby                                │
│                                                          │
│  Client 2: joinRoom(code)                               │
│       ↓                                                  │
│  Emit: joinRoom                                         │
│       ↓                                                  │
│       ├──→ Server: Validate code                        │
│       ├──→ Server: Add player                           │
│       ├──→ Server: Update room                          │
│       ↓                                                  │
│  On: roomUpdate ◄─── Server broadcasts room            │
│       ↓                                                  │
│  Both: Display lobby with 2 players                     │
│                                                          │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│              TEAM SETUP PHASE                            │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  Client 1: updateTeamPlayers(teamA)                     │
│       ↓                                                  │
│  Emit: updateTeamPlayers                                │
│       ↓                                                  │
│  Client 2: updateTeamPlayers(teamB)                     │
│       ↓                                                  │
│  Emit: updateTeamPlayers                                │
│       ↓                                                  │
│  Both: Mark as isReady = true                           │
│       ↓                                                  │
│  Lobby shows "All ready, host can start"                │
│                                                          │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│              MATCH PHASE                                │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  Client 1 (Host): startMatch()                          │
│       ↓                                                  │
│  Emit: startMatch                                       │
│       ↓                                                  │
│       ├──→ Server: Validate ready                       │
│       ├──→ Server: Set isLive = true                    │
│       ↓                                                  │
│  On: matchStarted ◄─── Server broadcasts               │
│       ↓                                                  │
│  Both: Navigate to match view                           │
│                                                          │
│  LOOP:                                                   │
│  ┌────────────────────────────────────────────────────┐│
│  │ Host bowls ball:                                   ││
│  │ bowlBall() → broadcastBallBowled()                ││
│  │       ↓                                            ││
│  │ Emit: updateMatchState                            ││
│  │       ↓                                            ││
│  │ On: matchStateUpdated ◄── Server broadcasts       ││
│  │       ↓                                            ││
│  │ Guest: Sync score, wickets, commentary            ││
│  └────────────────────────────────────────────────────┘│
│                                                          │
│  Repeat for each ball, over, innings...                 │
│                                                          │
│  Match ends:                                             │
│  Host: endMatch() → Emit: endMatch                      │
│       ↓                                                  │
│  On: matchEnded ◄─── Server broadcasts                 │
│       ↓                                                  │
│  Both: Show results, return to menu                     │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

## Component Structure

```
App.jsx (main component)
├── Menu (main menu)
│   └── [Play Online button]
│
├── OnlineEntry (create/join room)
│   ├── Mode selector (Create/Join)
│   ├── Player name input
│   └── Game mode selection (1v1, tournament, auction)
│
├── MultiplayerLobby (waiting room)
│   ├── Room code display
│   ├── Player list
│   │   └── Player card (name, side, ready status)
│   └── Start match button (host only)
│
└── MatchCenter (live match view)
    ├── Scorecard
    ├── Commentary
    ├── Match controls
    │   ├── Bowl ball [Host only]
    │   ├── Skip over [Host only]
    │   └── End match [Host only]
    └── Player display
        ├── Striker/Non-striker
        ├── Bowler
        └── Stats
```

## State Flow

```
┌──────────────────────┐
│   useMultiplayer     │
│     Hook State       │
├──────────────────────┤
│ room: {              │
│   code: "ABC12"      │
│   mode: "1v1"        │
│   host: "socket_id"  │
│   players: [...]     │
│   matchState: {}     │
│   isLive: false      │
│ }                    │
│                      │
│ roomCode: "ABC12"    │
│ playerSide: "A"      │
│ isHost: true         │
│ matchState: {}       │
│ isLive: false        │
└──────────────────────┘
       │
       ├─→ Pass to OnlineEntry
       ├─→ Pass to MultiplayerLobby  
       ├─→ Pass to MatchCenter
       └─→ Use in event handlers
```

## Deployment Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    PRODUCTION                           │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  GitHub Repository                                     │
│  ├── Frontend code (React)                            │
│  └── Backend code (Node.js)                           │
│       │                                                │
│       ├─→ [Automatic push]                            │
│       │                                                │
│       ├─────────┬─────────────────────┐               │
│       │         │                     │               │
│       ▼         ▼                     ▼               │
│  ┌────────┐  ┌────────────┐  ┌──────────────┐       │
│  │ Vercel │  │ Render.com │  │ GitHub       │       │
│  │        │  │            │  │ (Source)     │       │
│  │Frontend│  │ Backend    │  └──────────────┘       │
│  │        │  │ Server     │                         │
│  └────┬───┘  └─────┬──────┘                         │
│       │             │                                │
│       │      ┌──────▼────────┐                       │
│       │      │ Node.js       │                       │
│       │      │ Express       │                       │
│       │      │ Socket.IO     │                       │
│       │      │ (Running)     │                       │
│       │      └───────┬───────┘                       │
│       │              │                               │
│       └──────┬───────┘                               │
│              │                                       │
│         [WebSocket]                                  │
│              │                                       │
│              ▼                                       │
│  ┌──────────────────────┐                           │
│  │ Player 1 Browser     │  ◄──→  WebSocket  ◄──→   │
│  │ Frontend (React)     │        Bridge            │
│  └──────────────────────┘                           │
│              │                                      │
│              └────────┬────────┘                    │
│                       │                            │
│              ┌────────▼────────┐                   │
│              │ Player 2 Browser│                   │
│              │ Frontend (React)│                   │
│              └─────────────────┘                   │
│                                                    │
└────────────────────────────────────────────────────┘
```

## Data Synchronization Timeline

```
Time    Player 1 (Host)          Server              Player 2 (Guest)
────    ───────────────          ──────              ────────────────

T0      Bowl ball
        Calculate outcome
        Update local state
        
T1                              Receive event
                               Broadcast to P2
        
T2                                                  Receive state
                                                   Update UI
                                                   Display result
                                                   
T3      Sync check (0ms latency for same machine,
        ~20-100ms for network)
        
T4      Next ball                                   Display same
                                                   state as P1
```

---

This visual guide shows how the entire multiplayer system works together!

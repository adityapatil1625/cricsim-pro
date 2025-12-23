// server/index.js
require("dotenv").config();
const express = require("express");
const axios = require("axios");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const Redis = require("ioredis");

const app = express();
const PORT = process.env.PORT || 4000;
const API_KEY = process.env.CRICKETDATA_API_KEY;

// --- Redis Client Setup ---
if (!process.env.REDIS_URL) {
    console.error("🔴 REDIS_URL is not set. Please set it in your environment variables.");
}
const redis = new Redis(process.env.REDIS_URL, {
    // Add TLS for secure connection, required by Vercel KV and other cloud providers
    tls: {
        rejectUnauthorized: false
    }
});

redis.on('connect', () => console.log("✅ Connected to Redis"));
redis.on('error', (err) => console.error("🔴 Redis Connection Error", err));

// 🔹 CORS for REST + Socket.io (must match frontend origin)
const allowedOrigins = [
    "http://localhost:5173",
    process.env.FRONTEND_URL // Add your Vercel URL here
].filter(Boolean);

app.use(
    cors({
        origin: allowedOrigins,
        credentials: true,
    })
);

app.use(express.json());

if (!API_KEY) {
    console.warn("⚠️  CRICKETDATA_API_KEY is not set in server/.env");
}

// ---------- CricketData API helper functions ----------

function mapRoleFromCricketData(roleRaw = "") {
    const r = roleRaw.toLowerCase();
    if (r.includes("bowler")) return "Bowl";
    if (r.includes("batsman") || r.includes("bat")) return "Bat";
    if (r.includes("allrounder")) return "All";
    return "All";
}

function mapToSimPlayer(player) {
    return {
        id: player.id,
        name: player.name,
        role: mapRoleFromCricketData(player.role || player.playerType || ""),
        avg: 30.0,
        sr: 130.0,
        bowlAvg: 28.0,
        bowlEcon: 8.0,
        img: player.playerImg || player.image || "",
    };
}

// 🔹 Players search route (CricketData API)
app.get("/api/players/search", async (req, res) => {
    try {
        const query = (req.query.query || "").trim();

        if (!API_KEY) {
            return res.status(200).json({
                players: [],
                error: "CRICKETDATA_API_KEY not configured on server",
            });
        }

        if (!query) {
            return res.status(400).json({ error: "query param is required" });
        }

        const searchUrl = `https://api.cricapi.com/v1/players?apikey=${API_KEY}&offset=0&search=${encodeURIComponent(
            query
        )}`;

        const searchResp = await axios.get(searchUrl);
        const searchData = searchResp.data;

        console.log(
            "CricketData search status:",
            searchData.status,
            searchData.reason
        );

        if (!searchData || searchData.status !== "success") {
            return res.status(200).json({
                players: [],
                error: "Live cricket API unavailable",
                reason: searchData?.reason || "Unknown",
                info: searchData?.info || null,
            });
        }

        const list = Array.isArray(searchData.data) ? searchData.data : [];
        const topPlayers = list.slice(0, 20);
        const mapped = topPlayers.map(mapToSimPlayer);

        return res.json({ players: mapped });
    } catch (err) {
        console.error("Error in /api/players/search:", err.message);
        if (err.response) {
            console.error("CricketData response data:", err.response.data);
        }
        return res.status(200).json({
            players: [],
            error: "Server error contacting CricketData",
            details: err.message,
        });
    }
});

// Basic health check
app.get("/", (req, res) => {
    res.send("CricSim Pro backend is running ✅");
});

// ---------- Socket.io setup for multiplayer ----------

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: allowedOrigins,
        methods: ["GET", "POST"],
        credentials: true,
    },
});

// Helper function to get a room from Redis
const getRoom = async (code) => {
    if (!code) return null;
    const roomData = await redis.get(`room:${code.toUpperCase()}`);
    return roomData ? JSON.parse(roomData) : null;
};

// Helper function to save a room to Redis
const saveRoom = async (code, room) => {
    if (!code || !room) return;
    // Set an expiration for the room data to auto-clean up (e.g., 6 hours)
    await redis.set(`room:${code.toUpperCase()}`, JSON.stringify(room), "EX", 60 * 60 * 6);
};


// Generate random 5-character room code
async function generateRoomCode() {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code;
    let attempts = 0;
    do {
        code = "";
        for (let i = 0; i < 5; i++) {
            code += chars[Math.floor(Math.random() * chars.length)];
        }
        attempts++;
        if (attempts > 100) throw new Error("Failed to generate a unique room code.");
    } while (await redis.exists(`room:${code}`)); // Check for existence in Redis
    return code;
}

io.on("connection", (socket) => {
    console.log("🔌 Socket connected:", socket.id);

    // CREATE ROOM (host)
    socket.on("createRoom", async ({ name, mode }) => {
      try {
        const gameMode = mode === "tournament" ? "tournament" : mode === "auction" ? "auction" : "quick";

        const code = await generateRoomCode();

        const room = {
            code,
            mode: gameMode,
            hostSocketId: socket.id,
            players: [
                {
                    socketId: socket.id,
                    name: name || "Host",
                    side: "A",
                },
            ],
            matchState: null,
        };
        
        await saveRoom(code, room);
        await redis.set(`socket:${socket.id}`, code); // Map socket to room code

        socket.join(code);

        console.log(`🏟️ Room created: ${code} (${gameMode}) by ${socket.id}`);
        io.to(code).emit("roomUpdate", room);
      } catch (error) {
        console.error("Error creating room:", error);
        socket.emit("roomCreationError", { message: "Failed to create room on the server." });
      }
    });

    // JOIN ROOM (guest)
    socket.on("joinRoom", async ({ code, name }) => {
      try {
        const room = await getRoom(code);

        if (!room) {
            socket.emit("roomJoinError", { message: "Room not found" });
            return;
        }

        const maxPlayers = room.mode === "tournament" ? 10 : 2;
        if (room.players.length >= maxPlayers) {
            socket.emit("roomJoinError", { message: "Room is full" });
            return;
        }

        const sides = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"];
        const takenSides = room.players.map(p => p.side);
        const side = sides.find(s => !takenSides.includes(s));

        if (!side) {
            socket.emit("roomJoinError", { message: "Could not assign a team side." });
            return;
        }

        room.players.push({
            socketId: socket.id,
            name: name || "Guest",
            side,
        });

        await saveRoom(room.code, room);
        await redis.set(`socket:${socket.id}`, room.code); // Map socket to room

        socket.join(room.code);

        console.log(`👥 Socket ${socket.id} joined room ${room.code} as side ${side}`);
        io.to(room.code).emit("roomUpdate", room);
      } catch (error) {
        console.error(`Error in joinRoom for code ${code}:`, error);
        socket.emit("roomJoinError", { message: "An error occurred while trying to join the room." });
      }
    });

    // Player selects IPL team
    socket.on("selectIPLTeam", async ({ code, teamId }) => {
        const room = await getRoom(code);
        if (!room) return;

        // Check if team is already taken
        const takenTeams = room.players.map(p => p.iplTeam).filter(Boolean);
        if (takenTeams.includes(teamId)) {
            socket.emit("teamSelectionError", { message: "Team already taken" });
            return;
        }

        // Update player's team
        const player = room.players.find(p => p.socketId === socket.id);
        if (player) {
            player.iplTeam = teamId;
            await saveRoom(room.code, room);
            console.log(`🏏 Player ${player.name} selected team ${teamId} in room ${room.code}`);
            io.to(room.code).emit("roomUpdate", room);
        }
    });

    // Helper for simple "broadcast to room" actions
    const createRoomAction = (eventName) => async ({ code }) => {
        const room = await getRoom(code);
        if (!room) return;
        console.log(`➡️ ${eventName} for room ${code}`);
        // Use `io.to()` which also emits to the sender
        io.to(code).emit(eventName);
    };

    // Host navigates everyone to different setup pages
    socket.on("navigateToQuickSetup", createRoomAction("navigateToQuickSetup"));
    socket.on("navigateToTournamentSetup", createRoomAction("navigateToTournamentSetup"));
    socket.on("navigateToAuctionLobby", createRoomAction("navigateToAuctionLobby"));
    socket.on("navigateToTournamentHub", createRoomAction("navigateToTournamentHub"));
    
    
    // Host starts auction for everyone
    socket.on("startAuction", async ({ code }) => {
        const room = await getRoom(code);
        if (!room) return;

        console.log(`🔨 startAuction for room ${code}`);
        
        // Initialize auction state
        room.auctionState = {
            phase: "waiting",
            currentPlayerIndex: 0,
            currentBid: 0,
            currentBidder: null,
            timer: 10,
            bidHistory: [],
            soldPlayers: [],
            unsoldPlayers: []
        };
        await saveRoom(code, room);
        
        io.to(code).emit("startAuction");
    });
    
    // Start next player in auction
    socket.on("auctionNextPlayer", async ({ code, player, basePrice }) => {
        const room = await getRoom(code);
        if (!room || !room.auctionState) return;
        
        room.auctionState.phase = "bidding";
        room.auctionState.currentPlayer = player;
        room.auctionState.currentBid = basePrice;
        room.auctionState.currentBidder = null;
        room.auctionState.timer = 10;
        room.auctionState.bidHistory = [];
        room.auctionState.passedTeams = [];
        
        await saveRoom(code, room);
        console.log(`🎯 Auction next player: ${player.name} at ₹${basePrice}L`);
        io.to(code).emit("auctionStateUpdate", room.auctionState);
        
        // Start timer
        startAuctionTimer(code);
    });
    
    // Place bid
    socket.on("auctionPlaceBid", async ({ code, teamId, teamName, amount }) => {
        const room = await getRoom(code);
        if (!room || !room.auctionState || room.auctionState.phase !== "bidding") return;
        
        room.auctionState.currentBid = amount;
        room.auctionState.currentBidder = { id: teamId, name: teamName };
        room.auctionState.timer = 10; // Reset timer
        room.auctionState.bidHistory.push({ team: teamName, amount, timestamp: Date.now() });
        room.auctionState.passedTeams = []; // Reset passed teams when someone bids
        
        await saveRoom(code, room);
        console.log(`💰 ${teamName} bids ₹${amount}L`);
        io.to(code).emit("auctionStateUpdate", room.auctionState);
        
        // Restart timer
        if (room.auctionTimer) clearInterval(room.auctionTimer);
        startAuctionTimer(code);
    });
    
    // Team passes on player
    socket.on("auctionPass", async ({ code, teamId, teamName }) => {
        const room = await getRoom(code);
        if (!room || !room.auctionState || room.auctionState.phase !== "bidding") {
            return;
        }
        
        if (!room.auctionState.passedTeams) {
            room.auctionState.passedTeams = [];
        }
        
        if (!room.auctionState.passedTeams.includes(teamId)) {
            room.auctionState.passedTeams.push(teamId);
            await saveRoom(code, room);
            console.log(`🚫 ${teamName} passed on ${room.auctionState.currentPlayer?.name}`);
            
            io.to(code).emit("auctionPlayerPassed", { teamName });
            
            const totalTeams = room.players.filter(p => p.iplTeam).length;
            if (room.auctionState.passedTeams.length >= totalTeams) {
                if (room.auctionTimer) clearInterval(room.auctionTimer);
                io.to(code).emit("auctionAllPassed");
            }
        }
    });
    
    // Mark player as sold
    socket.on("auctionPlayerSold", async ({ code, player, team, price }) => {
        const room = await getRoom(code);
        if (!room || !room.auctionState) return;
        
        room.auctionState.phase = "sold";
        room.auctionState.soldPlayers.push({ player, team, price });
        
        await saveRoom(code, room);
        console.log(`✅ ${player.name} SOLD to ${team.name} for ₹${price}L`);
        io.to(code).emit("auctionStateUpdate", room.auctionState);
        io.to(code).emit("auctionPlayerSoldBroadcast", { player, team, price });
        
        if (room.auctionTimer) clearInterval(room.auctionTimer);
    });
    
    // Mark player as unsold
    socket.on("auctionPlayerUnsold", async ({ code, player }) => {
        const room = await getRoom(code);
        if (!room || !room.auctionState) return;
        
        room.auctionState.phase = "sold";
        room.auctionState.unsoldPlayers.push(player);
        
        await saveRoom(code, room);
        console.log(`❌ ${player.name} UNSOLD`);
        io.to(code).emit("auctionStateUpdate", room.auctionState);
        io.to(code).emit("auctionPlayerUnsoldBroadcast", { player });
        
        if (room.auctionTimer) clearInterval(room.auctionTimer);
    });
    
    // ⚠️ WARNING: This timer is not suitable for a serverless environment.
    // A serverless function may be terminated between setInterval ticks. For a robust
    // solution, a stateful timing service or a different architecture is needed.
    // This is left as-is to preserve original functionality on non-serverless deployments.
    async function startAuctionTimer(roomCode) {
        const room = await getRoom(roomCode);
        if (!room || !room.auctionState) return;
        
        if (room.auctionTimer) {
            clearInterval(room.auctionTimer);
        }
        
        room.auctionTimer = setInterval(async () => {
            // Re-fetch room on each tick to ensure we have the latest state
            const currentRoom = await getRoom(roomCode);
            if (!currentRoom || !currentRoom.auctionState || currentRoom.auctionState.phase !== "bidding") {
                clearInterval(room.auctionTimer);
                room.auctionTimer = null;
                return;
            }
            
            currentRoom.auctionState.timer--;
            await saveRoom(roomCode, currentRoom);
            
            if (currentRoom.auctionState.timer <= 0) {
                clearInterval(room.auctionTimer);
                room.auctionTimer = null;
                currentRoom.auctionState.timer = 0;
                await saveRoom(roomCode, currentRoom);
                io.to(roomCode).emit("auctionTimerExpired");
            } else {
                io.to(roomCode).emit("auctionTimerUpdate", currentRoom.auctionState.timer);
            }
        }, 1000);
    }
    
    
    // Broadcast tournament results (fixtures and teams) to all players
    socket.on("tournamentResultsUpdate", async ({ code, fixtures, tournTeams, phase }) => {
        const room = await getRoom(code);
        if (!room) {
            console.log(`❌ Room ${code} not found for tournament results`);
            return;
        }

        console.log(`📊 Broadcasting tournament results for room ${code} to ${room.players.length} players`);
        io.in(code).emit("tournamentResultsUpdate", { fixtures, tournTeams, phase });
    });

    // Generate round-robin fixtures for tournament
    socket.on("generateTournamentFixtures", async ({ code }) => {
        const room = await getRoom(code);
        if (!room || room.mode !== "tournament") return;

        const players = room.players;
        if (players.length < 2) return;

        const fixtures = [];
        let fixtureId = 1;
        for (let i = 0; i < players.length; i++) {
            for (let j = i + 1; j < players.length; j++) {
                fixtures.push({
                    id: fixtureId++,
                    t1: players[i].side,
                    t2: players[j].side,
                    player1: players[i].name,
                    player2: players[j].name,
                    winner: null,
                    played: false
                });
            }
        }

        room.fixtures = fixtures;
        await saveRoom(code, room);

        console.log(`🏆 Generated ${fixtures.length} fixtures for room ${code}`);
        io.to(code).emit("tournamentFixturesGenerated", { fixtures });
    });


    // Start an online match (host triggers)
    socket.on("startOnlineMatch", async ({ code }) => {
        const room = await getRoom(code);
        if (!room) return;

        console.log(`🏏 startOnlineMatch in room ${code}`);
        io.to(code).emit("startOnlineMatch");
    });

    // Sync match state (host sends, everyone receives)
    socket.on("matchStateUpdate", async ({ code, matchState }) => {
        const room = await getRoom(code);
        if (!room) return;

        room.matchState = matchState;
        await saveRoom(code, room);

        io.to(code).emit("matchStateUpdate", { matchState });
    });

    // End match
    socket.on("endOnlineMatch", async ({ code }) => {
        const room = await getRoom(code);
        if (!room) return;

        console.log(`🏁 endOnlineMatch in room ${code}`);
        room.matchState = null; // Clear the match state
        await saveRoom(code, room);
        io.to(code).emit("endOnlineMatch");
    });

    // Sync team selections between players
    socket.on("teamUpdate", async ({ code, teamA, teamB }) => {
        const room = await getRoom(code);
        if (!room) return;

        room.teamA = teamA;
        room.teamB = teamB;
        await saveRoom(code, room);

        socket.to(code).emit("teamUpdate", { teamA, teamB });
    });

    // Sync tournament team selections between all players
    socket.on("tournamentTeamUpdate", async ({ code, teams }) => {
        const room = await getRoom(code);
        if (!room || room.mode !== "tournament") return;

        console.log(`📤 Tournament team update from ${socket.id} in room ${code}`);
        room.teams = teams;
        await saveRoom(code, room);

        socket.to(code).emit("tournamentTeamUpdate", { teams });
    });

    // Handle disconnect and clean up rooms
    socket.on("disconnect", async () => {
        console.log("❌ Socket disconnected:", socket.id);
        try {
            const code = await redis.get(`socket:${socket.id}`);
            if (code) {
                const room = await getRoom(code);
                if (room) {
                    room.players = room.players.filter(p => p.socketId !== socket.id);

                    if (room.players.length === 0) {
                        await redis.del(`room:${code}`);
                        console.log(`🧹 Deleted empty room ${code}`);
                    } else {
                        if (room.hostSocketId === socket.id) {
                            room.hostSocketId = room.players[0].socketId;
                            console.log(`👑 New host for room ${code}: ${room.hostSocketId}`);
                        }
                        await saveRoom(code, room);
                        io.to(code).emit("roomUpdate", room);
                    }
                }
                await redis.del(`socket:${socket.id}`);
            }
        } catch (error) {
            console.error(`Error during disconnect for socket ${socket.id}:`, error);
        }
    });
});
});

server.listen(PORT, () => {
    console.log(`🚀 Server listening on http://localhost:${PORT}`);
});

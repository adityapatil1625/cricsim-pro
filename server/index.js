// server/index.js
require("dotenv").config();
const express = require("express");
const axios = require("axios");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const PORT = process.env.PORT || 4000;
const API_KEY = process.env.CRICKETDATA_API_KEY;

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

// code -> { code, mode, players: [{socketId, name, side}], matchState? }
const rooms = new Map();

// Generate random 5-character room code
function generateRoomCode() {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";
    for (let i = 0; i < 5; i++) {
        code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
}

io.on("connection", (socket) => {
    console.log("🔌 Socket connected:", socket.id);

    // CREATE ROOM (host)
    socket.on("createRoom", ({ name, mode }) => {
        const gameMode = mode === "tournament" ? "tournament" : mode === "auction" ? "auction" : "quick";

        let code;
        do {
            code = generateRoomCode();
        } while (rooms.has(code));

        const room = {
            code,
            mode: gameMode,
            hostSocketId: socket.id, // ✅ Track host
            players: [
                {
                    socketId: socket.id,
                    name: name || "Host",
                    side: "A", // host = Team A
                },
            ],
            matchState: null,
        };

        rooms.set(code, room);
        socket.join(code);

        console.log(`🏟️ Room created: ${code} (${gameMode}) by ${socket.id}`);
        console.log(`🔍 Room object:`, JSON.stringify(room, null, 2));

        io.to(code).emit("roomUpdate", room);
    });

    // JOIN ROOM (guest)
    socket.on("joinRoom", ({ code, name }) => {
        const upper = (code || "").toUpperCase();
        const room = rooms.get(upper);

        if (!room) {
            socket.emit("roomJoinError", { message: "Room not found" });
            return;
        }

        const maxPlayers = room.mode === "tournament" ? 10 : 2;
        if (room.players.length >= maxPlayers) {
            socket.emit("roomJoinError", { message: "Room is full" });
            return;
        }

        // Assign team letter: A, B, C, D, E, F, G, H, I, J
        const sides = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"];
        const takenSides = room.players.map(p => p.side);
        const side = sides.find(s => !takenSides.includes(s));

        room.players.push({
            socketId: socket.id,
            name: name || "Guest",
            side,
        });

        rooms.set(upper, room);
        socket.join(upper);

        console.log(`👥 Socket ${socket.id} joined room ${upper} as side ${side}`);
        console.log(`🔍 Updated room object:`, JSON.stringify(room, null, 2));

        io.to(upper).emit("roomUpdate", room);
    });

    // Player selects IPL team
    socket.on("selectIPLTeam", ({ code, teamId }) => {
        const upper = (code || "").toUpperCase();
        const room = rooms.get(upper);
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
            rooms.set(upper, room);
            console.log(`🏏 Player ${player.name} selected team ${teamId} in room ${upper}`);
            io.to(upper).emit("roomUpdate", room);
        }
    });

    // Host navigates everyone to Quick Setup
    socket.on("navigateToQuickSetup", ({ code }) => {
        const upper = (code || "").toUpperCase();
        const room = rooms.get(upper);
        if (!room) return;

        console.log(`➡️ navigateToQuickSetup for room ${upper}`);
        io.to(upper).emit("navigateToQuickSetup");
    });

    // Host navigates everyone to Tournament Setup
    socket.on("navigateToTournamentSetup", ({ code }) => {
        const upper = (code || "").toUpperCase();
        const room = rooms.get(upper);
        if (!room) return;

        console.log(`➡️ navigateToTournamentSetup for room ${upper}`);
        io.to(upper).emit("navigateToTournamentSetup");
    });
    
    // Host navigates everyone to Auction Lobby
    socket.on("navigateToAuctionLobby", ({ code }) => {
        const upper = (code || "").toUpperCase();
        const room = rooms.get(upper);
        if (!room) return;

        console.log(`➡️ navigateToAuctionLobby for room ${upper}`);
        io.to(upper).emit("navigateToAuctionLobby");
    });
    
    // Host starts auction for everyone
    socket.on("startAuction", ({ code }) => {
        const upper = (code || "").toUpperCase();
        const room = rooms.get(upper);
        if (!room) return;

        console.log(`🔨 startAuction for room ${upper}`);
        
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
        
        io.to(upper).emit("startAuction");
    });
    
    // Start next player in auction
    socket.on("auctionNextPlayer", ({ code, player, basePrice }) => {
        const upper = (code || "").toUpperCase();
        const room = rooms.get(upper);
        if (!room || !room.auctionState) return;
        
        room.auctionState.phase = "bidding";
        room.auctionState.currentPlayer = player;
        room.auctionState.currentBid = basePrice;
        room.auctionState.currentBidder = null;
        room.auctionState.timer = 10;
        room.auctionState.bidHistory = [];
        room.auctionState.passedTeams = [];
        
        console.log(`🎯 Auction next player: ${player.name} at ₹${basePrice}L`);
        io.to(upper).emit("auctionStateUpdate", room.auctionState);
        
        // Start timer
        startAuctionTimer(upper);
    });
    
    // Place bid
    socket.on("auctionPlaceBid", ({ code, teamId, teamName, amount }) => {
        const upper = (code || "").toUpperCase();
        const room = rooms.get(upper);
        if (!room || !room.auctionState || room.auctionState.phase !== "bidding") return;
        
        room.auctionState.currentBid = amount;
        room.auctionState.currentBidder = { id: teamId, name: teamName };
        room.auctionState.timer = 10; // Reset timer
        room.auctionState.bidHistory.push({ team: teamName, amount, timestamp: Date.now() });
        room.auctionState.passedTeams = []; // Reset passed teams when someone bids
        
        console.log(`💰 ${teamName} bids ₹${amount}L`);
        io.to(upper).emit("auctionStateUpdate", room.auctionState);
        
        // Restart timer
        if (room.auctionTimer) clearInterval(room.auctionTimer);
        startAuctionTimer(upper);
    });
    
    // Team passes on player
    socket.on("auctionPass", ({ code, teamId, teamName }) => {
        const upper = (code || "").toUpperCase();
        const room = rooms.get(upper);
        console.log(`🚫 Pass received: code=${code}, teamId=${teamId}, teamName=${teamName}`);
        console.log(`🚫 Room exists:`, !!room, "auctionState exists:", !!room?.auctionState, "phase:", room?.auctionState?.phase);
        
        if (!room || !room.auctionState || room.auctionState.phase !== "bidding") {
            console.log(`❌ Pass rejected - room:${!!room}, state:${!!room?.auctionState}, phase:${room?.auctionState?.phase}`);
            return;
        }
        
        // Initialize passedTeams if not exists
        if (!room.auctionState.passedTeams) {
            room.auctionState.passedTeams = [];
        }
        
        // Add team to passed list if not already there
        if (!room.auctionState.passedTeams.includes(teamId)) {
            room.auctionState.passedTeams.push(teamId);
            console.log(`🚫 ${teamName} passed on ${room.auctionState.currentPlayer?.name}`);
            
            // Broadcast pass event
            io.to(upper).emit("auctionPlayerPassed", { teamName });
            
            // Check if all teams have passed
            const totalTeams = room.players.filter(p => p.iplTeam).length;
            if (room.auctionState.passedTeams.length >= totalTeams) {
                console.log(`❌ All teams passed - marking as UNSOLD`);
                // Clear timer and mark as unsold
                if (room.auctionTimer) clearInterval(room.auctionTimer);
                io.to(upper).emit("auctionAllPassed");
            }
        } else {
            console.log(`⚠️ ${teamName} already passed`);
        }
    });
    
    // Mark player as sold
    socket.on("auctionPlayerSold", ({ code, player, team, price }) => {
        const upper = (code || "").toUpperCase();
        const room = rooms.get(upper);
        if (!room || !room.auctionState) return;
        
        room.auctionState.phase = "sold";
        room.auctionState.soldPlayers.push({ player, team, price });
        
        console.log(`✅ ${player.name} SOLD to ${team.name} for ₹${price}L`);
        io.to(upper).emit("auctionStateUpdate", room.auctionState);
        io.to(upper).emit("auctionPlayerSoldBroadcast", { player, team, price });
        
        if (room.auctionTimer) clearInterval(room.auctionTimer);
    });
    
    // Mark player as unsold
    socket.on("auctionPlayerUnsold", ({ code, player }) => {
        const upper = (code || "").toUpperCase();
        const room = rooms.get(upper);
        if (!room || !room.auctionState) return;
        
        room.auctionState.phase = "sold";
        room.auctionState.unsoldPlayers.push(player);
        
        console.log(`❌ ${player.name} UNSOLD`);
        io.to(upper).emit("auctionStateUpdate", room.auctionState);
        io.to(upper).emit("auctionPlayerUnsoldBroadcast", { player });
        
        if (room.auctionTimer) clearInterval(room.auctionTimer);
    });
    
    // Helper function for auction timer
    function startAuctionTimer(roomCode) {
        const room = rooms.get(roomCode);
        if (!room || !room.auctionState) return;
        
        // Clear any existing timer
        if (room.auctionTimer) {
            clearInterval(room.auctionTimer);
        }
        
        room.auctionTimer = setInterval(() => {
            if (!room.auctionState || room.auctionState.phase !== "bidding") {
                clearInterval(room.auctionTimer);
                room.auctionTimer = null;
                return;
            }
            
            room.auctionState.timer--;
            
            if (room.auctionState.timer <= 0) {
                clearInterval(room.auctionTimer);
                room.auctionTimer = null;
                room.auctionState.timer = 0; // Set to 0, not negative
                // Timer expired - emit event to handle sold/unsold
                io.to(roomCode).emit("auctionTimerExpired");
            } else {
                // Broadcast timer update
                io.to(roomCode).emit("auctionTimerUpdate", room.auctionState.timer);
            }
        }, 1000);
    }
    
    // Navigate all players back to tournament hub
    socket.on("navigateToTournamentHub", ({ code }) => {
        const upper = (code || "").toUpperCase();
        const room = rooms.get(upper);
        if (!room) return;

        console.log(`➡️ navigateToTournamentHub for room ${upper}`);
        io.in(upper).emit("navigateToTournamentHub"); // Use 'in' to include sender
    });
    
    // Broadcast tournament results (fixtures and teams) to all players
    socket.on("tournamentResultsUpdate", ({ code, fixtures, tournTeams, phase }) => {
        const upper = (code || "").toUpperCase();
        const room = rooms.get(upper);
        if (!room) {
            console.log(`❌ Room ${upper} not found for tournament results`);
            return;
        }

        console.log(`📊 Broadcasting tournament results for room ${upper} to ${room.players.length} players`);
        io.in(upper).emit("tournamentResultsUpdate", { fixtures, tournTeams, phase });
    });

    // Generate round-robin fixtures for tournament
    socket.on("generateTournamentFixtures", ({ code }) => {
        const upper = (code || "").toUpperCase();
        const room = rooms.get(upper);
        if (!room || room.mode !== "tournament") return;

        const players = room.players;
        if (players.length < 2) return;

        // Generate round-robin fixtures
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
        rooms.set(upper, room);

        console.log(`🏆 Generated ${fixtures.length} fixtures for room ${upper}`);
        io.to(upper).emit("tournamentFixturesGenerated", { fixtures });
    });


    // Start an online match (host triggers)
    socket.on("startOnlineMatch", ({ code }) => {
        const upper = (code || "").toUpperCase();
        const room = rooms.get(upper);
        if (!room) return;

        console.log(`🏏 startOnlineMatch in room ${upper}`);
        // We don't force the matchState here; that comes via matchStateUpdate
        io.to(upper).emit("startOnlineMatch");
    });

    // Sync match state (host sends, everyone receives)
    socket.on("matchStateUpdate", ({ code, matchState }) => {
        const upper = (code || "").toUpperCase();
        const room = rooms.get(upper);
        if (!room) return;

        room.matchState = matchState;
        rooms.set(upper, room);

        // Broadcast to everyone (including host so guests stay in sync)
        io.to(upper).emit("matchStateUpdate", { matchState });
    });

    // End match
    socket.on("endOnlineMatch", ({ code }) => {
        const upper = (code || "").toUpperCase();
        const room = rooms.get(upper);
        if (!room) return;

        console.log(`🏁 endOnlineMatch in room ${upper}`);
        io.to(upper).emit("endOnlineMatch");
        room.matchState = null;
        rooms.set(upper, room);
    });

    // ✅ Sync team selections between players
    socket.on("teamUpdate", ({ code, teamA, teamB }) => {
        const upper = (code || "").toUpperCase();
        const room = rooms.get(upper);
        if (!room) return;

        room.teamA = teamA;
        room.teamB = teamB;
        rooms.set(upper, room);

        // Broadcast to other player
        socket.to(upper).emit("teamUpdate", { teamA, teamB });
    });

    // ✅ Sync tournament team selections between all players
    socket.on("tournamentTeamUpdate", ({ code, teams }) => {
        const upper = (code || "").toUpperCase();
        const room = rooms.get(upper);
        if (!room || room.mode !== "tournament") return;

        console.log(`📤 Tournament team update from ${socket.id} in room ${upper}`);
        console.log(`📤 Broadcasting to ${room.players.length - 1} other players`);

        room.teams = teams;
        rooms.set(upper, room);

        // Broadcast to all other players
        socket.to(upper).emit("tournamentTeamUpdate", { teams });
    });

    // Handle disconnect and clean up rooms
    socket.on("disconnect", () => {
        console.log("❌ Socket disconnected:", socket.id);

        for (const [code, room] of rooms.entries()) {
            const idx = room.players.findIndex((p) => p.socketId === socket.id);
            if (idx !== -1) {
                room.players.splice(idx, 1);

                if (room.players.length === 0) {
                    console.log(`🧹 Deleting empty room ${code}`);
                    rooms.delete(code);
                } else {
                    rooms.set(code, room);
                    io.to(code).emit("roomUpdate", room);
                }
                break; // socket can belong to only one room in this design
            }
        }
    });
});

server.listen(PORT, () => {
    console.log(`🚀 Server listening on http://localhost:${PORT}`);
});

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
console.log("Attempting to set up Redis client...");
if (!process.env.REDIS_URL) {
    console.error("🔴 FATAL: REDIS_URL is not set. Please set it in your environment variables.");
} else {
    console.log("✅ REDIS_URL found.");
}

const redis = new Redis(process.env.REDIS_URL, {
    tls: {
        rejectUnauthorized: false
    },
    connectTimeout: 10000, 
});

redis.on('connect', () => console.log("✅ Successfully connected to Redis."));
redis.on('error', (err) => console.error("🔴 Redis Connection Error:", JSON.stringify(err, null, 2)));


// 🔹 CORS for REST + Socket.io (must match frontend origin)
const allowedOrigins = [
    "http://localhost:5173",
    process.env.FRONTEND_URL
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

app.get("/api/players/search", async (req, res) => {
    try {
        const query = (req.query.query || "").trim();
        if (!API_KEY) { return res.status(200).json({ players: [], error: "CRICKETDATA_API_KEY not configured on server", }); }
        if (!query) { return res.status(400).json({ error: "query param is required" }); }
        const searchUrl = `https://api.cricapi.com/v1/players?apikey=${API_KEY}&offset=0&search=${encodeURIComponent(query)}`;
        const searchResp = await axios.get(searchUrl);
        const searchData = searchResp.data;
        if (!searchData || searchData.status !== "success") { return res.status(200).json({ players: [], error: "Live cricket API unavailable", reason: searchData?.reason || "Unknown", info: searchData?.info || null, }); }
        const list = Array.isArray(searchData.data) ? searchData.data : [];
        const topPlayers = list.slice(0, 20);
        const mapped = topPlayers.map(mapToSimPlayer);
        return res.json({ players: mapped });
    } catch (err) {
        console.error("Error in /api/players/search:", err.message);
        if (err.response) { console.error("CricketData response data:", err.response.data); }
        return res.status(200).json({ players: [], error: "Server error contacting CricketData", details: err.message, });
    }
});

app.get("/", (req, res) => {
    res.send("CricSim Pro backend is running ✅");
});

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: allowedOrigins,
        methods: ["GET", "POST"],
        credentials: true,
    },
});

const getRoom = async (code) => {
    if (!code) return null;
    console.log(`[DEBUG] Getting room from Redis with key: room:${code.toUpperCase()}`);
    const roomData = await redis.get(`room:${code.toUpperCase()}`);
    console.log(`[DEBUG] Raw data for room ${code}:`, roomData ? roomData.substring(0, 200) + '...' : 'null');
    return roomData ? JSON.parse(roomData) : null;
};

const saveRoom = async (code, room) => {
    if (!code || !room) return;
    const roomKey = `room:${code.toUpperCase()}`;
    await redis.set(roomKey, JSON.stringify(room), "EX", 60 * 60 * 6);
    console.log(`[DEBUG] Room ${code} saved to Redis.`);
};

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
    } while (await redis.exists(`room:${code}`));
    return code;
}

io.on("connection", (socket) => {
    console.log("🔌 Socket connected:", socket.id);

    socket.on("createRoom", async ({ mode, playerName }, callback) => {
        console.log(`[ACTION] createRoom triggered by ${socket.id}`);
        try {
            const gameMode = mode === "tournament" ? "tournament" : mode === "auction" ? "auction" : "1v1";
            const code = await generateRoomCode();
            console.log(`[DEBUG] Generated room code: ${code}`);

            const room = {
                code,
                mode: gameMode,
                hostSocketId: socket.id,
                players: [{ socketId: socket.id, name: playerName || "Host", side: "A" }],
                matchState: null,
            };
            
            await saveRoom(code, room);
            await redis.set(`socket:${socket.id}`, code);
            console.log(`[DEBUG] Mapped socket ${socket.id} to room ${code}`);

            socket.join(code);
            console.log(`[SUCCESS] Room created: ${code} and socket ${socket.id} joined.`);
            
            // Use callback for the creator for immediate feedback
            if (callback) {
                callback({ code, room, error: null });
            }
            
            // Broadcast update to the room (which is just the host at this point)
            io.to(code).emit("roomUpdate", room);
        } catch (error) {
            console.error("🔴 [ERROR] in createRoom:", error);
            if (callback) {
                callback({ error: "Failed to create room on the server." });
            }
        }
    });

    socket.on("joinRoom", async ({ code, playerName }, callback) => {
        const upperCode = (code || "").toUpperCase();
        console.log(`[ACTION] joinRoom triggered for code ${upperCode} by ${socket.id}`);
        try {
            const room = await getRoom(upperCode);

            if (!room) {
                console.log(`[FAIL] Room ${upperCode} not found in Redis.`);
                if (callback) callback({ error: "ROOM_NOT_FOUND" });
                return;
            }
            console.log(`[SUCCESS] Found room ${upperCode}. Host: ${room.hostSocketId}`);

            const maxPlayers = room.mode === "tournament" ? 10 : 2;
            if (room.players.length >= maxPlayers) {
                console.log(`[FAIL] Room ${upperCode} is full.`);
                if (callback) callback({ error: "ROOM_FULL" });
                return;
            }

            const sides = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"];
            const takenSides = room.players.map(p => p.side);
            const side = sides.find(s => !takenSides.includes(s));

            if (!side) {
                console.log(`[FAIL] Could not assign side for room ${upperCode}.`);
                if (callback) callback({ error: "CANNOT_ASSIGN_SIDE" });
                return;
            }

            room.players.push({ socketId: socket.id, name: playerName || "Guest", side });

            await saveRoom(room.code, room);
            await redis.set(`socket:${socket.id}`, room.code);
            console.log(`[DEBUG] Mapped socket ${socket.id} to room ${room.code}`);

            socket.join(room.code);

            // Use callback for the joiner for immediate feedback
            if (callback) {
                callback({ room, error: null });
            }
            
            console.log(`[SUCCESS] Socket ${socket.id} joined room ${room.code} as side ${side}`);
            // Broadcast update to everyone in the room
            io.to(room.code).emit("roomUpdate", room);
        } catch (error) {
            console.error(`🔴 [ERROR] in joinRoom for code ${upperCode}:`, error);
            if (callback) callback({ error: "JOIN_SERVER_ERROR" });
        }
    });

    socket.on("disconnect", async () => {
        console.log("❌ Socket disconnected:", socket.id);
        try {
            const code = await redis.get(`socket:${socket.id}`);
            if (code) {
                console.log(`[DEBUG] Socket ${socket.id} was in room ${code}. Cleaning up.`);
                const room = await getRoom(code);
                if (room) {
                    room.players = room.players.filter(p => p.socketId !== socket.id);

                    if (room.players.length === 0) {
                        await redis.del(`room:${code}`);
                        console.log(`[SUCCESS] Deleted empty room ${code}`);
                    } else {
                        if (room.hostSocketId === socket.id) {
                            room.hostSocketId = room.players[0].socketId;
                            console.log(`[DEBUG] New host for room ${code}: ${room.hostSocketId}`);
                        }
                        await saveRoom(code, room);
                        io.to(code).emit("roomUpdate", room);
                        console.log(`[SUCCESS] Updated room ${code} after player disconnect.`);
                    }
                }
                await redis.del(`socket:${socket.id}`);
            } else {
                console.log(`[DEBUG] Disconnected socket ${socket.id} was not in any tracked room.`);
            }
        } catch (error) {
            console.error(`🔴 [ERROR] during disconnect for socket ${socket.id}:`, error);
        }
    });

    // --- Passthrough Handlers ---
    const createRoomAction = (eventName) => async ({ code, ...rest }) => {
        const room = await getRoom(code);
        if (!room) return;
        
        // Update state if necessary
        if (eventName === 'matchStateUpdate' && rest.matchState) {
            room.matchState = rest.matchState;
            await saveRoom(code, room);
        }
        if (eventName === 'teamUpdate' && (rest.teamA || rest.teamB)) {
            if (rest.teamA) room.teamA = rest.teamA;
            if (rest.teamB) room.teamB = rest.teamB;
            await saveRoom(code, room);
        }
        if (eventName === 'tournamentTeamUpdate' && rest.teams) {
            room.teams = rest.teams;
            await saveRoom(code, room);
        }
        
        // Broadcast to others, or all for nav events
        const broadcastType = eventName.startsWith('navigateTo') ? 'io' : 'socket';
        const target = broadcastType === 'io' ? io : socket;
        target.to(code).emit(eventName, { code, ...rest });
    };

    const passthroughEvents = [
        "navigateToQuickSetup", "navigateToTournamentSetup", "navigateToAuctionLobby", 
        "navigateToTournamentHub", "startAuction", "auctionNextPlayer", 
        "auctionPlaceBid", "auctionPass", "auctionPlayerSold", "auctionPlayerUnsold",
        "tournamentResultsUpdate", "generateTournamentFixtures", "startOnlineMatch",
        "matchStateUpdate", "endOnlineMatch", "teamUpdate", "tournamentTeamUpdate", "selectIPLTeam"
    ];

    passthroughEvents.forEach(eventName => {
        socket.on(eventName, createRoomAction(eventName));
    });
});

// When deploying to Vercel, we need to export the server instance.
// Vercel's runtime will handle the 'listening' part.
// When running locally, we use server.listen() as usual.
if (process.env.VERCEL) {
  module.exports = server;
} else {
  server.listen(PORT, () => {
    console.log(`🚀 Server listening on http://localhost:${PORT}`);
  });
}
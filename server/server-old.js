// server/server.js - Refactored with modular controllers
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const axios = require("axios");

// Import controllers
const { initializeRoomHandlers } = require("./controllers/roomController");
const { initializeAuctionHandlers } = require("./controllers/auctionController");
const { initializeMatchHandlers } = require("./controllers/matchController");
const { initializeTournamentHandlers } = require("./controllers/tournamentController");
const { initializeChatHandlers } = require("./controllers/chatController");

// Import utilities
const { startCleanupInterval } = require("./utils/roomManager");

const app = express();
const PORT = process.env.PORT || 4000;
const API_KEY = process.env.CRICKETDATA_API_KEY;
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

// CORS configuration
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  FRONTEND_URL,
].filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

app.use(express.json());

// ============ REST API ENDPOINTS ============

// Health check
app.get("/", (req, res) => {
  res.json({ message: "CricSim Pro Server Running", timestamp: new Date() });
});

// Player search API (optional - requires API key)
app.get("/api/players/search", async (req, res) => {
  try {
    const query = (req.query.query || "").trim();
    if (!query) {
      return res.status(400).json({ error: "query param is required" });
    }
    if (!API_KEY) {
      return res.status(200).json({
        players: [],
        error: "CRICKETDATA_API_KEY not configured",
      });
    }

    const searchUrl = `https://api.cricapi.com/v1/players?apikey=${API_KEY}&offset=0&search=${encodeURIComponent(
      query
    )}`;
    const searchResp = await axios.get(searchUrl);
    const searchData = searchResp.data;

    if (!searchData || searchData.status !== "success") {
      return res.status(200).json({
        players: [],
        error: "Live cricket API unavailable",
      });
    }

    const list = Array.isArray(searchData.data) ? searchData.data : [];
    const topPlayers = list.slice(0, 20);
    const mapped = topPlayers.map((player) => ({
      id: player.id,
      name: player.name,
      role:
        (player.role || "").toLowerCase().includes("bowler") ||
        (player.role || "").toLowerCase().includes("allrounder")
          ? "Bowl"
          : "Bat",
      avg: 30.0,
      sr: 130.0,
      bowlAvg: 28.0,
      bowlEcon: 8.0,
      img: player.playerImg || player.image || "",
    }));

    return res.json({ players: mapped });
  } catch (err) {
    console.error("Error in /api/players/search:", err.message);
    return res.status(200).json({
      players: [],
      error: "Server error contacting CricketData",
    });
  }
});

// ============ SOCKET.IO SERVER ============

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// ============ SOCKET EVENT HANDLERS ============

io.on("connection", (socket) => {
  console.log("✅ Socket connected:", socket.id);

  // Initialize all modular handlers
  initializeRoomHandlers(socket, io);
  initializeAuctionHandlers(socket, io);
  initializeMatchHandlers(socket, io);
  initializeTournamentHandlers(socket, io);
  initializeChatHandlers(socket, io);
});

// ============ ROOM CLEANUP ============

const cleanupInterval = startCleanupInterval();

// ============ GRACEFUL SHUTDOWN ============

process.on('SIGTERM', () => {
  console.log('SIGTERM received, cleaning up...');
  clearInterval(cleanupInterval);
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, cleaning up...');
  clearInterval(cleanupInterval);
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

// ============ START SERVER ============

server.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║    CricSim Pro Server Running          ║
║    🎮 WebSocket Server Active          ║
║    📍 Port: ${PORT}                        ║
║    🌐 CORS Origins: ${allowedOrigins.length} configured   ║
║    🧹 Auto-cleanup: Active             ║
╚════════════════════════════════════════╝
  `);
});

module.exports = server;

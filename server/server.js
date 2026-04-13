// server/server.js - Refactored with modular controllers
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const http = require("http");
const { Server } = require("socket.io");
const axios = require("axios");

// Import utilities
const logger = require("./utils/logger");
const { createRateLimitMiddleware } = require("./utils/rateLimiter");

// Import controllers
const { initializeRoomHandlers } = require("./controllers/roomController");
const { initializeAuctionHandlers } = require("./controllers/auctionController");
const { initializeMatchHandlers } = require("./controllers/matchController");
const { initializeTournamentHandlers } = require("./controllers/tournamentController");
const { initializeChatHandlers } = require("./controllers/chatController");

// Import utilities
const { startCleanupInterval } = require("./utils/roomManager");

const app = express();
app.disable("x-powered-by");
const PORT = process.env.PORT || 4000;
const API_KEY = process.env.CRICKETDATA_API_KEY;
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

// CORS configuration
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  FRONTEND_URL,
].filter(Boolean);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Allow inline styles for now
  crossOriginEmbedderPolicy: false,
}));

// Compression middleware
app.use(compression());

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

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
    logger.error("Error in /api/players/search:", err.message);
    return res.status(200).json({
      players: [],
      error: "Server error contacting CricketData",
    });
  }
});

// ============ SOCKET.IO SERVER ============

const server = http.createServer(app);
const io = new Server(server, {
  maxHttpBufferSize: 1e6,
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Apply rate limiting middleware
io.use(createRateLimitMiddleware(io));

// ============ SOCKET EVENT HANDLERS ============

io.on("connection", (socket) => {
  logger.socket('connection', { socketId: socket.id });

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
  logger.warn('SIGTERM received, cleaning up...');
  clearInterval(cleanupInterval);
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.warn('SIGINT received, cleaning up...');
  clearInterval(cleanupInterval);
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

// ============ START SERVER ============

server.listen(PORT, () => {
  logger.startup({
    port: PORT,
    corsOrigins: allowedOrigins.length,
    logLevel: process.env.LOG_LEVEL || 'INFO',
  });
});

module.exports = server;

// server/server.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const axios = require("axios");

const app = express();
const PORT = process.env.PORT || 4000;
const API_KEY = process.env.CRICKETDATA_API_KEY;
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

// Store rooms in memory (in production, use Redis)
const rooms = new Map();
const userSockets = new Map(); // socketId -> { playerId, roomCode, side }

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

// Simple health check
app.get("/", (req, res) => {
  res.json({ message: "CricSim Pro Server Running", timestamp: new Date() });
});

// REST API for players search (kept from original)
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

// Create HTTP server with Socket.IO
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// ============ ROOM & MATCH MANAGEMENT ============

function generateRoomCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 5; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function getOrCreateRoom(code) {
  if (!rooms.has(code)) {
    rooms.set(code, {
      code,
      mode: "1v1", // 1v1 | tournament | auction
      host: null,
      players: [],
      matchState: null,
      isLive: false,
      createdAt: Date.now(),
    });
  }
  return rooms.get(code);
}

// ============ SOCKET.IO EVENTS ============

io.on("connection", (socket) => {
  console.log("✅ Socket connected:", socket.id);

  // -------- ROOM CREATION & JOINING --------

  socket.on("createRoom", async (data, callback) => {
    try {
      const { mode, playerName } = data;
      const roomCode = generateRoomCode();
      const room = getOrCreateRoom(roomCode);

      room.mode = mode || "1v1";
      room.host = socket.id;
      room.players.push({
        socketId: socket.id,
        playerId: `player_${socket.id.slice(0, 8)}`,
        name: playerName || "Player 1",
        side: "A",
        teamPlayers: [],
        isReady: false,
      });

      userSockets.set(socket.id, {
        playerId: `player_${socket.id.slice(0, 8)}`,
        roomCode,
        side: "A",
      });

      socket.join(roomCode);
      console.log(`🎮 Room created: ${roomCode} by ${socket.id}`);

      if (callback) {
        callback({
          success: true,
          code: roomCode,
          room: room,
        });
      }

      io.to(roomCode).emit("roomUpdate", room);
    } catch (error) {
      console.error("❌ Error in createRoom:", error);
      if (callback) {
        callback({
          success: false,
          error: error.message,
        });
      }
    }
  });

  socket.on("joinRoom", async (data, callback) => {
    try {
      const { code, playerName } = data;
      const roomCode = code.toUpperCase();
      const room = getOrCreateRoom(roomCode);

      // Check if room is full
      const maxPlayers = room.mode === "tournament" ? 10 : 2;
      if (room.players.length >= maxPlayers) {
        if (callback) {
          callback({
            success: false,
            error: "Room is full",
          });
        }
        return;
      }

      // Add player to room
      const side = room.players.length === 0 ? "A" : "B";
      const newPlayer = {
        socketId: socket.id,
        playerId: `player_${socket.id.slice(0, 8)}`,
        name: playerName || `Player ${room.players.length + 1}`,
        side,
        teamPlayers: [],
        isReady: false,
      };

      room.players.push(newPlayer);
      userSockets.set(socket.id, {
        playerId: newPlayer.playerId,
        roomCode,
        side,
      });

      socket.join(roomCode);
      console.log(`👤 Player ${socket.id} joined room ${roomCode}`);

      if (callback) {
        callback({
          success: true,
          code: roomCode,
          room: room,
          side: side,
        });
      }

      io.to(roomCode).emit("roomUpdate", room);
    } catch (error) {
      console.error("❌ Error in joinRoom:", error);
      if (callback) {
        callback({
          success: false,
          error: error.message,
        });
      }
    }
  });

  // -------- TEAM SETUP --------

  socket.on("updateTeamPlayers", (data, callback) => {
    try {
      const { roomCode, teamPlayers } = data;
      const room = getOrCreateRoom(roomCode);
      const userInfo = userSockets.get(socket.id);

      if (!userInfo) {
        if (callback) callback({ success: false, error: "User not in room" });
        return;
      }

      // Update player's team
      const player = room.players.find((p) => p.socketId === socket.id);
      if (player) {
        player.teamPlayers = teamPlayers;
        player.isReady = true;

        console.log(
          `🏏 Player ${player.name} set team with ${teamPlayers.length} players`
        );

        if (callback) {
          callback({ success: true });
        }

        io.to(roomCode).emit("roomUpdate", room);
      }
    } catch (error) {
      console.error("❌ Error in updateTeamPlayers:", error);
      if (callback) {
        callback({ success: false, error: error.message });
      }
    }
  });

  // -------- MATCH CONTROL --------

  socket.on("startMatch", (data, callback) => {
    try {
      const { roomCode, matchState } = data;
      const room = getOrCreateRoom(roomCode);

      // Only host can start match
      if (room.host !== socket.id) {
        if (callback)
          callback({ success: false, error: "Only host can start match" });
        return;
      }

      // Check all players are ready
      const allReady = room.players.every((p) => p.isReady);
      if (!allReady) {
        if (callback)
          callback({ success: false, error: "Not all players are ready" });
        return;
      }

      room.matchState = matchState;
      room.isLive = true;

      console.log(`🎯 Match started in room ${roomCode}`);

      if (callback) {
        callback({ success: true });
      }

      io.to(roomCode).emit("matchStarted", {
        roomCode,
        matchState,
      });
    } catch (error) {
      console.error("❌ Error in startMatch:", error);
      if (callback) {
        callback({ success: false, error: error.message });
      }
    }
  });

  socket.on("updateMatchState", (data) => {
    try {
      const { roomCode, matchState } = data;
      const room = getOrCreateRoom(roomCode);

      // Only host can update match
      if (room.host !== socket.id) {
        console.warn("⚠️  Non-host tried to update match state");
        return;
      }

      room.matchState = matchState;

      // Broadcast update to all players in room
      io.to(roomCode).emit("matchStateUpdated", {
        roomCode,
        matchState,
      });

      console.log(
        `📊 Match state updated in ${roomCode} - Score: ${matchState.score}/${matchState.wickets}`
      );
    } catch (error) {
      console.error("❌ Error in updateMatchState:", error);
    }
  });

  // Broadcast bowl ball action
  socket.on("bowlBall", (data) => {
    try {
      const { roomCode, matchState, commentary } = data;
      const room = getOrCreateRoom(roomCode);

      if (room.host !== socket.id) return;

      io.to(roomCode).emit("ballBowled", {
        matchState,
        commentary,
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error("❌ Error in bowlBall:", error);
    }
  });

  // Broadcast over skip
  socket.on("skipOver", (data) => {
    try {
      const { roomCode, matchState } = data;
      const room = getOrCreateRoom(roomCode);

      if (room.host !== socket.id) return;

      io.to(roomCode).emit("overSkipped", {
        matchState,
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error("❌ Error in skipOver:", error);
    }
  });

  // Broadcast innings break
  socket.on("inningsBreak", (data) => {
    try {
      const { roomCode, matchState } = data;
      const room = getOrCreateRoom(roomCode);

      if (room.host !== socket.id) return;

      io.to(roomCode).emit("inningsChanged", {
        matchState,
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error("❌ Error in inningsBreak:", error);
    }
  });

  // Broadcast match end
  socket.on("endMatch", (data) => {
    try {
      const { roomCode, matchState } = data;
      const room = getOrCreateRoom(roomCode);

      if (room.host !== socket.id) return;

      room.isLive = false;

      io.to(roomCode).emit("matchEnded", {
        matchState,
        timestamp: Date.now(),
      });

      console.log(`🏁 Match ended in room ${roomCode}`);
    } catch (error) {
      console.error("❌ Error in endMatch:", error);
    }
  });

  // -------- DISCONNECT HANDLING --------

  socket.on("disconnect", () => {
    try {
      const userInfo = userSockets.get(socket.id);

      if (userInfo) {
        const room = rooms.get(userInfo.roomCode);

        if (room) {
          // Remove player from room
          room.players = room.players.filter((p) => p.socketId !== socket.id);

          // If room is empty, delete it
          if (room.players.length === 0) {
            rooms.delete(userInfo.roomCode);
            console.log(`🗑️  Room ${userInfo.roomCode} deleted (empty)`);
          } else {
            // Notify remaining players
            io.to(userInfo.roomCode).emit("playerDisconnected", {
              playerId: userInfo.playerId,
              remainingPlayers: room.players,
            });

            // If host disconnected, assign new host
            if (room.host === socket.id && room.players.length > 0) {
              room.host = room.players[0].socketId;
              io.to(userInfo.roomCode).emit("hostChanged", {
                newHostId: room.host,
              });
              console.log(
                `👑 New host assigned in ${userInfo.roomCode}: ${room.host}`
              );
            }
          }
        }

        userSockets.delete(socket.id);
      }

      console.log("❌ Socket disconnected:", socket.id);
    } catch (error) {
      console.error("❌ Error in disconnect handler:", error);
    }
  });

  // -------- CHAT/MESSAGING --------
  socket.on("sendMessage", (data) => {
    try {
      const { roomCode, message, sender } = data;
      io.to(roomCode).emit("messageReceived", {
        message,
        sender,
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error("❌ Error in sendMessage:", error);
    }
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║    CricSim Pro Server Running          ║
║    🎮 WebSocket Server Active          ║
║    📍 Port: ${PORT}                        ║
║    🌐 CORS Origins: ${allowedOrigins.length} configured   ║
╚════════════════════════════════════════╝
  `);
});

module.exports = server;

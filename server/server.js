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
      const { mode, playerName, name } = data;
      const roomCode = generateRoomCode();
      const room = getOrCreateRoom(roomCode);

      room.mode = mode || "1v1";
      room.host = socket.id;
      room.players.push({
        socketId: socket.id,
        playerId: `player_${socket.id.slice(0, 8)}`,
        name: playerName || name || "Player 1",
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
      const { code, playerName, name } = data;
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

      // Add player to room - assign sides: A, B, C, D, etc.
      const sides = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"];
      const side = sides[room.players.length] || "X";
      const newPlayer = {
        socketId: socket.id,
        playerId: `player_${socket.id.slice(0, 8)}`,
        name: playerName || name || `Player ${room.players.length + 1}`,
        side,
        teamPlayers: [],
        isReady: false,
      };
      
      console.log(`👤 Assigning side: ${side} to player ${playerName || name} (position ${room.players.length})`);

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

  socket.on("navigateToQuickSetup", (data) => {
    try {
      const { code } = data;
      const room = rooms.get(code);

      if (room && room.host === socket.id) {
        io.to(code).emit("navigateToQuickSetup");
        console.log(`🚀 Navigating room ${code} to quick setup`);
      }
    } catch (error) {
      console.error("❌ Error in navigateToQuickSetup:", error);
    }
  });

  socket.on("navigateToTournamentSetup", (data) => {
    try {
      const { code } = data;
      const room = rooms.get(code);

      if (room && room.host === socket.id) {
        io.to(code).emit("navigateToTournamentSetup");
        console.log(`🎯 Navigating room ${code} to tournament setup`);
      }
    } catch (error) {
      console.error("❌ Error in navigateToTournamentSetup:", error);
    }
  });

  socket.on("navigateToTournamentHub", (data) => {
    try {
      const { code } = data;
      const room = rooms.get(code);

      if (room && room.host === socket.id) {
        io.to(code).emit("navigateToTournamentHub");
        console.log(`📊 Navigating room ${code} to tournament hub`);
      }
    } catch (error) {
      console.error("❌ Error in navigateToTournamentHub:", error);
    }
  });

  socket.on("navigateToAuctionLobby", (data) => {
    try {
      const { code } = data;
      const room = rooms.get(code);

      if (room && room.host === socket.id) {
        io.to(code).emit("navigateToAuctionLobby");
        console.log(`🔨 Navigating room ${code} to auction lobby`);
      }
    } catch (error) {
      console.error("❌ Error in navigateToAuctionLobby:", error);
    }
  });

  socket.on("selectIPLTeam", ({ code, teamId }) => {
    console.log(`🏟️  Received selectIPLTeam: code=${code}, teamId=${teamId}, socketId=${socket.id}`);
    const room = rooms.get(code);
    if (!room) {
      console.error(`❌ Room not found: ${code}`);
      return;
    }

    const player = room.players.find((p) => p.socketId === socket.id);
    if (player) {
      const oldTeam = player.iplTeam;
      if (player.iplTeam === teamId) {
        player.iplTeam = null;
      } else {
        player.iplTeam = teamId;
      }
      console.log(`✅ Updated player ${player.name}: ${oldTeam || "None"} → ${player.iplTeam || "None"}`);
      console.log(`📢 Room ${code} team selection status:`, room.players.map(p => ({ name: p.name, team: p.iplTeam })));
      console.log(`📢 Broadcasting roomUpdate to ${code}`);
      io.to(code).emit("roomUpdate", room);
    } else {
      console.error(`❌ Player not found: ${socket.id} in room ${code}`);
      console.error(`Available players:`, room.players.map(p => ({ name: p.name, socketId: p.socketId })));
    }
  });

  // -------- PLAYER READY SYSTEM --------
  // Guest emits playerReady when they click "MARK AS READY" button
  // Server broadcasts this to all players in the room so host can track readiness

  socket.on("playerReady", (data) => {
    console.log(`🟢 Received playerReady: roomCode=${data.roomCode}, socketId=${data.socketId}`);
    const room = rooms.get(data.roomCode);
    if (!room) {
      console.error(`❌ Room not found for playerReady: ${data.roomCode}`);
      return;
    }

    // Broadcast to all players in the room
    console.log(`📢 Broadcasting playerReady to room ${data.roomCode}`);
    io.to(data.roomCode).emit("playerReady", {
      roomCode: data.roomCode,
      socketId: data.socketId
    });
  });

  socket.on("matchEntryReady", (data) => {
    console.log(`🎮 Received matchEntryReady: roomCode=${data.roomCode}, fixtureId=${data.fixtureId}, socketId=${data.socketId}`);
    const room = rooms.get(data.roomCode);
    if (!room) {
      console.error(`❌ Room not found for matchEntryReady: ${data.roomCode}`);
      return;
    }

    // Broadcast to all players in the room
    console.log(`📢 Broadcasting matchEntryReady to room ${data.roomCode}`);
    io.to(data.roomCode).emit("matchEntryReady", {
      roomCode: data.roomCode,
      fixtureId: data.fixtureId,
      socketId: data.socketId
    });
  });

  // -------- TEAM SETUP --------

  socket.on("updateTeamPlayers", (data, callback) => {
    try {
      const { roomCode, teamPlayers } = data;
      const room = getOrCreateRoom(roomCode);
      const userInfo = userSockets.get(socket.id);

      console.log(`📥 Received updateTeamPlayers from ${socket.id} in room ${roomCode}`);

      if (!userInfo) {
        console.log(`❌ User ${socket.id} not found in userSockets`);
        if (callback) callback({ success: false, error: "User not in room" });
        return;
      }

      // Update player's team
      const player = room.players.find((p) => p.socketId === socket.id);
      if (player) {
        player.teamPlayers = teamPlayers;
        player.isReady = true;

        console.log(
          `✅ 🏏 Player ${player.name} marked READY with ${teamPlayers.length} players`
        );
        console.log(`📊 Room ${roomCode} players ready status:`, room.players.map(p => ({ name: p.name, isReady: p.isReady })));

        if (callback) {
          callback({ success: true });
        }

        io.to(roomCode).emit("roomUpdate", room);
      } else {
        console.log(`❌ Player with socket ${socket.id} not found in room ${roomCode}`);
      }
    } catch (error) {
      console.error("❌ Error in updateTeamPlayers:", error);
      if (callback) {
        callback({ success: false, error: error.message });
      }
    }
  });

  socket.on("tournamentTeamUpdate", (data) => {
    try {
      const { code, teams } = data;
      const room = rooms.get(code);

      if (!room) return;

      // Find the sending player and update their team players
      const senderPlayer = room.players.find(p => p.socketId === socket.id);
      if (senderPlayer && teams.length > 0) {
        // The first (and only) team in the array is the sender's team
        const theirTeam = teams[0];
        if (theirTeam.id === senderPlayer.side) {
          // Store their team's players in teamPlayers for validation
          senderPlayer.teamPlayers = theirTeam.players || [];
          senderPlayer.isReady = (theirTeam.players?.length || 0) === 11;
          console.log(`🏏 Updated ${senderPlayer.name}'s team: ${senderPlayer.teamPlayers.length}/11 players, isReady: ${senderPlayer.isReady}`);
        }
      }

      // Broadcast team update to all players in room
      io.to(code).emit("tournamentTeamUpdate", { teams });
      console.log(`🏏 Tournament teams updated in room ${code}. Ready status:`, room.players.map(p => ({ name: p.name, ready: p.isReady, players: p.teamPlayers.length })));
    } catch (error) {
      console.error("❌ Error in tournamentTeamUpdate:", error);
    }
  });

  socket.on("generateTournamentFixtures", (data, callback) => {
    try {
      const { code } = data;
      const room = rooms.get(code);

      if (!room || room.host !== socket.id) {
        console.log(`❌ Only host can generate fixtures`);
        if (callback) callback({ success: false, error: "Only host can generate fixtures" });
        return;
      }

      // Validate that all players have selected exactly 11 players
      console.log(`🏆 Validating teams for tournament in room ${code}`);
      const incompletePlayers = room.players.filter(p => {
        const playerCount = (p.teamPlayers && p.teamPlayers.length) || 0;
        console.log(`  Player ${p.name}: ${playerCount}/11 players`);
        return playerCount !== 11;
      });

      if (incompletePlayers.length > 0) {
        const incompleteNames = incompletePlayers.map(p => `${p.name} (${(p.teamPlayers && p.teamPlayers.length) || 0}/11)`).join(", ");
        const errorMsg = `Not all players have selected 11 players. Incomplete: ${incompleteNames}`;
        console.log(`❌ ${errorMsg}`);
        if (callback) callback({ success: false, error: errorMsg });
        // Broadcast error to all players in room
        io.to(code).emit("tournamentStartError", { error: errorMsg });
        return;
      }

      console.log(`✅ All players have 11 players selected, generating fixtures...`);

      // Generate round-robin fixtures for all teams
      const fixtures = [];
      let fixtureId = 1;

      // Create all possible match combinations (round-robin)
      for (let i = 0; i < room.players.length; i++) {
        for (let j = i + 1; j < room.players.length; j++) {
          fixtures.push({
            id: fixtureId,
            t1: room.players[i].side,  // Team A
            t2: room.players[j].side,  // Team B
            winner: null,
            played: false,
            stage: "league"
          });
          fixtureId++;
        }
      }

      console.log(`🏆 Generated ${fixtures.length} fixtures for room ${code}`, fixtures);

      if (callback) {
        callback({ success: true, fixtureCount: fixtures.length });
      }

      // Broadcast generated fixtures to all players
      io.to(code).emit("tournamentFixturesGenerated", { fixtures });
    } catch (error) {
      console.error("❌ Error in generateTournamentFixtures:", error);
      if (callback) {
        callback({ success: false, error: error.message });
      }
    }
  });

  socket.on("startAuction", (data) => {
    try {
      const { code } = data;
      const room = rooms.get(code);

      if (!room || room.host !== socket.id) return;

      io.to(code).emit("startAuction");
      console.log(`🔨 Auction started in room ${code}`);
    } catch (error) {
      console.error("❌ Error in startAuction:", error);
    }
  });

  socket.on("auctionBid", (data) => {
    try {
      const { code, playerName, bid, teamId } = data;
      const room = rooms.get(code);

      console.log(`📥 Received auctionBid:`, { code, playerName, bid, socketId: socket.id });

      if (!room) {
        console.log(`❌ Room ${code} not found for auctionBid`);
        return;
      }

      // Broadcast bid to all players in the room
      const bidData = {
        playerName,
        bid,
        socketId: socket.id,
        teamId,
        timestamp: new Date()
      };
      
      console.log(`📤 Broadcasting auctionBidUpdate to room ${code}:`, bidData);
      io.to(code).emit("auctionBidUpdate", bidData);

      console.log(`💰 Bid placed in room ${code}: ${playerName} bid ₹${bid}L`);
    } catch (error) {
      console.error("❌ Error in auctionBid:", error);
    }
  });

  socket.on("auctionQueueSync", (data) => {
    try {
      const { code, queue } = data;
      const room = rooms.get(code);

      if (!room) {
        console.log(`❌ Room ${code} not found for auctionQueueSync`);
        return;
      }

      // Store queue in room and broadcast to all players
      room.auctionQueue = queue;
      console.log(`📋 Synced auction queue for room ${code}: ${queue.length} players`);
      
      io.to(code).emit("auctionQueueSync", { queue });
      console.log(`📤 Broadcasting auctionQueueSync to room ${code}`);
    } catch (error) {
      console.error("❌ Error in auctionQueueSync:", error);
    }
  });

  // -------- MATCH CONTROL --------

  socket.on("startMatch", (data, callback) => {
    try {
      const { roomCode, matchState } = data;
      const room = getOrCreateRoom(roomCode);

      console.log(`🔍 Host attempting to start match in room ${roomCode}`);
      console.log(`👥 Room players:`, room.players.map(p => ({ name: p.name, ready: p.isReady, socketId: p.socketId })));

      // Only host can start match
      if (room.host !== socket.id) {
        console.log(`❌ Non-host tried to start match. Host: ${room.host}, Requester: ${socket.id}`);
        if (callback)
          callback({ success: false, error: "Only host can start match" });
        return;
      }

      // Check all players are ready
      const allReady = room.players.every((p) => p.isReady);
      console.log(`🔍 All players ready? ${allReady}`);
      
      if (!allReady) {
        const notReady = room.players.filter(p => !p.isReady).map(p => p.name);
        console.log(`❌ Not all players are ready. Not ready: ${notReady.join(", ")}`);
        if (callback)
          callback({ success: false, error: "Not all players are ready" });
        return;
      }

      room.matchState = matchState;
      room.isLive = true;

      console.log(`✅ 🎯 Match started in room ${roomCode}`);
      console.log(`👥 Players in room:`, room.players.map(p => p.socketId));
      console.log(`📢 Broadcasting matchStarted to room ${roomCode}`);

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

  // Broadcast toss result to guest
  socket.on("broadcastToss", (data) => {
    try {
      const { roomCode, tossWinner, tossWinnerName } = data;
      const room = getOrCreateRoom(roomCode);

      console.log(`📢 Host broadcasting toss result in room ${roomCode}: ${tossWinnerName}`);

      // Send toss info to all players EXCEPT the host (guest)
      socket.to(roomCode).emit("receiveToss", {
        tossWinner,
        tossWinnerName,
      });

      console.log(`✅ Toss result sent to guest in room ${roomCode}`);
    } catch (error) {
      console.error("❌ Error in broadcastToss:", error);
    }
  });

  // Broadcast match start to all players in the room
  socket.on("matchStarted", (data) => {
    try {
      const { roomCode, fixtureId } = data;
      const room = getOrCreateRoom(roomCode);

      console.log(`🎬 Host broadcasting match start in room ${roomCode}: fixture ${fixtureId}`);

      // Send match start info to all players in the room
      // Client-side handler will filter: only non-host participants navigate, spectators just set the flag
      io.to(roomCode).emit("matchStarted", {
        fixtureId,
      });

      console.log(`✅ Match start notification broadcast to room ${roomCode}`);
    } catch (error) {
      console.error("❌ Error in matchStarted:", error);
    }
  });

  // Broadcast when both players are ready
  socket.on("bothPlayersReady", (data) => {
    try {
      const { roomCode, fixtureId } = data;
      const room = getOrCreateRoom(roomCode);

      console.log(`🎬 Both players ready in room ${roomCode}: fixture ${fixtureId}`);

      // Broadcast to the other player so they also navigate to match
      socket.to(roomCode).emit("bothPlayersReady", {
        fixtureId,
      });

      console.log(`✅ Both players ready notification sent to room ${roomCode}`);
    } catch (error) {
      console.error("❌ Error in bothPlayersReady:", error);
    }
  });

  socket.on("updateMatchState", (data) => {
    try {
      const { roomCode, matchState } = data;
      const room = getOrCreateRoom(roomCode);

      // Only update if this is a newer state (more balls bowled or match status changed)
      if (room.matchState) {
        const prevBalls = room.matchState.ballsBowled || 0;
        const prevInnings = room.matchState.innings || 1;
        const newBalls = matchState?.ballsBowled || 0;
        const newInnings = matchState?.innings || 1;
        
        // Reject if we're going backwards in the SAME innings or staying the same (duplicate)
        // But ALLOW transition to a new innings (even if balls go to 0)
        if (newInnings === prevInnings && newBalls <= prevBalls && !matchState?.isMatchOver) {
          console.log(
            `⚠️  Ignoring duplicate/outdated state update in ${roomCode} - Innings ${prevInnings}: Prev balls: ${prevBalls}, New balls: ${newBalls}`
          );
          return;
        }
        
        // Allow new innings even if balls reset
        if (newInnings > prevInnings) {
          console.log(
            `✅ Accepting innings transition in ${roomCode} - Innings ${prevInnings} → ${newInnings}`
          );
        }
      }

      // Any player in room can update match state
      room.matchState = matchState;

      // Broadcast update to all players in room
      io.to(roomCode).emit("matchStateUpdated", {
        roomCode,
        matchState,
      });

      console.log(
        `📊 Match state updated in ${roomCode} - Score: ${matchState.score}/${matchState.wickets}, Balls: ${matchState.ballsBowled}`
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

      // Validate this is a new ball (not a duplicate)
      if (room.matchState) {
        const prevBalls = room.matchState.ballsBowled || 0;
        const newBalls = matchState?.ballsBowled || 0;
        
        // If balls count hasn't increased, this is likely a duplicate/stale update
        if (newBalls <= prevBalls && !matchState?.isMatchOver) {
          console.log(
            `⚠️  Rejecting stale bowlBall in ${roomCode} - Prev: ${prevBalls}, New: ${newBalls}`
          );
          return;
        }
      }

      // Update room state
      room.matchState = matchState;

      // Any player in room can bowl
      io.to(roomCode).emit("ballBowled", {
        matchState,
        commentary,
        timestamp: Date.now(),
      });
      
      console.log(
        `⚾ Ball bowled in ${roomCode} - Total balls: ${matchState.ballsBowled}, Score: ${matchState.score}/${matchState.wickets}`
      );
    } catch (error) {
      console.error("❌ Error in bowlBall:", error);
    }
  });

  // Broadcast over skip
  socket.on("skipOver", (data) => {
    try {
      const { roomCode, matchState } = data;
      const room = getOrCreateRoom(roomCode);

      // Validate this is a new state
      if (room.matchState) {
        const prevBalls = room.matchState.ballsBowled || 0;
        const newBalls = matchState?.ballsBowled || 0;
        
        if (newBalls <= prevBalls && !matchState?.isMatchOver) {
          console.log(
            `⚠️  Rejecting stale skipOver in ${roomCode} - Prev: ${prevBalls}, New: ${newBalls}`
          );
          return;
        }
      }

      // Update room state
      room.matchState = matchState;

      // Any player in room can skip over
      io.to(roomCode).emit("overSkipped", {
        matchState,
        timestamp: Date.now(),
      });
      
      console.log(
        `⏭️  Over skipped in ${roomCode} - Total balls: ${matchState.ballsBowled}`
      );
    } catch (error) {
      console.error("❌ Error in skipOver:", error);
    }
  });

  // Broadcast innings break
  socket.on("inningsBreak", (data) => {
    try {
      const { roomCode, matchState } = data;
      const room = getOrCreateRoom(roomCode);

      // Update room state
      room.matchState = matchState;

      // Any player can trigger innings break
      io.to(roomCode).emit("inningsChanged", {
        matchState,
        timestamp: Date.now(),
      });
      
      console.log(
        `🔄 Innings changed in ${roomCode} - Now Innings: ${matchState.innings}`
      );
    } catch (error) {
      console.error("❌ Error in inningsBreak:", error);
    }
  });

  // Broadcast match end
  socket.on("endMatch", (data) => {
    try {
      const { roomCode, matchState } = data;
      const room = getOrCreateRoom(roomCode);

      // Any player in room can end match
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

  // Broadcast tournament results update
  socket.on("tournamentResultsUpdate", (data) => {
    try {
      const { code, fixtures, tournTeams, phase } = data;
      const room = rooms.get(code);

      // Only host can broadcast tournament results
      if (!room || room.host !== socket.id) {
        console.log(`❌ Non-host tried to update tournament results. Host: ${room?.host}, Requester: ${socket.id}`);
        return;
      }

      // Broadcast updated tournament data to ALL players in room
      io.to(code).emit("tournamentResultsUpdate", {
        fixtures,
        tournTeams,
        phase,
        timestamp: Date.now(),
      });

      console.log(`📊 Tournament results updated and broadcast to room ${code}`);
      console.log(`   Fixtures: ${fixtures?.length || 0}, Teams: ${tournTeams?.length || 0}, Phase: ${phase}`);
    } catch (error) {
      console.error("❌ Error in tournamentResultsUpdate:", error);
    }
  });

  // Broadcast tournament hub navigation
  socket.on("navigateToTournamentHub", (data) => {
    try {
      const { code } = data;
      const room = rooms.get(code);

      // Only host can trigger navigation
      if (!room || room.host !== socket.id) {
        console.log(`❌ Non-host tried to navigate to tournament hub. Host: ${room?.host}, Requester: ${socket.id}`);
        return;
      }

      // Broadcast navigation command to ALL players in room
      io.to(code).emit("navigateToTournamentHub");

      console.log(`🏠 All players in room ${code} navigating to tournament hub`);
    } catch (error) {
      console.error("❌ Error in navigateToTournamentHub:", error);
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

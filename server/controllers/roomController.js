// server/controllers/roomController.js

const logger = require('../utils/logger');
const {
  validateRoomCode,
  validatePlayerName,
  validateGameMode,
} = require("../utils/validation");
const {
  rooms,
  userSockets,
  generateRoomCode,
  getOrCreateRoom,
  updateRoomActivity,
  getAvailableRooms,
  removePlayerFromRoom,
} = require("../utils/roomManager");

/**
 * Handle room creation
 */
function handleCreateRoom(socket, io) {
  socket.on("createRoom", async (data, callback) => {
    try {
      // Validate input
      const modeValidation = validateGameMode(data?.mode || "1v1");
      if (!modeValidation.valid) {
        logger.error('Invalid mode in createRoom:', modeValidation.error);
        if (callback) callback({ success: false, error: modeValidation.error });
        return;
      }
      
      const nameValidation = validatePlayerName(data?.playerName || data?.name || "Player 1");
      if (!nameValidation.valid) {
        console.error(`❌ Invalid player name in createRoom:`, nameValidation.error);
        if (callback) callback({ success: false, error: nameValidation.error });
        return;
      }
      
      const roomCode = generateRoomCode();
      const room = getOrCreateRoom(roomCode);

      room.mode = modeValidation.mode;
      room.host = socket.id;
      updateRoomActivity(roomCode);
      room.players.push({
        socketId: socket.id,
        playerId: `player_${socket.id.slice(0, 8)}`,
        name: nameValidation.name,
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
      logger.room('created', roomCode, { host: socket.id, mode: room.mode });

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
}

/**
 * Handle room joining
 */
function handleJoinRoom(socket, io) {
  socket.on("joinRoom", async (data, callback) => {
    try {
      // Validate room code
      const codeValidation = validateRoomCode(data?.code);
      if (!codeValidation.valid) {
        console.error(`❌ Invalid room code in joinRoom:`, codeValidation.error);
        if (callback) callback({ success: false, error: codeValidation.error });
        return;
      }
      
      // Validate player name
      const nameValidation = validatePlayerName(data?.playerName || data?.name || `Player ${Date.now()}`);
      if (!nameValidation.valid) {
        console.error(`❌ Invalid player name in joinRoom:`, nameValidation.error);
        if (callback) callback({ success: false, error: nameValidation.error });
        return;
      }
      
      const roomCode = codeValidation.code;
      const room = rooms.get(roomCode);
      
      // Check if room exists
      if (!room) {
        console.error(`❌ Room ${roomCode} not found`);
        if (callback) callback({ success: false, error: "Room not found" });
        return;
      }

      updateRoomActivity(roomCode);

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
        name: nameValidation.name,
        side,
        teamPlayers: [],
        isReady: false,
      };
      
      console.log(`👤 Assigning side: ${side} to player ${nameValidation.name} (position ${room.players.length})`);

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
}

/**
 * Handle get rooms list
 */
function handleGetRooms(socket) {
  socket.on("getRooms", (data, callback) => {
    try {
      const { mode } = data || {};
      const availableRooms = getAvailableRooms(mode);

      if (callback) {
        callback({
          success: true,
          rooms: availableRooms,
        });
      }
    } catch (error) {
      console.error("❌ Error in getRooms:", error);
      if (callback) {
        callback({
          success: false,
          error: error.message,
          rooms: [],
        });
      }
    }
  });
}

/**
 * Handle navigation events
 */
function handleNavigation(socket, io) {
  const navigationEvents = [
    "navigateToQuickSetup",
    "navigateToTournamentSetup",
    "navigateToTournamentHub",
    "navigateToAuctionLobby",
  ];

  navigationEvents.forEach((eventName) => {
    socket.on(eventName, (data) => {
      try {
        const { code } = data;
        const room = rooms.get(code);

        if (room && room.host === socket.id) {
          io.to(code).emit(eventName);
          console.log(`🚀 ${eventName} triggered for room ${code}`);
        }
      } catch (error) {
        console.error(`❌ Error in ${eventName}:`, error);
      }
    });
  });
}

/**
 * Handle team selection (IPL teams)
 */
function handleTeamSelection(socket, io) {
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
      io.to(code).emit("roomUpdate", room);
    } else {
      console.error(`❌ Player not found: ${socket.id} in room ${code}`);
    }
  });
}

/**
 * Handle player ready system
 */
function handlePlayerReady(socket, io) {
  socket.on("playerReady", (data) => {
    console.log(`🟢 Received playerReady: roomCode=${data.roomCode}, socketId=${data.socketId}`);
    const room = rooms.get(data.roomCode);
    if (!room) {
      console.error(`❌ Room not found for playerReady: ${data.roomCode}`);
      return;
    }

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

    io.to(data.roomCode).emit("matchEntryReady", {
      roomCode: data.roomCode,
      fixtureId: data.fixtureId,
      socketId: data.socketId
    });
  });
}

/**
 * Handle disconnect
 */
function handleDisconnect(socket, io) {
  socket.on("disconnect", () => {
    try {
      const userInfo = userSockets.get(socket.id);

      if (userInfo) {
        const room = removePlayerFromRoom(socket.id, userInfo.roomCode);

        if (room) {
          if (room.players.length === 0) {
            console.log(`📭 Room ${userInfo.roomCode} is now empty, will be cleaned up if no one joins`);
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
              console.log(`👑 New host assigned in ${userInfo.roomCode}: ${room.host}`);
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
}

/**
 * Initialize all room-related socket handlers
 */
function initializeRoomHandlers(socket, io) {
  handleCreateRoom(socket, io);
  handleJoinRoom(socket, io);
  handleGetRooms(socket);
  handleNavigation(socket, io);
  handleTeamSelection(socket, io);
  handlePlayerReady(socket, io);
  handleDisconnect(socket, io);
}

module.exports = {
  initializeRoomHandlers,
};

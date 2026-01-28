// server/utils/roomManager.js

/**
 * Room management utilities
 * Handles room lifecycle, cleanup, and activity tracking
 */

// Configuration constants
const ROOM_CLEANUP_INTERVAL = 15 * 60 * 1000; // 15 minutes
const ROOM_INACTIVITY_TIMEOUT = 2 * 60 * 60 * 1000; // 2 hours
const EMPTY_ROOM_TIMEOUT = 5 * 60 * 1000; // 5 minutes

// In-memory storage
const rooms = new Map();
const userSockets = new Map(); // socketId -> { playerId, roomCode, side }

/**
 * Generate a random 5-character room code
 */
function generateRoomCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 5; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

/**
 * Get or create a room
 */
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
      lastActivity: Date.now(),
    });
  }
  return rooms.get(code);
}

/**
 * Update room activity timestamp
 */
function updateRoomActivity(code) {
  const room = rooms.get(code);
  if (room) {
    room.lastActivity = Date.now();
  }
}

/**
 * Clean up stale and empty rooms
 */
function cleanupStaleRooms() {
  const now = Date.now();
  let cleaned = 0;
  
  rooms.forEach((room, code) => {
    const isInactive = now - room.lastActivity > ROOM_INACTIVITY_TIMEOUT;
    const isEmpty = room.players.length === 0;
    const isEmptyTooLong = isEmpty && (now - room.createdAt > EMPTY_ROOM_TIMEOUT);
    
    if (isInactive || isEmptyTooLong) {
      // Clean up associated user sockets
      room.players.forEach(player => {
        userSockets.delete(player.socketId);
      });
      
      rooms.delete(code);
      cleaned++;
      console.log(`🗑️  Cleaned up ${isEmpty ? 'empty' : 'inactive'} room: ${code}`);
    }
  });
  
  if (cleaned > 0) {
    console.log(`✨ Cleanup complete: Removed ${cleaned} stale room(s). Active rooms: ${rooms.size}`);
  }
}

/**
 * Get available rooms filtered by mode
 */
function getAvailableRooms(mode = null) {
  const availableRooms = [];

  rooms.forEach((room, code) => {
    // Only show rooms that are not full and not yet live
    const maxPlayers = room.mode === "tournament" ? 10 : 2;
    const isFull = room.players.length >= maxPlayers;
    
    if (!room.isLive && !isFull) {
      // Filter by mode if specified
      if (mode && room.mode !== mode) {
        return;
      }

      const host = room.players.find(p => p.socketId === room.host);
      availableRooms.push({
        code: room.code,
        mode: room.mode,
        hostName: host?.name || "Unknown",
        playerCount: room.players.length,
        maxPlayers: maxPlayers,
        createdAt: room.createdAt,
      });
    }
  });

  // Sort by creation date (newest first)
  availableRooms.sort((a, b) => b.createdAt - a.createdAt);

  return availableRooms;
}

/**
 * Remove player from room
 */
function removePlayerFromRoom(socketId, roomCode) {
  const room = rooms.get(roomCode);
  if (!room) return null;

  room.players = room.players.filter((p) => p.socketId !== socketId);
  updateRoomActivity(roomCode);

  return room;
}

/**
 * Start cleanup interval
 */
function startCleanupInterval() {
  const interval = setInterval(() => {
    cleanupStaleRooms();
  }, ROOM_CLEANUP_INTERVAL);

  console.log(`🧹 Room cleanup scheduled every ${ROOM_CLEANUP_INTERVAL / 60000} minutes`);

  return interval;
}

module.exports = {
  rooms,
  userSockets,
  generateRoomCode,
  getOrCreateRoom,
  updateRoomActivity,
  cleanupStaleRooms,
  getAvailableRooms,
  removePlayerFromRoom,
  startCleanupInterval,
  ROOM_CLEANUP_INTERVAL,
  ROOM_INACTIVITY_TIMEOUT,
  EMPTY_ROOM_TIMEOUT,
};

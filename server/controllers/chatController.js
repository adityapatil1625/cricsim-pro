// server/controllers/chatController.js

const { rooms } = require("../utils/roomManager");
const { validateRoomCode, sanitizeString } = require("../utils/validation");
const { isRoomMember } = require("../utils/socketGuards");

/**
 * Handle chat messages
 */
function handleChat(socket, io) {
  socket.on("sendMessage", (data) => {
    try {
      if (socket.checkRateLimit) {
        const rate = socket.checkRateLimit('chat');
        if (!rate.allowed) {
          return;
        }
      }

      const { roomCode, message, sender } = data;
      const codeValidation = validateRoomCode(roomCode);
      if (!codeValidation.valid) {
        console.warn(`⚠️  Invalid room code in sendMessage: ${codeValidation.error}`);
        return;
      }

      const safeMessage = sanitizeString(String(message || '')).trim();
      const submittedSender = sanitizeString(String(sender || '')).trim();
      
      // Basic validation
      if (!safeMessage || !submittedSender) {
        console.warn(`⚠️  Invalid message data from ${socket.id}`);
        return;
      }

      const room = rooms.get(codeValidation.code);
      if (!room) {
        console.warn(`⚠️  Message sent to non-existent room: ${codeValidation.code}`);
        return;
      }

      if (!isRoomMember(room, socket.id)) {
        console.warn(`⚠️  Unauthorized message attempt from ${socket.id} to ${codeValidation.code}`);
        return;
      }

      const senderPlayer = room.players.find((player) => player.socketId === socket.id);
      const safeSender = sanitizeString(senderPlayer?.name || submittedSender).trim();
      if (!safeSender) {
        console.warn(`⚠️  Invalid message sender from ${socket.id}`);
        return;
      }
      
      io.to(codeValidation.code).emit("messageReceived", {
        message: safeMessage,
        sender: safeSender,
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error("❌ Error in sendMessage:", error);
    }
  });
}

/**
 * Initialize all chat-related socket handlers
 */
function initializeChatHandlers(socket, io) {
  handleChat(socket, io);
}

module.exports = {
  initializeChatHandlers,
};

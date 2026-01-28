// server/controllers/chatController.js

const { rooms } = require("../utils/roomManager");

/**
 * Handle chat messages
 */
function handleChat(socket, io) {
  socket.on("sendMessage", (data) => {
    try {
      const { roomCode, message, sender } = data;
      
      // Basic validation
      if (!roomCode || !message || !sender) {
        console.warn(`⚠️  Invalid message data from ${socket.id}`);
        return;
      }
      
      const room = rooms.get(roomCode);
      if (!room) {
        console.warn(`⚠️  Message sent to non-existent room: ${roomCode}`);
        return;
      }
      
      io.to(roomCode).emit("messageReceived", {
        message,
        sender,
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

// server/controllers/auctionController.js

const { validateRoomCode, validateBidAmount } = require("../utils/validation");
const { rooms, updateRoomActivity } = require("../utils/roomManager");

/**
 * Handle auction start
 */
function handleStartAuction(socket, io) {
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
}

/**
 * Handle auction bid
 */
function handleAuctionBid(socket, io) {
  socket.on("auctionBid", (data) => {
    try {
      // Validate room code
      const codeValidation = validateRoomCode(data?.code);
      if (!codeValidation.valid) {
        console.error(`❌ Invalid room code in auctionBid:`, codeValidation.error);
        return;
      }
      
      // Validate bid amount
      const bidValidation = validateBidAmount(data?.bid);
      if (!bidValidation.valid) {
        console.error(`❌ Invalid bid amount:`, bidValidation.error);
        return;
      }
      
      const code = codeValidation.code;
      const room = rooms.get(code);

      updateRoomActivity(code);

      console.log(`📥 Received auctionBid:`, { code, playerName: data?.playerName, bid: bidValidation.bid, socketId: socket.id });

      if (!room) {
        console.log(`❌ Room ${code} not found for auctionBid`);
        return;
      }

      // Broadcast bid to all players in the room
      const bidData = {
        playerName: data?.playerName || "Unknown",
        bid: bidValidation.bid,
        socketId: socket.id,
        teamId: data?.teamId,
        timestamp: new Date()
      };
      
      console.log(`📤 Broadcasting auctionBidUpdate to room ${code}:`, bidData);
      io.to(code).emit("auctionBidUpdate", bidData);

      console.log(`💰 Bid placed in room ${code}: ${data?.playerName} bid ₹${bidValidation.bid}L`);
    } catch (error) {
      console.error("❌ Error in auctionBid:", error);
    }
  });
}

/**
 * Handle auction queue sync
 */
function handleAuctionQueueSync(socket, io) {
  socket.on("auctionQueueSync", (data) => {
    try {
      const { code, queue } = data;
      const room = rooms.get(code);

      if (!room) return;

      // Only host can sync auction queue
      if (room.host !== socket.id) {
        console.log(`⚠️  Non-host ${socket.id} tried to sync queue in ${code}`);
        return;
      }

      console.log(`📋 Auction queue synced in ${code}: ${queue?.length || 0} players`);
      io.to(code).emit("auctionQueueSynced", { queue });
    } catch (error) {
      console.error("❌ Error in auctionQueueSync:", error);
    }
  });
}

/**
 * Handle auction player sold
 */
function handleAuctionPlayerSold(socket, io) {
  socket.on("auctionPlayerSold", (data) => {
    try {
      const { code, player, teamId, amount } = data;
      const room = rooms.get(code);

      if (!room) return;

      console.log(`✅ Player sold in ${code}: ${player?.name} to ${teamId} for ₹${amount}L`);
      io.to(code).emit("auctionPlayerSoldBroadcast", { player, teamId, amount });
    } catch (error) {
      console.error("❌ Error in auctionPlayerSold:", error);
    }
  });
}

/**
 * Handle auction teams update
 */
function handleAuctionTeamsUpdate(socket, io) {
  socket.on("auctionTeamsUpdate", (data) => {
    try {
      const { code, teams } = data;
      const room = rooms.get(code);

      if (!room) return;

      console.log(`📊 Auction teams updated in ${code}`);
      io.to(code).emit("auctionTeamsUpdateBroadcast", { teams });
    } catch (error) {
      console.error("❌ Error in auctionTeamsUpdate:", error);
    }
  });
}

/**
 * Handle auction log update
 */
function handleAuctionLogUpdate(socket, io) {
  socket.on("auctionLogUpdate", (data) => {
    try {
      const { code, logEntry } = data;
      const room = rooms.get(code);

      if (!room) return;

      io.to(code).emit("auctionLogUpdateBroadcast", { logEntry });
    } catch (error) {
      console.error("❌ Error in auctionLogUpdate:", error);
    }
  });
}

/**
 * Initialize all auction-related socket handlers
 */
function initializeAuctionHandlers(socket, io) {
  handleStartAuction(socket, io);
  handleAuctionBid(socket, io);
  handleAuctionQueueSync(socket, io);
  handleAuctionPlayerSold(socket, io);
  handleAuctionTeamsUpdate(socket, io);
  handleAuctionLogUpdate(socket, io);
}

module.exports = {
  initializeAuctionHandlers,
};

// server/controllers/matchController.js

const { validateMatchState } = require("../utils/validation");
const { rooms, getOrCreateRoom, updateRoomActivity } = require("../utils/roomManager");

/**
 * Handle match state update
 */
function handleMatchStateUpdate(socket, io) {
  socket.on("updateMatchState", (data) => {
    try {
      const { roomCode, matchState } = data;
      const room = getOrCreateRoom(roomCode);

      updateRoomActivity(roomCode);

      // Only update if this is a newer state (more balls bowled or match status changed)
      if (room.matchState) {
        const prevBalls = room.matchState.ballsBowled || 0;
        const prevInnings = room.matchState.innings || 1;
        const newBalls = matchState?.ballsBowled || 0;
        const newInnings = matchState?.innings || 1;
        
        // Reject if we're going backwards in the SAME innings or staying the same (duplicate)
        if (newInnings === prevInnings && newBalls <= prevBalls && !matchState?.isMatchOver) {
          console.log(
            `⚠️  Ignoring duplicate/outdated state update in ${roomCode} - Innings ${prevInnings}: Prev balls: ${prevBalls}, New balls: ${newBalls}`
          );
          return;
        }
      }

      // ALWAYS log critical match events
      const isMatchEnd = matchState?.isMatchOver;
      const isInningsChange =
        room.matchState &&
        matchState?.innings !== room.matchState.innings;

      if (isMatchEnd) {
        console.log(`🏁 MATCH ENDED in ${roomCode}`);
      } else if (isInningsChange) {
        console.log(
          `🔄 INNINGS CHANGE in ${roomCode}: Innings ${matchState.innings}`
        );
      }

      room.matchState = matchState;

      // Broadcast to all players in room
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
}

/**
 * Handle toss result
 */
function handleTossResult(socket, io) {
  socket.on("tossResult", (data) => {
    try {
      const { code, winner, choice } = data;
      const room = rooms.get(code);

      if (!room) return;

      console.log(`🪙 Toss result in ${code}: ${winner} won and chose to ${choice}`);
      io.to(code).emit("tossResultBroadcast", { winner, choice });
    } catch (error) {
      console.error("❌ Error in tossResult:", error);
    }
  });
}

/**
 * Handle innings break
 */
function handleInningsBreak(socket, io) {
  socket.on("inningsBreak", (data) => {
    try {
      const { code } = data;
      const room = rooms.get(code);

      if (!room) return;

      console.log(`🔄 Innings break in ${code}`);
      io.to(code).emit("inningsBreakBroadcast");
    } catch (error) {
      console.error("❌ Error in inningsBreak:", error);
    }
  });
}

/**
 * Handle match end
 */
function handleMatchEnd(socket, io) {
  socket.on("matchEnd", (data) => {
    try {
      const { code, result } = data;
      const room = rooms.get(code);

      if (!room) return;

      console.log(`🏁 Match ended in ${code}:`, result);
      io.to(code).emit("matchEndBroadcast", { result });
    } catch (error) {
      console.error("❌ Error in matchEnd:", error);
    }
  });
}

/**
 * Initialize all match-related socket handlers
 */
function initializeMatchHandlers(socket, io) {
  handleMatchStateUpdate(socket, io);
  handleTossResult(socket, io);
  handleInningsBreak(socket, io);
  handleMatchEnd(socket, io);
}

module.exports = {
  initializeMatchHandlers,
};

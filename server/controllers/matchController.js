// server/controllers/matchController.js

const { validateMatchState, validateRoomCode } = require("../utils/validation");
const { rooms, updateRoomActivity } = require("../utils/roomManager");
const { isRoomHost, isRoomMember } = require("../utils/socketGuards");

/**
 * Handle match state update
 */
function handleMatchStateUpdate(socket, io) {
  socket.on("updateMatchState", (data) => {
    try {
      if (socket.checkRateLimit) {
        const rate = socket.checkRateLimit('matchStateUpdate');
        if (!rate.allowed) {
          return;
        }
      }

      const { roomCode, matchState } = data;
      const codeValidation = validateRoomCode(roomCode);
      if (!codeValidation.valid) {
        console.error(`❌ Invalid room code in updateMatchState:`, codeValidation.error);
        return;
      }
      const room = rooms.get(codeValidation.code);
      if (!room) {
        console.error(`❌ Room not found in updateMatchState: ${codeValidation.code}`);
        return;
      }
      if (!isRoomHost(room, socket.id) && !isRoomMember(room, socket.id)) {
        console.error(`❌ Unauthorized match state update from ${socket.id} in ${codeValidation.code}`);
        return;
      }
      const validation = validateMatchState(matchState);
      if (!validation.valid) {
        console.error(`❌ Invalid match state in ${codeValidation.code}:`, validation.error);
        return;
      }

      updateRoomActivity(codeValidation.code);

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

      room.matchState = validation.matchState;

      // Broadcast to all players in room
      io.to(codeValidation.code).emit("matchStateUpdated", {
        roomCode: codeValidation.code,
        matchState: validation.matchState,
      });

      console.log(
        `📊 Match state updated in ${codeValidation.code} - Score: ${validation.matchState.score}/${validation.matchState.wickets}, Balls: ${validation.matchState.ballsBowled}`
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
      const codeValidation = validateRoomCode(code);
      if (!codeValidation.valid) {
        console.error(`❌ Invalid room code in tossResult:`, codeValidation.error);
        return;
      }
      const room = rooms.get(codeValidation.code);

      if (!room || !isRoomHost(room, socket.id)) return;

      console.log(`🪙 Toss result in ${codeValidation.code}: ${winner} won and chose to ${choice}`);
      io.to(codeValidation.code).emit("tossResultBroadcast", { winner, choice });
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
      const codeValidation = validateRoomCode(code);
      if (!codeValidation.valid) {
        console.error(`❌ Invalid room code in inningsBreak:`, codeValidation.error);
        return;
      }
      const room = rooms.get(codeValidation.code);

      if (!room || !isRoomHost(room, socket.id)) return;

      console.log(`🔄 Innings break in ${codeValidation.code}`);
      io.to(codeValidation.code).emit("inningsBreakBroadcast");
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
      const codeValidation = validateRoomCode(code);
      if (!codeValidation.valid) {
        console.error(`❌ Invalid room code in matchEnd:`, codeValidation.error);
        return;
      }
      const room = rooms.get(codeValidation.code);

      if (!room || !isRoomHost(room, socket.id)) return;

      console.log(`🏁 Match ended in ${codeValidation.code}:`, result);
      io.to(codeValidation.code).emit("matchEndBroadcast", { result });
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

// server/controllers/auctionController.js

const { validateRoomCode, validateBidAmount } = require("../utils/validation");
const { rooms, updateRoomActivity } = require("../utils/roomManager");
const { isRoomMember } = require("../utils/socketGuards");

const AUCTION_CONFIG = {
  TOTAL_PURSE: 1000,
  BID_TIMER: 10,
  SOLD_OVERLAY_MS: 3500,
  UNSOLD_DELAY_MS: 500,
  SQUAD_MAX: 25,
  MAX_OVERSEAS: 8,
};

function getBidIncrement(currentBidInLakhs) {
  if (currentBidInLakhs < 100) return 5;
  if (currentBidInLakhs < 500) return 25;
  return 50;
}

function createLogEntry(message, type = "info") {
  return {
    message,
    type,
    timestamp: new Date(),
  };
}

function createBidHistoryEntry(team, player, bid) {
  return {
    teamId: team?.id,
    socketId: team?.socketId,
    teamName: team?.iplTeamId || team?.name || "Team",
    playerId: player?.id,
    playerName: player?.name,
    bid,
    timestamp: new Date(),
  };
}

function createInitialAuctionTeams(teams = []) {
  return teams.map((team) => ({
    ...team,
    squad: [],
    purse: AUCTION_CONFIG.TOTAL_PURSE,
    overseasCount: 0,
    roleBalance: { batters: 0, bowlers: 0, allrounders: 0, wicketkeepers: 0 },
    isValid: true,
  }));
}

function getTeamRoleBalance(squad = []) {
  return squad.reduce(
    (acc, player) => {
      const role = String(player?.role || "").toLowerCase().replace(/[\s_-]+/g, "");
      if (role.includes("wicketkeeper") || role === "wk" || role.includes("keeper")) acc.wicketkeepers += 1;
      else if (role.includes("allrounder") || role.includes("allround")) acc.allrounders += 1;
      else if (role.includes("bowl")) acc.bowlers += 1;
      else acc.batters += 1;
      return acc;
    },
    { batters: 0, bowlers: 0, allrounders: 0, wicketkeepers: 0 }
  );
}

function validateTeamComposition(team) {
  return {
    isValid:
      Array.isArray(team?.squad) &&
      team.squad.length <= AUCTION_CONFIG.SQUAD_MAX &&
      (team.overseasCount || 0) <= AUCTION_CONFIG.MAX_OVERSEAS,
  };
}

function serializeAuctionState(state) {
  if (!state) return null;

  return {
    phase: state.phase,
    biddingStage: state.biddingStage,
    queue: state.queue,
    fullQueue: state.fullQueue,
    unsold: state.unsold,
    currentPlayer: state.currentPlayer,
    currentBid: state.currentBid,
    basePrice: state.basePrice,
    currentBidder: state.currentBidder,
    currentBidPlayerId: state.currentBidPlayerId,
    timer: state.timer,
    bidError: null,
    soldPlayers: state.soldPlayers,
    auctionLog: state.auctionLog,
    bidHistory: state.bidHistory,
    lastSoldPlayer: state.lastSoldPlayer,
    showSoldOverlay: state.showSoldOverlay,
    auctionTeams: state.auctionTeams,
  };
}

function emitAuctionState(io, code) {
  const room = rooms.get(code);
  if (!room?.auctionState) return;
  io.to(code).emit("auctionStateSync", serializeAuctionState(room.auctionState));
}

function clearAuctionTimers(room) {
  if (!room?.auctionState) return;

  if (room.auctionState.tickTimeout) {
    clearTimeout(room.auctionState.tickTimeout);
    room.auctionState.tickTimeout = null;
  }

  if (room.auctionState.transitionTimeout) {
    clearTimeout(room.auctionState.transitionTimeout);
    room.auctionState.transitionTimeout = null;
  }
}

function getRoomAndAuctionState(code) {
  const room = rooms.get(code);
  if (!room?.auctionState) {
    return { room, state: null };
  }
  return { room, state: room.auctionState };
}

function advanceToNextPlayer(code, io) {
  const { room, state } = getRoomAndAuctionState(code);
  if (!room || !state) return;

  clearAuctionTimers(room);
  state.showSoldOverlay = false;
  state.lastSoldPlayer = null;

  const nextPlayer = state.queue.shift() || null;
  if (!nextPlayer) {
    state.phase = "completed";
    state.currentPlayer = null;
    state.currentBid = 0;
    state.basePrice = 0;
    state.currentBidder = null;
    state.currentBidPlayerId = null;
    state.timer = 0;
    state.biddingStage = "IDLE";
    emitAuctionState(io, code);
    return;
  }

  const basePrice = nextPlayer.basePrice || 0;
  state.phase = "running";
  state.currentPlayer = nextPlayer;
  state.currentBid = basePrice;
  state.basePrice = basePrice;
  state.currentBidder = null;
  state.currentBidPlayerId = nextPlayer.id;
  state.timer = AUCTION_CONFIG.BID_TIMER;
  state.biddingStage = "PLAYER_ANNOUNCED";
  state.auctionLog = [
    createLogEntry(`${nextPlayer.name} is up for auction - Base price Rs ${basePrice}L`, "player"),
    ...state.auctionLog.slice(0, 99),
  ];

  emitAuctionState(io, code);
  scheduleAuctionTick(code, io);
}

function settleCurrentPlayer(code, io) {
  const { room, state } = getRoomAndAuctionState(code);
  if (!room || !state || !state.currentPlayer) return;

  clearAuctionTimers(room);

  const player = state.currentPlayer;
  if (state.currentBidder) {
    const teamId = state.currentBidder;
    const price = state.currentBid;
    state.biddingStage = "SOLD";
    state.showSoldOverlay = true;
    state.lastSoldPlayer = { player, teamId, price };

    state.auctionTeams = state.auctionTeams.map((team) => {
      if (team.id !== teamId) return team;

      const updatedSquad = [...team.squad, { ...player, soldPrice: price }];
      const overseasCount = updatedSquad.filter((p) => p.isOverseas).length;
      const updatedTeam = {
        ...team,
        squad: updatedSquad,
        purse: team.purse - price,
        overseasCount,
        roleBalance: getTeamRoleBalance(updatedSquad),
      };
      updatedTeam.isValid = validateTeamComposition(updatedTeam).isValid;
      return updatedTeam;
    });

    const soldTeam = state.auctionTeams.find((team) => team.id === teamId);
    state.soldPlayers = [
      ...state.soldPlayers,
      { player, team: soldTeam, price },
    ];
    state.auctionLog = [
      createLogEntry(
        `${player.name} (${player.role || "player"}) sold for Rs ${price}L to ${soldTeam?.iplTeamId || teamId}`,
        "sold"
      ),
      ...state.auctionLog.slice(0, 99),
    ];
  } else {
    state.biddingStage = "UNSOLD";
    state.showSoldOverlay = false;
    state.lastSoldPlayer = null;
    state.unsold = [...state.unsold, player];
    state.auctionLog = [
      createLogEntry(`❌ ${player.name} - UNSOLD`, "unsold"),
      ...state.auctionLog.slice(0, 99),
    ];
  }

  state.currentBidder = null;
  state.currentBidPlayerId = null;
  state.timer = 0;
  emitAuctionState(io, code);

  const delay = state.showSoldOverlay
    ? AUCTION_CONFIG.SOLD_OVERLAY_MS
    : AUCTION_CONFIG.UNSOLD_DELAY_MS;

  state.transitionTimeout = setTimeout(() => {
    advanceToNextPlayer(code, io);
  }, delay);
}

function scheduleAuctionTick(code, io) {
  const { room, state } = getRoomAndAuctionState(code);
  if (!room || !state || state.phase !== "running" || !state.currentPlayer) {
    return;
  }

  clearAuctionTimers(room);
  state.tickTimeout = setTimeout(() => {
    const next = getRoomAndAuctionState(code);
    if (!next.room || !next.state || next.state.phase !== "running" || !next.state.currentPlayer) {
      return;
    }

    next.state.timer = Math.max(0, next.state.timer - 1);

    if (next.state.timer <= 1) {
      next.state.biddingStage = "GOING_TWICE";
    } else if (next.state.timer <= 3) {
      next.state.biddingStage = "GOING_ONCE";
    }

    if (next.state.timer === 0) {
      settleCurrentPlayer(code, io);
      return;
    }

    emitAuctionState(io, code);
    scheduleAuctionTick(code, io);
  }, 1000);
}

function validateAuctionBid(state, teamId, bidAmount, playerId) {
  if (!state || state.phase !== "running" || !state.currentPlayer) {
    return { valid: false, error: "Auction is not currently running" };
  }

  if (playerId && playerId !== state.currentPlayer.id) {
    return { valid: false, error: "That player is no longer active" };
  }

  const team = state.auctionTeams.find((candidate) => candidate.id === teamId);
  if (!team) {
    return { valid: false, error: "Team not found" };
  }

  if (state.currentBidder === teamId) {
    return { valid: false, error: "Wait for another team to bid" };
  }

  if (
    state.biddingStage !== "PLAYER_ANNOUNCED" &&
    state.biddingStage !== "BIDDING_ACTIVE" &&
    state.biddingStage !== "GOING_ONCE" &&
    state.biddingStage !== "GOING_TWICE"
  ) {
    return { valid: false, error: "Bidding is not active" };
  }

  const expectedBid = state.currentBid + getBidIncrement(state.currentBid);
  if (bidAmount !== expectedBid) {
    return { valid: false, error: `Next valid bid is Rs ${expectedBid}L` };
  }

  if (bidAmount > team.purse) {
    return { valid: false, error: `Insufficient purse. Available: Rs ${team.purse}L` };
  }

  if ((team.squad?.length || 0) >= AUCTION_CONFIG.SQUAD_MAX) {
    return { valid: false, error: "Squad is full" };
  }

  if (state.currentPlayer?.isOverseas && (team.overseasCount || 0) >= AUCTION_CONFIG.MAX_OVERSEAS) {
    return { valid: false, error: "Overseas limit reached" };
  }

  return { valid: true };
}

function isRoomMemberInAuction(room, socketId) {
  return room?.players?.some((player) => player.socketId === socketId);
}

/**
 * Handle auction page navigation
 */
function handleStartAuction(socket, io) {
  socket.on("startAuction", (data) => {
    try {
      const { code } = data || {};
      const room = rooms.get(code);

      if (!room || room.host !== socket.id) return;

      io.to(code).emit("startAuction");
      console.log(`🔨 Auction page opened in room ${code}`);
    } catch (error) {
      console.error("❌ Error in startAuction:", error);
    }
  });
}

/**
 * Initialize canonical auction state on the server
 */
function handleAuctionInitialize(socket, io) {
  socket.on("auctionInitialize", (data, callback) => {
    try {
      const { code, queue = [], teams = [] } = data || {};
      const codeValidation = validateRoomCode(code);
      if (!codeValidation.valid) {
        callback?.({ success: false, error: codeValidation.error });
        return;
      }

      const room = rooms.get(codeValidation.code);
      if (!room) {
        callback?.({ success: false, error: "Room not found" });
        return;
      }

      if (room.host !== socket.id) {
        callback?.({ success: false, error: "Only the host can start the auction" });
        return;
      }

      if (room.auctionState?.phase === "running" || room.auctionState?.phase === "paused") {
        callback?.({
          success: true,
          state: serializeAuctionState(room.auctionState),
        });
        emitAuctionState(io, codeValidation.code);
        return;
      }

      updateRoomActivity(codeValidation.code);
      clearAuctionTimers(room);

      room.auctionState = {
        phase: "running",
        biddingStage: "IDLE",
        queue: Array.isArray(queue) ? [...queue] : [],
        fullQueue: Array.isArray(queue) ? [...queue] : [],
        unsold: [],
        currentPlayer: null,
        currentBid: 0,
        basePrice: 0,
        currentBidder: null,
        currentBidPlayerId: null,
        timer: 0,
        soldPlayers: [],
        auctionLog: [createLogEntry("Auction initialized!", "system")],
        bidHistory: [],
        lastSoldPlayer: null,
        showSoldOverlay: false,
        auctionTeams: createInitialAuctionTeams(teams),
        tickTimeout: null,
        transitionTimeout: null,
      };

      console.log(`📋 Auction initialized in ${codeValidation.code}: ${queue.length} players, ${teams.length} teams`);
      advanceToNextPlayer(codeValidation.code, io);
      callback?.({ success: true });
    } catch (error) {
      console.error("❌ Error in auctionInitialize:", error);
      callback?.({ success: false, error: error.message });
    }
  });
}

/**
 * Return the latest authoritative state to a client
 */
function handleAuctionStateRequest(socket) {
  socket.on("requestAuctionState", (data, callback) => {
    try {
      const codeValidation = validateRoomCode(data?.code);
      if (!codeValidation.valid) {
        callback?.({ success: false, error: codeValidation.error });
        return;
      }

      const room = rooms.get(codeValidation.code);
      if (!room) {
        callback?.({ success: false, error: "Room not found" });
        return;
      }

      if (!isRoomMember(room, socket.id)) {
        callback?.({ success: false, error: "You are not part of this room" });
        return;
      }

      callback?.({
        success: true,
        state: serializeAuctionState(room.auctionState),
      });
    } catch (error) {
      console.error("❌ Error in requestAuctionState:", error);
      callback?.({ success: false, error: error.message });
    }
  });
}

/**
 * Handle canonical auction bids
 */
function handleAuctionBid(socket, io) {
  socket.on("auctionBid", (data, callback) => {
    try {
      if (socket.checkRateLimit) {
        const rate = socket.checkRateLimit("bid");
        if (!rate.allowed) {
          callback?.({ success: false, error: `Rate limited. Retry after ${rate.retryAfterMs}ms` });
          return;
        }
      }

      const codeValidation = validateRoomCode(data?.code);
      if (!codeValidation.valid) {
        callback?.({ success: false, error: codeValidation.error });
        return;
      }

      const bidValidation = validateBidAmount(data?.bid);
      if (!bidValidation.valid) {
        callback?.({ success: false, error: bidValidation.error });
        return;
      }

      const code = codeValidation.code;
      const room = rooms.get(code);
      if (!room) {
        callback?.({ success: false, error: "Room not found" });
        return;
      }

      if (!isRoomMember(room, socket.id)) {
        callback?.({ success: false, error: "You are not part of this room" });
        return;
      }

      if (data?.teamId !== socket.id) {
        callback?.({ success: false, error: "Invalid team for bidder" });
        return;
      }

      const state = room.auctionState;
      const validation = validateAuctionBid(state, data.teamId, bidValidation.bid, data?.playerId);
      if (!validation.valid) {
        callback?.({ success: false, error: validation.error });
        return;
      }

      updateRoomActivity(code);
      clearAuctionTimers(room);

      state.currentBid = bidValidation.bid;
      state.currentBidder = data.teamId;
      state.currentBidPlayerId = state.currentPlayer.id;
      state.timer = AUCTION_CONFIG.BID_TIMER;
      state.biddingStage = "BIDDING_ACTIVE";

      const bidderTeam = state.auctionTeams.find((team) => team.id === data.teamId);
      state.bidHistory = [
        createBidHistoryEntry(bidderTeam, state.currentPlayer, bidValidation.bid),
        ...(state.bidHistory || []).slice(0, 49),
      ];
      state.auctionLog = [
        createLogEntry(`${bidderTeam?.iplTeamId || data.teamId} bid Rs ${bidValidation.bid}L for ${state.currentPlayer.name}`, "bid"),
        ...state.auctionLog.slice(0, 99),
      ];

      console.log(`Canonical bid in ${code}: ${bidderTeam?.iplTeamId || data.teamId} -> Rs ${bidValidation.bid}L`);
      emitAuctionState(io, code);
      scheduleAuctionTick(code, io);
      callback?.({ success: true });
    } catch (error) {
      console.error("❌ Error in auctionBid:", error);
      callback?.({ success: false, error: error.message });
    }
  });
}

function handleAuctionControl(socket, io) {
  socket.on("auctionControl", (data, callback) => {
    try {
      const codeValidation = validateRoomCode(data?.code);
      if (!codeValidation.valid) {
        callback?.({ success: false, error: codeValidation.error });
        return;
      }

      const action = data?.action;
      const code = codeValidation.code;
      const room = rooms.get(code);
      if (!room) {
        callback?.({ success: false, error: "Room not found" });
        return;
      }

      if (room.host !== socket.id) {
        callback?.({ success: false, error: "Only the host can control the auction" });
        return;
      }

      const state = room.auctionState;
      if (!state) {
        callback?.({ success: false, error: "Auction has not started" });
        return;
      }

      const isSettling = state.biddingStage === "SOLD" || state.biddingStage === "UNSOLD";
      if ((action === "pause" || action === "skip" || action === "accelerate") && isSettling) {
        callback?.({ success: false, error: "Current player is already being settled" });
        return;
      }

      updateRoomActivity(code);

      if (action === "pause") {
        if (state.phase !== "running") {
          callback?.({ success: false, error: "Auction is not running" });
          return;
        }

        clearAuctionTimers(room);
        state.phase = "paused";
        state.auctionLog = [
          createLogEntry("Auction paused by host", "system"),
          ...state.auctionLog.slice(0, 99),
        ];
        emitAuctionState(io, code);
        callback?.({ success: true });
        return;
      }

      if (action === "resume") {
        if (state.phase !== "paused") {
          callback?.({ success: false, error: "Auction is not paused" });
          return;
        }

        state.phase = "running";
        state.auctionLog = [
          createLogEntry("Auction resumed by host", "system"),
          ...state.auctionLog.slice(0, 99),
        ];
        emitAuctionState(io, code);
        scheduleAuctionTick(code, io);
        callback?.({ success: true });
        return;
      }

      if (action === "skip") {
        if (!state.currentPlayer || (state.phase !== "running" && state.phase !== "paused")) {
          callback?.({ success: false, error: "No active player to settle" });
          return;
        }

        state.phase = "running";
        settleCurrentPlayer(code, io);
        callback?.({ success: true });
        return;
      }

      if (action === "accelerate") {
        if (state.phase !== "running" || !state.currentPlayer) {
          callback?.({ success: false, error: "Auction is not running" });
          return;
        }

        clearAuctionTimers(room);
        state.timer = Math.min(Math.max(state.timer || 1, 1), 3);
        state.biddingStage = state.timer <= 1 ? "GOING_TWICE" : "GOING_ONCE";
        state.auctionLog = [
          createLogEntry("Auction clock accelerated by host", "system"),
          ...state.auctionLog.slice(0, 99),
        ];
        emitAuctionState(io, code);
        scheduleAuctionTick(code, io);
        callback?.({ success: true });
        return;
      }

      callback?.({ success: false, error: "Unknown auction control" });
    } catch (error) {
      console.error("Error in auctionControl:", error);
      callback?.({ success: false, error: error.message });
    }
  });
}

/**
 * Initialize all auction-related socket handlers
 */
function initializeAuctionHandlers(socket, io) {
  handleStartAuction(socket, io);
  handleAuctionInitialize(socket, io);
  handleAuctionStateRequest(socket);
  handleAuctionBid(socket, io);
  handleAuctionControl(socket, io);
}

module.exports = {
  initializeAuctionHandlers,
  clearAuctionTimers,
};

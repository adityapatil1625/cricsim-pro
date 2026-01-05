/**
 * Socket event constants - Centralized list of all Socket.IO events
 * This prevents typos and makes it easy to see all socket communication
 */

export const SOCKET_EVENTS = {
  // Room Management
  CREATE_ROOM: "createRoom",
  JOIN_ROOM: "joinRoom",
  ROOM_UPDATE: "roomUpdate",
  
  // Team Management
  TEAM_UPDATE: "teamUpdate",
  TOURNAMENT_TEAM_UPDATE: "tournamentTeamUpdate",
  UPDATE_TEAM_PLAYERS: "updateTeamPlayers",
  SELECT_IPL_TEAM: "selectIPLTeam",
  
  // Navigation
  NAVIGATE_TO_QUICK_SETUP: "navigateToQuickSetup",
  NAVIGATE_TO_TOURNAMENT_SETUP: "navigateToTournamentSetup",
  NAVIGATE_TO_TOURNAMENT_HUB: "navigateToTournamentHub",
  
  // Tournament
  GENERATE_TOURNAMENT_FIXTURES: "generateTournamentFixtures",
  TOURNAMENT_FIXTURES_GENERATED: "tournamentFixturesGenerated",
  TOURNAMENT_START_ERROR: "tournamentStartError",
  TOURNAMENT_RESULTS_UPDATE: "tournamentResultsUpdate",
  
  // Auction
  START_AUCTION: "startAuction",
  AUCTION_BID: "auctionBid",
  AUCTION_PLAYER_SOLD: "auctionPlayerSold",
  AUCTION_PLAYER_UNSOLD: "auctionPlayerUnsold",
  AUCTION_STATE_UPDATE: "auctionStateUpdate",
  AUCTION_TIMER_UPDATE: "auctionTimerUpdate",
  AUCTION_NEXT_PLAYER: "auctionNextPlayer",
  AUCTION_PASS: "auctionPass",
  SELECT_IPL_TEAM_AUCTION: "selectIPLTeamAuction",
  TOGGLE_PLAYER_READY: "togglePlayerReady",
  PLAYER_READY_UPDATE: "playerReadyUpdate",
  
  // Toss & Match Start
  BROADCAST_TOSS: "broadcastToss",
  RECEIVE_TOSS: "receiveToss",
  START_MATCH: "startMatch",
  MATCH_STARTED: "matchStarted",
  
  // Match Events
  UPDATE_MATCH_STATE: "updateMatchState",
  MATCH_STATE_UPDATED: "matchStateUpdated",
  MATCH_STATE_UPDATE: "matchStateUpdate",
  BALL_BOWLED: "ballBowled",
  OVER_SKIPPED: "overSkipped",
  INNINGS_CHANGED: "inningsChanged",
  MATCH_ENDED: "matchEnded",
  END_ONLINE_MATCH: "endOnlineMatch",
};

export default SOCKET_EVENTS;

/**
 * appConstants.js - Central constants used throughout the app
 * Extracted from App.jsx to reduce clutter and improve maintainability
 */

export const IPL_TEAMS = [
  { id: "MI", name: "Mumbai Indians", color: "#004BA0", logo: "https://scores.iplt20.com/ipl/teamlogos/MI.png" },
  { id: "CSK", name: "Chennai Super Kings", color: "#FDB913", logo: "https://scores.iplt20.com/ipl/teamlogos/CSK.png" },
  { id: "RCB", name: "Royal Challengers Bangalore", color: "#EC1C24", logo: "https://scores.iplt20.com/ipl/teamlogos/RCB.png" },
  { id: "KKR", name: "Kolkata Knight Riders", color: "#3A225D", logo: "https://scores.iplt20.com/ipl/teamlogos/KKR.png" },
  { id: "DC", name: "Delhi Capitals", color: "#004C93", logo: "https://scores.iplt20.com/ipl/teamlogos/DC.png" },
  { id: "PBKS", name: "Punjab Kings", color: "#ED1B24", logo: "https://scores.iplt20.com/ipl/teamlogos/PBKS.png" },
  { id: "RR", name: "Rajasthan Royals", color: "#254AA5", logo: "https://scores.iplt20.com/ipl/teamlogos/RR.png" },
  { id: "SRH", name: "Sunrisers Hyderabad", color: "#FF822A", logo: "https://scores.iplt20.com/ipl/teamlogos/SRH.png" },
  { id: "LSG", name: "Lucknow Super Giants", color: "#1C4595", logo: "https://scores.iplt20.com/ipl/teamlogos/LSG.png" },
  { id: "GT", name: "Gujarat Titans", color: "#1C2E4A", logo: "https://scores.iplt20.com/ipl/teamlogos/GT.png" }
];

export const VIEW_TO_PATH = {
  menu: "/",
  quick_setup: "/quick-setup",
  tourn_setup: "/tournament/setup",
  tourn_draft: "/tournament/draft",
  tourn_hub: "/tournament/hub",
  online_entry: "/online",
  online_menu: "/online/lobby",
  match: "/match",
  match_over: "/match/over",
  match_summary: "/match/summary",
  auction_lobby: "/auction/lobby",
  auction: "/auction/room",
};

export const TOURNAMENT_PHASES = {
  LEAGUE: "league",
  SEMI: "semi",
  FINAL: "final",
  COMPLETE: "complete",
};

export const ONLINE_GAME_TYPES = {
  QUICK: "quick",
  TOURNAMENT: "tournament",
  AUCTION: "auction",
};

export const MATCH_TABS = {
  LIVE: "live",
  SCORECARD: "scorecard",
  COMMENTARY: "commentary",
  RESULTS: "results",
};

export default {
  IPL_TEAMS,
  VIEW_TO_PATH,
  TOURNAMENT_PHASES,
  ONLINE_GAME_TYPES,
  MATCH_TABS,
};

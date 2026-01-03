import { IPL_TEAMS } from "../constants/appConstants";

/**
 * appUtils.js - Extracted utility functions from App.jsx
 * These helper functions are used throughout the application
 * Organizing them separately improves code clarity and testability
 */

/**
 * Capitalize the first letter of a string
 */
export const capitalizeFirstLetter = (str) => {
  if (!str || typeof str !== 'string') return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
};

/**
 * Generate a unique ID for instances (players in teams, etc.)
 */
export const generateId = () => Math.random().toString(36).slice(2);

/**
 * Get team display info (name, logo, color) from a team object
 * Handles both local teams and IPL teams
 */
export const getTeamDisplay = (team) => {
  if (!team) return { name: "Unknown", logo: null, color: "#666" };
  const iplTeam = IPL_TEAMS.find(t => t.id === team.iplTeamId);
  return {
    name: iplTeam ? iplTeam.name : team.name,
    logo: iplTeam ? iplTeam.logo : null,
    color: iplTeam ? iplTeam.color : "#666",
    shortName: iplTeam ? iplTeam.id : team.name
  };
};

/**
 * Process a player pool - merge, deduplicate, and clean data
 * Used to combine mock database with IPL data
 */
export const buildPlayerPool = (mockPlayers, iplPlayers) => {
  const merged = [...iplPlayers, ...mockPlayers];
  const seen = new Set();
  return merged.filter((p) => {
    if (!p || !p.name) return false;
    const key = p.name.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

/**
 * Initialize team object with default structure
 */
export const initializeTeam = (id, name, iplTeamId = null) => ({
  id,
  name,
  iplTeamId,
  players: [],
  played: 0,
  won: 0,
  pts: 0,
  nrr: 0,
  runsScored: 0,
  oversFaced: 0,
  runsConceded: 0,
  oversBowled: 0,
});

/**
 * Create reverse mapping from paths to view states
 * Inverse of VIEW_TO_PATH
 */
export const createPathToViewMap = (viewToPath) => {
  return Object.entries(viewToPath).reduce((acc, [key, value]) => {
    acc[value] = key;
    return acc;
  }, {});
};

/**
 * Auto-draft a complete squad from available players
 * Picks 4 batters, 3 all-rounders, 4 bowlers, 1 from remaining
 */
export const autoDraftSquad = (playerPool) => {
  if (playerPool.length < 11) {
    return null; // Not enough players
  }

  const shuffled = [...playerPool].sort(() => Math.random() - 0.5);
  const bats = shuffled.filter((p) => p.role === "Bat");
  const alls = shuffled.filter((p) => p.role === "All");
  const bowls = shuffled.filter((p) => p.role === "Bowl");

  const usedIds = new Set();

  const pickFrom = (arr, count) => {
    const result = [];
    for (let i = 0; i < arr.length && result.length < count; i++) {
      const p = arr[i];
      if (!p || usedIds.has(p.id)) continue;
      usedIds.add(p.id);
      result.push(p);
    }
    return result;
  };

  let squad = [];
  squad = squad.concat(pickFrom(bats, 4));
  squad = squad.concat(pickFrom(alls, 3));
  squad = squad.concat(pickFrom(bowls, 4));

  const remainingPool = shuffled.filter((p) => !usedIds.has(p.id));
  for (let i = 0; i < remainingPool.length && squad.length < 11; i++) {
    const p = remainingPool[i];
    usedIds.add(p.id);
    squad.push(p);
  }

  return squad.slice(0, 11).map((p) => ({
    ...p,
    instanceId: generateId(),
  }));
};

/**
 * Check if a player is already in a team
 */
export const isPlayerInTeam = (team, playerId) => {
  return team.players.some((p) => p.id === playerId);
};

/**
 * Calculate tournament standings from fixtures and team stats
 * Sorts by points (descending), then NRR (descending)
 */
export const getLeaderboard = (teams) => {
  return [...teams].sort((a, b) => {
    if (b.pts !== a.pts) return b.pts - a.pts;
    return (b.nrr || 0) - (a.nrr || 0);
  });
};

/**
 * Get knockout teams (1st vs 4th, 2nd vs 3rd, etc.)
 */
export const generateSemiFinals = (leaderboard) => {
  const fixtures = [
    {
      id: `semi-1`,
      t1: leaderboard[0].id,
      t2: leaderboard[3].id,
      played: false,
      stage: "semi"
    },
    {
      id: `semi-2`,
      t1: leaderboard[1].id,
      t2: leaderboard[2].id,
      played: false,
      stage: "semi"
    }
  ];
  return fixtures;
};

/**
 * Generate final fixture from semi winners
 */
export const generateFinal = (semi1Winner, semi2Winner) => {
  return [{
    id: `final-1`,
    t1: semi1Winner,
    t2: semi2Winner,
    played: false,
    stage: "final"
  }];
};

export default {
  generateId,
  getTeamDisplay,
  buildPlayerPool,
  initializeTeam,
  createPathToViewMap,
  autoDraftSquad,
  isPlayerInTeam,
  getLeaderboard,
  generateSemiFinals,
  generateFinal,
};

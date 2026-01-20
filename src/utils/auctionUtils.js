/**
 * auctionUtils.js
 * Consolidated auction utility functions for auction system
 * Includes: config, bid calculations, team validation, squad management, logging
 */

// Auction configuration constants
export const AUCTION_CONFIG = {
  SQUAD_MIN: 18,
  SQUAD_MAX: 25,
  MAX_OVERSEAS: 8,
  TOTAL_PURSE: 90, // ₹90 crore per team (IPL Mega Auction standard)
  BASE_PRICE: 20,
  INITIAL_TIMER: 10,
  BID_TIMER: 10,
  SOLD_TIMER: 3,
};

// ===== AUCTION SET DEFINITIONS (from auctionSets.js) =====
export const AUCTION_SETS = {
  MARQUEE: {
    id: 'MARQUEE',
    name: 'Marquee Players',
    emoji: '👑',
    description: 'Stars, captains, MVPs, international icons',
    basePriceRange: { min: 150, max: 200 },
    maxAllowed: 200,
    order: 1,
  },
  CAPPED_INDIAN: {
    id: 'CAPPED_INDIAN',
    name: 'Capped Indian Players',
    emoji: '🇮🇳',
    description: 'Represented India internationally, role-based',
    basePriceRange: { min: 50, max: 100 },
    maxAllowed: 100,
    order: 2,
  },
  OVERSEAS: {
    id: 'OVERSEAS',
    name: 'Overseas Players',
    emoji: '🌍',
    description: 'International capped players',
    basePriceRange: { min: 50, max: 200 },
    maxAllowed: 200,
    order: 3,
  },
  UNCAPPED_INDIAN: {
    id: 'UNCAPPED_INDIAN',
    name: 'Uncapped Indian Players',
    emoji: '🔓',
    description: 'Domestic talents, IPL debutants, U-19 stars',
    basePriceRange: { min: 20, max: 40 },
    maxAllowed: 40,
    order: 4,
  },
  ACCELERATED: {
    id: 'ACCELERATED',
    name: 'Accelerated Round',
    emoji: '⚡',
    description: 'Unsold players, fast-tracked bidding',
    basePriceRange: { min: 20, max: 200 },
    maxAllowed: 200,
    order: 5,
  },
};

// Player roles (from auctionEnhanced.js)
export const PLAYER_ROLES = {
  BATTER: 'batter',
  BOWLER: 'bowler',
  ALLROUNDER: 'allrounder',
  WICKETKEEPER: 'wicketkeeper',
};

/**
 * Calculate bid increment based on current bid amount
 * Increments increase as bids get higher
 */
export const getBidIncrement = (currentBid) => {
  if (currentBid < 50) return 5;
  if (currentBid < 100) return 10;
  if (currentBid < 200) return 20;
  if (currentBid < 500) return 25;
  return 50;
};

/**
 * Get next available bid amount
 */
export const getNextBid = (currentBid, count = 1) => {
  const increment = getBidIncrement(currentBid);
  return currentBid + increment * count;
};

/**
 * Generate available bids for a team
 */
export const generateAvailableBids = (currentBid, team, squadMax = AUCTION_CONFIG.SQUAD_MAX) => {
  const increment = getBidIncrement(currentBid);
  const available = [];
  
  for (let i = 1; i <= 5; i++) {
    const bid = currentBid + increment * i;
    
    // Check if team can bid this amount
    if (team && bid <= team.purse && team.squad.length < squadMax) {
      available.push(bid);
    }
  }
  
  return available;
};

/**
 * Validate if a team can bid an amount
 */
export const canTeamBid = (team, bidAmount, squadMax = AUCTION_CONFIG.SQUAD_MAX) => {
  if (!team) return false;
  
  // Check purse
  if (bidAmount > team.purse) return false;
  
  // Check squad size
  if (team.squad && team.squad.length >= squadMax) return false;
  
  // Check remaining purse for minimum squad requirements
  const remainingSlots = AUCTION_CONFIG.SQUAD_MAX - (team.squad?.length || 0);
  const avgPrice = 20; // Approximate average price
  const minRequiredPurse = remainingSlots * avgPrice;
  
  return team.purse - bidAmount >= minRequiredPurse;
};

/**
 * Process a sold player
 */
export const processSoldPlayer = (player, team, price, auctionTeams) => {
  return auctionTeams.map(t => {
    if (t.id === team.id) {
      return {
        ...t,
        squad: [...(t.squad || []), { ...player, soldPrice: price }],
        purse: t.purse - price,
      };
    }
    return t;
  });
};

/**
 * Initialize auction teams with default values
 */
export const initializeAuctionTeams = (teams) => {
  return teams.map(team => ({
    ...team,
    squad: [],
    purse: AUCTION_CONFIG.TOTAL_PURSE, // Remaining purse (₹90Cr)
    remainingPurse: AUCTION_CONFIG.TOTAL_PURSE,
    totalSpent: 0, // Total amount spent so far
    overseasCount: 0,
  }));
};

/**
 * Shuffle player pool for auction
 */
export const shufflePlayerPool = (players) => {
  const shuffled = [...players];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

/**
 * Check if squad is valid (meets minimum/maximum requirements)
 */
export const validateSquad = (squad, squadSize = AUCTION_CONFIG.SQUAD_MAX) => {
  return {
    isValid: squad.length >= AUCTION_CONFIG.SQUAD_MIN && squad.length <= squadSize,
    errors: [
      squad.length < AUCTION_CONFIG.SQUAD_MIN && `Squad too small (${squad.length}/${AUCTION_CONFIG.SQUAD_MIN})`,
      squad.length > squadSize && `Squad too large (${squad.length}/${squadSize})`,
    ].filter(Boolean),
  };
};

/**
 * Get squad composition stats
 */
export const getSquadStats = (squad) => {
  const roles = {};
  const nationalities = {};
  
  squad.forEach(player => {
    // Count by role
    roles[player.role] = (roles[player.role] || 0) + 1;
    
    // Count overseas vs domestic
    const isOverseas = player.nationality && player.nationality !== 'Indian';
    nationalities[isOverseas ? 'overseas' : 'domestic'] = 
      (nationalities[isOverseas ? 'overseas' : 'domestic'] || 0) + 1;
  });
  
  return {
    totalPlayers: squad.length,
    roles,
    overseas: nationalities.overseas || 0,
    domestic: nationalities.domestic || 0,
    totalCost: squad.reduce((sum, p) => sum + (p.soldPrice || 0), 0),
  };
};

/**
 * Get team status summary
 */
export const getTeamStatus = (team) => {
  const stats = getSquadStats(team.squad || []);
  const remaining = AUCTION_CONFIG.TOTAL_PURSE - team.purse;
  
  return {
    name: team.name,
    squadSize: stats.totalPlayers,
    squadMaxed: stats.totalPlayers >= AUCTION_CONFIG.SQUAD_MAX,
    overseas: stats.overseas,
    overseasMaxed: stats.overseas >= AUCTION_CONFIG.MAX_OVERSEAS,
    purseRemaining: team.purse,
    purseUsed: remaining,
    pursePercentage: (remaining / AUCTION_CONFIG.TOTAL_PURSE) * 100,
    avgPlayerPrice: stats.totalCost / (stats.totalPlayers || 1),
  };
};

/**
 * Generate auction log message
 */
export const generateLogMessage = (type, data) => {
  const messages = {
    init: () => '🎬 Auction initialized!',
    start: () => '⚡ Auction started',
    playerUp: () => `📍 ${data.playerName} is up for auction`,
    bid: () => `💰 ${data.teamName} bids ₹${data.amount}L`,
    sold: () => `✅ ${data.playerName} sold to ${data.teamName} for ₹${data.price}L`,
    unsold: () => `❌ ${data.playerName} - UNSOLD`,
    pass: () => `🚫 ${data.teamName} passed`,
    allPassed: () => `⏸️ All teams passed on ${data.playerName}`,
    complete: () => '🎉 Auction complete!',
    error: () => `⚠️ Error: ${data.message}`,
  };
  
  return messages[type] ? messages[type]() : 'Unknown event';
};

/**
 * Sort teams by criteria
 */
export const sortTeamsByCriteria = (teams, criteria = 'spent') => {
  const sorted = [...teams];
  
  switch (criteria) {
    case 'spent':
      return sorted.sort((a, b) => 
        (AUCTION_CONFIG.TOTAL_PURSE - b.purse) - (AUCTION_CONFIG.TOTAL_PURSE - a.purse)
      );
    case 'squads':
      return sorted.sort((a, b) => (b.squad?.length || 0) - (a.squad?.length || 0));
    case 'purse':
      return sorted.sort((a, b) => b.purse - a.purse);
    default:
      return sorted;
  }
};

/**
 * Calculate auction progress percentage
 */
export const getAuctionProgress = (totalPlayers, queueRemaining, soldCount) => {
  const completed = soldCount + (totalPlayers - queueRemaining - 1);
  return Math.round((completed / totalPlayers) * 100);
};

/**
 * Format purse amount for display
 */
export const formatPurse = (amount) => {
  return `₹${amount}L`;
};

/**
 * Get purse information for a team
 * @param {Object} team - Team object with purse and totalSpent
 * @returns {Object} { totalPurse, spent, remaining, percentageUsed }
 */
export const getTeamPurseInfo = (team) => {
  const totalPurse = AUCTION_CONFIG.TOTAL_PURSE;
  const spent = team.totalSpent || 0;
  const remaining = team.purse || (totalPurse - spent);
  const percentageUsed = Math.round((spent / totalPurse) * 100);
  
  return {
    totalPurse,
    spent,
    remaining,
    percentageUsed,
    canBid: remaining > 0,
  };
};

/**
 * Validate auction can start
 */
export const canStartAuction = (teams, minimumTeams = 2) => {
  return teams && teams.length >= minimumTeams;
};

// ===== TEAM VALIDATION (from auctionEnhanced.js) =====

/**
 * Validate team composition (overseas limit, roles, etc.)
 */
export const validateTeamComposition = (squad, config = {}) => {
  const {
    maxPlayers = 25,
    minPlayers = 18,
    maxOverseas = 8,
  } = config;
  
  const issues = [];
  
  if (squad.length < minPlayers) {
    issues.push(`Need at least ${minPlayers} players (have ${squad.length})`);
  }
  
  if (squad.length > maxPlayers) {
    issues.push(`Cannot exceed ${maxPlayers} players (have ${squad.length})`);
  }
  
  const overseasCount = squad.filter(p => p.isOverseas).length;
  if (overseasCount > maxOverseas) {
    issues.push(`Too many overseas players (${overseasCount}/${maxOverseas})`);
  }
  
  // Optional role balance check
  const roleBalance = getTeamRoleBalance(squad);
  
  return {
    isValid: issues.length === 0,
    issues,
    stats: {
      totalPlayers: squad.length,
      overseasCount,
      roleBalance,
    },
  };
};

/**
 * Get team role composition breakdown
 */
export const getTeamRoleBalance = (squad) => {
  return {
    batters: squad.filter(p => p.role === PLAYER_ROLES.BATTER).length,
    bowlers: squad.filter(p => p.role === PLAYER_ROLES.BOWLER).length,
    allrounders: squad.filter(p => p.role === PLAYER_ROLES.ALLROUNDER).length,
    wicketkeepers: squad.filter(p => p.role === PLAYER_ROLES.WICKETKEEPER).length,
  };
};

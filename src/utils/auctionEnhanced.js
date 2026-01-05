/**
 * auctionEnhanced.js
 * Enhanced auction utilities following real IPL auction structure
 * 
 * Features:
 * - Player categorization (role-based)
 * - Auction set grouping (marquee, capped, uncapped, etc.)
 * - Overseas player limit enforcement
 * - RTM card system
 * - Bid increment strategy
 */

// Player roles
export const PLAYER_ROLES = {
  BATTER: 'batter',
  BOWLER: 'bowler',
  ALLROUNDER: 'allrounder',
  WICKETKEEPER: 'wicketkeeper',
};

// Auction sets/categories
export const AUCTION_SETS = {
  MARQUEE: 'marquee',
  CAPPED_BATTER: 'capped_batter',
  CAPPED_BOWLER: 'capped_bowler',
  CAPPED_ALLROUNDER: 'capped_allrounder',
  UNCAPPED_INDIAN: 'uncapped_indian',
  WICKETKEEPER_BATTER: 'wicketkeeper_batter',
  EMERGING: 'emerging',
};

/**
 * Categorize a player into auction sets and roles
 * Based on IPL historical trends and player profiles
 */
export const categorizePlayer = (player) => {
  const role = determineRole(player);
  const set = determineSectionSet(player, role);
  
  return {
    ...player,
    role,
    set,
    isOverseas: player.country && player.country !== 'India',
    isUncapped: !player.internationalCaps || player.internationalCaps === 0,
  };
};

/**
 * Determine player role from name patterns or stats
 */
const determineRole = (player) => {
  if (!player) return PLAYER_ROLES.BATTER;
  
  const name = (player.name || '').toLowerCase();
  
  // Wicketkeeper priority (usually batting first)
  if (name.includes('pant') || name.includes('dhoni') || name.includes('gilly') || name.includes('samson')) {
    return PLAYER_ROLES.WICKETKEEPER;
  }
  
  // Quick heuristics based on common names/patterns
  // In real system, would use role field from API
  const fastBowlers = ['bumrah', 'boult', 'rabada', 'starc', 'cummins', 'hazlewood'];
  const spinners = ['ashwin', 'sundar', 'axar', 'chahal', 'rashid', 'mujeeb'];
  const allrounders = ['hardik', 'stokes', 'maxwell', 'rayudu', 'pollard', 'russell'];
  
  if (fastBowlers.some(name => player.name.toLowerCase().includes(name)) ||
      spinners.some(name => player.name.toLowerCase().includes(name))) {
    return PLAYER_ROLES.BOWLER;
  }
  
  if (allrounders.some(name => player.name.toLowerCase().includes(name))) {
    return PLAYER_ROLES.ALLROUNDER;
  }
  
  // Default to batter if unsure
  return PLAYER_ROLES.BATTER;
};

/**
 * Determine auction set based on player profile
 */
const determineSectionSet = (player, role) => {
  const isUncapped = !player.internationalCaps || player.internationalCaps === 0;
  
  // Marquee players (top-tier overseas or star Indian players)
  const marqueeNames = ['kohli', 'dhoni', 'bumrah', 'virat', 'warner', 'smith', 'root', 'kane'];
  if (marqueeNames.some(name => player.name.toLowerCase().includes(name))) {
    return AUCTION_SETS.MARQUEE;
  }
  
  // Uncapped Indians
  if (isUncapped && (!player.country || player.country === 'India')) {
    return AUCTION_SETS.UNCAPPED_INDIAN;
  }
  
  // Wicket-keeper batters
  if (role === PLAYER_ROLES.WICKETKEEPER) {
    return AUCTION_SETS.WICKETKEEPER_BATTER;
  }
  
  // Emerging players (young, limited experience)
  if (player.age && player.age < 25) {
    return AUCTION_SETS.EMERGING;
  }
  
  // Capped players by role
  if (role === PLAYER_ROLES.BATTER) {
    return AUCTION_SETS.CAPPED_BATTER;
  } else if (role === PLAYER_ROLES.BOWLER) {
    return AUCTION_SETS.CAPPED_BOWLER;
  } else if (role === PLAYER_ROLES.ALLROUNDER) {
    return AUCTION_SETS.CAPPED_ALLROUNDER;
  }
  
  return AUCTION_SETS.CAPPED_BATTER; // Default
};

/**
 * Group players into auction sets
 */
export const groupPlayersBySet = (playerPool) => {
  const categorized = playerPool.map(p => categorizePlayer(p));
  
  const groupedSets = {
    [AUCTION_SETS.MARQUEE]: [],
    [AUCTION_SETS.CAPPED_BATTER]: [],
    [AUCTION_SETS.CAPPED_BOWLER]: [],
    [AUCTION_SETS.CAPPED_ALLROUNDER]: [],
    [AUCTION_SETS.UNCAPPED_INDIAN]: [],
    [AUCTION_SETS.WICKETKEEPER_BATTER]: [],
    [AUCTION_SETS.EMERGING]: [],
  };
  
  categorized.forEach(player => {
    if (groupedSets[player.set]) {
      groupedSets[player.set].push(player);
    }
  });
  
  return groupedSets;
};

/**
 * Get auction queue in proper set order
 */
export const buildAuctionQueue = (playerPool, setOrder = null) => {
  const grouped = groupPlayersBySet(playerPool);
  
  // Default auction set order (matches real IPL)
  const defaultOrder = [
    AUCTION_SETS.MARQUEE,
    AUCTION_SETS.WICKETKEEPER_BATTER,
    AUCTION_SETS.CAPPED_BATTER,
    AUCTION_SETS.CAPPED_BOWLER,
    AUCTION_SETS.CAPPED_ALLROUNDER,
    AUCTION_SETS.UNCAPPED_INDIAN,
    AUCTION_SETS.EMERGING,
  ];
  
  const order = setOrder || defaultOrder;
  const queue = [];
  
  order.forEach(set => {
    if (grouped[set]) {
      queue.push(...grouped[set]);
    }
  });
  
  return queue;
};

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

/**
 * Calculate smart bid increment
 */
export const getSmartBidIncrement = (currentBid, basePrice, multiplier = 1) => {
  let increment = 5;
  
  if (currentBid < basePrice) {
    increment = Math.ceil(basePrice / 10);
  } else if (currentBid < basePrice * 2) {
    increment = Math.ceil(basePrice / 5);
  } else if (currentBid < basePrice * 5) {
    increment = Math.ceil(basePrice / 2);
  } else {
    increment = Math.ceil(basePrice);
  }
  
  return Math.max(increment, 5) * multiplier;
};

/**
 * Filter available players for auction
 * (Exclude sold players)
 */
export const getAvailablePlayers = (playerPool, soldPlayerIds = []) => {
  return playerPool.filter(p => !soldPlayerIds.includes(p.id));
};

/**
 * Get RTM (Right to Match) eligible teams
 * (Teams that previously owned a player)
 */
export const getRTMEligibleTeams = (player, previousOwners = {}) => {
  return previousOwners[player.id] || [];
};

/**
 * Calculate base price tier
 */
export const getBasePriceTier = (player) => {
  if (!player) return '10L';
  
  // High-value players
  const megaPlayerBases = {
    'marquee': '2Cr',
    'capped_allrounder': '1.5Cr',
    'capped_bowler': '1Cr',
    'capped_batter': '75L',
    'wicketkeeper_batter': '75L',
    'uncapped_indian': '20L',
    'emerging': '10L',
  };
  
  return megaPlayerBases[player.set] || '10L';
};

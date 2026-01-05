/**
 * auctionSets.js
 * Complete IPL Auction Sets Framework
 * Defines sets, base prices, bidding increments, and ordering logic
 */

// ===== AUCTION SET DEFINITIONS =====
export const AUCTION_SETS = {
  MARQUEE: {
    id: 'MARQUEE',
    name: 'Marquee Players',
    emoji: '👑',
    description: 'Stars, captains, MVPs, international icons',
    basePriceRange: { min: 150, max: 200 }, // in lakhs
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
    basePriceRange: { min: 20, max: 200 }, // Original base price preserved
    maxAllowed: 200,
    order: 5,
  },
};

// ===== PLAYER ROLES (Role-based sub-sets within Capped/Overseas) =====
export const PLAYER_ROLES = {
  BATTER: 'Batter',
  BOWLER: 'Bowler',
  ALL_ROUNDER: 'All-rounder',
  WICKETKEEPER: 'Wicketkeeper',
};

// Role order within capped sets (for auction flow)
const ROLE_ORDER = {
  [PLAYER_ROLES.BATTER]: 1,
  [PLAYER_ROLES.BOWLER]: 2,
  [PLAYER_ROLES.ALL_ROUNDER]: 3,
  [PLAYER_ROLES.WICKETKEEPER]: 4,
};

// ===== BIDDING INCREMENT RULES =====
export const getBidIncrement = (currentBidInLakhs) => {
  if (currentBidInLakhs < 100) {
    // Up to 1 Cr: 5-10 lakh steps
    return 5;
  } else if (currentBidInLakhs < 500) {
    // 1 Cr to 5 Cr: 25 lakh steps
    return 25;
  } else {
    // Above 5 Cr: 50 lakh steps
    return 50;
  }
};

// Format lakh amount to crore if needed
export const formatPrice = (lakhs) => {
  if (lakhs >= 100) {
    return `₹${(lakhs / 100).toFixed(2)} Cr`;
  }
  return `₹${lakhs}L`;
};

// ===== PLAYER CLASSIFICATION LOGIC =====
/**
 * Classify a player into the appropriate auction set
 * Based on: international experience, role, reputation, etc.
 */
export const classifyPlayerIntoSet = (player) => {
  // Marquee Logic: Check if player is a marquee/star player
  // Criteria: captain, MVP, top international player, etc.
  if (isMarqueePlayer(player)) {
    return {
      set: AUCTION_SETS.MARQUEE.id,
      basePrice: assignBasePrice(player, AUCTION_SETS.MARQUEE),
    };
  }

  // Overseas Logic: International capped player
  if (player.isOverseas && player.isCapped) {
    return {
      set: AUCTION_SETS.OVERSEAS.id,
      basePrice: assignBasePrice(player, AUCTION_SETS.OVERSEAS),
    };
  }

  // Capped Indian Logic
  if (!player.isOverseas && player.isCapped) {
    return {
      set: AUCTION_SETS.CAPPED_INDIAN.id,
      basePrice: assignBasePrice(player, AUCTION_SETS.CAPPED_INDIAN),
    };
  }

  // Uncapped Indian Logic (default)
  return {
    set: AUCTION_SETS.UNCAPPED_INDIAN.id,
    basePrice: assignBasePrice(player, AUCTION_SETS.UNCAPPED_INDIAN),
  };
};

/**
 * Determine if a player is "Marquee" caliber
 * Check for: captaincy, MVP status, international reputation
 */
const isMarqueePlayer = (player) => {
  // Look for keywords or flags
  const marqueeKeywords = ['captain', 'MVP', 'star', 'legend', 'international icon'];
  const playerInfo = `${player.name} ${player.role} ${player.description || ''}`.toLowerCase();

  // If explicitly marked
  if (player.isMarquee) return true;

  // Check for marquee keywords (add more logic as needed)
  return marqueeKeywords.some(keyword => playerInfo.includes(keyword));
};

/**
 * Assign base price within the set's allowed range
 * Logic: Higher experience/reputation within that set = higher base price
 */
const assignBasePrice = (player, set) => {
  const { min, max } = set.basePriceRange;

  // Calculate score (0-100) based on player qualities
  let score = 50; // base score

  // Experience boost
  if (player.matches && player.matches > 100) score += 30;
  else if (player.matches && player.matches > 50) score += 20;
  else if (player.matches && player.matches > 20) score += 10;

  // Strike rate / Average boost (for batters)
  if (player.strikeRate && player.strikeRate > 140) score += 20;
  else if (player.strikeRate && player.strikeRate > 130) score += 10;

  // Bowling average boost
  if (player.bowlingAverage && player.bowlingAverage < 25) score += 20;
  else if (player.bowlingAverage && player.bowlingAverage < 30) score += 10;

  // Wicketkeeper/All-rounder bonus
  if (player.role === PLAYER_ROLES.WICKETKEEPER) score += 15;
  if (player.role === PLAYER_ROLES.ALL_ROUNDER) score += 10;

  // If already marked with a price preference
  if (player.preferredBasePriceLakhs) {
    return Math.min(Math.max(player.preferredBasePriceLakhs, min), max);
  }

  // Scale score to price range
  const scaledPrice = min + (score / 100) * (max - min);
  return Math.round(scaledPrice / 5) * 5; // Round to nearest 5 lakh
};

// ===== AUCTION QUEUE BUILDER =====
/**
 * Build the complete auction queue organized by sets and roles
 * Returns ordered array of players ready for auction
 */
export const buildAuctionQueueBySet = (playerPool = []) => {
  // Classify all players
  const classifiedPlayers = playerPool.map(player => ({
    ...player,
    auctionSet: classifyPlayerIntoSet(player),
  }));

  // Group by set
  const setGroups = {
    [AUCTION_SETS.MARQUEE.id]: [],
    [AUCTION_SETS.CAPPED_INDIAN.id]: [],
    [AUCTION_SETS.OVERSEAS.id]: [],
    [AUCTION_SETS.UNCAPPED_INDIAN.id]: [],
    [AUCTION_SETS.ACCELERATED.id]: [],
  };

  classifiedPlayers.forEach(player => {
    const setId = player.auctionSet?.set || AUCTION_SETS.UNCAPPED_INDIAN.id;
    if (setGroups[setId]) {
      setGroups[setId].push(player);
    }
  });

  // Order within each set
  const queue = [];

  // 1. Marquee players
  queue.push(...orderSetPlayers(setGroups[AUCTION_SETS.MARQUEE.id]));

  // 2. Capped Indian (by role)
  queue.push(...orderSetPlayers(setGroups[AUCTION_SETS.CAPPED_INDIAN.id], true));

  // 3. Overseas (by role)
  queue.push(...orderSetPlayers(setGroups[AUCTION_SETS.OVERSEAS.id], true));

  // 4. Uncapped Indian
  queue.push(...orderSetPlayers(setGroups[AUCTION_SETS.UNCAPPED_INDIAN.id]));

  return queue;
};

/**
 * Order players within a set
 * If roleOrder=true, order by role first, then shuffle within role
 */
const orderSetPlayers = (players, roleOrder = false) => {
  if (!players || players.length === 0) return [];

  if (roleOrder) {
    // Group by role
    const roleGroups = {};
    players.forEach(p => {
      const role = p.role || PLAYER_ROLES.BATTER;
      if (!roleGroups[role]) roleGroups[role] = [];
      roleGroups[role].push(p);
    });

    // Shuffle within each role and combine in role order
    const ordered = [];
    Object.keys(ROLE_ORDER).forEach(role => {
      if (roleGroups[role]) {
        ordered.push(...shuffleArray(roleGroups[role]));
      }
    });
    return ordered;
  }

  // No role order, just shuffle
  return shuffleArray(players);
};

/**
 * Fisher-Yates shuffle for randomizing player order within set/role
 */
const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// ===== SET VALIDATION & UTILITIES =====
/**
 * Check if a player is eligible for their assigned set
 */
export const validatePlayerSetEligibility = (player, set) => {
  if (!player.auctionSet) return false;
  return player.auctionSet.set === set.id;
};

/**
 * Get set information by ID
 */
export const getSetById = (setId) => {
  return Object.values(AUCTION_SETS).find(s => s.id === setId);
};

/**
 * Get all sets in auction order
 */
export const getSetsInOrder = () => {
  return Object.values(AUCTION_SETS).sort((a, b) => a.order - b.order);
};

/**
 * Calculate progress through all sets
 */
export const calculateAuctionProgress = (playerPool, soldPlayers) => {
  const totalPlayers = playerPool.length;
  const playersSold = soldPlayers.length;
  const progressPercent = totalPlayers > 0 ? (playersSold / totalPlayers) * 100 : 0;

  return {
    totalPlayers,
    playersSold,
    playersRemaining: totalPlayers - playersSold,
    progressPercent,
  };
};

/**
 * Get current set context (which set are we in, how many players left in set, etc)
 */
export const getCurrentSetContext = (queue, currentPlayerIndex) => {
  if (!queue || queue.length === 0) return null;

  const currentPlayer = queue[currentPlayerIndex];
  if (!currentPlayer) return null;

  const currentSetId = currentPlayer.auctionSet?.set;
  const setPlayers = queue.filter(p => p.auctionSet?.set === currentSetId);
  const playerIndexInSet = setPlayers.findIndex(p => p.name === currentPlayer.name);

  return {
    currentSet: getSetById(currentSetId),
    currentPlayer,
    playerIndexInSet: playerIndexInSet + 1,
    totalInSet: setPlayers.length,
    playersRemainingInSet: setPlayers.length - playerIndexInSet - 1,
  };
};

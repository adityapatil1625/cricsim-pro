/**
 * playerPoolV2.js - REVAMPED Player Pool Structure with Smart Base Pricing
 * 
 * Intelligent base price assignment per auction set
 * - MARQUEE: Premium pricing (150-200L) based on player stature
 * - CAPPED_INDIAN: Mid-range (50-100L) based on role and experience
 * - OVERSEAS: Competitive (50-200L) based on reputation
 * - UNCAPPED_INDIAN: Entry level (20-40L) flat or minor variance
 */

export const AUCTION_SETS = {
  MARQUEE: 'MARQUEE',
  CAPPED_INDIAN: 'CAPPED_INDIAN',
  OVERSEAS: 'OVERSEAS',
  UNCAPPED_INDIAN: 'UNCAPPED_INDIAN',
};

export const AUCTION_SET_INFO = {
  [AUCTION_SETS.MARQUEE]: {
    id: AUCTION_SETS.MARQUEE,
    name: 'Marquee Players',
    emoji: '👑',
    minPrice: 150,
    maxPrice: 200,
    order: 1,
  },
  [AUCTION_SETS.CAPPED_INDIAN]: {
    id: AUCTION_SETS.CAPPED_INDIAN,
    name: 'Capped Indian Players',
    emoji: '🇮🇳',
    minPrice: 50,
    maxPrice: 100,
    order: 2,
  },
  [AUCTION_SETS.OVERSEAS]: {
    id: AUCTION_SETS.OVERSEAS,
    name: 'Overseas Players',
    emoji: '🌍',
    minPrice: 50,
    maxPrice: 200,
    order: 3,
  },
  [AUCTION_SETS.UNCAPPED_INDIAN]: {
    id: AUCTION_SETS.UNCAPPED_INDIAN,
    name: 'Uncapped Indian Players',
    emoji: '🔓',
    minPrice: 20,
    maxPrice: 40,
    order: 4,
  },
};

/**
 * MARQUEE BASE PRICE LOGIC
 * Star players get premium pricing based on stature:
 * - Mega Stars (Kohli, Rohit, ABD): 190-200L
 * - Star Bowlers (Bumrah): 190-200L
 * - Champion Keeper (MS Dhoni): 190L
 */
const MARQUEE_PRICES = {
  'Virat Kohli': 200,      // Indian captain, global icon
  'Rohit Sharma': 200,     // MI captain, domestic legend
  'AB de Villiers': 190,   // International legend
  'Jasprit Bumrah': 190,   // World's best pacer
  'MS Dhoni': 190,         // Former captain, champion
};

/**
 * CAPPED INDIAN BASE PRICE LOGIC
 * Based on role and current standing:
 * - Star all-rounders: 75-80L
 * - Premium batters: 70-75L
 * - Premium bowlers: 65-70L
 * - Standard players: 50-65L
 */
const CAPPED_INDIAN_PRICES = {
  'Hardik Pandya': 80,      // Star all-rounder
  'Shreyas Iyer': 75,       // Premium batter
  'Rishabh Pant': 85,       // Premium wicketkeeper
  'Yuzvendra Chahal': 70,   // Premium spinner
  'Shubman Gill': 75,       // Rising star batter
  'Bhuvneshwar Kumar': 70,  // Reliable pacer
  'Mohammed Shami': 70,     // Experience bowler
};

/**
 * OVERSEAS BASE PRICE LOGIC
 * Based on international reputation and role:
 * - Star batters: 80-85L
 * - Premium bowlers: 70-75L
 * - All-rounders: 65-70L
 */
const OVERSEAS_PRICES = {
  'Kane Williamson': 85,    // International star
  'David Warner': 80,       // Proven performer
  'Pat Cummins': 75,        // Premium bowler
  'Mitchell Marsh': 70,     // Utility all-rounder
  'Trent Boult': 75,        // World-class bowler
  'Wanindu Hasaranga': 65,  // Emerging talent
};

/**
 * Get base price for a player based on their name and set
 */
const getPlayerBasePrice = (playerName, set) => {
  if (set === AUCTION_SETS.MARQUEE) {
    return MARQUEE_PRICES[playerName] || 190; // Default to 190 if not found
  }
  if (set === AUCTION_SETS.CAPPED_INDIAN) {
    return CAPPED_INDIAN_PRICES[playerName] || 60; // Default to 60
  }
  if (set === AUCTION_SETS.OVERSEAS) {
    return OVERSEAS_PRICES[playerName] || 70; // Default to 70
  }
  if (set === AUCTION_SETS.UNCAPPED_INDIAN) {
    return 30; // Flat price for uncapped
  }
  return 50; // Safe fallback
};

export const IPL_PLAYER_POOL_V2 = [
  // ===== MARQUEE SET (5 players) =====
  {
    id: 'p_001',
    name: 'Virat Kohli',
    role: 'Batter',
    isOverseas: false,
    auctionSet: AUCTION_SETS.MARQUEE,
    basePrice: MARQUEE_PRICES['Virat Kohli'],
  },
  {
    id: 'p_002',
    name: 'Rohit Sharma',
    role: 'Batter',
    isOverseas: false,
    auctionSet: AUCTION_SETS.MARQUEE,
    basePrice: MARQUEE_PRICES['Rohit Sharma'],
  },
  {
    id: 'p_003',
    name: 'Jasprit Bumrah',
    role: 'Bowler',
    isOverseas: false,
    auctionSet: AUCTION_SETS.MARQUEE,
    basePrice: MARQUEE_PRICES['Jasprit Bumrah'],
  },
  {
    id: 'p_004',
    name: 'MS Dhoni',
    role: 'Wicketkeeper',
    isOverseas: false,
    auctionSet: AUCTION_SETS.MARQUEE,
    basePrice: MARQUEE_PRICES['MS Dhoni'],
  },
  {
    id: 'p_005',
    name: 'AB de Villiers',
    role: 'Batter',
    isOverseas: true,
    auctionSet: AUCTION_SETS.MARQUEE,
    basePrice: MARQUEE_PRICES['AB de Villiers'],
  },

  // ===== CAPPED INDIAN SET (7 players) =====
  {
    id: 'p_006',
    name: 'Hardik Pandya',
    role: 'All-rounder',
    isOverseas: false,
    auctionSet: AUCTION_SETS.CAPPED_INDIAN,
    basePrice: CAPPED_INDIAN_PRICES['Hardik Pandya'],
  },
  {
    id: 'p_007',
    name: 'Bhuvneshwar Kumar',
    role: 'Bowler',
    isOverseas: false,
    auctionSet: AUCTION_SETS.CAPPED_INDIAN,
    basePrice: CAPPED_INDIAN_PRICES['Bhuvneshwar Kumar'],
  },
  {
    id: 'p_008',
    name: 'Shreyas Iyer',
    role: 'Batter',
    isOverseas: false,
    auctionSet: AUCTION_SETS.CAPPED_INDIAN,
    basePrice: CAPPED_INDIAN_PRICES['Shreyas Iyer'],
  },
  {
    id: 'p_009',
    name: 'Rishabh Pant',
    role: 'Wicketkeeper',
    isOverseas: false,
    auctionSet: AUCTION_SETS.CAPPED_INDIAN,
    basePrice: CAPPED_INDIAN_PRICES['Rishabh Pant'],
  },
  {
    id: 'p_010',
    name: 'Yuzvendra Chahal',
    role: 'Bowler',
    isOverseas: false,
    auctionSet: AUCTION_SETS.CAPPED_INDIAN,
    basePrice: CAPPED_INDIAN_PRICES['Yuzvendra Chahal'],
  },
  {
    id: 'p_011',
    name: 'Shubman Gill',
    role: 'Batter',
    isOverseas: false,
    auctionSet: AUCTION_SETS.CAPPED_INDIAN,
    basePrice: CAPPED_INDIAN_PRICES['Shubman Gill'],
  },
  {
    id: 'p_012',
    name: 'Mohammed Shami',
    role: 'Bowler',
    isOverseas: false,
    auctionSet: AUCTION_SETS.CAPPED_INDIAN,
    basePrice: CAPPED_INDIAN_PRICES['Mohammed Shami'],
  },

  // ===== OVERSEAS SET (6 players) =====
  {
    id: 'p_013',
    name: 'Kane Williamson',
    role: 'Batter',
    isOverseas: true,
    auctionSet: AUCTION_SETS.OVERSEAS,
    basePrice: OVERSEAS_PRICES['Kane Williamson'],
  },
  {
    id: 'p_014',
    name: 'David Warner',
    role: 'Batter',
    isOverseas: true,
    auctionSet: AUCTION_SETS.OVERSEAS,
    basePrice: OVERSEAS_PRICES['David Warner'],
  },
  {
    id: 'p_015',
    name: 'Pat Cummins',
    role: 'Bowler',
    isOverseas: true,
    auctionSet: AUCTION_SETS.OVERSEAS,
    basePrice: OVERSEAS_PRICES['Pat Cummins'],
  },
  {
    id: 'p_016',
    name: 'Mitchell Marsh',
    role: 'All-rounder',
    isOverseas: true,
    auctionSet: AUCTION_SETS.OVERSEAS,
    basePrice: OVERSEAS_PRICES['Mitchell Marsh'],
  },
  {
    id: 'p_017',
    name: 'Trent Boult',
    role: 'Bowler',
    isOverseas: true,
    auctionSet: AUCTION_SETS.OVERSEAS,
    basePrice: OVERSEAS_PRICES['Trent Boult'],
  },
  {
    id: 'p_018',
    name: 'Wanindu Hasaranga',
    role: 'Bowler',
    isOverseas: true,
    auctionSet: AUCTION_SETS.OVERSEAS,
    basePrice: OVERSEAS_PRICES['Wanindu Hasaranga'],
  },

  // ===== UNCAPPED INDIAN SET (26 players - flat 30L base price) =====
  {
    id: 'p_019',
    name: 'Arjun Tendulkar',
    role: 'Bowler',
    isOverseas: false,
    auctionSet: AUCTION_SETS.UNCAPPED_INDIAN,
    basePrice: 30,
  },
  {
    id: 'p_020',
    name: 'Priyam Garg',
    role: 'Batter',
    isOverseas: false,
    auctionSet: AUCTION_SETS.UNCAPPED_INDIAN,
    basePrice: 30,
  },
  {
    id: 'p_021',
    name: 'Utkarsh Singh',
    role: 'Bowler',
    isOverseas: false,
    auctionSet: AUCTION_SETS.UNCAPPED_INDIAN,
    basePrice: 30,
  },
  {
    id: 'p_022',
    name: 'Anmolpreet Singh',
    role: 'Batter',
    isOverseas: false,
    auctionSet: AUCTION_SETS.UNCAPPED_INDIAN,
    basePrice: 30,
  },
  {
    id: 'p_023',
    name: 'Ravi Bishnoi',
    role: 'Bowler',
    isOverseas: false,
    auctionSet: AUCTION_SETS.UNCAPPED_INDIAN,
    basePrice: 30,
  },
  {
    id: 'p_024',
    name: 'Saurav Chauhan',
    role: 'Bowler',
    isOverseas: false,
    auctionSet: AUCTION_SETS.UNCAPPED_INDIAN,
    basePrice: 30,
  },
  {
    id: 'p_025',
    name: 'Sumit Kumar',
    role: 'All-rounder',
    isOverseas: false,
    auctionSet: AUCTION_SETS.UNCAPPED_INDIAN,
    basePrice: 30,
  },
  {
    id: 'p_026',
    name: 'Abhishek Sharma',
    role: 'Batter',
    isOverseas: false,
    auctionSet: AUCTION_SETS.UNCAPPED_INDIAN,
    basePrice: 30,
  },
  {
    id: 'p_027',
    name: 'Amandeep Singh',
    role: 'Bowler',
    isOverseas: false,
    auctionSet: AUCTION_SETS.UNCAPPED_INDIAN,
    basePrice: 30,
  },
  {
    id: 'p_028',
    name: 'Zak Khan',
    role: 'Bowler',
    isOverseas: false,
    auctionSet: AUCTION_SETS.UNCAPPED_INDIAN,
    basePrice: 30,
  },
  {
    id: 'p_029',
    name: 'Vinay Jain',
    role: 'Batter',
    isOverseas: false,
    auctionSet: AUCTION_SETS.UNCAPPED_INDIAN,
    basePrice: 30,
  },
  {
    id: 'p_030',
    name: 'Rahul Tewatia',
    role: 'All-rounder',
    isOverseas: false,
    auctionSet: AUCTION_SETS.UNCAPPED_INDIAN,
    basePrice: 30,
  },
  {
    id: 'p_031',
    name: 'Karun Nair',
    role: 'Batter',
    isOverseas: false,
    auctionSet: AUCTION_SETS.UNCAPPED_INDIAN,
    basePrice: 30,
  },
  {
    id: 'p_032',
    name: 'Rahul Raj',
    role: 'Bowler',
    isOverseas: false,
    auctionSet: AUCTION_SETS.UNCAPPED_INDIAN,
    basePrice: 30,
  },
  {
    id: 'p_033',
    name: 'Praveen Dubey',
    role: 'Bowler',
    isOverseas: false,
    auctionSet: AUCTION_SETS.UNCAPPED_INDIAN,
    basePrice: 30,
  },
  {
    id: 'p_034',
    name: 'Akshay Wakhare',
    role: 'Bowler',
    isOverseas: false,
    auctionSet: AUCTION_SETS.UNCAPPED_INDIAN,
    basePrice: 30,
  },
  {
    id: 'p_035',
    name: 'Siddhanth Sethi',
    role: 'All-rounder',
    isOverseas: false,
    auctionSet: AUCTION_SETS.UNCAPPED_INDIAN,
    basePrice: 30,
  },
  {
    id: 'p_036',
    name: 'Jaydev Unadkat',
    role: 'Bowler',
    isOverseas: false,
    auctionSet: AUCTION_SETS.UNCAPPED_INDIAN,
    basePrice: 30,
  },
  {
    id: 'p_037',
    name: 'Ishan Kishan',
    role: 'Wicketkeeper',
    isOverseas: false,
    auctionSet: AUCTION_SETS.UNCAPPED_INDIAN,
    basePrice: 30,
  },
  {
    id: 'p_038',
    name: 'Harpreet Bhatia',
    role: 'Batter',
    isOverseas: false,
    auctionSet: AUCTION_SETS.UNCAPPED_INDIAN,
    basePrice: 30,
  },
  {
    id: 'p_039',
    name: 'Devak Desai',
    role: 'Bowler',
    isOverseas: false,
    auctionSet: AUCTION_SETS.UNCAPPED_INDIAN,
    basePrice: 30,
  },
  {
    id: 'p_040',
    name: 'Sushant Mishra',
    role: 'Bowler',
    isOverseas: false,
    auctionSet: AUCTION_SETS.UNCAPPED_INDIAN,
    basePrice: 30,
  },
  {
    id: 'p_041',
    name: 'Ravisrinivasan Sai Kishore',
    role: 'Bowler',
    isOverseas: false,
    auctionSet: AUCTION_SETS.UNCAPPED_INDIAN,
    basePrice: 30,
  },
  {
    id: 'p_042',
    name: 'Tushar Deshpande',
    role: 'Bowler',
    isOverseas: false,
    auctionSet: AUCTION_SETS.UNCAPPED_INDIAN,
    basePrice: 30,
  },
  {
    id: 'p_043',
    name: 'Mukesh Choudhary',
    role: 'Bowler',
    isOverseas: false,
    auctionSet: AUCTION_SETS.UNCAPPED_INDIAN,
    basePrice: 30,
  },
  {
    id: 'p_044',
    name: 'Yash Dhull',
    role: 'Batter',
    isOverseas: false,
    auctionSet: AUCTION_SETS.UNCAPPED_INDIAN,
    basePrice: 30,
  },
];

/**
 * Get bid increment based on current bid amount
 * Standard IPL bidding increments
 */
export const getBidIncrement = (currentBidInLakhs) => {
  if (currentBidInLakhs < 100) {
    // Up to 1 Cr: 5 lakh steps
    return 5;
  } else if (currentBidInLakhs < 500) {
    // 1 Cr to 5 Cr: 25 lakh steps
    return 25;
  } else {
    // Above 5 Cr: 50 lakh steps
    return 50;
  }
};

/**
 * Format price amount (lakhs) to readable format
 */
export const formatPrice = (lakhs) => {
  if (lakhs >= 100) {
    return `₹${(lakhs / 100).toFixed(2)} Cr`;
  }
  return `₹${lakhs}L`;
};

/**
 * Simple queue builder - no complex classification
 * Just sorts by auction set and returns in order
 */
export const buildSimpleAuctionQueue = (playerPool = []) => {
  if (!playerPool || playerPool.length === 0) return [];

  // Group by set
  const grouped = {};
  Object.values(AUCTION_SETS).forEach(set => {
    grouped[set] = playerPool.filter(p => p.auctionSet === set);
  });

  // Shuffle within each set for randomness
  Object.keys(grouped).forEach(set => {
    grouped[set] = shuffleArray(grouped[set]);
  });

  // Combine in order: MARQUEE → CAPPED → OVERSEAS → UNCAPPED
  const queue = [
    ...grouped[AUCTION_SETS.MARQUEE],
    ...grouped[AUCTION_SETS.CAPPED_INDIAN],
    ...grouped[AUCTION_SETS.OVERSEAS],
    ...grouped[AUCTION_SETS.UNCAPPED_INDIAN],
  ];

  return queue;
};

/**
 * Simple array shuffle (Fisher-Yates)
 */
const shuffleArray = (array) => {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

/**
 * Get set information
 */
export const getSetById = (setId) => {
  return AUCTION_SET_INFO[setId] || null;
};

/**
 * Get player count by set
 */
export const getPlayerCountBySet = (playerPool = []) => {
  const counts = {};
  Object.values(AUCTION_SETS).forEach(set => {
    counts[set] = playerPool.filter(p => p.auctionSet === set).length;
  });
  return counts;
};

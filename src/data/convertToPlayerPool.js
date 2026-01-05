// Script to convert Auction_List.json to playerPoolV2.js format
const fs = require('fs');

const auctionData = require('./Auction_List.json');

// Group players by set number
const playersBySet = {};
auctionData.forEach(player => {
  const setNo = player['Set No.'];
  if (!playersBySet[setNo]) {
    playersBySet[setNo] = [];
  }
  playersBySet[setNo].push(player);
});

// Convert to playerPool format
const playerPool = [];

// Helper function to convert specialism to role
function getRole(specialism) {
  if (!specialism) return 'ALL-ROUNDER';
  const s = specialism.toUpperCase();
  if (s.includes('BATTER')) return 'BATTER';
  if (s.includes('WICKETKEEPER')) return 'WICKETKEEPER';
  if (s.includes('BOWLER')) return 'BOWLER';
  if (s.includes('ALL-ROUNDER')) return 'ALL-ROUNDER';
  return 'ALL-ROUNDER';
}

// Helper to check if overseas
function isOverseas(country) {
  const indiaAliases = ['India'];
  return !indiaAliases.includes(country);
}

// Create player objects
Object.keys(playersBySet).sort((a, b) => parseInt(a) - parseInt(b)).forEach(setNo => {
  const playersInSet = playersBySet[setNo];
  
  playersInSet.forEach((player, index) => {
    const firstName = player['First Name'] || '';
    const surname = player['Surname'] || '';
    const fullName = `${firstName} ${surname}`.trim();
    const country = player['Country'] || '';
    const basePrice = player['Reserve Price Rs\nLakh'] || 30;
    const role = getRole(player['Specialism']);
    const overseas = isOverseas(country);
    
    playerPool.push({
      id: `${setNo}_${index + 1}`,
      name: fullName,
      role,
      country,
      isOverseas: overseas,
      auctionSet: `SET_${setNo}`,
      basePrice: basePrice,
      setNumber: parseInt(setNo)
    });
  });
});

// Define auction sets based on the data
const auctionSets = {};
const setInfo = {};

Object.keys(playersBySet).forEach(setNo => {
  const setId = `SET_${setNo}`;
  const playerCount = playersBySet[setNo].length;
  const basePrices = playersBySet[setNo].map(p => p['Reserve Price Rs\nLakh'] || 30);
  const minPrice = Math.min(...basePrices);
  const maxPrice = Math.max(...basePrices);
  
  auctionSets[setId] = {
    id: setId,
    name: `Set ${setNo}`,
    playerCount: playerCount,
    minPrice: minPrice,
    maxPrice: maxPrice
  };
  
  setInfo[setId] = {
    id: setId,
    name: `Set ${setNo}`,
    minPrice: minPrice,
    maxPrice: maxPrice,
    description: `Auction Set ${setNo}`
  };
});

// Output the playerPool.js content
const output = `// playerPoolV2.js - IPL Auction 2025 Player Pool
// Auto-generated from Auction_List.json

// ======================
// Player Pool Definition
// ======================
export const IPL_PLAYER_POOL_V2 = ${JSON.stringify(playerPool, null, 2)};

// ======================
// Auction Sets Mapping
// ======================
export const AUCTION_SETS = ${JSON.stringify(auctionSets, null, 2)};

export const AUCTION_SET_INFO = ${JSON.stringify(setInfo, null, 2)};

// ======================
// Helper Functions
// ======================

/**
 * Build auction queue by shuffling players within each set
 * @param {Array} playerPool - Full player pool
 * @returns {Array} Shuffled queue
 */
export function buildSimpleAuctionQueue(playerPool) {
  const queue = [];
  const setGroups = {};
  
  // Group players by auction set
  playerPool.forEach(player => {
    if (!setGroups[player.auctionSet]) {
      setGroups[player.auctionSet] = [];
    }
    setGroups[player.auctionSet].push(player);
  });
  
  // Shuffle each set and add to queue
  Object.keys(setGroups).sort().forEach(setId => {
    const setPlayers = setGroups[setId];
    // Fisher-Yates shuffle
    for (let i = setPlayers.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [setPlayers[i], setPlayers[j]] = [setPlayers[j], setPlayers[i]];
    }
    queue.push(...setPlayers);
  });
  
  return queue;
}

/**
 * Get set information by ID
 * @param {string} setId - Set ID (e.g., "SET_1")
 * @returns {Object} Set information
 */
export function getSetById(setId) {
  return AUCTION_SET_INFO[setId] || null;
}

/**
 * Get bid increment based on current bid
 * @param {number} currentBidInLakhs - Current bid in lakhs
 * @returns {number} Bid increment in lakhs
 */
export function getBidIncrement(currentBidInLakhs) {
  if (currentBidInLakhs < 100) return 5;
  if (currentBidInLakhs < 500) return 25;
  return 50;
}

/**
 * Format price for display
 * @param {number} lakhs - Price in lakhs
 * @returns {string} Formatted price
 */
export function formatPrice(lakhs) {
  if (lakhs >= 100) {
    return \`₹\${(lakhs / 100).toFixed(2)}Cr\`;
  }
  return \`₹\${lakhs}L\`;
}

export default IPL_PLAYER_POOL_V2;
`;

// Write to file
fs.writeFileSync('./playerPoolV2_generated.js', output);
console.log(`✅ Generated playerPoolV2_generated.js with ${playerPool.length} players across ${Object.keys(auctionSets).length} sets`);
console.log(`\nSet Summary:`);
Object.keys(playersBySet).sort((a, b) => parseInt(a) - parseInt(b)).forEach(setNo => {
  const count = playersBySet[setNo].length;
  const prices = playersBySet[setNo].map(p => p['Reserve Price Rs\nLakh'] || 30);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  console.log(`  Set ${setNo}: ${count} players, Price Range: ₹${min}L - ₹${max}L`);
});

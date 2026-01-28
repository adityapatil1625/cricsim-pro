/**
 * @fileoverview Input validation utilities for socket event data
 * @module validation
 * @description Validates all incoming socket event data to prevent invalid data from causing server errors
 * All validators return an object with {valid: boolean, error?: string, [result]?: any}
 */

// server/utils/validation.js

/**
 * Validate room code format and structure
 * @param {string} code - Room code to validate
 * @returns {Object} Validation result
 * @returns {boolean} result.valid - True if valid
 * @returns {string} [result.error] - Error message if invalid
 * @returns {string} [result.code] - Uppercase validated code if valid
 * @description Room codes must be 5 alphanumeric characters (A-Z, 0-9)
 */
const validateRoomCode = (code) => {
  if (!code || typeof code !== 'string') {
    return { valid: false, error: 'Room code is required' };
  }
  
  const upperCode = code.toUpperCase();
  if (!/^[A-Z0-9]{5}$/.test(upperCode)) {
    return { valid: false, error: 'Invalid room code format' };
  }
  
  return { valid: true, code: upperCode };
};

/**
 * Validate player name
 * @param {string} name - Player name to validate
 * @returns {Object} Validation result
 * @returns {boolean} result.valid - True if valid
 * @returns {string} [result.error] - Error message if invalid
 * @returns {string} [result.name] - Trimmed validated name if valid
 * @description Names must be 2-30 characters, alphanumeric + spaces
 */
const validatePlayerName = (name) => {
  if (!name || typeof name !== 'string') {
    return { valid: false, error: 'Player name is required' };
  }
  
  const trimmed = name.trim();
  if (trimmed.length < 2) {
    return { valid: false, error: 'Player name must be at least 2 characters' };
  }
  
  if (trimmed.length > 30) {
    return { valid: false, error: 'Player name must be less than 30 characters' };
  }
  
  // Basic sanitization - remove potentially harmful characters
  if (/[<>{}\\]/.test(trimmed)) {
    return { valid: false, error: 'Player name contains invalid characters' };
  }
  
  return { valid: true, name: trimmed };
};

/**
 * Validate game mode
 */
const validateGameMode = (mode) => {
  const validModes = ['1v1', 'tournament', 'auction'];
  
  if (!mode || typeof mode !== 'string') {
    return { valid: false, error: 'Game mode is required' };
  }
  
  if (!validModes.includes(mode)) {
    return { valid: false, error: `Invalid game mode. Must be one of: ${validModes.join(', ')}` };
  }
  
  return { valid: true, mode };
};

/**
 * Validate bid amount
 */
const validateBidAmount = (bid) => {
  if (typeof bid !== 'number') {
    return { valid: false, error: 'Bid must be a number' };
  }
  
  if (!Number.isInteger(bid) || bid < 0) {
    return { valid: false, error: 'Bid must be a positive integer' };
  }
  
  if (bid > 10000) {
    return { valid: false, error: 'Bid amount exceeds maximum limit' };
  }
  
  return { valid: true, bid };
};

/**
 * Validate team players array
 */
const validateTeamPlayers = (players) => {
  if (!Array.isArray(players)) {
    return { valid: false, error: 'Team players must be an array' };
  }
  
  if (players.length > 25) {
    return { valid: false, error: 'Team cannot have more than 25 players' };
  }
  
  // Basic validation of player objects
  const validPlayers = players.every(p => 
    p && 
    typeof p === 'object' && 
    typeof p.name === 'string' &&
    p.name.trim().length > 0
  );
  
  if (!validPlayers) {
    return { valid: false, error: 'Invalid player data format' };
  }
  
  return { valid: true, players };
};

/**
 * Validate match state object
 */
const validateMatchState = (matchState) => {
  if (!matchState || typeof matchState !== 'object') {
    return { valid: false, error: 'Match state must be an object' };
  }
  
  // Check required fields
  const requiredFields = ['score', 'wickets', 'ballsBowled', 'innings'];
  for (const field of requiredFields) {
    if (!(field in matchState)) {
      return { valid: false, error: `Match state missing required field: ${field}` };
    }
  }
  
  // Validate field types and ranges
  if (typeof matchState.score !== 'number' || matchState.score < 0) {
    return { valid: false, error: 'Invalid score value' };
  }
  
  if (typeof matchState.wickets !== 'number' || matchState.wickets < 0 || matchState.wickets > 11) {
    return { valid: false, error: 'Invalid wickets value' };
  }
  
  if (typeof matchState.ballsBowled !== 'number' || matchState.ballsBowled < 0) {
    return { valid: false, error: 'Invalid balls bowled value' };
  }
  
  return { valid: true, matchState };
};

/**
 * Sanitize string input
 */
const sanitizeString = (str) => {
  if (typeof str !== 'string') return '';
  return str.trim().replace(/[<>{}\\]/g, '');
};

/**
 * Validate and sanitize socket event data
 */
const validateSocketData = (data, schema) => {
  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'Invalid data format' };
  }
  
  const errors = [];
  const sanitized = {};
  
  for (const [field, validator] of Object.entries(schema)) {
    const value = data[field];
    const result = validator(value);
    
    if (!result.valid) {
      errors.push(`${field}: ${result.error}`);
    } else {
      // Use the validated/sanitized value
      sanitized[field] = result[field] !== undefined ? result[field] : value;
    }
  }
  
  if (errors.length > 0) {
    return { valid: false, error: errors.join('; ') };
  }
  
  return { valid: true, data: sanitized };
};

module.exports = {
  validateRoomCode,
  validatePlayerName,
  validateGameMode,
  validateBidAmount,
  validateTeamPlayers,
  validateMatchState,
  sanitizeString,
  validateSocketData,
};

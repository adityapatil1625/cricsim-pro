/**
 * @fileoverview Rate limiting middleware for Socket.IO events
 * @module rateLimiter
 * @description Prevents abuse by limiting event frequency from individual clients
 * Implements token bucket algorithm for flexible rate limiting
 */

const logger = require('./logger');

/**
 * Rate limit configuration by event type
 * @type {Object}
 */
const RATE_LIMITS = {
  // Critical events - strict limits
  'bid': { maxEvents: 10, windowMs: 5000 }, // 10 bids per 5 seconds
  'createRoom': { maxEvents: 2, windowMs: 60000 }, // 2 rooms per minute
  'joinRoom': { maxEvents: 5, windowMs: 10000 }, // 5 join attempts per 10 seconds
  
  // Regular events - moderate limits
  'matchBall': { maxEvents: 100, windowMs: 60000 }, // 100 balls per minute (normal pace)
  'chat': { maxEvents: 20, windowMs: 10000 }, // 20 messages per 10 seconds
  'playerSelect': { maxEvents: 30, windowMs: 10000 }, // 30 selections per 10 seconds
  
  // High-frequency events - loose limits
  'matchStateUpdate': { maxEvents: 1000, windowMs: 60000 }, // 1000 updates per minute
  'cursorMove': { maxEvents: 500, windowMs: 10000 }, // 500 cursor moves per 10 seconds
};

/**
 * In-memory store for client rate limit data
 * Maps socket ID to event tracking data
 * @type {Map}
 */
const clientLimits = new Map();

/**
 * Clean up old tokens for a client
 * @param {string} socketId - Socket ID
 * @param {string} eventType - Event type
 * @param {number} windowMs - Time window in milliseconds
 */
const cleanupOldTokens = (socketId, eventType, windowMs) => {
  if (!clientLimits.has(socketId)) return;
  
  const clientData = clientLimits.get(socketId);
  if (!clientData[eventType]) return;
  
  const now = Date.now();
  clientData[eventType] = clientData[eventType].filter(
    timestamp => now - timestamp < windowMs
  );
};

/**
 * Check if client has exceeded rate limit for event
 * @param {string} socketId - Socket ID of client
 * @param {string} eventType - Event type being rate limited
 * @returns {Object} Rate limit check result
 * @returns {boolean} result.allowed - True if event is allowed
 * @returns {number} [result.remaining] - Remaining events allowed in window
 * @returns {number} [result.retryAfterMs] - Milliseconds to wait before retry (if denied)
 * 
 * @example
 * const check = checkRateLimit(socket.id, 'bid');
 * if (!check.allowed) {
 *   socket.emit('error', `Rate limited. Retry after ${check.retryAfterMs}ms`);
 *   return;
 * }
 */
const checkRateLimit = (socketId, eventType) => {
  const config = RATE_LIMITS[eventType];
  
  // If no rate limit configured, allow
  if (!config) {
    return { allowed: true };
  }
  
  const now = Date.now();
  
  // Initialize client data if needed
  if (!clientLimits.has(socketId)) {
    clientLimits.set(socketId, {});
  }
  
  const clientData = clientLimits.get(socketId);
  
  // Initialize event tracking
  if (!clientData[eventType]) {
    clientData[eventType] = [];
  }
  
  // Clean up old tokens
  cleanupOldTokens(socketId, eventType, config.windowMs);
  
  const eventTimestamps = clientData[eventType];
  
  // Check if limit exceeded
  if (eventTimestamps.length >= config.maxEvents) {
    const oldestTimestamp = eventTimestamps[0];
    const retryAfterMs = config.windowMs - (now - oldestTimestamp);
    
    logger.warn(`Rate limit exceeded: ${eventType} from ${socketId}`, {
      limitConfig: config,
      retryAfter: retryAfterMs
    });
    
    return {
      allowed: false,
      remaining: 0,
      retryAfterMs: Math.max(0, retryAfterMs)
    };
  }
  
  // Add current token
  eventTimestamps.push(now);
  
  return {
    allowed: true,
    remaining: config.maxEvents - eventTimestamps.length
  };
};

/**
 * Clear rate limit data for a client (e.g., on disconnect)
 * @param {string} socketId - Socket ID to clear
 * 
 * @example
 * socket.on('disconnect', () => {
 *   clearRateLimit(socket.id);
 * });
 */
const clearRateLimit = (socketId) => {
  clientLimits.delete(socketId);
  logger.debug(`Rate limit data cleared for ${socketId}`);
};

/**
 * Create Socket.IO middleware for automatic rate limiting
 * @param {Object} io - Socket.IO instance
 * @returns {Function} Middleware function
 * 
 * @example
 * io.use(createRateLimitMiddleware(io));
 */
const createRateLimitMiddleware = (io) => {
  return (socket, next) => {
    // Store rate limit checker in socket for easy access
    socket.checkRateLimit = (eventType) => checkRateLimit(socket.id, eventType);
    
    // Clean up on disconnect
    socket.on('disconnect', () => {
      clearRateLimit(socket.id);
    });
    
    next();
  };
};

/**
 * Get current rate limit stats for all clients
 * Useful for monitoring and debugging
 * @returns {Object} Stats object with client data
 * 
 * @example
 * const stats = getRateLimitStats();
 * console.log(`${stats.totalClients} clients being rate limited`);
 */
const getRateLimitStats = () => {
  const stats = {
    totalClients: clientLimits.size,
    eventTypes: {},
    clientDetails: []
  };
  
  for (const [socketId, clientData] of clientLimits.entries()) {
    for (const [eventType, timestamps] of Object.entries(clientData)) {
      if (!stats.eventTypes[eventType]) {
        stats.eventTypes[eventType] = 0;
      }
      stats.eventTypes[eventType] += timestamps.length;
    }
    
    stats.clientDetails.push({
      socketId,
      eventsTracked: Object.keys(clientData).length
    });
  }
  
  return stats;
};

module.exports = {
  checkRateLimit,
  clearRateLimit,
  createRateLimitMiddleware,
  getRateLimitStats,
  RATE_LIMITS
};

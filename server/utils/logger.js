// server/utils/logger.js

/**
 * Simple logging utility with log levels
 * Provides consistent formatting and can be easily replaced with winston/pino later
 */

const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
};

// Set current log level from environment or default to INFO
const CURRENT_LEVEL = LOG_LEVELS[process.env.LOG_LEVEL?.toUpperCase()] ?? LOG_LEVELS.INFO;

// Color codes for terminal output
const COLORS = {
  DEBUG: '\x1b[36m', // Cyan
  INFO: '\x1b[32m',  // Green
  WARN: '\x1b[33m',  // Yellow
  ERROR: '\x1b[31m', // Red
  RESET: '\x1b[0m',
};

/**
 * Format timestamp
 */
function getTimestamp() {
  return new Date().toISOString();
}

/**
 * Log message with level
 */
function log(level, message, ...args) {
  if (LOG_LEVELS[level] < CURRENT_LEVEL) {
    return; // Skip if below current log level
  }

  const color = COLORS[level] || '';
  const timestamp = getTimestamp();
  const prefix = `${color}[${timestamp}] [${level}]${COLORS.RESET}`;
  
  if (args.length > 0) {
    console.log(prefix, message, ...args);
  } else {
    console.log(prefix, message);
  }
}

/**
 * Debug level logging (development only)
 */
function debug(message, ...args) {
  log('DEBUG', message, ...args);
}

/**
 * Info level logging (general information)
 */
function info(message, ...args) {
  log('INFO', message, ...args);
}

/**
 * Warning level logging
 */
function warn(message, ...args) {
  log('WARN', message, ...args);
}

/**
 * Error level logging
 */
function error(message, ...args) {
  log('ERROR', message, ...args);
}

/**
 * Log socket event (specialized logging)
 */
function socket(eventName, details = {}) {
  const emoji = getEventEmoji(eventName);
  info(`${emoji} Socket Event: ${eventName}`, details);
}

/**
 * Log room activity
 */
function room(action, roomCode, details = {}) {
  const emoji = getRoomEmoji(action);
  info(`${emoji} Room ${action}: ${roomCode}`, details);
}

/**
 * Get emoji for event type
 */
function getEventEmoji(eventName) {
  const emojiMap = {
    createRoom: '🎮',
    joinRoom: '👤',
    disconnect: '❌',
    auctionBid: '💰',
    matchState: '📊',
    tournament: '🏆',
  };
  
  for (const [key, emoji] of Object.entries(emojiMap)) {
    if (eventName.toLowerCase().includes(key.toLowerCase())) {
      return emoji;
    }
  }
  
  return '📡';
}

/**
 * Get emoji for room action
 */
function getRoomEmoji(action) {
  const emojiMap = {
    created: '🎮',
    joined: '👤',
    left: '📭',
    deleted: '🗑️',
    cleanup: '🧹',
  };
  
  return emojiMap[action.toLowerCase()] || '🏠';
}

/**
 * Log server startup
 */
function startup(config) {
  console.log(`
╔════════════════════════════════════════╗
║    CricSim Pro Server Running          ║
║    🎮 WebSocket Server Active          ║
║    📍 Port: ${config.port.toString().padEnd(28)}║
║    🌐 CORS: ${config.corsOrigins} origin(s) configured${' '.repeat(Math.max(0, 4 - config.corsOrigins.toString().length))}║
║    🧹 Auto-cleanup: Active             ║
║    📝 Log Level: ${config.logLevel.padEnd(21)}║
╚════════════════════════════════════════╝
  `);
}

module.exports = {
  debug,
  info,
  warn,
  error,
  socket,
  room,
  startup,
};

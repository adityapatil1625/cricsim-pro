# CricSim Pro Development Guide

## Table of Contents
1. [Setup & Installation](#setup--installation)
2. [Project Architecture](#project-architecture)
3. [Development Workflow](#development-workflow)
4. [Testing Strategy](#testing-strategy)
5. [Code Quality Standards](#code-quality-standards)
6. [Debugging Tips](#debugging-tips)
7. [Performance Guidelines](#performance-guidelines)
8. [Common Issues & Solutions](#common-issues--solutions)

---

## Setup & Installation

### Prerequisites
- Node.js 20.x+ (or 18.x, 22.x)
- npm 9.x+
- Git

### Initial Setup

```bash
# Clone the repository
git clone <repository-url>
cd cricsim-pro

# Install root dependencies
npm install

# Install server dependencies
cd server
npm install
cd ..

# Create environment file
cp .env.example .env
# Edit .env with your configuration
```

### Running the Application

**Development Mode (with hot reload):**
```bash
# Terminal 1: Start frontend dev server
npm run dev

# Terminal 2: Start backend server
cd server
npm run dev
```

**Production Build:**
```bash
# Build frontend
npm run build

# Start server
cd server
npm start
```

---

## Project Architecture

### Directory Structure

```
cricsim-pro/
├── src/                          # Frontend React application
│   ├── components/
│   │   ├── auction/              # Auction system components
│   │   ├── match/                # Match simulation components
│   │   ├── shared/               # Reusable UI components
│   │   └── tournament/           # Tournament features
│   ├── hooks/                    # Custom React hooks
│   │   ├── useAppState.js        # Global state management
│   │   └── useMatchEngine.js     # Cricket simulation engine
│   ├── pages/                    # Page components
│   ├── services/                 # API services
│   ├── utils/                    # Utility functions
│   ├── data/                     # Mock data & player pools
│   ├── constants/                # App constants
│   ├── config/                   # Configuration
│   └── test/                     # Test setup
│
├── server/                       # Express + Socket.IO backend
│   ├── controllers/              # Event handlers (modular)
│   │   ├── roomController.js
│   │   ├── auctionController.js
│   │   ├── matchController.js
│   │   ├── tournamentController.js
│   │   └── chatController.js
│   ├── utils/                    # Server utilities
│   │   ├── validation.js         # Input validation
│   │   ├── roomManager.js        # Room lifecycle
│   │   ├── logger.js             # Logging system
│   │   └── rateLimiter.js        # Rate limiting
│   └── server.js                 # Main server entry point
│
├── .github/
│   └── workflows/                # CI/CD pipelines
│
├── public/                       # Static assets
├── vite.config.js                # Frontend build config
├── vitest.config.js              # Test configuration
├── package.json                  # Root dependencies
└── API_DOCUMENTATION.md          # API reference
```

### Technology Stack

**Frontend:**
- React 18.3.1 with Hooks
- Vite 6.0.0 for bundling
- Tailwind CSS 3.4.14 for styling
- Socket.IO Client 4.8.1 for real-time communication
- Recharts 3.6.0 for data visualization

**Backend:**
- Express 5.1.0 for HTTP server
- Socket.IO 4.8.1 for WebSocket communication
- Helmet.js for security headers
- Compression middleware for gzip
- Custom rate limiting

**Testing:**
- Vitest for unit tests
- @testing-library/react for component tests
- jsdom for DOM simulation

### Architecture Patterns

**Client-Server Communication:**
- REST API for non-real-time operations (player search)
- Socket.IO for real-time multiplayer events
- Automatic reconnection with exponential backoff
- Rate limiting to prevent abuse

**State Management:**
- `useAppState()` hook for global application state
- Component-level state for UI interactions
- Socket.IO events for server-side state sync

**Code Organization:**
- Modular controllers (one per feature)
- Shared utilities and validators
- Centralized logging system
- JSDoc documentation throughout

---

## Development Workflow

### Creating a New Feature

#### 1. Backend (Socket.IO Event Handler)

```javascript
// server/controllers/myController.js
/**
 * @fileoverview My new feature handlers
 * @module myController
 */

const logger = require('../utils/logger');

/**
 * Initialize event handlers for my feature
 * @param {Server} io - Socket.IO instance
 * @param {Map} rooms - Active rooms map
 */
const initializeMyHandlers = (io, rooms) => {
  io.on('connection', (socket) => {
    socket.on('myNewEvent', (data) => {
      // Validate data
      if (!data.roomCode) {
        socket.emit('error', 'Room code required');
        return;
      }
      
      // Check rate limit
      const rateCheck = socket.checkRateLimit('myNewEvent');
      if (!rateCheck.allowed) {
        socket.emit('error', `Rate limited. Retry after ${rateCheck.retryAfterMs}ms`);
        return;
      }
      
      // Process logic
      logger.info(`Processing myNewEvent in room ${data.roomCode}`);
      
      // Broadcast to room
      io.to(data.roomCode).emit('myNewEventResult', { /* data */ });
    });
  });
};

module.exports = { initializeMyHandlers };
```

Then register in `server/server.js`:
```javascript
const { initializeMyHandlers } = require('./controllers/myController');

// In io.on('connection')
initializeMyHandlers(io, rooms);
```

#### 2. Add Validation (if needed)

```javascript
// server/utils/validation.js

/**
 * Validate my event data
 * @param {Object} data - Event data
 * @returns {Object} Validation result {valid, error, [result]}
 */
const validateMyEvent = (data) => {
  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'Data is required' };
  }
  
  // Add specific validations
  if (!data.roomCode || !data.roomCode.match(/^[A-Z0-9]{5}$/)) {
    return { valid: false, error: 'Invalid room code' };
  }
  
  return { valid: true };
};
```

#### 3. Frontend Component

```jsx
// src/components/MyFeature.jsx
import { useEffect } from 'react';
import { useSocket } from '../hooks/useSocket';

/**
 * @component MyFeature - Display and interact with my new feature
 * @param {Object} props
 * @param {string} props.roomCode - Current room code
 * @returns {JSX.Element}
 */
export const MyFeature = ({ roomCode }) => {
  const socket = useSocket();
  
  useEffect(() => {
    // Listen for server events
    socket?.on('myNewEventResult', (data) => {
      console.log('Event result:', data);
    });
    
    return () => {
      socket?.off('myNewEventResult');
    };
  }, [socket]);
  
  const handleTrigger = () => {
    // Emit to server
    socket?.emit('myNewEvent', {
      roomCode,
      // other data
    });
  };
  
  return (
    <button onClick={handleTrigger}>
      Trigger My Feature
    </button>
  );
};
```

---

## Testing Strategy

### Unit Tests

Test individual functions with `vitest`:

```javascript
// src/utils/__tests__/myUtil.test.js
import { describe, it, expect } from 'vitest';
import { myFunction } from '../myUtil';

describe('myFunction', () => {
  it('should handle valid input', () => {
    const result = myFunction({ x: 10, y: 20 });
    expect(result).toBe(30);
  });
  
  it('should throw on invalid input', () => {
    expect(() => myFunction(null)).toThrow();
  });
});
```

Run tests:
```bash
npm run test           # Watch mode
npm run test:run      # Single run
npm run test:coverage # With coverage report
npm run test:ui       # Visual UI
```

### Component Tests

Test React components with React Testing Library:

```javascript
// src/components/__tests__/MyComponent.test.jsx
import { render, screen, fireEvent } from '@testing-library/react';
import { MyComponent } from '../MyComponent';

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent title="Test" />);
    expect(screen.getByText('Test')).toBeInTheDocument();
  });
  
  it('handles click events', () => {
    const onClick = vi.fn();
    render(<MyComponent onClick={onClick} />);
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalled();
  });
});
```

### Integration Tests

Test Socket.IO events:

```javascript
// server/utils/__tests__/myController.test.js
import { describe, it, expect, beforeEach } from 'vitest';
import { validateMyEvent } from '../validation';

describe('My Event Validation', () => {
  it('validates room code format', () => {
    const result = validateMyEvent({ roomCode: 'ABC12' });
    expect(result.valid).toBe(true);
  });
});
```

---

## Code Quality Standards

### JSDoc Documentation

All functions must have JSDoc comments:

```javascript
/**
 * Calculate player match points based on performance
 * @param {Object} player - Player object
 * @param {number} player.runs - Runs scored
 * @param {number} player.wickets - Wickets taken
 * @param {number} [multiplier=1] - Points multiplier
 * @returns {number} Total match points
 * @throws {Error} If player object is invalid
 * 
 * @example
 * const points = calculatePoints({ runs: 50, wickets: 2 });
 * // returns 65
 */
export const calculatePoints = (player, multiplier = 1) => {
  // Implementation
};
```

### Logging Standards

Use the logger utility instead of console:

```javascript
// ❌ Don't do this
console.log('User joined');
console.error('Failed to bid');

// ✅ Do this
const logger = require('./utils/logger');
logger.info('User joined');
logger.error('Failed to bid', { userId, roomCode });
```

### Error Handling

Always validate input and handle errors:

```javascript
// ❌ Don't do this
const bid = (amount) => {
  team.purse -= amount; // No validation
};

// ✅ Do this
const bid = (teamId, amount) => {
  const validation = validateBidAmount(amount);
  if (!validation.valid) {
    logger.warn(`Invalid bid: ${validation.error}`);
    return { success: false, error: validation.error };
  }
  
  const team = getTeam(teamId);
  if (!team) {
    logger.error(`Team not found: ${teamId}`);
    return { success: false, error: 'Team not found' };
  }
  
  try {
    team.purse -= amount;
    logger.info(`Bid placed`, { teamId, amount });
    return { success: true };
  } catch (err) {
    logger.error(`Bid failed: ${err.message}`, { teamId, amount });
    return { success: false, error: 'Bid failed' };
  }
};
```

### Naming Conventions

- **Functions:** camelCase, verb-first: `createRoom()`, `validateInput()`
- **Variables:** camelCase: `playerName`, `isActive`
- **Constants:** UPPER_SNAKE_CASE: `MAX_TEAM_SIZE`, `AUCTION_CONFIG`
- **Files:** kebab-case (components), camelCase (utilities): `PlayerCard.jsx`, `appUtils.js`
- **Classes/Components:** PascalCase: `PlayerCard`, `AuctionRoom`

---

## Debugging Tips

### Browser DevTools

1. **Redux DevTools** (if using Redux):
   - Install extension for Chrome/Firefox
   - Track state changes

2. **React DevTools**:
   - Inspect component tree
   - Check props and state
   - Profile performance

3. **Network Tab**:
   - Monitor Socket.IO events in WS tab
   - Check HTTP requests

### Server Logging

View server logs with color coding:

```bash
cd server
npm run dev

# Output:
# [2024-01-15T10:30:45.123Z] ℹ INFO: Server starting
# [2024-01-15T10:30:46.456Z] ✓ INFO: Client connected (socket: abc123)
# [2024-01-15T10:30:47.789Z] ⚠ WARN: Rate limit exceeded
# [2024-01-15T10:30:48.012Z] ✗ ERROR: Validation failed
```

### Debug-Specific Code

```javascript
// Temporarily log variable values
if (process.env.DEBUG) {
  logger.debug('Variable state:', {
    userId,
    roomCode,
    playerState
  });
}

// Add breakpoints in Node.js
// server/package.json
{
  "scripts": {
    "debug": "node --inspect-brk server.js"
  }
}

# Then open chrome://inspect in Chrome
```

### Common Debugging Scenarios

**Issue: Socket.IO events not arriving**
```javascript
// Check if socket is connected
console.log(socket.connected); // Should be true
console.log(socket.id);         // Should have ID

// Check event listeners
console.log(socket.listeners('eventName')); // Should be non-empty

// Add debug logging
socket.onAny((event, ...args) => {
  console.log('Event received:', event, args);
});
```

**Issue: State not updating**
```javascript
// Check if state setter is being called
const [state, setState] = useState(initial);

const handleClick = () => {
  logger.debug('Before update:', state);
  setState(newState);
  logger.debug('After update:', newState); // Note: won't show old state yet
};
```

---

## Performance Guidelines

### Frontend Performance

1. **Code Splitting:**
```javascript
// vite.config.js - automatic vendor bundling
export default {
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'socket.io-client'],
          charts: ['recharts'],
          socket: ['socket.io-client']
        }
      }
    }
  }
}
```

2. **Lazy Loading:**
```jsx
import { lazy, Suspense } from 'react';

const AuctionRoom = lazy(() => import('./AuctionRoom'));

export function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AuctionRoom />
    </Suspense>
  );
}
```

3. **Memoization:**
```jsx
import { memo } from 'react';

export const PlayerCard = memo(({ player, onAdd }) => {
  return <div>{player.name}</div>;
});
```

### Backend Performance

1. **Rate Limiting:**
```javascript
// Prevents abuse and server overload
socket.checkRateLimit('bid'); // Returns allowed/denied with retry info
```

2. **Room Cleanup:**
```javascript
// Automatic cleanup every 15 minutes
startCleanupInterval(rooms, 15 * 60 * 1000);
```

3. **Connection Pooling:**
```javascript
// Monitor active connections
io.engine.clientsCount; // Number of connected clients
```

---

## Common Issues & Solutions

### "Cannot find module" Error

**Problem:** `Error: Cannot find module './utils/logger'`

**Solution:**
1. Check file path is correct (case-sensitive on Linux/Mac)
2. Verify file exists: `ls server/utils/logger.js`
3. Check import syntax: `require()` vs `import`

### Socket.IO Connection Fails

**Problem:** WebSocket connection fails, connection timeout

**Solutions:**
1. Check CORS configuration in `server.js`
2. Verify server is running: `netstat -an | grep 4000`
3. Check firewall allows port 4000
4. Enable debug logging:
```javascript
const socket = io('http://localhost:4000', {
  debug: true
});
```

### Tests Failing with "Cannot find module"

**Problem:** Tests can't resolve modules

**Solution:**
1. Ensure `vitest.config.js` has correct `root` path
2. Check `module.path` is set correctly
3. Rebuild: `npm ci && npm run test`

### Rate Limit Exceeded Error

**Problem:** Getting "Rate limit exceeded" error frequently

**Solutions:**
1. Check `RATE_LIMITS` config in `server/utils/rateLimiter.js`
2. Batch updates on client side:
```javascript
// Don't: Emit 20 individual updates
for (let i = 0; i < 20; i++) {
  socket.emit('update', data[i]);
}

// Do: Batch into single emit
socket.emit('updateBatch', data);
```

3. Add debouncing for high-frequency events:
```javascript
import { debounce } from './utils/appUtils';

const debouncedUpdate = debounce((value) => {
  socket.emit('playerSelect', value);
}, 300);
```

### Memory Leak: Listeners Not Cleaned Up

**Problem:** React components create duplicate event listeners

**Solution:**
```jsx
useEffect(() => {
  const handleEvent = (data) => {
    // Handle event
  };
  
  socket.on('eventName', handleEvent);
  
  // Clean up on unmount
  return () => {
    socket.off('eventName', handleEvent);
  };
}, [socket]);
```

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make changes and test: `npm run test`
4. Commit: `git commit -am 'Add my feature'`
5. Push: `git push origin feature/my-feature`
6. Create Pull Request

All PRs must:
- Pass all tests (`npm run test`)
- Have no lint errors (`npm run lint`)
- Include JSDoc documentation
- Follow code quality standards
- Have appropriate test coverage

---

## Resources

- [React Documentation](https://react.dev)
- [Vite Guide](https://vitejs.dev)
- [Socket.IO Docs](https://socket.io/docs)
- [Express Guide](https://expressjs.com)
- [Vitest Documentation](https://vitest.dev)
- [Tailwind CSS](https://tailwindcss.com)

---

## Support

- Check [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) for API reference
- Open an issue on GitHub for bugs
- Discuss features in GitHub Discussions

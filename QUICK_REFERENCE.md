# CricSim Pro - Quick Reference Checklist

## Development Quick Start

### First Time Setup ✓
- [ ] Clone repository: `git clone <repo>`
- [ ] Install deps: `npm install` (root and `cd server && npm install`)
- [ ] Copy env file: `cp .env.example .env`
- [ ] Start dev servers: `npm run dev` (frontend) + `cd server && npm run dev` (backend)
- [ ] Verify working: http://localhost:5173

### Running Tests ✓
- [ ] Watch mode: `npm run test`
- [ ] Single run: `npm run test:run`
- [ ] Coverage: `npm run test:coverage`
- [ ] Visual UI: `npm run test:ui`

### Code Quality ✓
- [ ] Check tests pass: `npm run test:run`
- [ ] Check for console.log (use logger instead)
- [ ] Add JSDoc to new functions
- [ ] Run lint if available: `npm run lint`

---

## Architecture Reference

### Socket Events Flow
```
Client emits → Server validates → Rate limit check → Process → Broadcast to room
```

### File Organization
```
src/
  ├── components/     # React components (split by feature)
  ├── hooks/          # Custom hooks (state, logic)
  ├── utils/          # Helper functions
  ├── services/       # API calls
  ├── data/           # Mock data
  └── pages/          # Page-level components

server/
  ├── controllers/    # Event handlers (one per feature)
  ├── utils/          # Validation, logging, room mgmt
  └── server.js       # Main entry point
```

---

## Common Commands

### Development
```bash
npm run dev              # Frontend dev server
cd server && npm run dev # Backend server with auto-restart

npm run build            # Build for production
npm run preview          # Preview production build
```

### Testing
```bash
npm run test             # Tests in watch mode
npm run test:run         # Run tests once
npm run test:coverage    # Generate coverage report
npm run test:ui          # Visual test dashboard
```

### Server
```bash
cd server
npm run dev              # Development with auto-restart
npm start                # Production server
npm run debug            # Debug mode with inspector
```

---

## Code Style Guidelines

### Naming
```
Functions:     camelCase, verb-first: createRoom(), validateInput()
Variables:     camelCase: playerName, isActive
Constants:     UPPER_SNAKE_CASE: MAX_TEAM_SIZE, AUCTION_CONFIG
Files:         kebab-case or camelCase: PlayerCard.jsx, appUtils.js
Components:    PascalCase: PlayerCard, AuctionRoom
```

### JSDoc Template
```javascript
/**
 * Brief description of what function does
 * @param {type} paramName - Description
 * @param {type} [optionalParam=default] - Optional param
 * @returns {type} What is returned
 * @throws {Error} What error is thrown
 * 
 * @example
 * const result = myFunction(param);
 * // returns something
 */
export const myFunction = (paramName, optionalParam = default) => {
  // Implementation
};
```

### Logging
```javascript
const logger = require('./utils/logger');

logger.info('Normal operation', { userId, roomCode });
logger.warn('Something unexpected', { data });
logger.error('Something failed', { error: err.message });
logger.debug('Detailed info', { verbose: true }); // For development
```

### Validation Pattern
```javascript
// Always validate input
const result = validateInput(data);
if (!result.valid) {
  socket.emit('error', result.error);
  return;
}

// Check rate limit
const rateCheck = socket.checkRateLimit('eventName');
if (!rateCheck.allowed) {
  socket.emit('error', `Rate limited. Retry after ${rateCheck.retryAfterMs}ms`);
  return;
}

// Process logic
// ...
```

---

## Adding New Features

### Backend (Socket.IO Event)
1. Create handler in appropriate controller
2. Add validation function if needed
3. Add rate limit config to `rateLimiter.js`
4. Register event in `server.js`
5. Add JSDoc comments
6. Test with client

### Frontend (React Component)
1. Create component in `src/components`
2. Add event listeners with cleanup
3. Emit socket events with validation
4. Add JSDoc to component
5. Add component test
6. Integrate into pages

---

## Debugging Checklist

### Socket.IO Issues
- [ ] Check `socket.connected` is true
- [ ] Verify CORS allows origin
- [ ] Check firewall allows port 4000
- [ ] Look for errors in browser console
- [ ] Look for errors in server logs
- [ ] Enable Socket.IO debug: `localStorage.debug = '*'`

### State Issues
- [ ] Check initial state is correct
- [ ] Verify setter is called
- [ ] Check component re-renders
- [ ] Use React DevTools to inspect state
- [ ] Add console.log to debug (will be cleaned up)

### Rate Limiting Issues
- [ ] Check event is in RATE_LIMITS config
- [ ] Verify limits aren't too strict
- [ ] Check `retryAfterMs` from response
- [ ] Monitor logs for rate limit warnings

### Build Issues
- [ ] Delete node_modules: `rm -rf node_modules`
- [ ] Clear cache: `npm cache clean --force`
- [ ] Reinstall: `npm install`
- [ ] Check Node version: `node --version`

---

## Performance Checklist

### Client Side
- [ ] Use lazy loading for components
- [ ] Memoize expensive components
- [ ] Debounce high-frequency events
- [ ] Monitor bundle size: `npm run build`
- [ ] Check code splitting is working
- [ ] Profile with React DevTools

### Server Side
- [ ] Monitor active connections: `io.engine.clientsCount`
- [ ] Check memory usage: `process.memoryUsage()`
- [ ] Verify room cleanup is running
- [ ] Monitor rate limit stats
- [ ] Check database queries (if applicable)

---

## Security Checklist

- [ ] All inputs validated
- [ ] No sensitive data in logs
- [ ] CORS configured for allowed origins only
- [ ] Rate limiting prevents abuse
- [ ] Security headers via Helmet
- [ ] Error messages don't expose internals
- [ ] Dependencies up to date: `npm outdated`

---

## Deployment Checklist

### Before Deploying
- [ ] All tests pass: `npm run test:run`
- [ ] No console.log statements
- [ ] Environment variables configured
- [ ] API documentation updated
- [ ] Database migrations run (if applicable)
- [ ] Backup created

### Deployment Steps
1. Build frontend: `npm run build`
2. Test production build: `npm run preview`
3. Deploy frontend (Vercel, Netlify, etc.)
4. Deploy backend (Heroku, AWS, DigitalOcean, etc.)
5. Set environment variables in production
6. Run database migrations
7. Verify connectivity
8. Monitor error tracking (Sentry, etc.)

### Post-Deployment
- [ ] Test critical flows work
- [ ] Check logs for errors
- [ ] Monitor performance metrics
- [ ] Verify monitoring/alerts are active
- [ ] Communicate status to stakeholders

---

## Quick Reference - File Purposes

| File | Purpose |
|------|---------|
| `src/hooks/useAppState.js` | Global state management |
| `src/hooks/useMatchEngine.js` | Cricket simulation logic |
| `src/utils/auctionUtils.js` | Auction helper functions |
| `src/utils/appUtils.js` | General app utilities |
| `server/server.js` | Main server entry point |
| `server/controllers/*.js` | Socket.IO event handlers |
| `server/utils/validation.js` | Input validation |
| `server/utils/logger.js` | Structured logging |
| `server/utils/roomManager.js` | Room lifecycle |
| `server/utils/rateLimiter.js` | Rate limiting |

---

## Common Tasks

### Add a Socket.IO Event
```javascript
// 1. In appropriate controller
export const initializeMyHandlers = (io, rooms) => {
  io.on('connection', (socket) => {
    socket.on('myEvent', (data) => {
      // Validate
      const check = socket.checkRateLimit('myEvent');
      if (!check.allowed) return socket.emit('error', 'Rate limited');
      
      // Process
      // Broadcast
      io.to(data.roomCode).emit('myEventResult', result);
    });
  });
};

// 2. Register in server.js
initializeMyHandlers(io, rooms);

// 3. In validation.js
const validateMyEvent = (data) => {
  if (!data) return { valid: false, error: 'Data required' };
  return { valid: true };
};

// 4. In rateLimiter.js
RATE_LIMITS.myEvent = { maxEvents: 10, windowMs: 5000 };

// 5. Add JSDoc comments
// 6. Write tests
```

### Create a React Component
```javascript
/**
 * @component MyComponent - Brief description
 * @param {Object} props
 * @param {string} props.title - Prop description
 * @returns {JSX.Element}
 */
export const MyComponent = ({ title }) => {
  useEffect(() => {
    // Cleanup listeners
    return () => {
      socket?.off('eventName');
    };
  }, [socket]);
  
  return <div>{title}</div>;
};

// Test: Create __tests__/MyComponent.test.jsx
// Update parent component to use it
```

---

## Useful Links

| Resource | Link |
|----------|------|
| API Docs | [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) |
| Dev Guide | [DEVELOPMENT.md](./DEVELOPMENT.md) |
| React | https://react.dev |
| Vite | https://vitejs.dev |
| Socket.IO | https://socket.io/docs |
| Vitest | https://vitest.dev |

---

## Emergency Contacts

### Common Issues
1. **Server won't start** → Check port 4000 is free, check .env
2. **Tests failing** → Run `npm ci && npm run test:run`
3. **Socket connections failing** → Check CORS, check firewall
4. **Rate limited constantly** → Check limits in rateLimiter.js
5. **Out of memory** → Check room cleanup is running

### Quick Debug
```bash
# Server logs with color
cd server && npm run dev

# Client errors
Open DevTools (F12) → Console

# Socket events
localStorage.debug = '*'; // In browser console

# Rate limit stats
socket.checkRateLimit('anyEvent'); // Returns stats

# Memory usage
node --inspect server.js # Then open chrome://inspect
```

---

**Last Updated:** January 2024
**Keep this handy while developing!**

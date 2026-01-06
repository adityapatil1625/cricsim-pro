#!/usr/bin/env node

/**
 * API Connectivity Test Script
 * Run this to verify your API setup is working correctly
 * 
 * Usage: node test-api.js
 */

const http = require('http');

const BACKEND_URL = 'http://localhost:4000';

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testEndpoint(path, method = 'GET') {
  return new Promise((resolve) => {
    const url = new URL(BACKEND_URL + path);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      timeout: 5000
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });

    req.on('error', (err) => {
      resolve({
        status: null,
        error: err.message
      });
    });

    req.on('timeout', () => {
      req.abort();
      resolve({
        status: null,
        error: 'Connection timeout'
      });
    });

    req.end();
  });
}

async function main() {
  console.log('\n');
  log('cyan', '═══════════════════════════════════════════════════════');
  log('cyan', '  CricSim Pro - API Connectivity Test');
  log('cyan', '═══════════════════════════════════════════════════════\n');

  log('blue', `Testing Backend: ${BACKEND_URL}\n`);

  // Test 1: Health Check
  log('yellow', '[TEST 1] Health Check Endpoint');
  const healthRes = await testEndpoint('/');
  if (healthRes.error) {
    log('red', `❌ FAILED: ${healthRes.error}`);
    log('red', `⚠️  Make sure the backend server is running on port 4000`);
    log('red', `   Run: cd server && npm run dev\n`);
  } else {
    log('green', `✅ SUCCESS: Status ${healthRes.status}`);
    try {
      const body = JSON.parse(healthRes.body);
      log('green', `   Response: ${JSON.stringify(body)}\n`);
    } catch {
      log('green', `   Response: ${healthRes.body}\n`);
    }
  }

  // Test 2: Players Search (without query)
  log('yellow', '[TEST 2] Players Search - Missing Query');
  const noQueryRes = await testEndpoint('/api/players/search');
  if (noQueryRes.error) {
    log('red', `❌ ERROR: ${noQueryRes.error}\n`);
  } else {
    log('green', `✅ Responded with status ${noQueryRes.statusCode}`);
    try {
      const body = JSON.parse(noQueryRes.body);
      log('green', `   Response: ${JSON.stringify(body, null, 2).substring(0, 200)}...\n`);
    } catch {
      log('green', `   Response: ${noQueryRes.body}\n`);
    }
  }

  // Test 3: Players Search (with query)
  log('yellow', '[TEST 3] Players Search - Query: "virat"');
  const searchRes = await testEndpoint('/api/players/search?query=virat');
  if (searchRes.error) {
    log('red', `❌ ERROR: ${searchRes.error}\n`);
  } else {
    log('green', `✅ Responded with status ${searchRes.status}`);
    try {
      const body = JSON.parse(searchRes.body);
      if (body.error) {
        log('yellow', `⚠️  API Warning: ${body.error}`);
        log('yellow', `   ${body.reason || 'No API key configured or external API unreachable'}`);
      } else if (body.players && body.players.length > 0) {
        log('green', `   Found ${body.players.length} players`);
        log('green', `   Sample: ${JSON.stringify(body.players[0], null, 2).substring(0, 150)}...`);
      } else {
        log('green', `   No players found (empty results)`);
      }
    } catch {
      log('yellow', `   Raw response: ${searchRes.body.substring(0, 200)}`);
    }
    console.log();
  }

  // Summary
  log('cyan', '═══════════════════════════════════════════════════════');
  log('cyan', '  Summary');
  log('cyan', '═══════════════════════════════════════════════════════\n');

  if (healthRes.error) {
    log('red', '❌ Backend server is NOT running or unreachable');
    log('red', '\nTo fix:');
    log('yellow', '  1. Open a terminal');
    log('yellow', '  2. cd server');
    log('yellow', '  3. npm install (first time only)');
    log('yellow', '  4. npm run dev');
  } else {
    log('green', '✅ Backend server is REACHABLE');
    log('green', '✅ Health check endpoint is working');
    
    if (!searchRes.error) {
      log('green', '✅ Players search endpoint is responding');
    }
    
    log('\n📝 Notes:');
    log('yellow', '  • If players list is empty, CRICKETDATA_API_KEY may not be set');
    log('yellow', '  • To use live player data:');
    log('yellow', '    1. Get free key from https://cricketdata.org/');
    log('yellow', '    2. Add to server/.env: CRICKETDATA_API_KEY=your_key');
    log('yellow', '    3. Restart server');
  }

  console.log('\n');
  log('cyan', 'For more details, see API_DIAGNOSTICS.md');
  console.log();
}

main().catch(console.error);

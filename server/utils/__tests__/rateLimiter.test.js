/**
 * @fileoverview Tests for rate limiting utility
 * @module rateLimiter.test
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  checkRateLimit,
  clearRateLimit,
  getRateLimitStats,
  RATE_LIMITS
} from '../rateLimiter';

describe('Rate Limiter Utility', () => {
  const testSocketId = 'socket-123';

  afterEach(() => {
    clearRateLimit(testSocketId);
  });

  describe('checkRateLimit', () => {
    it('allows events within rate limit', () => {
      const result = checkRateLimit(testSocketId, 'chat');
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(RATE_LIMITS.chat.maxEvents - 1);
    });

    it('allows multiple events until limit exceeded', () => {
      const limit = RATE_LIMITS.chat.maxEvents;
      
      for (let i = 0; i < limit; i++) {
        const result = checkRateLimit(testSocketId, 'chat');
        expect(result.allowed).toBe(true);
      }
      
      // Next event should be denied
      const result = checkRateLimit(testSocketId, 'chat');
      expect(result.allowed).toBe(false);
    });

    it('denies events exceeding rate limit', () => {
      const limit = RATE_LIMITS.createRoom.maxEvents;
      
      // Fill up the limit
      for (let i = 0; i < limit; i++) {
        checkRateLimit(testSocketId, 'createRoom');
      }
      
      // Exceeded event
      const result = checkRateLimit(testSocketId, 'createRoom');
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
      expect(result.retryAfterMs).toBeGreaterThan(0);
    });

    it('returns retryAfterMs when rate limited', () => {
      const config = RATE_LIMITS.bid;
      
      // Fill up the limit
      for (let i = 0; i < config.maxEvents; i++) {
        checkRateLimit(testSocketId, 'bid');
      }
      
      const result = checkRateLimit(testSocketId, 'bid');
      expect(result.allowed).toBe(false);
      expect(result.retryAfterMs).toBeLessThanOrEqual(config.windowMs);
      expect(result.retryAfterMs).toBeGreaterThanOrEqual(0);
    });

    it('allows events for unconfigured event types', () => {
      const result = checkRateLimit(testSocketId, 'unknownEvent');
      expect(result.allowed).toBe(true);
    });

    it('tracks different event types independently', () => {
      const limit1 = RATE_LIMITS.chat.maxEvents;
      const limit2 = RATE_LIMITS.bid.maxEvents;
      
      // Fill up chat limit
      for (let i = 0; i < limit1; i++) {
        checkRateLimit(testSocketId, 'chat');
      }
      
      // Chat should be limited
      expect(checkRateLimit(testSocketId, 'chat').allowed).toBe(false);
      
      // But bid should still be allowed
      expect(checkRateLimit(testSocketId, 'bid').allowed).toBe(true);
    });
  });

  describe('clearRateLimit', () => {
    it('removes all rate limit data for a client', () => {
      // Fill up some limits
      checkRateLimit(testSocketId, 'chat');
      checkRateLimit(testSocketId, 'bid');
      
      // Clear
      clearRateLimit(testSocketId);
      
      // Should be reset
      const result = checkRateLimit(testSocketId, 'chat');
      expect(result.remaining).toBe(RATE_LIMITS.chat.maxEvents - 1);
    });
  });

  describe('getRateLimitStats', () => {
    it('returns stats object with correct structure', () => {
      checkRateLimit(testSocketId, 'chat');
      const stats = getRateLimitStats();
      
      expect(stats).toHaveProperty('totalClients');
      expect(stats).toHaveProperty('eventTypes');
      expect(stats).toHaveProperty('clientDetails');
    });

    it('counts correct number of clients', () => {
      checkRateLimit('socket-1', 'chat');
      checkRateLimit('socket-2', 'chat');
      
      const stats = getRateLimitStats();
      expect(stats.totalClients).toBe(2);
    });

    it('tracks event usage correctly', () => {
      checkRateLimit(testSocketId, 'chat');
      checkRateLimit(testSocketId, 'chat');
      checkRateLimit(testSocketId, 'bid');
      
      const stats = getRateLimitStats();
      expect(stats.eventTypes.chat).toBe(2);
      expect(stats.eventTypes.bid).toBe(1);
    });
  });

  describe('RATE_LIMITS config', () => {
    it('has configuration for critical events', () => {
      expect(RATE_LIMITS.bid).toBeDefined();
      expect(RATE_LIMITS.createRoom).toBeDefined();
      expect(RATE_LIMITS.joinRoom).toBeDefined();
    });

    it('has reasonable default limits', () => {
      Object.entries(RATE_LIMITS).forEach(([eventType, config]) => {
        expect(config.maxEvents).toBeGreaterThan(0);
        expect(config.windowMs).toBeGreaterThan(0);
      });
    });
  });
});

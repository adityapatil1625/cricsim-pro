// server/utils/__tests__/validation.test.js
const { describe, it, expect } = require('vitest');
const {
  validateRoomCode,
  validatePlayerName,
  validateGameMode,
  validateBidAmount,
} = require('../validation');

describe('validation', () => {
  describe('validateRoomCode', () => {
    it('should accept valid room codes', () => {
      expect(validateRoomCode('ABC12').valid).toBe(true);
      expect(validateRoomCode('XYZ99').valid).toBe(true);
      expect(validateRoomCode('hello').valid).toBe(true);
    });

    it('should uppercase the code', () => {
      const result = validateRoomCode('abc12');
      expect(result.valid).toBe(true);
      expect(result.code).toBe('ABC12');
    });

    it('should reject invalid codes', () => {
      expect(validateRoomCode('').valid).toBe(false);
      expect(validateRoomCode('AB').valid).toBe(false); // Too short
      expect(validateRoomCode('ABCDEF').valid).toBe(false); // Too long
      expect(validateRoomCode(null).valid).toBe(false);
      expect(validateRoomCode(undefined).valid).toBe(false);
    });
  });

  describe('validatePlayerName', () => {
    it('should accept valid player names', () => {
      expect(validatePlayerName('John Doe').valid).toBe(true);
      expect(validatePlayerName('Player123').valid).toBe(true);
    });

    it('should trim whitespace', () => {
      const result = validatePlayerName('  John  ');
      expect(result.valid).toBe(true);
      expect(result.name).toBe('John');
    });

    it('should reject too short names', () => {
      expect(validatePlayerName('A').valid).toBe(false);
      expect(validatePlayerName(' ').valid).toBe(false);
    });

    it('should reject too long names', () => {
      const longName = 'A'.repeat(31);
      expect(validatePlayerName(longName).valid).toBe(false);
    });

    it('should reject names with invalid characters', () => {
      expect(validatePlayerName('<script>').valid).toBe(false);
      expect(validatePlayerName('{}').valid).toBe(false);
    });
  });

  describe('validateGameMode', () => {
    it('should accept valid game modes', () => {
      expect(validateGameMode('1v1').valid).toBe(true);
      expect(validateGameMode('tournament').valid).toBe(true);
      expect(validateGameMode('auction').valid).toBe(true);
    });

    it('should reject invalid game modes', () => {
      expect(validateGameMode('invalid').valid).toBe(false);
      expect(validateGameMode('').valid).toBe(false);
      expect(validateGameMode(null).valid).toBe(false);
    });
  });

  describe('validateBidAmount', () => {
    it('should accept valid bid amounts', () => {
      expect(validateBidAmount(100).valid).toBe(true);
      expect(validateBidAmount(0).valid).toBe(true);
      expect(validateBidAmount(5000).valid).toBe(true);
    });

    it('should reject non-numbers', () => {
      expect(validateBidAmount('100').valid).toBe(false);
      expect(validateBidAmount(null).valid).toBe(false);
      expect(validateBidAmount(undefined).valid).toBe(false);
    });

    it('should reject negative amounts', () => {
      expect(validateBidAmount(-10).valid).toBe(false);
    });

    it('should reject decimals', () => {
      expect(validateBidAmount(10.5).valid).toBe(false);
    });

    it('should reject amounts over limit', () => {
      expect(validateBidAmount(10001).valid).toBe(false);
    });
  });
});

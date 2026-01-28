// src/utils/__tests__/appUtils.test.js
import { describe, it, expect } from 'vitest';
import {
  capitalizeFirstLetter,
  generateId,
  getTeamDisplay,
  initializeTeam,
} from '../appUtils';

describe('appUtils', () => {
  describe('capitalizeFirstLetter', () => {
    it('should capitalize the first letter', () => {
      expect(capitalizeFirstLetter('hello')).toBe('Hello');
      expect(capitalizeFirstLetter('world')).toBe('World');
    });

    it('should handle empty strings', () => {
      expect(capitalizeFirstLetter('')).toBe('');
    });

    it('should handle null/undefined', () => {
      expect(capitalizeFirstLetter(null)).toBe('');
      expect(capitalizeFirstLetter(undefined)).toBe('');
    });

    it('should handle already capitalized strings', () => {
      expect(capitalizeFirstLetter('Hello')).toBe('Hello');
    });
  });

  describe('generateId', () => {
    it('should generate a unique string ID', () => {
      const id1 = generateId();
      const id2 = generateId();
      
      expect(typeof id1).toBe('string');
      expect(typeof id2).toBe('string');
      expect(id1).not.toBe(id2);
    });

    it('should generate IDs of consistent length', () => {
      const ids = Array.from({ length: 10 }, () => generateId());
      const lengths = ids.map(id => id.length);
      
      expect(new Set(lengths).size).toBe(1); // All same length
    });
  });

  describe('initializeTeam', () => {
    it('should initialize a team with correct structure', () => {
      const team = initializeTeam('A', 'Team Alpha', 'CSK');
      
      expect(team).toEqual({
        id: 'A',
        name: 'Team Alpha',
        iplTeamId: 'CSK',
        players: [],
        played: 0,
        won: 0,
        pts: 0,
        nrr: 0,
        runsScored: 0,
        oversFaced: 0,
        runsConceded: 0,
        oversBowled: 0,
      });
    });

    it('should work without IPL team ID', () => {
      const team = initializeTeam('B', 'Team Beta');
      
      expect(team.id).toBe('B');
      expect(team.name).toBe('Team Beta');
      expect(team.iplTeamId).toBe(null);
    });
  });

  describe('getTeamDisplay', () => {
    it('should return default values for null team', () => {
      const display = getTeamDisplay(null);
      
      expect(display).toEqual({
        name: 'Unknown',
        logo: null,
        color: '#666',
        shortName: 'Unknown'
      });
    });

    it('should return team name for non-IPL team', () => {
      const team = { id: 'A', name: 'Custom Team', players: [] };
      const display = getTeamDisplay(team);
      
      expect(display.name).toBe('Custom Team');
      expect(display.shortName).toBe('Custom Team');
    });
  });
});

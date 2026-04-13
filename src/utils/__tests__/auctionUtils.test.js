import { describe, expect, it } from 'vitest';
import {
  formatAuctionPrice,
  getTeamRoleBalance,
  normalizeAuctionRole,
  validateTeamComposition,
} from '../auctionUtils';

describe('auctionUtils', () => {
  it('normalizes player roles from the IPL auction data', () => {
    expect(normalizeAuctionRole('BATTER')).toBe('batter');
    expect(normalizeAuctionRole('BOWLER')).toBe('bowler');
    expect(normalizeAuctionRole('ALL-ROUNDER')).toBe('allrounder');
    expect(normalizeAuctionRole('WICKETKEEPER')).toBe('wicketkeeper');
  });

  it('counts role balance for uppercase and hyphenated auction roles', () => {
    const squad = [
      { role: 'BATTER' },
      { role: 'BOWLER' },
      { role: 'ALL-ROUNDER' },
      { role: 'WICKETKEEPER' },
    ];

    expect(getTeamRoleBalance(squad)).toEqual({
      batters: 1,
      bowlers: 1,
      allrounders: 1,
      wicketkeepers: 1,
    });
  });

  it('respects AuctionRoom-style validation config keys', () => {
    const squad = [{ role: 'BATTER' }, { role: 'BOWLER' }];

    expect(validateTeamComposition(squad, {
      SQUAD_MIN: 2,
      SQUAD_MAX: 2,
      MAX_OVERSEAS: 1,
    }).isValid).toBe(true);
  });

  it('formats lakh-based auction prices consistently', () => {
    expect(formatAuctionPrice(75)).toBe('Rs 75L');
    expect(formatAuctionPrice(200)).toBe('Rs 2Cr');
    expect(formatAuctionPrice(225)).toBe('Rs 2.25Cr');
  });
});

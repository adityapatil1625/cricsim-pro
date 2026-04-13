/**
 * AuctionAnalytics.jsx
 * Analytics and insights widgets
 */

import React from 'react';
import { formatAuctionPrice } from '../../utils/auctionUtils';

const AuctionAnalytics = ({ teams = [], soldPlayers = [], currentPlayer = null, queue = [], fullQueue = [], getSetById = null }) => {
  // Config - must be declared before use
  const AUCTION_CONFIG = {
    TOTAL_PURSE: 1000,
  };

  // Calculate insights
  const getMostExpensivePlayer = () => {
    if (!soldPlayers.length) return null;
    return soldPlayers.reduce((max, p) => 
      (p.price || 0) > (max.price || 0) ? p : max
    );
  };

  const getHighestSpendingTeam = () => {
    if (!teams.length) return null;
    const spending = teams.map(t => {
      // If purse is not set, assume it's full purse (team hasn't spent anything yet)
      const actualPurse = t.purse !== undefined ? t.purse : AUCTION_CONFIG.TOTAL_PURSE;
      return {
        ...t,
        purse: actualPurse,
        totalSpend: AUCTION_CONFIG.TOTAL_PURSE - actualPurse,
      };
    });
    return spending.reduce((max, t) => 
      (t.totalSpend || 0) > (max.totalSpend || 0) ? t : max
    );
  };

  const getMostExpensiveUncapped = () => {
    if (!soldPlayers.length) return null;
    const uncapped = soldPlayers.filter(p => p.player?.isUncapped);
    if (!uncapped.length) return null;
    return uncapped.reduce((max, p) => 
      (p.price || 0) > (max.price || 0) ? p : max
    );
  };

  const getMostExpensiveCapped = () => {
    if (!soldPlayers.length) return null;
    const capped = soldPlayers.filter(p => !p.player?.isUncapped);
    if (!capped.length) return null;
    return capped.reduce((max, p) => 
      (p.price || 0) > (max.price || 0) ? p : max
    );
  };

  const getTotalRemainingPurse = () => {
    return teams.reduce(
      (sum, t) => sum + (t.purse !== undefined ? t.purse : AUCTION_CONFIG.TOTAL_PURSE),
      0
    );
  };

  const getOverseasPlayersCount = () => {
    return soldPlayers.filter(p => p.player?.isOverseas).length;
  };

  const mostExpensive = getMostExpensivePlayer();
  const highestSpender = getHighestSpendingTeam();
  const mostExpensiveUncapped = getMostExpensiveUncapped();
  const mostExpensiveCapped = getMostExpensiveCapped();
  const totalRemainingPurse = getTotalRemainingPurse();
  const overseasCount = getOverseasPlayersCount();

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
      {/* Most Expensive Player */}
      {mostExpensive && (
        <div className="bg-gradient-to-br from-purple-900 to-purple-950 rounded-lg border border-purple-700 p-3">
          <div className="text-[9px] font-bold text-purple-300 uppercase tracking-wider mb-1">
            💎 Most Expensive
          </div>
          <div className="text-xs text-white font-bold truncate">
            {mostExpensive.player?.name}
          </div>
          <div className="text-base font-bold text-purple-300 mt-1">
            {formatAuctionPrice(mostExpensive.price)}
          </div>
          <div className="text-[9px] text-purple-400 mt-1">
            {mostExpensive.team?.iplTeamId}
          </div>
        </div>
      )}

      {/* Highest Spender - Compact */}
      {highestSpender && (
        <div className="bg-gradient-to-br from-red-900 to-red-950 rounded-lg border border-red-700 p-1.5 h-fit">
          <div className="text-xs font-bold text-red-300 uppercase tracking-wider mb-0.5">
            💰 Top Spender
          </div>
          <div className="flex items-center gap-0.5 mb-0.5">
            <img
              src={highestSpender.iplTeam?.logo}
              alt={highestSpender.iplTeamId}
              className="w-4 h-4 object-contain"
            />
            <div className="text-xs text-white font-bold truncate">
              {highestSpender.iplTeamId}
            </div>
          </div>
          <div className="border-t border-red-700/50 pt-0.5">
            <p className="text-[11px] text-red-400">Spent: {formatAuctionPrice(highestSpender.totalSpend || 0)}</p>
            <p className="text-[11px] text-red-400">Left: {formatAuctionPrice(highestSpender.purse)}</p>
          </div>
        </div>
      )}

      {/* Most Expensive Uncapped */}
      {mostExpensiveUncapped && (
        <div className="bg-gradient-to-br from-emerald-900 to-emerald-950 rounded-lg border border-emerald-700 p-3">
          <div className="text-[9px] font-bold text-emerald-300 uppercase tracking-wider mb-1">
            ⭐ Priciest Uncapped
          </div>
          <div className="text-xs text-white font-bold truncate">
            {mostExpensiveUncapped.player?.name}
          </div>
          <div className="text-base font-bold text-emerald-300 mt-1">
            {formatAuctionPrice(mostExpensiveUncapped.price)}
          </div>
          <div className="text-[9px] text-emerald-400 mt-1">
            {mostExpensiveUncapped.player?.country}
          </div>
        </div>
      )}

      {/* Players Sold - Compact */}
      <div className="bg-gradient-to-br from-blue-900 to-blue-950 rounded-lg border border-blue-700 p-1.5 h-fit">
        <div className="text-xs font-bold text-blue-300 uppercase tracking-wider mb-0.5">
          ✅ Players Sold
        </div>
        <div className="text-lg font-bold text-blue-300 mb-0.5">
          {soldPlayers.length}
        </div>
        <div className="border-t border-blue-700/50 pt-0.5">
          <p className="text-[11px] text-blue-400">Total: {formatAuctionPrice(soldPlayers.reduce((sum, p) => sum + (p.price || 0), 0))}</p>
          <p className="text-[11px] text-blue-400">Avg: {formatAuctionPrice(soldPlayers.length > 0 ? Number((soldPlayers.reduce((sum, p) => sum + (p.price || 0), 0) / soldPlayers.length).toFixed(1)) : 0)}</p>
        </div>
      </div>

      {/* Most Expensive Capped */}
      {mostExpensiveCapped && (
        <div className="bg-gradient-to-br from-amber-900 to-amber-950 rounded-lg border border-amber-700 p-1.5 h-fit">
          <div className="text-xs font-bold text-amber-300 uppercase tracking-wider mb-0.5">
            🏆 Top Capped
          </div>
          <div className="text-xs text-white font-bold truncate">
            {mostExpensiveCapped.player?.name}
          </div>
          <div className="border-t border-amber-700/50 pt-0.5 mt-0.5">
            <p className="text-[11px] text-amber-400">{formatAuctionPrice(mostExpensiveCapped.price)}</p>
            <p className="text-[11px] text-amber-400">{mostExpensiveCapped.team?.iplTeamId}</p>
          </div>
        </div>
      )}

      {/* Remaining Purse */}
      <div className="bg-gradient-to-br from-green-900 to-green-950 rounded-lg border border-green-700 p-1.5 h-fit">
        <div className="text-xs font-bold text-green-300 uppercase tracking-wider mb-0.5">
          💸 Remaining
        </div>
        <div className="text-lg font-bold text-green-300 mb-0.5">
          {formatAuctionPrice(totalRemainingPurse)}
        </div>
        <div className="border-t border-green-700/50 pt-0.5">
          <p className="text-[11px] text-green-400">Teams: {teams.length}</p>
          <p className="text-[11px] text-green-400">Overseas: {overseasCount}</p>
        </div>
      </div>
    </div>
  );
};

export default AuctionAnalytics;

/**
 * SetContextDisplay.jsx
 * Shows current auction set, player position in set, sold/remaining players in set
 */

import React, { useState } from 'react';

const ChevronDown = ({ size = 16, className = '' }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    className={className}
  >
    <polyline points="6 9 12 15 18 9"></polyline>
  </svg>
);

const SetContextDisplay = ({ setContext = null, queue = [], soldPlayers = [] }) => {
  const [expandedSection, setExpandedSection] = useState(null);

  if (!setContext || !setContext.currentSet) {
    return (
      <div className="bg-slate-800/50 rounded-lg p-3 text-center text-slate-400 text-xs">
        Loading auction set...
      </div>
    );
  }

  const { currentSet, playerIndexInSet, totalInSet, playersRemainingInSet, currentPlayer } = setContext;
  const progressPercent = (playerIndexInSet / totalInSet) * 100;

  // Get all players in this set from both sold and remaining
  const playersInSet = (setContext.playersInSet || []);
  const soldPlayersInSet = (soldPlayers || []).filter(p => p.player?.auctionSet === currentPlayer.auctionSet);
  const remainingPlayersInSet = (queue || []).filter(p => p.auctionSet === currentPlayer.auctionSet);

  return (
    <div className="bg-gradient-to-r from-slate-800/50 to-slate-900/50 rounded-lg p-2 border border-slate-700 h-fit space-y-1.5">
      {/* Set Header */}
      <div>
        <div className="text-xs font-bold text-slate-200">{currentSet.name}</div>
        <div className="text-[10px] text-slate-400">{currentSet.description}</div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-1.5">
        <div className="text-center">
          <div className="text-[9px] text-slate-400">Total</div>
          <div className="text-sm font-bold text-brand-gold">{totalInSet}</div>
        </div>
        <div className="text-center">
          <div className="text-[9px] text-slate-400">Progress</div>
          <div className="text-sm font-bold text-brand-gold">{playerIndexInSet}/{totalInSet}</div>
        </div>
      </div>

      {/* Remaining */}
      <div className="text-center">
        <div className="text-[9px] text-slate-400">Remaining</div>
        <div className="text-sm font-bold text-purple-400">{playersRemainingInSet}</div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-700/50 rounded-full h-1.5 overflow-hidden">
        <div
          className="bg-gradient-to-r from-brand-gold via-purple-400 to-purple-500 h-full transition-all duration-500"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Base Price */}
      <div className="bg-slate-700/30 rounded px-2 py-1 text-center">
        <div className="text-[9px] text-slate-400">BASE PRICE</div>
        <div className="text-xs font-bold text-brand-gold">
          ₹{currentSet.minPrice}L — ₹{currentSet.maxPrice}L
        </div>
      </div>

      {/* Sold Players */}
      <div>
        <button
          onClick={() => setExpandedSection(expandedSection === 'sold' ? null : 'sold')}
          className="w-full flex items-center justify-between px-2 py-1 hover:bg-slate-700/30 transition-colors"
        >
          <div className="flex items-center gap-1">
            <span className="text-green-500 font-semibold text-xs">✓ Sold</span>
            <span className="text-[9px] text-slate-400">({soldPlayersInSet.length})</span>
          </div>
          <ChevronDown 
            size={12} 
            className={`transition-transform ${expandedSection === 'sold' ? 'rotate-180' : ''}`}
          />
        </button>
        {expandedSection === 'sold' && (
          <div className="px-2 py-1 space-y-0.5 border-t border-slate-700 bg-slate-800/20 max-h-24 overflow-y-auto">
            {soldPlayersInSet.length > 0 ? (
              soldPlayersInSet.map((record, idx) => (
                <div key={idx} className="text-[9px] text-slate-300 flex justify-between gap-1">
                  <span className="truncate">{record.player?.name}</span>
                  <span className="text-green-400 font-semibold whitespace-nowrap">₹{record.soldPrice}Cr</span>
                </div>
              ))
            ) : (
              <div className="text-[9px] text-slate-500 italic">None</div>
            )}
          </div>
        )}
      </div>

      {/* Remaining Players */}
      <div>
        <button
          onClick={() => setExpandedSection(expandedSection === 'remaining' ? null : 'remaining')}
          className="w-full flex items-center justify-between px-2 py-1 hover:bg-slate-700/30 transition-colors"
        >
          <div className="flex items-center gap-1">
            <span className="text-amber-500 font-semibold text-xs">◆ Remain</span>
            <span className="text-[9px] text-slate-400">({remainingPlayersInSet.length})</span>
          </div>
          <ChevronDown 
            size={12} 
            className={`transition-transform ${expandedSection === 'remaining' ? 'rotate-180' : ''}`}
          />
        </button>
        {expandedSection === 'remaining' && (
          <div className="px-2 py-1 space-y-0.5 border-t border-slate-700 bg-slate-800/20 max-h-24 overflow-y-auto">
            {remainingPlayersInSet.length > 0 ? (
              remainingPlayersInSet.map((player, idx) => (
                <div key={idx} className="text-[9px] text-slate-300 flex justify-between gap-1">
                  <span className="truncate">{player.name}</span>
                  <span className="text-slate-500 whitespace-nowrap">₹{player.basePrice}L</span>
                </div>
              ))
            ) : (
              <div className="text-[9px] text-slate-500 italic">None</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SetContextDisplay;

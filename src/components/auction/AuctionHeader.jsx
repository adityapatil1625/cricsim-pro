/**
 * AuctionHeader.jsx
 * Header bar with auction title, status, and controls
 */

import React from 'react';

const AuctionHeader = ({ 
  season = 'IPL 2026',
  type = 'Mega Auction',
  isLive = true,
  soundEnabled = true,
  onSoundToggle = () => {},
  onRestart = () => {},
}) => {
  return (
    <div className="sticky top-0 z-50 bg-gradient-to-r from-slate-950 via-purple-900 to-slate-950 border-b-2 border-brand-gold/50 backdrop-blur-sm">
      <div className="flex items-center justify-between px-6 py-4 gap-4 flex-wrap">
        {/* Left: Title & Status */}
        <div className="flex items-center gap-4 flex-1">
          <div>
            <h1 className="font-broadcast text-2xl text-transparent bg-clip-text bg-gradient-to-r from-brand-gold to-purple-400">
              🏆 {season} - {type}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              {isLive && (
                <>
                  <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  <span className="text-xs text-red-400 font-bold">LIVE</span>
                </>
              )}
              <span className="text-xs text-slate-400">Auction in Progress</span>
            </div>
          </div>
        </div>

        {/* Right: Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={onSoundToggle}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all text-xl"
            title={soundEnabled ? 'Mute' : 'Unmute'}
          >
            {soundEnabled ? '🔊' : '🔇'}
          </button>
          <button
            onClick={onRestart}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all text-xl"
            title="Restart Auction"
          >
            ↻
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuctionHeader;

/**
 * AdminControls.jsx
 * Host-only controls for managing auction.
 */

import React from 'react';

const AdminControls = ({
  isHost = false,
  auctionPhase = 'ready',
  onStart = () => {},
  onPause = () => {},
  onResume = () => {},
  onSkip = () => {},
  onAccelerate = () => {},
}) => {
  if (!isHost) return null;

  const isReady = auctionPhase === 'ready';
  const isPaused = auctionPhase === 'paused';
  const isRunning = auctionPhase === 'running';
  const canControlPlayer = isRunning || isPaused;

  return (
    <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-xl border-2 border-yellow-600/50 p-4">
      <h3 className="text-xs font-bold text-yellow-400 uppercase tracking-widest mb-3 flex items-center gap-2">
        <span>Admin Controls</span>
        <span className="text-[10px] bg-yellow-900 px-2 py-0.5 rounded">HOST</span>
      </h3>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        {isReady && (
          <button
            onClick={onStart}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-bold text-xs rounded-lg transition-all"
            title="Start auction"
          >
            Start
          </button>
        )}

        {isRunning && (
          <button
            onClick={onPause}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-600 to-yellow-600 hover:from-orange-500 hover:to-yellow-500 text-white font-bold text-xs rounded-lg transition-all"
            title="Pause auction"
          >
            Pause
          </button>
        )}

        {isPaused && (
          <button
            onClick={onResume}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-bold text-xs rounded-lg transition-all"
            title="Resume auction"
          >
            Resume
          </button>
        )}

        <button
          onClick={onSkip}
          disabled={!canControlPlayer}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold text-xs rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          title={canControlPlayer ? 'Settle current player now' : 'Start the auction first'}
        >
          Skip
        </button>

        <button
          onClick={onAccelerate}
          disabled={!isRunning}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold text-xs rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          title={isRunning ? 'Accelerate auction clock' : 'Auction must be running'}
        >
          Accelerate
        </button>
      </div>
    </div>
  );
};

export default AdminControls;

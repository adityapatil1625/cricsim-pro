/**
 * AdminControls.jsx
 * Host-only controls for managing auction
 */

import React from 'react';

const AdminControls = ({
  isHost = false,
  auctionPhase = 'ready',
  onStart = () => {},
  onPause = () => {},
  onSkip = () => {},
  onUndo = () => {},
  onAccelerate = () => {},
  onEnableRTM = () => {},
}) => {
  if (!isHost) return null;

  const isPaused = auctionPhase === 'paused';
  const isRunning = auctionPhase === 'running';

  return (
    <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-xl border-2 border-yellow-600/50 p-4">
      <h3 className="text-xs font-bold text-yellow-400 uppercase tracking-widest mb-3 flex items-center gap-2">
        <span>⚙️ Admin Controls</span>
        <span className="text-[10px] bg-yellow-900 px-2 py-0.5 rounded">HOST</span>
      </h3>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        {/* Start Button */}
        {!isRunning && auctionPhase === 'ready' && (
          <button
            onClick={onStart}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-bold text-xs rounded-lg transition-all"
            title="Start auction"
          >
            ▶️ Start
          </button>
        )}

        {/* Pause/Resume Button */}
        {isRunning && (
          <button
            onClick={onPause}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-600 to-yellow-600 hover:from-orange-500 hover:to-yellow-500 text-white font-bold text-xs rounded-lg transition-all"
            title="Pause auction"
          >
            ⏸️ Pause
          </button>
        )}

        {/* Skip Player Button */}
        <button
          onClick={onSkip}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold text-xs rounded-lg transition-all disabled:opacity-50"
          title="Skip current player"
        >
          ⏭️ Skip
        </button>

        {/* Undo Button */}
        <button
          onClick={onUndo}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold text-xs rounded-lg transition-all"
          title="Undo last action"
        >
          ↩️ Undo
        </button>

        {/* Accelerate Button */}
        <button
          onClick={onAccelerate}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold text-xs rounded-lg transition-all"
          title="Accelerated auction phase"
        >
          ⚡ Accelerate
        </button>

        {/* RTM Button */}
        <button
          onClick={onEnableRTM}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold text-xs rounded-lg transition-all"
          title="Enable Right-to-Match"
        >
          🎯 RTM
        </button>
      </div>
    </div>
  );
};

export default AdminControls;

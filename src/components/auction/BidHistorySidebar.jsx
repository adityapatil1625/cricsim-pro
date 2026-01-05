/**
 * BidHistorySidebar.jsx
 * Shows scrolling bid history with team, amount, timestamp
 */

import React from 'react';

const BidHistorySidebar = ({ bids = [], teams = [] }) => {
  const getTeamLogo = (teamId) => {
    const team = teams.find(t => t.id === teamId || t.iplTeamId === teamId);
    return team?.iplTeam?.logo || '';
  };

  const getTeamColor = (teamId) => {
    const team = teams.find(t => t.id === teamId || t.iplTeamId === teamId);
    return team?.iplTeam?.color || '#6b7280';
  };

  return (
    <>
      <div className="px-4 py-3 border-b border-slate-700 bg-slate-900/50 flex-shrink-0">
        <h3 className="text-sm font-bold text-slate-200 uppercase tracking-widest">
          📊 Bid History
        </h3>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 p-3">
        {bids && bids.length > 0 ? (
          bids.map((bid, idx) => (
            <div
              key={idx}
              className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition-colors border border-transparent hover:border-brand-gold/30"
              style={{
                borderLeftColor: getTeamColor(bid.teamId || bid.socketId),
                borderLeftWidth: '4px',
              }}
            >
              {/* Team Logo */}
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center overflow-hidden">
                <img
                  src={getTeamLogo(bid.teamId || bid.socketId)}
                  alt="team"
                  className="w-full h-full object-contain"
                />
              </div>

              {/* Bid Info */}
              <div className="flex-1 min-w-0">
                <div className="text-xs text-slate-300 font-semibold truncate">
                  {bid.teamName || 'Team'}
                </div>
                <div className="text-sm font-bold text-brand-gold">
                  ₹{bid.bid}L
                </div>
              </div>

              {/* Timestamp */}
              <div className="text-xs text-slate-500 flex-shrink-0">
                {bid.timestamp
                  ? new Date(bid.timestamp).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })
                  : 'now'}
              </div>
            </div>
          ))
        ) : (
          <div className="flex items-center justify-center h-full text-slate-400 text-sm">
            No bids yet
          </div>
        )}
      </div>
    </>
  );
};

export default BidHistorySidebar;

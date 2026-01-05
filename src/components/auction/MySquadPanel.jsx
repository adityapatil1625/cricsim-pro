/**
 * MySquadPanel.jsx
 * Displays current user's squad classified by player role
 */

import React from 'react';

const MySquadPanel = ({ team = null }) => {
  if (!team || !team.squad) {
    return null;
  }

  // Classify players by role
  const playersByRole = {
    WICKETKEEPER: team.squad.filter(p => p.role === 'WICKETKEEPER'),
    BATTER: team.squad.filter(p => p.role === 'BATTER'),
    ALLROUNDER: team.squad.filter(p => p.role === 'ALLROUNDER'),
    BOWLER: team.squad.filter(p => p.role === 'BOWLER'),
  };

  const roleConfig = {
    WICKETKEEPER: { emoji: '🧤', color: 'from-blue-600 to-cyan-600', textColor: 'text-blue-300' },
    BATTER: { emoji: '🏏', color: 'from-emerald-600 to-green-600', textColor: 'text-emerald-300' },
    ALLROUNDER: { emoji: '⭐', color: 'from-amber-600 to-yellow-600', textColor: 'text-amber-300' },
    BOWLER: { emoji: '🎳', color: 'from-purple-600 to-pink-600', textColor: 'text-purple-300' },
  };

  return (
    <div className="glass-panel rounded-2xl p-4 bg-slate-950/50 border border-slate-700 space-y-3">
      <div>
        <h4 className="text-base font-bold text-white mb-3">📋 My Squad</h4>
        <div className="text-sm text-slate-400 mb-3">
          {team.squad.length}/25 Players • ₹{team.purse}Cr Purse
        </div>
      </div>

      {/* Squad by role */}
      <div className="space-y-3">
        {Object.entries(playersByRole).map(([role, players]) => (
          <div key={role}>
            <div className={`flex items-center gap-2 mb-2 pb-2 border-b border-slate-700`}>
              <span className="text-xl">{roleConfig[role].emoji}</span>
              <span className="text-sm font-semibold text-slate-300">{role}</span>
              <span className={`text-sm ${roleConfig[role].textColor} font-bold ml-auto`}>
                {players.length}
              </span>
            </div>
            
            {players.length > 0 ? (
              <div className="space-y-2">
                {players.map((player, idx) => (
                  <div
                    key={idx}
                    className="flex justify-between items-center text-xs bg-slate-800/30 rounded px-3 py-2 border border-slate-700/50"
                  >
                    <span className="text-slate-300 truncate flex-1">{player.name}</span>
                    <div className="flex items-center gap-2 ml-2">
                      {player.isOverseas && (
                        <span className="text-[9px] bg-blue-900/50 text-blue-300 px-1.5 py-0.5 rounded">OVS</span>
                      )}
                      <span className="text-slate-400 font-semibold whitespace-nowrap">
                        ₹{player.soldPrice}Cr
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-slate-500 italic py-2 px-2">
                — Not signed yet
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Squad stats */}
      {team.squad.length > 0 && (
        <div className="border-t border-slate-700 pt-3 mt-3 space-y-1.5 text-xs">
          <div className="flex justify-between">
            <span className="text-slate-400">Overseas Players:</span>
            <span className="text-slate-200 font-semibold">{team.overseasCount}/8</span>
          </div>
          {team.roleBalance && (
            <>
              <div className="flex justify-between">
                <span className="text-slate-400">Batters:</span>
                <span className="text-emerald-400 font-semibold">{team.roleBalance.batters || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Bowlers:</span>
                <span className="text-purple-400 font-semibold">{team.roleBalance.bowlers || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">All-rounders:</span>
                <span className="text-amber-400 font-semibold">{team.roleBalance.allrounders || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Wicket-keepers:</span>
                <span className="text-cyan-400 font-semibold">{team.roleBalance.wicketkeepers || 0}</span>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default MySquadPanel;

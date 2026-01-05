/**
 * TeamsOverviewPanel.jsx
 * Franchise cards with purse, players, role balance, and squad details
 */

import React, { useState } from 'react';

const TeamsOverviewPanel = ({ teams = [], onTeamSelect = () => {} }) => {
  const [expandedTeam, setExpandedTeam] = useState(null);

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-bold text-slate-200 uppercase tracking-widest px-1">
        🏏 Teams Overview
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {teams.map((team) => (
          <div
            key={team.id}
            className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg border border-slate-700 hover:border-brand-gold/50 transition-all overflow-hidden"
            style={{
              borderTopColor: team.iplTeam?.color || '#6b7280',
              borderTopWidth: '3px',
            }}
          >
            {/* Team Header */}
            <button
              onClick={() => {
                setExpandedTeam(expandedTeam === team.id ? null : team.id);
                onTeamSelect(team);
              }}
              className="w-full p-3 flex items-center justify-between hover:bg-slate-700/50 transition-colors"
            >
              <div className="flex items-center gap-2 flex-1">
                <img
                  src={team.iplTeam?.logo}
                  alt={team.iplTeamId}
                  className="w-6 h-6 object-contain"
                />
                <div className="text-left">
                  <div className="text-xs font-bold text-white">
                    {team.iplTeamId}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {team.name || 'Team'}
                  </div>
                </div>
              </div>
              <span
                className={`transition-transform inline-block text-slate-400 ${
                  expandedTeam === team.id ? 'rotate-180' : ''
                }`}
              >
                ▼
              </span>
            </button>

            {/* Team Stats */}
            <div className="px-3 py-2 border-t border-slate-700 bg-slate-900/50 space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Purse Left:</span>
                <span className="font-bold text-brand-gold">₹{team.purse !== undefined ? team.purse : 1000}L</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Squad:</span>
                <span className="font-bold text-purple-400">
                  {team.squad?.length || 0}/25
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Overseas:</span>
                <span className="font-bold text-yellow-400">
                  {team.overseasCount || 0}/8
                </span>
              </div>

              {/* Role Balance */}
              {team.roleBalance && (
                <div className="flex gap-1 text-[9px] pt-2 border-t border-slate-700">
                  <div title="Batters" className="flex-1 bg-blue-900/50 px-1 py-1 rounded text-center font-bold text-blue-300">
                    🏏 {team.roleBalance.batters || 0}
                  </div>
                  <div title="Bowlers" className="flex-1 bg-red-900/50 px-1 py-1 rounded text-center font-bold text-red-300">
                    🎳 {team.roleBalance.bowlers || 0}
                  </div>
                  <div title="All-rounders" className="flex-1 bg-purple-900/50 px-1 py-1 rounded text-center font-bold text-purple-300">
                    🔄 {team.roleBalance.allrounders || 0}
                  </div>
                  <div title="Wicket-keepers" className="flex-1 bg-green-900/50 px-1 py-1 rounded text-center font-bold text-green-300">
                    🧤 {team.roleBalance.wicketkeepers || 0}
                  </div>
                </div>
              )}
            </div>

            {/* Expanded Squad */}
            {expandedTeam === team.id && team.squad && team.squad.length > 0 && (
              <div className="px-3 py-2 border-t border-slate-700 bg-slate-900/30 space-y-1 max-h-48 overflow-y-auto">
                <div className="text-[10px] font-bold text-slate-300 mb-2">
                  Squad ({team.squad.length}):
                </div>
                {team.squad.map((player, idx) => (
                  <div key={idx} className="flex justify-between items-center text-[10px] bg-slate-800/50 px-2 py-1 rounded">
                    <span className="text-slate-200 truncate flex-1">{player.name}</span>
                    <span className="text-brand-gold font-bold flex-shrink-0">
                      ₹{player.soldPrice}L
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TeamsOverviewPanel;

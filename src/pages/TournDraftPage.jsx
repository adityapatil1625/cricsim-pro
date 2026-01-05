/**
 * TournDraftPage.jsx
 * Tournament draft page for distributing players across teams
 * 
 * Props:
 * - tournTeams: Array of tournament teams
 * - activeTeamSelect: Currently selected team ID
 * - setActiveTeamSelect: Setter for active team
 * - handleAddToActiveTeam: Function to add player to active team
 * - handleRemoveFromTeam: Function to remove player from team
 * - createTournamentFixtures: Function to create and start tournament
 * - getTeamDisplay: Utility function to format team display info
 * - setView: Function to change current view
 * - PlayerSearch: Player search component
 * - TeamListItem: Team list item component
 */

import React, { useState } from 'react';
import PlayerSearch from '../components/shared/PlayerSearch';
import TeamListItem from '../components/shared/TeamListItem';
import { capitalizeFirstLetter } from '../utils/appUtils';

const TournDraftPage = ({
  tournTeams,
  activeTeamSelect,
  setActiveTeamSelect,
  handleAddToActiveTeam,
  handleRemoveFromTeam,
  createTournamentFixtures,
  getTeamDisplay,
  setView,
  playerName,
  setPlayerName,
  isOnline,
  onlineRoom,
  isOnlineHost,
  socket,
  isHostReady,
  setIsHostReady,
  playersReady,
  setPlayersReady,
  showGuestReadyModal,
  setShowGuestReadyModal,
}) => {
  const [showNameModal, setShowNameModal] = useState(false);
  const teams = tournTeams;

  return (
      <div className="fixed inset-0 w-full flex flex-col bg-slate-950 overflow-hidden">
        <div className="relative z-10 w-full px-8 py-6 flex justify-between items-end border-b border-white/5 bg-slate-950/80 backdrop-blur-sm flex-shrink-0">
          <div>
            <h1 className="text-6xl font-broadcast text-white leading-none drop-shadow-lg">
              SEASON DRAFT
            </h1>
            <p className="text-slate-400 uppercase tracking-widest text-sm ml-1">
              Distribute stars across franchises
            </p>
          </div>
          <div className="flex gap-4">
            {isOnline && !isOnlineHost ? (
              // GUEST: Ready button or waiting message
              playersReady[socket.id] ? (
                <div className="bg-amber-900/40 border border-amber-500 text-amber-300 px-10 py-3 rounded-full font-broadcast text-2xl text-center">
                  ✓ YOU'RE READY!
                </div>
              ) : (
                <button
                  onClick={() => {
                    setPlayersReady(prev => ({
                      ...prev,
                      [socket.id]: true
                    }));
                    socket.emit("playerReady", { roomCode: onlineRoom.code, socketId: socket.id });
                    console.log("✓ Guest marked as ready for tournament");
                  }}
                  className="bg-gradient-to-r from-amber-600 to-yellow-600 text-white px-10 py-3 rounded-full font-broadcast text-2xl hover:scale-105 transition-transform shadow-xl shadow-amber-900/20"
                >
                  ✓ MARK AS READY
                </button>
              )
            ) : (
              // HOST: Start button
              <button
                onClick={() => {
                  if (isOnline) {
                    createTournamentFixtures();
                    setIsHostReady(false);
                    setPlayersReady({});
                  } else {
                    setShowNameModal(true);
                  }
                }}
                disabled={isOnline && (onlineRoom?.players?.length < 2 || onlineRoom?.players?.some(p => p.socketId !== socket.id && !playersReady[p.socketId]))}
                className="bg-gradient-to-r from-brand-gold to-yellow-500 text-black px-10 py-3 rounded-full font-broadcast text-2xl hover:scale-105 transition-transform shadow-xl shadow-brand-gold/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                START TOURNAMENT
              </button>
            )}
            
            {/* Players Ready Status */}
            {isOnline && onlineRoom?.players && onlineRoom.players.length > 0 && (
              <div className="px-6 py-3 rounded-lg bg-slate-800/50 border border-slate-700 text-slate-300 text-sm font-semibold text-center">
                🟢 Ready: {Object.values(playersReady).filter(Boolean).length} / {onlineRoom.players.length}
              </div>
            )}
          </div>
        </div>

        <div className="relative z-10 flex-1 flex p-6 gap-6 min-h-0 overflow-hidden">
          <div className="flex-1 flex flex-col min-h-0 h-full">
            <PlayerSearch activeTeam={activeTeamSelect} onAddPlayer={handleAddToActiveTeam} />
          </div>

          <div className="w-96 flex flex-col gap-4 h-full min-h-0">
            <div className="glass-panel p-4 rounded-2xl flex-shrink-0 bg-slate-900/80">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                Tournament Teams
              </h3>
              <p className="text-xs text-slate-500">
                Click a team to draft into it.
              </p>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-1 pb-4">
              {teams.map((t) => (
                  <div
                      key={t.id}
                      onClick={() => setActiveTeamSelect(t.id)}
                      className={`group rounded-2xl cursor-pointer transition-all duration-300 flex-1 flex flex-col relative overflow-hidden border-2 ${
                          activeTeamSelect === t.id
                              ? "border-brand-gold bg-slate-900 shadow-[0_0_30px_rgba(251,191,36,0.15)] z-10"
                              : "border-white/10 bg-slate-900/40 hover:bg-slate-900/60 hover:border-white/20"
                      }`}
                  >
                    <div className="h-full flex flex-col p-5 relative z-10">
                      <div className="flex justify-between items-center mb-4 border-b border-white/5 pb-3">
                        <div className="flex items-center gap-3">
                          {(() => {
                            const display = getTeamDisplay(t);
                            return display.logo ? (
                              <img src={display.logo} alt={display.shortName} className="w-8 h-8 object-contain" />
                            ) : null;
                          })()}
                          <span
                              className={`font-broadcast text-3xl truncate ${
                                  activeTeamSelect === t.id ? "text-brand-gold" : "text-white"
                              }`}
                          >
                            {getTeamDisplay(t).name}
                          </span>
                        </div>
                        <div
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                                (t.players || []).length >= 11
                                    ? "bg-green-900 text-green-400"
                                    : "bg-slate-800 text-slate-400"
                            }`}
                        >
                          {(t.players || []).length} / 11
                        </div>
                      </div>
                      <div className="space-y-1 max-h-48 overflow-y-auto custom-scrollbar">
                        {(t.players || []).map((p, i) => (
                            <TeamListItem
                                key={p.instanceId || p.id || i}
                                player={p}
                                onRemove={(e) => {
                                  e.stopPropagation();
                                  handleRemoveFromTeam(t.id, i);
                                }}
                            />
                        ))}
                      </div>
                    </div>
                  </div>
              ))}
            </div>
          </div>
        </div>

        {/* Player Name Modal */}
        {showNameModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-700 rounded-2xl p-8 w-full max-w-md shadow-2xl">
              <h2 className="text-3xl font-broadcast text-white mb-6">ENTER YOUR NAME</h2>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(capitalizeFirstLetter(e.target.value))}
                onKeyPress={(e) => {
                  if (e.key === "Enter" && playerName.trim()) {
                    createTournamentFixtures();
                    setShowNameModal(false);
                  }
                }}
                placeholder="Your name"
                className="w-full px-4 py-3 rounded-lg bg-slate-800 border border-slate-600 text-white placeholder-slate-500 focus:outline-none focus:border-brand-gold mb-6 font-semibold"
                autoFocus
              />
              <div className="flex gap-4">
                <button
                  onClick={() => setShowNameModal(false)}
                  className="flex-1 px-6 py-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm uppercase tracking-wider transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (playerName.trim()) {
                      createTournamentFixtures();
                      setShowNameModal(false);
                    }
                  }}
                  disabled={!playerName.trim()}
                  className={`flex-1 px-6 py-3 rounded-lg font-bold text-sm uppercase tracking-wider transition-colors ${
                    playerName.trim()
                      ? "bg-brand-gold hover:bg-yellow-500 text-black"
                      : "bg-slate-700 text-slate-500 cursor-not-allowed"
                  }`}
                >
                  Start Tournament
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Footer */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-slate-950 to-slate-950/80 border-t border-slate-700/50 px-8 py-6 flex justify-between items-center gap-4 flex-wrap">
          <button
            onClick={() => setView("menu")}
            className="px-6 py-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs uppercase tracking-wider transition-colors"
          >
            ← Back to Menu
          </button>
          <div className="flex gap-3">
            <button
              onClick={() => setView("tourn_setup")}
              className="px-6 py-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs uppercase tracking-wider transition-colors"
            >
              ← Back to Setup
            </button>
            <button
              onClick={() => {
                setActiveTeamSelect("A");
                setView("quick_setup");
              }}
              disabled={isOnline && onlineRoom?.players?.length < 2}
              className="px-6 py-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs uppercase tracking-wider transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title={isOnline && onlineRoom?.players?.length < 2 ? "Need at least 2 players to play online" : ""}
            >
              ⚡ Quick Play
            </button>
            <button
              onClick={() => {
                setOnlineGameType("tournament");
                setOnlineRoom(null);
                setJoinCode("");
                setJoinError("");
                setView("online_entry");
              }}
              className="px-6 py-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs uppercase tracking-wider transition-colors"
            >
              🌐 Online
            </button>
          </div>
        </div>
      </div>
  );
};

export default TournDraftPage;

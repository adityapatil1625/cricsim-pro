/**
 * OnlineMenuPage.jsx
 * Online lobby page - room management and team selection
 * 
 * Props:
 * - onlineRoom: Current online room data
 * - setView: Function to change current view
 * - isOnlineHost: Boolean indicating if user is room host
 * - socket: Socket.IO instance
 * - tournTeams: Array of tournament teams (if applicable)
 * - setTournTeams: Setter for tournament teams
 * - setActiveTeamSelect: Setter for active team
 * - IPL_TEAMS: Array of IPL teams
 * - getTeamDisplay: Utility function to format team display info
 * - ChevronLeft: Icon component
 */

import React from 'react';
import { ChevronLeft } from '../components/shared/Icons';

const OnlineMenuPage = ({
  onlineRoom,
  setView,
  isOnlineHost,
  socket,
  tournTeams,
  setTournTeams,
  setActiveTeamSelect,
  IPL_TEAMS,
  getTeamDisplay,
}) => {
  if (!onlineRoom) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-300">
          <div className="text-center">
            <p className="mb-4">No room data. Go back and create or join a room.</p>
            <button
                onClick={() => setView("menu")}
                className="px-6 py-3 rounded-full border border-slate-700 text-slate-400 hover:text-white hover:border-white hover:bg-white/5 transition-all font-bold text-xs uppercase tracking-widest flex items-center gap-2 mx-auto"
            >
              <ChevronLeft size={16} /> Back to Menu
            </button>
          </div>
        </div>
    );
  }

  console.log("🔍 Online Room Mode:", onlineRoom.mode); // Debug

  return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 p-4 relative">
        <button
          onClick={() => setView("menu")}
          className="absolute top-6 left-6 px-4 py-2 rounded-full border border-slate-700 text-slate-400 hover:text-white hover:border-white hover:bg-white/5 transition-all font-bold text-xs uppercase tracking-widest flex items-center gap-2"
        >
          <ChevronLeft size={16} /> Back
        </button>
        <div className="glass-panel rounded-3xl p-8 w-full max-w-4xl bg-slate-950/80 mt-12">
          <h2 className="font-broadcast text-4xl text-white mb-2">
            Room {onlineRoom.code}
          </h2>
          <p className="text-xs text-slate-400 mb-4 uppercase tracking-widest">
            Mode: {onlineRoom.mode === "tournament" ? "Tournament" : onlineRoom.mode === "auction" ? "Auction" : "1v1 Quick Match"}
          </p>

          {/* Connected players */}
          <div className="mb-4">
            <h3 className="text-sm text-slate-300 mb-2">
              Connected Players ({onlineRoom.players?.length || 0}{onlineRoom.mode === "tournament" ? "/10" : "/2"})
            </h3>
            
            {/* Current player's team selection */}
            {(() => {
              const myPlayer = onlineRoom.players?.find(p => p.socketId === socket.id);
              const takenTeams = onlineRoom.players?.map(p => p.iplTeam).filter(Boolean) || [];
              
              if (!myPlayer?.iplTeam) {
                return (
                  <div className="mb-4 p-6 bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl border-2 border-brand-gold/50 shadow-xl">
                    <div className="text-center mb-4">
                      <div className="text-sm text-brand-gold font-bold uppercase tracking-widest mb-1">Choose Your Franchise</div>
                      <div className="text-xs text-slate-400">Select your team to continue</div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-2 custom-scrollbar p-2">
                      {IPL_TEAMS.filter(team => !takenTeams.includes(team.id)).map(team => (
                        <button
                          key={team.id}
                          onClick={() => {
                            console.log("🏟️ Clicking team:", team.id, "code:", onlineRoom.code);
                            socket.emit("selectIPLTeam", { code: onlineRoom.code, teamId: team.id });
                            console.log("🏟️ Emitted selectIPLTeam");
                          }}
                          className="group relative p-4 rounded-xl bg-slate-700/50 hover:bg-slate-600 border-2 border-transparent hover:border-brand-gold/50 transition-all duration-300 hover:shadow-lg"
                        >
                          <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" 
                               style={{ background: `linear-gradient(135deg, ${team.color}20, transparent)` }} />
                          <div className="relative flex flex-col items-center gap-2">
                            <div className="w-16 h-16 flex items-center justify-center bg-white/10 rounded-full p-2 group-hover:bg-white/20 transition-colors">
                              <img src={team.logo} alt={team.id} className="w-full h-full object-contain" />
                            </div>
                            <div className="text-center">
                              <div className="text-xs font-bold text-white mb-1">{team.id}</div>
                              <div className="text-[10px] text-slate-300 leading-tight">{team.name}</div>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              }
              return null;
            })()}
            
            <div className="space-y-2">
              {onlineRoom.players?.map((p) => {
                const iplTeam = IPL_TEAMS.find(t => t.id === p.iplTeam);
                return (
                  <div
                      key={p.socketId}
                      className="flex justify-between items-center bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200"
                  >
                    <span>{p.name}</span>
                    <div className="flex items-center gap-2">
                      {iplTeam && (
                        <span className="text-xs px-2 py-1 rounded flex items-center gap-1" style={{ backgroundColor: iplTeam.color, color: 'white' }}>
                          <img src={iplTeam.logo} alt={iplTeam.id} className="w-4 h-4 object-contain" />
                          <span>{iplTeam.id}</span>
                        </span>
                      )}
                      <span className="text-xs text-slate-500">Team {p.side}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Room Code */}
          <p className="text-xs text-slate-500 mb-2">
            Share this code with your friend:
          </p>
          <div className="flex items-center gap-2 mb-4">
            <div className="flex-1 text-center text-2xl font-broadcast tracking-[0.4em] text-brand-gold bg-slate-900 border border-slate-700 rounded-lg py-3">
              {onlineRoom.code}
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText(onlineRoom.code);
                alert("Code copied!");
              }}
              className="bg-brand-gold hover:bg-yellow-400 text-black font-bold px-4 py-3 rounded-lg transition-colors"
              title="Copy code"
            >
              📋
            </button>
          </div>

          {/* HOST: Go to Setup (and emit navigation event) */}
          {isOnlineHost && (
              <button
                  onClick={() => {
                    if (!onlineRoom?.code) return;

                    if (onlineRoom.mode === "tournament") {
                      if (onlineRoom.players.length < 2) {
                        alert("Need at least 2 players to start tournament");
                        return;
                      }
                      // Initialize teams first with IPL team info
                      const teams = onlineRoom.players.map(p => {
                        const iplTeam = IPL_TEAMS.find(t => t.id === p.iplTeam);
                        return {
                          id: p.side,
                          name: iplTeam ? iplTeam.name : `Team ${p.side}`,
                          iplTeamId: p.iplTeam,
                          players: [],
                          played: 0,
                          won: 0,
                          pts: 0,
                          nrr: 0,
                          runsScored: 0,
                          oversFaced: 0,
                          runsConceded: 0,
                          oversBowled: 0
                        };
                      });
                      setTournTeams(teams);
                      
                      const mySide = onlineRoom.players?.find((p) => p.socketId === socket.id)?.side || "A";
                      setActiveTeamSelect(mySide);
                      
                      // Navigate to tournament team selection
                      socket.emit("navigateToTournamentSetup", {
                        code: onlineRoom.code,
                      });
                      setView("tourn_setup");
                    } else if (onlineRoom.mode === "auction") {
                      if (onlineRoom.players.length < 2) {
                        alert("Need at least 2 players to start auction");
                        return;
                      }
                      socket.emit("navigateToAuctionLobby", {
                        code: onlineRoom.code,
                      });
                      setView("auction_lobby");
                    } else {
                      // For quick matches, both players must have selected IPL teams
                      const allTeamsSelected = onlineRoom.players.every(p => p.iplTeam);
                      if (!allTeamsSelected) {
                        alert("All players must select an IPL team first");
                        return;
                      }
                      socket.emit("navigateToQuickSetup", {
                        code: onlineRoom.code,
                      });
                      setView("quick_setup");
                    }
                  }}
                  disabled={onlineRoom?.players?.length < 2}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg py-2 text-sm font-bold uppercase tracking-widest mb-3 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  title={onlineRoom?.players?.length < 2 ? "Need at least 2 players to proceed" : ""}
              >
                {onlineRoom.mode === "tournament"
                    ? `Start Team Selection (${onlineRoom.players.length} Players)`
                    : onlineRoom.mode === "auction"
                    ? `Start Auction Lobby (${onlineRoom.players.length} Players)`
                    : `Go to Squad Selection (${onlineRoom.players.filter(p => p.iplTeam).length}/${onlineRoom.players.length} Teams Selected)`}
              </button>
          )}

          {/* GUEST: waiting message */}
          {!isOnlineHost && (
              <p className="text-[11px] text-slate-500 mb-3">
                Waiting for host to build teams and start the match. You will
                automatically enter the setup and then the live match when the host
                starts.
              </p>
          )}

          <button
              onClick={() => setView("menu")}
              className="mt-2 text-xs text-slate-500 hover:text-slate-300"
          >
            ← Back to Menu
          </button>
        </div>

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
              onClick={() => {
                setActiveTeamSelect("A");
                setView("quick_setup");
              }}
              disabled={onlineRoom?.players?.length < 2}
              className="px-6 py-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs uppercase tracking-wider transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title={onlineRoom?.players?.length < 2 ? "Need at least 2 players to play online" : ""}
            >
              ⚡ Quick Play
            </button>
            <button
              onClick={() => setView("tourn_setup")}
              disabled={onlineRoom?.players?.length < 2}
              className="px-6 py-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs uppercase tracking-wider transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title={onlineRoom?.players?.length < 2 ? "Need at least 2 players to play online" : ""}
            >
              🏆 Tournament
            </button>
            <button
              onClick={() => {
                setOnlineGameType("auction");
                setOnlineRoom(null);
                setJoinCode("");
                setJoinError("");
                setView("online_entry");
              }}
              className="px-6 py-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs uppercase tracking-wider transition-colors"
            >
              🔨 Auction
            </button>
          </div>
        </div>
      </div>
  );
};

export default OnlineMenuPage;

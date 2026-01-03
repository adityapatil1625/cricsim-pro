/**
 * TournSetupPage.jsx
 * Tournament setup and team building page
 * Handles both online and offline tournament setup
 * 
 * Props:
 * - tournTeams: Array of tournament teams
 * - setTournTeams: Setter for tournament teams
 * - newTeamName: Current new team name input
 * - setNewTeamName: Setter for new team name
 * - activeTeamSelect: Currently selected team ID
 * - setActiveTeamSelect: Setter for active team
 * - addTournTeam: Function to add new team
 * - handleAddToActiveTeam: Function to add player to active team
 * - handleRemoveFromTeam: Function to remove player from team
 * - getTeamDisplay: Utility function to format team display info
 * - LOCAL_POOL: Array of available players
 * - generateId: Utility function to generate unique IDs
 * - setView: Function to change current view
 * - isOnline: Boolean indicating if in online mode
 * - isOnlineHost: Boolean indicating if user is the room host
 * - onlineRoom: Current online room data
 * - socket: Socket.IO instance
 * - tournamentStartError: Error message from tournament start
 * - setTournamentStartError: Setter for tournament start error
 * - onlineGameType: Current online game type (quick, tournament, auction)
 * - setOnlineGameType: Setter for online game type
 * - joinCode: Current room code for joining
 * - setJoinCode: Setter for room code
 * - joinError: Error message from room join attempt
 * - setJoinError: Setter for join error
 */

import React from 'react';
import { ChevronLeft } from '../components/shared/Icons';
import PlayerSearch from '../components/shared/PlayerSearch';
import TeamListItem from '../components/shared/TeamListItem';

const TournSetupPage = ({
  tournTeams,
  setTournTeams,
  newTeamName,
  setNewTeamName,
  activeTeamSelect,
  setActiveTeamSelect,
  addTournTeam,
  handleAddToActiveTeam,
  handleRemoveFromTeam,
  getTeamDisplay,
  LOCAL_POOL,
  generateId,
  setView,
  isOnline,
  isOnlineHost,
  onlineRoom,
  socket,
  tournamentStartError,
  setTournamentStartError,
  onlineGameType,
  setOnlineGameType,
  setOnlineRoom,
  joinCode,
  setJoinCode,
  joinError,
  setJoinError,
}) => {
  // For online tournament, show team selection like quick_setup
  if (isOnline && onlineRoom?.mode === "tournament") {
    const mySide = onlineRoom.players?.find((p) => p.socketId === socket.id)?.side;
    const myTeam = tournTeams.find(t => t.id === mySide);
    
    // Ensure activeTeamSelect is set
    if (activeTeamSelect !== mySide) {
      setActiveTeamSelect(mySide);
    }
    
    return (
        <div className="fixed inset-0 w-full flex flex-col bg-slate-950 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/10 via-slate-950 to-slate-950" />
          
          {/* Header */}
          <div className="relative z-10 w-full px-8 py-6 flex-shrink-0">
            <h2 className="font-broadcast text-5xl text-center text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-400 drop-shadow-xl">
              Build Your Team
            </h2>
            <div className="flex items-center justify-center gap-2 mt-2">
              {(() => {
                const myTeamData = isOnline 
                  ? tournTeams.find(t => t.id === mySide) || { id: mySide, name: `Team ${mySide}` }
                  : (mySide === "A" ? tournTeams[0] : tournTeams[1]);
                const display = getTeamDisplay(myTeamData);
                return (
                  <>
                    {display.logo && (
                      <img src={display.logo} alt={display.shortName} className="w-6 h-6 object-contain" />
                    )}
                    <p className="text-center text-slate-400">{display.name} - Select 11 players</p>
                  </>
                );
              })()}
            </div>
          </div>

          {/* Main Content */}
          <div className="relative z-10 flex-1 flex px-8 gap-6 min-h-0 overflow-hidden pb-6">
            {/* Player Pool */}
            <div className="flex-1 flex flex-col min-h-0 h-full">
              <PlayerSearch activeTeam={mySide} onAddPlayer={handleAddToActiveTeam} />
            </div>

            {/* My Team */}
            <div className="w-96 flex flex-col min-h-0">
              <div className="glass-panel p-1 rounded-3xl flex-1 flex flex-col min-h-0">
                <div className="bg-slate-950/50 rounded-[20px] p-6 backdrop-blur-md flex-1 flex flex-col min-h-0">
                  <div className="flex justify-between items-center mb-4 flex-shrink-0">
                    <h3 className="font-broadcast text-2xl text-white">YOUR TEAM</h3>
                    <div className="flex items-center gap-2">
                      {myTeam?.players.length < 11 && (
                          <button
                              onClick={() => {
                                console.log('🎯 Auto-select clicked, mySide:', mySide);
                                console.log('🎯 Current myTeam:', myTeam);
                                
                                const needed = 11 - (myTeam?.players.length || 0);
                                const existingIds = myTeam?.players.map(p => p.id) || [];
                                const availablePlayers = LOCAL_POOL.filter(p => !existingIds.includes(p.id));
                                const randomPlayers = availablePlayers
                                    .sort(() => Math.random() - 0.5)
                                    .slice(0, needed);
                                
                                console.log('🎯 Adding players:', randomPlayers.length);
                                
                                // Add all players at once
                                setTournTeams(prev => {
                                  console.log('🎯 Previous tournTeams:', prev);
                                  const updated = prev.map(t => {
                                    if (t.id !== mySide) return t;
                                    const newTeam = {
                                      ...t,
                                      players: [
                                        ...(t.players || []),
                                        ...randomPlayers.map(p => ({ ...p, instanceId: generateId() }))
                                      ]
                                    };
                                    console.log('🎯 Updated team:', newTeam);
                                    return newTeam;
                                  });
                                  console.log('🎯 New tournTeams:', updated);
                                  
                                  // Immediately broadcast the updated teams
                                  console.log('📤 Auto-select triggering immediate broadcast:', updated);
                                  socket.emit("tournamentTeamUpdate", {
                                    code: onlineRoom.code,
                                    teams: updated,
                                  });
                                  
                                  return updated;
                                });
                              }}
                              className="text-xs bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded-lg font-bold"
                          >
                            AUTO-SELECT {11 - (myTeam?.players.length || 0)}
                          </button>
                      )}
                      <div className={`text-sm font-bold px-3 py-1 rounded-full ${
                          myTeam?.players.length === 11
                              ? "bg-green-900 text-green-400"
                              : "bg-slate-800 text-slate-400"
                      }`}>
                        {myTeam?.players.length || 0} / 11
                      </div>
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1 pr-2">
                    {myTeam?.players.map((p, i) => (
                        <TeamListItem
                            key={p.instanceId || p.id || i}
                            player={p}
                            onRemove={(e) => {
                              e.stopPropagation();
                              handleRemoveFromTeam(mySide, i);
                            }}
                        />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="relative z-10 flex flex-col px-8 py-6 border-t border-white/5 flex-shrink-0">
            {/* Error Message Display */}
            {tournamentStartError && (
              <div className="mb-4 p-4 bg-red-900/50 border border-red-500 rounded-lg text-red-200 text-sm">
                <p className="font-semibold">❌ Cannot Start Tournament</p>
                <p className="mt-1">{tournamentStartError}</p>
              </div>
            )}
            
            <div className="flex justify-between items-center">
              <button
                  onClick={() => setView("online_menu")}
                  className="text-slate-400 hover:text-white px-6 py-2 transition-colors uppercase tracking-widest text-xs font-bold"
              >
                ← Back
              </button>
              {isOnlineHost ? (
                  <button
                      onClick={() => {
                        // Small delay to ensure all state updates are complete
                        setTimeout(() => {
                          console.log('=== START TOURNAMENT VALIDATION ===');
                          console.log('🔍 My Side:', mySide);
                          console.log('🔍 Tournament Teams count:', tournTeams.length);
                          
                          // Log each team explicitly
                          tournTeams.forEach((t, idx) => {
                            console.log(`  Team ${idx}: id=${t.id}, players=${t.players?.length || 0}`);
                          });
                          
                          console.log('🔍 Online Room Players:', onlineRoom.players.length);
                          onlineRoom.players.forEach((p, idx) => {
                            console.log(`  Player ${idx}: name=${p.name}, side=${p.side}`);
                          });
                          
                          // Check if all players have 11 players
                          const playerSides = onlineRoom.players.map(p => p.side);
                          console.log('🔍 Player Sides:', playerSides);
                          console.log('🔍 TournTeams IDs:', tournTeams.map(t => t.id));
                          
                          // Ensure all player sides have corresponding teams (create empty ones if needed)
                          const allTeams = [...tournTeams];
                          playerSides.forEach(side => {
                            if (!allTeams.find(t => t.id === side)) {
                              console.log(`⚠️ Creating missing team for side: ${side}`);
                              allTeams.push({
                                id: side,
                                name: `Team ${side}`,
                                players: [],
                                played: 0,
                                won: 0,
                                pts: 0,
                                nrr: 0,
                                runsScored: 0,
                                oversFaced: 0,
                                runsConceded: 0,
                                oversBowled: 0
                              });
                            }
                          });
                          
                          const playerTeams = allTeams.filter(t => playerSides.includes(t.id));
                          
                          console.log('🔍 Player Sides to validate:', playerSides);
                          console.log('🔍 Filtered teams for validation:', playerTeams.length);
                          playerTeams.forEach((t, idx) => {
                            console.log(`  Filtered Team ${idx}: id=${t.id}, players=${t.players?.length || 0}`);
                          });
                          
                          // Make sure we have exactly matching teams
                          if (playerTeams.length !== playerSides.length) {
                            alert(`Error: Expected ${playerSides.length} teams but found ${playerTeams.length}`);
                            return;
                          }
                          
                          const allReady = playerTeams.length > 0 && playerTeams.every(t => (t.players?.length || 0) === 11);
                          
                          console.log('🔍 All Ready?', allReady);
                          if (!allReady) {
                            playerTeams.forEach(t => {
                              console.log(`  Team ${t.id}: ${t.players?.length || 0}/11 players`);
                            });
                          }
                          
                          if (!allReady) {
                            const incomplete = playerTeams.filter(t => (t.players?.length || 0) !== 11);
                            alert(`All players must select 11 players before starting tournament.\nIncomplete teams: ${incomplete.map(t => `Team ${t.id} (${t.players?.length || 0}/11)`).join(', ')}`);
                            return;
                          }
                          // Generate fixtures
                          socket.emit("generateTournamentFixtures", {
                            code: onlineRoom.code,
                          }, (response) => {
                            console.log("📦 generateTournamentFixtures callback:", response);
                            if (!response.success) {
                              setTournamentStartError(response.error);
                            }
                          });
                        }, 100);
                      }}
                      className="bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-500 hover:to-emerald-600 text-white font-broadcast text-xl px-8 py-3 rounded-xl transition-all"
                  >
                    START TOURNAMENT
                  </button>
              ) : (
                  <p className="text-slate-400 text-sm">
                    Waiting for host to start tournament...
                  </p>
              )}
            </div>
          </div>
        </div>
    );
  }

  // Offline tournament setup (original)
  return (
    <div className="min-h-screen p-8 flex flex-col items-center justify-center relative overflow-hidden bg-slate-950">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/10 via-slate-950 to-slate-950" />
      <div className="relative z-10 w-full max-w-3xl">
        <h2 className="font-broadcast text-7xl text-center text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-400 drop-shadow-xl mb-8">
          League Setup
        </h2>
        <div className="glass-panel p-1 rounded-3xl">
          <div className="bg-slate-950/50 rounded-[20px] p-8 backdrop-blur-md">
            <div className="flex gap-3 mb-8">
              <input
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  className="flex-1 bg-slate-900/80 border border-slate-700 rounded-xl p-4 text-white text-lg placeholder-slate-500 focus:outline-none focus:border-brand-gold transition-all font-broadcast tracking-wide"
                  placeholder="ENTER TEAM NAME"
              />
              <button
                  onClick={addTournTeam}
                  className="bg-gradient-to-b from-brand-gold to-yellow-600 text-black font-broadcast text-xl tracking-wider px-8 rounded-xl hover:brightness-110 transition-all"
              >
                ADD TEAM
              </button>
            </div>
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {tournTeams.map((t, i) => (
                  <div
                      key={t.id}
                      className="bg-slate-900/60 p-4 rounded-xl flex justify-between items-center border border-white/5"
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-slate-600 font-broadcast text-2xl w-8">
                        {(i + 1).toString().padStart(2, "0")}
                      </span>
                      {(() => {
                        const display = getTeamDisplay(t);
                        return display.logo && (
                          <img src={display.logo} alt={display.shortName} className="w-6 h-6 object-contain" />
                        );
                      })()}
                      <span className="font-bold text-xl text-slate-200">
                        {getTeamDisplay(t).name}
                      </span>
                    </div>
                    <span className="text-xs font-bold bg-slate-800 text-slate-400 px-3 py-1 rounded-full border border-slate-700">
                      {t.players.length} / 11
                    </span>
                  </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-between mt-8 items-center">
          <button
              onClick={() => setView("menu")}
              className="text-slate-400 hover:text-white px-6 py-2 transition-colors uppercase tracking-widest text-xs font-bold flex items-center gap-2"
          >
            <ChevronLeft size={16} /> Back to Menu
          </button>

          <div className="flex gap-3 items-center">
            {isOnline ? (
                <div className="px-4 py-2 rounded-full bg-slate-900 border border-sky-600 text-sky-300 text-xs font-bold uppercase tracking-widest">
                  Room {onlineRoom?.code} • {isOnlineHost ? "HOST" : "GUEST"}
                </div>
            ) : (
                <button
                    onClick={() => {
                      setOnlineGameType("tournament");
                      setOnlineRoom(null);
                      setJoinCode("");
                      setJoinError("");
                      setView("online_entry");
                    }}
                    className="px-6 py-3 rounded-full border border-sky-600 text-sky-300 hover:bg-sky-900/40 transition-all font-bold text-xs uppercase tracking-widest"
                >
                  Play Tournament with Friends
                </button>
            )}

            <button
                disabled={tournTeams.length < 3}
                onClick={() => {
                  setActiveTeamSelect(tournTeams[0] ? tournTeams[0].id : null);
                  setView("tourn_draft");
                }}
                className={`px-12 py-4 rounded-full font-broadcast text-2xl tracking-wide transition-all shadow-2xl ${
                    tournTeams.length < 3
                        ? "bg-slate-800 text-slate-600 cursor-not-allowed"
                        : "bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:scale-105"
                }`}
            >
              ENTER DRAFT
            </button>
          </div>
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
              className="px-6 py-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs uppercase tracking-wider transition-colors"
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
    </div>
  );
};

export default TournSetupPage;

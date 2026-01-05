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
  isHostReady,
  setIsHostReady,
  playersReady,
  setPlayersReady,
  showGuestReadyModal,
  setShowGuestReadyModal,
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
            
            {/* Players Ready Status */}
            {onlineRoom?.players && onlineRoom.players.length > 0 && (
              <div className="px-6 py-3 rounded-lg bg-slate-800/50 border border-slate-700 text-slate-300 text-sm font-semibold text-center">
                🟢 Ready: {Object.values(playersReady).filter(Boolean).length} / {onlineRoom.players.length}
              </div>
            )}
            
            <div className="flex justify-between items-center">
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
                      disabled={onlineRoom?.players?.some(p => p.socketId !== socket.id && !playersReady[p.socketId])}
                      className="bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-500 hover:to-emerald-600 text-white font-broadcast text-xl px-8 py-3 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    START TOURNAMENT
                  </button>
              ) : (
                  // GUEST: Ready button or waiting message
                  playersReady[socket.id] ? (
                    <div className="bg-blue-900/40 border border-blue-500 text-blue-300 px-8 py-3 rounded-full font-broadcast text-lg text-center">
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
                        console.log("✓ Guest marked as ready for tournament setup");
                      }}
                      className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-8 py-3 rounded-full font-broadcast text-lg hover:scale-105 transition-transform shadow-xl shadow-blue-900/20"
                    >
                      ✓ MARK AS READY
                    </button>
                  )
              )}
            </div>
          </div>
        </div>
    );
  }

  // Offline tournament setup (original)
  return (
    <div className="min-h-screen p-8 flex flex-col items-center justify-center relative overflow-hidden bg-slate-950">
      {/* Animated background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-slate-950 to-pink-900/10" />
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-pink-600/10 rounded-full blur-3xl animate-pulse" />
      
      <div className="relative z-10 w-full max-w-5xl">
        {/* Main Header */}
        <div className="text-center mb-16">
          <div className="mb-6 inline-block">
            <div className="text-7xl mb-2 animate-bounce" style={{animationDelay: '0.1s'}}>🏆</div>
          </div>
          <h1 className="font-broadcast text-8xl text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-pink-300 to-red-300 drop-shadow-2xl mb-4">
            TOURNAMENT
          </h1>
          <p className="text-slate-300 text-xl uppercase tracking-widest font-semibold mb-2">
            Compete with Friends Worldwide
          </p>
          <p className="text-slate-500 text-sm">Experience the ultimate multiplayer cricket tournament</p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-3 gap-4 mb-12">
          <div className="glass-panel p-1 rounded-2xl bg-gradient-to-br from-blue-900/10 to-cyan-900/10 hover:from-blue-900/20 hover:to-cyan-900/20 transition-all">
            <div className="bg-slate-950/60 rounded-[16px] p-6 backdrop-blur-md text-center">
              <div className="text-4xl mb-3">👥</div>
              <h3 className="font-broadcast text-lg text-white mb-2">Multi Teams</h3>
              <p className="text-slate-400 text-xs">Create tournaments with multiple teams</p>
            </div>
          </div>

          <div className="glass-panel p-1 rounded-2xl bg-gradient-to-br from-green-900/10 to-emerald-900/10 hover:from-green-900/20 hover:to-emerald-900/20 transition-all">
            <div className="bg-slate-950/60 rounded-[16px] p-6 backdrop-blur-md text-center">
              <div className="text-4xl mb-3">🌍</div>
              <h3 className="font-broadcast text-lg text-white mb-2">Live Matches</h3>
              <p className="text-slate-400 text-xs">Play real-time matches with live updates</p>
            </div>
          </div>

          <div className="glass-panel p-1 rounded-2xl bg-gradient-to-br from-amber-900/10 to-orange-900/10 hover:from-amber-900/20 hover:to-orange-900/20 transition-all">
            <div className="bg-slate-950/60 rounded-[16px] p-6 backdrop-blur-md text-center">
              <div className="text-4xl mb-3">📊</div>
              <h3 className="font-broadcast text-lg text-white mb-2">Statistics</h3>
              <p className="text-slate-400 text-xs">Track detailed tournament leaderboards</p>
            </div>
          </div>
        </div>

        {/* Main CTA Card */}
        <div className="mb-12 glass-panel p-1 rounded-3xl bg-gradient-to-br from-purple-900/30 to-pink-900/30 border-2 border-purple-500/40 hover:border-purple-500/60 transition-all">
          <div className="bg-gradient-to-br from-slate-950/80 to-slate-900/60 rounded-[20px] p-12 backdrop-blur-md">
            <div className="flex items-center gap-6 mb-8">
              <div className="text-6xl">🎮</div>
              <div>
                <h2 className="font-broadcast text-5xl text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-pink-300 mb-2">Online Tournament</h2>
                <p className="text-slate-300 text-lg">Create a new room or join existing tournaments with your friends</p>
              </div>
            </div>
            
            <button
              onClick={() => {
                setOnlineGameType("tournament");
                setOnlineRoom(null);
                setJoinCode("");
                setJoinError("");
                setView("online_entry");
              }}
              className="w-full px-8 py-5 rounded-xl bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 hover:from-purple-500 hover:via-pink-500 hover:to-red-500 text-white font-broadcast text-2xl tracking-widest transition-all shadow-2xl shadow-purple-900/60 hover:shadow-purple-900/80 hover:scale-105 transform active:scale-95 duration-200"
            >
              ⚔️ START TOURNAMENT NOW
            </button>
          </div>
        </div>

        {/* How It Works Section */}
        <div className="mb-12 glass-panel p-1 rounded-2xl bg-gradient-to-r from-slate-900/20 to-slate-800/20">
          <div className="bg-slate-950/60 rounded-[16px] p-8 backdrop-blur-md">
            <h3 className="font-broadcast text-3xl text-white mb-6 flex items-center gap-2">
              <span className="text-2xl">⚙️</span> How It Works
            </h3>
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-600/20 rounded-full flex items-center justify-center mx-auto mb-3 font-broadcast text-xl text-purple-300">1</div>
                <p className="text-slate-300 text-sm font-semibold">Create Room</p>
                <p className="text-slate-500 text-xs mt-1">Or join existing</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-pink-600/20 rounded-full flex items-center justify-center mx-auto mb-3 font-broadcast text-xl text-pink-300">2</div>
                <p className="text-slate-300 text-sm font-semibold">Build Teams</p>
                <p className="text-slate-500 text-xs mt-1">Select your XI</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-red-600/20 rounded-full flex items-center justify-center mx-auto mb-3 font-broadcast text-xl text-red-300">3</div>
                <p className="text-slate-300 text-sm font-semibold">Play Matches</p>
                <p className="text-slate-500 text-xs mt-1">Real-time games</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-amber-600/20 rounded-full flex items-center justify-center mx-auto mb-3 font-broadcast text-xl text-amber-300">4</div>
                <p className="text-slate-300 text-sm font-semibold">Win Trophy</p>
                <p className="text-slate-500 text-xs mt-1">Claim victory</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Navigation */}
        <div className="flex justify-center gap-4">
          <button
            onClick={() => setView("menu")}
            className="px-8 py-3 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-white font-bold text-xs uppercase tracking-wider transition-all hover:shadow-lg"
          >
            ← Back to Menu
          </button>
        </div>
      </div>
    </div>
  );
};

export default TournSetupPage;

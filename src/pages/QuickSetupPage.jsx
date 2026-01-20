import React, { useState } from "react";
import { Shuffle, ChevronLeft } from "../components/shared/Icons";
import PlayerSearch from "../components/shared/PlayerSearch";
import TeamListItem from "../components/shared/TeamListItem";
import { capitalizeFirstLetter } from "../utils/appUtils";

/**
 * QuickSetupPage - Squad selection for 1v1 quick matches
 * Props:
 *   - teamA, setTeamA - Team A state
 *   - teamB, setTeamB - Team B state
 *   - activeTeamSelect, setActiveTeamSelect - Selected team for adding players
 *   - onlineRoom, isOnline, isOnlineHost - Online game state
 *   - socket - Socket.IO instance
 *   - handleAddToActiveTeam - Add player handler
 *   - handleRemoveFromTeam - Remove player handler
 *   - handleStartQuickMatch - Start match handler
 *   - autoDraftQuickPlay - Auto-pick squad handler
 *   - setView, setOnlineGameType, setJoinCode, setJoinError - Navigation handlers
 *   - getTeamDisplay - Team display helper
 */
const QuickSetupPage = ({
  teamA,
  teamB,
  activeTeamSelect,
  setActiveTeamSelect,
  onlineRoom,
  isOnline,
  isOnlineHost,
  socket,
  handleAddToActiveTeam,
  handleRemoveFromTeam,
  handleStartQuickMatch,
  autoDraftQuickPlay,
  setView,
  setOnlineGameType,
  setJoinCode,
  setJoinError,
  getTeamDisplay,
  playerName,
  setPlayerName,
  onlineName,
  isHostReady,
  setIsHostReady,
  playersReady,
  setPlayersReady,
  showGuestReadyModal,
  setShowGuestReadyModal,
}) => {
  const [showNameModal, setShowNameModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState("all"); // Track selected role filter
  const teamAHasXI = teamA.players.length === 11;
  const teamBHasXI = teamB.players.length === 11;

  // ✅ In online mode, show only player's own team
  const mySide = onlineRoom?.players?.find((p) => p.socketId === socket.id)?.side;
  const myTeam = isOnline 
    ? (mySide === "A" ? teamA : teamB)
    : null;
  
  // Check if MY team has 11 players (for online guests)
  const myTeamHasXI = myTeam ? myTeam.players.length === 11 : false;

  // Offline: just need at least 2 each
  const offlineReady =
    teamA.players.length >= 2 && teamB.players.length >= 2;

  // Online: 
  // - For guests: only their own team needs 11 players
  // - For hosts: both teams need 11 players
  const onlineReady = isOnlineHost 
    ? (teamAHasXI && teamBHasXI)  // Host needs both teams ready
    : myTeamHasXI;  // Guest only needs their own team ready

  const canStart = isOnline ? onlineReady : offlineReady;
  
  const teams = isOnline && myTeam
    ? [{ id: myTeam.id, ...myTeam }]
    : [
        { id: "A", ...teamA },
        { id: "B", ...teamB },
      ];

  return (
    <div className="fixed inset-0 w-full flex flex-col bg-slate-950 overflow-hidden">
      <div className="relative z-10 w-full px-3 sm:px-4 lg:px-8 py-3 sm:py-4 lg:py-6 flex flex-col gap-3 sm:gap-4 border-b border-white/5 bg-slate-950/80 backdrop-blur-sm flex-shrink-0">
        <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-3">
          <div>
            <h1 className="text-3xl sm:text-4xl lg:text-6xl font-broadcast text-white leading-none drop-shadow-lg">
              SQUAD SELECTION
            </h1>
            <p className="text-slate-400 uppercase tracking-widest text-[10px] sm:text-xs lg:text-sm ml-1 mt-1 sm:mt-2">
              Build your playing XIs
            </p>
          </div>
          <div className="flex flex-wrap gap-2 sm:gap-3 lg:gap-4 items-center">
            <button
              onClick={autoDraftQuickPlay}
              className="px-3 sm:px-4 lg:px-6 py-2 sm:py-2 lg:py-3 rounded-full border border-brand-gold/50 text-brand-gold hover:bg-brand-gold/10 transition-all font-bold text-[10px] sm:text-xs uppercase tracking-widest flex items-center gap-1 sm:gap-2 whitespace-nowrap"
            >
              <Shuffle size={12} className="sm:w-4 sm:h-4 lg:w-4 lg:h-4" /> Auto Pick
            </button>

            {/* If already in an online room, show room badge instead of "Play with Friends" */}
            {isOnline ? (
              <div className="px-2 sm:px-3 lg:px-4 py-1 sm:py-2 lg:py-2 rounded-full bg-slate-900 border border-sky-600 text-sky-300 text-[9px] sm:text-[10px] lg:text-xs font-bold uppercase tracking-widest whitespace-nowrap">
                Room {onlineRoom?.code} • {isOnlineHost ? "HOST" : "GUEST"}
              </div>
            ) : (
              <button
                onClick={() => {
                  setOnlineGameType("quick");
                  setJoinCode("");
                  setJoinError("");
                  setView("online_entry");
                }}
                className="px-3 sm:px-4 lg:px-6 py-2 sm:py-2 lg:py-3 rounded-full border border-sky-600 text-sky-300 hover:bg-sky-900/40 transition-all font-bold text-[10px] sm:text-xs uppercase tracking-widest whitespace-nowrap"
              >
                Play with Friends
              </button>
            )}

            {/* Players Ready Status */}
            {isOnline && onlineRoom?.players && onlineRoom.players.length > 0 && (
              <div className="px-2 sm:px-3 lg:px-6 py-1 sm:py-2 lg:py-3 rounded-lg bg-slate-800/50 border border-slate-700 text-slate-300 text-[9px] sm:text-xs lg:text-sm font-semibold text-center whitespace-nowrap">
                🟢 Ready: {Object.values(playersReady).filter(Boolean).length} / {onlineRoom.players.length}
              </div>
            )}
          </div>
        </div>

        {/* ✅ Guest Ready Button or Host Start Button */}
        <div className="w-full">
          {isOnline && !isOnlineHost ? (
            // GUEST: Show ready button or waiting message
            playersReady[socket.id] ? (
              <div className="px-6 py-2 sm:py-2 lg:py-3 rounded-full bg-emerald-900/40 border border-emerald-500 text-emerald-300 font-broadcast text-base sm:text-lg lg:text-2xl text-center">
                ✓ YOU'RE READY!
              </div>
            ) : canStart ? (
              <button
                onClick={() => {
                  setPlayersReady(prev => ({
                    ...prev,
                    [socket.id]: true
                  }));
                  socket.emit("playerReady", { roomCode: onlineRoom.code, socketId: socket.id });
                  console.log("✓ Guest marked as ready");
                }}
                className="w-full px-6 py-2 sm:py-2 lg:py-3 rounded-full bg-gradient-to-r from-emerald-600 to-green-600 text-white font-broadcast text-base sm:text-lg lg:text-2xl hover:scale-105 transition-transform shadow-xl shadow-emerald-900/20"
              >
                ✓ MARK AS READY
              </button>
            ) : (
              <div className="px-10 py-3 rounded-full bg-slate-800 text-slate-500 font-broadcast text-2xl text-center">
                Select 11 players to continue
              </div>
            )
          ) : (
            // HOST: Start button, disabled until all guests are ready
            (() => {
              // Check if all non-host players are ready (for online) or just canStart (for offline)
              // A guest is "not ready" only if they explicitly marked as false or don't exist in playersReady yet
              const someGuestNotReady = isOnline && onlineRoom?.players?.some(p => 
                p.socketId !== socket.id && playersReady[p.socketId] !== true
              );
              const isButtonDisabled = !canStart || someGuestNotReady;
              const isButtonEnabled = canStart && !someGuestNotReady;
              
              return (
                <button
                  onClick={isButtonEnabled ? () => {
                    if (isOnline) {
                      handleStartQuickMatch();
                      setIsHostReady(false);
                      setPlayersReady({});
                    } else {
                      setShowNameModal(true);
                    }
                  } : undefined}
                  disabled={isButtonDisabled}
                  className={
                    "px-10 py-3 rounded-full font-broadcast text-2xl transition-transform shadow-xl shadow-green-900/20 " +
                    (isButtonEnabled
                      ? "bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:scale-105"
                      : "bg-slate-800 text-slate-500 cursor-not-allowed")
                  }
                  title={someGuestNotReady ? "Waiting for guests to confirm they're ready" : ""}
                >
                  START MATCH
                </button>
              );
            })()
          )}
        </div>
      </div>

      <div className="relative z-10 flex-1 flex flex-col lg:flex-row p-2 sm:p-4 lg:p-6 gap-2 sm:gap-4 lg:gap-6 min-h-0 overflow-hidden">
        {/* Left side - Player Pool */}
        <div className="w-full lg:flex-1 flex flex-col min-h-0 h-auto lg:h-full min-w-0 order-2 lg:order-1">
          <PlayerSearch activeTeam={activeTeamSelect} onAddPlayer={handleAddToActiveTeam} />
          {!activeTeamSelect && (
            <div className="mt-2 sm:mt-4 p-2 sm:p-4 bg-blue-900/30 border border-blue-700 rounded-lg text-center">
              <p className="text-blue-300 text-[10px] sm:text-xs lg:text-sm font-semibold">👈 Select a team on the right to add players</p>
            </div>
          )}

        </div>

        {/* Right side - Team Selection */}
        <div className="w-full lg:w-96 flex flex-col gap-2 sm:gap-4 h-auto lg:h-full min-h-0 max-h-[50vh] lg:max-h-none order-1 lg:order-2">
          <div className="glass-panel p-2 sm:p-3 lg:p-4 rounded-xl lg:rounded-2xl flex-shrink-0 bg-slate-900/80">
            <h3 className="text-[10px] sm:text-xs lg:text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 sm:mb-2">
              {isOnline ? "Your Team" : "Your Teams"}
            </h3>
            <p className="text-[9px] sm:text-xs text-slate-500">
              {isOnline 
                ? "Select 11 players for your squad" 
                : "Click a team below to select it."}
            </p>
            
            {/* ✅ Show opponent status in online mode */}
            {isOnline && (
              <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-white/5">
                <div className="flex justify-between items-center text-[9px] sm:text-xs">
                  <span className="text-slate-500">Opponent:</span>
                  <span className={`font-bold ${
                    (mySide === "A" ? teamBHasXI : teamAHasXI)
                      ? "text-green-400"
                      : "text-slate-400"
                  }`}>
                    {mySide === "A" ? teamB.players.length : teamA.players.length} / 11
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 sm:space-y-3 lg:space-y-4 pr-1 pb-2 sm:pb-4 min-h-0">
            {teams.map((t) => {
              // ✅ Determine ownership in online mode
              const mySide = onlineRoom?.players?.find((p) => p.socketId === socket.id)?.side;
              const isMyTeam = isOnline ? t.id === mySide : true;
              const ownerName = isOnline 
                ? onlineRoom?.players?.find((p) => p.side === t.id)?.name 
                : null;
              
              const handleTeamClick = () => {
                console.log("🎯 Team clicked:", t.id, "isMyTeam:", isMyTeam);
                if (isMyTeam) {
                  console.log("✅ Setting activeTeamSelect to:", t.id);
                  setActiveTeamSelect(t.id);
                }
              };

              return (
                <div
                  key={t.id}
                  onClick={handleTeamClick}
                  className={`group rounded-lg sm:rounded-2xl transition-all duration-300 flex-1 flex flex-col relative overflow-hidden border-2 ${
                    !isMyTeam 
                      ? "border-slate-700 bg-slate-900/20 opacity-60 cursor-not-allowed"
                      : activeTeamSelect === t.id
                      ? "border-brand-gold bg-slate-900 shadow-[0_0_30px_rgba(251,191,36,0.15)] z-10 cursor-pointer"
                      : "border-white/10 bg-slate-900/40 hover:bg-slate-900/60 hover:border-white/20 cursor-pointer"
                  }`}
                >
                  <div className="h-full flex flex-col p-2 sm:p-3 lg:p-5 relative z-10">
                    <div className="flex justify-between items-start gap-2 mb-2 sm:mb-4 border-b border-white/5 pb-2 sm:pb-3">
                      <div className="flex flex-col gap-1 min-w-0">
                        <div className="flex items-center gap-1 sm:gap-2 lg:gap-3 min-w-0">
                          {(() => {
                            const display = getTeamDisplay(t);
                            return display.logo && (
                              <img src={display.logo} alt={display.shortName} className="w-5 sm:w-6 lg:w-8 h-5 sm:h-6 lg:h-8 object-contain flex-shrink-0" />
                            );
                          })()}
                          <span
                            className={`font-broadcast text-base sm:text-2xl lg:text-3xl truncate ${
                              activeTeamSelect === t.id ? "text-brand-gold" : "text-white"
                            }`}
                          >
                            {getTeamDisplay(t).name}
                          </span>
                        </div>
                        {ownerName && (
                          <span className="text-[8px] sm:text-[10px] lg:text-[10px] text-slate-500 uppercase tracking-wider">
                            {isMyTeam ? "Your Team" : ownerName}
                          </span>
                        )}
                      </div>
                      <div
                        className={`text-[8px] sm:text-[10px] lg:text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider flex-shrink-0 ${
                          t.players.length >= 11
                            ? "bg-green-900 text-green-400"
                            : "bg-slate-800 text-slate-400"
                        }`}
                      >
                        {t.players.length} / 11
                      </div>
                    </div>

                    {/* Squad Composition Stats as Clickable Tabs */}
                    {t.players.length > 0 && (
                      <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-white/10">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1">
                          <button
                            onClick={() => setSelectedRole("all")}
                            className={`px-2 py-1 sm:py-2 rounded text-[8px] sm:text-[10px] font-bold uppercase tracking-wider transition-all ${
                              selectedRole === "all"
                                ? "bg-brand-gold/20 text-brand-gold border border-brand-gold/50"
                                : "bg-slate-800/50 text-slate-400 hover:bg-slate-700/50 border border-slate-700"
                            }`}
                          >
                            All ({t.players.length})
                          </button>
                          <button
                            onClick={() => setSelectedRole("batter")}
                            className={`px-2 py-1 sm:py-2 rounded text-[8px] sm:text-[10px] font-bold uppercase tracking-wider transition-all ${
                              selectedRole === "batter"
                                ? "bg-blue-500/20 text-blue-400 border border-blue-500/50"
                                : "bg-slate-800/50 text-slate-400 hover:bg-slate-700/50 border border-slate-700"
                            }`}
                          >
                            Bat ({t.players.filter(p => p.role === 'BATTER' || p.role === 'Bat').length})
                          </button>
                          <button
                            onClick={() => setSelectedRole("bowler")}
                            className={`px-2 py-1 sm:py-2 rounded text-[8px] sm:text-[10px] font-bold uppercase tracking-wider transition-all ${
                              selectedRole === "bowler"
                                ? "bg-red-500/20 text-red-400 border border-red-500/50"
                                : "bg-slate-800/50 text-slate-400 hover:bg-slate-700/50 border border-slate-700"
                            }`}
                          >
                            Bow ({t.players.filter(p => p.role === 'BOWLER' || p.role === 'Bowl').length})
                          </button>
                          <button
                            onClick={() => setSelectedRole("allrounder")}
                            className={`px-2 py-1 sm:py-2 rounded text-[8px] sm:text-[10px] font-bold uppercase tracking-wider transition-all ${
                              selectedRole === "allrounder"
                                ? "bg-purple-500/20 text-purple-400 border border-purple-500/50"
                                : "bg-slate-800/50 text-slate-400 hover:bg-slate-700/50 border border-slate-700"
                            }`}
                          >
                            AR ({t.players.filter(p => p.role === 'ALLROUNDER' || p.role === 'All').length})
                          </button>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex-1 overflow-y-auto mt-2 sm:mt-3">
                      {t.players
                        .filter((p) => {
                          if (selectedRole === "all") return true;
                          if (selectedRole === "batter") return p.role === "BATTER" || p.role === "Bat";
                          if (selectedRole === "bowler") return p.role === "BOWLER" || p.role === "Bowl";
                          if (selectedRole === "allrounder") return p.role === "ALLROUNDER" || p.role === "All";
                          return true;
                        })
                        .map((p, i) => (
                          <TeamListItem
                            key={p.instanceId || p.id || i}
                            player={p}
                            onRemove={isMyTeam ? (e) => {
                              e.stopPropagation();
                              handleRemoveFromTeam(t.id, i);
                            } : null}
                          />
                        ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Guest Ready Modal - Only for online guests */}
      {isOnline && !isOnlineHost && showGuestReadyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="bg-gradient-to-br from-emerald-900/40 to-slate-950 border border-emerald-500/50 rounded-2xl p-10 w-full max-w-md shadow-2xl">
            <h2 className="text-4xl font-broadcast text-white mb-2">🏆 HOST IS READY!</h2>
            <p className="text-slate-300 mb-8 text-base">Are you ready to play?</p>
            <div className="flex gap-4">
              <button
                onClick={() => {
                  console.log("✅ Guest confirmed ready!");
                  setShowGuestReadyModal(false);
                  socket.emit("playerReady", { 
                    roomCode: onlineRoom.code, 
                    socketId: socket.id 
                  });
                }}
                className="flex-1 px-6 py-4 rounded-lg bg-green-600 hover:bg-green-700 text-white font-bold text-lg uppercase tracking-wider transition-colors"
              >
                ✓ Ready!
              </button>
              <button
                onClick={() => {
                  console.log("❌ Guest not ready");
                  setShowGuestReadyModal(false);
                }}
                className="flex-1 px-6 py-4 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold text-lg uppercase tracking-wider transition-colors"
              >
                Not Yet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Player Name Modal */}
      {showNameModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-700 rounded-2xl p-8 w-full max-w-md shadow-2xl">
            <h2 className="text-3xl font-broadcast text-white mb-6">ENTER YOUR NAME</h2>
            <input
              type="text"
              value={playerName}
              onChange={(e) => {
                console.log("🎭 Modal: playerName changing from", playerName, "to", e.target.value);
                setPlayerName(capitalizeFirstLetter(e.target.value));
              }}
              onKeyPress={(e) => {
                if (e.key === "Enter" && playerName.trim()) {
                  console.log("🎭 Modal: Enter pressed, calling handleStartQuickMatch with playerName:", playerName);
                  handleStartQuickMatch();
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
                    console.log("🎭 Modal: 'Start Match' button clicked with playerName:", playerName);
                    handleStartQuickMatch();
                    setShowNameModal(false);
                  }
                }}
                disabled={!playerName.trim()}
                className={`flex-1 px-6 py-3 rounded-lg font-bold text-sm uppercase tracking-wider transition-colors ${
                  playerName.trim()
                    ? "bg-green-600 hover:bg-green-700 text-white"
                    : "bg-slate-700 text-slate-500 cursor-not-allowed"
                }`}
              >
                Start Match
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Footer */}
      <div className="absolute bottom-0 left-0 right-0 z-50 bg-gradient-to-t from-slate-950 to-slate-950/80 border-t border-slate-700/50 px-8 py-6 flex justify-between items-center gap-4 flex-wrap">
        <button
          onClick={() => setView("menu")}
          className="px-6 py-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs uppercase tracking-wider transition-colors"
        >
          ← Back to Menu
        </button>
        <div className="flex gap-3">
          <button
            onClick={() => setView("tourn_setup")}
            disabled={isOnline && onlineRoom?.players?.length < 2}
            className="px-6 py-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs uppercase tracking-wider transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title={isOnline && onlineRoom?.players?.length < 2 ? "Need at least 2 players to play online" : ""}
          >
            🏆 Tournament
          </button>
          <button
            onClick={() => {
              setOnlineGameType("quick");
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
  );
};

export default QuickSetupPage;

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
  const teamAHasXI = teamA.players.length === 11;
  const teamBHasXI = teamB.players.length === 11;

  // Offline: just need at least 2 each
  const offlineReady =
    teamA.players.length >= 2 && teamB.players.length >= 2;

  // Online: require full XIs
  const onlineReady = teamAHasXI && teamBHasXI;

  const canStart = isOnline ? onlineReady : offlineReady;

  // ✅ In online mode, show only player's own team
  const mySide = onlineRoom?.players?.find((p) => p.socketId === socket.id)?.side;
  const myTeam = isOnline 
    ? (mySide === "A" ? teamA : teamB)
    : null;
  
  const teams = isOnline && myTeam
    ? [{ id: myTeam.id, ...myTeam }]
    : [
        { id: "A", ...teamA },
        { id: "B", ...teamB },
      ];

  return (
    <div className="fixed inset-0 w-full flex flex-col bg-slate-950 overflow-hidden">
      <div className="relative z-10 w-full px-8 py-6 flex justify-between items-end border-b border-white/5 bg-slate-950/80 backdrop-blur-sm flex-shrink-0">
        <div>
          <h1 className="text-6xl font-broadcast text-white leading-none drop-shadow-lg">
            SQUAD SELECTION
          </h1>
          <p className="text-slate-400 uppercase tracking-widest text-sm ml-1">
            Build your playing XIs
          </p>
        </div>
        <div className="flex gap-4 items-center">
          <button
            onClick={autoDraftQuickPlay}
            className="px-6 py-3 rounded-full border border-brand-gold/50 text-brand-gold hover:bg-brand-gold/10 transition-all font-bold text-xs uppercase tracking-widest flex items-center gap-2"
          >
            <Shuffle size={16} /> Auto Pick
          </button>

          {/* If already in an online room, show room badge instead of "Play with Friends" */}
          {isOnline ? (
            <div className="px-4 py-2 rounded-full bg-slate-900 border border-sky-600 text-sky-300 text-xs font-bold uppercase tracking-widest">
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
              className="px-6 py-3 rounded-full border border-sky-600 text-sky-300 hover:bg-sky-900/40 transition-all font-bold text-xs uppercase tracking-widest"
            >
              Play with Friends
            </button>
          )}

          <button
            onClick={() => setView("menu")}
            className="px-6 py-3 rounded-full border border-slate-700 text-slate-400 hover:text-white hover:border-white hover:bg-white/5 transition-all font-bold text-xs uppercase tracking-widest"
          >
            Back to Menu
          </button>

          {/* Players Ready Status */}
          {isOnline && onlineRoom?.players && onlineRoom.players.length > 0 && (
            <div className="px-6 py-3 rounded-lg bg-slate-800/50 border border-slate-700 text-slate-300 text-sm font-semibold text-center">
              🟢 Ready: {Object.values(playersReady).filter(Boolean).length} / {onlineRoom.players.length}
            </div>
          )}

          {/* ✅ Guest Ready Button or Host Start Button */}
          {isOnline && !isOnlineHost ? (
            // GUEST: Show ready button or waiting message
            playersReady[socket.id] ? (
              <div className="px-10 py-3 rounded-full bg-emerald-900/40 border border-emerald-500 text-emerald-300 font-broadcast text-2xl text-center">
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
                className="px-10 py-3 rounded-full bg-gradient-to-r from-emerald-600 to-green-600 text-white font-broadcast text-2xl hover:scale-105 transition-transform shadow-xl shadow-emerald-900/20"
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
            <button
              onClick={canStart ? () => {
                if (isOnline) {
                  handleStartQuickMatch();
                  setIsHostReady(false);
                  setPlayersReady({});
                } else {
                  setShowNameModal(true);
                }
              } : undefined}
              disabled={!canStart || (isOnline && (onlineRoom?.players?.length < 2 || onlineRoom?.players?.some(p => p.socketId !== socket.id && !playersReady[p.socketId])))}
              className={
                "px-10 py-3 rounded-full font-broadcast text-2xl transition-transform shadow-xl shadow-green-900/20 " +
                (canStart && (!isOnline || !onlineRoom?.players?.some(p => p.socketId !== socket.id && !playersReady[p.socketId]))
                  ? "bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:scale-105"
                  : "bg-slate-800 text-slate-500 cursor-not-allowed")
              }
              title={isOnline && onlineRoom?.players?.some(p => p.socketId !== socket.id && !playersReady[p.socketId]) ? "Waiting for guests to confirm they're ready" : ""}
            >
              START MATCH
            </button>
          )}
        </div>
      </div>

      <div className="relative z-10 flex-1 flex p-6 gap-6 min-h-0 overflow-hidden">
        <div className="flex-1 flex flex-col min-h-0 h-full">
          <PlayerSearch activeTeam={activeTeamSelect} onAddPlayer={handleAddToActiveTeam} />
          {!activeTeamSelect && (
            <div className="mt-4 p-4 bg-blue-900/30 border border-blue-700 rounded-lg text-center">
              <p className="text-blue-300 text-sm font-semibold">👈 Select a team on the right to add players</p>
            </div>
          )}
          {activeTeamSelect && (
            <div className="mt-4 p-4 bg-green-900/30 border border-green-700 rounded-lg text-center">
              <p className="text-green-300 text-sm font-semibold">✅ Team <strong>{activeTeamSelect}</strong> selected - Search and add players</p>
            </div>
          )}
        </div>

        <div className="w-96 flex flex-col gap-4 h-full min-h-0">
          <div className="glass-panel p-4 rounded-2xl flex-shrink-0 bg-slate-900/80">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
              {isOnline ? "Your Team" : "Your Teams"}
            </h3>
            <p className="text-xs text-slate-500">
              {isOnline 
                ? "Select 11 players for your squad" 
                : "Click a team below to select it."}
            </p>
            
            {/* ✅ Show opponent status in online mode */}
            {isOnline && (
              <div className="mt-3 pt-3 border-t border-white/5">
                <div className="flex justify-between items-center text-xs">
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

          <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-1 pb-4">
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
                  className={`group rounded-2xl transition-all duration-300 flex-1 flex flex-col relative overflow-hidden border-2 ${
                    !isMyTeam 
                      ? "border-slate-700 bg-slate-900/20 opacity-60 cursor-not-allowed"
                      : activeTeamSelect === t.id
                      ? "border-brand-gold bg-slate-900 shadow-[0_0_30px_rgba(251,191,36,0.15)] z-10 cursor-pointer"
                      : "border-white/10 bg-slate-900/40 hover:bg-slate-900/60 hover:border-white/20 cursor-pointer"
                  }`}
                >
                  <div className="h-full flex flex-col p-5 relative z-10">
                    <div className="flex justify-between items-center mb-4 border-b border-white/5 pb-3">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-3">
                          {(() => {
                            const display = getTeamDisplay(t);
                            return display.logo && (
                              <img src={display.logo} alt={display.shortName} className="w-8 h-8 object-contain" />
                            );
                          })()}
                          <span
                            className={`font-broadcast text-3xl truncate ${
                              activeTeamSelect === t.id ? "text-brand-gold" : "text-white"
                            }`}
                          >
                            {getTeamDisplay(t).name}
                          </span>
                        </div>
                        {ownerName && (
                          <span className="text-[10px] text-slate-500 uppercase tracking-wider">
                            {isMyTeam ? "Your Team" : ownerName}
                          </span>
                        )}
                      </div>
                      <div
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                          t.players.length >= 11
                            ? "bg-green-900 text-green-400"
                            : "bg-slate-800 text-slate-400"
                        }`}
                      >
                        {t.players.length} / 11
                      </div>
                    </div>
                    <div className="space-y-1 max-h-48 overflow-y-auto custom-scrollbar">
                      {t.players.map((p, i) => (
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

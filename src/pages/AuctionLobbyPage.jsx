/**
 * AuctionLobbyPage.jsx
 * Auction mode lobby for franchise selection
 * 
 * Props:
 * - auctionTeams: Array of auction teams
 * - setAuctionTeams: Setter for auction teams
 * - isOnline: Boolean indicating if in online mode
 * - onlineRoom: Current online room data
 * - isOnlineHost: Boolean indicating if user is room host
 * - playerName: Current player name
 * - socket: Socket.IO instance
 * - setView: Function to change current view
 * - IPL_TEAMS: Array of IPL teams
 * - ChevronLeft: Icon component
 */

import React from 'react';
import { ChevronLeft } from '../components/shared/Icons';

const AuctionLobbyPage = ({
  auctionTeams,
  setAuctionTeams,
  isOnline,
  onlineRoom,
  isOnlineHost,
  playerName,
  socket,
  setView,
  IPL_TEAMS,
  isHostReady,
  setIsHostReady,
  playersReady,
  setPlayersReady,
  showGuestReadyModal,
  setShowGuestReadyModal,
}) => {
  const players = isOnline ? onlineRoom?.players || [] : auctionTeams;
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 relative overflow-hidden p-4">
      <button
        onClick={() => setView("menu")}
        className="absolute top-6 left-6 px-4 py-2 rounded-full border border-slate-700 text-slate-400 hover:text-white hover:border-white hover:bg-white/5 transition-all font-bold text-xs uppercase tracking-widest flex items-center gap-2"
      >
        <ChevronLeft size={16} /> Back to Menu
      </button>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-purple-900/20 via-slate-950 to-slate-950" />
      
      <div className="relative z-10 glass-panel rounded-3xl p-8 w-full max-w-4xl bg-slate-950/80">
        <h2 className="font-broadcast text-5xl text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-brand-gold mb-2">
          Auction Lobby
        </h2>
        <p className="text-xs text-slate-400 mb-6 uppercase tracking-widest">
          {isOnline ? `Room ${onlineRoom?.code} • Select your franchise` : "Select your franchise and wait for others"}
        </p>

        {/* Team Selection Grid */}
        <div className="mb-6">
          <h3 className="text-sm text-slate-300 mb-3">Choose Your Franchise</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 max-h-96 overflow-y-auto custom-scrollbar p-2">
            {IPL_TEAMS.map(team => {
              const taken = players.find(p => p.iplTeam === team.id);
              const isMine = isOnline ? taken?.socketId === socket.id : taken?.id === socket.id;
              
              return (
                <button
                  key={team.id}
                  onClick={() => {
                    if (taken && !isMine) return;
                    
                    if (isOnline) {
                      socket.emit("selectIPLTeam", { code: onlineRoom.code, teamId: isMine ? null : team.id });
                    } else {
                      if (isMine) {
                        setAuctionTeams(prev => prev.filter(t => t.id !== socket.id));
                      } else {
                        setAuctionTeams(prev => [
                          ...prev.filter(t => t.id !== socket.id),
                          { id: socket.id, name: playerName || 'Player', iplTeam: team.id }
                        ]);
                      }
                    }
                  }}
                  disabled={taken && !isMine}
                  className={`group relative p-4 rounded-xl border-2 transition-all ${
                    isMine 
                      ? 'border-brand-gold bg-brand-gold/20' 
                      : taken 
                      ? 'border-slate-800 bg-slate-900/30 opacity-50 cursor-not-allowed'
                      : 'border-slate-700 hover:border-purple-500/50 bg-slate-800/50'
                  }`}
                >
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-12 h-12 flex items-center justify-center bg-white/10 rounded-full p-2">
                      <img src={team.logo} alt={team.id} className="w-full h-full object-contain" />
                    </div>
                    <div className="text-center">
                      <div className="text-xs font-bold text-white">{team.id}</div>
                      {taken && <div className="text-[10px] text-slate-400">{taken.name}</div>}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Connected Players */}
        <div className="mb-6">
          <h3 className="text-sm text-slate-300 mb-2">
            Players Ready ({players.filter(p => p.iplTeam).length}/10)
          </h3>
          <div className="space-y-2">
            {players.filter(p => p.iplTeam).map((player) => {
              const iplTeam = IPL_TEAMS.find(t => t.id === player.iplTeam);
              return (
                <div
                  key={player.socketId || player.id}
                  className="flex justify-between items-center bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200"
                >
                  <span>{player.name}</span>
                  <div className="flex items-center gap-2">
                    {iplTeam && (
                      <span className="text-xs px-2 py-1 rounded flex items-center gap-1" style={{ backgroundColor: iplTeam.color, color: 'white' }}>
                        <img src={iplTeam.logo} alt={iplTeam.id} className="w-4 h-4 object-contain" />
                        <span>{iplTeam.id}</span>
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center">
          <button
            onClick={() => {
              setAuctionTeams([]);
              setView(isOnline ? "online_menu" : "menu");
            }}
            className="text-slate-400 hover:text-white px-6 py-2 transition-colors uppercase tracking-widest text-xs font-bold"
          >
            ← Back
          </button>

          {/* Players Ready Status */}
          {isOnline && onlineRoom?.players && onlineRoom.players.length > 0 && (
            <div className="px-6 py-3 rounded-lg bg-slate-800/50 border border-slate-700 text-slate-300 text-sm font-semibold text-center">
              🟢 Ready: {Object.values(playersReady).filter(Boolean).length} / {onlineRoom.players.length}
            </div>
          )}
          
          {isOnline && !isOnlineHost ? (
            // GUEST: Ready button or waiting message
            playersReady[socket.id] ? (
              <p className="text-emerald-400 text-sm font-bold">✓ You're Ready! Waiting for host...</p>
            ) : (
              <button
                onClick={() => {
                  const hasTeam = players.find(p => p.socketId === socket.id && p.iplTeam);
                  if (!hasTeam) {
                    alert("Select a franchise first");
                    return;
                  }
                  setPlayersReady(prev => ({
                    ...prev,
                    [socket.id]: true
                  }));
                  socket.emit("playerReady", { roomCode: onlineRoom.code, socketId: socket.id });
                  console.log("✓ Guest marked as ready for auction");
                }}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-sm px-6 py-2 rounded-lg transition-all"
              >
                ✓ MARK AS READY
              </button>
            )
          ) : (
            // HOST: Start button
            <button
              onClick={() => {
                const readyPlayers = players.filter(p => p.iplTeam);
                if (readyPlayers.length < 2) {
                  alert("Need at least 2 players to start auction");
                  return;
                }
                
                if (isOnline) {
                  socket.emit("startAuction", { code: onlineRoom.code });
                  setView("auction");
                  setIsHostReady(false);
                  setPlayersReady({});
                } else {
                  setView("auction");
                }
              }}
              disabled={players.filter(p => p.iplTeam).length < 2 || (isOnline && (onlineRoom?.players?.length < 2 || onlineRoom?.players?.some(p => p.socketId !== socket.id && !playersReady[p.socketId])))}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-broadcast text-xl px-8 py-3 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              START AUCTION
            </button>
          )}
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
              disabled={isOnline && onlineRoom?.players?.length < 2}
              className="px-6 py-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs uppercase tracking-wider transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title={isOnline && onlineRoom?.players?.length < 2 ? "Need at least 2 players to play online" : ""}
            >
              ⚡ Quick Play
            </button>
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuctionLobbyPage;

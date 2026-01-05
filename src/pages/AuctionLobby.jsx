/**
 * AuctionLobby.jsx
 * Fresh auction lobby component for team selection and player readiness
 * 
 * Features:
 * - Team franchise selection with availability tracking
 * - Online/offline mode support with socket.io sync
 * - Ready system for multi-player coordination
 * - Team roster preview
 * - Smooth transitions to auction room
 */

import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, Users, Zap, Trophy } from '../components/shared/Icons';

const AuctionLobby = ({
  isOnline = false,
  onlineRoom = null,
  playerName = 'Player',
  socket = null,
  IPL_TEAMS = [],
  auctionTeams = [],
  setAuctionTeams = () => {},
  isHostReady = false,
  setIsHostReady = () => {},
  playersReady = {},
  setPlayersReady = () => {},
  onStartAuction = () => {},
  onBack = () => {},
}) => {
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [readyToAuction, setReadyToAuction] = useState(false);
  const [loadingStart, setLoadingStart] = useState(false);

  // Determine current player's team and ready status
  const getPlayerTeamId = useCallback(() => {
    if (isOnline) {
      const currentPlayer = onlineRoom?.players?.find(p => p.socketId === socket?.id);
      return currentPlayer?.selectedTeam;
    } else {
      const currentPlayer = auctionTeams.find(t => t.id === socket?.id);
      return currentPlayer?.id;
    }
  }, [isOnline, onlineRoom, auctionTeams, socket]);

  const currentPlayerTeamId = getPlayerTeamId();

  // Get all teams in lobby (online or offline)
  const getTeamsInLobby = useCallback(() => {
    if (isOnline) {
      return onlineRoom?.players || [];
    } else {
      return auctionTeams;
    }
  }, [isOnline, onlineRoom, auctionTeams]);

  const teamsInLobby = getTeamsInLobby();

  // Check if host ready and can start
  const canStartAuction = useCallback(() => {
    const minimumPlayers = 2;
    if (teamsInLobby.length < minimumPlayers) return false;
    
    if (isOnline) {
      // Host needs to be ready and at least one other player ready
      if (!isHostReady) return false;
      const otherPlayersReady = Object.values(playersReady).filter(p => p).length >= 1;
      return otherPlayersReady;
    } else {
      // All local teams must be ready
      return teamsInLobby.length >= minimumPlayers && readyToAuction;
    }
  }, [teamsInLobby, isOnline, isHostReady, playersReady, readyToAuction]);

  // Handle team selection
  const handleTeamSelect = useCallback((teamId) => {
    if (isOnline) {
      socket?.emit('selectIPLTeam', {
        code: onlineRoom?.code,
        teamId: selectedTeam === teamId ? null : teamId,
      });
    } else {
      if (selectedTeam === teamId) {
        setAuctionTeams(prev => prev.filter(t => t.id !== socket?.id));
        setSelectedTeam(null);
      } else {
        setSelectedTeam(teamId);
        setAuctionTeams(prev => [
          ...prev.filter(t => t.id !== socket?.id),
          {
            id: socket?.id,
            name: playerName,
            selectedTeam: teamId,
            purse: 1000,
            squad: [],
          },
        ]);
      }
    }
  }, [isOnline, selectedTeam, socket, onlineRoom, playerName, setAuctionTeams]);

  // Handle ready status toggle
  const handleToggleReady = useCallback(() => {
    if (!currentPlayerTeamId) return; // Can't be ready without team

    if (isOnline) {
      socket?.emit('togglePlayerReady', {
        code: onlineRoom?.code,
        ready: !playersReady[socket?.id],
      });
    } else {
      setReadyToAuction(!readyToAuction);
    }
  }, [
    isOnline,
    currentPlayerTeamId,
    socket,
    onlineRoom,
    playersReady,
    readyToAuction,
  ]);

  // Handle auction start
  const handleStartAuction = useCallback(() => {
    if (!canStartAuction()) return;

    setLoadingStart(true);
    
    if (isOnline) {
      socket?.emit('startAuction', {
        code: onlineRoom?.code,
      });
    } else {
      // Offline: simulate delay for UX
      setTimeout(() => {
        onStartAuction();
      }, 500);
    }
  }, [isOnline, canStartAuction, socket, onlineRoom, onStartAuction]);

  // Check if team is taken by someone else
  const isTeamTaken = (teamId) => {
    return teamsInLobby.some(p => {
      const pTeamId = isOnline ? p.selectedTeam : p.selectedTeam;
      return pTeamId === teamId && p.id !== socket?.id;
    });
  };

  // Get team owner name
  const getTeamOwner = (teamId) => {
    const owner = teamsInLobby.find(p => {
      const pTeamId = isOnline ? p.selectedTeam : p.selectedTeam;
      return pTeamId === teamId;
    });
    return owner?.name || '';
  };

  const isCurrentPlayerReady = isOnline 
    ? playersReady[socket?.id]
    : readyToAuction;

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 relative overflow-hidden p-4">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-purple-900/20 via-slate-950 to-slate-950" />

      <div className="relative z-10 w-full max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-slate-400 hover:text-purple-400 transition-colors mb-6"
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="text-sm">Back</span>
          </button>

          <div>
            <h1 className="font-broadcast text-6xl text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-brand-gold to-purple-400 mb-2">
              Auction Lobby
            </h1>
            <p className="text-slate-400 text-sm">
              {isOnline 
                ? `Room ${onlineRoom?.code} • Select your franchise and wait for players`
                : 'Select your franchise and get ready for auction'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 auto-rows-max lg:auto-rows-auto">
          {/* Team Selection Grid */}
          <div className="lg:col-span-2 h-fit">
            <div className="glass-panel rounded-2xl p-6 bg-slate-950/50 border border-purple-500/20">
              <div className="flex items-center gap-2 mb-6">
                <Trophy className="w-5 h-5 text-brand-gold" />
                <h2 className="font-bold text-lg text-white">IPL Franchises</h2>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-96 overflow-y-auto custom-scrollbar">
                {IPL_TEAMS.map(team => {
                  const taken = isTeamTaken(team.id);
                  const isSelected = selectedTeam === team.id;
                  const owner = taken ? getTeamOwner(team.id) : '';

                  return (
                    <button
                      key={team.id}
                      onClick={() => handleTeamSelect(team.id)}
                      disabled={taken && !isSelected}
                      className={`relative group rounded-xl p-4 border-2 transition-all transform hover:scale-105 ${
                        isSelected
                          ? 'border-brand-gold bg-brand-gold/15 ring-2 ring-brand-gold/50'
                          : taken
                          ? 'border-slate-700 bg-slate-800/30 opacity-50 cursor-not-allowed'
                          : 'border-slate-700 hover:border-purple-500/50 bg-slate-800/30 hover:bg-slate-800/60'
                      }`}
                    >
                      {/* Team Logo */}
                      <div className="flex items-center justify-center mb-3 h-12">
                        <img
                          src={team.logo}
                          alt={team.id}
                          className="w-10 h-10 object-contain filter drop-shadow-lg"
                        />
                      </div>

                      {/* Team Name */}
                      <div className="text-center">
                        <div className="text-xs font-bold text-white uppercase truncate">
                          {team.id}
                        </div>

                        {/* Owner Info */}
                        {taken && (
                          <div className="text-[10px] text-slate-400 mt-1 truncate">
                            {owner}
                          </div>
                        )}

                        {/* Selection Badge */}
                        {isSelected && (
                          <div className="mt-2 inline-block px-2 py-1 bg-brand-gold/20 rounded text-[10px] font-bold text-brand-gold">
                            ✓ Selected
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Sidebar: Players and Ready Status */}
          <div className="lg:col-span-1 flex flex-col gap-6 h-fit">
            {/* Players Panel */}
            <div className="glass-panel rounded-2xl p-6 bg-slate-950/50 border border-purple-500/20 flex-1">
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-5 h-5 text-brand-gold" />
                <h3 className="font-bold text-white">Players</h3>
                <span className="ml-auto text-xs bg-purple-500/20 text-purple-300 px-2 py-1 rounded">
                  {teamsInLobby.length}
                </span>
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
                {teamsInLobby.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-slate-400 text-xs">Waiting for players...</p>
                  </div>
                ) : (
                  teamsInLobby.map(player => {
                    const teamId = isOnline ? player.selectedTeam : player.selectedTeam;
                    const team = IPL_TEAMS.find(t => t.id === teamId);
                    const isMe = isOnline 
                      ? player.socketId === socket?.id
                      : player.id === socket?.id;
                    const isReady = isOnline
                      ? playersReady[player.socketId]
                      : readyToAuction && isMe;

                    return (
                      <div
                        key={isOnline ? player.socketId : player.id}
                        className={`p-3 rounded-lg border transition-all ${
                          isMe
                            ? 'border-brand-gold/50 bg-brand-gold/10'
                            : 'border-slate-700 bg-slate-800/30'
                        }`}
                      >
                        <div className="flex items-center gap-2 justify-between">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            {team && (
                              <img
                                src={team.logo}
                                alt={team.id}
                                className="w-6 h-6 object-contain flex-shrink-0"
                              />
                            )}
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-bold text-white truncate">
                                {player.name}
                                {isMe && <span className="text-[10px] text-brand-gold ml-1">(You)</span>}
                              </p>
                              {team && (
                                <p className="text-[10px] text-slate-400 truncate">{team.id}</p>
                              )}
                            </div>
                          </div>

                          {/* Ready Status */}
                          <div className="flex-shrink-0">
                            {isReady ? (
                              <div className="px-2 py-1 rounded bg-green-500/20 text-green-400 text-[10px] font-bold whitespace-nowrap">
                                ✓ Ready
                              </div>
                            ) : (
                              <div className="px-2 py-1 rounded bg-slate-700/30 text-slate-400 text-[10px] whitespace-nowrap">
                                Waiting
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Ready Button */}
            {currentPlayerTeamId && (
              <button
                onClick={handleToggleReady}
                className={`w-full py-3 rounded-xl font-bold text-sm transition-all transform hover:scale-105 ${
                  isCurrentPlayerReady
                    ? 'bg-green-500/20 border-2 border-green-500 text-green-400 hover:bg-green-500/30'
                    : 'bg-slate-700/50 border-2 border-slate-600 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {isCurrentPlayerReady ? '✓ Ready' : 'Mark Ready'}
              </button>
            )}

            {/* Start Auction Button */}
            <button
              onClick={handleStartAuction}
              disabled={!canStartAuction() || loadingStart}
              className={`w-full py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                canStartAuction()
                  ? 'bg-gradient-to-r from-purple-600 to-brand-gold hover:shadow-lg hover:shadow-purple-500/50 text-white transform hover:scale-105'
                  : 'bg-slate-700/30 text-slate-500 cursor-not-allowed opacity-50'
              }`}
            >
              {loadingStart ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Starting...
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5" />
                  Start Auction
                </>
              )}
            </button>

            {/* Requirement Info */}
            {!canStartAuction() && (
              <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700">
                <p className="text-[11px] text-slate-400">
                  {!currentPlayerTeamId && 'Select a team to proceed'}
                  {currentPlayerTeamId && !isCurrentPlayerReady && 'Mark yourself as ready'}
                  {currentPlayerTeamId && isCurrentPlayerReady && teamsInLobby.length < 2 && 'Waiting for other players'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuctionLobby;

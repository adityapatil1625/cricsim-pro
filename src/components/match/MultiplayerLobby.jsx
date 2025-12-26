// src/components/match/MultiplayerLobby.jsx
import React, { useState } from 'react';
import { Copy, Users, Play, SkipBack } from '../shared/Icons';

export default function MultiplayerLobby({
  onlineRoom,
  isHost,
  playerSide,
  playerName,
  onStartMatch,
  onBack,
  isLoading,
  error,
}) {
  const [copied, setCopied] = useState(false);

  if (!onlineRoom) {
    return <div className="text-white p-4">Loading lobby...</div>;
  }

  const copyRoomCode = () => {
    navigator.clipboard.writeText(onlineRoom.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const playersReady = onlineRoom.players?.filter((p) => p.isReady).length || 0;
  const totalPlayers = onlineRoom.players?.length || 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 p-4">
      {/* Header */}
      <div className="max-w-2xl mx-auto mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-blue-400 hover:text-blue-300 mb-4"
        >
          <SkipBack size={20} />
          Back to Menu
        </button>

        <div className="bg-gray-800 border border-blue-500 rounded-lg p-6">
          <h1 className="text-3xl font-bold text-white mb-2">
            {onlineRoom.mode.toUpperCase()} Room
          </h1>

          {/* Room Code */}
          <div className="mb-6">
            <p className="text-gray-400 text-sm mb-2">Room Code</p>
            <div className="flex items-center gap-2">
              <code className="text-2xl font-mono font-bold text-green-400">
                {onlineRoom.code}
              </code>
              <button
                onClick={copyRoomCode}
                className="p-2 hover:bg-gray-700 rounded transition"
                title="Copy room code"
              >
                <Copy size={20} className={copied ? 'text-green-400' : 'text-gray-400'} />
              </button>
            </div>
            {copied && <p className="text-green-400 text-sm mt-1">Copied to clipboard!</p>}
          </div>

          {/* Host Badge */}
          {isHost && (
            <div className="inline-block bg-blue-600 text-white px-3 py-1 rounded text-sm mb-4">
              👑 You are the Host
            </div>
          )}
          <div className="inline-block bg-gray-700 text-gray-300 px-3 py-1 rounded text-sm mb-4 ml-2">
            You are on Team {playerSide}
          </div>
        </div>
      </div>

      {/* Players in Room */}
      <div className="max-w-2xl mx-auto mb-6">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Users size={24} />
          Players in Room ({totalPlayers})
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {onlineRoom.players?.map((player) => (
            <div
              key={player.socketId}
              className={`p-4 rounded-lg border-2 transition ${
                player.isReady
                  ? 'border-green-500 bg-green-900/20'
                  : 'border-gray-600 bg-gray-800/50'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-semibold">{player.name}</p>
                  <p className="text-gray-400 text-sm">Team {player.side}</p>
                  {player.teamPlayers && (
                    <p className="text-gray-400 text-sm">
                      {player.teamPlayers.length} players selected
                    </p>
                  )}
                </div>
                <div className="text-right">
                  {player.isReady ? (
                    <div className="bg-green-600 text-white px-3 py-1 rounded text-sm">
                      ✓ Ready
                    </div>
                  ) : (
                    <div className="bg-gray-600 text-gray-300 px-3 py-1 rounded text-sm">
                      Waiting...
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Status */}
      <div className="max-w-2xl mx-auto mb-6">
        {error && (
          <div className="bg-red-900/50 border border-red-500 text-red-200 p-4 rounded mb-4">
            {error}
          </div>
        )}

        {playersReady === totalPlayers && totalPlayers > 1 ? (
          <div className="bg-green-900/50 border border-green-500 text-green-200 p-4 rounded mb-4">
            All players ready! Match can start.
          </div>
        ) : (
          <div className="bg-yellow-900/50 border border-yellow-500 text-yellow-200 p-4 rounded mb-4">
            Waiting for all players to select their teams... ({playersReady}/{totalPlayers})
          </div>
        )}
      </div>

      {/* Start Match Button */}
      {isHost && (
        <div className="max-w-2xl mx-auto">
          <button
            onClick={onStartMatch}
            disabled={
              playersReady !== totalPlayers ||
              totalPlayers < 2 ||
              isLoading
            }
            className={`w-full py-3 rounded-lg font-bold text-lg flex items-center justify-center gap-2 transition ${
              playersReady === totalPlayers && totalPlayers > 1
                ? 'bg-green-600 hover:bg-green-700 text-white cursor-pointer'
                : 'bg-gray-600 text-gray-400 cursor-not-allowed opacity-50'
            }`}
          >
            <Play size={24} />
            {isLoading ? 'Starting...' : 'Start Match'}
          </button>
        </div>
      )}

      {!isHost && (
        <div className="max-w-2xl mx-auto text-center text-gray-400">
          <p>Waiting for host to start the match...</p>
        </div>
      )}
    </div>
  );
}

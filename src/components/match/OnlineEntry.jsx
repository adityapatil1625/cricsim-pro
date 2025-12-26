// src/components/match/OnlineEntry.jsx
import React, { useState } from 'react';
import { Play, LogIn, Users } from '../shared/Icons';

export default function OnlineEntry({
  onCreateRoom,
  onJoinRoom,
  onBack,
  isLoading,
  error,
}) {
  const [mode, setMode] = useState('create');
  const [playerName, setPlayerName] = useState('');
  const [roomCode, setRoomCode] = useState('');

  const handleCreateRoom = (gameMode) => {
    if (!playerName.trim()) {
      alert('Please enter your name');
      return;
    }
    onCreateRoom(gameMode, playerName);
  };

  const handleJoinRoom = () => {
    if (!playerName.trim()) {
      alert('Please enter your name');
      return;
    }
    if (!roomCode.trim()) {
      alert('Please enter the room code');
      return;
    }
    onJoinRoom(roomCode, playerName);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 p-4">
      {/* Back Button */}
      <div className="max-w-md mx-auto mb-6">
        <button
          onClick={onBack}
          className="text-blue-400 hover:text-blue-300 mb-4"
        >
          ← Back to Menu
        </button>
      </div>

      {/* Main Container */}
      <div className="max-w-md mx-auto">
        {/* Error Message */}
        {error && (
          <div className="bg-red-900/50 border border-red-500 text-red-200 p-4 rounded mb-6">
            {error}
          </div>
        )}

        {/* Mode Selection */}
        <div className="mb-8 flex gap-4">
          <button
            onClick={() => setMode('create')}
            className={`flex-1 py-3 rounded-lg font-bold transition ${
              mode === 'create'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Create Room
          </button>
          <button
            onClick={() => setMode('join')}
            className={`flex-1 py-3 rounded-lg font-bold transition ${
              mode === 'join'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Join Room
          </button>
        </div>

        {/* Player Name Input */}
        <div className="mb-6">
          <label className="block text-white text-sm font-semibold mb-2">
            Your Name
          </label>
          <input
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="Enter your player name"
            maxLength="20"
            className="w-full px-4 py-3 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                if (mode === 'create') {
                  handleCreateRoom('1v1');
                } else {
                  handleJoinRoom();
                }
              }
            }}
          />
        </div>

        {/* Create Room Mode */}
        {mode === 'create' && (
          <div className="space-y-4">
            <h2 className="text-white font-bold text-lg mb-4">Select Game Mode</h2>

            <button
              onClick={() => handleCreateRoom('1v1')}
              disabled={isLoading || !playerName.trim()}
              className="w-full p-4 rounded-lg bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-bold transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-center justify-between">
                <span>1v1 Match</span>
                <Play size={20} />
              </div>
              <p className="text-sm opacity-90 mt-1">One-on-one cricket match</p>
            </button>

            <button
              onClick={() => handleCreateRoom('tournament')}
              disabled={isLoading || !playerName.trim()}
              className="w-full p-4 rounded-lg bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-bold transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-center justify-between">
                <span>Tournament</span>
                <Users size={20} />
              </div>
              <p className="text-sm opacity-90 mt-1">Multi-team tournament</p>
            </button>

            <button
              onClick={() => handleCreateRoom('auction')}
              disabled={isLoading || !playerName.trim()}
              className="w-full p-4 rounded-lg bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white font-bold transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-center justify-between">
                <span>Auction</span>
                <Users size={20} />
              </div>
              <p className="text-sm opacity-90 mt-1">Player auction draft</p>
            </button>
          </div>
        )}

        {/* Join Room Mode */}
        {mode === 'join' && (
          <div className="space-y-4">
            <div>
              <label className="block text-white text-sm font-semibold mb-2">
                Room Code
              </label>
              <input
                type="text"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                placeholder="e.g., ABC12"
                maxLength="5"
                className="w-full px-4 py-3 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-lg text-center"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleJoinRoom();
                  }
                }}
              />
              <p className="text-gray-400 text-sm mt-2">
                Ask the host for the 5-character room code
              </p>
            </div>

            <button
              onClick={handleJoinRoom}
              disabled={isLoading || !playerName.trim() || !roomCode.trim()}
              className="w-full p-4 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <LogIn size={20} />
              {isLoading ? 'Joining...' : 'Join Room'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

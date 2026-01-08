/**
 * RoomsList.jsx
 * Display available rooms that can be joined
 * 
 * Props:
 * - rooms: Array of available room objects
 * - gameType: Filter rooms by type (1v1, tournament, auction)
 * - onRoomSelect: Callback function when room is selected to join
 * - isLoading: Boolean indicating if rooms are being fetched
 */

import React from 'react';

const RoomsList = ({ rooms, gameType, onRoomSelect, isLoading }) => {
  const filteredRooms = rooms.filter(room => {
    if (gameType === "1v1") return room.mode === "1v1";
    if (gameType === "tournament") return room.mode === "tournament";
    if (gameType === "auction") return room.mode === "auction";
    return true;
  });

  const getModeDisplay = (mode) => {
    if (mode === "1v1") return "1v1 Quick Match";
    if (mode === "tournament") return "🏆 Tournament";
    if (mode === "auction") return "🔨 Auction";
    return mode;
  };

  if (isLoading) {
    return (
      <div className="w-full max-w-2xl">
        <div className="glass-panel rounded-3xl p-6 bg-slate-950/80">
          <h3 className="text-lg font-bold text-white mb-4">Available Rooms</h3>
          <div className="flex items-center justify-center py-8">
            <div className="text-slate-400 text-sm">Loading available rooms...</div>
          </div>
        </div>
      </div>
    );
  }

  if (filteredRooms.length === 0) {
    return (
      <div className="w-full max-w-2xl">
        <div className="glass-panel rounded-3xl p-6 bg-slate-950/80">
          <h3 className="text-lg font-bold text-white mb-4">Available Rooms</h3>
          <div className="flex items-center justify-center py-8">
            <div className="text-slate-400 text-sm">No available rooms. Create one to get started!</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl">
      <div className="glass-panel rounded-3xl p-6 bg-slate-950/80">
        <h3 className="text-lg font-bold text-white mb-4">
          Available Rooms ({filteredRooms.length})
        </h3>
        
        <div className="space-y-3 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
          {filteredRooms.map((room) => (
            <div
              key={room.code}
              className="flex items-center justify-between p-4 bg-gradient-to-r from-slate-800 to-slate-900 rounded-xl border border-slate-700 hover:border-brand-gold/50 transition-all"
            >
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className="text-sm font-bold text-brand-gold tracking-wider">
                    {room.code}
                  </div>
                  <div className="text-xs text-slate-400">
                    {getModeDisplay(room.mode)}
                  </div>
                </div>
                <div className="text-xs text-slate-300">
                  Hosted by <span className="font-semibold">{room.hostName}</span>
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  {room.playerCount} / {room.maxPlayers} players
                </div>
              </div>

              <button
                onClick={() => onRoomSelect(room.code)}
                className="ml-4 px-6 py-2 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white rounded-lg text-sm font-bold uppercase tracking-wider transition-all"
              >
                Join
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RoomsList;

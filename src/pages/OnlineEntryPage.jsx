/**
 * OnlineEntryPage.jsx
 * Online game entry page - room creation and joining
 * 
 * Props:
 * - onlineName: Current player name
 * - setOnlineName: Setter for player name
 * - joinCode: Room code to join
 * - setJoinCode: Setter for room code
 * - joinError: Error message from room join
 * - setJoinError: Setter for join error
 * - onlineGameType: Current game type (quick, tournament, auction)
 * - setView: Function to change current view
 * - socket: Socket.IO instance
 * - availableRooms: Array of available rooms
 * - setAvailableRooms: Setter for available rooms
 * - loadingRooms: Boolean for loading state
 * - setLoadingRooms: Setter for loading state
 * - ChevronLeft: Icon component
 */

import React, { useEffect } from 'react';
import { ChevronLeft } from '../components/shared/Icons';
import RoomsList from '../components/shared/RoomsList';
import { capitalizeFirstLetter } from '../utils/appUtils';

const OnlineEntryPage = ({
  onlineName,
  setOnlineName,
  joinCode,
  setJoinCode,
  joinError,
  setJoinError,
  onlineGameType,
  setView,
  socket,
  availableRooms,
  setAvailableRooms,
  loadingRooms,
  setLoadingRooms,
}) => {
  // Fetch available rooms when component mounts or game type changes
  useEffect(() => {
    const fetchRooms = () => {
      if (!socket) return;
      
      setLoadingRooms(true);
      
      const modeMap = {
        "quick": "1v1",
        "tournament": "tournament",
        "auction": "auction"
      };
      
      const mode = modeMap[onlineGameType] || null;
      
      socket.emit("getRooms", { mode }, (response) => {
        setLoadingRooms(false);
        if (response.success) {
          setAvailableRooms(response.rooms || []);
        }
      });
    };

    fetchRooms();

    // Refresh rooms every 5 seconds
    const interval = setInterval(fetchRooms, 5000);
    return () => clearInterval(interval);
  }, [socket, onlineGameType, setAvailableRooms, setLoadingRooms]);

  const handleJoinRoomFromList = (roomCode) => {
    if (!onlineName.trim()) {
      alert("Please enter your name first.");
      return;
    }

    setJoinCode(roomCode);
    
    socket.emit("joinRoom", {
      code: roomCode.trim(),
      name: onlineName.trim(),
    });

    setView("online_menu");
  };
  return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 p-4 md:p-6 lg:p-8 relative">
        <div className="w-full max-w-5xl px-2 md:px-0">
          
          {/* Header and Name Section */}
          <div className="mb-6 text-center">
            <h2 className="font-broadcast text-3xl md:text-5xl text-white mb-4">
              Play with Friends
            </h2>

            <p className="text-xs text-slate-400 mb-6 uppercase tracking-widest">
              {onlineGameType === "tournament"
                  ? "🏆 Tournament Mode"
                  : onlineGameType === "auction"
                  ? "🔨 Auction Mode"
                  : "⚡ 1v1 Quick Match"}
            </p>

            {/* Name Input - Page Level */}
            <div className="w-full max-w-md mx-auto mb-8">
              <input
                  value={onlineName}
                  onChange={(e) => setOnlineName(capitalizeFirstLetter(e.target.value))}
                  className="w-full bg-slate-900 border-2 border-slate-700 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-brand-gold placeholder-slate-500 text-center"
                  placeholder="Enter your name to continue..."
              />
              <p className="text-xs text-slate-500 mt-2">Your name will be displayed to other players</p>
            </div>
          </div>

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Left side - Create/Join with Code */}
            <div className="glass-panel rounded-3xl p-8 bg-slate-950/80 h-fit">
              <h3 className="text-xl font-bold text-white mb-4">Create or Join</h3>

              {/* Join with Code */}
              <div className="mb-6">
                <label className="block text-xs text-slate-400 mb-2 uppercase tracking-wider">
                  Join with Room Code
                </label>
                <input
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white tracking-[0.3em] text-center focus:outline-none focus:border-sky-500"
                    placeholder="CODE"
                />
                {joinError && (
                    <p className="mt-1 text-[11px] text-red-400">{joinError}</p>
                )}
              </div>

              {/* Buttons */}
              <div className="space-y-3">
                {/* Host Room */}
                <button
                    onClick={() => {
                      if (!onlineName.trim()) {
                        alert("Please enter your name first.");
                        return;
                      }

                      // Create room on server
                      socket.emit("createRoom", {
                        name: onlineName.trim(),
                        mode: onlineGameType === "quick" ? "1v1" : onlineGameType,
                      });
                      setView("online_menu");
                    }}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg py-2 text-sm font-bold uppercase tracking-widest transition-colors"
                >
                  🎮 Host Room
                </button>

                {/* Join Room with Code */}
                <button
                    onClick={() => {
                      if (!onlineName.trim()) {
                        alert("Please enter your name first.");
                        return;
                      }
                      if (!joinCode.trim()) {
                        alert("Enter a room code to join.");
                        return;
                      }

                      socket.emit("joinRoom", {
                        code: joinCode.trim(),
                        name: onlineName.trim(),
                      });

                      setView("online_menu");
                    }}
                    className="w-full bg-slate-700 hover:bg-slate-600 text-slate-100 rounded-lg py-2 text-sm font-bold uppercase tracking-widest border border-slate-600 transition-colors"
                >
                  ✏️ Join with Code
                </button>
              </div>
            </div>

            {/* Right side - Available Rooms List */}
            <div>
              <RoomsList 
                rooms={availableRooms} 
                gameType={onlineGameType}
                onRoomSelect={handleJoinRoomFromList}
                isLoading={loadingRooms}
              />
            </div>
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
              onClick={() => setView("tourn_setup")}
              className="px-6 py-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs uppercase tracking-wider transition-colors"
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

export default OnlineEntryPage;

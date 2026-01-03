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
 * - ChevronLeft: Icon component
 */

import React from 'react';
import { ChevronLeft } from '../components/shared/Icons';
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
}) => {
  return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 p-4 relative">
        <button
          onClick={() => setView("menu")}
          className="absolute top-6 left-6 px-4 py-2 rounded-full border border-slate-700 text-slate-400 hover:text-white hover:border-white hover:bg-white/5 transition-all font-bold text-xs uppercase tracking-widest flex items-center gap-2"
        >
          <ChevronLeft size={16} /> Back to Menu
        </button>
        <div className="glass-panel rounded-3xl p-8 w-full max-w-md bg-slate-950/80">
          <h2 className="font-broadcast text-4xl text-white mb-2">
            Play with Friends
          </h2>

          <p className="text-xs text-slate-400 mb-4 uppercase tracking-widest">
            {onlineGameType === "tournament"
                ? "Tournament Mode"
                : onlineGameType === "auction"
                ? "Auction Mode"
                : "1v1 Quick Match"}
          </p>

          {/* Name */}
          <div className="mb-4">
            <label className="block text-xs text-slate-400 mb-1">
              Your Name
            </label>
            <input
                value={onlineName}
                onChange={(e) => setOnlineName(capitalizeFirstLetter(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-gold"
                placeholder="Enter your name"
            />
          </div>

          {/* Join existing room */}
          <div className="mb-6">
            <label className="block text-xs text-slate-400 mb-1">
              Join Room (optional)
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
                  // We rely on roomUpdate to actually move us into the room,
                  // but as a fallback we can optimistically go there:
                  setView("online_menu");
                }}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg py-2 text-sm font-bold uppercase tracking-widest"
            >
              Host Room
            </button>

            {/* Join Room */}
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

                  // temporary view change; roomUpdate will also set view
                  setView("online_menu");
                }}
                className="w-full bg-slate-800 hover:bg-slate-700 text-slate-100 rounded-lg py-2 text-sm font-bold uppercase tracking-widest border border-slate-600"
            >
              Join Room
            </button>

            <button
                onClick={() => setView("menu")}
                className="w-full text-xs text-slate-500 hover:text-slate-300 mt-2"
            >
              ← Back to Menu
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

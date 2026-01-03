import React from "react";
import { Zap, Trophy } from "../components/shared/Icons";

const MenuPage = ({ setActiveTeamSelect, setView, setOnlineGameType, setOnlineRoom, setJoinCode, setJoinError }) => {
  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col items-center justify-center bg-slate-950">
      {/* Background gradients */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-emerald-900/20 via-slate-950 to-slate-950" />
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-brand-gold/10 rounded-full blur-[128px]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-green-900/5 rounded-full blur-[100px]" />

      <div className="relative z-10 w-full flex flex-col items-center justify-center px-6 py-12">
        {/* Header Section - Reduced Size */}
        <div className="text-center space-y-3 mb-12">
          <div className="flex justify-center mb-2">
            <img src="/cricsim_logo.png" alt="CricSim Pro Logo" className="h-24 w-24 object-contain" />
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-gold/10 border border-brand-gold/20 text-brand-gold text-xs font-bold tracking-widest uppercase">
            <span className="w-2 h-2 rounded-full bg-brand-gold animate-pulse" />
            Elite Edition
          </div>
          <h1 className="font-broadcast text-6xl md:text-7xl leading-tight text-transparent bg-clip-text bg-gradient-to-br from-white via-slate-200 to-slate-500 drop-shadow-2xl">
            CRICSIM <br />
            <span className="text-brand-gold">PRO</span>
          </h1>
          <p className="text-slate-400 text-base font-light max-w-lg mx-auto leading-relaxed border-l-2 border-brand-gold/30 pl-4">
            Draft world-class talent, manage intricate stats, and simulate elite T20 clashes.
          </p>
        </div>

        {/* Game Mode Cards - Better Layout */}
        <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Quick Play Card */}
          <button
            onClick={() => {
              setActiveTeamSelect("A");
              setView("quick_setup");
            }}
            className="group relative h-64 rounded-2xl p-6 text-left overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-blue-900/50 border border-slate-700/50 hover:border-blue-500/50"
            style={{
              background: "linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.95) 100%)",
              backdropFilter: "blur(10px)"
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-transparent z-0" />
            <div className="absolute top-0 right-0 p-24 bg-blue-500/10 rounded-full blur-2xl -mr-12 -mt-12 group-hover:bg-blue-500/20 transition-colors" />
            
            <div className="relative z-10 h-full flex flex-col justify-between">
              <div className="w-12 h-12 rounded-xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center group-hover:scale-110 group-hover:bg-blue-500/30 transition-all duration-300">
                <Zap className="w-6 h-6 text-blue-400" />
              </div>
              <div className="space-y-2">
                <h3 className="font-broadcast text-3xl text-white group-hover:text-blue-400 transition-colors duration-300">
                  Quick Play
                </h3>
                <p className="text-slate-400 text-xs leading-relaxed">
                  Instant 1v1 exhibition matches
                </p>
              </div>
              <div className="flex items-center gap-1 text-blue-400 text-xs font-bold tracking-widest uppercase opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                → Enter Arena
              </div>
            </div>
          </button>

          {/* Tournament Card */}
          <button
            onClick={() => setView("tourn_setup")}
            className="group relative h-64 rounded-2xl p-6 text-left overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-yellow-900/50 border border-slate-700/50 hover:border-brand-gold/50"
            style={{
              background: "linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.95) 100%)",
              backdropFilter: "blur(10px)"
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-b from-brand-gold/5 to-transparent z-0" />
            <div className="absolute top-0 right-0 p-24 bg-brand-gold/10 rounded-full blur-2xl -mr-12 -mt-12 group-hover:bg-brand-gold/20 transition-colors" />
            
            <div className="relative z-10 h-full flex flex-col justify-between">
              <div className="w-12 h-12 rounded-xl bg-brand-gold/20 border border-brand-gold/40 flex items-center justify-center group-hover:scale-110 group-hover:bg-brand-gold/30 transition-all duration-300">
                <Trophy className="w-6 h-6 text-brand-gold" />
              </div>
              <div className="space-y-2">
                <h3 className="font-broadcast text-3xl text-white group-hover:text-brand-gold transition-colors duration-300">
                  Tournament
                </h3>
                <p className="text-slate-400 text-xs leading-relaxed">
                  League creation & drafting
                </p>
              </div>
              <div className="flex items-center gap-1 text-brand-gold text-xs font-bold tracking-widest uppercase opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                → Build Legacy
              </div>
            </div>
          </button>

          {/* Online Card */}
          <button
            onClick={() => {
              setOnlineGameType("quick");
              setOnlineRoom(null);
              setJoinCode("");
              setJoinError("");
              setView("online_entry");
            }}
            className="group relative h-64 rounded-2xl p-6 text-left overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-sky-900/50 border border-slate-700/50 hover:border-sky-500/50"
            style={{
              background: "linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.95) 100%)",
              backdropFilter: "blur(10px)"
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-b from-sky-500/5 to-transparent z-0" />
            <div className="absolute top-0 right-0 p-24 bg-sky-500/10 rounded-full blur-2xl -mr-12 -mt-12 group-hover:bg-sky-500/20 transition-colors" />
            
            <div className="relative z-10 h-full flex flex-col justify-between">
              <div className="w-12 h-12 rounded-xl bg-sky-500/20 border border-sky-500/40 flex items-center justify-center group-hover:scale-110 group-hover:bg-sky-500/30 transition-all duration-300">
                <span className="text-2xl">🌐</span>
              </div>
              <div className="space-y-2">
                <h3 className="font-broadcast text-3xl text-white group-hover:text-sky-400 transition-colors duration-300">
                  Online
                </h3>
                <p className="text-slate-400 text-xs leading-relaxed">
                  Play with friends online
                </p>
              </div>
              <div className="flex items-center gap-1 text-sky-400 text-xs font-bold tracking-widest uppercase opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                → Connect Now
              </div>
            </div>
          </button>

          {/* Auction Card */}
          <button
            onClick={() => {
              setOnlineGameType("auction");
              setOnlineRoom(null);
              setJoinCode("");
              setJoinError("");
              setView("online_entry");
            }}
            className="group relative h-64 rounded-2xl p-6 text-left overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-purple-900/50 border border-slate-700/50 hover:border-purple-500/50"
            style={{
              background: "linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.95) 100%)",
              backdropFilter: "blur(10px)"
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-b from-purple-500/5 to-transparent z-0" />
            <div className="absolute top-0 right-0 p-24 bg-purple-500/10 rounded-full blur-2xl -mr-12 -mt-12 group-hover:bg-purple-500/20 transition-colors" />
            
            <div className="relative z-10 h-full flex flex-col justify-between">
              <div className="w-12 h-12 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center group-hover:scale-110 group-hover:bg-purple-500/30 transition-all duration-300">
                <span className="text-2xl">🔨</span>
              </div>
              <div className="space-y-2">
                <h3 className="font-broadcast text-3xl text-white group-hover:text-purple-400 transition-colors duration-300">
                  Auction
                </h3>
                <p className="text-slate-400 text-xs leading-relaxed">
                  IPL-style mega auction
                </p>
              </div>
              <div className="flex items-center gap-1 text-purple-400 text-xs font-bold tracking-widest uppercase opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                → Build Squad
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default MenuPage;

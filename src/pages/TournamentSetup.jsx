import React from "react";
import { ChevronLeft } from "../components/shared/Icons";

const TournamentSetup = ({
                             tournTeams,
                             newTeamName,
                             setNewTeamName,
                             onAddTeam,
                             onBack,
                             onEnterDraft,
                         }) => {
    return (
        <div className="min-h-screen p-8 flex flex-col items-center justify-center relative overflow-hidden bg-slate-950">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/10 via-slate-950 to-slate-950"></div>
            <div className="relative z-10 w-full max-w-3xl">
                <h2 className="font-broadcast text-7xl text-center text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-400 drop-shadow-xl mb-8">
                    League Setup
                </h2>
                <div className="glass-panel p-1 rounded-3xl">
                    <div className="bg-slate-950/50 rounded-[20px] p-8 backdrop-blur-md">
                        <div className="flex gap-3 mb-8">
                            <input
                                value={newTeamName}
                                onChange={(e) => setNewTeamName(e.target.value)}
                                className="flex-1 bg-slate-900/80 border border-slate-700 rounded-xl p-4 text-white text-lg placeholder-slate-500 focus:outline-none focus:border-brand-gold transition-all font-broadcast tracking-wide"
                                placeholder="ENTER TEAM NAME"
                            />
                            <button
                                onClick={onAddTeam}
                                className="bg-gradient-to-b from-brand-gold to-yellow-600 text-black font-broadcast text-xl tracking-wider px-8 rounded-xl hover:brightness-110 transition-all"
                            >
                                ADD TEAM
                            </button>
                        </div>
                        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                            {tournTeams.map((t, i) => (
                                <div
                                    key={t.id}
                                    className="bg-slate-900/60 p-4 rounded-xl flex justify-between items-center border border-white/5"
                                >
                                    <div className="flex items-center gap-4">
                    <span className="text-slate-600 font-broadcast text-2xl w-8">
                      {(i + 1).toString().padStart(2, "0")}
                    </span>
                                        <span className="font-bold text-xl text-slate-200">
                      {t.name}
                    </span>
                                    </div>
                                    <span className="text-xs font-bold bg-slate-800 text-slate-400 px-3 py-1 rounded-full border border-slate-700">
                    {t.players.length} / 11
                  </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="flex justify-between mt-8 items-center">
                    <button
                        onClick={onBack}
                        className="text-slate-400 hover:text-white px-6 py-2 transition-colors uppercase tracking-widest text-xs font-bold flex items-center gap-2"
                    >
                        <ChevronLeft size={16} /> Back to Menu
                    </button>
                    <button
                        disabled={tournTeams.length < 3}
                        onClick={onEnterDraft}
                        className={`px-12 py-4 rounded-full font-broadcast text-2xl tracking-wide transition-all shadow-2xl ${
                            tournTeams.length < 3
                                ? "bg-slate-800 text-slate-600 cursor-not-allowed"
                                : "bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:scale-105"
                        }`}
                    >
                        ENTER DRAFT
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TournamentSetup;

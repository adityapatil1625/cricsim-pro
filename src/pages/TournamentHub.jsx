import React from "react";
import { Activity, Play } from "../components/shared/Icons";

const TournamentHub = ({ tournTeams, fixtures, onEndSeason, onPlayFixture }) => {
    return (
        <div className="min-h-screen p-8 bg-slate-950 relative">
            <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-brand-gold/5 to-transparent pointer-events-none"></div>
            <div className="max-w-7xl mx-auto relative z-10">
                <header className="flex justify-between items-end mb-12 border-b border-white/10 pb-8">
                    <div>
                        <h1 className="font-broadcast text-8xl text-transparent bg-clip-text bg-gradient-to-br from-brand-gold to-white drop-shadow-lg">
                            LEAGUE HUB
                        </h1>
                        <div className="flex gap-4 text-sm uppercase tracking-widest text-slate-400 font-bold mt-2">
                            <span>Season 1</span>
                            <span className="text-brand-gold">•</span>
                            <span>{tournTeams.length} Teams</span>
                        </div>
                    </div>
                    <button
                        onClick={onEndSeason}
                        className="text-slate-500 hover:text-red-400 font-bold text-xs uppercase tracking-widest border border-slate-800 hover:border-red-900 px-6 py-3 rounded-full transition-colors"
                    >
                        End Season
                    </button>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    <div className="lg:col-span-7">
                        <div className="glass-panel rounded-3xl overflow-hidden">
                            <div className="bg-slate-900/50 p-6 border-b border-white/5 flex justify-between items-center">
                                <h3 className="font-broadcast text-3xl text-white">
                                    Points Table
                                </h3>
                                <Activity className="text-brand-gold opacity-50" />
                            </div>
                            <div className="p-2">
                                <table className="w-full text-left">
                                    <thead className="bg-white/5 text-xs uppercase tracking-widest text-slate-400 font-bold">
                                    <tr>
                                        <th className="py-4 pl-6 rounded-l-lg">Team</th>
                                        <th className="py-4 text-center">Played</th>
                                        <th className="py-4 text-center">Won</th>
                                        <th className="py-4 text-right pr-6 rounded-r-lg">
                                            Points
                                        </th>
                                    </tr>
                                    </thead>
                                    <tbody className="text-sm">
                                    {[...tournTeams]
                                        .sort((a, b) => b.pts - a.pts)
                                        .map((t, index) => (
                                            <tr
                                                key={t.id}
                                                className="border-b border-slate-800/50 hover:bg-white/5 transition-colors group"
                                            >
                                                <td className="py-5 pl-6">
                                                    <div className="flex items-center gap-4">
                              <span
                                  className={`font-broadcast text-xl w-6 ${
                                      index === 0
                                          ? "text-brand-gold"
                                          : "text-slate-600"
                                  }`}
                              >
                                {(index + 1).toString().padStart(2, "0")}
                              </span>
                                                        <span className="font-bold text-lg text-slate-200 group-hover:text-white transition-colors">
                                {t.name}
                              </span>
                                                    </div>
                                                </td>
                                                <td className="py-5 text-center text-slate-400 font-mono">
                                                    {t.played}
                                                </td>
                                                <td className="py-5 text-center text-green-400 font-bold font-mono">
                                                    {t.won}
                                                </td>
                                                <td className="py-5 text-right pr-6">
                            <span className="font-broadcast text-3xl text-brand-gold leading-none">
                              {t.pts}
                            </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-5">
                        <div className="glass-panel rounded-3xl overflow-hidden flex flex-col h-full">
                            <div className="bg-slate-900/50 p-6 border-b border-white/5 flex justify-between items-center">
                                <h3 className="font-broadcast text-3xl text-white">
                                    Match Schedule
                                </h3>
                                <div className="text-xs font-bold bg-slate-800 px-3 py-1 rounded-full text-slate-400">
                                    {fixtures.filter((f) => f.played).length} /{" "}
                                    {fixtures.length} Done
                                </div>
                            </div>
                            <div className="p-4 space-y-3 overflow-y-auto max-h-[600px] custom-scrollbar">
                                {fixtures.map((f) => {
                                    const t1 = tournTeams.find((t) => t.id === f.t1);
                                    const t2 = tournTeams.find((t) => t.id === f.t2);
                                    if (!t1 || !t2) return null;

                                    return (
                                        <div
                                            key={f.id}
                                            className={`group p-5 rounded-2xl border flex justify-between items-center transition-all ${
                                                f.played
                                                    ? "bg-slate-900/30 border-transparent grayscale opacity-50"
                                                    : "bg-gradient-to-r from-slate-800 to-slate-900 border-slate-700 hover:border-brand-gold/30 shadow-lg"
                                            }`}
                                        >
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-1 h-8 bg-blue-500 rounded-full"></div>
                                                    <span className="font-broadcast text-xl tracking-wide text-slate-200">
                            {t1.name}
                          </span>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <div className="w-1 h-8 bg-red-500 rounded-full"></div>
                                                    <span className="font-broadcast text-xl tracking-wide text-slate-200">
                            {t2.name}
                          </span>
                                                </div>
                                            </div>

                                            {f.played ? (
                                                <div className="text-right">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-green-500">
                            Result
                          </span>
                                                    <div className="text-xs text-slate-500 font-bold mt-1">
                                                        MATCH DONE
                                                    </div>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => onPlayFixture(f)}
                                                    className="bg-white text-black hover:bg-brand-gold h-12 w-12 rounded-full flex items-center justify-center transition-all shadow-lg group-hover:scale-110"
                                                >
                                                    <Play size={20} />
                                                </button>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TournamentHub;

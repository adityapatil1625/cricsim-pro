import React from "react";
import { Shuffle } from "../components/shared/Icons";
import PlayerSearch from "../components/shared/PlayerSearch";
import TeamListItem from "../components/shared/TeamListItem";

const Draft = ({
                   isTourn,
                   tournTeams,
                   teamA,
                   teamB,
                   activeTeamSelect,
                   setActiveTeamSelect,
                   playerDatabase,
                   searchQuery,
                   setSearchQuery,
                   onAddToTeam,
                   fileInputRef,
                   onJsonImport,
                   onAutoDraftQuickPlay,
                   onCreateTournament,
                   onStartMatch,
                   onBack,
                   onRemoveFromTeam,
               }) => {
    const teams = isTourn
        ? tournTeams
        : [
            { id: "A", ...teamA },
            { id: "B", ...teamB },
        ];

    return (
        <div className="h-screen w-screen flex flex-col bg-slate-950 relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_var(--tw-gradient-stops))] from-blue-900/10 via-slate-950 to-slate-950 pointer-events-none"></div>

            <div className="relative z-10 w-full px-8 py-6 flex justify-between items-end border-b border-white/5 bg-slate-950/80 backdrop-blur-sm flex-shrink-0">
                <div>
                    <h1 className="text-6xl font-broadcast text-white leading-none drop-shadow-lg">
                        {isTourn ? "SEASON DRAFT" : "SQUAD SELECTION"}
                    </h1>
                    <p className="text-slate-400 uppercase tracking-widest text-sm ml-1">
                        Build your legacy
                    </p>
                </div>

                <div className="flex gap-4">
                    {!isTourn && (
                        <button
                            onClick={onAutoDraftQuickPlay}
                            className="px-6 py-3 rounded-full border border-brand-gold/50 text-brand-gold hover:bg-brand-gold/10 transition-all font-bold text-xs uppercase tracking-widest flex items-center gap-2"
                        >
                            <Shuffle size={16} /> Auto Pick 11
                        </button>
                    )}

                    <button
                        onClick={onBack}
                        className="px-6 py-3 rounded-full border border-slate-700 text-slate-400 hover:text-white hover:border-white hover:bg-white/5 transition-all font-bold text-xs uppercase tracking-widest"
                    >
                        Back to Menu
                    </button>

                    {isTourn ? (
                        <button
                            onClick={onCreateTournament}
                            className="bg-gradient-to-r from-brand-gold to-yellow-500 text-black px-10 py-3 rounded-full font-broadcast text-2xl hover:scale-105 transition-transform shadow-xl shadow-brand-gold/20"
                        >
                            START TOURNAMENT
                        </button>
                    ) : (
                        <button
                            onClick={() => onStartMatch("quick")}
                            className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-10 py-3 rounded-full font-broadcast text-2xl hover:scale-105 transition-transform shadow-xl shadow-green-900/20"
                        >
                            START MATCH
                        </button>
                    )}
                </div>
            </div>

            <div className="relative z-10 flex-1 flex p-6 gap-6 min-h-0 overflow-hidden">
                <PlayerSearch
                    playerDatabase={playerDatabase}
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    onAdd={onAddToTeam}
                    fileInputRef={fileInputRef}
                    onJsonImport={onJsonImport}
                />

                <div className="w-96 flex flex-col gap-4 h-full min-h-0">
                    <div className="glass-panel p-4 rounded-2xl flex-shrink-0 bg-slate-900/80">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                            Your Teams
                        </h3>
                        <p className="text-xs text-slate-500">
                            Click a team to select it for drafting.
                        </p>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-1 pb-4">
                        {teams.map((t) => (
                            <div
                                key={t.id}
                                onClick={() => setActiveTeamSelect(t.id)}
                                className={`group rounded-2xl cursor-pointer transition-all duration-300 flex-1 flex flex-col relative overflow-hidden border-2 ${
                                    activeTeamSelect === t.id
                                        ? "border-brand-gold bg-slate-900 shadow-[0_0_30px_rgba(251,191,36,0.15)] z-10"
                                        : "border-white/10 bg-slate-900/40 hover:bg-slate-900/60 hover:border-white/20"
                                }`}
                            >
                                <div className="h-full flex flex-col p-5 relative z-10">
                                    <div className="flex justify-between items-center mb-4 border-b border-white/5 pb-3">
                    <span
                        className={`font-broadcast text-3xl truncate ${
                            activeTeamSelect === t.id
                                ? "text-brand-gold"
                                : "text-white"
                        }`}
                    >
                      {t.name}
                    </span>
                                        <div
                                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                                                (t.players || []).length >= 11
                                                    ? "bg-green-900 text-green-400"
                                                    : "bg-slate-800 text-slate-400"
                                            }`}
                                        >
                                            {(t.players || []).length} / 11
                                        </div>
                                    </div>

                                    <div className="space-y-1 max-h-48 overflow-y-auto custom-scrollbar">
                                        {(t.players || []).map((p, i) => (
                                            <TeamListItem
                                                key={p.instanceId || `${p.id}-${i}`}
                                                player={p}
                                                onRemove={(e) => {
                                                    e.stopPropagation();
                                                    onRemoveFromTeam(t.id, i);
                                                }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Draft;

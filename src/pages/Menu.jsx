import React from "react";
import { Trophy, Zap, FastForward, Play } from "../components/shared/Icons";

const Menu = ({ onQuickPlay, onTournament }) => {
    return (
        <div className="min-h-screen relative overflow-hidden flex items-center justify-center bg-slate-950">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-emerald-900/20 via-slate-950 to-slate-950"></div>
            <div className="absolute -top-24 -left-24 w-96 h-96 bg-brand-gold/10 rounded-full blur-[128px]"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-green-900/5 rounded-full blur-[100px]"></div>

            <div className="relative z-10 w-full max-w-7xl p-8 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                <div className="lg:col-span-5 text-center lg:text-left space-y-6">
                    <div className="flex justify-center lg:justify-start mb-4">
                        <div className="h-32 w-32 bg-brand-gold rounded-lg flex items-center justify-center text-black font-bold text-2xl">LOGO</div>
                    </div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-gold/10 border border-brand-gold/20 text-brand-gold text-xs font-bold tracking-widest uppercase mb-2">
                        <span className="w-2 h-2 rounded-full bg-brand-gold animate-pulse"></span>
                        Elite Edition v2.0
                    </div>
                    <h1 className="font-broadcast text-8xl md:text-9xl leading-none text-transparent bg-clip-text bg-gradient-to-br from-white via-slate-200 to-slate-500 drop-shadow-2xl">
                        CRICSIM <br /> <span className="text-brand-gold">PRO</span>
                    </h1>
                    <p className="text-slate-400 text-lg font-light max-w-md mx-auto lg:mx-0 leading-relaxed border-l-2 border-brand-gold/30 pl-4">
                        The definitive T20 strategy engine. Draft world-class talent,
                        manage intricate stats, and simulate outcomes with precision.
                    </p>
                </div>

                <div className="lg:col-span-7 flex flex-col md:flex-row gap-6 w-full">
                    <button
                        onClick={onQuickPlay}
                        className="group relative flex-1 h-80 glass-card rounded-3xl p-8 text-left overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/60 z-0"></div>
                        <div className="absolute top-0 right-0 p-32 bg-blue-500/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-blue-500/20 transition-colors"></div>
                        <div className="relative z-10 h-full flex flex-col justify-between">
                            <div className="w-14 h-14 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                <Zap className="w-8 h-8 text-blue-400" />
                            </div>
                            <div>
                                <h3 className="font-broadcast text-4xl text-white mb-2 group-hover:text-blue-400 transition-colors">
                                    Quick Play
                                </h3>
                                <p className="text-slate-400 text-sm font-medium">
                                    Instant 1v1 Exhibition
                                </p>
                            </div>
                            <div className="flex items-center gap-2 text-blue-400 text-xs font-bold tracking-widest uppercase opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                                Enter Arena <FastForward size={12} />
                            </div>
                        </div>
                    </button>

                    <button
                        onClick={onTournament}
                        className="group relative flex-1 h-80 glass-card rounded-3xl p-8 text-left overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/60 z-0"></div>
                        <div className="absolute top-0 right-0 p-32 bg-brand-gold/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-brand-gold/20 transition-colors"></div>
                        <div className="relative z-10 h-full flex flex-col justify-between">
                            <div className="w-14 h-14 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                <Trophy className="w-8 h-8 text-brand-gold" />
                            </div>
                            <div>
                                <h3 className="font-broadcast text-4xl text-white mb-2 group-hover:text-brand-gold transition-colors">
                                    Tournament
                                </h3>
                                <p className="text-slate-400 text-sm font-medium">
                                    League Creation & Drafting
                                </p>
                            </div>
                            <div className="flex items-center gap-2 text-brand-gold text-xs font-bold tracking-widest uppercase opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                                Build Legacy <Play size={12} />
                            </div>
                        </div>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Menu;

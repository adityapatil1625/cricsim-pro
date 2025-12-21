import React from "react";
import { getInitials } from "../../data/cricketProcessing";

const StatsDashboard = ({
                            striker,
                            nonStriker,
                            sStats,
                            nsStats,
                            matchState,
                            allPlayers,
                        }) => {
    const players = Array.isArray(allPlayers) ? allPlayers : [];
    const batsmanStats = matchState?.batsmanStats || {};
    const bowlerStats = matchState?.bowlerStats || {};

    const safeS = sStats || { runs: 0, balls: 0 };
    const safeNS = nsStats || { runs: 0, balls: 0 };

    // Partnership
    const partnershipRuns = (safeS.runs || 0) + (safeNS.runs || 0);
    const partnershipBalls = (safeS.balls || 0) + (safeNS.balls || 0);
    const partnershipOvers = partnershipBalls / 6;
    const partnershipRR =
        partnershipOvers > 0
            ? (partnershipRuns / partnershipOvers).toFixed(2)
            : null;

    // CRR / projected score
    const totalOversBowled = (matchState?.ballsBowled || 0) / 6;
    const currentRR =
        totalOversBowled > 0
            ? (matchState.score || 0) / totalOversBowled
            : null;
    const projectedScore =
        currentRR != null
            ? Math.round(currentRR * (matchState?.totalOvers || 20))
            : null;

    // Impact player
    let mostImpactful = null;
    let bestImpactScore = -Infinity;

    players.forEach((p) => {
        if (!p || !p.instanceId) return;

        const bat = batsmanStats[p.instanceId] || {
            runs: 0,
            balls: 0,
            fours: 0,
            sixes: 0,
            out: false,
        };
        const bowl = bowlerStats[p.instanceId] || {
            wickets: 0,
            runs: 0,
            balls: 0,
        };

        const impactScore = (bat.runs || 0) + (bowl.wickets || 0) * 25;

        if (impactScore > bestImpactScore) {
            bestImpactScore = impactScore;
            mostImpactful = { player: p, bat, bowl, score: impactScore };
        }
    });

    const oversStr =
        Math.floor((matchState?.ballsBowled || 0) / 6) +
        "." +
        ((matchState?.ballsBowled || 0) % 6);

    const sRuns = safeS.runs || 0;
    const nsRuns = safeNS.runs || 0;
    const totalPartnership = sRuns + nsRuns;

    const sPercent =
        totalPartnership > 0 ? (sRuns / totalPartnership) * 100 : 0;
    const nsPercent =
        totalPartnership > 0 ? (nsRuns / totalPartnership) * 100 : 0;

    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-2">
            {/* Partnership card */}
            <div className="glass-card rounded-2xl p-4 border-l-4 border-emerald-500 flex flex-col gap-3">
                <div className="flex justify-between items-center">
                    <div>
                        <div className="text-[10px] uppercase tracking-widest text-emerald-400 font-bold mb-1">
                            Partnership
                        </div>
                        <div className="font-broadcast text-3xl text-white">
                            {partnershipRuns}
                            <span className="text-base text-slate-400">
                {" "}
                                ({partnershipBalls}b)
              </span>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-[10px] uppercase text-slate-400 font-bold mb-1">
                            Partn. RR
                        </div>
                        <div className="font-mono text-emerald-300 text-sm">
                            {partnershipRR ?? "--"}
                        </div>
                    </div>
                </div>

                <div className="mt-1">
                    {totalPartnership > 0 ? (
                        <>
                            {/* Bar between two batters */}
                            <div className="w-full h-4 rounded-full bg-slate-900 overflow-hidden border border-slate-700/80 flex">
                                <div
                                    className="h-full bg-gradient-to-r from-emerald-500 to-emerald-300 flex items-center justify-end pr-1 text-[10px] font-bold text-black/80"
                                    style={{ width: `${sPercent}%` }}
                                >
                                    {sPercent >= 10 && `${Math.round(sPercent)}%`}
                                </div>
                                <div
                                    className="h-full bg-gradient-to-r from-sky-500 to-sky-300 flex items-center justify-start pl-1 text-[10px] font-bold text-black/80"
                                    style={{ width: `${nsPercent}%` }}
                                >
                                    {nsPercent >= 10 && `${Math.round(nsPercent)}%`}
                                </div>
                            </div>

                            <div className="mt-2 flex justify-between text-[11px]">
                                <div className="flex items-center gap-2 max-w-[55%]">
                                    <div className="w-5 h-3 rounded-full bg-emerald-400" />
                                    <span className="truncate text-slate-200">
                    {striker?.name || "Striker"}{" "}
                                        <span className="font-mono text-emerald-300">
                      {sRuns}({safeS.balls || 0})
                    </span>
                  </span>
                                </div>
                                <div className="flex items-center gap-2 max-w-[45%] justify-end">
                                    <div className="w-5 h-3 rounded-full bg-sky-400" />
                                    <span className="truncate text-slate-200 text-right">
                    {nonStriker?.name || "Non-striker"}{" "}
                                        <span className="font-mono text-sky-300">
                      {nsRuns}({safeNS.balls || 0})
                    </span>
                  </span>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="w-full h-4 rounded-full bg-slate-900 border border-slate-700/80 flex items-center justify-center text-[11px] text-slate-500">
                            Partnership will appear here once they score.
                        </div>
                    )}
                </div>
            </div>

            {/* Current Run Rate */}
            <div className="glass-card rounded-2xl p-4 border-l-4 border-sky-500 flex flex-col justify-between">
                <div>
                    <div className="text-[10px] uppercase tracking-widest text-sky-400 font-bold mb-1">
                        Current Run Rate
                    </div>
                    <div className="font-broadcast text-3xl text-white">
                        {currentRR != null ? currentRR.toFixed(2) : "--"}
                    </div>
                </div>
                <div className="text-xs text-slate-400 mt-2">
                    Overs:{" "}
                    <span className="text-slate-100 font-mono">{oversStr}</span>
                    <div className="text-[11px] text-slate-500 mt-1">
                        Runs per over so far
                    </div>
                </div>
            </div>

            {/* Projected Score */}
            <div className="glass-card rounded-2xl p-4 border-l-4 border-yellow-400 flex flex-col justify-between">
                <div>
                    <div className="text-[10px] uppercase tracking-widest text-yellow-300 font-bold mb-1">
                        Projected Score
                    </div>
                    <div className="font-broadcast text-3xl text-yellow-300">
                        {projectedScore ?? "--"}
                    </div>
                </div>
                <div className="text-xs text-slate-400 mt-2">
                    Based on CRR over{" "}
                    <span className="font-mono">
            {totalOversBowled.toFixed(1)}
          </span>{" "}
                    overs
                    <div className="text-[11px] text-slate-500 mt-1">
                        Innings length: {matchState?.totalOvers || 20} overs
                    </div>
                </div>
            </div>

            {/* Impact Player */}
            <div className="glass-card rounded-2xl p-4 border-l-4 border-fuchsia-500 flex flex-col justify-between">
                <div className="text-[10px] uppercase tracking-widest text-fuchsia-300 font-bold mb-1">
                    Impact Player
                </div>
                {mostImpactful ? (
                    <>
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center font-bold text-xs text-fuchsia-300 border border-fuchsia-500/60">
                                {getInitials(mostImpactful.player.name)}
                            </div>
                            <div className="min-w-0">
                                <div className="font-broadcast text-lg text-white truncate">
                                    {mostImpactful.player.name}
                                </div>
                                <div className="text-[11px] text-slate-400">
                                    Impact score:{" "}
                                    <span className="font-mono text-fuchsia-300">
                    {mostImpactful.score}
                  </span>
                                </div>
                            </div>
                        </div>
                        <div className="mt-2 text-[11px] text-slate-500">
                            Bat: {mostImpactful.bat.runs}(
                            {mostImpactful.bat.balls}) · Wkts:{" "}
                            {mostImpactful.bowl.wickets}
                        </div>
                    </>
                ) : (
                    <div className="text-sm text-slate-500">
                        No impact data yet.
                    </div>
                )}
            </div>
        </div>
    );
};

export default StatsDashboard;


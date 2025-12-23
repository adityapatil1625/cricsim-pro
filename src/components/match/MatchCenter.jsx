import React, { useEffect, useRef } from "react";
import StatsDashboard from "./StatsDashboard";
import stadiumImg from "../../pictures/stadium.jpg";
import {
    Tv,
    FileText,
    Mic,
    SkipForward,
    FastForward,
    ChevronsRight,
} from "../shared/Icons";

const MatchCenter = ({
                         matchState,
                         bowlBall,
                         skipOver,
                         skipFiveOvers,
                         skipTenOvers,
                         skipInnings,
                         handleInningsBreak,
                         endMatch,
                         activeTab,
                         setActiveTab,
                         isOnline = false,
                         canControl = true,
                         isSpectator = false,
                         iplTeams = [],
                         getTeamDisplay,
                         onlineRoom = null,
                         tournPhase = null,
                     }) => {
    const commentaryEndRef = useRef(null);
    const recentBallsRef = useRef(null);
    const isBowlingRef = useRef(false);

    useEffect(() => {
        if (commentaryEndRef.current) {
            commentaryEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [matchState.commentary]);

    useEffect(() => {
        if (recentBallsRef.current) {
            recentBallsRef.current.scrollLeft = recentBallsRef.current.scrollWidth;
        }
    }, [matchState.recentBalls]);

    if (!matchState?.battingTeam || !matchState?.bowlingTeam) {
        return null;
    }

    const batTeam = matchState.battingTeam;
    const bowlTeam = matchState.bowlingTeam;

    const getMatchPlayer = (id) => {
        if (!id) return null;
        return (
            batTeam.players.find((p) => p.instanceId === id) ||
            bowlTeam.players.find((p) => p.instanceId === id)
        );
    };

    const striker = getMatchPlayer(matchState.strikerId);
    const nonStriker = getMatchPlayer(matchState.nonStrikerId);
    const bowler = getMatchPlayer(matchState.bowlerId);

    const sStats =
        matchState.batsmanStats[striker?.instanceId] || {
            runs: 0,
            balls: 0,
            fours: 0,
            sixes: 0,
            out: false,
        };
    const nsStats =
        matchState.batsmanStats[nonStriker?.instanceId] || {
            runs: 0,
            balls: 0,
            fours: 0,
            sixes: 0,
            out: false,
        };
    const bStats =
        matchState.bowlerStats[bowler?.instanceId] || {
            balls: 0,
            runs: 0,
            wickets: 0,
        };

    const oversStr =
        Math.floor(matchState.ballsBowled / 6) +
        "." +
        (matchState.ballsBowled % 6);

    const isAllOut =
        matchState.wickets >= batTeam.players.length - 1 ||
        batTeam.players.length === 0;
    const endOfInnings =
        matchState.innings === 1 &&
        (matchState.ballsBowled >= matchState.totalOvers * 6 || isAllOut);

    const totalOversBowled = matchState.ballsBowled / 6;
    const currentRR =
        totalOversBowled > 0 ? matchState.score / totalOversBowled : null;

    const ballsLeft = matchState.totalOvers * 6 - matchState.ballsBowled;
    const reqRR =
        matchState.innings === 2 &&
        matchState.target != null &&
        ballsLeft > 0 &&
        matchState.score <= matchState.target
            ? (matchState.target - matchState.score + 1) / (ballsLeft / 6)
            : null;

    const isBigMoment =
        !!matchState.eventOverlay &&
        ["SIX", "FOUR", "WICKET"].includes(matchState.eventOverlay.type);

    const allPlayers = [...batTeam.players, ...bowlTeam.players];

    // ---------- LEFT-PANE TAB CONTENT ----------
    const renderLeftContent = () => {
        if (!striker || !bowler) {
            return (
                <div className="flex-1 flex items-center justify-center">
                    Loading…
                </div>
            );
        }

        // LIVE TAB
        if (activeTab === "live") {
            return (
                <div className="flex-1 flex flex-col gap-4 h-full p-4">
                    <div className="flex-1 flex items-center justify-center">
                        <div
                            className={
                                "relative rounded-3xl overflow-hidden border border-slate-700 shadow-2xl w-full max-w-4xl aspect-video bg-black " +
                                (isBigMoment ? "camera-shake" : "")
                            }
                        >
                            {/* Stadium background */}
                            <div
                                className="absolute inset-0"
                                style={{
                                    backgroundImage: `url(${stadiumImg})`,
                                    backgroundSize: "cover",
                                    backgroundPosition: "center",
                                }}
                            />
                            {/* Dark overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/50" />

                            {/* Big moment overlay text (images handled by engine via eventOverlay.img if you wire it) */}
                            {matchState.eventOverlay && (
                                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm event-overlay-zoom">
                                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                                    <div className="event-overlay-flash" />
                                    <h1 className="absolute bottom-10 left-0 right-0 text-center font-broadcast text-[70px] md:text-[110px] text-brand-gold tracking-widest event-overlay-text-pop drop-shadow-[0_0_40px_rgba(250,204,21,0.9)]">
                                        {matchState.eventOverlay.text}
                                    </h1>
                                </div>
                            )}

                            {/* Overlay UI */}
                            <div className="absolute inset-0 flex flex-col justify-between p-8 md:p-12">
                                {/* Non-striker card */}
                                <div className="flex justify-center">
                                    <div className="glass-card p-3 rounded-xl flex items-center gap-3 min-w-[180px] bg-slate-900/80 border border-slate-600">
                                        <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center font-bold text-slate-400 border border-slate-500 text-xs">
                                            {nonStriker?.name
                                                ?.split(" ")
                                                .map((n) => n[0])
                                                .join("")
                                                .slice(0, 2)
                                                .toUpperCase()}
                                        </div>
                                        <div>
                                            <div className="text-[10px] text-slate-400 font-bold uppercase">
                                                Non-Striker
                                            </div>
                                            <div className="font-broadcast text-lg truncate max-w-[140px] text-slate-200">
                                                {nonStriker?.name}
                                            </div>
                                            <div className="font-mono text-brand-gold text-xs">
                                                {nsStats.runs}{" "}
                                                <span className="text-slate-500">
                          ({nsStats.balls})
                        </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Striker + bowler */}
                                <div className="flex justify-between items-end gap-4">
                                    {/* Striker */}
                                    <div className="glass-card p-4 rounded-xl flex items-center gap-3 min-w-[220px] border-l-4 border-green-500 bg-slate-900/90 shadow-xl">
                                        <div className="w-12 h-12 rounded-full bg-green-900/30 border-2 border-green-500 flex items-center justify-center font-broadcast text-xl text-green-400 shadow-[0_0_15px_rgba(34,197,94,0.3)]">
                                            {striker?.name
                                                ?.split(" ")
                                                .map((n) => n[0])
                                                .join("")
                                                .slice(0, 2)
                                                .toUpperCase()}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="text-[10px] text-green-400 font-bold uppercase animate-pulse mb-0.5">
                                                On Strike
                                            </div>
                                            <div className="font-broadcast text-2xl truncate max-w-[150px] leading-none mb-0.5">
                                                {striker?.name}
                                            </div>
                                            <div className="font-mono text-lg text-brand-gold">
                                                {sStats.runs}{" "}
                                                <span className="text-slate-500 text-sm">
                          ({sStats.balls})
                        </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Bowler */}
                                    <div className="glass-card p-3 rounded-xl text-right min-w-[160px] bg-slate-900/80 border border-slate-600">
                                        <div className="text-[10px] text-slate-400 font-bold uppercase">
                                            Bowler
                                        </div>
                                        <div className="font-broadcast text-xl truncate max-w-[150px] text-slate-200">
                                            {bowler?.name}
                                        </div>
                                        <div className="font-mono text-xs text-slate-400 mt-0.5">
                                            {Math.floor(bStats.balls / 6)}.{bStats.balls % 6} ov •{" "}
                                            <span className="text-white font-bold">
                        {bStats.wickets}-{bStats.runs}
                      </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        // SCORECARD TAB
        if (activeTab === "scorecard") {
            return (
                <div className="flex-1 glass-panel rounded-3xl p-6 overflow-hidden h-full flex flex-col">
                    <h3 className="font-broadcast text-3xl text-white mb-4 border-b border-white/10 pb-2">
                        {batTeam.name} Innings
                    </h3>
                    <div className="overflow-y-auto custom-scrollbar flex-1">
                        {/* Batting */}
                        <table className="w-full text-sm text-left mb-8">
                            <thead className="text-slate-500 uppercase text-xs border-b border-white/5">
                            <tr>
                                <th className="py-2">Batter</th>
                                <th className="py-2 text-right">R</th>
                                <th className="py-2 text-right">B</th>
                                <th className="py-2 text-right">4s</th>
                                <th className="py-2 text-right">6s</th>
                                <th className="py-2 text-right">SR</th>
                            </tr>
                            </thead>
                            <tbody className="text-slate-300">
                            {batTeam.players.map((p) => {
                                const stats = matchState.batsmanStats[p.instanceId] || {
                                    runs: 0,
                                    balls: 0,
                                    fours: 0,
                                    sixes: 0,
                                    out: false,
                                };
                                const isStriker = p.instanceId === matchState.strikerId;
                                const isNonStriker =
                                    p.instanceId === matchState.nonStrikerId;
                                const sr =
                                    stats.balls > 0
                                        ? ((stats.runs / stats.balls) * 100).toFixed(1)
                                        : "0.0";

                                return (
                                    <tr
                                        key={p.instanceId}
                                        className={`border-b border-white/5 ${
                                            stats.out
                                                ? "text-red-400"
                                                : isStriker || isNonStriker
                                                    ? "text-green-400 font-bold"
                                                    : ""
                                        }`}
                                    >
                                        <td className="py-2">
                                            {p.name}{" "}
                                            {stats.out
                                                ? "(out)"
                                                : isStriker
                                                    ? "*"
                                                    : ""}
                                        </td>
                                        <td className="py-2 text-right font-bold text-white">
                                            {stats.runs}
                                        </td>
                                        <td className="py-2 text-right">{stats.balls}</td>
                                        <td className="py-2 text-right text-slate-500">
                                            {stats.fours}
                                        </td>
                                        <td className="py-2 text-right text-slate-500">
                                            {stats.sixes}
                                        </td>
                                        <td className="py-2 text-right text-slate-500">
                                            {sr}
                                        </td>
                                    </tr>
                                );
                            })}
                            </tbody>
                        </table>

                        {/* Bowling */}
                        <h3 className="font-broadcast text-2xl text-white mb-4 border-b border-white/10 pb-2 mt-8">
                            Bowling
                        </h3>
                        <table className="w-full text-sm text-left">
                            <thead className="text-slate-500 uppercase text-xs border-b border-white/5">
                            <tr>
                                <th className="py-2">Bowler</th>
                                <th className="py-2 text-right">O</th>
                                <th className="py-2 text-right">R</th>
                                <th className="py-2 text-right">W</th>
                                <th className="py-2 text-right">Econ</th>
                            </tr>
                            </thead>
                            <tbody className="text-slate-300">
                            {bowlTeam.players
                                .filter(
                                    (p) =>
                                        matchState.bowlerStats[p.instanceId]?.balls > 0
                                )
                                .map((p) => {
                                    const stats = matchState.bowlerStats[p.instanceId];
                                    const ov =
                                        Math.floor(stats.balls / 6) +
                                        "." +
                                        (stats.balls % 6);
                                    const econ =
                                        stats.balls > 0
                                            ? (stats.runs / (stats.balls / 6)).toFixed(1)
                                            : "0.0";
                                    return (
                                        <tr
                                            key={p.instanceId}
                                            className="border-b border-white/5"
                                        >
                                            <td className="py-2">{p.name}</td>
                                            <td className="py-2 text-right">{ov}</td>
                                            <td className="py-2 text-right">{stats.runs}</td>
                                            <td className="py-2 text-right font-bold text-brand-gold">
                                                {stats.wickets}
                                            </td>
                                            <td className="py-2 text-right text-slate-500">
                                                {econ}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            );
        }

        // COMMENTARY TAB
        return (
            <div className="flex-1 glass-panel rounded-3xl p-6 overflow-hidden h-full flex flex-col">
                <div className="flex-shrink-0 mb-4 bg-slate-800/50 p-4 rounded-xl border border-white/10 flex justify-between items-center">
                    <div className="flex gap-6">
                        <div>
                            <div className="text-[10px] uppercase text-green-400 font-bold mb-1">
                                Batting
                            </div>
                            <div className="text-sm font-bold text-white">
                                {striker.name}{" "}
                                <span className="text-brand-gold">
                  {sStats.runs}({sStats.balls})
                </span>
                            </div>
                            <div className="text-sm text-slate-400">
                                {nonStriker?.name}{" "}
                                <span className="text-slate-300">
                  {nsStats.runs}({nsStats.balls})
                </span>
                            </div>
                        </div>
                        <div className="w-px bg-white/10 self-stretch" />
                        <div>
                            <div className="text-[10px] uppercase text-blue-400 font-bold mb-1">
                                Bowling
                            </div>
                            <div className="text-sm font-bold text-white">
                                {bowler.name}
                            </div>
                            <div className="text-xs text-slate-400">
                                {Math.floor(bStats.balls / 6)}.{bStats.balls % 6} ov •{" "}
                                {bStats.wickets}-{bStats.runs}
                            </div>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-2xl font-broadcast text-white">
                            {matchState.score}/{matchState.wickets}
                        </div>
                        <div className="text-xs text-slate-400">
                            CRR:{" "}
                            {currentRR != null ? currentRR.toFixed(2) : "--"}
                        </div>
                    </div>
                </div>
                <h3 className="font-broadcast text-2xl text-white mb-2 border-b border-white/10 pb-1">
                    Full Match Commentary
                </h3>
                <div className="overflow-y-auto custom-scrollbar flex-1 space-y-2 p-2">
                    {[...matchState.commentary].reverse().map((line, i) => (
                        <div
                            key={i}
                            className="p-3 bg-slate-800/30 rounded border border-white/5 text-sm text-slate-300"
                        >
                            {line}
                        </div>
                    ))}
                    <div ref={commentaryEndRef} />
                </div>
            </div>
        );
    };

    const winnerLabel =
        matchState.isMatchOver && matchState.winner
            ? matchState.winner === "Tie"
                ? "Match Tied"
                : `${matchState.winner.name} won`
            : null;

    return (
        <div className="min-h-screen w-full flex flex-col bg-slate-950 relative overflow-hidden">
            {/* ✅ INNINGS BREAK OVERLAY */}
            {endOfInnings && !matchState.isMatchOver && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md">
                    <div className="text-center space-y-8 animate-fade-in">
                        <div className="text-brand-gold text-8xl font-broadcast animate-pulse">
                            INNINGS BREAK
                        </div>
                        <div className="space-y-4">
                            <div className="flex items-center justify-center gap-3">
                                {getTeamDisplay && getTeamDisplay(batTeam).logo && (
                                    <img src={getTeamDisplay(batTeam).logo} alt={getTeamDisplay(batTeam).shortName} className="w-12 h-12 object-contain" />
                                )}
                                <div className="text-white text-4xl font-broadcast">
                                    {getTeamDisplay ? getTeamDisplay(batTeam).name : batTeam.name}: {matchState.score}/{matchState.wickets}
                                </div>
                            </div>
                            <div className="text-slate-400 text-2xl">
                                ({oversStr} overs)
                            </div>
                            <div className="text-emerald-400 text-3xl font-bold mt-6">
                                Target: {matchState.score + 1} runs
                            </div>
                        </div>
                        <button
                            onClick={handleInningsBreak}
                            className="mt-12 px-16 py-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-broadcast text-3xl rounded-2xl shadow-2xl transition-all active:scale-95 animate-pulse"
                        >
                            START 2ND INNINGS
                        </button>
                    </div>
                </div>
            )}

            {/* ✅ MATCH RESULT OVERLAY */}
            {matchState.isMatchOver && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-brand-gold/10 via-transparent to-transparent" />
                    <div className="relative text-center space-y-8 animate-fade-in p-8">
                        <div className="text-brand-gold text-9xl font-broadcast drop-shadow-2xl animate-bounce">
                            {matchState.winner === "Tie" ? "MATCH TIED!" : "MATCH OVER!"}
                        </div>
                        
                        {matchState.winner !== "Tie" && (
                            <>
                                {tournPhase === "final" && (
                                    <img 
                                        src="https://documents.iplt20.com/ipl/IPLMedia/media/IPLImages/trophy.png" 
                                        alt="IPL Trophy" 
                                        className="w-48 h-48 object-contain mx-auto animate-pulse"
                                    />
                                )}
                                <div className="flex flex-col items-center gap-4">
                                    {getTeamDisplay && getTeamDisplay(matchState.winner).logo && (
                                        <img src={getTeamDisplay(matchState.winner).logo} alt={getTeamDisplay(matchState.winner).shortName} className="w-24 h-24 object-contain" />
                                    )}
                                    <div className="text-white text-6xl font-broadcast">
                                        {tournPhase === "final" ? "🏆 CHAMPIONS 🏆" : `🏆 ${getTeamDisplay ? getTeamDisplay(matchState.winner).name : matchState.winner.name}`}
                                    </div>
                                    {tournPhase === "final" && (
                                        <div className="text-brand-gold text-5xl font-broadcast">
                                            {getTeamDisplay ? getTeamDisplay(matchState.winner).name : matchState.winner.name}
                                        </div>
                                    )}
                                    {onlineRoom && (() => {
                                        const player = onlineRoom.players?.find(p => p.side === matchState.winner.id);
                                        return player && (
                                            <div className="text-slate-300 text-2xl">
                                                {player.name}
                                            </div>
                                        );
                                    })()}
                                </div>
                                <div className="text-emerald-400 text-4xl font-bold">
                                    {tournPhase === "final" ? "WINS THE TOURNAMENT!" : "WINS THE MATCH!"}
                                </div>
                            </>
                        )}

                        <div className="mt-12 space-y-4 bg-slate-900/50 backdrop-blur-sm rounded-3xl p-8 border border-slate-700">
                            <div className="text-slate-300 text-2xl">
                                <span className="font-broadcast text-white">{batTeam.name}:</span> {matchState.score}/{matchState.wickets} ({oversStr})
                            </div>
                            {matchState.innings === 2 && matchState.target && (
                                <div className="text-slate-400 text-xl">
                                    Target: {matchState.target + 1}
                                </div>
                            )}
                        </div>

                        <button
                            onClick={endMatch}
                            className="mt-12 px-16 py-6 bg-gradient-to-r from-brand-gold to-yellow-500 hover:from-yellow-400 hover:to-brand-gold text-black font-broadcast text-3xl rounded-2xl shadow-2xl transition-all transform hover:scale-105"
                        >
                            {matchState.mode === "tourn" ? "RETURN TO HUB" : "RETURN TO MENU"}
                        </button>
                    </div>
                </div>
            )}

            {/* HEADER */}
            <div className="flex-shrink-0 glass-panel px-6 py-3 flex justify-between items-center z-20 border-b border-slate-700/50">
                {/* ✅ Batting Team */}
                <div className="flex items-center gap-4">
                    <div className="flex flex-col items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-green-600 to-emerald-600 border-2 border-green-400 shadow-lg shadow-green-900/50">
                        <div className="text-[10px] text-green-200 font-bold uppercase">BAT</div>
                        <div className="text-white font-broadcast text-xl">🏏</div>
                    </div>
                    {getTeamDisplay && getTeamDisplay(batTeam).logo && (
                        <img src={getTeamDisplay(batTeam).logo} alt={getTeamDisplay(batTeam).shortName} className="w-12 h-12 object-contain" />
                    )}
                    <div>
                        <div className="font-broadcast text-3xl leading-none text-white">
                            {getTeamDisplay ? getTeamDisplay(batTeam).name : batTeam.name}
                        </div>
                        {onlineRoom && (() => {
                            const player = onlineRoom.players?.find(p => p.side === batTeam.id);
                            return player && (
                                <div className="text-xs text-slate-400 mt-0.5">
                                    {player.name}
                                </div>
                            );
                        })()}
                        <div className="text-xs text-green-400 uppercase tracking-widest font-bold mt-0.5">
                            Batting • Innings {matchState.innings}
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 bg-slate-900/80 p-1 rounded-lg">
                    <button
                        onClick={() => setActiveTab("live")}
                        className={`px-6 py-2 rounded-md text-sm font-bold uppercase tracking-wider transition-all flex items-center gap-1 ${
                            activeTab === "live"
                                ? "bg-slate-700 text-brand-gold shadow-md"
                                : "text-slate-500 hover:text-white"
                        }`}
                    >
                        <Tv size={14} /> Live
                    </button>
                    <button
                        onClick={() => setActiveTab("scorecard")}
                        className={`px-6 py-2 rounded-md text-sm font-bold uppercase tracking-wider transition-all flex items-center gap-1 ${
                            activeTab === "scorecard"
                                ? "bg-slate-700 text-brand-gold shadow-md"
                                : "text-slate-500 hover:text-white"
                        }`}
                    >
                        <FileText size={14} /> Scorecard
                    </button>
                    <button
                        onClick={() => setActiveTab("commentary")}
                        className={`px-6 py-2 rounded-md text-sm font-bold uppercase tracking-wider transition-all flex items-center gap-1 ${
                            activeTab === "commentary"
                                ? "bg-slate-700 text-brand-gold shadow-md"
                                : "text-slate-500 hover:text-white"
                        }`}
                    >
                        <Mic size={14} /> Comm
                    </button>
                </div>

                {/* ✅ Score + Bowling Team */}
                <div className="flex items-center gap-4">
                    <div className="text-right">
                        <div className="font-broadcast text-5xl text-white leading-none">
                            {matchState.score}/{matchState.wickets}
                        </div>
                        <div className="text-xs text-slate-400 uppercase tracking-widest font-bold text-right">
                            {oversStr} Overs
                        </div>
                        {matchState.innings === 2 && matchState.target != null && (
                            <div className="text-[11px] text-slate-400 mt-1">
                                Target:{" "}
                                <span className="text-slate-100 font-bold">
                    {matchState.target + 1}
                  </span>
                                {reqRR != null && (
                                    <>
                                    {" "}
                                    • Req RR:{" "}
                                    <span className="text-emerald-300 font-mono">
                    {reqRR.toFixed(2)}
                  </span>
                                </>
                            )}
                        </div>
                    )}
                    {winnerLabel && (
                        <div className="text-[11px] text-brand-gold mt-1 font-bold">
                            {winnerLabel}
                        </div>
                    )}
                </div>
                {getTeamDisplay && getTeamDisplay(bowlTeam).logo && (
                    <img src={getTeamDisplay(bowlTeam).logo} alt={getTeamDisplay(bowlTeam).shortName} className="w-12 h-12 object-contain" />
                )}
                <div className="flex flex-col items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-red-600 to-rose-600 border-2 border-red-400 shadow-lg shadow-red-900/50">
                    <div className="text-[10px] text-red-200 font-bold uppercase">BOWL</div>
                    <div className="text-white font-broadcast text-xl">⚾</div>
                </div>
                <div>
                    <div className="font-broadcast text-3xl leading-none text-white text-right">
                        {getTeamDisplay ? getTeamDisplay(bowlTeam).name : bowlTeam.name}
                    </div>
                    {onlineRoom && (() => {
                        const player = onlineRoom.players?.find(p => p.side === bowlTeam.id);
                        return player && (
                            <div className="text-xs text-slate-400 mt-0.5 text-right">
                                {player.name}
                            </div>
                        );
                    })()}
                    <div className="text-xs text-red-400 uppercase tracking-widest font-bold text-right mt-0.5">
                        Bowling
                    </div>
                </div>
            </div>
            </div>

            {/* BODY */}
            <div className="flex-1 flex flex-col gap-4 p-6 z-10 min-h-0 overflow-hidden">
                {/* Top stats bar */}
                <StatsDashboard
                    striker={striker}
                    nonStriker={nonStriker}
                    sStats={sStats}
                    nsStats={nsStats}
                    matchState={matchState}
                    allPlayers={allPlayers}
                />

                {/* Lower layout: left (tabs) + right (recent balls, feed, controls) */}
                <div className="flex-1 flex gap-6 min-h-0 overflow-hidden">
                    {renderLeftContent()}

                    <div className="w-96 flex flex-col gap-4 h-full min-h-0">
                        {/* Recent balls */}
                        <div className="flex-shrink-0 glass-panel p-4 rounded-xl">
                            <div className="text-xs text-slate-500 uppercase font-bold mb-3 tracking-widest">
                                Recent Deliveries (Last 2 Overs)
                            </div>
                            <div
                                className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar"
                                ref={recentBallsRef}
                            >
                                {matchState.recentBalls.length === 0 ? (
                                    <span className="text-slate-600 text-sm italic">
                    Waiting…
                  </span>
                                ) : (
                                    matchState.recentBalls.map((b, i) => (
                                        <div
                                            key={i}
                                            className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm shadow-md ${
                                                b === "W"
                                                    ? "bg-red-600 text-white animate-hit"
                                                    : b === "4"
                                                        ? "bg-blue-600 text-white"
                                                        : b === "6"
                                                            ? "bg-yellow-400 text-black font-extrabold border-2 border-white shadow-[0_0_15px_rgba(250,204,21,0.6)]"
                                                            : "bg-slate-700 text-slate-300"
                                            }`}
                                        >
                                            {b}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Live feed */}
                        <div className="flex-1 glass-panel rounded-xl p-0 overflow-hidden flex flex-col min-h-0">
                            <div className="flex-shrink-0 p-3 bg-slate-800/80 border-b border-slate-700 text-xs font-bold uppercase tracking-widest text-slate-400">
                                Live Feed
                            </div>
                            <div className="flex-1 overflow-y-auto p-4 space-y-3 text-sm text-slate-300 custom-scrollbar scroll-smooth">
                                {matchState.commentary.slice(-20).map((line, i) => (
                                    <div
                                        key={i}
                                        className={`border-b border-slate-800/50 pb-2 last:border-0 ${
                                            line.includes("GONE") || line.includes("OUT")
                                                ? "text-red-400 font-bold"
                                                : line.includes("SIX") || line.includes("FOUR")
                                                    ? "text-brand-gold"
                                                    : ""
                                        }`}
                                    >
                                        {line}
                                    </div>
                                ))}
                                <div ref={commentaryEndRef} />
                            </div>
                        </div>

                        {/* Controls */}
                        <div className="flex-shrink-0 space-y-2">
                            {!matchState.isMatchOver ? (
                                !endOfInnings ? (
                                    <>
                                        <button
                                            id="bowlBtn"
                                            onClick={() => {
                                                if ((isOnline && !canControl) || isBowlingRef.current) return;
                                                isBowlingRef.current = true;
                                                bowlBall();
                                                setTimeout(() => { isBowlingRef.current = false; }, 100);
                                            }}
                                            className={`w-full font-broadcast text-3xl py-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-3 ${
                                                isOnline && !canControl
                                                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                                                    : 'bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-500 hover:to-emerald-600 text-white active:scale-95'
                                            }`}
                                        >
                                            {isOnline && !canControl ? (
                                                isSpectator ? (
                                                    <>👁️ SPECTATING...</>
                                                ) : (
                                                    <>⏳ WAITING FOR BOWLER...</>
                                                )
                                            ) : (
                                                <>
                                                    BOWL 1 BALL{" "}
                                                    <span className="text-sm opacity-50 font-sans tracking-widest">⬤</span>
                                                </>
                                            )}
                                        </button>
                                        <div className="grid grid-cols-4 gap-2">
                                            <button
                                                onClick={() => {
                                                    if ((isOnline && !canControl) || isBowlingRef.current) return;
                                                    isBowlingRef.current = true;
                                                    skipOver();
                                                    setTimeout(() => { isBowlingRef.current = false; }, 500);
                                                }}
                                                className={`bg-slate-800 text-xs font-bold text-slate-300 py-3 rounded-lg flex flex-col items-center gap-1 transition-colors ${
                                                    isOnline && !canControl ? 'opacity-30 cursor-not-allowed' : 'hover:bg-slate-700'
                                                }`}
                                            >
                                                <SkipForward size={14} /> End Over
                                            </button>
                                            <button
                                                onClick={() => {
                                                    if ((isOnline && !canControl) || isBowlingRef.current) return;
                                                    isBowlingRef.current = true;
                                                    skipFiveOvers();
                                                    setTimeout(() => { isBowlingRef.current = false; }, 1000);
                                                }}
                                                className={`bg-slate-800 text-xs font-bold text-slate-300 py-3 rounded-lg flex flex-col items-center gap-1 transition-colors ${
                                                    isOnline && !canControl ? 'opacity-30 cursor-not-allowed' : 'hover:bg-slate-700'
                                                }`}
                                            >
                                                <FastForward size={14} /> +5 Overs
                                            </button>
                                            <button
                                                onClick={() => {
                                                    if ((isOnline && !canControl) || isBowlingRef.current) return;
                                                    isBowlingRef.current = true;
                                                    skipTenOvers();
                                                    setTimeout(() => { isBowlingRef.current = false; }, 1500);
                                                }}
                                                className={`bg-slate-800 text-xs font-bold text-slate-300 py-3 rounded-lg flex flex-col items-center gap-1 transition-colors ${
                                                    isOnline && !canControl ? 'opacity-30 cursor-not-allowed' : 'hover:bg-slate-700'
                                                }`}
                                            >
                                                <FastForward size={14} /> +10 Overs
                                            </button>
                                            <button
                                                onClick={() => {
                                                    if ((isOnline && !canControl) || isBowlingRef.current) return;
                                                    isBowlingRef.current = true;
                                                    skipInnings();
                                                    setTimeout(() => { isBowlingRef.current = false; }, 2000);
                                                }}
                                                className={`bg-slate-800 text-xs font-bold text-red-400 py-3 rounded-lg flex flex-col items-center gap-1 transition-colors border border-red-900/30 ${
                                                    isOnline && !canControl ? 'opacity-30 cursor-not-allowed' : 'hover:bg-slate-700 hover:border-red-900'
                                                }`}
                                            >
                                                <ChevronsRight size={14} /> End Inn
                                            </button>
                                        </div>
                                    </>
                                ) : (
                                    <button
                                        onClick={handleInningsBreak}
                                        disabled={isOnline && !canControl}
                                        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-broadcast text-2xl py-4 rounded-xl shadow-lg transition-all active:scale-95 animate-pulse disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        START 2ND INNINGS
                                    </button>
                                )
                            ) : (
                                <button
                                    onClick={endMatch}
                                    className="w-full bg-brand-gold hover:bg-yellow-400 text-black font-bold py-4 rounded-xl shadow-lg transition-all transform hover:scale-105"
                                >
                                    {matchState.mode === "tourn"
                                        ? "Return to Hub"
                                        : "Return to Menu"}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MatchCenter;

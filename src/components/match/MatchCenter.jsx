import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import StatsDashboard from "./StatsDashboard";
import CricketFacts from "../shared/CricketFacts";
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
                         setView = null,
                     }) => {
    const [playbackSpeed, setPlaybackSpeed] = useState(1); // 0.5x, 1x, 1.5x, 2x
    const commentaryEndRef = useRef(null);
    const recentBallsRef = useRef(null);
    const isBowlingRef = useRef(false);
    const location = useLocation();
    const navigate = useNavigate();
    const lastUrlRef = useRef(null);
    const autoBowlIntervalRef = useRef(null);

    // Guard against null matchState
    if (!matchState) {
        return <div className="min-h-screen bg-slate-950 flex items-center justify-center">Loading match...</div>;
    }

    // Early computation of endOfInnings for use in effects
    const batTeam = matchState.battingTeam;
    const bowlTeam = matchState.bowlingTeam;
    const isAllOut =
        matchState.wickets >= batTeam.players.length - 1 ||
        batTeam.players.length === 0;
    const endOfInnings =
        matchState.innings === 1 &&
        (matchState.ballsBowled >= matchState.totalOvers * 6 || isAllOut);

    // Auto-bowling effect for playback speeds > 1x
    useEffect(() => {
        if (playbackSpeed > 1 && !matchState?.isMatchOver && !endOfInnings && (isOnline ? canControl : true)) {
            // Calculate interval based on speed: at 2x speed, bowl twice as fast (half the interval)
            const baseInterval = 500; // 500ms base interval for 1x
            const interval = baseInterval / playbackSpeed;
            
            autoBowlIntervalRef.current = setInterval(() => {
                if (!isBowlingRef.current && (isOnline ? canControl : true)) {
                    bowlBall();
                }
            }, interval);

            return () => {
                if (autoBowlIntervalRef.current) {
                    clearInterval(autoBowlIntervalRef.current);
                }
            };
        }
    }, [playbackSpeed, matchState?.isMatchOver, endOfInnings, bowlBall, isOnline, canControl]);

    // Sync activeTab with URL query parameter - only when URL changes
    useEffect(() => {
        const searchParams = new URLSearchParams(location.search);
        const tabParam = searchParams.get("tab");
        
        if (tabParam && tabParam !== activeTab) {
            setActiveTab(tabParam);
        }
    }, [location.search]);

    // Update URL when activeTab changes - prevent circular updates
    useEffect(() => {
        const searchParams = new URLSearchParams(location.search);
        searchParams.set("tab", activeTab || "live");
        const newUrl = `${location.pathname}?${searchParams.toString()}`;
        
        if (lastUrlRef.current !== newUrl) {
            lastUrlRef.current = newUrl;
            navigate(newUrl, { replace: true });
        }
    }, [activeTab, location.pathname]);

    // Sync match over state with URL
    useEffect(() => {
        if (matchState.isMatchOver && setView) {
            setView("match_over");
        }
    }, [matchState.isMatchOver, setView]);

    // Guard against null matchState
    if (!matchState) {
        return <div className="min-h-screen bg-slate-950 flex items-center justify-center">Loading match...</div>;
    }

    useEffect(() => {
        if (commentaryEndRef.current && commentaryEndRef.current.parentElement) {
            // Scroll only within the commentary container, not the entire page
            commentaryEndRef.current.parentElement.scrollTop = commentaryEndRef.current.parentElement.scrollHeight;
        }
    }, [matchState?.commentary]);

    useEffect(() => {
        if (recentBallsRef.current) {
            recentBallsRef.current.scrollLeft = recentBallsRef.current.scrollWidth;
        }
    }, [matchState?.recentBalls]);

    // Wrapper to handle innings break and broadcast to guests
    const handleInningsBreakWithBroadcast = () => {
        console.log("🏏 Start 2nd Innings clicked - current innings:", matchState.innings);
        handleInningsBreak();
        // Broadcast will happen automatically through the App.jsx effect on innings change
    };

    if (!matchState?.battingTeam || !matchState?.bowlingTeam) {
        return null;
    }

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
                    {/* Main Display with Facts Sidebar */}
                    <div className="flex-1 flex gap-4 min-h-0">
                        {/* Stadium view */}
                        <div className="flex-1 flex items-center justify-center">
                            <div
                                className={
                                    "relative rounded-2xl overflow-hidden shadow-xl w-full max-w-4xl aspect-video bg-black " +
                                    (isBigMoment ? "camera-shake" : "")
                                }
                                style={{
                                    backgroundImage: `url(${stadiumImg})`,
                                    backgroundSize: "cover",
                                    backgroundPosition: "center",
                                }}
                            >
                                {/* Sophisticated dark overlay */}
                                <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/50 to-black/90" />

                                {/* Event overlay - minimal and elegant */}
                                {matchState.eventOverlay && (
                                    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80">
                                        <div className="text-center">
                                            <h1 className="font-broadcast text-[120px] text-white tracking-widest drop-shadow-[0_0_30px_rgba(0,0,0,0.8)] mb-4">
                                                {matchState.eventOverlay.text}
                                            </h1>
                                            <div className="h-1 w-32 bg-brand-gold mx-auto" />
                                        </div>
                                    </div>
                                )}

                                {/* Clean Vertical Layout - No Overlap */}
                                <div className="absolute inset-0 flex flex-col gap-3 p-3 overflow-hidden">
                                    {/* Score Bar - Compact */}
                                    <div className="flex justify-around items-center bg-black/40 backdrop-blur rounded-lg p-2 flex-shrink-0">
                                        <div className="text-center">
                                            <div className="text-[8px] text-slate-400 font-bold">OVER</div>
                                            <div className="font-broadcast text-3xl text-white">{Math.floor(matchState.ballsBowled / 6)}.{matchState.ballsBowled % 6}</div>
                                        </div>
                                        <div className="h-12 w-px bg-slate-600/30" />
                                        <div className="text-center flex-1">
                                            <div className="text-[8px] text-slate-400 font-bold">SCORE</div>
                                            <div className="flex justify-center items-baseline gap-1">
                                                <div className="font-broadcast text-5xl text-white leading-none">{matchState.score}</div>
                                                <div className="text-lg text-red-400 font-bold">/{matchState.wickets}</div>
                                            </div>
                                        </div>
                                        <div className="h-12 w-px bg-slate-600/30" />
                                        <div className="text-center">
                                            <div className="text-[8px] text-slate-400 font-bold">OVERS</div>
                                            <div className="font-broadcast text-3xl text-white">{matchState.totalOvers - Math.floor(matchState.ballsBowled / 6)}</div>
                                        </div>
                                    </div>

                                    {/* Main Content - Two Columns Side by Side */}
                                    <div className="flex gap-2 flex-1 min-h-0">
                                        {/* Batsman Card */}
                                        <div className="flex-1 bg-blue-900/30 backdrop-blur border border-blue-500/30 rounded-lg p-2 flex flex-col items-center justify-start overflow-hidden">
                                            <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-broadcast text-lg shadow-lg mb-1 flex-shrink-0">
                                                {striker?.name?.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                                            </div>
                                            <div className="text-center mb-2 flex-shrink-0">
                                                <div className="font-broadcast text-sm text-white leading-tight truncate w-24">{striker?.name}</div>
                                                <div className="text-[6px] text-blue-300 font-bold">BATSMAN</div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-1 w-full flex-shrink-0">
                                                <div className="bg-blue-950/60 p-1 rounded text-center">
                                                    <div className="text-[6px] text-blue-300 font-bold">R</div>
                                                    <div className="font-broadcast text-lg text-brand-gold leading-none">{sStats.runs}</div>
                                                </div>
                                                <div className="bg-blue-950/60 p-1 rounded text-center">
                                                    <div className="text-[6px] text-blue-300 font-bold">B</div>
                                                    <div className="font-broadcast text-lg text-white leading-none">{sStats.balls}</div>
                                                </div>
                                                <div className="bg-blue-950/60 p-1 rounded text-center">
                                                    <div className="text-[6px] text-blue-300 font-bold">4s</div>
                                                    <div className="font-broadcast text-base text-cyan-400 leading-none">{sStats.fours}</div>
                                                </div>
                                                <div className="bg-blue-950/60 p-1 rounded text-center">
                                                    <div className="text-[6px] text-blue-300 font-bold">6s</div>
                                                    <div className="font-broadcast text-base text-brand-gold leading-none">{sStats.sixes}</div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Bowler Card */}
                                        <div className="flex-1 bg-red-900/30 backdrop-blur border border-red-500/30 rounded-lg p-2 flex flex-col items-center justify-start overflow-hidden">
                                            <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center text-white font-broadcast text-lg shadow-lg mb-1 flex-shrink-0">
                                                {bowler?.name?.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                                            </div>
                                            <div className="text-center mb-2 flex-shrink-0">
                                                <div className="font-broadcast text-sm text-white leading-tight truncate w-24">{bowler?.name}</div>
                                                <div className="text-[6px] text-red-300 font-bold">BOWLER</div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-1 w-full flex-shrink-0">
                                                <div className="bg-red-950/60 p-1 rounded text-center">
                                                    <div className="text-[6px] text-red-300 font-bold">O</div>
                                                    <div className="font-mono text-lg text-white leading-none">{Math.floor(bStats.balls / 6)}.{bStats.balls % 6}</div>
                                                </div>
                                                <div className="bg-red-950/60 p-1 rounded text-center">
                                                    <div className="text-[6px] text-red-300 font-bold">R</div>
                                                    <div className="font-broadcast text-lg text-brand-gold leading-none">{bStats.runs}</div>
                                                </div>
                                                <div className="bg-red-950/60 p-1 rounded text-center">
                                                    <div className="text-[6px] text-red-300 font-bold">W</div>
                                                    <div className="font-broadcast text-base text-red-400 leading-none">{bStats.wickets}</div>
                                                </div>
                                                <div className="bg-red-950/60 p-1 rounded text-center">
                                                    <div className="text-[6px] text-red-300 font-bold">E</div>
                                                    <div className="font-mono text-base text-orange-400 leading-none">{bStats.balls > 0 ? (bStats.runs / (bStats.balls / 6)).toFixed(2) : "0"}</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Non-Striker Footer */}
                                    <div className="bg-black/40 backdrop-blur rounded-lg p-2 text-center flex-shrink-0">
                                        <div className="text-[7px] text-slate-400 font-bold mb-1">NON-STRIKER</div>
                                        <div className="font-broadcast text-sm text-white truncate">{nonStriker?.name}</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Sidebar: Cricket Facts */}
                        <div className="w-80 flex flex-col gap-3 h-full min-h-0 overflow-y-auto custom-scrollbar">
                            <CricketFacts autoRotate={true} rotateInterval={15000} />
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
                            {batTeam.players
                                .filter(p => matchState.batsmanStats[p.instanceId]?.balls > 0)
                                .map((p) => {
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

                        {/* Batters Yet to Bat */}
                        <div className="mt-8 mb-8">
                            <h3 className="font-broadcast text-2xl text-white mb-4 border-b border-white/10 pb-2">
                                Yet to Bat
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {batTeam.players
                                    .filter(p => !matchState.batsmanStats[p.instanceId] || matchState.batsmanStats[p.instanceId].balls === 0)
                                    .map(p => (
                                        <div key={p.instanceId} className="px-3 py-1 rounded-full bg-slate-700/50 border border-slate-600 text-sm text-slate-300">
                                            {p.name}
                                        </div>
                                    ))}
                            </div>
                        </div>

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
                <div className="overflow-y-auto custom-scrollbar space-y-2 p-2 h-[400px]">
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
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md p-4">
                    <div className="text-center space-y-4 md:space-y-8 animate-fade-in max-w-2xl">
                        <div className="text-brand-gold text-5xl md:text-8xl font-broadcast animate-pulse">
                            INNINGS BREAK
                        </div>
                        <div className="space-y-2 md:space-y-4">
                            <div className="flex items-center justify-center gap-2 md:gap-3 flex-wrap">
                                {getTeamDisplay && getTeamDisplay(batTeam).logo && (
                                    <img src={getTeamDisplay(batTeam).logo} alt={getTeamDisplay(batTeam).shortName} className="w-8 md:w-12 h-8 md:h-12 object-contain" />
                                )}
                                <div className="text-white text-2xl md:text-4xl font-broadcast">
                                    {getTeamDisplay ? getTeamDisplay(batTeam).name : batTeam.name}: {matchState.score}/{matchState.wickets}
                                </div>
                            </div>
                            <div className="text-slate-400 text-lg md:text-2xl">
                                ({oversStr} overs)
                            </div>
                            <div className="text-emerald-400 text-xl md:text-3xl font-bold mt-4 md:mt-6">
                                Target: {matchState.score + 1} runs
                            </div>
                        </div>
                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                console.log("🏏 Start 2nd Innings clicked");
                                handleInningsBreakWithBroadcast();
                            }}
                            className="mt-6 md:mt-12 px-8 md:px-16 py-3 md:py-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-broadcast text-lg md:text-3xl rounded-lg md:rounded-2xl shadow-2xl transition-all active:scale-95 animate-pulse"
                        >
                            START 2ND INNINGS
                        </button>
                    </div>
                </div>
            )}

            {/* ✅ MATCH RESULT OVERLAY - ELEGANT */}
            {matchState.isMatchOver && (
                <div className="absolute inset-0 z-50 flex items-center justify-center overflow-auto bg-slate-950/95 backdrop-blur-sm">
                    {/* Subtle background gradient */}
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-950 opacity-50" />
                    
                    {/* Main content with proper scrolling */}
                    <div className="relative w-full h-full flex flex-col overflow-hidden">
                        {/* Top three-column content */}
                        <div className="flex-1 w-full flex items-stretch overflow-y-auto">
                            {/* LEFT PANEL - Innings 1 Stats */}
                            <div className="flex-1 flex flex-col items-center justify-center px-8 py-8 border-r border-slate-700/50">
                                <div className="space-y-6">
                                    <div className="text-center">
                                        <div className="text-slate-500 text-xs uppercase tracking-widest font-bold mb-3">First Innings</div>
                                        {getTeamDisplay && getTeamDisplay(matchState.bowlingTeam).logo && (
                                            <img 
                                                src={getTeamDisplay(matchState.bowlingTeam).logo} 
                                                alt="Innings 1" 
                                                className="w-16 h-16 object-contain mx-auto mb-3 opacity-80"
                                            />
                                        )}
                                        <div className="text-slate-300 text-sm mb-4">
                                            {getTeamDisplay ? getTeamDisplay(matchState.bowlingTeam).name : "Team A"}
                                        </div>
                                    </div>
                                    
                                    <div className="bg-slate-800/50 rounded-lg p-6 space-y-4">
                                        <div className="text-center">
                                            <div className="text-slate-400 text-xs uppercase tracking-widest mb-1">Runs</div>
                                            <div className="text-3xl font-broadcast font-bold text-white">
                                                {matchState.innings1?.score || 0}
                                            </div>
                                        </div>
                                        <div className="h-px bg-slate-700/50" />
                                        <div className="text-center">
                                            <div className="text-slate-400 text-xs uppercase tracking-widest mb-1">Wickets</div>
                                            <div className="text-2xl font-broadcast font-bold text-white">
                                                {matchState.innings1?.wickets || 0}
                                            </div>
                                        </div>
                                        <div className="h-px bg-slate-700/50" />
                                        <div className="text-center">
                                            <div className="text-slate-400 text-xs uppercase tracking-widest mb-1">Overs</div>
                                            <div className="text-xl font-broadcast font-bold text-brand-gold">
                                                {(matchState.innings1?.overs || 0).toFixed(1)}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* CENTER PANEL - Winner */}
                            <div className="flex-1 flex flex-col items-center justify-start px-8 py-8 max-w-2xl overflow-y-auto max-h-screen">
                                {/* Header section */}
                                <div className="text-center mb-8 flex-shrink-0">
                                    <div className="text-white text-5xl md:text-6xl font-broadcast font-bold mb-3">
                                        MATCH OVER
                                    </div>
                                    <div className="h-1 w-32 bg-gradient-to-r from-transparent via-brand-gold to-transparent mx-auto" />
                                </div>

                                {/* Winner section */}
                                {matchState.winner !== "Tie" && (
                                    <div className="text-center mb-6 space-y-4 flex-shrink-0">
                                        {/* Team Logo */}
                                        {getTeamDisplay && getTeamDisplay(matchState.winner).logo && (
                                            <div className="flex justify-center">
                                                <img 
                                                    src={getTeamDisplay(matchState.winner).logo} 
                                                    alt={getTeamDisplay(matchState.winner).shortName} 
                                                    className="w-20 h-20 object-contain opacity-90"
                                                />
                                            </div>
                                        )}
                                        
                                        {/* Winner Name */}
                                        <div className="space-y-2">
                                            <div className="text-brand-gold text-xs font-bold uppercase tracking-widest">
                                                {tournPhase === "final" ? "TOURNAMENT WINNER" : "MATCH WINNER"}
                                            </div>
                                            <div className="text-white text-3xl md:text-4xl font-broadcast font-bold">
                                                {getTeamDisplay ? getTeamDisplay(matchState.winner).name : matchState.winner.name}
                                            </div>
                                        </div>

                                        {/* Player name if online */}
                                        {onlineRoom && (() => {
                                            const player = onlineRoom.players?.find(p => p.side === matchState.winner.id);
                                            return player && (
                                                <div className="text-slate-400 text-xs">
                                                    Managed by <span className="text-white font-semibold">{player.name}</span>
                                                </div>
                                            );
                                        })()}
                                    </div>
                                )}

                                {/* Tie message */}
                                {matchState.winner === "Tie" && (
                                    <div className="text-center mb-6 flex-shrink-0">
                                        <div className="text-brand-gold text-3xl md:text-4xl font-broadcast font-bold mb-2">
                                            MATCH TIED
                                        </div>
                                        <div className="text-slate-400 text-xs">
                                            Both teams finished with equal runs
                                        </div>
                                    </div>
                                )}

                                {/* Match Stats */}
                                <div className="w-full bg-slate-800/40 rounded-lg p-4 border border-slate-700/50 mb-6 space-y-3 flex-shrink-0">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <div className="text-slate-400 text-xs uppercase tracking-widest font-bold">
                                                Score
                                            </div>
                                            <div className="text-white text-2xl font-broadcast font-bold">
                                                {matchState.score}/{matchState.wickets}
                                            </div>
                                            <div className="text-brand-gold text-xs">
                                                {oversStr} overs
                                            </div>
                                        </div>

                                        {matchState.innings === 2 && matchState.target !== null && (
                                            <div className="space-y-2 border-l border-slate-600 pl-4">
                                                <div className="text-slate-400 text-xs uppercase tracking-widest font-bold">
                                                    Result
                                                </div>
                                                {matchState.score > matchState.target ? (
                                                    <>
                                                        <div className="text-emerald-400 text-xl font-broadcast font-bold">
                                                            Won by {matchState.score - matchState.target} runs
                                                        </div>
                                                    </>
                                                ) : (
                                                    <>
                                                        <div className="text-red-400 text-xl font-broadcast font-bold">
                                                            Lost by {matchState.target - matchState.score + 1} runs
                                                        </div>
                                                    </>
                                                )}
                                                <div className="text-slate-400 text-xs">
                                                    Target: {matchState.target + 1}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Man of the Match */}
                                {matchState.impactPlayer && matchState.impactPlayer.name && (
                                    <div className="w-full bg-gradient-to-r from-amber-950/40 to-amber-900/20 rounded-lg p-4 border border-amber-700/30 flex-shrink-0">
                                        <div className="text-amber-600 text-xs font-bold uppercase tracking-widest mb-2">
                                            Player of the Match
                                        </div>
                                        <div className="text-white text-lg font-broadcast font-bold mb-1">
                                            {matchState.impactPlayer.name}
                                        </div>
                                        <div className="text-amber-200 text-xs">
                                            {matchState.impactPlayer.type === 'batsman' 
                                                ? `${matchState.impactPlayer.stats.runs} runs (${matchState.impactPlayer.stats.balls} balls)`
                                                : `${matchState.impactPlayer.stats.wickets} wickets • ${matchState.impactPlayer.stats.runs} conceded`
                                            }
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* RIGHT PANEL - Innings 2 Stats / Bowling Team */}
                            <div className="flex-1 flex flex-col items-center justify-center px-8 py-8 border-l border-slate-700/50">
                                <div className="space-y-6">
                                    <div className="text-center">
                                        <div className="text-slate-500 text-xs uppercase tracking-widest font-bold mb-3">
                                            {matchState.innings === 2 ? "Second Innings" : "Bowling Team"}
                                        </div>
                                        {getTeamDisplay && getTeamDisplay(matchState.battingTeam).logo && (
                                            <img 
                                                src={getTeamDisplay(matchState.battingTeam).logo} 
                                                alt="Batting Team" 
                                                className="w-16 h-16 object-contain mx-auto mb-3 opacity-80"
                                            />
                                        )}
                                        <div className="text-slate-300 text-sm mb-4">
                                            {getTeamDisplay ? getTeamDisplay(matchState.battingTeam).name : "Team B"}
                                        </div>
                                    </div>
                                    
                                    {matchState.innings === 2 ? (
                                        <div className="bg-slate-800/50 rounded-lg p-6 space-y-4">
                                            <div className="text-center">
                                                <div className="text-slate-400 text-xs uppercase tracking-widest mb-1">Score</div>
                                                <div className="text-3xl font-broadcast font-bold text-white">
                                                    {matchState.score}/{matchState.wickets}
                                                </div>
                                            </div>
                                            <div className="h-px bg-slate-700/50" />
                                            <div className="text-center">
                                                <div className="text-slate-400 text-xs uppercase tracking-widest mb-1">Target</div>
                                                <div className="text-2xl font-broadcast font-bold text-brand-gold">
                                                    {matchState.target + 1}
                                                </div>
                                            </div>
                                            <div className="h-px bg-slate-700/50" />
                                            <div className="text-center">
                                                <div className="text-slate-400 text-xs uppercase tracking-widest mb-1">Status</div>
                                                <div className={`text-lg font-broadcast font-bold ${matchState.score > matchState.target ? 'text-emerald-400' : 'text-red-400'}`}>
                                                    {matchState.score > matchState.target ? "Won" : "Lost"}
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="bg-slate-800/50 rounded-lg p-6 space-y-4 text-center">
                                            <div>
                                                <div className="text-slate-400 text-xs uppercase tracking-widest mb-2">Defending</div>
                                                <div className="text-brand-gold text-2xl font-broadcast font-bold">
                                                    {matchState.score || 0} Runs
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Bottom Action Buttons - Full Width with proper spacing */}
                        <div className="flex-shrink-0 w-full bg-gradient-to-t from-slate-950 via-slate-950/90 to-transparent pt-8 pb-8 px-8 flex gap-4 justify-center border-t border-slate-700/50">
                            <button
                                onClick={() => setView && setView("match_summary")}
                                className="px-8 py-3 bg-slate-800 hover:bg-slate-700 text-white font-broadcast text-base rounded-lg transition-colors border border-slate-600 hover:border-slate-500"
                            >
                                VIEW SCORECARD
                            </button>
                            <button
                                onClick={endMatch}
                                className="px-8 py-3 bg-brand-gold hover:bg-yellow-500 text-slate-900 font-broadcast text-base font-bold rounded-lg transition-colors"
                            >
                                {matchState.mode === "tourn" ? "RETURN TO HUB" : "RETURN TO MENU"}
                            </button>
                        </div>
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
                        {matchState.playerName ? (
                            <div className="text-xs text-slate-300 mt-0.5 font-semibold">
                                {matchState.playerName}
                            </div>
                        ) : onlineRoom && (() => {
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
                    {matchState.playerName ? (
                        <div className="text-xs text-slate-300 mt-0.5 font-semibold text-right">
                            {matchState.playerName}
                        </div>
                    ) : onlineRoom && (() => {
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
                        <div className="flex-shrink-0 h-64 glass-panel rounded-xl p-0 overflow-hidden flex flex-col">
                            <div className="flex-shrink-0 p-3 bg-slate-800/80 border-b border-slate-700 text-xs font-bold uppercase tracking-widest text-slate-400">
                                Live Feed (Latest 6)
                            </div>
                            <div className="flex-1 overflow-y-auto p-4 space-y-3 text-sm text-slate-300 custom-scrollbar scroll-smooth">
                                {matchState.commentary.slice(-6).map((line, i) => (
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
                            {/* Playback Speed Controls */}
                            <div className="glass-panel p-3 rounded-lg">
                                <div className="text-xs text-slate-500 uppercase font-bold mb-2 tracking-widest">
                                    Playback Speed
                                </div>
                                <div className="grid grid-cols-4 gap-2">
                                    {[0.5, 1, 1.5, 2].map((speed) => (
                                        <button
                                            key={speed}
                                            onClick={() => setPlaybackSpeed(speed)}
                                            className={`py-2 px-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                                                playbackSpeed === speed
                                                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                                                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
                                            }`}
                                        >
                                            {speed}x
                                        </button>
                                    ))}
                                </div>
                                <div className="text-xs text-slate-500 mt-2 text-center">
                                    Current: <span className="text-slate-300 font-semibold">{playbackSpeed}x</span>
                                </div>
                            </div>
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
                                                <>⏳ WAITING FOR BOWLER...</>
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

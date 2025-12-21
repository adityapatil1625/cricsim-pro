// src/components/match/MatchView.jsx
import React from 'react';
import { Tv, FileText, Activity, Mic, SkipForward, FastForward, ChevronsRight } from '../shared/Icons';
import { getInitials, getImpactPlayer } from '../../data/cricketProcessing';


//image
import stadiumImg from "../pictures/stadium.jpg";

const MatchView = ({
                       matchState,
                       activeTab,
                       setActiveTab,
                       bowlBall,
                       skipOver,
                       skipFiveOvers,
                       skipTenOvers,
                       skipInnings,
                       handleInningsBreak,
                       endMatch,
                       getMatchPlayer,
                       commentaryEndRef,
                       recentBallsRef,
                       iplTeams = [],
                       getTeamDisplay = (team) => ({ name: team?.name || "Unknown", logo: null, shortName: team?.name || "Unknown" }),
                       onlineRoom = null
                   }) => {
    const batTeam = matchState.battingTeam;
    const bowlTeam = matchState.bowlingTeam;
    
    const batTeamDisplay = getTeamDisplay(batTeam);
    const bowlTeamDisplay = getTeamDisplay(bowlTeam);
    
    // Get player names for teams
    const batTeamPlayer = onlineRoom?.players?.find(p => p.side === batTeam.id);
    const bowlTeamPlayer = onlineRoom?.players?.find(p => p.side === bowlTeam.id);

    if (!batTeam || !bowlTeam) {
        return <div className="text-white p-4">Loading match...</div>;
    }

    const striker = getMatchPlayer(matchState.strikerId, matchState);
    const nonStriker = getMatchPlayer(matchState.nonStrikerId, matchState);
    const bowler = getMatchPlayer(matchState.bowlerId, matchState);

    if (!striker || !bowler) {
        return <div className="text-white p-4">Setting up players...</div>;
    }

    const sStats = matchState.batsmanStats[striker.instanceId] || {
        runs: 0,
        balls: 0,
        fours: 0,
        sixes: 0,
    };
    const nsStats = matchState.batsmanStats[nonStriker?.instanceId] || {
        runs: 0,
        balls: 0,
        fours: 0,
        sixes: 0,
    };
    const bStats = matchState.bowlerStats[bowler.instanceId] || {
        wickets: 0,
        runs: 0,
        balls: 0,
    };

    const oversStr = `${Math.floor(matchState.ballsBowled / 6)}.${matchState.ballsBowled % 6}`;
    const isAllOut = matchState.wickets >= batTeam.players.length - 1;
    const endOfInnings =
        matchState.innings === 1 &&
        (matchState.ballsBowled >= 120 || isAllOut);

    const currentRunRate =
        matchState.ballsBowled > 0
            ? (matchState.score / (matchState.ballsBowled / 6)).toFixed(2)
            : '0.00';

    const projectedScore =
        matchState.ballsBowled > 0
            ? Math.round(
                (matchState.score / (matchState.ballsBowled / 6)) *
                matchState.totalOvers
            )
            : matchState.totalOvers * 6;

    const partnershipRuns = sStats.runs + nsStats.runs;
    const partnershipBalls = sStats.balls + nsStats.balls;

    const strikerShare =
        partnershipRuns > 0 ? (sStats.runs / partnershipRuns) * 100 : 50;
    const nonStrikerShare =
        partnershipRuns > 0 ? (nsStats.runs / partnershipRuns) * 100 : 50;

    const impact = getImpactPlayer(matchState);

    const renderTabContent = () => {
        // LIVE TAB
        if (activeTab === 'live') {
            return (
                <div className="flex-1 flex h-full items-center justify-center p-4">
                    <div className="relative rounded-3xl overflow-hidden border border-slate-700 shadow-2xl w-full max-w-4xl aspect-video bg-black">
                        <div
                            className="absolute inset-0"
                            style={{
                                backgroundImage: `url(${stadiumImg})`,
                                backgroundSize: "cover",
                                backgroundPosition: "center",
                            }}
                        ></div>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/50" />

                        {matchState.eventOverlay && (
                            <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 event-anim backdrop-blur-sm">
                                <div className="relative w-full h-full max-h-[600px] max-w-[900px] rounded-3xl overflow-hidden border-4 border-brand-gold/50">
                                    <img
                                        src={matchState.eventOverlay.img}
                                        className="w-full h-full object-cover"
                                        alt="event"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent" />
                                    <h1 className="absolute bottom-10 left-0 right-0 text-center font-broadcast text-[80px] md:text-[120px] text-brand-gold tracking-widest drop-shadow-2xl animate-bounce">
                                        {matchState.eventOverlay.text}
                                    </h1>
                                </div>
                            </div>
                        )}

                        <div className="absolute inset-0 flex flex-col justify-between p-8 md:p-12">
                            <div className="flex justify-center">
                                <div className="glass-card p-3 rounded-xl flex items-center gap-3 min-w-[180px] bg-slate-900/80 border border-slate-600">
                                    <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center font-bold text-slate-400 border border-slate-500 text-xs">
                                        {getInitials(nonStriker?.name)}
                                    </div>
                                    <div>
                                        <div className="text-[10px] text-slate-400 font-bold uppercase">
                                            Non-Striker
                                        </div>
                                        <div className="font-broadcast text-lg truncate max-w-[120px] text-slate-200">
                                            {nonStriker?.name}
                                        </div>
                                        <div className="font-mono text-brand-gold text-xs">
                                            {nsStats.runs}{' '}
                                            <span className="text-slate-500">
                        ({nsStats.balls})
                      </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-between items-end gap-4">
                                <div className="glass-card p-4 rounded-xl flex items-center gap-3 min-w-[220px] border-l-4 border-green-500 bg-slate-900/90 shadow-xl">
                                    <div className="w-12 h-12 rounded-full bg-green-900/30 border-2 border-green-500 flex items-center justify-center font-broadcast text-xl text-green-400 shadow-[0_0_15px_rgba(34,197,94,0.3)]">
                                        {getInitials(striker?.name)}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="text-[10px] text-green-400 font-bold uppercase animate-pulse mb-0.5">
                                            On Strike
                                        </div>
                                        <div className="font-broadcast text-2xl truncate max-w-[150px] leading-none mb-0.5">
                                            {striker?.name}
                                        </div>
                                        <div className="font-mono text-lg text-brand-gold">
                                            {sStats.runs}{' '}
                                            <span className="text-slate-500 text-sm">
                        ({sStats.balls})
                      </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="glass-card p-3 rounded-xl text-right min-w-[160px] bg-slate-900/80 border border-slate-600">
                                    <div className="text-[10px] text-slate-400 font-bold uppercase">
                                        Bowler
                                    </div>
                                    <div className="font-broadcast text-xl truncate max-w-[140px] text-slate-200">
                                        {bowler?.name}
                                    </div>
                                    <div className="font-mono text-xs text-slate-400 mt-0.5">
                                        {Math.floor(bStats.balls / 6)}.{bStats.balls % 6} ov •{' '}
                                        <span className="text-white font-bold">
                      {bStats.wickets}-{bStats.runs}
                    </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        // SCORECARD TAB
        if (activeTab === 'scorecard') {
            return (
                <div className="flex-1 glass-panel rounded-3xl p-6 overflow-hidden h-full flex flex-col">
                    <div className="flex items-center gap-3 mb-4 border-b border-white/10 pb-2">
                        {batTeamDisplay.logo && (
                            <img src={batTeamDisplay.logo} alt={batTeamDisplay.shortName} className="w-8 h-8 object-contain" />
                        )}
                        <h3 className="font-broadcast text-3xl text-white">
                            {batTeamDisplay.name} Innings
                        </h3>
                    </div>
                    <div className="overflow-y-auto custom-scrollbar flex-1">
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
                                const stats = matchState.batsmanStats[p.instanceId];
                                if (!stats) return null;
                                const isStriker = p.instanceId === matchState.strikerId;
                                const isNonStriker =
                                    p.instanceId === matchState.nonStrikerId;
                                const sr =
                                    stats.balls > 0
                                        ? ((stats.runs / stats.balls) * 100).toFixed(1)
                                        : '0.0';
                                return (
                                    <tr
                                        key={p.instanceId}
                                        className={`border-b border-white/5 ${
                                            stats.out
                                                ? 'text-red-400'
                                                : isStriker || isNonStriker
                                                    ? 'text-green-400 font-bold'
                                                    : ''
                                        }`}
                                    >
                                        <td className="py-2">
                                            {p.name} {stats.out ? '(out)' : isStriker ? '*' : ''}
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
                                        <td className="py-2 text-right text-slate-500">{sr}</td>
                                    </tr>
                                );
                            })}
                            </tbody>
                        </table>

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
                                    (p) => matchState.bowlerStats[p.instanceId]?.balls > 0
                                )
                                .map((p) => {
                                    const stats = matchState.bowlerStats[p.instanceId];
                                    const ov = `${Math.floor(stats.balls / 6)}.${
                                        stats.balls % 6
                                    }`;
                                    const econ =
                                        stats.balls > 0
                                            ? (stats.runs / (stats.balls / 6)).toFixed(1)
                                            : '0.0';
                                    return (
                                        <tr key={p.instanceId} className="border-b border-white/5">
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

        // DASHBOARD TAB
        if (activeTab === 'dashboard') {
            return (
                <div className="flex-1 glass-panel rounded-3xl p-6 overflow-hidden h-full flex flex-col gap-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Partnership */}
                        <div className="bg-slate-900/80 rounded-2xl p-5 border border-white/10">
                            <div className="flex justify-between items-center mb-3">
                                <h3 className="font-broadcast text-2xl text-white">
                                    Current Partnership
                                </h3>
                                <span className="text-xs uppercase tracking-widest text-slate-400 font-bold">
                  {partnershipRuns} ({partnershipBalls}b)
                </span>
                            </div>
                            <div className="flex justify-between text-xs text-slate-400 mb-2">
                <span>
                  {striker.name}{' '}
                    <span className="text-slate-200">
                    {sStats.runs}({sStats.balls})
                  </span>
                </span>
                                <span>
                  {nonStriker?.name}{' '}
                                    <span className="text-slate-200">
                    {nsStats.runs}({nsStats.balls})
                  </span>
                </span>
                            </div>
                            <div className="w-full h-6 bg-slate-800 rounded-full overflow-hidden flex border border-slate-700">
                                <div
                                    className="h-full bg-green-500/80 text-[10px] flex items-center justify-center font-bold text-black"
                                    style={{ width: `${strikerShare}%` }}
                                >
                                    {sStats.runs}
                                </div>
                                <div
                                    className="h-full bg-blue-500/80 text-[10px] flex items-center justify-center font-bold text-white"
                                    style={{ width: `${nonStrikerShare}%` }}
                                >
                                    {nsStats.runs}
                                </div>
                            </div>
                        </div>

                        {/* Run rate / projected */}
                        <div className="bg-slate-900/80 rounded-2xl p-5 border border-white/10 flex flex-col justify-between">
                            <h3 className="font-broadcast text-2xl text-white mb-4">
                                Innings Projection
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700">
                                    <div className="text-xs uppercase tracking-widest text-slate-400 font-bold mb-1">
                                        Current Run Rate
                                    </div>
                                    <div className="font-broadcast text-4xl text-brand-gold">
                                        {currentRunRate}
                                    </div>
                                    <div className="text-[11px] text-slate-500">
                                        {matchState.score}/{matchState.wickets} in {oversStr}
                                    </div>
                                </div>
                                <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700">
                                    <div className="text-xs uppercase tracking-widest text-slate-400 font-bold mb-1">
                                        Predicted Score
                                    </div>
                                    <div className="font-broadcast text-4xl text-emerald-400">
                                        {projectedScore}
                                    </div>
                                    <div className="text-[11px] text-slate-500">
                                        Based on CRR over {matchState.totalOvers} overs
                                    </div>
                                </div>
                            </div>
                            {matchState.innings === 2 && matchState.target !== null && (
                                <div className="mt-3 text-xs text-slate-400">
                                    Target:{' '}
                                    <span className="text-slate-200">
                    {matchState.target + 1}
                  </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Impact player */}
                    <div className="bg-slate-900/80 rounded-2xl p-5 border border-white/10 flex flex-col md:flex-row gap-5 items-stretch">
                        <div className="flex-1">
                            <h3 className="font-broadcast text-2xl text-white mb-1">
                                Most Impactful Player
                            </h3>
                            <p className="text-xs text-slate-500 mb-4">
                                Computed from runs, boundaries, wickets and runs conceded.
                            </p>
                            {impact ? (
                                <>
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center font-broadcast text-2xl text-brand-gold border border-brand-gold/50">
                                            {getInitials(impact.player.name)}
                                        </div>
                                        <div>
                                            <div className="text-sm uppercase tracking-widest text-slate-400 font-bold">
                                                {impact.player.role}
                                            </div>
                                            <div className="text-xl font-broadcast text-white">
                                                {impact.player.name}
                                            </div>
                                            <div className="text-xs text-slate-500">
                                                Impact Score:{' '}
                                                <span className="text-brand-gold font-bold">
                          {impact.impact.toFixed(1)}
                        </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700">
                                            <div className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-1">
                                                Batting
                                            </div>
                                            <div className="text-slate-200">
                                                {impact.bat.runs} ({impact.bat.balls}) • 4s:{' '}
                                                {impact.bat.fours}, 6s: {impact.bat.sixes}
                                            </div>
                                        </div>
                                        <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700">
                                            <div className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-1">
                                                Bowling
                                            </div>
                                            <div className="text-slate-200">
                                                {Math.floor(impact.bowl.balls / 6)}.
                                                {impact.bowl.balls % 6} ov • {impact.bowl.wickets}-
                                                {impact.bowl.runs}
                                            </div>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="text-slate-500 text-sm">
                                    Impact data will appear once the innings progresses.
                                </div>
                            )}
                        </div>
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
                                {striker.name}{' '}
                                <span className="text-brand-gold">
                  {sStats.runs}({sStats.balls})
                </span>
                            </div>
                            <div className="text-sm text-slate-400">
                                {nonStriker?.name}{' '}
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
                            <div className="text-sm font-bold text-white">{bowler.name}</div>
                            <div className="text-xs text-slate-400">
                                {Math.floor(bStats.balls / 6)}.{bStats.balls % 6} ov •{' '}
                                {bStats.wickets}-{bStats.runs}
                            </div>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-2xl font-broadcast text-white">
                            {matchState.score}/{matchState.wickets}
                        </div>
                        <div className="text-xs text-slate-400">
                            CRR: {currentRunRate}
                        </div>
                    </div>
                </div>

                <h3 className="font-broadcast text-2xl text-white mb-2 border-b border-white/10 pb-1">
                    Full Match Commentary
                </h3>
                <div className="overflow-y-auto custom-scrollbar flex-1 space-y-2 p-2">
                    {[...matchState.commentary].reverse().map((line, i) => (
                        <div
                            key={`${line}-${i}`}
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

    return (
        <div className="h-screen w-screen flex flex-col bg-slate-950 relative overflow-hidden">
            {/* Top bar */}
            <div className="flex-shrink-0 glass-panel px-6 py-3 flex justify-between items-center z-20 border-b border-slate-700/50">
                <div className="flex items-center gap-3">
                    {batTeamDisplay.logo && (
                        <img src={batTeamDisplay.logo} alt={batTeamDisplay.shortName} className="w-10 h-10 object-contain" />
                    )}
                    <div>
                        <div className="font-broadcast text-3xl leading-none text-white">
                            {batTeamDisplay.name}
                        </div>
                        {batTeamPlayer && (
                            <div className="text-xs text-slate-400 mt-1">
                                {batTeamPlayer.name}
                            </div>
                        )}
                        <div className="text-xs text-green-400 uppercase tracking-widest font-bold mt-1">
                            Batting
                        </div>
                    </div>
                </div>
                <div className="flex gap-1 bg-slate-900/80 p-1 rounded-lg">
                    <button
                        onClick={() => setActiveTab('live')}
                        className={`px-6 py-2 rounded-md text-sm font-bold uppercase tracking-wider transition-all ${
                            activeTab === 'live'
                                ? 'bg-slate-700 text-brand-gold shadow-md'
                                : 'text-slate-500 hover:text-white'
                        }`}
                    >
                        <Tv size={14} className="inline mr-2 mb-0.5" />
                        Live
                    </button>
                    <button
                        onClick={() => setActiveTab('scorecard')}
                        className={`px-6 py-2 rounded-md text-sm font-bold uppercase tracking-wider transition-all ${
                            activeTab === 'scorecard'
                                ? 'bg-slate-700 text-brand-gold shadow-md'
                                : 'text-slate-500 hover:text-white'
                        }`}
                    >
                        <FileText size={14} className="inline mr-2 mb-0.5" />
                        Scorecard
                    </button>
                    <button
                        onClick={() => setActiveTab('dashboard')}
                        className={`px-6 py-2 rounded-md text-sm font-bold uppercase tracking-wider transition-all ${
                            activeTab === 'dashboard'
                                ? 'bg-slate-700 text-brand-gold shadow-md'
                                : 'text-slate-500 hover:text-white'
                        }`}
                    >
                        <Activity size={14} className="inline mr-2 mb-0.5" />
                        Dashboard
                    </button>
                    <button
                        onClick={() => setActiveTab('commentary')}
                        className={`px-6 py-2 rounded-md text-sm font-bold uppercase tracking-wider transition-all ${
                            activeTab === 'commentary'
                                ? 'bg-slate-700 text-brand-gold shadow-md'
                                : 'text-slate-500 hover:text-white'
                        }`}
                    >
                        <Mic size={14} className="inline mr-2 mb-0.5" />
                        Comm
                    </button>
                </div>
                <div className="text-right">
                    <div className="font-broadcast text-5xl text-white leading-none">
                        {matchState.score}/{matchState.wickets}
                    </div>
                    <div className="text-xs text-slate-400 uppercase tracking-widest font-bold text-right">
                        {oversStr} Overs
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 flex p-6 gap-6 z-10 min-h-0 overflow-hidden">
                {renderTabContent()}

                {/* Sidebar */}
                <div className="w-96 flex flex-col gap-4 h-full min-h-0">
                    <div className="flex-shrink-0 glass-panel p-4 rounded-xl">
                        <div className="text-xs text-slate-500 uppercase font-bold mb-3 tracking-widest">
                            Recent Deliveries (Last 2 Overs)
                        </div>
                        <div
                            className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar"
                            ref={recentBallsRef}
                        >
                            {matchState.recentBalls.length === 0 ? (
                                <span className="text-slate-600 text-sm italic">Waiting...</span>
                            ) : (
                                matchState.recentBalls.map((b, i) => (
                                    <div
                                        key={`${b}-${i}`}
                                        className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm shadow-md ${
                                            b === 'W'
                                                ? 'bg-red-600 text-white animate-hit'
                                                : b === '4'
                                                    ? 'bg-blue-600 text-white'
                                                    : b === '6'
                                                        ? 'bg-yellow-400 text-black font-extrabold border-2 border-white shadow-[0_0_15px_rgba(250,204,21,0.6)]'
                                                        : 'bg-slate-700 text-slate-300'
                                        }`}
                                    >
                                        {b}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="flex-1 glass-panel rounded-xl p-0 overflow-hidden flex flex-col min-h-0">
                        <div className="flex-shrink-0 p-3 bg-slate-800/80 border-b border-slate-700 text-xs font-bold uppercase tracking-widest text-slate-400">
                            Live Feed
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-3 font-sans text-sm text-slate-300 custom-scrollbar scroll-smooth">
                            {matchState.commentary.slice(-20).map((line, i) => (
                                <div
                                    key={`${line}-${i}`}
                                    className={`border-b border-slate-800/50 pb-2 last:border-0 ${
                                        line.includes('OUT')
                                            ? 'text-red-400 font-bold'
                                            : line.includes('SIX') || line.includes('FOUR')
                                                ? 'text-brand-gold'
                                                : ''
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
                                        onClick={bowlBall}
                                        className="w-full bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-500 hover:to-emerald-600 text-white font-broadcast text-3xl py-4 rounded-xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-3"
                                    >
                                        BOWL 1 BALL{' '}
                                        <span className="text-sm opacity-50 font-sans tracking-widest">
                      ⬤
                    </span>
                                    </button>
                                    <div className="grid grid-cols-4 gap-2">
                                        <button
                                            onClick={skipOver}
                                            className="bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 py-3 rounded-lg flex flex-col items-center gap-1 transition-colors"
                                        >
                                            <SkipForward size={14} /> End Over
                                        </button>
                                        <button
                                            onClick={skipFiveOvers}
                                            className="bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 py-3 rounded-lg flex flex-col items-center gap-1 transition-colors"
                                        >
                                            <FastForward size={14} /> +5 Overs
                                        </button>
                                        <button
                                            onClick={skipTenOvers}
                                            className="bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 py-3 rounded-lg flex flex-col items-center gap-1 transition-colors"
                                        >
                                            <FastForward size={14} /> +10 Overs
                                        </button>
                                        <button
                                            onClick={skipInnings}
                                            className="bg-slate-800 hover:bg-slate-700 text-xs font-bold text-red-400 py-3 rounded-lg flex flex-col items-center gap-1 transition-colors border border-red-900/30 hover:border-red-900"
                                        >
                                            <ChevronsRight size={14} /> End Inn
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <button
                                    onClick={handleInningsBreak}
                                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-broadcast text-2xl py-4 rounded-xl shadow-lg transition-all active:scale-95 animate-pulse"
                                >
                                    START 2ND INNINGS
                                </button>
                            )
                        ) : (
                            <>
                                {/* Match Summary */}
                                <div className="bg-slate-800/50 rounded-xl p-4 mb-4 space-y-3">
                                    <div className="text-center text-brand-gold font-bold text-sm uppercase tracking-widest mb-2">
                                        Match Summary
                                    </div>
                                    
                                    {/* Top Batsmen */}
                                    <div>
                                        <div className="text-xs text-slate-400 font-bold uppercase mb-2">Top Batsmen</div>
                                        <div className="space-y-1">
                                            {Object.entries(matchState.batsmanStats || {})
                                                .filter(([_, stats]) => stats.balls > 0)
                                                .sort((a, b) => b[1].runs - a[1].runs)
                                                .slice(0, 4)
                                                .map(([playerId, stats]) => {
                                                    const player = [...matchState.battingTeam.players, ...matchState.bowlingTeam.players]
                                                        .find(p => (p.instanceId || p.id) === playerId);
                                                    return (
                                                        <div key={playerId} className="flex justify-between text-xs bg-slate-900/50 p-2 rounded">
                                                            <span className="text-slate-300 truncate">{player?.name || 'Unknown'}</span>
                                                            <span className="text-brand-gold font-mono">{stats.runs}({stats.balls})</span>
                                                        </div>
                                                    );
                                                })}
                                        </div>
                                    </div>
                                    
                                    {/* Top Bowlers */}
                                    <div>
                                        <div className="text-xs text-slate-400 font-bold uppercase mb-2">Top Bowlers</div>
                                        <div className="space-y-1">
                                            {Object.entries(matchState.bowlerStats || {})
                                                .filter(([_, stats]) => stats.balls > 0)
                                                .sort((a, b) => b[1].wickets - a[1].wickets || a[1].runs - b[1].runs)
                                                .slice(0, 2)
                                                .map(([playerId, stats]) => {
                                                    const player = [...matchState.battingTeam.players, ...matchState.bowlingTeam.players]
                                                        .find(p => (p.instanceId || p.id) === playerId);
                                                    return (
                                                        <div key={playerId} className="flex justify-between text-xs bg-slate-900/50 p-2 rounded">
                                                            <span className="text-slate-300 truncate">{player?.name || 'Unknown'}</span>
                                                            <span className="text-brand-gold font-mono">{stats.wickets}/{stats.runs}</span>
                                                        </div>
                                                    );
                                                })}
                                        </div>
                                    </div>
                                </div>
                                
                                <button
                                    onClick={endMatch}
                                    className="w-full bg-brand-gold hover:bg-yellow-400 text-black font-bold py-4 rounded-xl shadow-lg transition-all transform hover:scale-105"
                                >
                                    {matchState.mode === 'tourn' ? 'Return to Hub' : 'Return to Menu'}
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MatchView;

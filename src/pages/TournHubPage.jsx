/**
 * TournHubPage.jsx
 * Tournament hub and match management page
 * Shows league standings, fixtures, match results, and bracket
 * Largest page component (~466 lines)
 * 
 * Props:
 * - tournPhase: Current tournament phase (league, semi, final, complete)
 * - tournTeams: Array of tournament teams
 * - fixtures: Array of tournament fixtures
 * - selectedFixture: Currently selected fixture for details view
 * - setSelectedFixture: Setter for selected fixture
 * - getTeamDisplay: Utility function to format team display info
 * - setView: Function to change current view
 * - handleStartTournamentFixture: Handler to start a fixture
 * - onlineRoom: Online room data if applicable
 * - TournamentLeaderboards: Tournament leaderboards component
 * - TournamentBracket: Tournament bracket component
 */

import React, { useEffect } from 'react';
import TournamentLeaderboards from '../components/tournament/TournamentLeaderboards';
import TournamentBracket from '../components/tournament/TournamentBracket';

const TournHubPage = ({
  tournPhase,
  tournTeams,
  fixtures,
  selectedFixture,
  setSelectedFixture,
  getTeamDisplay,
  setView,
  handleStartTournamentFixture,
  onlineRoom,
  socket,
  isOnline,
  isOnlineHost,
  matchEntryReady,
  setMatchEntryReady,
  pendingMatchFixture,
  setPendingMatchFixture,
  proceedToMatch,
  currentlyPlayingMatch,
}) => {
  // Auto-start match when both players mark as ready
  useEffect(() => {
    if (!pendingMatchFixture || !isOnline || !onlineRoom) return;
    
    const t1Player = onlineRoom.players?.find(p => p.side === pendingMatchFixture.t1);
    const t2Player = onlineRoom.players?.find(p => p.side === pendingMatchFixture.t2);
    
    // Check if both players are ready
    const bothReady = matchEntryReady[t1Player?.socketId] && matchEntryReady[t2Player?.socketId];
    
    if (bothReady) {
      console.log(`🎬 Both players ready! Starting match ${pendingMatchFixture.id}`);
      // Emit event to notify other player to start
      socket.emit("bothPlayersReady", {
        roomCode: onlineRoom.code,
        fixtureId: pendingMatchFixture.id
      });
      // Start the match immediately
      proceedToMatch(pendingMatchFixture);
    }
  }, [matchEntryReady, pendingMatchFixture, isOnline, onlineRoom, socket, proceedToMatch]);

  return (
      <div className="min-h-screen bg-slate-950 relative">
        <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-brand-gold/5 to-transparent pointer-events-none" />
        <div className="max-w-7xl mx-auto relative z-10 pb-32 p-8">
          <header className="flex justify-between items-end mb-12 border-b border-white/10 pb-8">
            <div>
              <h1 className="font-broadcast text-8xl text-transparent bg-clip-text bg-gradient-to-br from-brand-gold to-white drop-shadow-lg">
                {tournPhase === "league" ? "LEAGUE HUB" : tournPhase === "semi" ? "SEMI-FINALS" : tournPhase === "final" ? "FINAL" : "TOURNAMENT COMPLETE"}
              </h1>
              <div className="flex gap-4 text-sm uppercase tracking-widest text-slate-400 font-bold mt-2">
                <span>Season 1</span>
                <span className="text-brand-gold">•</span>
                <span>{tournTeams.length} Teams</span>
                {tournPhase !== "league" && <><span className="text-brand-gold">•</span><span className="text-brand-gold">Knockout Stage</span></>}
              </div>
            </div>
            <button
                onClick={() => {
                  if (confirm("End this season and return to menu?")) {
                    setView("menu");
                  }
                }}
                className="text-slate-500 hover:text-red-400 font-bold text-xs uppercase tracking-widest border border-slate-800 hover:border-red-900 px-6 py-3 rounded-full transition-colors"
            >
              End Season
            </button>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {tournPhase === "complete" && (
              <div className="lg:col-span-12 mb-8">
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-yellow-900/60 via-amber-800/60 to-orange-900/60 border-2 border-brand-gold shadow-2xl">
                  <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-50" />
                  <div className="relative z-10 p-8">
                    <div className="flex items-center justify-center gap-8">
                      <img src="https://www.iplt20.com/assets/images/ipl-trophy.png" alt="IPL Trophy" className="w-40 h-40 object-contain flex-shrink-0" />
                      
                      <div className="flex flex-col items-center gap-3">
                        <h2 className="font-broadcast text-4xl text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-brand-gold to-yellow-200 animate-pulse">
                          CHAMPIONS
                        </h2>
                        {(() => {
                          const finalFixture = fixtures.find(f => f.stage === "final");
                          const champion = tournTeams.find(t => t.id === finalFixture?.winner);
                          const display = getTeamDisplay(champion);
                          const player = onlineRoom?.players?.find(p => p.side === champion?.id);
                          return (
                            <>
                              {display.logo && (
                                <img src={display.logo} alt={display.shortName} className="w-16 h-16 object-contain" />
                              )}
                              <div className="font-broadcast text-3xl text-white">
                                {display.name || "TBD"}
                              </div>
                              {player && (
                                <div className="text-slate-300 text-lg">
                                  {player.name}
                                </div>
                              )}
                              <div className="text-brand-gold text-sm font-bold uppercase tracking-widest">
                                Season 1 Winners
                              </div>
                            </>
                          );
                        })()}
                      </div>
                      
                      <img src="https://www.iplt20.com/assets/images/ipl-logo-new-old.png" alt="IPL Logo" className="w-40 h-40 object-contain flex-shrink-0" />
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Tournament Leaderboards */}
            <div className="lg:col-span-12">
              <TournamentLeaderboards 
                fixtures={fixtures}
                tournTeams={tournTeams}
                getTeamDisplay={getTeamDisplay}
              />
            </div>
            
            <div className="lg:col-span-7">
              <div className="glass-panel rounded-3xl overflow-hidden">
                <div className="bg-slate-900/50 p-6 border-b border-white/5 flex justify-between items-center">
                  <h3 className="font-broadcast text-3xl text-white">
                    Points Table
                  </h3>
                  {tournPhase !== "league" && (
                    <span className="text-xs font-bold bg-slate-800 px-3 py-1 rounded-full text-slate-400">
                      League Stage Final
                    </span>
                  )}
                </div>
                <div className="p-2">
                  <table className="w-full text-left">
                    <thead className="bg-white/5 text-xs uppercase tracking-widest text-slate-400 font-bold">
                    <tr>
                      <th className="py-4 pl-6 rounded-l-lg">Team</th>
                      <th className="py-4 text-center">Played</th>
                      <th className="py-4 text-center">Won</th>
                      <th className="py-4 text-center">NRR</th>
                      <th className="py-4 text-right pr-6 rounded-r-lg">
                        Points
                      </th>
                    </tr>
                    </thead>
                    <tbody className="text-sm">
                    {[...tournTeams]
                        .sort((a, b) => {
                          if (b.pts !== a.pts) return b.pts - a.pts;
                          return (b.nrr || 0) - (a.nrr || 0);
                        })
                        .map((t, index) => (
                            <tr
                                key={t.id}
                                className="border-b border-slate-800/50 hover:bg-white/5 transition-colors group"
                            >
                              <td className="py-5 pl-6">
                                <div className="flex items-center gap-4">
                                  <span
                                      className={`font-broadcast text-xl w-6 ${
                                          index === 0 ? "text-brand-gold" : "text-slate-600"
                                      }`}
                                  >
                                    {(index + 1).toString().padStart(2, "0")}
                                  </span>
                                  {(() => {
                                    const display = getTeamDisplay(t);
                                    return display.logo && (
                                      <img src={display.logo} alt={display.shortName} className="w-6 h-6 object-contain" />
                                    );
                                  })()}
                                  <span className="font-bold text-lg text-slate-200 group-hover:text-white transition-colors">
                                    {getTeamDisplay(t).name}
                                  </span>
                                </div>
                              </td>
                              <td className="py-5 text-center text-slate-400 font-mono">
                                {t.played}
                              </td>
                              <td className="py-5 text-center text-green-400 font-bold font-mono">
                                {t.won}
                              </td>
                              <td className="py-5 text-center text-slate-300 font-mono">
                                {(t.nrr || 0).toFixed(2)}
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
              
              {/* Tournament Bracket */}
              {fixtures.length > 0 && (
                <div className="mt-8">
                  <TournamentBracket 
                    fixtures={fixtures}
                    tournTeams={tournTeams}
                    getTeamDisplay={getTeamDisplay}
                    tournPhase={tournPhase}
                  />
                </div>
              )}
            </div>

            <div className="lg:col-span-5">
              <div className="glass-panel rounded-3xl overflow-hidden flex flex-col h-full">
                <div className="bg-slate-900/50 p-6 border-b border-white/5 flex justify-between items-center">
                  <h3 className="font-broadcast text-3xl text-white">
                    Match Schedule
                  </h3>
                  <div className="text-xs font-bold bg-slate-800 px-3 py-1 rounded-full text-slate-400">
                    {fixtures.filter((f) => f.played).length} / {fixtures.length} Done
                  </div>
                </div>
                <div className="p-4 space-y-3 overflow-y-auto max-h-[600px] custom-scrollbar">
                  {fixtures.map((f, index) => {
                    const t1 = tournTeams.find((t) => t.id === f.t1);
                    const t2 = tournTeams.find((t) => t.id === f.t2);
                    if (!t1 || !t2) return null;

                    // Get first unplayed fixture
                    const firstUnplayedIndex = fixtures.findIndex(fixture => !fixture.played);
                    const isFirstMatch = index === firstUnplayedIndex;
                    
                    // Check if current player is participating in this match
                    let isParticipant = false;
                    if (isOnline && onlineRoom && socket) {
                      const myTeamId = onlineRoom.players?.find(p => p.socketId === socket.id)?.side;
                      isParticipant = myTeamId === f.t1 || myTeamId === f.t2;
                    } else {
                      // In offline mode, player controls both teams, so always a participant
                      isParticipant = true;
                    }

                    const isKnockout = f.stage === "semi" || f.stage === "final";
                    const isFinal = f.stage === "final";
                    const isWinner1 = f.winner === t1.id;
                    const isWinner2 = f.winner === t2.id;

                    return (
                        <div
                            key={f.id}
                            className={`group p-4 rounded-2xl border flex justify-between items-center transition-all ${
                                f.played
                                    ? isKnockout
                                      ? isFinal
                                        ? "bg-gradient-to-br from-yellow-900/20 via-amber-900/20 to-orange-900/20 border-brand-gold/50"
                                        : "bg-gradient-to-br from-purple-900/20 via-pink-900/20 to-red-900/20 border-purple-500/50"
                                      : "bg-slate-900/30 border-slate-700/50"
                                    : isKnockout
                                    ? isFinal
                                      ? "bg-gradient-to-br from-yellow-900/40 via-amber-900/40 to-orange-900/40 border-brand-gold shadow-2xl shadow-brand-gold/20"
                                      : "bg-gradient-to-br from-purple-900/40 via-pink-900/40 to-red-900/40 border-purple-500 shadow-xl shadow-purple-500/20"
                                    : "bg-gradient-to-r from-slate-800 to-slate-900 border-slate-700 hover:border-brand-gold/30 shadow-lg"
                            } ${isKnockout && !f.played ? "scale-105" : ""} ${!f.played && !isFirstMatch ? "opacity-50" : ""}`}
                            title={!f.played && !isFirstMatch ? "Only the first match can be played" : ""}
                        >
                          <div className="flex flex-col gap-1 flex-1 min-w-0">
                            {isKnockout && (
                              <div className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${isFinal ? "text-brand-gold" : "text-purple-400"}`}>
                                {isFinal ? "🏆 GRAND FINAL" : "⚡ SEMI-FINAL"}
                              </div>
                            )}
                            <div className="flex items-center gap-2 justify-between">
                              <div className="flex items-center gap-2 min-w-0 flex-1">
                                <div className={`w-1 ${isKnockout ? "h-10" : "h-8"} ${isWinner1 ? "bg-green-500" : "bg-blue-500"} rounded-full flex-shrink-0`} />
                                {(() => {
                                  const display = getTeamDisplay(t1);
                                  return display.logo && (
                                    <img src={display.logo} alt={display.shortName} className="w-6 h-6 object-contain flex-shrink-0" />
                                  );
                                })()}
                                <span className={`font-broadcast tracking-wide truncate ${isKnockout ? "text-xl" : "text-lg"} ${isWinner1 ? "text-green-400 font-bold" : "text-slate-200"}`}>
                                  {getTeamDisplay(t1).name}
                                </span>
                              </div>
                              {f.played && f.innings1 && (
                                <span className={`text-sm font-mono flex-shrink-0 ${f.innings1.teamId === t1.id && isWinner1 ? "text-green-400 font-bold" : "text-slate-400"}`}>
                                  {f.innings1.teamId === t1.id ? `${f.innings1.score}/${f.innings1.wickets}` : f.innings2 ? `${f.innings2.score}/${f.innings2.wickets}` : "-"}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 justify-between">
                              <div className="flex items-center gap-2 min-w-0 flex-1">
                                <div className={`w-1 ${isKnockout ? "h-10" : "h-8"} ${isWinner2 ? "bg-green-500" : "bg-red-500"} rounded-full flex-shrink-0`} />
                                {(() => {
                                  const display = getTeamDisplay(t2);
                                  return display.logo && (
                                    <img src={display.logo} alt={display.shortName} className="w-6 h-6 object-contain flex-shrink-0" />
                                  );
                                })()}
                                <span className={`font-broadcast tracking-wide truncate ${isKnockout ? "text-xl" : "text-lg"} ${isWinner2 ? "text-green-400 font-bold" : "text-slate-200"}`}>
                                  {getTeamDisplay(t2).name}
                                </span>
                              </div>
                              {f.played && f.innings2 && (
                                <span className={`text-sm font-mono flex-shrink-0 ${f.innings2.teamId === t2.id && isWinner2 ? "text-green-400 font-bold" : "text-slate-400"}`}>
                                  {f.innings2.teamId === t2.id ? `${f.innings2.score}/${f.innings2.wickets}` : f.innings1 ? `${f.innings1.score}/${f.innings1.wickets}` : "-"}
                                </span>
                              )}
                            </div>
                            {f.played && f.winner && f.winner !== "Tie" && (
                              <div className="text-[10px] text-green-500 font-bold uppercase tracking-widest mt-1">
                                {tournTeams.find(t => t.id === f.winner)?.name} Won
                              </div>
                            )}
                            {f.played && f.winner === "Tie" && (
                              <div className="text-[10px] text-yellow-500 font-bold uppercase tracking-widest mt-1">
                                Match Tied
                              </div>
                            )}
                          </div>
                          {!f.played ? (
                              currentlyPlayingMatch === f.id && !isParticipant ? (
                                // Spectator can watch a currently playing match
                                <button
                                    onClick={() => {
                                      proceedToMatch(f, true);
                                    }}
                                    className="flex-shrink-0 ml-2 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-500 hover:to-pink-500 text-white text-xs px-4 py-2 rounded-lg transition-colors font-bold uppercase tracking-wider animate-pulse"
                                    title="Watch this match that is currently live"
                                >
                                  🔴 WATCH LIVE
                                </button>
                              ) : isFirstMatch ? (
                                isParticipant ? (
                                  <button
                                      onClick={() => handleStartTournamentFixture(f)}
                                      className={`flex-shrink-0 ml-2 ${
                                        isKnockout
                                          ? isFinal
                                            ? "bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 h-14 w-14 text-xl"
                                            : "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 h-12 w-12 text-lg"
                                          : "bg-white hover:bg-brand-gold h-10 w-10"
                                      } text-black rounded-full flex items-center justify-center transition-all shadow-lg group-hover:scale-110`}
                                      title="You are playing in this match"
                                  >
                                    ▶
                                  </button>
                                ) : (
                                  <button
                                      onClick={() => handleStartTournamentFixture(f)}
                                      className="flex-shrink-0 ml-2 bg-slate-600 hover:bg-slate-500 text-white text-xs px-3 py-2 rounded-lg transition-colors font-bold uppercase tracking-wider"
                                      title="Watch this match as a spectator"
                                  >
                                    Spectate
                                  </button>
                                )
                              ) : (
                                <div className="flex-shrink-0 ml-2 bg-slate-700 text-slate-400 text-xs px-3 py-2 rounded-lg font-bold uppercase tracking-wider opacity-50 cursor-not-allowed">
                                  Locked
                                </div>
                              )
                          ) : (
                              <button
                                  onClick={() => setSelectedFixture(f)}
                                  className="flex-shrink-0 ml-2 bg-slate-700 hover:bg-slate-600 text-white text-xs px-3 py-2 rounded-lg transition-colors font-bold uppercase tracking-wider"
                              >
                                View
                              </button>
                          )}
                        </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
          
          {/* Match Summary Modal */}
          {selectedFixture && selectedFixture.played && (
            <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setSelectedFixture(null)}>
              <div className="bg-slate-900 rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-slate-700" onClick={(e) => e.stopPropagation()}>
                <div className="p-6 border-b border-slate-700 flex justify-between items-center sticky top-0 bg-slate-900 z-10">
                  <h2 className="font-broadcast text-3xl text-white">Match Summary</h2>
                  <button onClick={() => setSelectedFixture(null)} className="text-slate-400 hover:text-white text-2xl">×</button>
                </div>
                <div className="p-6 space-y-6">
                  {(() => {
                    const t1 = tournTeams.find(t => t.id === selectedFixture.t1);
                    const t2 = tournTeams.find(t => t.id === selectedFixture.t2);
                    const { innings1, innings2, winner, batsmanStats, bowlerStats } = selectedFixture;
                    
                    if (!t1 || !t2 || !innings1 || !innings2) return <div className="text-slate-400">No data available</div>;
                    
                    // Get top performers
                    const getTopBatsmen = (teamId, count = 4) => {
                      const team = tournTeams.find(t => t.id === teamId);
                      if (!team || !batsmanStats) return [];
                      return team.players
                        .map(p => ({ ...p, stats: batsmanStats[p.instanceId || p.id] }))
                        .filter(p => p.stats && p.stats.balls > 0)
                        .sort((a, b) => b.stats.runs - a.stats.runs)
                        .slice(0, count);
                    };
                    
                    const getTopBowlers = (teamId, count = 2) => {
                      const team = tournTeams.find(t => t.id === teamId);
                      if (!team || !bowlerStats) return [];
                      return team.players
                        .map(p => ({ ...p, stats: bowlerStats[p.instanceId || p.id] }))
                        .filter(p => p.stats && p.stats.balls > 0)
                        .sort((a, b) => b.stats.wickets - a.stats.wickets || a.stats.runs - b.stats.runs)
                        .slice(0, count);
                    };
                    
                    const t1Batsmen = getTopBatsmen(t1.id);
                    const t2Batsmen = getTopBatsmen(t2.id);
                    const t1Bowlers = getTopBowlers(t1.id);
                    const t2Bowlers = getTopBowlers(t2.id);
                    
                    return (
                      <>
                        <div className="text-center py-4 border-b border-slate-700">
                          <div className="text-brand-gold font-bold text-sm uppercase tracking-widest mb-2">Result</div>
                          <div className="flex items-center justify-center gap-3">
                            {(() => {
                              const winnerTeam = tournTeams.find(t => t.id === winner);
                              const display = getTeamDisplay(winnerTeam);
                              return winner !== "Tie" && display.logo && (
                                <img src={display.logo} alt={display.shortName} className="w-8 h-8 object-contain" />
                              );
                            })()}
                            <div className="text-2xl font-broadcast text-white">
                              {winner === "Tie" ? "Match Tied" : `${getTeamDisplay(tournTeams.find(t => t.id === winner)).name} Won`}
                            </div>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-slate-800/50 p-4 rounded-xl">
                            <div className="flex items-center gap-2 mb-2">
                              {(() => {
                                const display = getTeamDisplay(t1);
                                return display.logo && (
                                  <img src={display.logo} alt={display.shortName} className="w-6 h-6 object-contain" />
                                );
                              })()}
                              <div className="font-broadcast text-xl text-white">{getTeamDisplay(t1).name}</div>
                            </div>
                            <div className="text-3xl font-bold text-brand-gold">
                              {innings1.teamId === t1.id 
                                ? `${innings1.score}/${innings1.wickets}` 
                                : `${innings2.score}/${innings2.wickets}`}
                            </div>
                            <div className="text-sm text-slate-400 mt-1">
                              ({innings1.teamId === t1.id 
                                ? Math.floor(innings1.overs) 
                                : Math.floor(innings2.overs)} overs)
                            </div>
                          </div>
                          <div className="bg-slate-800/50 p-4 rounded-xl">
                            <div className="flex items-center gap-2 mb-2">
                              {(() => {
                                const display = getTeamDisplay(t2);
                                return display.logo && (
                                  <img src={display.logo} alt={display.shortName} className="w-6 h-6 object-contain" />
                                );
                              })()}
                              <div className="font-broadcast text-xl text-white">{getTeamDisplay(t2).name}</div>
                            </div>
                            <div className="text-3xl font-bold text-brand-gold">
                              {innings2.teamId === t2.id 
                                ? `${innings2.score}/${innings2.wickets}` 
                                : `${innings1.score}/${innings1.wickets}`}
                            </div>
                            <div className="text-sm text-slate-400 mt-1">
                              ({innings2.teamId === t2.id 
                                ? Math.floor(innings2.overs) 
                                : Math.floor(innings1.overs)} overs)
                            </div>
                          </div>
                        </div>
                        
                        {batsmanStats && bowlerStats && (
                          <div className="grid grid-cols-2 gap-6">
                            {/* Team 1 Stats */}
                            <div className="space-y-4">
                              <div>
                                <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-3">Top Batsmen - {t1.name}</h3>
                                <div className="space-y-2">
                                  {t1Batsmen.map((p, i) => (
                                    <div key={i} className="flex justify-between text-sm bg-slate-800/30 p-2 rounded">
                                      <span className="text-slate-300">{p.name}</span>
                                      <span className="text-brand-gold font-mono">{p.stats.runs}({p.stats.balls})</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                              <div>
                                <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-3">Top Bowlers - {t1.name}</h3>
                                <div className="space-y-2">
                                  {t1Bowlers.map((p, i) => (
                                    <div key={i} className="flex justify-between text-sm bg-slate-800/30 p-2 rounded">
                                      <span className="text-slate-300">{p.name}</span>
                                      <span className="text-brand-gold font-mono">{p.stats.wickets}/{p.stats.runs}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                            
                            {/* Team 2 Stats */}
                            <div className="space-y-4">
                              <div>
                                <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-3">Top Batsmen - {t2.name}</h3>
                                <div className="space-y-2">
                                  {t2Batsmen.map((p, i) => (
                                    <div key={i} className="flex justify-between text-sm bg-slate-800/30 p-2 rounded">
                                      <span className="text-slate-300">{p.name}</span>
                                      <span className="text-brand-gold font-mono">{p.stats.runs}({p.stats.balls})</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                              <div>
                                <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-3">Top Bowlers - {t2.name}</h3>
                                <div className="space-y-2">
                                  {t2Bowlers.map((p, i) => (
                                    <div key={i} className="flex justify-between text-sm bg-slate-800/30 p-2 rounded">
                                      <span className="text-slate-300">{p.name}</span>
                                      <span className="text-brand-gold font-mono">{p.stats.wickets}/{p.stats.runs}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Match Entry Ready Screen */}
        {pendingMatchFixture && isOnline && onlineRoom && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-900 rounded-3xl max-w-2xl w-full border-2 border-blue-500 shadow-2xl shadow-blue-900/50 p-8">
              <h2 className="font-broadcast text-4xl text-center text-white mb-8">Ready to Enter Match?</h2>
              
              {(() => {
                const t1 = tournTeams.find(t => t.id === pendingMatchFixture.t1);
                const t2 = tournTeams.find(t => t.id === pendingMatchFixture.t2);
                const myTeamId = onlineRoom.players?.find(p => p.socketId === socket.id)?.side;
                const isParticipant = myTeamId === pendingMatchFixture.t1 || myTeamId === pendingMatchFixture.t2;
                
                const t1Player = onlineRoom.players?.find(p => p.side === pendingMatchFixture.t1);
                const t2Player = onlineRoom.players?.find(p => p.side === pendingMatchFixture.t2);
                
                return (
                  <div className="space-y-8">
                    {/* Teams Display */}
                    <div className="grid grid-cols-2 gap-6">
                      <div className="bg-blue-900/30 border border-blue-500 rounded-xl p-6 text-center">
                        {t1?.id && <img src={getTeamDisplay(t1).logo} alt={t1.name} className="w-12 h-12 mx-auto mb-3 object-contain" />}
                        <div className="font-broadcast text-xl text-white mb-2">{t1?.name}</div>
                        <div className="text-sm text-slate-400">{t1Player?.name || "Waiting..."}</div>
                        {matchEntryReady[t1Player?.socketId] && (
                          <div className="text-green-400 font-bold text-xs mt-2">✓ READY</div>
                        )}
                      </div>
                      
                      <div className="bg-red-900/30 border border-red-500 rounded-xl p-6 text-center">
                        {t2?.id && <img src={getTeamDisplay(t2).logo} alt={t2.name} className="w-12 h-12 mx-auto mb-3 object-contain" />}
                        <div className="font-broadcast text-xl text-white mb-2">{t2?.name}</div>
                        <div className="text-sm text-slate-400">{t2Player?.name || "Waiting..."}</div>
                        {matchEntryReady[t2Player?.socketId] && (
                          <div className="text-green-400 font-bold text-xs mt-2">✓ READY</div>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-4 justify-center">
                      {isParticipant ? (
                        <>
                          <button
                            onClick={() => {
                              setMatchEntryReady(prev => ({
                                ...prev,
                                [socket.id]: true
                              }));
                              socket.emit("matchEntryReady", {
                                roomCode: onlineRoom.code,
                                fixtureId: pendingMatchFixture.id,
                                socketId: socket.id
                              });
                              console.log("✓ Ready for match");
                            }}
                            disabled={matchEntryReady[socket.id]}
                            className="px-10 py-3 bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-500 hover:to-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-broadcast text-lg rounded-full transition-all"
                          >
                            {matchEntryReady[socket.id] ? "✓ YOU'RE READY!" : "MARK AS READY"}
                          </button>
                        </>
                      ) : (
                        <div className="text-center text-slate-300 py-4">
                          <p className="mb-4">You are spectating this match</p>
                          <button
                            onClick={() => {
                              proceedToMatch(pendingMatchFixture, true);
                            }}
                            className="px-10 py-3 bg-slate-600 hover:bg-slate-500 text-white font-bold text-sm rounded-lg transition-colors"
                          >
                            Watch Match
                          </button>
                        </div>
                      )}
                      
                      <button
                        onClick={() => {
                          setPendingMatchFixture(null);
                          setMatchEntryReady({});
                        }}
                        className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-bold text-sm rounded-full transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* Navigation Footer */}
        <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-slate-950 to-slate-950/80 border-t border-slate-700/50 px-8 py-6 flex justify-between items-center gap-4 flex-wrap z-10">
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
              onClick={() => {
                setOnlineGameType("tournament");
                setOnlineRoom(null);
                setJoinCode("");
                setJoinError("");
                setView("online_entry");
              }}
              className="px-6 py-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs uppercase tracking-wider transition-colors"
            >
              🌐 Online
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

export default TournHubPage;

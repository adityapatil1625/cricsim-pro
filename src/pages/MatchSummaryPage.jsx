/**
 * MatchSummaryPage.jsx
 * Detailed match scorecard and statistics page
 * 
 * Props:
 * - matchState: Complete match state
 * - getTeamDisplay: Function to get team display info
 * - setView: Function to change current view
 */

import React, { useState } from 'react';
import { ChevronLeft } from '../components/shared/Icons';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

const MatchSummaryPage = ({
  matchState,
  getTeamDisplay,
  setView,
}) => {
  const [activeInnings, setActiveInnings] = useState(1);

  if (!matchState) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <p className="text-slate-400">No match data available</p>
      </div>
    );
  }

  const { teamA, teamB, innings1, innings2, batsmanStats, bowlerStats, winner } = matchState;

  // Format overs properly (e.g., 17.4 instead of 17.666...)
  const formatOvers = (decimalOvers) => {
    if (!decimalOvers && decimalOvers !== 0) return '0.0';
    const overs = Math.floor(decimalOvers);
    const balls = Math.round((decimalOvers - overs) * 6);
    return `${overs}.${balls}`;
  };

  // Get innings data
  const getInningsData = (inningsNum) => {
    if (inningsNum === 1) return innings1;
    return innings2;
  };

  // Calculate wickets for an innings
  const getWicketsForInnings = (inningsTeam) => {
    if (!batsmanStats || typeof batsmanStats !== 'object') return 0;
    
    const allBatsmen = Object.entries(batsmanStats).map(([playerId, stats]) => ({
      batsmanId: playerId,
      ...stats
    }));

    const teamBatsmen = allBatsmen.filter(stat => {
      const player = inningsTeam?.players?.find(p => (p.instanceId || p.id) === stat.batsmanId);
      return !!player;
    });

    // Count how many batsmen were out (but cap at 10, as max 10 can be dismissed)
    const outsCount = teamBatsmen.filter(stat => stat.out === true).length;
    return Math.min(outsCount, 10);
  };

  // Generate cumulative runs data for chart
  const generateRunsData = (inningsNum) => {
    const innings = getInningsData(inningsNum);
    
    if (!innings) return [];

    const totalRuns = innings.score || 0;
    const totalOvers = innings.overs || 1;
    const oversPlayed = Math.min(totalOvers, 20); // Max 20 overs
    
    // Distribute runs across overs more realistically
    const data = [];
    
    // Calculate base runs per over phase
    const powerplayOvers = Math.min(6, oversPlayed);
    const middleOvers = Math.min(9, oversPlayed - 6);
    const deathOvers = Math.max(0, oversPlayed - 15);
    
    // Distribute total runs based on phases
    const powerplayRuns = Math.round(totalRuns * 0.25); // 25% in powerplay
    const middleRuns = Math.round(totalRuns * 0.40); // 40% in middle
    const deathRuns = totalRuns - powerplayRuns - middleRuns; // Rest in death
    
    for (let over = 0; over <= Math.ceil(oversPlayed); over++) {
      let phaseRuns = 0;
      
      if (over === 0) {
        phaseRuns = 0;
      } else if (over <= powerplayOvers) {
        // Powerplay phase
        phaseRuns = Math.round(powerplayRuns / powerplayOvers) + (Math.random() > 0.5 ? 1 : -1);
      } else if (over <= powerplayOvers + middleOvers) {
        // Middle overs phase
        phaseRuns = Math.round(middleRuns / (middleOvers || 1)) + (Math.random() > 0.5 ? 1 : -1);
      } else if (over <= oversPlayed) {
        // Death overs phase
        const remainingOvers = Math.max(1, oversPlayed - (powerplayOvers + middleOvers));
        phaseRuns = Math.round(deathRuns / remainingOvers) + (Math.random() > 0.5 ? 2 : -1);
      } else {
        break;
      }
      
      phaseRuns = Math.max(0, phaseRuns);
      
      data.push({
        over: over.toString(),
        runs: phaseRuns
      });
    }
    
    return data;
  };

  // Generate batting comparison data
  const getBattingComparisonData = (inningsNum) => {
    const innings = getInningsData(inningsNum);
    const team = inningsNum === 1 ? (innings?.teamId === teamA.id ? teamA : teamB) : (innings?.teamId === teamA.id ? teamA : teamB);
    
    if (!innings || !batsmanStats || typeof batsmanStats !== 'object') return [];

    const allBatsmen = Object.entries(batsmanStats).map(([playerId, stats]) => ({
      batsmanId: playerId,
      ...stats
    }));

    return allBatsmen
      .filter(stat => {
        const player = team?.players?.find(p => (p.instanceId || p.id) === stat.batsmanId);
        return !!player && stat.balls > 0;
      })
      .map(stat => {
        const player = team?.players?.find(p => (p.instanceId || p.id) === stat.batsmanId);
        const strikeRate = stat.balls > 0 ? ((stat.runs / stat.balls) * 100).toFixed(1) : 0;
        return {
          name: player?.name || 'Unknown',
          runs: stat.runs || 0,
          strikeRate: parseFloat(strikeRate),
          balls: stat.balls || 0
        };
      })
      .sort((a, b) => b.runs - a.runs)
      .slice(0, 6); // Top 6 batsmen
  };

  // Generate bowling comparison data
  const getBowlingComparisonData = (inningsNum) => {
    const currentInnings = inningsNum === 1 ? innings1 : innings2;
    if (!currentInnings || !bowlerStats || typeof bowlerStats !== 'object') return [];

    const battingTeamId = currentInnings.teamId;
    const bowlingTeam = battingTeamId === teamA.id ? teamB : teamA;

    const allBowlers = Object.entries(bowlerStats).map(([playerId, stats]) => ({
      bowlerId: playerId,
      ...stats
    }));

    return allBowlers
      .filter(stat => {
        const player = bowlingTeam?.players?.find(p => (p.instanceId || p.id) === stat.bowlerId);
        return !!player && stat.balls > 0;
      })
      .map(stat => {
        const player = bowlingTeam?.players?.find(p => (p.instanceId || p.id) === stat.bowlerId);
        const overs = stat.balls / 6;
        const economy = overs > 0 ? (stat.runs / overs).toFixed(2) : 0;
        return {
          name: player?.name || 'Unknown',
          wickets: stat.wickets || 0,
          runs: stat.runs || 0,
          economy: parseFloat(economy),
          overs: overs.toFixed(1)
        };
      })
      .sort((a, b) => b.wickets - a.wickets)
      .slice(0, 5); // Top 5 bowlers
  };

  const renderBattingStats = (inningsNum) => {
    const innings = getInningsData(inningsNum);
    const team = inningsNum === 1 ? (innings?.teamId === teamA.id ? teamA : teamB) : (innings?.teamId === teamA.id ? teamA : teamB);
    
    if (!innings || !batsmanStats || typeof batsmanStats !== 'object') return null;

    // Convert batsmanStats object to array and filter for this team
    const allBatsmen = Object.entries(batsmanStats).map(([playerId, stats]) => ({
      batsmanId: playerId,
      ...stats
    }));

    const teamBatsmen = allBatsmen.filter(stat => {
      const player = team?.players?.find(p => (p.instanceId || p.id) === stat.batsmanId);
      return !!player;
    });

    return (
      <div className="mb-8">
        <h3 className="text-xl font-broadcast text-white mb-4 uppercase">
          {team?.name || `Team ${inningsNum}`} Batting
        </h3>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-600 bg-slate-900/50">
                <th className="px-4 py-3 text-left text-slate-300">Player</th>
                <th className="px-4 py-3 text-right text-slate-300">Runs</th>
                <th className="px-4 py-3 text-right text-slate-300">Balls</th>
                <th className="px-4 py-3 text-right text-slate-300">SR</th>
                <th className="px-4 py-3 text-right text-slate-300">4s</th>
                <th className="px-4 py-3 text-right text-slate-300">6s</th>
                <th className="px-4 py-3 text-center text-slate-300">Out</th>
              </tr>
            </thead>
            <tbody>
              {teamBatsmen.filter(stat => stat.balls > 0).length > 0 ? (
                teamBatsmen.filter(stat => stat.balls > 0).map((stat) => {
                  const strikeRate = stat.balls > 0 ? ((stat.runs / stat.balls) * 100).toFixed(2) : 0;
                  const player = team?.players?.find(p => (p.instanceId || p.id) === stat.batsmanId);
                  
                  return (
                    <tr key={stat.batsmanId} className="border-b border-slate-700/50 hover:bg-slate-800/30 transition-colors">
                      <td className="px-4 py-3 text-slate-100 font-semibold">{player?.name || 'Unknown'}</td>
                      <td className="px-4 py-3 text-right text-slate-100">{stat.runs || 0}</td>
                      <td className="px-4 py-3 text-right text-slate-400">{stat.balls || 0}</td>
                      <td className="px-4 py-3 text-right text-sky-300">{strikeRate}</td>
                      <td className="px-4 py-3 text-right text-emerald-400">{stat.fours || 0}</td>
                      <td className="px-4 py-3 text-right text-red-400">{stat.sixes || 0}</td>
                      <td className="px-4 py-3 text-center text-slate-400">{stat.out ? '✓' : '-'}</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="7" className="px-4 py-3 text-center text-slate-400">No batting data</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Batters Yet to Bat */}
        <div className="mt-6 mb-8">
          <h4 className="text-lg font-broadcast text-white mb-3 uppercase">Yet to Bat</h4>
          <div className="flex flex-wrap gap-2">
            {team?.players
              .filter(p => !batsmanStats || !batsmanStats[p.instanceId] || batsmanStats[p.instanceId].balls === 0)
              .map(p => (
                <div key={p.instanceId} className="px-3 py-1 rounded-full bg-slate-700/50 border border-slate-600 text-sm text-slate-300">
                  {p.name}
                </div>
              ))}
          </div>
        </div>

        {innings && (
          <div className="mt-4 grid grid-cols-2 gap-4 bg-slate-900/50 p-4 rounded-lg">
            <div>
              <p className="text-slate-400 text-sm uppercase">Total Runs</p>
              <p className="text-2xl font-broadcast text-white">{innings.score}</p>
            </div>
            <div>
              <p className="text-slate-400 text-sm uppercase">Overs</p>
              <p className="text-2xl font-broadcast text-white">{formatOvers(innings.overs)}</p>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderBowlingStats = (inningsNum) => {
    const currentInnings = inningsNum === 1 ? innings1 : innings2;
    
    if (!currentInnings || !bowlerStats || typeof bowlerStats !== 'object') return null;

    // Determine which team batted and which team bowled in this innings
    const battingTeamId = currentInnings.teamId;
    const bowlingTeam = battingTeamId === teamA.id ? teamB : teamA;
    
    // Convert bowlerStats object to array and filter for the bowling team
    const allBowlers = Object.entries(bowlerStats).map(([playerId, stats]) => ({
      bowlerId: playerId,
      ...stats
    }));

    const teamBowlers = allBowlers.filter(stat => {
      const player = bowlingTeam?.players?.find(p => (p.instanceId || p.id) === stat.bowlerId);
      // Only show bowlers who actually bowled (have balls > 0)
      return !!player && stat.balls > 0;
    });

    return (
      <div className="mb-8">
        <h3 className="text-xl font-broadcast text-white mb-4 uppercase">
          {bowlingTeam?.name || `Team ${inningsNum === 1 ? 2 : 1}`} Bowling
        </h3>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-600 bg-slate-900/50">
                <th className="px-4 py-3 text-left text-slate-300">Bowler</th>
                <th className="px-4 py-3 text-right text-slate-300">Overs</th>
                <th className="px-4 py-3 text-right text-slate-300">Runs</th>
                <th className="px-4 py-3 text-right text-slate-300">Wickets</th>
                <th className="px-4 py-3 text-right text-slate-300">Economy</th>
              </tr>
            </thead>
            <tbody>
              {teamBowlers.length > 0 ? (
                teamBowlers.map((stat) => {
                  const overs = Math.floor(stat.balls / 6);
                  const ballsInLastOver = stat.balls % 6;
                  const oversStr = `${overs}.${ballsInLastOver}`;
                  const economy = overs > 0 ? (stat.runs / overs).toFixed(2) : 0;
                  const player = bowlingTeam?.players?.find(p => (p.instanceId || p.id) === stat.bowlerId);
                  
                  return (
                    <tr key={stat.bowlerId} className="border-b border-slate-700/50 hover:bg-slate-800/30 transition-colors">
                      <td className="px-4 py-3 text-slate-100 font-semibold">{player?.name || 'Unknown'}</td>
                      <td className="px-4 py-3 text-right text-slate-400">{oversStr}</td>
                      <td className="px-4 py-3 text-right text-slate-100">{stat.runs || 0}</td>
                      <td className="px-4 py-3 text-right text-emerald-400 font-semibold">{stat.wickets || 0}</td>
                      <td className="px-4 py-3 text-right text-orange-400">{economy}</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="5" className="px-4 py-3 text-center text-slate-400">No bowling data</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 overflow-y-auto">
      {/* Background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/10 via-slate-950 to-slate-950" />

      {/* Content */}
      <div className="relative z-10 w-full max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-broadcast text-4xl text-white">MATCH SCORECARD</h1>
          <button
            onClick={() => setView("match")}
            className="flex items-center gap-2 px-4 py-2 rounded-full border border-slate-700 text-slate-400 hover:text-white hover:border-white hover:bg-white/5 transition-all font-bold text-xs uppercase tracking-widest"
          >
            <ChevronLeft size={16} /> Back to Match
          </button>
        </div>

        {/* Match Info */}
        <div className="glass-panel rounded-2xl p-6 mb-8 bg-slate-950/80">
          <div className="grid grid-cols-2 gap-8">
            {/* Innings 1 Team */}
            <div className="flex items-center gap-4">
              {innings1 && (
                <>
                  {innings1.teamId === teamA.id ? (
                    <>
                      {getTeamDisplay(teamA)?.logo && (
                        <img src={getTeamDisplay(teamA).logo} alt={teamA.name} className="w-16 h-16 object-contain" />
                      )}
                      <div>
                        <p className="text-slate-400 text-sm">INNINGS 1</p>
                        <p className="text-2xl font-broadcast text-white">{teamA?.name || 'Team A'}</p>
                        {innings1 && (
                          <p className="text-lg text-sky-300 font-semibold">{innings1.score}/{getWicketsForInnings(teamA)}</p>
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      {getTeamDisplay(teamB)?.logo && (
                        <img src={getTeamDisplay(teamB).logo} alt={teamB.name} className="w-16 h-16 object-contain" />
                      )}
                      <div>
                        <p className="text-slate-400 text-sm">INNINGS 1</p>
                        <p className="text-2xl font-broadcast text-white">{teamB?.name || 'Team B'}</p>
                        {innings1 && (
                          <p className="text-lg text-sky-300 font-semibold">{innings1.score}/{getWicketsForInnings(teamB)}</p>
                        )}
                      </div>
                    </>
                  )}
                </>
              )}
            </div>

            {/* Innings 2 Team */}
            <div className="flex items-center gap-4">
              {innings1 && (
                <>
                  {innings1.teamId === teamA.id ? (
                    <>
                      {getTeamDisplay(teamB)?.logo && (
                        <img src={getTeamDisplay(teamB).logo} alt={teamB.name} className="w-16 h-16 object-contain" />
                      )}
                      <div>
                        <p className="text-slate-400 text-sm">INNINGS 2</p>
                        <p className="text-2xl font-broadcast text-white">{teamB?.name || 'Team B'}</p>
                        {innings2 && (
                          <p className="text-lg text-sky-300 font-semibold">{innings2.score}/{getWicketsForInnings(teamB)}</p>
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      {getTeamDisplay(teamA)?.logo && (
                        <img src={getTeamDisplay(teamA).logo} alt={teamA.name} className="w-16 h-16 object-contain" />
                      )}
                      <div>
                        <p className="text-slate-400 text-sm">INNINGS 2</p>
                        <p className="text-2xl font-broadcast text-white">{teamA?.name || 'Team A'}</p>
                        {innings2 && (
                          <p className="text-lg text-sky-300 font-semibold">{innings2.score}/{getWicketsForInnings(teamA)}</p>
                        )}
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Match Result */}
          {matchState.isMatchOver && winner && (
            <div className="mt-8 space-y-4">
              <div className="p-4 bg-emerald-900/30 border border-emerald-600 rounded-lg">
                <p className="text-emerald-300 font-semibold text-lg">
                  ✓ {winner.name || 'Team'} WINS
                </p>
              </div>

              {/* Man of the Match */}
              {matchState.impactPlayer && matchState.impactPlayer.name && (
                <div className="p-4 bg-gradient-to-r from-amber-900/50 to-yellow-900/30 border border-amber-700/50 rounded-lg">
                  <p className="text-amber-400 text-xs font-bold uppercase tracking-widest mb-2">Man of the Match</p>
                  <p className="text-white font-semibold text-lg">{matchState.impactPlayer.name}</p>
                  <p className="text-amber-200 text-xs mt-1">
                    {matchState.impactPlayer.type === 'batsman' 
                      ? `${matchState.impactPlayer.stats.runs}(${matchState.impactPlayer.stats.balls})`
                      : `${matchState.impactPlayer.stats.wickets}w - ${matchState.impactPlayer.stats.runs}r`
                    }
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Innings Selector */}
        <div className="flex gap-3 mb-8">
          <button
            onClick={() => setActiveInnings(1)}
            className={`flex-1 px-6 py-3 rounded-xl font-broadcast text-lg uppercase tracking-wider transition-all ${
              activeInnings === 1
                ? 'bg-gradient-to-r from-blue-600 to-sky-500 text-white shadow-lg'
                : 'bg-slate-800/50 text-slate-400 hover:text-white border border-slate-700'
            }`}
          >
            Innings 1
          </button>
          {innings2 && (
            <button
              onClick={() => setActiveInnings(2)}
              className={`flex-1 px-6 py-3 rounded-xl font-broadcast text-lg uppercase tracking-wider transition-all ${
                activeInnings === 2
                  ? 'bg-gradient-to-r from-blue-600 to-sky-500 text-white shadow-lg'
                  : 'bg-slate-800/50 text-slate-400 hover:text-white border border-slate-700'
              }`}
            >
              Innings 2
            </button>
          )}
        </div>

        {/* Innings Stats */}
        <div className="space-y-8">
          {/* Innings Display */}
          {activeInnings === 1 && (
            <div className="glass-panel rounded-2xl p-6 bg-slate-950/80">
              <h2 className="text-2xl font-broadcast text-white mb-6">INNINGS 1</h2>
              {renderBattingStats(1)}
              {renderBowlingStats(1)}
            </div>
          )}

          {/* Innings 2 */}
          {activeInnings === 2 && innings2 && (
            <div className="glass-panel rounded-2xl p-6 bg-slate-950/80">
              <h2 className="text-2xl font-broadcast text-white mb-6">INNINGS 2</h2>
              {renderBattingStats(2)}
              {renderBowlingStats(2)}
            </div>
          )}

          {/* Analytics Section */}
          <div className="space-y-8">
            {/* Runs per Over Chart */}
            <div className="glass-panel rounded-2xl p-6 bg-slate-950/80">
              <h3 className="text-xl font-broadcast text-white mb-6">Runs Per Over</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={generateRunsData(activeInnings)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="over" stroke="#94a3b8" interval={0} angle={-45} textAnchor="end" height={80} />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }}
                    labelStyle={{ color: '#e2e8f0' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="runs" 
                    stroke="#3b82f6" 
                    dot={{ fill: '#0ea5e9', r: 4 }}
                    name="Runs per Over"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Top Batsmen Chart */}
            <div className="glass-panel rounded-2xl p-6 bg-slate-950/80">
              <h3 className="text-xl font-broadcast text-white mb-6">Top Batsmen (Runs)</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={getBattingComparisonData(activeInnings)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="name" stroke="#94a3b8" angle={-45} textAnchor="end" height={80} />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }}
                    labelStyle={{ color: '#e2e8f0' }}
                  />
                  <Bar dataKey="runs" fill="#10b981" name="Runs" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Strike Rate Chart */}
            <div className="glass-panel rounded-2xl p-6 bg-slate-950/80">
              <h3 className="text-xl font-broadcast text-white mb-6">Batting Strike Rates</h3>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={getBattingComparisonData(activeInnings)}>
                  <PolarGrid stroke="#475569" />
                  <PolarAngleAxis dataKey="name" stroke="#94a3b8" />
                  <PolarRadiusAxis stroke="#94a3b8" />
                  <Radar 
                    name="Strike Rate" 
                    dataKey="strikeRate" 
                    stroke="#f59e0b" 
                    fill="#f59e0b" 
                    fillOpacity={0.6}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }}
                    labelStyle={{ color: '#e2e8f0' }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            {/* Top Bowlers Chart */}
            <div className="glass-panel rounded-2xl p-6 bg-slate-950/80">
              <h3 className="text-xl font-broadcast text-white mb-6">Top Bowlers (Wickets)</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={getBowlingComparisonData(activeInnings)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="name" stroke="#94a3b8" angle={-45} textAnchor="end" height={80} />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }}
                    labelStyle={{ color: '#e2e8f0' }}
                  />
                  <Bar dataKey="wickets" fill="#ef4444" name="Wickets" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Economy Rate Chart */}
            <div className="glass-panel rounded-2xl p-6 bg-slate-950/80">
              <h3 className="text-xl font-broadcast text-white mb-6">Bowling Economy Rates</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={getBowlingComparisonData(activeInnings)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="name" stroke="#94a3b8" angle={-45} textAnchor="end" height={80} />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }}
                    labelStyle={{ color: '#e2e8f0' }}
                  />
                  <Bar dataKey="economy" fill="#8b5cf6" name="Economy" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Key Stats Summary */}
        <div className="glass-panel rounded-2xl p-6 mt-8 bg-slate-950/80">
          <h2 className="text-2xl font-broadcast text-white mb-6">MATCH SUMMARY</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {innings1 && (
              <>
                <div className="bg-slate-800/50 p-4 rounded-lg">
                  <p className="text-slate-400 text-xs uppercase">Innings 1 Total</p>
                  <p className="text-2xl font-broadcast text-white">{innings1.score}</p>
                </div>
                <div className="bg-slate-800/50 p-4 rounded-lg">
                  <p className="text-slate-400 text-xs uppercase">Innings 1 Overs</p>
                  <p className="text-2xl font-broadcast text-white">{formatOvers(innings1.overs)}</p>
                </div>
              </>
            )}
            
            {innings2 && (
              <>
                <div className="bg-slate-800/50 p-4 rounded-lg">
                  <p className="text-slate-400 text-xs uppercase">Innings 2 Total</p>
                  <p className="text-2xl font-broadcast text-white">{innings2.score}</p>
                </div>
                <div className="bg-slate-800/50 p-4 rounded-lg">
                  <p className="text-slate-400 text-xs uppercase">Innings 2 Overs</p>
                  <p className="text-2xl font-broadcast text-white">{formatOvers(innings2.overs)}</p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Navigation Footer */}
        <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-slate-950 to-slate-950/80 border-t border-slate-700/50 px-8 py-6 flex justify-between items-center gap-4 flex-wrap">
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
              onClick={() => setView("tourn_setup")}
              className="px-6 py-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs uppercase tracking-wider transition-colors"
            >
              🏆 Tournament
            </button>
            <button
              onClick={() => {
                setOnlineGameType("quick");
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
    </div>
  );
};

export default MatchSummaryPage;

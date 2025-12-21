import React from "react";
import orangeCapImg from "../../assets/orange-cap.png";
import purpleCapImg from "../../assets/purple-cap.png";

const TournamentLeaderboards = ({ fixtures, tournTeams, getTeamDisplay }) => {
  const MVPStar = () => (
    <svg width="40" height="40" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="goldGradient" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffd700"/>
          <stop offset="100%" stopColor="#ffaa00"/>
        </radialGradient>
      </defs>
      <polygon points="50,15 61,40 88,40 67,57 76,82 50,65 24,82 33,57 12,40 39,40" 
               fill="url(#goldGradient)" stroke="#cc8800" strokeWidth="2"/>
      <polygon points="50,25 57,42 72,42 60,52 65,68 50,58 35,68 40,52 28,42 43,42" 
               fill="#ffe44d" opacity="0.6"/>
    </svg>
  );

  // Create player ID to name mapping
  const getPlayerName = (playerId) => {
    for (const team of tournTeams) {
      const player = team.players?.find(p => (p.instanceId || p.id) === playerId);
      if (player) return player.name;
    }
    return playerId; // fallback to ID if name not found
  };

  // Aggregate stats from all played matches
  const aggregateStats = () => {
    const batsmanStats = {};
    const bowlerStats = {};

    fixtures.filter(f => f.played && f.batsmanStats && f.bowlerStats).forEach(fixture => {
      // Batsman stats
      Object.entries(fixture.batsmanStats || {}).forEach(([playerId, stats]) => {
        const playerName = getPlayerName(playerId);
        if (!batsmanStats[playerName]) {
          batsmanStats[playerName] = { name: playerName, runs: 0, balls: 0, fours: 0, sixes: 0, innings: 0, notOuts: 0 };
        }
        batsmanStats[playerName].runs += stats.runs || 0;
        batsmanStats[playerName].balls += stats.balls || 0;
        batsmanStats[playerName].fours += stats.fours || 0;
        batsmanStats[playerName].sixes += stats.sixes || 0;
        batsmanStats[playerName].innings += 1;
        if (stats.out === false) batsmanStats[playerName].notOuts += 1;
      });

      // Bowler stats
      Object.entries(fixture.bowlerStats || {}).forEach(([playerId, stats]) => {
        const playerName = getPlayerName(playerId);
        if (!bowlerStats[playerName]) {
          bowlerStats[playerName] = { name: playerName, wickets: 0, runs: 0, overs: 0, maidens: 0 };
        }
        bowlerStats[playerName].wickets += stats.wickets || 0;
        bowlerStats[playerName].runs += stats.runs || 0;
        bowlerStats[playerName].overs += stats.overs || 0;
        bowlerStats[playerName].maidens += stats.maidens || 0;
      });
    });

    return { batsmanStats, bowlerStats };
  };

  const { batsmanStats, bowlerStats } = aggregateStats();

  // Calculate MVP (runs + wickets * 20)
  const mvpStats = {};
  Object.keys(batsmanStats).forEach(name => {
    mvpStats[name] = {
      name,
      runs: batsmanStats[name]?.runs || 0,
      wickets: bowlerStats[name]?.wickets || 0,
      points: (batsmanStats[name]?.runs || 0) + (bowlerStats[name]?.wickets || 0) * 20
    };
  });
  Object.keys(bowlerStats).forEach(name => {
    if (!mvpStats[name]) {
      mvpStats[name] = {
        name,
        runs: batsmanStats[name]?.runs || 0,
        wickets: bowlerStats[name]?.wickets || 0,
        points: (batsmanStats[name]?.runs || 0) + (bowlerStats[name]?.wickets || 0) * 20
      };
    }
  });

  const topBatsmen = Object.values(batsmanStats).filter(p => p.runs > 0).sort((a, b) => b.runs - a.runs).slice(0, 10);
  const topBowlers = Object.values(bowlerStats).filter(p => p.wickets > 0).sort((a, b) => b.wickets - a.wickets).slice(0, 10);
  const topMVP = Object.values(mvpStats).filter(p => p.points > 0).sort((a, b) => b.points - a.points).slice(0, 10);

  const renderLeaderboard = (title, data, icon, color, renderRow) => (
    <div className="bg-slate-900/50 rounded-2xl border border-slate-700 p-4">
      <div className="flex items-center gap-3 mb-3 pb-3 border-b border-slate-700">
        {typeof icon === 'string' ? (
          <img src={icon} alt={title} className="w-10 h-10 object-contain" />
        ) : (
          icon
        )}
        <h3 className={`font-broadcast text-lg ${color}`}>{title}</h3>
      </div>
      <div className="space-y-2">
        {data.length === 0 ? (
          <div className="text-slate-500 text-sm text-center py-4">No data yet</div>
        ) : (
          data.map((player, idx) => renderRow(player, idx))
        )}
      </div>
    </div>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Orange Cap */}
      {renderLeaderboard(
        "Orange Cap",
        topBatsmen,
        orangeCapImg,
        "text-orange-400",
        (player, idx) => (
          <div key={player.name} className={`flex items-center justify-between p-2 rounded-lg transition-all ${
            idx === 0 
              ? "bg-gradient-to-r from-orange-900/40 to-orange-800/40 border border-orange-500 shadow-lg shadow-orange-500/20" 
              : "bg-slate-800/30 hover:bg-slate-800/50"
          }`}>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-bold w-5 ${idx === 0 ? "text-orange-400" : "text-slate-500"}`}>
                {idx + 1}
              </span>
              {idx === 0 && <span className="text-lg">🧢</span>}
              <span className={`text-sm truncate ${idx === 0 ? "text-orange-300 font-bold" : "text-white"}`}>{player.name}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className={`font-bold text-sm ${idx === 0 ? "text-orange-300" : "text-orange-400"}`}>{player.runs}</span>
              <span className="text-slate-500 text-xs">SR: {player.balls > 0 ? ((player.runs / player.balls) * 100).toFixed(1) : "0.0"}</span>
            </div>
          </div>
        )
      )}

      {/* Purple Cap */}
      {renderLeaderboard(
        "Purple Cap",
        topBowlers,
        purpleCapImg,
        "text-purple-400",
        (player, idx) => (
          <div key={player.name} className={`flex items-center justify-between p-2 rounded-lg transition-all ${
            idx === 0 
              ? "bg-gradient-to-r from-purple-900/40 to-purple-800/40 border border-purple-500 shadow-lg shadow-purple-500/20" 
              : "bg-slate-800/30 hover:bg-slate-800/50"
          }`}>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-bold w-5 ${idx === 0 ? "text-purple-400" : "text-slate-500"}`}>
                {idx + 1}
              </span>
              {idx === 0 && <span className="text-lg">🎩</span>}
              <span className={`text-sm truncate ${idx === 0 ? "text-purple-300 font-bold" : "text-white"}`}>{player.name}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className={`font-bold text-sm ${idx === 0 ? "text-purple-300" : "text-purple-400"}`}>{player.wickets}</span>
              <span className="text-slate-500 text-xs">Eco: {player.overs > 0 ? (player.runs / player.overs).toFixed(2) : "0.00"}</span>
            </div>
          </div>
        )
      )}

      {/* MVP */}
      {renderLeaderboard(
        "MVP",
        topMVP,
        <MVPStar />,
        "text-brand-gold",
        (player, idx) => (
          <div key={player.name} className={`flex items-center justify-between p-2 rounded-lg transition-all ${
            idx === 0 
              ? "bg-gradient-to-r from-yellow-900/40 to-amber-800/40 border border-brand-gold shadow-lg shadow-brand-gold/20" 
              : "bg-slate-800/30 hover:bg-slate-800/50"
          }`}>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-bold w-5 ${idx === 0 ? "text-brand-gold" : "text-slate-500"}`}>
                {idx + 1}
              </span>
              {idx === 0 && <span className="text-lg">👑</span>}
              <span className={`text-sm truncate ${idx === 0 ? "text-brand-gold font-bold" : "text-white"}`}>{player.name}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className={`font-bold text-sm ${idx === 0 ? "text-brand-gold" : "text-brand-gold"}`}>{player.points}</span>
              <span className="text-slate-500 text-xs">{player.runs}R {player.wickets}W</span>
            </div>
          </div>
        )
      )}
    </div>
  );
};

export default TournamentLeaderboards;

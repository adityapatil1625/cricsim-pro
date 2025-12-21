import React from "react";

const TournamentBracket = ({ fixtures, tournTeams, getTeamDisplay, tournPhase }) => {
  const leagueMatches = fixtures.filter(f => !f.stage);
  const semiFinals = fixtures.filter(f => f.stage === "semi");
  const final = fixtures.find(f => f.stage === "final");
  
  const renderTeamLogo = (teamId, isWinner, size = "w-8 h-8") => {
    const team = tournTeams.find(t => t.id === teamId);
    if (!team) return null;
    const display = getTeamDisplay(team);
    return (
      <div className={`${size} rounded-full flex items-center justify-center ${isWinner ? "ring-2 ring-green-500 bg-green-900/20" : "bg-slate-800/50"} p-1`}>
        {display.logo && <img src={display.logo} alt={display.shortName} className="w-full h-full object-contain" />}
      </div>
    );
  };

  return (
    <div className="bg-slate-900/50 rounded-3xl border border-slate-700 p-4">
      <h3 className="font-broadcast text-xl text-white mb-4 text-center">Tournament Tree</h3>
      
      <div className="space-y-4">
        {/* League Stage */}
        {leagueMatches.length > 0 && (
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2 text-center">League Stage</div>
            <div className="grid grid-cols-2 gap-2">
              {leagueMatches.map((f, idx) => {
                const isWinner1 = f.winner === f.t1;
                const isWinner2 = f.winner === f.t2;
                return (
                  <div key={f.id}>
                    <div className={`flex items-center justify-between gap-1 p-1.5 rounded-lg ${f.played ? "bg-slate-800/30" : "bg-slate-800/50 border border-slate-700"}`}>
                      {renderTeamLogo(f.t1, isWinner1, "w-6 h-6")}
                      <span className="text-slate-500 text-[10px]">vs</span>
                      {renderTeamLogo(f.t2, isWinner2, "w-6 h-6")}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Knockout Stage */}
        {(semiFinals.length > 0 || final) && (
          <div className="flex flex-col items-center">
            {/* Connection from league to semis */}
            {leagueMatches.length > 0 && leagueMatches.some(f => f.played) && (
              <svg className="w-full h-12" viewBox="0 0 200 48">
                {/* Left matches converge */}
                <line x1="50" y1="0" x2="50" y2="24" stroke="#475569" strokeWidth="1" />
                <line x1="50" y1="24" x2="100" y2="24" stroke="#475569" strokeWidth="1" />
                {/* Right matches converge */}
                <line x1="150" y1="0" x2="150" y2="24" stroke="#475569" strokeWidth="1" />
                <line x1="150" y1="24" x2="100" y2="24" stroke="#475569" strokeWidth="1" />
                {/* Down to semis */}
                <line x1="100" y1="24" x2="100" y2="48" stroke="#475569" strokeWidth="1" />
              </svg>
            )}
            
            {semiFinals.length === 2 ? (
              <>
                {/* Semi-Finals */}
                <div className="text-[10px] font-bold uppercase tracking-widest text-purple-400 mb-2">⚡ Semi-Finals</div>
                <div className="flex items-center justify-center gap-12">
                  {semiFinals.map((f) => {
                    const isWinner1 = f.winner === f.t1;
                    const isWinner2 = f.winner === f.t2;
                    return (
                      <div key={f.id} className="flex flex-col items-center">
                        <div className="flex items-center gap-2 bg-slate-800/50 p-2 rounded-lg border border-purple-500/30">
                          {renderTeamLogo(f.t1, isWinner1, "w-8 h-8")}
                          <span className="text-slate-400 text-xs">vs</span>
                          {renderTeamLogo(f.t2, isWinner2, "w-8 h-8")}
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                {/* Connection from semis to final */}
                {final && semiFinals.every(f => f.played) && (
                  <svg className="w-48 h-12" viewBox="0 0 192 48">
                    {/* Left semi down */}
                    <line x1="48" y1="0" x2="48" y2="24" stroke="#475569" strokeWidth="2" />
                    {/* Left semi to center */}
                    <line x1="48" y1="24" x2="96" y2="24" stroke="#475569" strokeWidth="2" />
                    {/* Right semi down */}
                    <line x1="144" y1="0" x2="144" y2="24" stroke="#475569" strokeWidth="2" />
                    {/* Right semi to center */}
                    <line x1="144" y1="24" x2="96" y2="24" stroke="#475569" strokeWidth="2" />
                    {/* Center down to final */}
                    <line x1="96" y1="24" x2="96" y2="48" stroke="#475569" strokeWidth="2" />
                  </svg>
                )}
              </>
            ) : leagueMatches.length > 0 && final && (
              /* Direct connection from league to final (3-4 teams) */
              <svg className="w-full h-8" viewBox="0 0 200 32">
                <line x1="100" y1="0" x2="100" y2="32" stroke="#475569" strokeWidth="1" />
              </svg>
            )}
            
            {/* Final */}
            {final && (
              <>
                <div className="text-[10px] font-bold uppercase tracking-widest text-brand-gold mb-2">🏆 Grand Final</div>
                <div className="flex flex-col items-center gap-2">
                  <div className="flex items-center gap-3 bg-gradient-to-br from-yellow-900/40 to-amber-900/40 p-3 rounded-xl border-2 border-brand-gold">
                    {renderTeamLogo(final.t1, final.winner === final.t1, "w-10 h-10")}
                    <span className="text-slate-300 text-sm font-bold">vs</span>
                    {renderTeamLogo(final.t2, final.winner === final.t2, "w-10 h-10")}
                  </div>
                  
                  {/* Champion */}
                  {final.played && final.winner && final.winner !== "Tie" && (
                    <>
                      <div className="w-px h-6 bg-brand-gold" />
                      <div className="flex flex-col items-center gap-1.5 bg-gradient-to-br from-yellow-900/60 to-amber-900/60 p-3 rounded-xl border-2 border-brand-gold">
                        <div className="text-brand-gold text-[10px] font-bold uppercase tracking-widest">Champion</div>
                        {renderTeamLogo(final.winner, true, "w-12 h-12")}
                      </div>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TournamentBracket;

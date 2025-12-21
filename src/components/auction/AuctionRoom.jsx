import React, { useState, useEffect, useRef, useCallback } from "react";
import { Clock, Users, TrendingUp } from "../shared/Icons";
import { getInitials, getPlayerGradient, getPlayerImageUrl } from "../../data/cricketProcessing";

const SQUAD_RULES = {
  MIN_SQUAD: 18,
  MAX_SQUAD: 25,
  MAX_OVERSEAS: 8,
  TOTAL_PURSE: 1000,
};

const getBidIncrement = (bid) => {
  if (bid < 50) return 5;
  if (bid < 100) return 10;
  if (bid < 200) return 20;
  if (bid < 500) return 25;
  return 50;
};

const AuctionRoom = ({ 
  playerPool, 
  teams, 
  onComplete, 
  onBack, 
  getTeamDisplay, 
  isOnline = false, 
  myTeamId = null,
  socket = null,
  roomCode = null
}) => {
  const [auctionTeams, setAuctionTeams] = useState([]);
  const [queue, setQueue] = useState([]);
  const [unsold, setUnsold] = useState([]);
  const [current, setCurrent] = useState(null);
  const [bid, setBid] = useState(0);
  const [bidder, setBidder] = useState(null);
  const [timer, setTimer] = useState(10);
  const [phase, setPhase] = useState("waiting");
  const [history, setHistory] = useState([]);
  const [log, setLog] = useState([]);
  const [isHost, setIsHost] = useState(false);
  const [initialized, setInitialized] = useState(false);
  
  // Refs to avoid closure issues
  const isHostRef = useRef(false);
  const phaseRef = useRef("waiting");
  const currentRef = useRef(null);
  const bidderRef = useRef(null);
  const bidRef = useRef(0);
  const queueRef = useRef([]);
  
  // Update refs when state changes
  useEffect(() => {
    isHostRef.current = isHost;
  }, [isHost]);
  
  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);
  
  useEffect(() => {
    currentRef.current = current;
  }, [current]);
  
  useEffect(() => {
    bidderRef.current = bidder;
  }, [bidder]);
  
  useEffect(() => {
    bidRef.current = bid;
  }, [bid]);
  
  useEffect(() => {
    queueRef.current = queue;
    console.log("📊 Queue updated, length:", queue.length);
  }, [queue]);

  useEffect(() => {
    // Only initialize once
    if (initialized) {
      console.log("⚠️ Already initialized, skipping");
      return;
    }
    
    console.log("🎬 Initializing auction with", playerPool.length, "players");
    const shuffled = [...playerPool].sort(() => Math.random() - 0.5);
    setQueue(shuffled);
    setAuctionTeams(teams.map(t => ({ ...t, purse: SQUAD_RULES.TOTAL_PURSE, players: [] })));
    
    // In online mode, first player is host
    if (isOnline && teams.length > 0) {
      setIsHost(teams[0].id === myTeamId);
    } else {
      setIsHost(true); // Offline mode, user is host
    }
    
    setInitialized(true);
    console.log("✅ Auction initialized");
  }, []);

  // Socket listeners
  useEffect(() => {
    if (!isOnline || !socket) {
      console.log("⚠️ Socket listeners not set up - isOnline:", isOnline, "socket:", !!socket);
      return;
    }

    console.log("✅ Setting up socket listeners for auction");

    const handleStateUpdate = (state) => {
      console.log("📡 Auction state update received:", JSON.stringify(state, null, 2));
      if (state.currentPlayer) {
        console.log("👤 Setting current player:", state.currentPlayer);
        setCurrent(state.currentPlayer);
      } else {
        console.warn("⚠️ No currentPlayer in state update!");
      }
      setBid(state.currentBid);
      setBidder(state.currentBidder);
      setTimer(state.timer);
      setPhase(state.phase);
      setHistory(state.bidHistory || []);
    };

    const handleTimerUpdate = (newTimer) => {
      console.log("⏱️ Timer update:", newTimer);
      setTimer(newTimer);
    };
    
    const handleTimerExpired = () => {
      console.log("⏰ Timer expired, isHost:", isHostRef.current, "phase:", phaseRef.current);
      if (isHostRef.current && phaseRef.current === "bidding") {
        console.log("🔨 Host calling handleSold");
        handleSold();
      }
    };
    
    const handlePlayerPassed = ({ teamName }) => {
      addLog(`${teamName} passed`);
    };
    
    const handleAllPassed = () => {
      console.log("❌ All teams passed - marking unsold");
      if (isHostRef.current) {
        handleSold(); // Will mark as unsold since no bidder
      }
    };

    const handleSoldBroadcast = ({ player, team, price }) => {
      addLog(`${player.name} SOLD to ${team.name} for ₹${price}L`);
    };

    const handleUnsoldBroadcast = ({ player }) => {
      addLog(`${player.name} UNSOLD`);
    };

    socket.on("auctionStateUpdate", handleStateUpdate);
    socket.on("auctionTimerUpdate", handleTimerUpdate);
    socket.on("auctionTimerExpired", handleTimerExpired);
    socket.on("auctionPlayerPassed", handlePlayerPassed);
    socket.on("auctionAllPassed", handleAllPassed);
    socket.on("auctionPlayerSoldBroadcast", handleSoldBroadcast);
    socket.on("auctionPlayerUnsoldBroadcast", handleUnsoldBroadcast);

    return () => {
      console.log("🧹 Cleaning up socket listeners");
      socket.off("auctionStateUpdate", handleStateUpdate);
      socket.off("auctionTimerUpdate", handleTimerUpdate);
      socket.off("auctionTimerExpired", handleTimerExpired);
      socket.off("auctionPlayerPassed", handlePlayerPassed);
      socket.off("auctionAllPassed", handleAllPassed);
      socket.off("auctionPlayerSoldBroadcast", handleSoldBroadcast);
      socket.off("auctionPlayerUnsoldBroadcast", handleUnsoldBroadcast);
    };
  }, [isOnline, socket]);

  const addLog = (msg) => setLog(prev => [{ msg, time: Date.now() }, ...prev].slice(0, 10));

  const canBid = (team, nextBid) => {
    if (team.purse < nextBid) return false;
    if (team.players.length >= SQUAD_RULES.MAX_SQUAD) return false;
    const slotsLeft = SQUAD_RULES.MIN_SQUAD - team.players.length;
    if (slotsLeft > 0 && team.purse - nextBid < slotsLeft * 20) return false;
    return true;
  };

  const placeBid = (teamId) => {
    const team = auctionTeams.find(t => t.id === teamId);
    const inc = getBidIncrement(bid);
    const next = bid + inc;
    
    if (!canBid(team, next)) return;

    if (isOnline && socket && roomCode) {
      socket.emit("auctionPlaceBid", {
        code: roomCode,
        teamId: team.id,
        teamName: team.name,
        amount: next
      });
    } else {
      setBid(next);
      setBidder(team);
      setHistory(prev => [...prev, { team: team.name, amt: next }]);
      setTimer(10);
      addLog(`${team.name} bids ₹${next}L`);
    }
  };

  const handlePass = () => {
    console.log("🚫 handlePass called, myTeamId:", myTeamId, "auctionTeams:", auctionTeams);
    const myTeam = auctionTeams.find(t => t.id === myTeamId);
    console.log("🚫 myTeam found:", myTeam);
    if (!myTeam) {
      console.error("❌ No team found for myTeamId:", myTeamId);
      return;
    }
    
    console.log("🔌 Socket check - isOnline:", isOnline, "socket:", !!socket, "socket.connected:", socket?.connected, "roomCode:", roomCode);
    
    if (isOnline && socket && roomCode) {
      console.log("📤 Emitting auctionPass:", { code: roomCode, teamId: myTeam.id, teamName: myTeam.name });
      socket.emit("auctionPass", {
        code: roomCode,
        teamId: myTeam.id,
        teamName: myTeam.name
      });
    } else {
      console.log("💻 Offline mode - adding log directly");
      addLog(`${myTeam.name} passed on ${currentRef.current?.name}`);
    }
  };

  const handleSold = () => {
    const currentPlayer = currentRef.current;
    const currentBidder = bidderRef.current;
    const currentBid = bidRef.current;
    
    console.log("🔨 handleSold called, current:", currentPlayer, "bidder:", currentBidder);
    
    if (!currentPlayer) {
      console.error("❌ No current player to sell!");
      return;
    }
    
    if (!currentBidder) {
      if (isOnline && socket && roomCode) {
        socket.emit("auctionPlayerUnsold", { code: roomCode, player: currentPlayer });
      }
      setUnsold(prev => [...prev, currentPlayer]);
      setPhase("sold");
      setTimeout(() => {
        if (isHostRef.current) next();
      }, 2000);
      return;
    }

    if (isOnline && socket && roomCode) {
      socket.emit("auctionPlayerSold", {
        code: roomCode,
        player: currentPlayer,
        team: currentBidder,
        price: currentBid
      });
    }

    setAuctionTeams(prev => prev.map(t => 
      t.id === currentBidder.id 
        ? { ...t, purse: t.purse - currentBid, players: [...t.players, { ...currentPlayer, price: currentBid }] }
        : t
    ));
    setPhase("sold");
    setTimeout(() => {
      if (isHostRef.current) next();
    }, 2000);
  };

  const next = () => {
    const currentQueue = queueRef.current;
    console.log("🎬 next() called, queue length:", currentQueue.length, "first 3:", currentQueue.slice(0, 3).map(p => p?.name));
    
    if (currentQueue.length === 0) {
      console.log("📭 Queue empty, checking unsold:", unsold.length);
      if (unsold.length > 0) {
        const newQueue = unsold.map(p => ({ ...p, basePrice: 20 }));
        console.log("⚡ Setting accelerated queue:", newQueue.length);
        setQueue(newQueue);
        setUnsold([]);
        addLog("⚡ Accelerated auction starting");
        return;
      } else {
        console.log("✅ Auction complete");
        setPhase("complete");
        return;
      }
    }

    const [p, ...rest] = currentQueue;
    console.log("👤 Next player:", p?.name, "Remaining:", rest.length);
    setQueue(rest);
    
    const basePrice = p.basePrice || 20;
    
    if (isOnline && socket && roomCode) {
      console.log("📤 Emitting auctionNextPlayer to server:", { player: p.name, basePrice, roomCode });
      socket.emit("auctionNextPlayer", {
        code: roomCode,
        player: p,
        basePrice
      });
    } else {
      console.log("💻 Offline mode - setting state directly");
      setCurrent(p);
      setBid(basePrice);
      setBidder(null);
      setHistory([]);
      setTimer(10);
      setPhase("bidding");
    }
  };

  if (phase === "complete") {
    return (
      <div className="min-h-screen bg-slate-950 p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="font-broadcast text-7xl text-brand-gold text-center mb-8">AUCTION COMPLETE</h1>
          <div className="grid grid-cols-2 gap-6 mb-8">
            {auctionTeams.map(team => {
              const display = getTeamDisplay(team);
              return (
                <div key={team.id} className="glass-panel rounded-2xl p-6">
                  <div className="flex items-center gap-3 mb-4 border-b border-white/10 pb-4">
                    {display.logo && <img src={display.logo} alt={display.shortName} className="w-8 h-8" />}
                    <h3 className="font-broadcast text-2xl text-white">{display.name}</h3>
                    <div className="ml-auto text-right">
                      <div className="text-xs text-slate-500">Remaining</div>
                      <div className="text-xl text-brand-gold font-bold">₹{team.purse}L</div>
                    </div>
                  </div>
                  <div className="space-y-1 max-h-64 overflow-y-auto custom-scrollbar">
                    {team.players.map((p, i) => (
                      <div key={i} className="flex justify-between bg-slate-900/50 p-2 rounded text-sm">
                        <span className="text-slate-300">{p.name}</span>
                        <span className="text-brand-gold font-bold">₹{p.price}L</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex gap-4 justify-center">
            <button onClick={onBack} className="px-8 py-3 rounded-full border border-slate-700 text-slate-400 hover:text-white transition-all font-bold text-sm uppercase">
              Back
            </button>
            <button onClick={() => onComplete(auctionTeams)} className="px-8 py-3 rounded-full bg-gradient-to-r from-green-600 to-emerald-600 text-white font-broadcast text-xl hover:scale-105 transition-transform">
              Continue
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-purple-900/20 via-slate-950 to-slate-950" />
      
      <div className="absolute top-0 left-0 w-96 h-96 bg-purple-600/10 rounded-full blur-[128px] animate-pulse" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-pink-600/10 rounded-full blur-[128px] animate-pulse" style={{ animationDelay: '1s' }} />
      
      <div className="relative z-10 p-8">
        <div className="flex justify-between items-center mb-8 border-b border-white/10 pb-6">
          <div>
            <h1 className="font-broadcast text-7xl text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-brand-gold drop-shadow-2xl">
              IPL AUCTION
            </h1>
            <div className="flex items-center gap-4 mt-2">
              <p className="text-slate-400 text-sm uppercase tracking-widest">
                {queue.length} players remaining
              </p>
              <span className="text-slate-600">•</span>
              <p className="text-slate-400 text-sm uppercase tracking-widest">
                Live Bidding
              </p>
              {isOnline && (
                <>
                  <span className="text-slate-600">•</span>
                  <p className="text-purple-400 text-sm uppercase tracking-widest">
                    {isHost ? "HOST" : "GUEST"}
                  </p>
                </>
              )}
            </div>
          </div>
          <button onClick={onBack} className="px-6 py-2 rounded-full border border-slate-700 text-slate-400 hover:text-white hover:border-red-500 transition-all text-xs font-bold uppercase tracking-widest">
            Exit Auction
          </button>
        </div>

        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-8">
            {current ? (
              <div className="glass-panel rounded-3xl overflow-hidden shadow-2xl">
                <div className="relative bg-gradient-to-br from-purple-900/40 via-slate-900 to-slate-800 p-8 border-b border-white/10">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-purple-500/20 to-transparent rounded-full blur-3xl" />
                  <div className="relative flex gap-6">
                    <div className={`w-40 h-40 rounded-2xl bg-gradient-to-br ${getPlayerGradient(current.name)} flex items-center justify-center border-2 border-white/20 shadow-2xl overflow-hidden`}>
                      {getPlayerImageUrl(current) ? (
                        <img 
                          src={getPlayerImageUrl(current)} 
                          alt={current.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'block';
                          }}
                        />
                      ) : null}
                      <span className={`text-7xl font-broadcast text-white drop-shadow-lg ${getPlayerImageUrl(current) ? 'hidden' : ''}`}>
                        {getInitials(current.name)}
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="inline-block px-3 py-1 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-300 text-xs font-bold uppercase tracking-widest mb-3">
                        On Auction
                      </div>
                      <h2 className="font-broadcast text-6xl text-white mb-3 leading-none">
                        {current.name}
                      </h2>
                      <div className="flex gap-3 text-sm">
                        <span className="px-4 py-2 rounded-full bg-slate-800/80 border border-slate-700 text-slate-200 font-bold">
                          {current.role}
                        </span>
                        <span className="px-4 py-2 rounded-full bg-slate-800/80 border border-slate-700 text-slate-200">
                          <span className="text-slate-500">Avg:</span> <span className="font-bold text-white">{current.avg}</span>
                        </span>
                        <span className="px-4 py-2 rounded-full bg-slate-800/80 border border-slate-700 text-slate-200">
                          <span className="text-slate-500">SR:</span> <span className="font-bold text-white">{current.sr}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-8">
                  {phase === "bidding" && (
                    <>
                      <div className="text-center mb-8">
                        <div className="text-sm text-slate-500 uppercase mb-2">Current Bid</div>
                        <div className="font-broadcast text-7xl text-brand-gold mb-2">₹{bid}L</div>
                        {bidder && <div className="text-lg text-slate-400">{bidder.name}</div>}
                        <div className="mt-4 flex items-center justify-center gap-2">
                          <Clock className="w-5 h-5 text-red-400" />
                          <span className={`text-3xl font-bold ${timer <= 3 ? 'text-red-400 animate-pulse' : 'text-slate-300'}`}>{timer}s</span>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          {auctionTeams.map(team => {
                            const display = getTeamDisplay(team);
                            const nextBid = bid + getBidIncrement(bid);
                            const canBidNow = canBid(team, nextBid);
                            const isMyTeam = !isOnline || team.id === myTeamId;
                            
                            return (
                              <button
                                key={team.id}
                                onClick={() => isMyTeam && placeBid(team.id)}
                                disabled={!isMyTeam || !canBidNow}
                                className={`p-4 rounded-xl border-2 transition-all ${
                                  bidder?.id === team.id ? 'border-brand-gold bg-brand-gold/10' : 'border-slate-700 hover:border-brand-gold/50 bg-slate-900/50'
                                } ${!isMyTeam ? 'opacity-50' : ''} disabled:opacity-30 disabled:cursor-not-allowed`}
                              >
                                <div className="flex items-center gap-2 mb-1">
                                  {display.logo && <img src={display.logo} alt={display.shortName} className="w-5 h-5" />}
                                  <span className="font-bold text-white">{display.name}</span>
                                  {!isMyTeam && <span className="ml-auto text-xs text-slate-500">(Other)</span>}
                                </div>
                                <div className="text-xs text-slate-400">₹{team.purse}L • {team.players.length}/25</div>
                              </button>
                            );
                          })}
                        </div>
                        
                        {/* Pass Button - only show for your team if you haven't bid yet or if you're not the highest bidder */}
                        {isOnline && auctionTeams.find(t => t.id === myTeamId) && (
                          <div className="text-center">
                            <button
                              onClick={handlePass}
                              disabled={bidder?.id === myTeamId}
                              className="px-8 py-3 rounded-full border-2 border-slate-600 text-slate-400 hover:border-red-500 hover:text-red-400 transition-all disabled:opacity-30 disabled:cursor-not-allowed font-bold uppercase tracking-widest text-sm"
                            >
                              {bidder?.id === myTeamId ? "You're Winning" : "Pass / Not Interested"}
                            </button>
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  {phase === "sold" && (
                    <div className="text-center py-12">
                      {bidder ? (
                        <>
                          <div className="text-6xl mb-4">🎉</div>
                          <div className="font-broadcast text-4xl text-green-400 mb-2">SOLD!</div>
                          <div className="text-2xl text-white mb-2">{bidder.name}</div>
                          <div className="text-3xl text-brand-gold font-bold">₹{bid}L</div>
                        </>
                      ) : (
                        <>
                          <div className="text-6xl mb-4">❌</div>
                          <div className="font-broadcast text-4xl text-red-400">UNSOLD</div>
                        </>
                      )}
                    </div>
                  )}

                  {phase === "waiting" && (
                    <div className="text-center py-12">
                      {isHost ? (
                        <button onClick={next} className="px-12 py-4 rounded-full bg-gradient-to-r from-brand-gold to-yellow-500 text-black font-broadcast text-2xl hover:scale-105 transition-transform">
                          START AUCTION
                        </button>
                      ) : (
                        <p className="text-slate-400 text-lg">Waiting for host to start...</p>
                      )}
                    </div>
                  )}
                </div>

                {history.length > 0 && (
                  <div className="px-8 pb-8">
                    <div className="text-xs text-slate-500 uppercase mb-2">Bid History</div>
                    <div className="flex gap-2 flex-wrap">
                      {history.map((h, i) => (
                        <span key={i} className="text-xs px-2 py-1 rounded bg-slate-800 text-slate-400">
                          {h.team}: ₹{h.amt || h.amount}L
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="glass-panel rounded-3xl p-12 text-center">
                <h2 className="font-broadcast text-4xl text-white mb-4">Ready to Start?</h2>
                {isHost ? (
                  <button onClick={next} className="px-12 py-4 rounded-full bg-gradient-to-r from-brand-gold to-yellow-500 text-black font-broadcast text-2xl hover:scale-105 transition-transform">
                    START AUCTION
                  </button>
                ) : (
                  <p className="text-slate-400 text-lg">Waiting for host to start...</p>
                )}
              </div>
            )}
          </div>

          <div className="col-span-4 space-y-6">
            <div className="glass-panel rounded-2xl p-6">
              <h3 className="font-broadcast text-2xl text-white mb-4 flex items-center gap-2">
                <Users className="w-6 h-6" />
                Teams
              </h3>
              <div className="space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar">
                {auctionTeams.map(team => {
                  const display = getTeamDisplay(team);
                  return (
                    <div key={team.id} className={`p-4 rounded-xl border-2 ${bidder?.id === team.id ? 'border-brand-gold bg-brand-gold/10' : 'border-slate-800 bg-slate-900/50'}`}>
                      <div className="flex justify-between mb-3">
                        <div className="flex items-center gap-2">
                          {display.logo && <img src={display.logo} alt={display.shortName} className="w-6 h-6" />}
                          <div>
                            <div className="font-bold text-white text-sm">{display.name}</div>
                            <div className="text-xs text-slate-500">{team.players.length}/25</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-slate-500">Purse</div>
                          <div className="text-lg font-bold text-brand-gold">₹{team.purse}L</div>
                        </div>
                      </div>
                      {team.players.length > 0 && (
                        <div className="space-y-1">
                          {team.players.slice(-3).map((p, i) => (
                            <div key={i} className="text-xs text-slate-400 flex justify-between">
                              <span className="truncate">{p.name}</span>
                              <span className="text-brand-gold">₹{p.price}L</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="glass-panel rounded-2xl p-6">
              <h3 className="font-broadcast text-xl text-white mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Live Feed
              </h3>
              <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
                {log.map((l, i) => (
                  <div key={i} className="text-xs text-slate-400 bg-slate-900/50 p-2 rounded">
                    {l.msg}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuctionRoom;

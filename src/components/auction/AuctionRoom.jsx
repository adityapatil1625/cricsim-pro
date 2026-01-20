/**
 * AuctionRoom.jsx
 * Complete auction management component with bidding, player queue, and team management
 * 
 * Features:
 * - Real-time player queue management
 * - Automated bidding system with incremental bids
 * - Timer-based auction phases
 * - Team roster tracking with purse management
 * - Auction history and unsold players tracking
 * - Multi-player synchronized auction
 * - IPL-style auction sets (marquee, capped, uncapped, etc.)
 * - Player role categorization
 * - Overseas player limits
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
  Clock,
  Users,
  TrendingUp,
  ChevronLeft,
} from '../shared/Icons';
import { buildSimpleAuctionQueue, getSetById, getBidIncrement, formatPrice } from '../../data/playerPoolV2';
import { validateTeamComposition, getTeamRoleBalance } from '../../utils/auctionUtils';
import SetContextDisplay from './SetContextDisplay';

// Auction configuration constants
const AUCTION_CONFIG = {
  SQUAD_MIN: 18,
  SQUAD_MAX: 25,
  MAX_OVERSEAS: 8,
  TOTAL_PURSE: 1000,
  INITIAL_TIMER: 10,
  BID_TIMER: 10,
  SOLD_TIMER: 3,
};

const AuctionRoom = ({
  isOnline = false,
  playerPool = [],
  teams = [],
  onlineRoom = null,
  socket = null,
  IPL_TEAMS = [],
  onComplete = () => {},
  onBack = () => {},
  myTeamId = null,
  onTeamsUpdate = () => {},
  onBidPlaced = () => {},
  onPlayerUpdate = () => {},
  onAuctionLogUpdate = () => {},
}) => {
  // State for auction progression
  const [auctionPhase, setAuctionPhase] = useState('initializing');
  const [biddingStage, setBiddingStage] = useState('IDLE'); // IDLE, PLAYER_ANNOUNCED, BIDDING_ACTIVE, GOING_ONCE, GOING_TWICE, SOLD, UNSOLD
  const [queue, setQueue] = useState([]);
  const [fullQueue, setFullQueue] = useState([]); // Keep full queue for position tracking
  const [unsold, setUnsold] = useState([]);
  const [currentPlayer, setCurrentPlayer] = useState(null);
  const [auctionTeams, setAuctionTeams] = useState([]);

  // Bidding state
  const [currentBid, setCurrentBid] = useState(0);
  const [basePrice, setBasePrice] = useState(0);
  const [currentBidder, setCurrentBidder] = useState(null);
  const [timer, setTimer] = useState(AUCTION_CONFIG.BID_TIMER);
  const [bidError, setBidError] = useState(null); // Error message for invalid bid

  // History and logging
  const [soldPlayers, setSoldPlayers] = useState([]);
  const [auctionLog, setAuctionLog] = useState([]);
  const [lastSoldPlayer, setLastSoldPlayer] = useState(null);
  const [showSoldOverlay, setShowSoldOverlay] = useState(false);
  const [playerProcessed, setPlayerProcessed] = useState(false); // Prevent duplicate sold/unsold processing

  const isHost = !isOnline || (socket && onlineRoom && socket.id === onlineRoom.host);

  // Refs to prevent closure issues
  const timerRef = useRef(null);
  const phaseRef = useRef(auctionPhase);
  const currentPlayerRef = useRef(currentPlayer);
  const currentBidRef = useRef(currentBid);
  const currentBidderRef = useRef(currentBidder);
  const biddingStageRef = useRef(biddingStage);
  const queueRef = useRef(queue);

  // Sync refs with state
  useEffect(() => {
    phaseRef.current = auctionPhase;
  }, [auctionPhase]);

  useEffect(() => {
    currentPlayerRef.current = currentPlayer;
  }, [currentPlayer]);

  useEffect(() => {
    currentBidRef.current = currentBid;
  }, [currentBid]);

  // Notify parent component of player and queue updates
  useEffect(() => {
    if (onPlayerUpdate) {
      onPlayerUpdate(currentPlayer, queue, fullQueue);
    }
  }, [currentPlayer, queue, fullQueue, onPlayerUpdate]);

  // Notify parent component of auction log updates
  useEffect(() => {
    if (onAuctionLogUpdate) {
      onAuctionLogUpdate(auctionLog);
    }
  }, [auctionLog, onAuctionLogUpdate]);

  useEffect(() => {
    currentBidderRef.current = currentBidder;
  }, [currentBidder]);

  useEffect(() => {
    biddingStageRef.current = biddingStage;
  }, [biddingStage]);

  // Notify parent when auctionTeams change
  useEffect(() => {
    if (auctionTeams.length > 0) {
      onTeamsUpdate(auctionTeams);
    }
  }, [auctionTeams, onTeamsUpdate]);

  // Initialize auction
  useEffect(() => {
    if (auctionPhase !== 'initializing') return;

    try {
      // For online mode, wait until onlineRoom is loaded
      if (isOnline && !onlineRoom) {
        console.log('⏳ Waiting for onlineRoom to load...');
        return;
      }

      console.log(`🎯 Initializing auction. isOnline: ${isOnline}, isHost: ${isHost}, socket.id: ${socket?.id}, host: ${onlineRoom?.host}`);
      
      // Only build queue if offline or if online AND is host
      if (!isOnline || isHost) {
        // Build auction queue with IPL-style sets (Marquee → Capped → Overseas → Uncapped)
        const queue = buildSimpleAuctionQueue(playerPool);
        console.log(`📊 Built auction queue with ${queue.length} players organized by IPL sets`);
        setQueue(queue);
        setFullQueue(queue); // Store full queue for position tracking
        setBasePrice(queue.length > 0 ? queue[0].basePrice || 0 : 0);
      } else {
        // Online non-host: wait for queue sync from server
        console.log('⏳ Non-host: Waiting for queue sync from host...');
        setQueue([]);
      }

      const initialTeams = teams.map(team => ({
        ...team,
        squad: [],
        purse: AUCTION_CONFIG.TOTAL_PURSE,
        overseasCount: 0,
        roleBalance: { batters: 0, bowlers: 0, allrounders: 0, wicketkeepers: 0 },
      }));
      setAuctionTeams(initialTeams);
      setAuctionPhase('ready');
      addLog('🎬 Auction initialized! Players organized by IPL Auction Sets.', 'system');
    } catch (error) {
      console.error('Failed to initialize auction:', error);
      addLog('❌ Initialization failed', 'error');
    }
  }, [auctionPhase, playerPool, teams, isOnline, socket, onlineRoom]);

  // Auto-start auction when ready (offline mode)
  useEffect(() => {
    if (auctionPhase === 'ready' && !isOnline) {
      const timer = setTimeout(() => {
        setAuctionPhase('running');
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [auctionPhase, isOnline]);

  // Progress to next player
  useEffect(() => {
    console.log(`🔍 Progress effect triggered: phase=${auctionPhase}, currentPlayer=${currentPlayer?.name}, queue.length=${queue.length}`);
    
    if (auctionPhase !== 'running' || currentPlayer !== null) {
      console.log(`   Exiting: auctionPhase !== 'running' (${auctionPhase !== 'running'}) or currentPlayer !== null (${currentPlayer !== null})`);
      return;
    }
    
    // Wait for queue to be populated (important for online mode where non-hosts get queue via sync)
    if (queue.length === 0) {
      console.log('⏳ Waiting for queue to be populated...');
      // Only mark as completed if offline (no more players to auction)
      // In online mode, non-hosts wait for queue sync
      if (!isOnline) {
        setAuctionPhase('completed');
      }
      return;
    }

    console.log(`✅ Announcing player from queue of ${queue.length} players: ${queue[0]?.name}`);
    const nextPlayer = queue[0];
    console.log(`🎤 Current player: ${nextPlayer.name}, Set: ${nextPlayer.auctionSet}, Base: ₹${nextPlayer.basePrice}L`);
    setCurrentPlayer(nextPlayer);
    setPlayerProcessed(false); // Reset flag for new player
    const basePriceAmount = nextPlayer.basePrice || 0;
    setCurrentBid(basePriceAmount);
    setBasePrice(basePriceAmount);
    setCurrentBidder(null);
    setBiddingStage('PLAYER_ANNOUNCED');
    setTimer(AUCTION_CONFIG.BID_TIMER);
    setAuctionLog(prev => [
      { message: `📍 ${nextPlayer.name} is up for auction - Base price ₹${basePriceAmount}L`, type: 'player', timestamp: new Date() },
      ...prev.slice(0, 99),
    ]);
    
    // Host broadcasts next player to all guests for synchronization
    if (isOnline && isHost && socket && onlineRoom) {
      console.log(`📤 Host broadcasting next player: ${nextPlayer.name} to room ${onlineRoom?.code}`);
      socket.emit('auctionNextPlayer', {
        code: onlineRoom?.code,
        player: nextPlayer,
      });
    }
    
    // Update queue in separate effect to avoid re-triggering this effect
    queueRef.current = queue.slice(1);
    setQueue(queue.slice(1));
  }, [auctionPhase, queue.length, isOnline, currentPlayer, isHost, socket, onlineRoom]); // currentPlayer needed to detect when player is sold/unsold

  // Timer countdown and broadcast
  useEffect(() => {
    if (auctionPhase !== 'running' || !currentPlayer || playerProcessed) return;

    timerRef.current = setInterval(() => {
      setTimer(prev => {
        const newTimer = prev <= 1 ? 0 : prev - 1;
        
        // Host broadcasts timer to all guests for synchronization
        if (isOnline && isHost && socket && onlineRoom) {
          console.log(`📤 Host broadcasting timer: ${newTimer}s for ${currentPlayerRef.current?.name}`);
          socket.emit('auctionTimerUpdate', {
            code: onlineRoom?.code,
            timer: newTimer,
            playerName: currentPlayerRef.current?.name,
          });
        }
        
        if (newTimer <= 0) {
          // Mark as processed to prevent duplicate calls
          setPlayerProcessed(true);
          
          if (currentBidderRef.current) {
            handleSoldPlayer(
              currentPlayerRef.current,
              currentBidderRef.current,
              currentBidRef.current
            );
          } else {
            handleUnsoldPlayer(currentPlayerRef.current);
          }
          return 0;
        }
        return newTimer;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [auctionPhase, currentPlayer, playerProcessed, isOnline, isHost, socket, onlineRoom]);

  // Add log entry - moved before useEffects that need it
  const addLog = (message, type = 'info') => {
    setAuctionLog(prev => [
      { message, type, timestamp: new Date() },
      ...prev.slice(0, 99),
    ]);
  };

  // Listen for bid updates from other players (online mode)
  useEffect(() => {
    if (!isOnline || !socket) return;

    const handleBidUpdate = (data) => {
      const { bid, socketId, playerName } = data;
      const bidderTeam = auctionTeams.find(t => t.id === socketId);
      
      // Update bid state
      setCurrentBid(bid);
      setCurrentBidder(socketId);
      setTimer(AUCTION_CONFIG.BID_TIMER);
      
      // Add to auction log
      addLog(
        `💰 ${bidderTeam?.iplTeamId || socketId} bid ₹${bid}L for ${playerName}`,
        'bid'
      );
      console.log(`✅ Added bid to log: ${bidderTeam?.iplTeamId} bid ₹${bid}L`);
    };

    socket.on('auctionBidUpdate', handleBidUpdate);

    return () => {
      socket.off('auctionBidUpdate', handleBidUpdate);
    };
  }, [isOnline, socket, auctionTeams, addLog]);

  // Listen for queue sync from server (online mode)
  useEffect(() => {
    if (!isOnline || !socket) return;

    const handleQueueSync = (data) => {
      const { queue: syncedQueue } = data;
      console.log(`📋 Received synced queue with ${syncedQueue.length} players`);
      console.log(`   First 5 players: ${syncedQueue.slice(0, 5).map(p => p.name).join(', ')}`);
      console.log(`   Current phase BEFORE: ${auctionPhase}, currentPlayer BEFORE: ${currentPlayer?.name}`);
      
      setQueue(syncedQueue);
      setFullQueue(syncedQueue); // Store full queue for position tracking
      if (syncedQueue.length > 0) {
        setBasePrice(syncedQueue[0].basePrice || 0);
      }
      // Transition based on current phase:
      // - If initializing: go to ready (shouldn't happen, but handle it)
      // - If ready: go to running (this is non-host who got queue sync)
      // - If running: stay running (this is host re-receiving own queue - now it has the official queue)
      setAuctionPhase(prev => {
        const nextPhase = (prev === 'ready') ? 'running' : prev;
        console.log(`✅ Queue sync phase transition: ${prev} -> ${nextPhase}`);
        // If host just got queue sync and no currentPlayer yet, the effect will trigger next
        // If guest got queue sync and transitioning to 'running', the effect will trigger next
        return nextPhase;
      });
      // Force currentPlayer to null if it was set from local queue (host case)
      // so the effect will announce from the synced queue
      if (currentPlayer) {
        console.log(`🔄 Resetting currentPlayer from ${currentPlayer.name} to null (will re-announce from synced queue)`);
        setCurrentPlayer(null);
      }
    };

    socket.on('auctionQueueSync', handleQueueSync);

    return () => {
      socket.off('auctionQueueSync', handleQueueSync);
    };
  }, [isOnline, socket]);

  // Listen for sold/unsold player events from host (online mode)
  useEffect(() => {
    if (!isOnline || !socket) return;

    const handlePlayerSoldEvent = (data) => {
      const { player, teamId, price } = data;
      console.log(`📥 Received auctionPlayerSold for ${player.name} from host`);
      
      // Don't remove from queue - let host manage queue progression
      // Guests should just update team rosters and wait for next player announcement
      
      // Add to sold players list
      const soldTeam = auctionTeams.find(t => t.id === teamId);
      setSoldPlayers(prev => [
        ...prev,
        {
          player,
          team: soldTeam,
          price,
        },
      ]);
      
      // Update team roster
      setAuctionTeams(prev =>
        prev.map(team => {
          if (team.id === teamId) {
            const updatedSquad = [...team.squad, { ...player, soldPrice: price }];
            const roleBalance = getTeamRoleBalance(updatedSquad);
            const overseasCount = updatedSquad.filter(p => p.isOverseas).length;
            const validation = validateTeamComposition(updatedSquad, AUCTION_CONFIG);
            
            return {
              ...team,
              squad: updatedSquad,
              purse: team.purse - price,
              roleBalance,
              overseasCount,
              isValid: validation.isValid,
            };
          }
          return team;
        })
      );
      
      addLog(
        `✅ ${player.name} (${player.role || 'player'}) sold for ₹${price}L to ${soldTeam?.iplTeamId || teamId}`,
        'sold'
      );
      
      // Show sold overlay to all guests
      setLastSoldPlayer({ player, teamId, price });
      setShowSoldOverlay(true);
      
      // Clear bidding state so next player can be bid on immediately
      // This is important for guests to be able to bid on the next player
      setCurrentBidder(null);
      setBiddingStage('PLAYER_ANNOUNCED');
      
      // Clear overlay after 3.5 seconds (same as host)
      setTimeout(() => {
        setShowSoldOverlay(false);
        setLastSoldPlayer(null);
      }, 3500);
    };

    const handlePlayerUnsoldEvent = (data) => {
      const { player } = data;
      console.log(`📥 Received auctionPlayerUnsold for ${player.name} from host`);
      
      // Don't remove from queue - let host manage queue progression
      
      // Add to unsold list
      setUnsold(prev => [...prev, player]);
      
      addLog(`❌ ${player.name} - UNSOLD`, 'unsold');
      
      // Clear bidding state so next player can be bid on immediately
      setCurrentBidder(null);
      setBiddingStage('PLAYER_ANNOUNCED');
    };

    socket.on('auctionPlayerSold', handlePlayerSoldEvent);
    socket.on('auctionPlayerUnsold', handlePlayerUnsoldEvent);

    return () => {
      socket.off('auctionPlayerSold', handlePlayerSoldEvent);
      socket.off('auctionPlayerUnsold', handlePlayerUnsoldEvent);
    };
  }, [isOnline, socket, auctionTeams]);

  // Listen for timer updates from host (online mode for guests)
  useEffect(() => {
    if (!isOnline || !socket || isHost) return;

    const handleTimerUpdate = (data) => {
      const { timer, playerName } = data;
      
      // Only sync timer if we're looking at the same player
      if (playerName === currentPlayer?.name) {
        console.log(`📥 Guest received timer update: ${timer}s for ${playerName}`);
        setTimer(timer);
      }
    };

    const handleNextPlayerAnnouncement = (data) => {
      const { player: nextPlayer } = data;
      console.log(`📥 Guest received next player announcement: ${nextPlayer.name}`);
      
      // Set current player to the announced player
      setCurrentPlayer(nextPlayer);
      setPlayerProcessed(false);
      setCurrentBid(nextPlayer.basePrice || 0);
      setBasePrice(nextPlayer.basePrice || 0);
      setCurrentBidder(null);
      setBiddingStage('PLAYER_ANNOUNCED');
      setTimer(AUCTION_CONFIG.BID_TIMER);
      
      addLog(
        `📍 ${nextPlayer.name} is up for auction - Base price ₹${nextPlayer.basePrice || 0}L`,
        'player'
      );
    };

    socket.on('auctionTimerUpdate', handleTimerUpdate);
    socket.on('auctionNextPlayer', handleNextPlayerAnnouncement);

    return () => {
      socket.off('auctionTimerUpdate', handleTimerUpdate);
      socket.off('auctionNextPlayer', handleNextPlayerAnnouncement);
    };
  }, [isOnline, socket, isHost, currentPlayer?.name]);

  const handleSoldPlayer = useCallback(
    (player, teamId, price) => {
      // Mark player as sold for visual feedback
      setLastSoldPlayer({ player, teamId, price });
      setShowSoldOverlay(true);

      // Rapid confetti bursts
      const burstConfetti = () => {
        confetti({
          particleCount: 150,
          spread: 100,
          startVelocity: 50,
          origin: { y: 0.5 },
          colors: ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A'],
        });

        confetti({
          particleCount: 80,
          angle: 60,
          spread: 55,
          startVelocity: 40,
          origin: { x: 0, y: 0.5 },
          colors: ['#FFD700', '#FF6B6B', '#4ECDC4'],
        });

        confetti({
          particleCount: 80,
          angle: 120,
          spread: 55,
          startVelocity: 40,
          origin: { x: 1, y: 0.5 },
          colors: ['#FFD700', '#FF6B6B', '#4ECDC4'],
        });
      };

      // Fire confetti bursts rapidly
      burstConfetti();
      setTimeout(burstConfetti, 200);
      setTimeout(burstConfetti, 400);

      setAuctionTeams(prev =>
        prev.map(team => {
          if (team.id === teamId) {
            const updatedSquad = [...team.squad, { ...player, soldPrice: price }];
            
            // Update role balance and overseas count
            const roleBalance = getTeamRoleBalance(updatedSquad);
            const overseasCount = updatedSquad.filter(p => p.isOverseas).length;
            
            console.log(`📊 Updated team ${team.iplTeamId}:`, {
              squadSize: updatedSquad.length,
              roleBalance,
              overseasCount,
            });
            
            // Validate team composition
            const validation = validateTeamComposition(updatedSquad, AUCTION_CONFIG);
            
            return {
              ...team,
              squad: updatedSquad,
              purse: team.purse - price,
              roleBalance,
              overseasCount,
              isValid: validation.isValid,
            };
          }
          return team;
        })
      );

      const soldTeam = auctionTeams.find(t => t.id === teamId);
      setSoldPlayers(prev => [
        ...prev,
        {
          player,
          team: soldTeam,
          price,
        },
      ]);

      addLog(
        `✅ ${player.name} (${player.role || 'player'}) sold for ₹${price}L to ${soldTeam?.iplTeamId || teamId}`,
        'sold'
      );

      // Broadcast sold player to all clients in online mode
      if (isOnline && socket && onlineRoom) {
        console.log(`📤 Emitting auctionPlayerSold for ${player.name} to room ${onlineRoom?.code}`);
        socket.emit('auctionPlayerSold', {
          code: onlineRoom?.code,
          player,
          teamId,
          price,
          soldPrice: price,
        });
      }

      // Longer delay before clearing overlay and moving to next player
      setTimeout(() => {
        setShowSoldOverlay(false);
        setLastSoldPlayer(null);
        setCurrentPlayer(null);
      }, 3500);
    },
    [auctionTeams]
  );

  // Handle player unsold
  const handleUnsoldPlayer = useCallback((player) => {
    // Mark as processed to prevent duplicate calls
    setPlayerProcessed(true);
    
    setUnsold(prev => [...prev, player]);
    addLog(`❌ ${player.name} - UNSOLD`, 'unsold');
    
    // Broadcast unsold player to all clients in online mode
    if (isOnline && socket && onlineRoom) {
      console.log(`📤 Emitting auctionPlayerUnsold for ${player.name} to room ${onlineRoom?.code}`);
      socket.emit('auctionPlayerUnsold', {
        code: onlineRoom?.code,
        player,
      });
    }
    
    // Delay before clearing current player
    setTimeout(() => {
      setCurrentPlayer(null);
    }, 500);
  }, [isOnline, socket, onlineRoom]);

  // Handle bid placement
  const handlePlaceBid = useCallback(() => {
    // Clear previous error
    setBidError(null);

    const nextBidAmount = getNextBidAmount();
    const validation = validateBid(nextBidAmount);

    // Check validation
    if (!validation.valid) {
      setBidError(validation.reason);
      return;
    }

    // Update bid state
    setCurrentBid(nextBidAmount);
    setCurrentBidder(myTeamId);
    setTimer(AUCTION_CONFIG.BID_TIMER); // Reset timer on each bid

    // Call bid history callback
    onBidPlaced(nextBidAmount);

    // Move to BIDDING_ACTIVE if in PLAYER_ANNOUNCED
    if (biddingStage === 'PLAYER_ANNOUNCED') {
      setBiddingStage('BIDDING_ACTIVE');
    }

    // If in final stages, reset back to BIDDING_ACTIVE
    if (biddingStage === 'GOING_ONCE' || biddingStage === 'GOING_TWICE') {
      setBiddingStage('BIDDING_ACTIVE');
    }

    // Only add log in offline mode - online mode will add via socket listener
    if (!isOnline) {
      addLog(
        `💰 ${auctionTeams.find(t => t.id === myTeamId)?.iplTeamId || 'Your'} team bid ₹${nextBidAmount}L for ${currentPlayer.name}`,
        'bid'
      );
    }

    if (isOnline) {
      console.log(`📤 Emitting auctionBid:`, { code: onlineRoom?.code, playerName: currentPlayer?.name, bid: nextBidAmount });
      socket?.emit('auctionBid', {
        code: onlineRoom?.code,
        playerName: currentPlayer.name,
        bid: nextBidAmount,
        teamId: myTeamId,
      });
    }
  }, [isOnline, currentPlayer, currentBid, myTeamId, socket, onlineRoom, auctionTeams, biddingStage]);
  // Calculate next bid amount
  const getNextBidAmount = () => {
    const increment = getBidIncrement(currentBid);
    return currentBid + increment;
  };

  // Validate if a bid is allowed
  const validateBid = (bidAmount) => {
    const team = auctionTeams.find(t => t.id === myTeamId);
    
    if (!team) {
      return { valid: false, reason: 'Team not found' };
    }
    
    // Prevent same team from bidding consecutively
    if (currentBidder === myTeamId) {
      return { valid: false, reason: 'Wait for another team to bid' };
    }
    
    // Allow bidding in these stages
    if (biddingStage !== 'BIDDING_ACTIVE' && biddingStage !== 'GOING_ONCE' && biddingStage !== 'GOING_TWICE' && biddingStage !== 'PLAYER_ANNOUNCED') {
      return { valid: false, reason: 'Bidding is not active' };
    }
    
    if (bidAmount > team.purse) {
      return { valid: false, reason: `Insufficient purse. Available: ₹${team.purse}L` };
    }
    
    if (team.squad.length >= AUCTION_CONFIG.SQUAD_MAX) {
      return { valid: false, reason: 'Squad is full' };
    }
    
    if (currentPlayer?.isOverseas && team.overseasCount >= AUCTION_CONFIG.MAX_OVERSEAS) {
      return { valid: false, reason: 'Overseas limit reached' };
    }
    
    return { valid: true };
  };

  if (auctionPhase === 'initializing') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-brand-gold border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400">Initializing auction...</p>
        </div>
      </div>
    );
  }

  if (auctionPhase === 'ready') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 relative overflow-hidden p-4">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-purple-900/20 via-slate-950 to-slate-950" />

        <div className="relative z-10 glass-panel rounded-3xl p-8 w-full max-w-4xl bg-slate-950/80 text-center">
          <h2 className="font-broadcast text-5xl text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-brand-gold mb-4">
            ⚡ Ready to Auction
          </h2>
          <p className="text-slate-400 mb-8">
            {queue.length} players ready for auction
          </p>

          {isHost ? (
            <button
              onClick={() => {
                console.log(`🚀 Start Auction clicked. isOnline: ${isOnline}, socket: ${socket?.id}, queue: ${queue.length}`);
                if (isOnline && socket) {
                  // Emit queue to server so all players get the same queue
                  console.log(`📤 Emitting auctionQueueSync with ${queue.length} players to room ${onlineRoom?.code}`);
                  console.log(`   First 5 players: ${queue.slice(0, 5).map(p => p.name).join(', ')}`);
                  socket.emit('auctionQueueSync', {
                    code: onlineRoom?.code,
                    queue: queue,
                  });
                  // Delay phase transition so guests receive queue sync first
                  setTimeout(() => {
                    setAuctionPhase('running');
                  }, 500);
                } else {
                  console.log('📋 Offline mode - no socket emit');
                  setAuctionPhase('running');
                }
              }}
              className="px-8 py-4 bg-gradient-to-r from-purple-600 to-brand-gold hover:shadow-lg hover:shadow-purple-500/50 text-white font-broadcast text-2xl rounded-xl transition-all transform hover:scale-105"
            >
              Start Auction Now
            </button>
          ) : (
            <div className="text-slate-400 text-center">
              <p>Waiting for host to start auction...</p>
            </div>
          )}

          <div className="mt-8 pt-8 border-t border-slate-700 grid grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-slate-500">Total Players</p>
              <p className="text-3xl font-bold text-brand-gold">{queue.length}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Teams</p>
              <p className="text-3xl font-bold text-purple-400">{auctionTeams.length}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Total Purse</p>
              <p className="text-3xl font-bold text-blue-400">₹{auctionTeams.length * AUCTION_CONFIG.TOTAL_PURSE}L</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (auctionPhase === 'completed') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 relative overflow-hidden p-4">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-purple-900/20 via-slate-950 to-slate-950" />

        <div className="relative z-10 glass-panel rounded-3xl p-8 w-full max-w-4xl bg-slate-950/80 text-center">
          <h2 className="font-broadcast text-6xl text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-brand-gold mb-4">
            🎉 Auction Complete!
          </h2>
          <p className="text-slate-400 mb-8">
            {soldPlayers.length} players sold | {unsold.length} players unsold
          </p>

          <div className="grid grid-cols-3 gap-4 mb-8">
            {auctionTeams.slice(0, 3).map((team, i) => (
              <div key={i} className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
                <p className="text-sm font-bold text-white mb-2">{team.name}</p>
                <p className="text-xs text-slate-400">
                  Squad: {team.squad.length}/{AUCTION_CONFIG.SQUAD_MAX}
                </p>
                <p className="text-sm font-bold text-brand-gold mt-1">
                  ₹{team.purse}L remaining
                </p>
              </div>
            ))}
          </div>

          <div className="flex gap-4 justify-center">
            <button
              onClick={onBack}
              className="px-8 py-3 border-2 border-slate-700 rounded-xl text-slate-400 hover:text-white transition-colors font-bold"
            >
              Back to Menu
            </button>
            <button
              onClick={() => onComplete(auctionTeams)}
              className="px-8 py-3 bg-gradient-to-r from-purple-600 to-brand-gold rounded-xl text-white font-bold hover:shadow-lg transition-all"
            >
              View Final Squads
            </button>
          </div>
        </div>
      </div>
    );
  }

  const myTeam = auctionTeams.find(t => t.id === myTeamId);

  // Show loading screen while waiting for first player to be announced
  if (auctionPhase === 'running' && !currentPlayer) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 relative overflow-hidden p-4">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-purple-900/20 via-slate-950 to-slate-950" />
        
        <div className="relative z-10 glass-panel rounded-3xl p-8 w-full max-w-2xl bg-slate-950/80 text-center">
          <h2 className="font-broadcast text-4xl text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-brand-gold mb-4">
            ⏳ Starting Auction...
          </h2>
          <p className="text-slate-400 mb-8">
            {isOnline ? 'Waiting for queue sync from host...' : 'Preparing first player...'}
          </p>
          
          <div className="animate-pulse">
            <div className="h-12 bg-gradient-to-r from-purple-900/50 to-brand-gold/50 rounded-lg mb-4"></div>
            <div className="h-8 bg-slate-800/50 rounded-lg"></div>
          </div>
          
          <p className="text-xs text-slate-500 mt-8">Queue: {queue.length} players</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-purple-900/20 via-slate-950 to-slate-950" />

      <div className="relative z-10 flex-1 flex flex-col max-w-full">
        {/* Header */}
        <div className="border-b border-slate-800 px-4 py-4 sm:px-6">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-slate-400 hover:text-purple-400 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
              <span className="text-sm">Back</span>
            </button>

            <div className="text-center flex-1">
              <h1 className="font-broadcast text-3xl text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-brand-gold">
                IPL Auction
              </h1>
            </div>

            <div className="w-24" />
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-4 gap-2 sm:gap-4">
            <div className="text-center">
              <p className="text-xs text-slate-500">Sold</p>
              <p className="text-lg sm:text-xl font-bold text-brand-gold">
                {soldPlayers.length}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-slate-500">Remaining</p>
              <p className="text-lg sm:text-xl font-bold text-purple-400">
                {queue.length}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-slate-500">Unsold</p>
              <p className="text-lg sm:text-xl font-bold text-slate-400">
                {unsold.length}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-slate-500">My Squad</p>
              <p className="text-lg sm:text-xl font-bold text-blue-400">
                {myTeam?.squad.length || 0}/{AUCTION_CONFIG.SQUAD_MAX}
              </p>
            </div>
          </div>
        </div>
        {/* MAIN AUCTION LAYOUT */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 p-4 sm:p-6 overflow-hidden">
          {/* CENTER: PLAYER CARD & BIDDING - Full width on mobile, 1 column on desktop */}
          <div className="lg:col-span-2 flex flex-col gap-3 h-full overflow-hidden">
            {currentPlayer && (
              <>
                {/* TIMER & SET BOX - Side by side, equal width */}
                <div className="grid grid-cols-2 gap-3 flex-shrink-0">
                  {/* TIMER */}
                  <div className="glass-panel rounded-2xl p-4 bg-gradient-to-br from-slate-900/50 to-purple-900/50 border border-purple-700/50">
                    <div className="space-y-3">
                      <div className="text-center">
                        <div className="text-xs font-semibold px-2 py-1 rounded-lg bg-slate-800/50 inline-block">
                          {biddingStage === 'BIDDING_ACTIVE' && (
                            <span className="text-emerald-400">🟢 BIDDING ACTIVE</span>
                          )}
                          {biddingStage === 'GOING_ONCE' && (
                            <span className="text-yellow-400">🟡 GOING ONCE...</span>
                          )}
                          {biddingStage === 'GOING_TWICE' && (
                            <span className="text-orange-400">🟠 GOING TWICE...</span>
                          )}
                          {biddingStage === 'PLAYER_ANNOUNCED' && (
                            <span className="text-blue-400">🔵 PLAYER ANNOUNCED</span>
                          )}
                        </div>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-slate-400 mb-1">Time</p>
                        <div className={`text-5xl font-bold font-mono ${
                          timer <= 3
                            ? 'text-red-400 animate-pulse'
                            : timer <= 5
                            ? 'text-orange-400'
                            : 'text-emerald-400'
                        }`}>
                          {timer}s
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* SET CONTEXT DISPLAY */}
                  {currentPlayer && getSetById && (
                    <div>
                      <SetContextDisplay
                        setContext={{
                          currentSet: getSetById(currentPlayer.auctionSet),
                          currentPlayer,
                          playerIndexInSet: fullQueue.filter(p => p.auctionSet === currentPlayer.auctionSet).findIndex(p => p.name === currentPlayer.name) + 1,
                          totalInSet: fullQueue.filter(p => p.auctionSet === currentPlayer.auctionSet).length,
                          playersRemainingInSet: queue.filter(p => p.auctionSet === currentPlayer.auctionSet).length,
                          playersInSet: fullQueue.filter(p => p.auctionSet === currentPlayer.auctionSet),
                        }}
                        soldPlayers={soldPlayers}
                        queue={queue}
                      />
                    </div>
                  )}
                </div>

                {/* PLAYER CARD & BIDDING - Side by side */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 overflow-hidden max-h-96 relative">
                  {/* PLAYER CARD */}
                  <div className={`glass-panel rounded-2xl p-4 bg-slate-950/50 border-2 border-brand-gold/50 overflow-y-auto transition-all duration-300 ${
                    showSoldOverlay ? 'ring-4 ring-green-400 scale-100' : ''
                  }`}>
                    <div className="space-y-2">
                      <div className="flex flex-col items-center text-center">
                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 to-brand-gold p-0.5 mb-2">
                          <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center">
                            <span className="text-2xl font-bold text-brand-gold">
                              {currentPlayer.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <h3 className="text-xl font-bold text-white">
                          {currentPlayer.name}
                        </h3>
                      </div>

                      <div className="text-center space-y-1">
                        <p className="text-xs text-slate-400">
                          <span className="font-semibold text-slate-300">{currentPlayer.role}</span>
                          {currentPlayer.isOverseas && ' • 🌍 Overseas'}
                        </p>
                      </div>

                      <div className="border-t border-slate-700 pt-2">
                        <p className="text-[10px] text-slate-400 text-center mb-1">Current Bid</p>
                        <p className="text-3xl font-bold text-brand-gold text-center">
                          ₹{currentBid ? currentBid : (currentPlayer.basePrice || basePrice)}L
                        </p>
                        {currentBidder && (
                          <p className="text-xs text-slate-300 text-center mt-1">
                            💼 {auctionTeams.find(t => t.id === currentBidder)?.iplTeamId}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* SOLD OVERLAY */}
                    {showSoldOverlay && lastSoldPlayer && (
                      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-green-500/90 to-emerald-600/90 flex flex-col items-center justify-center gap-2 animate-pulse">
                        <div className="text-6xl font-bold text-white drop-shadow-lg">✓ SOLD</div>
                        <div className="text-2xl font-bold text-white drop-shadow-lg">₹{lastSoldPlayer.price}L</div>
                        <div className="text-lg text-white drop-shadow-lg font-semibold">
                          {auctionTeams.find(t => t.id === lastSoldPlayer.teamId)?.iplTeamId}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* BIDDING SECTION */}
                  <div className="glass-panel rounded-2xl p-3 bg-slate-950/50 border border-slate-700 overflow-y-auto">
                    <h4 className="text-sm font-bold text-white mb-2">💰 Place Your Bid</h4>
                    {auctionPhase === 'running' && currentPlayer ? (
                      <div className="space-y-2">
                        {bidError && (
                          <div className="text-xs bg-red-500/20 border border-red-500/50 text-red-400 px-2 py-1 rounded">
                            ⚠️ {bidError}
                          </div>
                        )}

                        <div className="bg-slate-800/50 rounded-lg p-2">
                          <p className="text-xs text-slate-400">Next Bid</p>
                          <p className="text-xl font-bold text-purple-300">
                            ₹{getNextBidAmount()}L
                          </p>
                        </div>

                        <button
                          onClick={handlePlaceBid}
                          disabled={!validateBid(getNextBidAmount()).valid}
                          className="w-full py-3 px-3 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 disabled:from-slate-700 disabled:to-slate-800 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-all text-base"
                        >
                          🔔 BID ₹{getNextBidAmount()}L
                        </button>

                        {myTeam && (
                          <div className="text-xs space-y-0.5 bg-slate-800/30 rounded-lg p-2 border border-slate-700">
                            <div className="flex justify-between">
                              <span>💰 Purse:</span>
                              <span className="text-emerald-400 font-bold">₹{myTeam.purse}Cr</span>
                            </div>
                            <div className="flex justify-between">
                              <span>👥 Squad:</span>
                              <span className="text-blue-400">{myTeam.squad.length}/{AUCTION_CONFIG.SQUAD_MAX}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-xs text-slate-400 text-center py-2">
                        {auctionPhase === 'ready' && '⏸️ Not started'}
                        {auctionPhase === 'completed' && '✓ Completed'}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* FOOTER REMOVED - Now in AuctionAnalytics component */}
      </div>
    </div>
  );
};

export default AuctionRoom;

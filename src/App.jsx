// src/App.jsx
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import MatchCenter from "./components/match/MatchCenter";
import PlayerSearch from "./components/shared/PlayerSearch";
import TeamListItem from "./components/shared/TeamListItem";
import TournamentBracket from "./components/tournament/TournamentBracket";
import TournamentLeaderboards from "./components/tournament/TournamentLeaderboards";
import AuctionRoom from "./components/auction/AuctionRoom";
import useMatchEngine from "./hooks/useMatchEngine";
import { Zap, Trophy, ChevronLeft, Shuffle } from "./components/shared/Icons";

import { MOCK_DB } from "./data/mockDb";
import rawIplData from "./data/iplData.json";
import { processIPLData } from "./data/cricketProcessing";
import { socket } from "./socket";

const IPL_TEAMS = [
  { id: "MI", name: "Mumbai Indians", color: "#004BA0", logo: "https://scores.iplt20.com/ipl/teamlogos/MI.png" },
  { id: "CSK", name: "Chennai Super Kings", color: "#FDB913", logo: "https://scores.iplt20.com/ipl/teamlogos/CSK.png" },
  { id: "RCB", name: "Royal Challengers Bangalore", color: "#EC1C24", logo: "https://scores.iplt20.com/ipl/teamlogos/RCB.png" },
  { id: "KKR", name: "Kolkata Knight Riders", color: "#3A225D", logo: "https://scores.iplt20.com/ipl/teamlogos/KKR.png" },
  { id: "DC", name: "Delhi Capitals", color: "#004C93", logo: "https://scores.iplt20.com/ipl/teamlogos/DC.png" },
  { id: "PBKS", name: "Punjab Kings", color: "#ED1B24", logo: "https://scores.iplt20.com/ipl/teamlogos/PBKS.png" },
  { id: "RR", name: "Rajasthan Royals", color: "#254AA5", logo: "https://scores.iplt20.com/ipl/teamlogos/RR.png" },
  { id: "SRH", name: "Sunrisers Hyderabad", color: "#FF822A", logo: "https://scores.iplt20.com/ipl/teamlogos/SRH.png" },
  { id: "LSG", name: "Lucknow Super Giants", color: "#1C4595", logo: "https://scores.iplt20.com/ipl/teamlogos/LSG.png" },
  { id: "GT", name: "Gujarat Titans", color: "#1C2E4A", logo: "https://scores.iplt20.com/ipl/teamlogos/GT.png" }
];

const generateId = () => Math.random().toString(36).slice(2);

// Helper to get team display info
const getTeamDisplay = (team) => {
  if (!team) return { name: "Unknown", logo: null, color: "#666" };
  const iplTeam = IPL_TEAMS.find(t => t.id === team.iplTeamId);
  return {
    name: iplTeam ? iplTeam.name : team.name,
    logo: iplTeam ? iplTeam.logo : null,
    color: iplTeam ? iplTeam.color : "#666",
    shortName: iplTeam ? iplTeam.id : team.name
  };
};

// ---------- LOCAL PLAYER POOL (MOCK + IPL JSON) ----------
const buildLocalPool = () => {
  const base = Array.isArray(MOCK_DB) ? [...MOCK_DB] : [];

  let iplPlayers = [];
  try {
    if (rawIplData && typeof rawIplData === "object" && !Array.isArray(rawIplData)) {
      const processed = processIPLData(rawIplData);
      if (Array.isArray(processed)) {
        iplPlayers = processed;
      }
    }
  } catch (err) {
    console.error("Failed to process IPL data in App:", err);
  }

  const merged = [...iplPlayers, ...base];
  const seen = new Set();
  return merged.filter((p) => {
    if (!p || !p.name) return false;
    const key = p.name.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const LOCAL_POOL = buildLocalPool();

const App = () => {
  // App.jsx (inside App component, with other state hooks)
  const [onlineName, setOnlineName] = useState("");

  const [view, setView] = useState("menu"); // menu | quick_setup | tourn_setup | tourn_draft | tourn_hub | online_entry | online_menu | match | auction_lobby | auction

  const navigate = useNavigate();
  const location = useLocation();

  // Map view states to URL paths (memoized to avoid recreation)
  const viewToPath = React.useMemo(() => ({
    menu: "/",
    quick_setup: "/quick-setup",
    tourn_setup: "/tournament/setup",
    tourn_draft: "/tournament/draft",
    tourn_hub: "/tournament/hub",
    online_entry: "/online",
    online_menu: "/online/lobby",
    match: "/match",
    auction_lobby: "/auction/lobby",
    auction: "/auction/room",
  }), []);

  // Create reverse mapping (memoized)
  const pathToView = React.useMemo(() => {
    return Object.entries(viewToPath).reduce((acc, [key, value]) => {
      acc[value] = key;
      return acc;
    }, {});
  }, [viewToPath]);

  // Ref to track current view without creating effect dependencies
  const viewRef = React.useRef(view);
  useEffect(() => {
    viewRef.current = view;
  }, [view]);

  // Sync URL when view changes
  useEffect(() => {
    const path = viewToPath[view];
    if (path && location.pathname !== path) {
      navigate(path, { replace: false });
    }
  }, [view, viewToPath, navigate]);

  // Sync view when URL changes (e.g. back button or manual entry)
  // Only runs when pathname changes, not when view changes
  useEffect(() => {
    const currentPath = location.pathname;
    const newView = pathToView[currentPath];
    
    if (newView && newView !== viewRef.current) {
      setView(newView);
    } else if (!newView && currentPath === "/" && viewRef.current !== "menu") {
      setView("menu");
    }
  }, [location.pathname, pathToView]);

  const [teamA, setTeamA] = useState({
    id: "A",
    name: "Team Alpha",
    players: [],
  });
  const [teamB, setTeamB] = useState({
    id: "B",
    name: "Team Omega",
    players: [],
  });

  const [tournTeams, setTournTeams] = useState([]);
  const [auctionTeams, setAuctionTeams] = useState([]);
  const [fixtures, setFixtures] = useState([]);
  const [tournPhase, setTournPhase] = useState("league"); // "league", "semi", "final", "complete"
  const [selectedFixture, setSelectedFixture] = useState(null); // For match summary modal
  const [showToss, setShowToss] = useState(false); // For toss animation
  const [tossWinner, setTossWinner] = useState(null); // Team that won toss
  const [newTeamName, setNewTeamName] = useState("");
  const [activeTeamSelect, setActiveTeamSelect] = useState(null);
  const [tournamentStartError, setTournamentStartError] = useState(null); // Tournament start validation error

  const [matchTab, setMatchTab] = useState("live"); // live | scorecard | commentary

  // 🔌 Online state
  const [onlineRoom, setOnlineRoom] = useState(null);
  const [playerName, setPlayerName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [joinError, setJoinError] = useState("");
  const [onlineGameType, setOnlineGameType] = useState(null); // "quick" | "tournament" | null
  const [isStartingMatch, setIsStartingMatch] = useState(false);

  // Guest's mirror state for online matches
  const [remoteMatchState, setRemoteMatchState] = useState(null);
  
  // Ref to prevent broadcast loop when receiving tournament team updates
  const isReceivingTeamUpdate = React.useRef(false);
  
  // Ref to track if guest has already marked themselves as ready
  const guestMarkedReady = React.useRef(false);

  const {
    matchState,
    startQuickMatch,
    startTournamentMatch,
    bowlBall,
    skipOver,
    skipFiveOvers,
    skipTenOvers,
    skipInnings,
    handleInningsBreak,
    resetMatch,
    syncMatchState,
  } = useMatchEngine();

  // Derived online flags
  const isOnline = !!onlineRoom;
  const isOnlineHost = isOnline && onlineRoom?.host === socket.id;

  // Expose socket globally for MatchView wrapper functions
  useEffect(() => {
    window.__socket = socket;
  }, []);

  // 🔍 Debug logging
  useEffect(() => {
    if (isOnline) {
      console.log("🔍 Online Status:", {
        mySocketId: socket.id,
        hostSocketId: onlineRoom?.hostSocketId,
        isOnlineHost,
        roomCode: onlineRoom?.code
      });
    }
  }, [isOnline, isOnlineHost, onlineRoom]);

  // ✅ Everyone uses local matchState, synced via socket
  const effectiveMatchState = matchState;

  // ---------- SOCKET LISTENERS: ROOM UPDATES ----------
  useEffect(() => {
    function handleRoomUpdate(room) {
      console.log("📥 Received roomUpdate:", JSON.stringify(room, null, 2)); // 🔍 Debug
      setOnlineRoom(room);

      // convenience: keep joinCode in sync with room code
      if (!joinCode) setJoinCode(room.code);
    }

    socket.on("roomUpdate", handleRoomUpdate);

    return () => {
      socket.off("roomUpdate", handleRoomUpdate);
    };
  }, [joinCode]);

  // ------------------------------------------
// ⭐ NEW useEffect – handles navigation sync
// ------------------------------------------
  useEffect(() => {
    function handleNavigateQuickSetup() {
      const mySide =
          onlineRoom?.players?.find((p) => p.socketId === socket.id)?.side || "A";

      setActiveTeamSelect(mySide);
      setView("quick_setup");
    }

    function handleNavigateTournamentSetup() {
      if (!onlineRoom?.players) return;
      
      console.log('📍 handleNavigateTournamentSetup called');
      console.log('  Current onlineRoom.players:', onlineRoom.players.map(p => ({ name: p.name, side: p.side })));
      
      // Initialize/update tournament teams based on current players in room
      setTournTeams(prevTeams => {
        // Get unique sides from current players
        const uniqueSides = [...new Set(onlineRoom.players.map(p => p.side))];
        const prevTeamIds = new Set(prevTeams.map(t => t.id));
        
        console.log(`  prevTeams.length: ${prevTeams.length}, uniqueSides.length: ${uniqueSides.length}`);
        console.log(`  uniqueSides: [${uniqueSides.join(', ')}]`);
        console.log(`  prevTeamIds: [${Array.from(prevTeamIds).join(', ')}]`);
        
        // Check if number of teams changed (new player joined)
        if (uniqueSides.length !== prevTeams.length) {
          console.log(`🎯 Player count changed: was ${prevTeams.length}, now ${uniqueSides.length} - reinitializing teams`);
          
          // Initialize teams for unique sides
          const teams = uniqueSides.map(side => {
            // Check if this team already exists in prevTeams and preserve its players
            const existingTeam = prevTeams.find(t => t.id === side);
            if (existingTeam) {
              console.log(`  📌 Keeping existing team ${side} with ${existingTeam.players.length} players`);
              return existingTeam;
            }
            
            const player = onlineRoom.players.find(p => p.side === side);
            const iplTeam = IPL_TEAMS.find(t => t.id === player?.iplTeam);
            console.log(`  ✨ Creating new team ${side} (player: ${player?.name || 'unknown'})`);
            return {
              id: side,
              name: iplTeam ? iplTeam.name : `Team ${side}`,
              iplTeamId: player?.iplTeam,
              players: [],
              played: 0,
              won: 0,
              pts: 0,
              nrr: 0,
              runsScored: 0,
              oversFaced: 0,
              runsConceded: 0,
              oversBowled: 0
            };
          });
          console.log('🎯 Final tournament teams:', teams.map(t => ({ id: t.id, playerCount: t.players.length })));
          return teams;
        } else {
          console.log(`✅ No change in player count, keeping existing teams`);
        }
        
        // No change in player count, keep existing teams
        return prevTeams;
      });
      
      // Set active team to current player's team
      const mySide = onlineRoom?.players?.find((p) => p.socketId === socket.id)?.side || "A";
      setActiveTeamSelect(mySide);
      setView("tourn_setup");
    }

    function handleTournamentFixturesGenerated({ fixtures }) {
      console.log("🏆 Received tournament fixtures:", fixtures);
      setFixtures(fixtures);
      setTournPhase("league");
      setTournamentStartError(null); // Clear any previous errors
      setView("tourn_hub");
    }
    
    function handleTournamentStartError({ error }) {
      console.error("❌ Tournament start error:", error);
      setTournamentStartError(error);
      // Auto-clear error after 5 seconds
      setTimeout(() => {
        setTournamentStartError(null);
      }, 5000);
    }
    
    function handleNavigateToTournamentHub() {
      resetMatch();
      setView("tourn_hub");
    }
    
    function handleNavigateToAuctionLobby() {
      setView("auction_lobby");
    }
    
    function handleStartAuction() {
      console.log("🔨 Received startAuction event");
      setView("auction");
    }
    
    function handleTournamentResultsUpdate({ fixtures: updatedFixtures, tournTeams: updatedTeams, phase }) {
      console.log("📊 Received tournament results update");
      console.log(`   Fixtures: ${updatedFixtures?.length || 0}`, updatedFixtures?.map(f => ({ id: f.id, played: f.played, winner: f.winner })));
      console.log(`   Teams: ${updatedTeams?.length || 0}`, updatedTeams?.map(t => ({ id: t.id, pts: t.pts, won: t.won, nrr: t.nrr })));
      console.log(`   Phase: ${phase}`);
      
      if (updatedFixtures && updatedFixtures.length > 0) {
        setFixtures(updatedFixtures);
      }
      if (updatedTeams && updatedTeams.length > 0) {
        setTournTeams(updatedTeams);
      }
      if (phase) {
        setTournPhase(phase);
      }
      console.log(`✅ Tournament state updated from broadcast`);
    }

    function handleReceiveToss({ tossWinner, tossWinnerName }) {
      console.log(`🏏 Guest received toss result: ${tossWinnerName} (ID: ${tossWinner})`);
      // Find the team object matching the toss winner ID
      const winnerTeam = teamA.id === tossWinner ? teamA : teamB.id === tossWinner ? teamB : null;
      if (winnerTeam) {
        setTossWinner(winnerTeam);
        setShowToss(true);
        console.log(`✅ Guest showing toss animation for: ${winnerTeam.name}`);
        
        // Hide toss after 3 seconds (match host timing)
        setTimeout(() => {
          setShowToss(false);
        }, 3000);
      }
    }

    socket.on("navigateToQuickSetup", handleNavigateQuickSetup);
    socket.on("navigateToTournamentSetup", handleNavigateTournamentSetup);
    socket.on("navigateToAuctionLobby", handleNavigateToAuctionLobby);
    socket.on("startAuction", handleStartAuction);
    socket.on("tournamentFixturesGenerated", handleTournamentFixturesGenerated);
    socket.on("tournamentStartError", handleTournamentStartError);
    socket.on("navigateToTournamentHub", handleNavigateToTournamentHub);
    socket.on("tournamentResultsUpdate", handleTournamentResultsUpdate);
    socket.on("receiveToss", handleReceiveToss);

    return () => {
      socket.off("navigateToQuickSetup", handleNavigateQuickSetup);
      socket.off("navigateToTournamentSetup", handleNavigateTournamentSetup);
      socket.off("navigateToAuctionLobby", handleNavigateToAuctionLobby);
      socket.off("startAuction", handleStartAuction);
      socket.off("tournamentFixturesGenerated", handleTournamentFixturesGenerated);
      socket.off("tournamentStartError", handleTournamentStartError);
      socket.off("navigateToTournamentHub", handleNavigateToTournamentHub);
      socket.off("tournamentResultsUpdate", handleTournamentResultsUpdate);
      socket.off("receiveToss", handleReceiveToss);
    };
  }, [onlineRoom]);



  // ---------- SOCKET LISTENERS: MATCH SYNC ----------
  useEffect(() => {
    function handleMatchStarted(data) {
      console.log("📢 Raw matchStarted event received:", data);
      
      // Extract matchState from data
      const receivedState = data?.matchState || data;
      
      if (!receivedState) {
        console.error("❌ No matchState in matchStarted event", data);
        return;
      }
      
      // Both host and guest receive this when host starts match
      console.log("✅ 📢 Processing matchStarted with state:", receivedState);

      syncMatchState(receivedState);
      setMatchTab("live");
      setView("match");
      console.log("✅ View changed to 'match'");
    }

    function handleMatchStateUpdate({ matchState: receivedState }) {
      if (!receivedState) return;
      // Only sync if ballsBowled changed to reduce jitter
      if (matchState && receivedState.ballsBowled === matchState.ballsBowled) return;
      
      console.log(`📊 Guest received matchStateUpdated event - Balls: ${receivedState.ballsBowled}`);
      // Update ref so we don't re-broadcast this state
      lastBroadcastedBallsRef.current = receivedState.ballsBowled;
      syncMatchState(receivedState);
      // Don't force tab switch - let user stay on their current view (scorecard, commentary, etc)
      setView("match"); // Guests navigate here when they receive first state
    }

    function handleBallBowled(data) {
      if (!data?.matchState) return;
      console.log(`🏏 Guest received ballBowled event - Balls: ${data.matchState.ballsBowled}`);
      // Update the ref so we don't re-broadcast this state
      lastBroadcastedBallsRef.current = data.matchState.ballsBowled;
      syncMatchState(data.matchState);
      // Don't force tab switch - let user stay on their current view
      setView("match");
    }

    function handleOverSkipped(data) {
      if (!data?.matchState) return;
      console.log(`⏭️ Guest received overSkipped event - Balls: ${data.matchState.ballsBowled}`);
      lastBroadcastedBallsRef.current = data.matchState.ballsBowled;
      syncMatchState(data.matchState);
      // Don't force tab switch - let user stay on their current view
      setView("match");
    }

    function handleInningsChanged(data) {
      if (!data?.matchState) return;
      console.log(`🔄 Guest received inningsChanged event - Innings: ${data.matchState.innings}`);
      syncMatchState(data.matchState);
      setMatchTab("live");
      setView("match");
    }

    function handleMatchEnded(data) {
      if (!data?.matchState) return;
      console.log(`✅ Guest received matchEnded event`);
      syncMatchState(data.matchState);
      setMatchTab("results");
      setView("match");
    }

    function handleEndOnlineMatch() {
      setRemoteMatchState(null);
      resetMatch();
      // Don't change view here - let navigateToTournamentHub handle it for tournaments
      // For quick matches, go to menu
      if (onlineRoom?.mode !== "tournament") {
        setView("menu");
      }
    }

    socket.on("matchStarted", handleMatchStarted);
    socket.on("matchStateUpdated", handleMatchStateUpdate);
    socket.on("ballBowled", handleBallBowled);
    socket.on("overSkipped", handleOverSkipped);
    socket.on("inningsChanged", handleInningsChanged);
    socket.on("matchEnded", handleMatchEnded);
    socket.on("matchStateUpdate", handleMatchStateUpdate);
    socket.on("endOnlineMatch", handleEndOnlineMatch);

    return () => {
      socket.off("matchStarted", handleMatchStarted);
      socket.off("matchStateUpdated", handleMatchStateUpdate);
      socket.off("ballBowled", handleBallBowled);
      socket.off("overSkipped", handleOverSkipped);
      socket.off("inningsChanged", handleInningsChanged);
      socket.off("matchEnded", handleMatchEnded);
      socket.off("matchStateUpdate", handleMatchStateUpdate);
      socket.off("endOnlineMatch", handleEndOnlineMatch);
    };
  }, []);

  // Ref to track the last broadcasted match state to prevent sync loops
  const lastBroadcastedBallsRef = React.useRef(-1);

  // Reset ref when innings changes to ensure new innings broadcasts first state
  useEffect(() => {
    if (!isOnline || !matchState) return;
    lastBroadcastedBallsRef.current = -1;
    console.log(`🔄 Reset broadcast ref for innings ${matchState.innings}`);
  }, [matchState?.innings, isOnline]);

  // ---------- BROADCAST matchState ON CHANGE (whoever is bowling) ----------
  useEffect(() => {
    if (!isOnline || view !== "match") {
      console.log(`⏭️ Broadcast skipped: isOnline=${isOnline}, view=${view}`);
      return;
    }
    if (!matchState || !onlineRoom?.code) {
      console.log(`⏭️ Broadcast skipped: no matchState or roomCode`);
      return;
    }

    // Get current player's side and team
    const mySide = onlineRoom.players?.find((p) => p.socketId === socket.id)?.side;
    const teamASideId = matchState.teamA?.id;
    const teamBSideId = matchState.teamB?.id;
    const mySideTeamId = mySide === "A" ? teamASideId : mySide === "B" ? teamBSideId : null;
    
    // Only broadcast if I have control (my team is bowling)
    const bowlingTeamId = matchState.bowlingTeam?.id;
    const hasControl = mySideTeamId === bowlingTeamId;
    
    console.log(`🎯 Broadcast check - Side: ${mySide}, MyTeamId: ${mySideTeamId}, Bowling: ${bowlingTeamId}, Control: ${hasControl}, Innings: ${matchState.innings}, Balls: ${matchState.ballsBowled}`);
    
    if (!hasControl) {
      console.log(`👀 My team not bowling (${mySideTeamId} vs bowling ${bowlingTeamId}), waiting for opponent`);
      return; // Don't broadcast if I'm not controlling
    }

    // Only broadcast if ballsBowled has actually changed from last broadcast
    if (lastBroadcastedBallsRef.current === matchState.ballsBowled && !matchState.isMatchOver) {
      console.log(`⏭️ Skipping - same balls (${matchState.ballsBowled})`);
      return; // No change in balls, don't broadcast
    }

    console.log(`📢 ${isOnlineHost ? "Host" : "Guest"} BROADCASTING - Balls: ${matchState.ballsBowled}, Innings: ${matchState.innings}, MyTeam: ${mySideTeamId}, Bowling: ${bowlingTeamId}`);
    lastBroadcastedBallsRef.current = matchState.ballsBowled;
    
    socket.emit("updateMatchState", {
      roomCode: onlineRoom.code,
      matchState,
    });
  }, [matchState?.ballsBowled, matchState?.isMatchOver, matchState?.innings, matchState?.battingTeam?.id, matchState?.bowlingTeam?.id, matchState?.teamA?.id, matchState?.teamB?.id, isOnline, view, onlineRoom, socket.id]);

  // Reset guest ready flag when leaving online room
  useEffect(() => {
    if (!isOnline || view !== "quick_setup") {
      guestMarkedReady.current = false;
    }
  }, [isOnline, view]);

  // ✅ SYNC TEAMS: Broadcast when teams change
  useEffect(() => {
    if (!isOnline || !onlineRoom?.code) return;
    if (view !== "quick_setup" && view !== "tourn_setup") return;
    if (isReceivingTeamUpdate.current) return; // Don't broadcast when receiving

    if (view === "quick_setup") {
      socket.emit("teamUpdate", {
        code: onlineRoom.code,
        teamA,
        teamB,
      });

      // ✅ Auto-mark guest as ready when they have 11 players selected (only once)
      const mySide = onlineRoom?.players?.find((p) => p.socketId === socket.id)?.side;
      const myTeam = mySide === "A" ? teamA : teamB;
      const playerCount = myTeam?.players?.length || 0;
      
      console.log(`📊 Player status - Side: ${mySide}, Players: ${playerCount}/11, Ready flag: ${guestMarkedReady.current}, IsHost: ${isOnlineHost}`);
      
      // ✅ AUTO-MARK READY FOR BOTH HOST AND GUEST when they have 11 players
      if (!guestMarkedReady.current && playerCount === 11) {
        console.log(`✅ Auto-marking ready with 11 players (${isOnlineHost ? "HOST" : "GUEST"})`);
        guestMarkedReady.current = true; // Set flag to prevent duplicate calls
        console.log(`📤 Emitting updateTeamPlayers with ${myTeam.players.length} players`);
        socket.emit("updateTeamPlayers", {
          roomCode: onlineRoom.code,
          teamPlayers: myTeam.players,
        }, (response) => {
          console.log("✅ updateTeamPlayers callback received:", response);
        });
      }
    } else if (view === "tourn_setup") {
      // Only broadcast the current player's own team for tournament setup
      const mySide = onlineRoom?.players?.find((p) => p.socketId === socket.id)?.side;
      const myTeam = tournTeams.find(t => t.id === mySide);
      
      if (myTeam) {
        console.log(`📤 Broadcasting MY tournament team (${mySide}):`, myTeam);
        socket.emit("tournamentTeamUpdate", {
          code: onlineRoom.code,
          teams: [myTeam], // Only send my own team
        });
      }
    }
  }, [teamA, teamB, tournTeams, isOnline, onlineRoom, view, isOnlineHost]);

  // ✅ SYNC TEAMS: Listen for other player's updates
  useEffect(() => {
    function handleTeamUpdate({ teamA: remoteTeamA, teamB: remoteTeamB }) {
      if (!isOnline) return;

      const mySide = onlineRoom?.players?.find((p) => p.socketId === socket.id)?.side;

      // Update only the OTHER player's team
      if (mySide === "A" && remoteTeamB) {
        setTeamB(remoteTeamB);
      } else if (mySide === "B" && remoteTeamA) {
        setTeamA(remoteTeamA);
      }
    }

    function handleTournamentTeamUpdate({ teams: remoteTeams }) {
      console.log('📥 Received tournament teams:', remoteTeams);
      if (!isOnline || view !== "tourn_setup") return;

      const mySide = onlineRoom?.players?.find((p) => p.socketId === socket.id)?.side;
      console.log('📥 My side:', mySide);

      // Set flag to prevent broadcast loop
      isReceivingTeamUpdate.current = true;

      // Merge remote teams with local teams
      setTournTeams(prevTeams => {
        console.log('📥 Previous teams:', prevTeams);
        const updatedTeams = [...prevTeams];
        
        remoteTeams.forEach(remoteTeam => {
          // Don't update my own team (it should be mine from local state)
          if (remoteTeam.id === mySide) {
            console.log('📥 Skipping own team (received from my broadcast):', mySide);
            return;
          }
          
          // Find team in updated array and update or add it
          const index = updatedTeams.findIndex(t => t.id === remoteTeam.id);
          if (index >= 0) {
            console.log('📥 Updating existing team:', remoteTeam.id, 'with', remoteTeam.players?.length || 0, 'players');
            updatedTeams[index] = remoteTeam;
          } else {
            console.log('📥 Adding new team:', remoteTeam.id, 'with', remoteTeam.players?.length || 0, 'players');
            updatedTeams.push(remoteTeam);
          }
        });
        
        // No need for deduplication anymore since we only broadcast single teams
        console.log('📥 Updated teams:', updatedTeams);
        return updatedTeams;
      });
      
      // Reset flag after state update - use shorter delay
      setTimeout(() => {
        isReceivingTeamUpdate.current = false;
        console.log('🟢 Broadcast flag cleared');
      }, 10);
    }

    socket.on("teamUpdate", handleTeamUpdate);
    socket.on("tournamentTeamUpdate", handleTournamentTeamUpdate);

    return () => {
      socket.off("teamUpdate", handleTeamUpdate);
      socket.off("tournamentTeamUpdate", handleTournamentTeamUpdate);
    };
  }, [isOnline, onlineRoom, view]);

  // ---------- TEAM MANAGEMENT (LOCAL) ----------

  const handleAddToActiveTeam = (player) => {
    if (!activeTeamSelect) {
      alert("Select a team first.");
      return;
    }

    if (view === "quick_setup") {
      if (activeTeamSelect === "A" || activeTeamSelect === "B") {
        const targetTeam = activeTeamSelect === "A" ? teamA : teamB;
        const setTeam = activeTeamSelect === "A" ? setTeamA : setTeamB;

        if (targetTeam.players.length >= 11) {
          alert("Team already has 11 players.");
          return;
        }

        if (targetTeam.players.find((p) => p.id === player.id)) {
          alert("Player already in this team.");
          return;
        }

        setTeam({
          ...targetTeam,
          players: [
            ...targetTeam.players,
            { ...player, instanceId: generateId() },
          ],
        });
      }
      return;
    }

    if (view === "tourn_draft" || view === "tourn_setup") {
      setTournTeams((prev) =>
          prev.map((t) => {
            if (t.id !== activeTeamSelect) return t;

            if ((t.players || []).length >= 11) return t;
            if ((t.players || []).find((p) => p.id === player.id)) return t;

            return {
              ...t,
              players: [
                ...(t.players || []),
                { ...player, instanceId: generateId() },
              ],
            };
          })
      );
    }
  };

  const handleRemoveFromTeam = (teamId, index) => {
    if (view === "quick_setup") {
      const targetTeam = teamId === "A" ? teamA : teamB;
      const setTeam = teamId === "A" ? setTeamA : setTeamB;

      const newPlayers = [...targetTeam.players];
      newPlayers.splice(index, 1);
      setTeam({ ...targetTeam, players: newPlayers });
      return;
    }

    if (view === "tourn_draft" || view === "tourn_setup") {
      setTournTeams((prev) =>
          prev.map((t) => {
            if (t.id !== teamId) return t;
            return {
              ...t,
              players: (t.players || []).filter((_, i) => i !== index),
            };
          })
      );
    }
  };

  const autoDraftQuickPlay = () => {
    const pool = Array.isArray(LOCAL_POOL) ? [...LOCAL_POOL] : [];

    if (pool.length < 22) {
      alert("Not enough players in the local database to auto-pick 2 XIs (need at least 22).");
      return;
    }

    const shuffled = [...pool].sort(() => Math.random() - 0.5);

    const bats = shuffled.filter((p) => p.role === "Bat");
    const alls = shuffled.filter((p) => p.role === "All");
    const bowls = shuffled.filter((p) => p.role === "Bowl");

    const usedIds = new Set();

    const pickFrom = (arr, count) => {
      const result = [];
      for (let i = 0; i < arr.length && result.length < count; i++) {
        const p = arr[i];
        if (!p || usedIds.has(p.id)) continue;
        usedIds.add(p.id);
        result.push(p);
      }
      return result;
    };

    const makeXI = () => {
      let squad = [];
      squad = squad.concat(pickFrom(bats, 4));
      squad = squad.concat(pickFrom(alls, 3));
      squad = squad.concat(pickFrom(bowls, 4));

      const remainingPool = shuffled.filter((p) => !usedIds.has(p.id));
      for (let i = 0; i < remainingPool.length && squad.length < 11; i++) {
        const p = remainingPool[i];
        usedIds.add(p.id);
        squad.push(p);
      }

      return squad.slice(0, 11).map((p) => ({
        ...p,
        instanceId: generateId(),
      }));
    };

    const squadA = makeXI();
    const squadB = makeXI();

    setTeamA((prev) => ({ ...prev, players: squadA }));
    setTeamB((prev) => ({ ...prev, players: squadB }));
  };

  // ---------- TOURNAMENT LOGIC ----------

  const addTournTeam = () => {
    if (!newTeamName.trim()) return;
    if (tournTeams.length >= 10) {
      alert("Max 10 teams.");
      return;
    }

    setTournTeams((prev) => [
      ...prev,
      {
        id: generateId(),
        name: newTeamName.trim(),
        players: [],
        played: 0,
        won: 0,
        pts: 0,
        nrr: 0,
        runsScored: 0,
        oversFaced: 0,
        runsConceded: 0,
        oversBowled: 0
      },
    ]);
    setNewTeamName("");
  };

  const createTournamentFixtures = () => {
    if (tournTeams.length < 3) {
      alert("Need at least 3 teams.");
      return;
    }

    const newFixtures = [];
    for (let i = 0; i < tournTeams.length; i++) {
      for (let j = i + 1; j < tournTeams.length; j++) {
        newFixtures.push({
          id: generateId(),
          t1: tournTeams[i].id,
          t2: tournTeams[j].id,
          winner: null,
          played: false,
        });
      }
    }
    setFixtures(newFixtures);
    setView("tourn_hub");
  };

  const handleTournamentMatchEnd = () => {
    if (!matchState) {
      setView("tourn_hub");
      return;
    }

    const { fixtureId, winner, mode } = matchState;
    if (mode !== "tourn" || !fixtureId) {
      setView("menu");
      resetMatch();
      return;
    }

    setTournTeams((prevTeams) => {
      if (!winner || winner === "Tie") {
        const fixture = fixtures.find((f) => f.id === fixtureId);
        if (!fixture) return prevTeams;
        return prevTeams.map((t) => {
          if (t.id === fixture.t1 || t.id === fixture.t2) {
            return {
              ...t,
              played: t.played + 1,
              pts: t.pts + 1,
            };
          }
          return t;
        });
      }

      return prevTeams.map((t) => {
        if (t.id === winner.id) {
          return {
            ...t,
            played: t.played + 1,
            won: t.won + 1,
            pts: t.pts + 2,
          };
        }

        const fixture = fixtures.find((f) => f.id === fixtureId);
        if (!fixture) return t;
        if (t.id === fixture.t1 || t.id === fixture.t2) {
          return {
            ...t,
            played: t.played + 1,
          };
        }
        return t;
      });
    });

    setFixtures((prev) =>
        prev.map((f) =>
            f.id === fixtureId
                ? {
                  ...f,
                  played: true,
                  winner: winner === "Tie" ? "Tie" : winner.id,
                }
                : f
        )
    );

    resetMatch();
    setView("tourn_hub");
  };

  useEffect(() => {
    if (isStartingMatch && matchState && isOnlineHost && onlineRoom?.code) {
      console.log(`📤 Host emitting startMatch for room ${onlineRoom.code}`);
      socket.emit("startMatch", { roomCode: onlineRoom.code, matchState });
      setIsStartingMatch(false);
    }
  }, [matchState, isStartingMatch, isOnlineHost, onlineRoom]);

  // ---------- MATCH STARTERS / ENDERS ----------

  const handleStartQuickMatch = () => {
    if (teamA.players.length < 2 || teamB.players.length < 2) {
      alert("Both teams need at least 2 players.");
      return;
    }

    // Show toss animation
    const winner = Math.random() > 0.5 ? teamA : teamB;
    setTossWinner(winner);
    setShowToss(true);
    
    // Broadcast toss to guest if online
    if (isOnline) {
      console.log(`📢 Broadcasting toss winner to guest: ${winner.name}`);
      socket.emit("broadcastToss", {
        roomCode: onlineRoom.code,
        tossWinner: winner.id,
        tossWinnerName: winner.name,
      });
    }
    
    setTimeout(() => {
      setShowToss(false);
      startQuickMatch(teamA, teamB);
      setMatchTab("live");
      setView("match");

      if (isOnline && isOnlineHost) {
        setIsStartingMatch(true);
      }
    }, 3000);
  };

  const handleStartTournamentFixture = (fixture) => {
    // Verify fixture still exists in current fixtures list
    const currentFixture = fixtures.find(f => f.id === fixture.id);
    if (!currentFixture || currentFixture.played) {
      alert("This match is no longer available.");
      return;
    }

    const t1 = tournTeams.find((t) => t.id === fixture.t1);
    const t2 = tournTeams.find((t) => t.id === fixture.t2);

    if (!t1 || !t2) return;
    if (t1.players.length < 2 || t2.players.length < 2) {
      alert("Both teams need at least 2 players for this fixture.");
      return;
    }

    // Show toss animation
    const winner = Math.random() > 0.5 ? t1 : t2;
    setTossWinner(winner);
    setShowToss(true);
    
    // Broadcast toss to guests if online
    if (isOnline) {
      console.log(`📢 Broadcasting tournament toss winner to guests: ${winner.name}`);
      socket.emit("broadcastToss", {
        roomCode: onlineRoom.code,
        tossWinner: winner.id,
        tossWinnerName: winner.name,
      });
    }
    
    setTimeout(() => {
      setShowToss(false);
      startTournamentMatch(fixture.id, t1, t2);
      setMatchTab("live");
      setView("match");

      if (isOnline && isOnlineHost) {
        setIsStartingMatch(true);
      }
    }, 3000);
  };

  const handleEndMatch = () => {
    if (matchState?.mode === "tourn") {
      if (isOnline && onlineRoom?.code) {
        if (isOnlineHost) {
          console.log(`🏁 Tournament match ended. Host calculating results...`);
          // Host: calculate and broadcast updates
          const { fixtureId, winner, innings1, innings2, batsmanStats, bowlerStats } = matchState;
          
          const updatedFixtures = fixtures.map((f) =>
              f.id === fixtureId ? { 
                ...f, 
                played: true, 
                winner: winner === "Tie" ? "Tie" : winner.id,
                innings1,
                innings2,
                batsmanStats,
                bowlerStats
              } : f
          );
          
          // Only update points and NRR during league phase
          const isLeagueMatch = tournPhase === "league";
          
          const updatedTeams = tournTeams.map((t) => {
            const fixture = fixtures.find((f) => f.id === fixtureId);
            if (!fixture || (t.id !== fixture.t1 && t.id !== fixture.t2)) return t;
            
            let updates = { ...t };
            
            // Update stats only for league matches
            if (isLeagueMatch && innings1 && innings2) {
              // Get this team's innings data
              const teamInnings = innings1.teamId === t.id ? innings1 : innings2;
              const oppInnings = innings1.teamId === t.id ? innings2 : innings1;
              
              updates.runsScored = (t.runsScored || 0) + teamInnings.score;
              updates.oversFaced = (t.oversFaced || 0) + teamInnings.overs;
              updates.runsConceded = (t.runsConceded || 0) + oppInnings.score;
              updates.oversBowled = (t.oversBowled || 0) + oppInnings.overs;
              
              // Calculate NRR: (runs scored / overs faced) - (runs conceded / overs bowled)
              const runRate = updates.oversFaced > 0 ? updates.runsScored / updates.oversFaced : 0;
              const concededRate = updates.oversBowled > 0 ? updates.runsConceded / updates.oversBowled : 0;
              updates.nrr = runRate - concededRate;
              
              updates.played = (t.played || 0) + 1;
              
              if (!winner || winner === "Tie") {
                updates.pts = (t.pts || 0) + 1;
              } else if (t.id === winner.id) {
                updates.won = (t.won || 0) + 1;
                updates.pts = (t.pts || 0) + 2;
              }
            }
            
            return updates;
          });
          
          console.log(`📋 Updated results:`, updatedTeams.map(t => ({ id: t.id, played: t.played, pts: t.pts, nrr: t.nrr })));
          
          // Update local state
          setFixtures(updatedFixtures);
          setTournTeams(updatedTeams);
          
          // Check if league phase is complete
          const allLeaguePlayed = updatedFixtures.every(f => f.played);
          if (allLeaguePlayed && tournPhase === "league") {
            console.log(`🏆 League phase complete, generating knockouts`);
            // Generate knockout fixtures
            const sorted = [...updatedTeams].sort((a, b) => {
              if (b.pts !== a.pts) return b.pts - a.pts;
              return (b.nrr || 0) - (a.nrr || 0);
            });
            const numTeams = sorted.length;
            
            let knockoutFixtures = [];
            if (numTeams <= 4) {
              // Direct final: 1st vs 2nd
              knockoutFixtures = [{
                id: `final-1`,
                t1: sorted[0].id,
                t2: sorted[1].id,
                played: false,
                stage: "final"
              }];
              setTournPhase("final");
            } else {
              // Semi-finals: 1st vs 4th, 2nd vs 3rd
              knockoutFixtures = [
                { id: `semi-1`, t1: sorted[0].id, t2: sorted[3].id, played: false, stage: "semi" },
                { id: `semi-2`, t1: sorted[1].id, t2: sorted[2].id, played: false, stage: "semi" }
              ];
              setTournPhase("semi");
            }
            
            const allFixtures = [...updatedFixtures, ...knockoutFixtures];
            setFixtures(allFixtures);
            
            // Broadcast knockout fixtures
            console.log(`📢 Broadcasting knockout fixtures`);
            socket.emit("tournamentResultsUpdate", {
              code: onlineRoom.code,
              fixtures: allFixtures,
              tournTeams: updatedTeams,
              phase: numTeams <= 4 ? "final" : "semi"
            });
          } else if (allLeaguePlayed && tournPhase === "semi") {
            console.log(`🏆 Semi-finals complete, generating final`);
            // Generate final from semi winners
            const semi1Winner = updatedFixtures.find(f => f.id === "semi-1")?.winner;
            const semi2Winner = updatedFixtures.find(f => f.id === "semi-2")?.winner;
            
            if (semi1Winner && semi2Winner) {
              const finalFixture = [{
                id: `final-1`,
                t1: semi1Winner,
                t2: semi2Winner,
                played: false,
                stage: "final"
              }];
              
              const allFixtures = [...updatedFixtures, ...finalFixture];
              setFixtures(allFixtures);
              setTournPhase("final");
              
              console.log(`📢 Broadcasting final fixture`);
              socket.emit("tournamentResultsUpdate", {
                code: onlineRoom.code,
                fixtures: allFixtures,
                tournTeams: updatedTeams,
                phase: "final"
              });
            }
          } else if (allLeaguePlayed && tournPhase === "final") {
            console.log(`🏆 Tournament complete!`);
            // Tournament complete
            setTournPhase("complete");
            console.log(`📢 Broadcasting tournament complete`);
            socket.emit("tournamentResultsUpdate", {
              code: onlineRoom.code,
              fixtures: updatedFixtures,
              tournTeams: updatedTeams,
              phase: "complete"
            });
          } else {
            // Broadcast regular update for each league match
            console.log(`📢 Broadcasting tournament results update after match ${fixtureId}`);
            socket.emit("tournamentResultsUpdate", {
              code: onlineRoom.code,
              fixtures: updatedFixtures,
              tournTeams: updatedTeams
            });
          }
          
          // Navigate everyone to hub AFTER broadcasting results
          console.log(`📢 Broadcasting navigation to tournament hub`);
          socket.emit("navigateToTournamentHub", { code: onlineRoom.code });
        }
        
        // Everyone (including host) navigates immediately
        console.log(`✅ Guest navigating to tournament hub`);
        resetMatch();
        setView("tourn_hub");
      } else {
        // Offline tournament
        handleTournamentMatchEnd();
      }
    } else {
      // Quick match
      if (isOnline && isOnlineHost && onlineRoom?.code) {
        socket.emit("endOnlineMatch", { code: onlineRoom.code });
      }
      resetMatch();
      setView("menu");
    }
  };

  // ---------- ONLINE (ROOM) HANDLERS ----------

  const handleHostOnlineMatch = () => {
    if (!playerName.trim()) {
      alert("Enter your name first.");
      return;
    }

    setJoinError("");

    const mode = onlineGameType === "tournament" ? "tournament" : onlineGameType === "auction" ? "auction" : "1v1";

    socket.emit(
        "createRoom",
        { mode, playerName: playerName.trim() },
        ({ code, room, error }) => {
          if (error) {
            setJoinError("Failed to create room.");
            return;
          }
          setOnlineRoom(room);
          setJoinCode(code);
          setView("online_menu");
        }
    );
  };

  const handleJoinOnlineMatch = () => {
    if (!playerName.trim()) {
      alert("Enter your name first.");
      return;
    }
    if (!joinCode.trim()) {
      alert("Enter a room code.");
      return;
    }

    setJoinError("");

    socket.emit(
        "joinRoom",
        {
          code: joinCode.trim().toUpperCase(),
          playerName: playerName.trim(),
        },
        (res) => {
          if (res?.error === "ROOM_NOT_FOUND") {
            setJoinError("Room not found.");
            return;
          }
          if (res?.error === "ROOM_FULL") {
            setJoinError("Room is full.");
            return;
          }
          if (res?.error) {
            setJoinError("Failed to join room.");
            return;
          }
          setOnlineRoom(res.room);
          setView("online_menu");
        }
    );
  };

  // ---------- VIEWS ----------

  const renderMenu = () => (
      <div className="min-h-screen relative overflow-hidden flex items-center justify-center bg-slate-950">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-emerald-900/20 via-slate-950 to-slate-950" />
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-brand-gold/10 rounded-full blur-[128px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-green-900/5 rounded-full blur-[100px]" />

        <div className="relative z-10 w-full max-w-7xl p-8 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-5 text-center lg:text-left space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-gold/10 border border-brand-gold/20 text-brand-gold text-xs font-bold tracking-widest uppercase mb-2">
              <span className="w-2 h-2 rounded-full bg-brand-gold animate-pulse" />
              Elite Edition
            </div>
            <h1 className="font-broadcast text-8xl md:text-9xl leading-none text-transparent bg-clip-text bg-gradient-to-br from-white via-slate-200 to-slate-500 drop-shadow-2xl">
              CRICSIM <br />
              <span className="text-brand-gold">PRO</span>
            </h1>
            <p className="text-slate-400 text-lg font-light max-w-md mx-auto lg:mx-0 leading-relaxed border-l-2 border-brand-gold/30 pl-4">
              Draft world-class talent, manage intricate stats, and
              simulate elite T20 clashes.
            </p>
          </div>

          <div className="lg:col-span-7 flex flex-col md:flex-row gap-6 w-full">
            <button
                onClick={() => {
                  setActiveTeamSelect("A");
                  setView("quick_setup");
                }}
                className="group relative flex-1 h-80 glass-card rounded-3xl p-8 text-left overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/60 z-0" />
              <div className="absolute top-0 right-0 p-32 bg-blue-500/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-blue-500/20 transition-colors" />
              <div className="relative z-10 h-full flex flex-col justify-between">
                <div className="w-14 h-14 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Zap className="w-8 h-8 text-blue-400" />
                </div>
                <div>
                  <h3 className="font-broadcast text-4xl text-white mb-2 group-hover:text-blue-400 transition-colors">
                    Quick Play
                  </h3>
                  <p className="text-slate-400 text-sm font-medium">
                    Instant 1v1 exhibition.
                  </p>
                </div>
                <div className="flex items-center gap-2 text-blue-400 text-xs font-bold tracking-widest uppercase opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                  Enter Arena
                </div>
              </div>
            </button>

            <button
                onClick={() => {
                  setOnlineGameType("auction");
                  setOnlineRoom(null);
                  setJoinCode("");
                  setJoinError("");
                  setView("online_entry");
                }}
                className="group relative flex-1 h-80 glass-card rounded-3xl p-8 text-left overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/60 z-0" />
              <div className="absolute top-0 right-0 p-32 bg-purple-500/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-purple-500/20 transition-colors" />
              <div className="relative z-10 h-full flex flex-col justify-between">
                <div className="w-14 h-14 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <span className="text-3xl">🔨</span>
                </div>
                <div>
                  <h3 className="font-broadcast text-4xl text-white mb-2 group-hover:text-purple-400 transition-colors">
                    Auction
                  </h3>
                  <p className="text-slate-400 text-sm font-medium">
                    IPL-style mega auction.
                  </p>
                </div>
                <div className="flex items-center gap-2 text-purple-400 text-xs font-bold tracking-widest uppercase opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                  Build Squad
                </div>
              </div>
            </button>

            <button
                onClick={() => setView("tourn_setup")}
                className="group relative flex-1 h-80 glass-card rounded-3xl p-8 text-left overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/60 z-0" />
              <div className="absolute top-0 right-0 p-32 bg-brand-gold/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-brand-gold/20 transition-colors" />
              <div className="relative z-10 h-full flex flex-col justify-between">
                <div className="w-14 h-14 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Trophy className="w-8 h-8 text-brand-gold" />
                </div>
                <div>
                  <h3 className="font-broadcast text-4xl text-white mb-2 group-hover:text-brand-gold transition-colors">
                    Tournament
                  </h3>
                  <p className="text-slate-400 text-sm font-medium">
                    League creation & drafting.
                  </p>
                </div>
                <div className="flex items-center gap-2 text-brand-gold text-xs font-bold tracking-widest uppercase opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                  Build Legacy
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
  );

  const renderQuickSetup = () => {
    const teamAHasXI = teamA.players.length === 11;
    const teamBHasXI = teamB.players.length === 11;

    // Offline: just need at least 2 each
    const offlineReady =
        teamA.players.length >= 2 && teamB.players.length >= 2;

    // Online: require full XIs
    const onlineReady = teamAHasXI && teamBHasXI;

    const canStart = isOnline ? onlineReady : offlineReady;
    
    // ✅ In online mode, show only player's own team
    const mySide = onlineRoom?.players?.find((p) => p.socketId === socket.id)?.side;
    const myTeam = isOnline 
      ? (mySide === "A" ? teamA : teamB)
      : null;
    
    const teams = isOnline && myTeam
      ? [{ id: myTeam.id, ...myTeam }]
      : [
          { id: "A", ...teamA },
          { id: "B", ...teamB },
        ];

    return (
        <div className="fixed inset-0 w-full flex flex-col bg-slate-950 overflow-hidden">
          <div className="relative z-10 w-full px-8 py-6 flex justify-between items-end border-b border-white/5 bg-slate-950/80 backdrop-blur-sm flex-shrink-0">
            <div>
              <h1 className="text-6xl font-broadcast text-white leading-none drop-shadow-lg">
                SQUAD SELECTION
              </h1>
              <p className="text-slate-400 uppercase tracking-widest text-sm ml-1">
                Build your playing XIs
              </p>
            </div>
            <div className="flex gap-4 items-center">
              <button
                  onClick={autoDraftQuickPlay}
                  className="px-6 py-3 rounded-full border border-brand-gold/50 text-brand-gold hover:bg-brand-gold/10 transition-all font-bold text-xs uppercase tracking-widest flex items-center gap-2"
              >
                <Shuffle size={16} /> Auto Pick
              </button>

              {/* If already in an online room, show room badge instead of "Play with Friends" */}
              {isOnline ? (
                  <div className="px-4 py-2 rounded-full bg-slate-900 border border-sky-600 text-sky-300 text-xs font-bold uppercase tracking-widest">
                    Room {onlineRoom?.code} • {isOnlineHost ? "HOST" : "GUEST"}
                  </div>
              ) : (
                  <button
                      onClick={() => {
                        setOnlineGameType("quick");
                        setOnlineRoom(null);
                        setJoinCode("");
                        setJoinError("");
                        setView("online_entry");
                      }}
                      className="px-6 py-3 rounded-full border border-sky-600 text-sky-300 hover:bg-sky-900/40 transition-all font-bold text-xs uppercase tracking-widest"
                  >
                    Play with Friends
                  </button>
              )}

              <button
                  onClick={() => setView("menu")}
                  className="px-6 py-3 rounded-full border border-slate-700 text-slate-400 hover:text-white hover:border-white hover:bg-white/5 transition-all font-bold text-xs uppercase tracking-widest"
              >
                Back to Menu
              </button>

              {/* ✅ Only HOST can start match in online mode */}
              {isOnline && !isOnlineHost ? (
                  <div className="px-10 py-3 rounded-full bg-slate-800 text-slate-500 font-broadcast text-2xl">
                    WAITING FOR HOST...
                  </div>
              ) : (
                  <button
                      onClick={canStart ? handleStartQuickMatch : undefined}
                      disabled={!canStart}
                      className={
                          "px-10 py-3 rounded-full font-broadcast text-2xl transition-transform shadow-xl shadow-green-900/20 " +
                          (canStart
                              ? "bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:scale-105"
                              : "bg-slate-800 text-slate-500 cursor-not-allowed")
                      }
                  >
                    {isOnline ? "START ONLINE MATCH" : "START MATCH"}
                  </button>
              )}
            </div>
          </div>

          <div className="relative z-10 flex-1 flex p-6 gap-6 min-h-0 overflow-hidden">
            <div className="flex-1 flex flex-col min-h-0 h-full">
              <PlayerSearch activeTeam={activeTeamSelect} onAddPlayer={handleAddToActiveTeam} />
              {!activeTeamSelect && (
                <div className="mt-4 p-4 bg-blue-900/30 border border-blue-700 rounded-lg text-center">
                  <p className="text-blue-300 text-sm font-semibold">👈 Select a team on the right to add players</p>
                </div>
              )}
              {activeTeamSelect && (
                <div className="mt-4 p-4 bg-green-900/30 border border-green-700 rounded-lg text-center">
                  <p className="text-green-300 text-sm font-semibold">✅ Team <strong>{activeTeamSelect}</strong> selected - Search and add players</p>
                </div>
              )}
            </div>

            <div className="w-96 flex flex-col gap-4 h-full min-h-0">
              <div className="glass-panel p-4 rounded-2xl flex-shrink-0 bg-slate-900/80">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                  {isOnline ? "Your Team" : "Your Teams"}
                </h3>
                <p className="text-xs text-slate-500">
                  {isOnline 
                    ? "Select 11 players for your squad" 
                    : "Click a team below to select it."}
                </p>
                
                {/* ✅ Show opponent status in online mode */}
                {isOnline && (
                  <div className="mt-3 pt-3 border-t border-white/5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500">Opponent:</span>
                      <span className={`font-bold ${
                        (mySide === "A" ? teamBHasXI : teamAHasXI)
                          ? "text-green-400"
                          : "text-slate-400"
                      }`}>
                        {mySide === "A" ? teamB.players.length : teamA.players.length} / 11
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-1 pb-4">
                {teams.map((t) => {
                  // ✅ Determine ownership in online mode
                  const mySide = onlineRoom?.players?.find((p) => p.socketId === socket.id)?.side;
                  const isMyTeam = isOnline ? t.id === mySide : true;
                  const ownerName = isOnline 
                    ? onlineRoom?.players?.find((p) => p.side === t.id)?.name 
                    : null;
                  
                  const handleTeamClick = () => {
                    console.log("🎯 Team clicked:", t.id, "isMyTeam:", isMyTeam);
                    if (isMyTeam) {
                      console.log("✅ Setting activeTeamSelect to:", t.id);
                      setActiveTeamSelect(t.id);
                    }
                  };

                  return (
                    <div
                        key={t.id}
                        onClick={handleTeamClick}
                        className={`group rounded-2xl transition-all duration-300 flex-1 flex flex-col relative overflow-hidden border-2 ${
                            !isMyTeam 
                                ? "border-slate-700 bg-slate-900/20 opacity-60 cursor-not-allowed"
                                : activeTeamSelect === t.id
                                ? "border-brand-gold bg-slate-900 shadow-[0_0_30px_rgba(251,191,36,0.15)] z-10 cursor-pointer"
                                : "border-white/10 bg-slate-900/40 hover:bg-slate-900/60 hover:border-white/20 cursor-pointer"
                        }`}
                    >
                      <div className="h-full flex flex-col p-5 relative z-10">
                        <div className="flex justify-between items-center mb-4 border-b border-white/5 pb-3">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-3">
                              {(() => {
                                const display = getTeamDisplay(t);
                                return display.logo && (
                                  <img src={display.logo} alt={display.shortName} className="w-8 h-8 object-contain" />
                                );
                              })()}
                              <span
                                  className={`font-broadcast text-3xl truncate ${
                                      activeTeamSelect === t.id ? "text-brand-gold" : "text-white"
                                  }`}
                              >
                                {getTeamDisplay(t).name}
                              </span>
                            </div>
                            {ownerName && (
                              <span className="text-[10px] text-slate-500 uppercase tracking-wider">
                                {isMyTeam ? "Your Team" : ownerName}
                              </span>
                            )}
                          </div>
                          <div
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                                  t.players.length >= 11
                                      ? "bg-green-900 text-green-400"
                                      : "bg-slate-800 text-slate-400"
                              }`}
                          >
                            {t.players.length} / 11
                          </div>
                        </div>
                        <div className="space-y-1 max-h-48 overflow-y-auto custom-scrollbar">
                          {t.players.map((p, i) => (
                              <TeamListItem
                                  key={p.instanceId || p.id || i}
                                  player={p}
                                  onRemove={isMyTeam ? (e) => {
                                    e.stopPropagation();
                                    handleRemoveFromTeam(t.id, i);
                                  } : null}
                              />
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
    );
  };

  const renderTournSetup = () => {
    // For online tournament, show team selection like quick_setup
    if (isOnline && onlineRoom?.mode === "tournament") {
      const mySide = onlineRoom.players?.find((p) => p.socketId === socket.id)?.side;
      const myTeam = tournTeams.find(t => t.id === mySide);
      
      // Ensure activeTeamSelect is set
      if (activeTeamSelect !== mySide) {
        setActiveTeamSelect(mySide);
      }
      
      return (
          <div className="fixed inset-0 w-full flex flex-col bg-slate-950 overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/10 via-slate-950 to-slate-950" />
            
            {/* Header */}
            <div className="relative z-10 w-full px-8 py-6 flex-shrink-0">
              <h2 className="font-broadcast text-5xl text-center text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-400 drop-shadow-xl">
                Build Your Team
              </h2>
              <div className="flex items-center justify-center gap-2 mt-2">
                {(() => {
                  const myTeamData = isOnline 
                    ? tournTeams.find(t => t.id === mySide) || { id: mySide, name: `Team ${mySide}` }
                    : (mySide === "A" ? teamA : teamB);
                  const display = getTeamDisplay(myTeamData);
                  return (
                    <>
                      {display.logo && (
                        <img src={display.logo} alt={display.shortName} className="w-6 h-6 object-contain" />
                      )}
                      <p className="text-center text-slate-400">{display.name} - Select 11 players</p>
                    </>
                  );
                })()}
              </div>
            </div>

            {/* Main Content */}
            <div className="relative z-10 flex-1 flex px-8 gap-6 min-h-0 overflow-hidden pb-6">
              {/* Player Pool */}
              <div className="flex-1 flex flex-col min-h-0 h-full">
                <PlayerSearch activeTeam={mySide} onAddPlayer={handleAddToActiveTeam} />
              </div>

              {/* My Team */}
              <div className="w-96 flex flex-col min-h-0">
                <div className="glass-panel p-1 rounded-3xl flex-1 flex flex-col min-h-0">
                  <div className="bg-slate-950/50 rounded-[20px] p-6 backdrop-blur-md flex-1 flex flex-col min-h-0">
                    <div className="flex justify-between items-center mb-4 flex-shrink-0">
                      <h3 className="font-broadcast text-2xl text-white">YOUR TEAM</h3>
                      <div className="flex items-center gap-2">
                        {myTeam?.players.length < 11 && (
                            <button
                                onClick={() => {
                                  console.log('🎯 Auto-select clicked, mySide:', mySide);
                                  console.log('🎯 Current myTeam:', myTeam);
                                  
                                  const needed = 11 - (myTeam?.players.length || 0);
                                  const existingIds = myTeam?.players.map(p => p.id) || [];
                                  const availablePlayers = LOCAL_POOL.filter(p => !existingIds.includes(p.id));
                                  const randomPlayers = availablePlayers
                                      .sort(() => Math.random() - 0.5)
                                      .slice(0, needed);
                                  
                                  console.log('🎯 Adding players:', randomPlayers.length);
                                  
                                  // Add all players at once
                                  setTournTeams(prev => {
                                    console.log('🎯 Previous tournTeams:', prev);
                                    const updated = prev.map(t => {
                                      if (t.id !== mySide) return t;
                                      const newTeam = {
                                        ...t,
                                        players: [
                                          ...(t.players || []),
                                          ...randomPlayers.map(p => ({ ...p, instanceId: generateId() }))
                                        ]
                                      };
                                      console.log('🎯 Updated team:', newTeam);
                                      return newTeam;
                                    });
                                    console.log('🎯 New tournTeams:', updated);
                                    
                                    // Immediately broadcast the updated teams
                                    console.log('📤 Auto-select triggering immediate broadcast:', updated);
                                    socket.emit("tournamentTeamUpdate", {
                                      code: onlineRoom.code,
                                      teams: updated,
                                    });
                                    
                                    return updated;
                                  });
                                }}
                                className="text-xs bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded-lg font-bold"
                            >
                              AUTO-SELECT {11 - (myTeam?.players.length || 0)}
                            </button>
                        )}
                        <div className={`text-sm font-bold px-3 py-1 rounded-full ${
                            myTeam?.players.length === 11
                                ? "bg-green-900 text-green-400"
                                : "bg-slate-800 text-slate-400"
                        }`}>
                          {myTeam?.players.length || 0} / 11
                        </div>
                      </div>
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1 pr-2">
                      {myTeam?.players.map((p, i) => (
                          <TeamListItem
                              key={p.instanceId || p.id || i}
                              player={p}
                              onRemove={(e) => {
                                e.stopPropagation();
                                handleRemoveFromTeam(mySide, i);
                              }}
                          />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="relative z-10 flex flex-col px-8 py-6 border-t border-white/5 flex-shrink-0">
              {/* Error Message Display */}
              {tournamentStartError && (
                <div className="mb-4 p-4 bg-red-900/50 border border-red-500 rounded-lg text-red-200 text-sm">
                  <p className="font-semibold">❌ Cannot Start Tournament</p>
                  <p className="mt-1">{tournamentStartError}</p>
                </div>
              )}
              
              <div className="flex justify-between items-center">
                <button
                    onClick={() => setView("online_menu")}
                  className="text-slate-400 hover:text-white px-6 py-2 transition-colors uppercase tracking-widest text-xs font-bold"
              >
                ← Back
              </button>
              {isOnlineHost ? (
                  <button
                      onClick={() => {
                        // Small delay to ensure all state updates are complete
                        setTimeout(() => {
                          console.log('=== START TOURNAMENT VALIDATION ===');
                          console.log('🔍 My Side:', mySide);
                          console.log('🔍 Tournament Teams count:', tournTeams.length);
                          
                          // Log each team explicitly
                          tournTeams.forEach((t, idx) => {
                            console.log(`  Team ${idx}: id=${t.id}, players=${t.players?.length || 0}`);
                          });
                          
                          console.log('🔍 Online Room Players:', onlineRoom.players.length);
                          onlineRoom.players.forEach((p, idx) => {
                            console.log(`  Player ${idx}: name=${p.name}, side=${p.side}`);
                          });
                          
                          // Check if all players have 11 players
                          const playerSides = onlineRoom.players.map(p => p.side);
                          console.log('🔍 Player Sides:', playerSides);
                          console.log('🔍 TournTeams IDs:', tournTeams.map(t => t.id));
                          
                          // Ensure all player sides have corresponding teams (create empty ones if needed)
                          const allTeams = [...tournTeams];
                          playerSides.forEach(side => {
                            if (!allTeams.find(t => t.id === side)) {
                              console.log(`⚠️ Creating missing team for side: ${side}`);
                              allTeams.push({
                                id: side,
                                name: `Team ${side}`,
                                players: [],
                                played: 0,
                                won: 0,
                                pts: 0,
                                nrr: 0,
                                runsScored: 0,
                                oversFaced: 0,
                                runsConceded: 0,
                                oversBowled: 0
                              });
                            }
                          });
                          
                          const playerTeams = allTeams.filter(t => playerSides.includes(t.id));
                          
                          console.log('🔍 Player Sides to validate:', playerSides);
                          console.log('🔍 Filtered teams for validation:', playerTeams.length);
                          playerTeams.forEach((t, idx) => {
                            console.log(`  Filtered Team ${idx}: id=${t.id}, players=${t.players?.length || 0}`);
                          });
                          
                          // Make sure we have exactly matching teams
                          if (playerTeams.length !== playerSides.length) {
                            alert(`Error: Expected ${playerSides.length} teams but found ${playerTeams.length}`);
                            return;
                          }
                          
                          const allReady = playerTeams.length > 0 && playerTeams.every(t => (t.players?.length || 0) === 11);
                          
                          console.log('🔍 All Ready?', allReady);
                          if (!allReady) {
                            playerTeams.forEach(t => {
                              console.log(`  Team ${t.id}: ${t.players?.length || 0}/11 players`);
                            });
                          }
                          
                          if (!allReady) {
                            const incomplete = playerTeams.filter(t => (t.players?.length || 0) !== 11);
                            alert(`All players must select 11 players before starting tournament.\nIncomplete teams: ${incomplete.map(t => `Team ${t.id} (${t.players?.length || 0}/11)`).join(', ')}`);
                            return;
                          }
                          // Generate fixtures
                          socket.emit("generateTournamentFixtures", {
                            code: onlineRoom.code,
                          }, (response) => {
                            console.log("📦 generateTournamentFixtures callback:", response);
                            if (!response.success) {
                              setTournamentStartError(response.error);
                            }
                          });
                        }, 100);
                      }}
                      className="bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-500 hover:to-emerald-600 text-white font-broadcast text-xl px-8 py-3 rounded-xl transition-all"
                  >
                    START TOURNAMENT
                  </button>
              ) : (
                  <p className="text-slate-400 text-sm">
                    Waiting for host to start tournament...
                  </p>
              )}
              </div>
            </div>
          </div>
      );
    }

    // Offline tournament setup (original)
    return (
      <div className="min-h-screen p-8 flex flex-col items-center justify-center relative overflow-hidden bg-slate-950">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/10 via-slate-950 to-slate-950" />
        <div className="relative z-10 w-full max-w-3xl">
          <h2 className="font-broadcast text-7xl text-center text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-400 drop-shadow-xl mb-8">
            League Setup
          </h2>
          <div className="glass-panel p-1 rounded-3xl">
            <div className="bg-slate-950/50 rounded-[20px] p-8 backdrop-blur-md">
              <div className="flex gap-3 mb-8">
                <input
                    value={newTeamName}
                    onChange={(e) => setNewTeamName(e.target.value)}
                    className="flex-1 bg-slate-900/80 border border-slate-700 rounded-xl p-4 text-white text-lg placeholder-slate-500 focus:outline-none focus:border-brand-gold transition-all font-broadcast tracking-wide"
                    placeholder="ENTER TEAM NAME"
                />
                <button
                    onClick={addTournTeam}
                    className="bg-gradient-to-b from-brand-gold to-yellow-600 text-black font-broadcast text-xl tracking-wider px-8 rounded-xl hover:brightness-110 transition-all"
                >
                  ADD TEAM
                </button>
              </div>
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {tournTeams.map((t, i) => (
                    <div
                        key={t.id}
                        className="bg-slate-900/60 p-4 rounded-xl flex justify-between items-center border border-white/5"
                    >
                      <div className="flex items-center gap-4">
                        <span className="text-slate-600 font-broadcast text-2xl w-8">
                          {(i + 1).toString().padStart(2, "0")}
                        </span>
                        {(() => {
                          const display = getTeamDisplay(t);
                          return display.logo && (
                            <img src={display.logo} alt={display.shortName} className="w-6 h-6 object-contain" />
                          );
                        })()}
                        <span className="font-bold text-xl text-slate-200">
                          {getTeamDisplay(t).name}
                        </span>
                      </div>
                      <span className="text-xs font-bold bg-slate-800 text-slate-400 px-3 py-1 rounded-full border border-slate-700">
                        {t.players.length} / 11
                      </span>
                    </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-between mt-8 items-center">
            <button
                onClick={() => setView("menu")}
                className="text-slate-400 hover:text-white px-6 py-2 transition-colors uppercase tracking-widest text-xs font-bold flex items-center gap-2"
            >
              <ChevronLeft size={16} /> Back to Menu
            </button>

            <div className="flex gap-3 items-center">
              {isOnline ? (
                  <div className="px-4 py-2 rounded-full bg-slate-900 border border-sky-600 text-sky-300 text-xs font-bold uppercase tracking-widest">
                    Room {onlineRoom?.code} • {isOnlineHost ? "HOST" : "GUEST"}
                  </div>
              ) : (
                  <button
                      onClick={() => {
                        setOnlineGameType("tournament");
                        setOnlineRoom(null);
                        setJoinCode("");
                        setJoinError("");
                        setView("online_entry");
                      }}
                      className="px-6 py-3 rounded-full border border-sky-600 text-sky-300 hover:bg-sky-900/40 transition-all font-bold text-xs uppercase tracking-widest"
                  >
                    Play Tournament with Friends
                  </button>
              )}

              <button
                  disabled={tournTeams.length < 3}
                  onClick={() => {
                    setActiveTeamSelect(tournTeams[0] ? tournTeams[0].id : null);
                    setView("tourn_draft");
                  }}
                  className={`px-12 py-4 rounded-full font-broadcast text-2xl tracking-wide transition-all shadow-2xl ${
                      tournTeams.length < 3
                          ? "bg-slate-800 text-slate-600 cursor-not-allowed"
                          : "bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:scale-105"
                  }`}
              >
                ENTER DRAFT
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderTournDraft = () => {
    const teams = tournTeams;

    return (
        <div className="fixed inset-0 w-full flex flex-col bg-slate-950 overflow-hidden">
          <div className="relative z-10 w-full px-8 py-6 flex justify-between items-end border-b border-white/5 bg-slate-950/80 backdrop-blur-sm flex-shrink-0">
            <div>
              <h1 className="text-6xl font-broadcast text-white leading-none drop-shadow-lg">
                SEASON DRAFT
              </h1>
              <p className="text-slate-400 uppercase tracking-widest text-sm ml-1">
                Distribute stars across franchises
              </p>
            </div>
            <div className="flex gap-4">
              <button
                  onClick={() => setView("menu")}
                  className="px-6 py-3 rounded-full border border-slate-700 text-slate-400 hover:text-white hover:border-white hover:bg-white/5 transition-all font-bold text-xs uppercase tracking-widest"
              >
                Back to Menu
              </button>
              <button
                  onClick={createTournamentFixtures}
                  className="bg-gradient-to-r from-brand-gold to-yellow-500 text-black px-10 py-3 rounded-full font-broadcast text-2xl hover:scale-105 transition-transform shadow-xl shadow-brand-gold/20"
              >
                START TOURNAMENT
              </button>
            </div>
          </div>

          <div className="relative z-10 flex-1 flex p-6 gap-6 min-h-0 overflow-hidden">
            <div className="flex-1 flex flex-col min-h-0 h-full">
              <PlayerSearch activeTeam={activeTeamSelect} onAddPlayer={handleAddToActiveTeam} />
            </div>

            <div className="w-96 flex flex-col gap-4 h-full min-h-0">
              <div className="glass-panel p-4 rounded-2xl flex-shrink-0 bg-slate-900/80">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                  Tournament Teams
                </h3>
                <p className="text-xs text-slate-500">
                  Click a team to draft into it.
                </p>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-1 pb-4">
                {teams.map((t) => (
                    <div
                        key={t.id}
                        onClick={() => setActiveTeamSelect(t.id)}
                        className={`group rounded-2xl cursor-pointer transition-all duration-300 flex-1 flex flex-col relative overflow-hidden border-2 ${
                            activeTeamSelect === t.id
                                ? "border-brand-gold bg-slate-900 shadow-[0_0_30px_rgba(251,191,36,0.15)] z-10"
                                : "border-white/10 bg-slate-900/40 hover:bg-slate-900/60 hover:border-white/20"
                        }`}
                    >
                      <div className="h-full flex flex-col p-5 relative z-10">
                        <div className="flex justify-between items-center mb-4 border-b border-white/5 pb-3">
                          <div className="flex items-center gap-3">
                            {(() => {
                              const display = getTeamDisplay(t);
                              return display.logo ? (
                                <img src={display.logo} alt={display.shortName} className="w-8 h-8 object-contain" />
                              ) : null;
                            })()}
                            <span
                                className={`font-broadcast text-3xl truncate ${
                                    activeTeamSelect === t.id ? "text-brand-gold" : "text-white"
                                }`}
                            >
                              {getTeamDisplay(t).name}
                            </span>
                          </div>
                          <div
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                                  (t.players || []).length >= 11
                                      ? "bg-green-900 text-green-400"
                                      : "bg-slate-800 text-slate-400"
                              }`}
                          >
                            {(t.players || []).length} / 11
                          </div>
                        </div>
                        <div className="space-y-1 max-h-48 overflow-y-auto custom-scrollbar">
                          {(t.players || []).map((p, i) => (
                              <TeamListItem
                                  key={p.instanceId || p.id || i}
                                  player={p}
                                  onRemove={(e) => {
                                    e.stopPropagation();
                                    handleRemoveFromTeam(t.id, i);
                                  }}
                              />
                          ))}
                        </div>
                      </div>
                    </div>
                ))}
              </div>
            </div>
          </div>
        </div>
    );
  };

  const renderTournHub = () => (
      <div className="min-h-screen p-8 bg-slate-950 relative">
        <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-brand-gold/5 to-transparent pointer-events-none" />
        <div className="max-w-7xl mx-auto relative z-10">
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
                  {fixtures.map((f) => {
                    const t1 = tournTeams.find((t) => t.id === f.t1);
                    const t2 = tournTeams.find((t) => t.id === f.t2);
                    if (!t1 || !t2) return null;

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
                            } ${isKnockout && !f.played ? "scale-105" : ""}`}
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
                              <button
                                  onClick={() => handleStartTournamentFixture(f)}
                                  className={`flex-shrink-0 ml-2 ${
                                    isKnockout
                                      ? isFinal
                                        ? "bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 h-14 w-14 text-xl"
                                        : "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 h-12 w-12 text-lg"
                                      : "bg-white hover:bg-brand-gold h-10 w-10"
                                  } text-black rounded-full flex items-center justify-center transition-all shadow-lg group-hover:scale-110`}
                              >
                                ▶
                              </button>
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
      </div>
  );

  const renderAuctionLobby = () => {
    const players = isOnline ? onlineRoom?.players || [] : auctionTeams;
    
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-purple-900/20 via-slate-950 to-slate-950" />
        
        <div className="relative z-10 glass-panel rounded-3xl p-8 w-full max-w-4xl bg-slate-950/80">
          <h2 className="font-broadcast text-5xl text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-brand-gold mb-2">
            Auction Lobby
          </h2>
          <p className="text-xs text-slate-400 mb-6 uppercase tracking-widest">
            {isOnline ? `Room ${onlineRoom?.code} • Select your franchise` : "Select your franchise and wait for others"}
          </p>

          {/* Team Selection Grid */}
          <div className="mb-6">
            <h3 className="text-sm text-slate-300 mb-3">Choose Your Franchise</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 max-h-96 overflow-y-auto custom-scrollbar p-2">
              {IPL_TEAMS.map(team => {
                const taken = players.find(p => p.iplTeam === team.id);
                const isMine = isOnline ? taken?.socketId === socket.id : taken?.id === socket.id;
                
                return (
                  <button
                    key={team.id}
                    onClick={() => {
                      if (taken && !isMine) return;
                      
                      if (isOnline) {
                        socket.emit("selectIPLTeam", { code: onlineRoom.code, teamId: isMine ? null : team.id });
                      } else {
                        if (isMine) {
                          setAuctionTeams(prev => prev.filter(t => t.id !== socket.id));
                        } else {
                          setAuctionTeams(prev => [
                            ...prev.filter(t => t.id !== socket.id),
                            { id: socket.id, name: playerName || 'Player', iplTeam: team.id }
                          ]);
                        }
                      }
                    }}
                    disabled={taken && !isMine}
                    className={`group relative p-4 rounded-xl border-2 transition-all ${
                      isMine 
                        ? 'border-brand-gold bg-brand-gold/20' 
                        : taken 
                        ? 'border-slate-800 bg-slate-900/30 opacity-50 cursor-not-allowed'
                        : 'border-slate-700 hover:border-purple-500/50 bg-slate-800/50'
                    }`}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-12 h-12 flex items-center justify-center bg-white/10 rounded-full p-2">
                        <img src={team.logo} alt={team.id} className="w-full h-full object-contain" />
                      </div>
                      <div className="text-center">
                        <div className="text-xs font-bold text-white">{team.id}</div>
                        {taken && <div className="text-[10px] text-slate-400">{taken.name}</div>}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Connected Players */}
          <div className="mb-6">
            <h3 className="text-sm text-slate-300 mb-2">
              Players Ready ({players.filter(p => p.iplTeam).length}/10)
            </h3>
            <div className="space-y-2">
              {players.filter(p => p.iplTeam).map((player) => {
                const iplTeam = IPL_TEAMS.find(t => t.id === player.iplTeam);
                return (
                  <div
                    key={player.socketId || player.id}
                    className="flex justify-between items-center bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200"
                  >
                    <span>{player.name}</span>
                    <div className="flex items-center gap-2">
                      {iplTeam && (
                        <span className="text-xs px-2 py-1 rounded flex items-center gap-1" style={{ backgroundColor: iplTeam.color, color: 'white' }}>
                          <img src={iplTeam.logo} alt={iplTeam.id} className="w-4 h-4 object-contain" />
                          <span>{iplTeam.id}</span>
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-between items-center">
            <button
              onClick={() => {
                setAuctionTeams([]);
                setView(isOnline ? "online_menu" : "menu");
              }}
              className="text-slate-400 hover:text-white px-6 py-2 transition-colors uppercase tracking-widest text-xs font-bold"
            >
              ← Back
            </button>
            
            {isOnline && !isOnlineHost ? (
              <p className="text-slate-400 text-sm">Waiting for host to start auction...</p>
            ) : (
              <button
                onClick={() => {
                  const readyPlayers = players.filter(p => p.iplTeam);
                  if (readyPlayers.length < 2) {
                    alert("Need at least 2 players to start auction");
                    return;
                  }
                  
                  if (isOnline) {
                    socket.emit("startAuction", { code: onlineRoom.code });
                  }
                  // Navigate immediately for host, guests will navigate via socket
                  setView("auction");
                }}
                disabled={players.filter(p => p.iplTeam).length < 2}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-broadcast text-xl px-8 py-3 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                START AUCTION
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderOnlineEntry = () => {
    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950">
          <div className="glass-panel rounded-3xl p-8 w-full max-w-md bg-slate-950/80">
            <h2 className="font-broadcast text-4xl text-white mb-2">
              Play with Friends
            </h2>

            <p className="text-xs text-slate-400 mb-4 uppercase tracking-widest">
              {onlineGameType === "tournament"
                  ? "Tournament Mode"
                  : onlineGameType === "auction"
                  ? "Auction Mode"
                  : "1v1 Quick Match"}
            </p>

            {/* Name */}
            <div className="mb-4">
              <label className="block text-xs text-slate-400 mb-1">
                Your Name
              </label>
              <input
                  value={onlineName}
                  onChange={(e) => setOnlineName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-gold"
                  placeholder="Enter your name"
              />
            </div>

            {/* Join existing room */}
            <div className="mb-6">
              <label className="block text-xs text-slate-400 mb-1">
                Join Room (optional)
              </label>
              <input
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white tracking-[0.3em] text-center focus:outline-none focus:border-sky-500"
                  placeholder="CODE"
              />
              {joinError && (
                  <p className="mt-1 text-[11px] text-red-400">{joinError}</p>
              )}
            </div>

            {/* Buttons */}
            <div className="space-y-3">
              {/* Host Room */}
              <button
                  onClick={() => {
                    if (!onlineName.trim()) {
                      alert("Please enter your name first.");
                      return;
                    }

                    // Create room on server
                                      socket.emit("createRoom", {
                                        name: onlineName.trim(),
                                        mode: onlineGameType === "quick" ? "1v1" : onlineGameType,
                                      });
                    // We rely on roomUpdate to actually move us into the room,
                    // but as a fallback we can optimistically go there:
                    setView("online_menu");
                  }}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg py-2 text-sm font-bold uppercase tracking-widest"
              >
                Host Room
              </button>

              {/* Join Room */}
              <button
                  onClick={() => {
                    if (!onlineName.trim()) {
                      alert("Please enter your name first.");
                      return;
                    }
                    if (!joinCode.trim()) {
                      alert("Enter a room code to join.");
                      return;
                    }

                    socket.emit("joinRoom", {
                      code: joinCode.trim(),
                      name: onlineName.trim(),
                    });

                    // temporary view change; roomUpdate will also set view
                    setView("online_menu");
                  }}
                  className="w-full bg-slate-800 hover:bg-slate-700 text-slate-100 rounded-lg py-2 text-sm font-bold uppercase tracking-widest border border-slate-600"
              >
                Join Room
              </button>

              <button
                  onClick={() => setView("menu")}
                  className="w-full text-xs text-slate-500 hover:text-slate-300 mt-2"
              >
                ← Back to Menu
              </button>
            </div>
          </div>
        </div>
    );
  };


  const renderOnlineMenu = () => {
    if (!onlineRoom) {
      return (
          <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-300">
            <div>
              <p>No room data. Go back and create or join a room.</p>
              <button
                  onClick={() => setView("online_entry")}
                  className="mt-4 text-sm text-slate-400 underline"
              >
                Back
              </button>
            </div>
          </div>
      );
    }

    console.log("🔍 Online Room Mode:", onlineRoom.mode); // Debug

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950">
          <div className="glass-panel rounded-3xl p-8 w-full max-w-4xl bg-slate-950/80">
            <h2 className="font-broadcast text-4xl text-white mb-2">
              Room {onlineRoom.code}
            </h2>
            <p className="text-xs text-slate-400 mb-4 uppercase tracking-widest">
              Mode: {onlineRoom.mode === "tournament" ? "Tournament" : onlineRoom.mode === "auction" ? "Auction" : "1v1 Quick Match"}
            </p>

            {/* Connected players */}
            <div className="mb-4">
              <h3 className="text-sm text-slate-300 mb-2">
                Connected Players ({onlineRoom.players?.length || 0}{onlineRoom.mode === "tournament" ? "/10" : "/2"})
              </h3>
              
              {/* Current player's team selection */}
              {(() => {
                const myPlayer = onlineRoom.players?.find(p => p.socketId === socket.id);
                const takenTeams = onlineRoom.players?.map(p => p.iplTeam).filter(Boolean) || [];
                
                if (!myPlayer?.iplTeam) {
                  return (
                    <div className="mb-4 p-6 bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl border-2 border-brand-gold/50 shadow-xl">
                      <div className="text-center mb-4">
                        <div className="text-sm text-brand-gold font-bold uppercase tracking-widest mb-1">Choose Your Franchise</div>
                        <div className="text-xs text-slate-400">Select your team to continue</div>
                      </div>
                      <div className="grid grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-2 custom-scrollbar p-2">
                        {IPL_TEAMS.filter(team => !takenTeams.includes(team.id)).map(team => (
                          <button
                            key={team.id}
                            onClick={() => {
                              console.log("🏟️ Clicking team:", team.id, "code:", onlineRoom.code);
                              socket.emit("selectIPLTeam", { code: onlineRoom.code, teamId: team.id });
                              console.log("🏟️ Emitted selectIPLTeam");
                            }}
                            className="group relative p-4 rounded-xl bg-slate-700/50 hover:bg-slate-600 border-2 border-transparent hover:border-brand-gold/50 transition-all duration-300 hover:shadow-lg"
                          >
                            <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" 
                                 style={{ background: `linear-gradient(135deg, ${team.color}20, transparent)` }} />
                            <div className="relative flex flex-col items-center gap-2">
                              <div className="w-16 h-16 flex items-center justify-center bg-white/10 rounded-full p-2 group-hover:bg-white/20 transition-colors">
                                <img src={team.logo} alt={team.id} className="w-full h-full object-contain" />
                              </div>
                              <div className="text-center">
                                <div className="text-xs font-bold text-white mb-1">{team.id}</div>
                                <div className="text-[10px] text-slate-300 leading-tight">{team.name}</div>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                }
                return null;
              })()}
              
              <div className="space-y-2">
                {onlineRoom.players?.map((p) => {
                  const iplTeam = IPL_TEAMS.find(t => t.id === p.iplTeam);
                  return (
                    <div
                        key={p.socketId}
                        className="flex justify-between items-center bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200"
                    >
                      <span>{p.name}</span>
                      <div className="flex items-center gap-2">
                        {iplTeam && (
                          <span className="text-xs px-2 py-1 rounded flex items-center gap-1" style={{ backgroundColor: iplTeam.color, color: 'white' }}>
                            <img src={iplTeam.logo} alt={iplTeam.id} className="w-4 h-4 object-contain" />
                            <span>{iplTeam.id}</span>
                          </span>
                        )}
                        <span className="text-xs text-slate-500">Team {p.side}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Room Code */}
            <p className="text-xs text-slate-500 mb-2">
              Share this code with your friend:
            </p>
            <div className="flex items-center gap-2 mb-4">
              <div className="flex-1 text-center text-2xl font-broadcast tracking-[0.4em] text-brand-gold bg-slate-900 border border-slate-700 rounded-lg py-3">
                {onlineRoom.code}
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(onlineRoom.code);
                  alert("Code copied!");
                }}
                className="bg-brand-gold hover:bg-yellow-400 text-black font-bold px-4 py-3 rounded-lg transition-colors"
                title="Copy code"
              >
                📋
              </button>
            </div>

            {/* HOST: Go to Setup (and emit navigation event) */}
            {isOnlineHost && (
                <button
                    onClick={() => {
                      if (!onlineRoom?.code) return;

                      if (onlineRoom.mode === "tournament") {
                        if (onlineRoom.players.length < 2) {
                          alert("Need at least 2 players to start tournament");
                          return;
                        }
                        // Initialize teams first with IPL team info
                        const teams = onlineRoom.players.map(p => {
                          const iplTeam = IPL_TEAMS.find(t => t.id === p.iplTeam);
                          return {
                            id: p.side,
                            name: iplTeam ? iplTeam.name : `Team ${p.side}`,
                            iplTeamId: p.iplTeam,
                            players: [],
                            played: 0,
                            won: 0,
                            pts: 0,
                            nrr: 0,
                            runsScored: 0,
                            oversFaced: 0,
                            runsConceded: 0,
                            oversBowled: 0
                          };
                        });
                        setTournTeams(teams);
                        
                        const mySide = onlineRoom.players?.find((p) => p.socketId === socket.id)?.side || "A";
                        setActiveTeamSelect(mySide);
                        
                        // Navigate to tournament team selection
                        socket.emit("navigateToTournamentSetup", {
                          code: onlineRoom.code,
                        });
                        setView("tourn_setup");
                      } else if (onlineRoom.mode === "auction") {
                        if (onlineRoom.players.length < 2) {
                          alert("Need at least 2 players to start auction");
                          return;
                        }
                        socket.emit("navigateToAuctionLobby", {
                          code: onlineRoom.code,
                        });
                        setView("auction_lobby");
                      } else {
                        // For quick matches, both players must have selected IPL teams
                        const allTeamsSelected = onlineRoom.players.every(p => p.iplTeam);
                        if (!allTeamsSelected) {
                          alert("All players must select an IPL team first");
                          return;
                        }
                        socket.emit("navigateToQuickSetup", {
                          code: onlineRoom.code,
                        });
                        setView("quick_setup");
                      }
                    }}
                    disabled={
                      onlineRoom.mode === "quick" 
                        ? (onlineRoom.players.length < 2 || !onlineRoom.players.every(p => p.iplTeam))
                        : onlineRoom.mode === "tournament"
                        ? onlineRoom.players.length < 2
                        : onlineRoom.mode === "auction"
                        ? onlineRoom.players.length < 2
                        : false
                    }
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg py-2 text-sm font-bold uppercase tracking-widest mb-3 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {onlineRoom.mode === "tournament"
                      ? `Start Team Selection (${onlineRoom.players.length} Players)`
                      : onlineRoom.mode === "auction"
                      ? `Start Auction Lobby (${onlineRoom.players.length} Players)`
                      : `Go to Squad Selection (${onlineRoom.players.filter(p => p.iplTeam).length}/${onlineRoom.players.length} Teams Selected)`}
                </button>
            )}

            {/* GUEST: waiting message */}
            {!isOnlineHost && (
                <p className="text-[11px] text-slate-500 mb-3">
                  Waiting for host to build teams and start the match. You will
                  automatically enter the setup and then the live match when the host
                  starts.
                </p>
            )}

            <button
                onClick={() => setView("menu")}
                className="mt-2 text-xs text-slate-500 hover:text-slate-300"
            >
              ← Back to Menu
            </button>
          </div>
        </div>
    );
  };



  // ---------- ROOT RENDER ----------

  const mainContent = (() => {
    if (view === "menu") return renderMenu();
    if (view === "quick_setup") return renderQuickSetup();
    if (view === "tourn_setup") return renderTournSetup();
    if (view === "tourn_draft") return renderTournDraft();
    if (view === "tourn_hub") return renderTournHub();
    if (view === "online_entry") return renderOnlineEntry();
    if (view === "online_menu") return renderOnlineMenu();
    if (view === "auction_lobby") return renderAuctionLobby();
    if (view === "auction") {
      const auctionPlayers = isOnline 
        ? onlineRoom?.players.filter(p => p.iplTeam).map(p => ({
            id: p.socketId,
            name: p.name,
            iplTeamId: p.iplTeam,
            iplTeam: IPL_TEAMS.find(t => t.id === p.iplTeam)
          }))
        : auctionTeams.map(t => {
            const iplTeam = IPL_TEAMS.find(ipl => ipl.id === t.iplTeam);
            return {
              id: t.id,
              name: t.name,
              iplTeamId: t.iplTeam,
              iplTeam
            };
          });
      
      const myTeamId = isOnline 
        ? onlineRoom?.players.find(p => p.socketId === socket.id)?.socketId
        : socket.id;
      
      return (
        <AuctionRoom
          playerPool={LOCAL_POOL}
          teams={auctionPlayers}
          onComplete={(completedTeams) => {
            setTournTeams(completedTeams.map(t => ({
              ...t,
              played: 0,
              won: 0,
              pts: 0,
              nrr: 0,
              runsScored: 0,
              oversFaced: 0,
              runsConceded: 0,
              oversBowled: 0
            })));
            setView("tourn_hub");
          }}
          onBack={() => setView("auction_lobby")}
          getTeamDisplay={getTeamDisplay}
          isOnline={isOnline}
          myTeamId={myTeamId}
          socket={socket}
          roomCode={onlineRoom?.code}
        />
      );
    }

    if (view === "match" && effectiveMatchState) {
      // ✅ Determine who can control based on bowling team AND if they're playing
      let canControl = true; // offline: always true
      let isSpectator = false;
    
      if (isOnline && onlineRoom) {
        const mySide = onlineRoom.players?.find((p) => p.socketId === socket.id)?.side;
        const bowlingTeamId = effectiveMatchState.bowlingTeam?.id;
        
        // Map side ("A" or "B") to team ID
        const teamASideId = effectiveMatchState.teamA?.id;
        const teamBSideId = effectiveMatchState.teamB?.id;
        const mySideTeamId = mySide === "A" ? teamASideId : mySide === "B" ? teamBSideId : null;
        
        // Check if player is in one of the playing teams
        const isPlaying = mySideTeamId === bowlingTeamId || mySideTeamId === effectiveMatchState.battingTeam?.id;
        
        if (!isPlaying) {
          // Spectator - no control
          canControl = false;
          isSpectator = true;
        } else {
          // Playing - can control if my team is bowling
          canControl = mySideTeamId === bowlingTeamId;
        }
      }

      return (
          <MatchCenter
              matchState={effectiveMatchState}
              bowlBall={bowlBall}
              skipOver={skipOver}
              skipFiveOvers={skipFiveOvers}
              skipTenOvers={skipTenOvers}
              skipInnings={skipInnings}
              handleInningsBreak={handleInningsBreak}
              endMatch={handleEndMatch}
              activeTab={matchTab}
              setActiveTab={setMatchTab}
              isOnline={isOnline}
              canControl={canControl}
              isSpectator={isSpectator}
              iplTeams={IPL_TEAMS}
              getTeamDisplay={getTeamDisplay}
              onlineRoom={onlineRoom}
              tournPhase={tournPhase}
          />
      );
    }

    // Loading state for match view without match state
    if (view === "match" && !effectiveMatchState) {
      return (
          <div className="h-screen w-screen flex items-center justify-center bg-slate-950">
            <div className="text-center">
              <div className="text-6xl mb-4 animate-pulse">🏏</div>
              <p className="text-white text-xl font-broadcast">Loading match...</p>
            </div>
          </div>
      );
    }

    return null;
  })();

  return (
    <>
      {mainContent}
      
      {/* Toss Overlay */}
      {showToss && tossWinner && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50">
          <div className="text-center animate-pulse">
            <div className="text-6xl mb-6">🪙</div>
            <div className="font-broadcast text-5xl text-white mb-4">TOSS</div>
            <div className="flex items-center justify-center gap-4 mb-2">
              {(() => {
                const display = getTeamDisplay(tossWinner);
                return display.logo && (
                  <img src={display.logo} alt={display.shortName} className="w-16 h-16 object-contain" />
                );
              })()}
              <div className="text-brand-gold text-3xl font-bold">{getTeamDisplay(tossWinner).name}</div>
            </div>
            <div className="text-slate-400 text-xl">won the toss and elected to bat</div>
          </div>
        </div>
      )}
    </>
  );
};

export default App;

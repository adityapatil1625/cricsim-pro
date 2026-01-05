// src/App.jsx
import React, { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import MatchCenter from "./components/match/MatchCenter";
import PlayerSearch from "./components/shared/PlayerSearch";
import TeamListItem from "./components/shared/TeamListItem";
import TournamentBracket from "./components/tournament/TournamentBracket";
import TournamentLeaderboards from "./components/tournament/TournamentLeaderboards";
import AuctionRoom from "./components/auction/AuctionRoom";
import AuctionPageLayout from "./components/auction/AuctionPageLayout";
import useMatchEngine from "./hooks/useMatchEngine";
import useAppState from "./hooks/useAppState";
import { Zap, Trophy, ChevronLeft, Shuffle } from "./components/shared/Icons";

// Import page components
import MenuPage from "./pages/MenuPage";
import QuickSetupPage from "./pages/QuickSetupPage";
import TournSetupPage from "./pages/TournSetupPage";
import TournDraftPage from "./pages/TournDraftPage";
import TournHubPage from "./pages/TournHubPage";
import OnlineEntryPage from "./pages/OnlineEntryPage";
import OnlineMenuPage from "./pages/OnlineMenuPage";
import MatchSummaryPage from "./pages/MatchSummaryPage";

// Import constants and utilities
import { IPL_TEAMS, VIEW_TO_PATH, TOURNAMENT_PHASES, ONLINE_GAME_TYPES, MATCH_TABS } from "./constants/appConstants";
import { generateId, getTeamDisplay, buildPlayerPool } from "./utils/appUtils";
import SOCKET_EVENTS from "./constants/socketEvents";

import { MOCK_DB } from "./data/mockDb";
import rawIplData from "./data/iplData.json";
import { processIPLData } from "./data/cricketProcessing";
import { IPL_PLAYER_POOL_V2, buildSimpleAuctionQueue, getSetById } from "./data/playerPoolV2";
import { socket } from "./socket";

// ---------- LOCAL PLAYER POOL (NEW: Comprehensive IPL Player Pool V2) ----------
const buildLocalPool = () => {
  // Use the new simplified IPL player pool
  return IPL_PLAYER_POOL_V2;
};

const LOCAL_POOL = buildLocalPool();

const App = () => {
  // Use centralized state management hook
  const appState = useAppState();
  const { view, setView } = appState;
  
  const navigate = useNavigate();
  const location = useLocation();

  // Map view states to URL paths (use exported constant)
  const viewToPath = React.useMemo(() => VIEW_TO_PATH, []);

  // Create reverse mapping (memoized)
  const pathToView = React.useMemo(() => {
    return Object.entries(viewToPath).reduce((acc, [key, value]) => {
      acc[value] = key;
      return acc;
    }, {});
  }, [viewToPath]);

  // Refs to prevent circular updates
  const lastUrlRef = React.useRef(null);
  const viewRef = React.useRef(view);
  useEffect(() => {
    viewRef.current = view;
  }, [view]);

  // Sync URL when view changes - only navigate if URL actually needs to change
  useEffect(() => {
    const path = viewToPath[view];
    if (path && lastUrlRef.current !== path) {
      lastUrlRef.current = path;
      navigate(path, { replace: false });
    }
  }, [view, viewToPath, navigate]);

  // Sync view when URL changes (e.g. back button or manual entry)
  // Only runs when pathname changes, not when view changes
  useEffect(() => {
    const currentPath = location.pathname;
    const newView = pathToView[currentPath];
    
    if (newView && newView !== viewRef.current) {
      viewRef.current = newView;
      setView(newView);
    } else if (!newView && currentPath === "/" && viewRef.current !== "menu") {
      viewRef.current = "menu";
      setView("menu");
    }
  }, [location.pathname, pathToView]);

  // Destructure all state from centralized hook
  const {
    teamA, setTeamA,
    teamB, setTeamB,
    tournTeams, setTournTeams,
    auctionTeams, setAuctionTeams,
    fixtures, setFixtures,
    tournPhase, setTournPhase,
    selectedFixture, setSelectedFixture,
    showToss, setShowToss,
    tossWinner, setTossWinner,
    newTeamName, setNewTeamName,
    activeTeamSelect, setActiveTeamSelect,
    tournamentStartError, setTournamentStartError,
    matchTab, setMatchTab,
    onlineRoom, setOnlineRoom,
    playerName, setPlayerName,
    onlineName, setOnlineName,
    joinCode, setJoinCode,
    joinError, setJoinError,
    onlineGameType, setOnlineGameType,
    isStartingMatch, setIsStartingMatch,
    remoteMatchState, setRemoteMatchState,
    isHostReady, setIsHostReady,
    playersReady, setPlayersReady,
    showGuestReadyModal, setShowGuestReadyModal,
    matchEntryReady, setMatchEntryReady,
    pendingMatchFixture, setPendingMatchFixture,
    currentlyPlayingMatch, setCurrentlyPlayingMatch,
  } = appState;
  
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
    
    function handleStartAuction() {
      console.log("🔨 Received startAuction event");
      setView("auction");
    }

    function handlePlayerReady({ socketId }) {
      console.log(`🟢 Player ${socketId} is ready for auction`);
      setPlayersReady(prev => ({
        ...prev,
        [socketId]: true
      }));
    }
    
    function handleTournamentResultsUpdate({ fixtures: updatedFixtures, tournTeams: updatedTeams, phase }) {
      console.log("📊 Received tournament results update");
      console.log(`   Fixtures: ${updatedFixtures?.length || 0}`, updatedFixtures?.map(f => ({ id: f.id, played: f.played, winner: f.winner })));
      console.log(`   Teams: ${updatedTeams?.length || 0}`, updatedTeams?.map(t => ({ id: t.id, pts: t.pts, won: t.won, nrr: t.nrr })));
      console.log(`   Phase: ${phase}`);
      
      if (updatedFixtures && updatedFixtures.length > 0) {
        console.log("✅ Setting fixtures from broadcast");
        setFixtures(updatedFixtures);
      }
      if (updatedTeams && updatedTeams.length > 0) {
        console.log("✅ Setting tournament teams from broadcast");
        setTournTeams(updatedTeams);
      }
      if (phase) {
        console.log("✅ Setting tournament phase from broadcast:", phase);
        setTournPhase(phase);
      }
      console.log(`✅ Tournament state updated from broadcast`);
    }

    function handleReceiveToss({ tossWinner, tossWinnerName }) {
      console.log(`🏏 Guest received toss result: ${tossWinnerName} (ID: ${tossWinner})`);
      
      // For tournament mode, look in tournTeams; for quick play, look in teamA/teamB
      let winnerTeam;
      if (onlineRoom?.mode === "tournament") {
        winnerTeam = tournTeams.find(t => t.id === tossWinner);
      } else {
        winnerTeam = teamA.id === tossWinner ? teamA : teamB.id === tossWinner ? teamB : null;
      }
      
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

    function handleMatchStarted({ fixtureId }) {
      console.log(`🎬 Match started notification received: fixture ${fixtureId}`);
      console.log(`   Is host: ${isOnlineHost}, Socket ID: ${socket.id}`);
      setCurrentlyPlayingMatch(fixtureId);
      
      // Don't automatically navigate anyone - let the modal handle it
      // The host has already navigated when they clicked START
      // The non-host player should also be in the modal and see the match starting
      console.log(`⏸️ Match started event received - spectators stay in hub, modal closes for participants`);
    }

    function handleBothPlayersReady({ fixtureId }) {
      console.log(`🎬 Other player is ready! Match ${fixtureId} starting now`);
      setCurrentlyPlayingMatch(fixtureId);
      
      // Navigate to match if this player is a participant
      const fixture = fixtures.find(f => f.id === fixtureId);
      if (fixture) {
        const myTeamId = onlineRoom?.players?.find(p => p.socketId === socket.id)?.side;
        const isParticipant = myTeamId === fixture.t1 || myTeamId === fixture.t2;
        
        if (isParticipant) {
          console.log(`✅ Other player ready - auto-navigating to match`);
          proceedToMatch(fixture);
        }
      }
    }

    socket.on("navigateToQuickSetup", handleNavigateQuickSetup);
    socket.on("navigateToTournamentSetup", handleNavigateTournamentSetup);
    socket.on("startAuction", handleStartAuction);
    socket.on("playerReady", handlePlayerReady);
    socket.on("tournamentFixturesGenerated", handleTournamentFixturesGenerated);
    socket.on("tournamentStartError", handleTournamentStartError);
    socket.on("navigateToTournamentHub", handleNavigateToTournamentHub);
    socket.on("tournamentResultsUpdate", handleTournamentResultsUpdate);
    socket.on("receiveToss", handleReceiveToss);
    socket.on("matchStarted", handleMatchStarted);
    socket.on("bothPlayersReady", handleBothPlayersReady);

    return () => {
      socket.off("navigateToQuickSetup", handleNavigateQuickSetup);
      socket.off("navigateToTournamentSetup", handleNavigateTournamentSetup);
      socket.off("startAuction", handleStartAuction);
      socket.off("playerReady", handlePlayerReady);
      socket.off("tournamentFixturesGenerated", handleTournamentFixturesGenerated);
      socket.off("tournamentStartError", handleTournamentStartError);
      socket.off("navigateToTournamentHub", handleNavigateToTournamentHub);
      socket.off("tournamentResultsUpdate", handleTournamentResultsUpdate);
      socket.off("receiveToss", handleReceiveToss);
      socket.off("matchStarted", handleMatchStarted);
      socket.off("bothPlayersReady", handleBothPlayersReady);
    };
  }, [isOnline, onlineRoom, socket, setFixtures, setTournTeams, setTournPhase]);



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

    function handleMatchStateUpdate(data) {
      const receivedState = data?.matchState;
      if (!receivedState) {
        console.log(`❌ No matchState in update:`, data);
        return;
      }
      
      console.log(`📊 Received matchStateUpdated - Balls: ${receivedState.ballsBowled}, BattingTeam: ${receivedState.battingTeam?.id}`);
      // Update ref so we don't re-broadcast this state
      lastBroadcastedBallsRef.current = receivedState.ballsBowled;
      syncMatchState(receivedState);
      // Always navigate to match view when receiving updates
      setView("match");
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
      return;
    }
    if (!matchState || !onlineRoom?.code) {
      return;
    }

    // Get current player's side and team
    const mySide = onlineRoom.players?.find((p) => p.socketId === socket.id)?.side;
    const teamASideId = matchState.teamA?.id;
    const teamBSideId = matchState.teamB?.id;
    const mySideTeamId = mySide === "A" ? teamASideId : mySide === "B" ? teamBSideId : null;

    // Only broadcast if ballsBowled has actually changed from last broadcast
    if (lastBroadcastedBallsRef.current === matchState.ballsBowled && !matchState.isMatchOver) {
      return; // No change in balls, don't broadcast
    }

    lastBroadcastedBallsRef.current = matchState.ballsBowled;
    
    socket.emit("updateMatchState", {
      roomCode: onlineRoom.code,
      matchState,
    });
  }, [matchState?.ballsBowled, matchState?.isMatchOver, matchState?.innings, matchState?.battingTeam?.id, matchState?.bowlingTeam?.id, matchState?.teamA?.id, matchState?.teamB?.id, isOnline, view, onlineRoom?.code]);

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

  // ---------- PLAYER READY SYSTEM ----------
  // Guests emit playerReady when they click "MARK AS READY" button
  // Host tracks readiness and enables START button when all guests are ready
  // NOTE: Server must broadcast playerReady event back to all clients in room

  useEffect(() => {
    if (!socket || !isOnline) return;

    // Guest confirms ready, update tracking
    function handlePlayerReady(data) {
      console.log("📡 Received playerReady event:", data);
      if (data.roomCode === onlineRoom?.code) {
        console.log("🟢 Player ready confirmed:", data.socketId);
        setPlayersReady(prev => {
          const updated = {
            ...prev,
            [data.socketId]: true
          };
          console.log("📊 Updated playersReady state:", updated);
          return updated;
        });
      } else {
        console.warn("⚠️ playerReady event roomCode mismatch", data.roomCode, onlineRoom?.code);
      }
    }

    function handleMatchEntryReady(data) {
      console.log("📡 Received matchEntryReady event:", data);
      if (data.roomCode === onlineRoom?.code && data.fixtureId === pendingMatchFixture?.id) {
        console.log("🟢 Player ready for match entry:", data.socketId);
        setMatchEntryReady(prev => ({
          ...prev,
          [data.socketId]: true
        }));
      }
    }

    socket.on("playerReady", handlePlayerReady);
    socket.on("matchEntryReady", handleMatchEntryReady);

    return () => {
      socket.off("playerReady", handlePlayerReady);
      socket.off("matchEntryReady", handleMatchEntryReady);
    };
  }, [isOnline, onlineRoom, socket, pendingMatchFixture]);

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
    console.log("🎭 handleStartQuickMatch called, playerName:", playerName);
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
      console.log("🎭 In setTimeout, about to call startQuickMatch with playerName:", playerName);
      setShowToss(false);
      startQuickMatch(teamA, teamB, playerName);
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

    // For online mode, show ready screen for match participants
    if (isOnline && onlineRoom) {
      // Reset match entry ready states for this match
      setMatchEntryReady({});
      setPendingMatchFixture(fixture);
      console.log(`⏳ Match entry ready screen shown for fixture: ${fixture.id}`);
      return;
    }

    // For offline mode, proceed directly to match
    proceedToMatch(fixture);
  };

  const proceedToMatch = (fixture, isSpectating = false) => {
    const t1 = tournTeams.find((t) => t.id === fixture.t1);
    const t2 = tournTeams.find((t) => t.id === fixture.t2);

    if (!isSpectating) {
      // For players: show toss animation
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
        startTournamentMatch(fixture.id, t1, t2, playerName);
        setMatchTab("live");
        setView("match");
        setPendingMatchFixture(null);
        setMatchEntryReady({});
        setCurrentlyPlayingMatch(fixture.id);

        if (isOnline) {
          setIsStartingMatch(true);
        }
      }, 3000);
    } else {
      // For spectators: go directly to match view (toss already happened)
      console.log(`👀 Spectator joining match ${fixture.id}`);
      startTournamentMatch(fixture.id, t1, t2, playerName);
      setMatchTab("live");
      setView("match");
      setPendingMatchFixture(null);
      setCurrentlyPlayingMatch(fixture.id);
    }
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
          
          // Host navigates immediately after broadcasting
          console.log(`✅ Host navigating to tournament hub`);
          resetMatch();
          setCurrentlyPlayingMatch(null);
          setView("tourn_hub");
        } else {
          // Guest: wait for navigateToTournamentHub broadcast event from host
          console.log(`⏳ Guest waiting for navigation broadcast from host`);
          resetMatch();
          setCurrentlyPlayingMatch(null);
        }
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

  // ---------- MAIN CONTENT ROUTER ----------

  const mainContent = (() => {
    // Page components with all necessary props
    const pageProps = {
      // State
      tournTeams,
      setTournTeams,
      teamA,
      setTeamA,
      teamB,
      setTeamB,
      newTeamName,
      setNewTeamName,
      activeTeamSelect,
      setActiveTeamSelect,
      onlineRoom,
      isOnline,
      isOnlineHost,
      onlineName,
      setOnlineName,
      joinCode,
      setJoinCode,
      joinError,
      setJoinError,
      onlineGameType,
      setOnlineGameType,
      auctionTeams,
      setAuctionTeams,
      playerName,
      fixtures,
      selectedFixture,
      setSelectedFixture,
      tournPhase,
      tournamentStartError,
      setTournamentStartError,
      matchTab,
      setMatchTab,
      remoteMatchState,
      setRemoteMatchState,
      showToss,
      setShowToss,
      tossWinner,
      setTossWinner,
      matchState,
      
      // Handlers
      addTournTeam,
      handleAddToActiveTeam,
      handleRemoveFromTeam,
      handleStartQuickMatch,
      autoDraftQuickPlay,
      createTournamentFixtures,
      handleStartTournamentFixture,
      
      // Utilities
      getTeamDisplay,
      LOCAL_POOL,
      generateId,
      IPL_TEAMS,
      socket,
      
      // Ready System State
      isHostReady,
      setIsHostReady,
      playersReady,
      setPlayersReady,
      showGuestReadyModal,
      setShowGuestReadyModal,
      matchEntryReady,
      setMatchEntryReady,
      pendingMatchFixture,
      setPendingMatchFixture,
      proceedToMatch,
      currentlyPlayingMatch,
      setCurrentlyPlayingMatch,
      
      // Setters
      setView,
      setOnlineRoom,
      setPlayerName,
      setTournPhase,
    };

    if (view === "menu") return <MenuPage {...pageProps} />;
    if (view === "quick_setup") return <QuickSetupPage {...pageProps} />;
    if (view === "tourn_setup") return <TournSetupPage {...pageProps} />;
    if (view === "tourn_draft") return <TournDraftPage {...pageProps} />;
    if (view === "tourn_hub") return <TournHubPage {...pageProps} />;
    if (view === "online_entry") return <OnlineEntryPage {...pageProps} />;
    if (view === "online_menu") return <OnlineMenuPage {...pageProps} />;
    if (view === "match_summary") return <MatchSummaryPage {...pageProps} />;
    
    if (view === "auction") {
      const auctionPlayers = isOnline 
        ? onlineRoom?.players.filter(p => p.iplTeam).map(p => {
            const iplTeam = IPL_TEAMS.find(t => t.id === p.iplTeam);
            return {
              id: p.socketId,
              name: p.name,
              iplTeamId: p.iplTeam,
              iplTeam,
              socketId: p.socketId
            };
          })
        : auctionTeams.map(t => {
            const iplTeam = IPL_TEAMS.find(ipl => ipl.id === t.iplTeam);
            return {
              id: t.id,
              name: t.name,
              iplTeamId: t.iplTeam,
              iplTeam,
              socketId: t.id
            };
          });
      
      const myTeamId = isOnline 
        ? onlineRoom?.players.find(p => p.socketId === socket.id)?.socketId
        : socket.id;
      
      return (
        <AuctionPageLayout
          playerPool={LOCAL_POOL}
          teams={auctionPlayers}
          soldPlayers={[]}
          auctionPhase="running"
          currentBid={0}
          isOnlineHost={isOnlineHost}
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
          onBack={() => setView(isOnline ? "online_menu" : "menu")}
          getTeamDisplay={getTeamDisplay}
          isOnline={isOnline}
          myTeamId={myTeamId}
          socket={socket}
          onlineRoom={onlineRoom}
          roomCode={onlineRoom?.code}
        />
      );
    }

    if (view === "match") {
      const endMatch = handleEndMatch;

      // Determine if current player is batting
      let isCurrentPlayerBatting = true; // Default for offline
      if (isOnline && matchState && onlineRoom) {
        const mySide = onlineRoom.players?.find(p => p.socketId === socket.id)?.side;
        const battingTeamId = matchState.battingTeam?.id;
        // In online matches, side (A/B) is used as team ID
        isCurrentPlayerBatting = mySide === battingTeamId;
      }

      return (
        <MatchCenter
          matchState={matchState}
          bowlBall={bowlBall}
          skipOver={skipOver}
          skipFiveOvers={skipFiveOvers}
          skipTenOvers={skipTenOvers}
          skipInnings={skipInnings}
          handleInningsBreak={handleInningsBreak}
          endMatch={endMatch}
          activeTab={matchTab}
          setActiveTab={setMatchTab}
          isOnline={isOnline}
          canControl={isCurrentPlayerBatting}
          isSpectator={!isCurrentPlayerBatting}
          iplTeams={IPL_TEAMS}
          getTeamDisplay={getTeamDisplay}
          onlineRoom={onlineRoom}
          tournPhase={tournPhase}
          socket={socket}
          remoteMatchState={remoteMatchState}
          setView={setView}
        />
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

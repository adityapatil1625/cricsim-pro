import { useState } from 'react';

/**
 * @fileoverview Centralized application state management hook
 * @module useAppState
 * @description Consolidates all application state declarations, separating state logic from App.jsx
 * Manages view routing, game modes (quick play, tournament, auction, online), teams, matches, and multiplayer state
 * 
 * @returns {Object} Complete app state object with getters and setters for all features
 * 
 * @example
 * const {
 *   view, setView,
 *   teamA, setTeamA, teamB, setTeamB,
 *   onlineRoom, setOnlineRoom,
 *   matchState, setMatchState
 * } = useAppState();
 */
export const useAppState = () => {
  // View management
  const [view, setView] = useState("menu"); // menu | quick_setup | tourn_setup | tourn_draft | tourn_hub | online_entry | online_menu | match | auction
  
  // Quick play teams
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
  
  // Tournament state
  const [tournTeams, setTournTeams] = useState([]);
  const [fixtures, setFixtures] = useState([]);
  const [tournPhase, setTournPhase] = useState("league"); // "league", "semi", "final", "complete"
  const [selectedFixture, setSelectedFixture] = useState(null); // For match summary modal
  const [newTeamName, setNewTeamName] = useState("");
  const [activeTeamSelect, setActiveTeamSelect] = useState(null);
  const [tournamentStartError, setTournamentStartError] = useState(null);
  
  // Match state
  const [matchTab, setMatchTab] = useState("live"); // live | scorecard | commentary
  const [showToss, setShowToss] = useState(false); // For toss animation
  const [tossWinner, setTossWinner] = useState(null); // Team that won toss
  const [isStartingMatch, setIsStartingMatch] = useState(false);
  
  // Online/multiplayer state
  const [onlineRoom, setOnlineRoom] = useState(null);
  const [availableRooms, setAvailableRooms] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [playerName, setPlayerName] = useState("");
  const [onlineName, setOnlineName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [joinError, setJoinError] = useState("");
  const [onlineGameType, setOnlineGameType] = useState(null); // "quick" | "tournament" | "auction" | null
  const [remoteMatchState, setRemoteMatchState] = useState(null);
  
  // Ready system for online multiplayer
  const [isHostReady, setIsHostReady] = useState(false);
  const [playersReady, setPlayersReady] = useState({}); // { socketId: true/false }
  const [showGuestReadyModal, setShowGuestReadyModal] = useState(false);
  
  // Match entry ready system for league hub
  const [matchEntryReady, setMatchEntryReady] = useState({}); // { socketId: true/false }
  const [pendingMatchFixture, setPendingMatchFixture] = useState(null); // Fixture waiting for ready confirmation
  
  // Currently playing match (for spectator view)
  const [currentlyPlayingMatch, setCurrentlyPlayingMatch] = useState(null); // Fixture ID of match in progress
  
  // Auction state
  const [auctionTeams, setAuctionTeams] = useState([]);
  
  return {
    // View
    view,
    setView,
    
    // Quick play teams
    teamA,
    setTeamA,
    teamB,
    setTeamB,
    
    // Tournament
    tournTeams,
    setTournTeams,
    fixtures,
    setFixtures,
    tournPhase,
    setTournPhase,
    selectedFixture,
    setSelectedFixture,
    newTeamName,
    setNewTeamName,
    activeTeamSelect,
    setActiveTeamSelect,
    tournamentStartError,
    setTournamentStartError,
    
    // Match
    matchTab,
    setMatchTab,
    showToss,
    setShowToss,
    tossWinner,
    setTossWinner,
    isStartingMatch,
    setIsStartingMatch,
    
    // Online
    onlineRoom,
    setOnlineRoom,
    availableRooms,
    setAvailableRooms,
    loadingRooms,
    setLoadingRooms,
    playerName,
    setPlayerName,
    onlineName,
    setOnlineName,
    joinCode,
    setJoinCode,
    joinError,
    setJoinError,
    onlineGameType,
    setOnlineGameType,
    remoteMatchState,
    setRemoteMatchState,
    
    // Ready system
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
    currentlyPlayingMatch,
    setCurrentlyPlayingMatch,
    
    // Auction
    auctionTeams,
    setAuctionTeams,
  };
};

export default useAppState;

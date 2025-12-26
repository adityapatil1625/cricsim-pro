// src/hooks/useMultiplayer.js
import { useState, useEffect, useCallback } from "react";
import { socket } from "../socket";

export default function useMultiplayer() {
  const [room, setRoom] = useState(null);
  const [roomCode, setRoomCode] = useState("");
  const [playerSide, setPlayerSide] = useState(null);
  const [playerId, setPlayerId] = useState(null);
  const [isHost, setIsHost] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [matchState, setMatchState] = useState(null);
  const [isLive, setIsLive] = useState(false);

  // Create a new room
  const createRoom = useCallback(
    async (mode = "1v1", playerName = "Player") => {
      return new Promise((resolve, reject) => {
        setLoading(true);
        socket.emit("createRoom", { mode, playerName }, (response) => {
          setLoading(false);
          if (response.success) {
            setRoom(response.room);
            setRoomCode(response.code);
            setPlayerSide("A");
            setIsHost(true);
            setError(null);
            console.log("✅ Room created:", response.code);
            resolve(response);
          } else {
            setError(response.error || "Failed to create room");
            reject(new Error(response.error));
          }
        });
      });
    },
    []
  );

  // Join an existing room
  const joinRoom = useCallback(async (code, playerName = "Player") => {
    return new Promise((resolve, reject) => {
      setLoading(true);
      socket.emit("joinRoom", { code, playerName }, (response) => {
        setLoading(false);
        if (response.success) {
          setRoom(response.room);
          setRoomCode(response.code);
          setPlayerSide(response.side);
          setIsHost(false);
          setError(null);
          console.log("✅ Joined room:", response.code);
          resolve(response);
        } else {
          setError(response.error || "Failed to join room");
          reject(new Error(response.error));
        }
      });
    });
  }, []);

  // Update team players (before match starts)
  const updateTeamPlayers = useCallback(
    (teamPlayers) => {
      return new Promise((resolve, reject) => {
        socket.emit(
          "updateTeamPlayers",
          { roomCode, teamPlayers },
          (response) => {
            if (response.success) {
              resolve(response);
            } else {
              reject(new Error(response.error));
            }
          }
        );
      });
    },
    [roomCode]
  );

  // Start the match (only host)
  const startMatch = useCallback(
    (initMatchState) => {
      return new Promise((resolve, reject) => {
        if (!isHost) {
          reject(new Error("Only host can start match"));
          return;
        }
        socket.emit("startMatch", { roomCode, matchState: initMatchState }, (response) => {
          if (response.success) {
            setIsLive(true);
            resolve(response);
          } else {
            reject(new Error(response.error));
          }
        });
      });
    },
    [roomCode, isHost]
  );

  // Update match state (called frequently during match)
  const broadcastMatchState = useCallback(
    (updatedMatchState) => {
      if (!isHost || !isLive) return;
      socket.emit("updateMatchState", {
        roomCode,
        matchState: updatedMatchState,
      });
    },
    [roomCode, isHost, isLive]
  );

  // Bowl a ball
  const broadcastBallBowled = useCallback(
    (updatedMatchState, commentary) => {
      if (!isHost) return;
      socket.emit("bowlBall", {
        roomCode,
        matchState: updatedMatchState,
        commentary,
      });
    },
    [roomCode, isHost]
  );

  // Skip over
  const broadcastSkipOver = useCallback(
    (updatedMatchState) => {
      if (!isHost) return;
      socket.emit("skipOver", {
        roomCode,
        matchState: updatedMatchState,
      });
    },
    [roomCode, isHost]
  );

  // Innings break
  const broadcastInningsBreak = useCallback(
    (updatedMatchState) => {
      if (!isHost) return;
      socket.emit("inningsBreak", {
        roomCode,
        matchState: updatedMatchState,
      });
    },
    [roomCode, isHost]
  );

  // End match
  const broadcastEndMatch = useCallback(
    (finalMatchState) => {
      if (!isHost) return;
      socket.emit("endMatch", {
        roomCode,
        matchState: finalMatchState,
      });
      setIsLive(false);
    },
    [roomCode, isHost]
  );

  // Send message
  const sendMessage = useCallback(
    (message) => {
      socket.emit("sendMessage", {
        roomCode,
        message,
        sender: playerId,
      });
    },
    [roomCode, playerId]
  );

  // Socket event listeners
  useEffect(() => {
    // Receive room updates
    socket.on("roomUpdate", (updatedRoom) => {
      console.log("🔄 Room updated:", updatedRoom);
      setRoom(updatedRoom);
    });

    // Match started
    socket.on("matchStarted", (data) => {
      console.log("🎯 Match started:", data);
      setMatchState(data.matchState);
      setIsLive(true);
    });

    // Match state updated
    socket.on("matchStateUpdated", (data) => {
      setMatchState(data.matchState);
    });

    // Ball bowled
    socket.on("ballBowled", (data) => {
      setMatchState(data.matchState);
    });

    // Over skipped
    socket.on("overSkipped", (data) => {
      setMatchState(data.matchState);
    });

    // Innings changed
    socket.on("inningsChanged", (data) => {
      setMatchState(data.matchState);
    });

    // Match ended
    socket.on("matchEnded", (data) => {
      console.log("🏁 Match ended:", data);
      setMatchState(data.matchState);
      setIsLive(false);
    });

    // Player disconnected
    socket.on("playerDisconnected", (data) => {
      console.warn("⚠️  Player disconnected:", data.playerId);
      setRoom((prev) => ({
        ...prev,
        players: data.remainingPlayers,
      }));
    });

    // Host changed
    socket.on("hostChanged", (data) => {
      console.log("👑 New host:", data.newHostId);
      setIsHost(socket.id === data.newHostId);
    });

    // Message received
    socket.on("messageReceived", (data) => {
      console.log("💬 Message:", data.message);
    });

    return () => {
      socket.off("roomUpdate");
      socket.off("matchStarted");
      socket.off("matchStateUpdated");
      socket.off("ballBowled");
      socket.off("overSkipped");
      socket.off("inningsChanged");
      socket.off("matchEnded");
      socket.off("playerDisconnected");
      socket.off("hostChanged");
      socket.off("messageReceived");
    };
  }, []);

  return {
    // Room state
    room,
    roomCode,
    playerSide,
    playerId,
    isHost,
    loading,
    error,
    isLive,

    // Match state
    matchState,

    // Room actions
    createRoom,
    joinRoom,
    updateTeamPlayers,

    // Match actions
    startMatch,
    broadcastMatchState,
    broadcastBallBowled,
    broadcastSkipOver,
    broadcastInningsBreak,
    broadcastEndMatch,
    sendMessage,
  };
}

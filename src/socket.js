// src/socket.js
import { io } from "socket.io-client";

const SERVER_URL = import.meta.env.PROD
    ? (import.meta.env.VITE_SOCKET_SERVER || 'https://cricsim-pro.onrender.com')
    : 'http://localhost:4000';

console.log(`🔌 Socket.IO connecting to: ${SERVER_URL}`);

export const socket = io(SERVER_URL, {
    path: "/socket.io/",
    withCredentials: true,
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5,
    reconnectionDelayMax: 5000,
});

socket.on("connect", () => {
    console.log("✅ Socket connected:", socket.id);
});

socket.on("connect_error", (error) => {
    console.error("❌ Socket connection error:", error);
});

socket.on("disconnect", (reason) => {
    console.warn("⚠️  Socket disconnected:", reason);
});

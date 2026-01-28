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
    // You can dispatch a custom event or update state here to show UI notification
});

socket.on("disconnect", (reason) => {
    console.warn("⚠️  Socket disconnected:", reason);
});

socket.on("reconnect_attempt", (attempt) => {
    console.log(`🔄 Reconnection attempt ${attempt}/${socket.io.opts.reconnectionAttempts}`);
});

socket.on("reconnect", (attemptNumber) => {
    console.log(`✅ Reconnected after ${attemptNumber} attempt(s)`);
});

socket.on("reconnect_failed", () => {
    console.error("❌ Reconnection failed after maximum attempts");
    // Show persistent error notification to user
});

socket.on("error", (error) => {
    console.error("❌ Socket error:", error);
});

// Global error handler wrapper for socket events
export const safeSocketEmit = (eventName, data, callback) => {
    try {
        if (socket.connected) {
            socket.emit(eventName, data, callback);
        } else {
            console.warn(`⚠️  Socket not connected, cannot emit ${eventName}`);
            if (callback && typeof callback === 'function') {
                callback({ success: false, error: 'Socket not connected' });
            }
        }
    } catch (error) {
        console.error(`❌ Error emitting ${eventName}:`, error);
        if (callback && typeof callback === 'function') {
            callback({ success: false, error: error.message });
        }
    }
};

// Safe event listener wrapper
export const safeSocketOn = (eventName, handler) => {
    try {
        socket.on(eventName, (...args) => {
            try {
                handler(...args);
            } catch (error) {
                console.error(`❌ Error in ${eventName} handler:`, error);
            }
        });
    } catch (error) {
        console.error(`❌ Error registering ${eventName} listener:`, error);
    }
};

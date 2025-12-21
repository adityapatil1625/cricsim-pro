// src/socket.js
import { io } from "socket.io-client";

const SERVER_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

export const socket = io(SERVER_URL, {
    withCredentials: true,
    transports: ["websocket", "polling"],
});

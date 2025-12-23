// src/socket.js
import { io } from "socket.io-client";

const SERVER_URL = process.env.NODE_ENV === 'production' ? window.location.origin : 'http://localhost:4000';

export const socket = io(SERVER_URL, {
    path: "/api/socket.io/",
    withCredentials: true,
    transports: ["websocket", "polling"],
});

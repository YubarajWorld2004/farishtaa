import { io } from "socket.io-client";

let socket = null;
let currentToken = null;

const normalizeSocketUrl = (apiBaseUrl) => {
  if (!apiBaseUrl) return "";
  const normalized = String(apiBaseUrl).replace(/\/$/, "");
  return normalized.replace(/\/api$/, "");
};

export const connectRealtimeSocket = ({ apiBaseUrl, authToken }) => {
  if (!authToken) return null;

  const socketUrl = normalizeSocketUrl(apiBaseUrl);
  if (!socketUrl) return null;

  if (socket && currentToken === authToken) {
    return socket;
  }

  if (socket) {
    socket.disconnect();
    socket = null;
  }

  currentToken = authToken;
  socket = io(socketUrl, {
    transports: ["websocket", "polling"],
    auth: {
      token: `Bearer ${authToken}`,
    },
  });

  return socket;
};

export const getRealtimeSocket = () => socket;

export const disconnectRealtimeSocket = () => {
  currentToken = null;
  if (!socket) return;
  socket.disconnect();
  socket = null;
};

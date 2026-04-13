const { rooms, userSockets } = require("./roomManager");
const { validateRoomCode } = require("./validation");

const resolveRoom = (code) => {
  const codeValidation = validateRoomCode(code);
  if (!codeValidation.valid) {
    return { valid: false, error: codeValidation.error, room: null, code: null };
  }

  const room = rooms.get(codeValidation.code);
  if (!room) {
    return { valid: false, error: "Room not found", room: null, code: codeValidation.code };
  }

  return { valid: true, error: null, room, code: codeValidation.code };
};

const isRoomMember = (room, socketId) => {
  return room?.players?.some((player) => player.socketId === socketId) || false;
};

const isRoomHost = (room, socketId) => {
  return room?.host === socketId;
};

const getRoomPlayer = (room, socketId) => {
  return room?.players?.find((player) => player.socketId === socketId) || null;
};

const getUserSocket = (socketId) => {
  return userSockets.get(socketId) || null;
};

module.exports = {
  resolveRoom,
  isRoomMember,
  isRoomHost,
  getRoomPlayer,
  getUserSocket,
};
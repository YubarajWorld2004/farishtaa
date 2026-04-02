const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

let io = null;

const resolveSocketToken = (socket) => {
  const authToken = socket.handshake?.auth?.token;
  const headerToken =
    socket.handshake?.headers?.authorization || socket.handshake?.headers?.Authorization;
  const rawValue = authToken || headerToken || '';
  const parts = String(rawValue).split(' ');
  return parts.length === 2 ? parts[1] : parts[0];
};

const resolveCorsOrigins = () => {
  const value = String(process.env.SOCKET_CORS_ORIGIN || '').trim();
  if (!value) {
    return '*';
  }

  const values = value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

  return values.length > 0 ? values : '*';
};

exports.initSocketServer = (httpServer) => {
  if (io) {
    return io;
  }

  io = new Server(httpServer, {
    cors: {
      origin: resolveCorsOrigins(),
      methods: ['GET', 'POST'],
    },
  });

  io.use((socket, next) => {
    try {
      const token = resolveSocketToken(socket);
      if (!token) {
        return next(new Error('Unauthorized'));
      }

      const payload = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = payload.userId;
      socket.userType = payload.userType;
      return next();
    } catch (error) {
      return next(new Error('Unauthorized'));
    }
  });

  io.on('connection', (socket) => {
    const userId = String(socket.userId || '');
    if (!userId) {
      socket.disconnect(true);
      return;
    }

    socket.join(`user:${userId}`);

    socket.emit('realtime:connected', {
      userId,
      connectedAt: new Date().toISOString(),
    });
  });

  return io;
};

exports.emitToUser = (userId, eventName, payload = {}) => {
  if (!io || !userId || !eventName) {
    return false;
  }

  io.to(`user:${String(userId)}`).emit(eventName, payload);
  return true;
};

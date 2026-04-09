const { Server } = require('socket.io');
const { createAdapter } = require('@socket.io/redis-adapter');
const Redis = require('ioredis');
const jwt = require('jsonwebtoken');

let io = null;
let redisPubClient = null;
let redisSubClient = null;
let redisAdapterEnabled = false;

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

const resolveSocketRedisUrl = () => String(process.env.SOCKET_REDIS_URL || '').trim();

const closeRedisClients = async () => {
  const clients = [redisPubClient, redisSubClient].filter(Boolean);
  redisPubClient = null;
  redisSubClient = null;
  redisAdapterEnabled = false;

  await Promise.all(
    clients.map(async (client) => {
      try {
        await client.quit();
      } catch (error) {
        try {
          client.disconnect();
        } catch (_) {
          // noop
        }
      }
    })
  );
};

const enableRedisAdapter = async () => {
  const redisUrl = resolveSocketRedisUrl();
  if (!redisUrl || !io || redisAdapterEnabled) {
    return;
  }

  try {
    redisPubClient = new Redis(redisUrl, {
      lazyConnect: true,
      maxRetriesPerRequest: null,
      enableReadyCheck: true,
    });
    redisSubClient = redisPubClient.duplicate();

    await Promise.all([redisPubClient.connect(), redisSubClient.connect()]);
    io.adapter(createAdapter(redisPubClient, redisSubClient));
    redisAdapterEnabled = true;
    console.log('Socket.IO Redis adapter enabled');
  } catch (error) {
    console.warn(`Socket.IO Redis adapter not enabled: ${error.message}`);
    await closeRedisClients();
  }
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

  enableRedisAdapter().catch((error) => {
    console.warn(`Socket.IO Redis adapter setup failed: ${error.message}`);
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

exports.getSocketRedisStatus = () => ({
  configured: Boolean(resolveSocketRedisUrl()),
  enabled: redisAdapterEnabled,
  pubState: redisPubClient?.status || 'disconnected',
  subState: redisSubClient?.status || 'disconnected',
});

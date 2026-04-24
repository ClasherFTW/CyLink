const { Server } = require("socket.io");
const User = require("../models/User");
const { verifyAccessToken } = require("../services/auth/token");
const { getUserRoom } = require("../services/chatService");
const registerChatSocketHandlers = require("./chatSocket");

const getSocketToken = (socket) => {
  if (socket.handshake.auth?.token) {
    return socket.handshake.auth.token;
  }

  const authHeader = socket.handshake.headers?.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.split(" ")[1];
  }

  return null;
};

const parseAllowedOrigins = () => {
  const value = process.env.CORS_ORIGIN;
  if (!value) return true;

  const origins = value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  if (origins.length === 0) return true;
  if (origins.includes("*")) return true;
  return origins;
};

const initializeSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: parseAllowedOrigins(),
      credentials: true,
    },
  });

  io.use(async (socket, next) => {
    try {
      const token = getSocketToken(socket);
      if (!token) {
        return next(new Error("Authentication error: missing token."));
      }

      const decoded = verifyAccessToken(token);
      const user = await User.findById(decoded.id).select("_id username role");
      if (!user) {
        return next(new Error("Authentication error: user not found."));
      }

      socket.user = {
        id: user._id.toString(),
        username: user.username,
        role: user.role,
      };

      return next();
    } catch (_error) {
      return next(new Error("Authentication error: invalid token."));
    }
  });

  io.on("connection", (socket) => {
    // eslint-disable-next-line no-console
    console.log(`Socket connected: ${socket.id} (${socket.user.username})`);

    socket.join(getUserRoom(socket.user.id));
    registerChatSocketHandlers(io, socket);
  });

  return io;
};

module.exports = initializeSocket;

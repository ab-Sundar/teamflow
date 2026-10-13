const jwt = require("jsonwebtoken");
const env = require("../config/env");

const socketAuthMiddleware = (socket, next) => {
  try {
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error("Authentication required"));
    }

    const decoded = jwt.verify(token,env.jwtSecret);

    socket.user = {
      id: decoded.userId,
    };

    next();
  } catch (error) {
    next(new Error("Invalid or expired token"));
  }
};

module.exports = socketAuthMiddleware;

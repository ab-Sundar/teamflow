const http = require("http");
const { Server } = require("socket.io");
const { createAdapter } = require("@socket.io/redis-adapter");

const env = require("./src/config/env");

const {
  connectRedis,
  createRedisPubSubClients,
} = require("./src/config/redis");

const app = require("./src/app");

const socketAuthMiddleware = require("./src/middleware/socketAuthMiddleware");

const pool = require("./src/db/pool");

const PORT = env.port;

// Create HTTP server using Express app
const server = http.createServer(app);

// Create Socket.IO server
const io = new Server(server, {
  cors: {
    origin: env.clientOrigin,

    methods: ["GET", "POST"],
  },
});

app.set("io", io);

io.use(socketAuthMiddleware);

// Handle WebSocket connections
io.on("connection", (socket) => {
  console.log(
    "WebSocket client connected:",
    socket.id,
    "User:",
    socket.user.id,
  );

  socket.on("workspace:join", async (workspaceId, callback) => {
    try {
      const result = await pool.query(
        `
        SELECT role
        FROM workspace_members
        WHERE workspace_id = $1
          AND user_id = $2
        `,
        [workspaceId, socket.user.id],
      );

      if (result.rows.length === 0) {
        return callback({
          success: false,
          message: "You are not a member of this workspace",
        });
      }

      const room = `workspace:${workspaceId}`;

      socket.join(room);

      console.log(`User ${socket.user.id} joined ${room}`);

      callback({
        success: true,
        workspaceId,
        role: result.rows[0].role,
      });
    } catch (error) {
      console.error("Workspace join error:", error);

      callback({
        success: false,
        message: "Failed to join workspace",
      });
    }
  });

  socket.on("disconnect", () => {
    console.log("WebSocket client disconnected:", socket.id);
  });
});

const startServer = async () => {
  try {
    await connectRedis();

    const { pubClient, subClient } = await createRedisPubSubClients();

    io.adapter(createAdapter(pubClient, subClient));

    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();

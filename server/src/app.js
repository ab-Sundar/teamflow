const express = require("express");
const cors = require("cors");
const helmet = require("helmet");

const env = require("./config/env");

const authRoutes = require("./routes/authRoutes");
const workspaceRoutes = require("./routes/workspaceRoutes");
const memberRoutes = require("./routes/memberRoutes");
const boardRoutes = require("./routes/boardRoutes");
const listRoutes = require("./routes/listRoutes");
const cardRoutes = require("./routes/cardRoutes");
const commentRoutes = require("./routes/commentRoutes");
const activityRoutes = require("./routes/activityRoutes");

const requestLogger = require("./middleware/requestLogger");
const notFoundMiddleware = require("./middleware/notFoundMiddleware");
const errorMiddleware = require("./middleware/errorMiddleware");

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: env.clientOrigin,
    methods: ["GET", "POST", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
app.use(
  express.json({
    limit: "100kb",
  }),
);
app.use(requestLogger);

app.use("/api/auth", authRoutes);
app.use("/api/workspaces", workspaceRoutes);
app.use("/api/workspaces", memberRoutes);
app.use("/api/workspaces", boardRoutes);
app.use("/api/boards", listRoutes);
app.use("/api/lists", cardRoutes);
app.use("/api/lists", commentRoutes);
app.use("/api/workspaces", activityRoutes);

app.use(notFoundMiddleware);
app.use(errorMiddleware);

module.exports = app;

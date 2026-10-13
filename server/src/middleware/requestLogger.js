const env = require("../config/env");

const requestLogger = (req, res, next) => {
  const start = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - start;

    const log = {
      method: req.method,
      path: req.originalUrl,
      status: res.statusCode,
      durationMs: duration,
    };

    if (req.user?.id) {
      log.userId = req.user.id;
    }

    if (res.statusCode >= 500) {
      console.error("[HTTP]", log);
    } else if (env.nodeEnv !== "production" || res.statusCode >= 400) {
      console.log("[HTTP]", log);
    }
  });

  next();
};

module.exports = requestLogger;

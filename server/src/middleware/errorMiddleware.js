const env = require("../config/env");

const errorMiddleware = (error, req, res, next) => {
  console.error("[ERROR]", {
    method: req.method,
    path: req.originalUrl,
    message: error.message,
    stack: env.nodeEnv === "production" ? undefined : error.stack,
  });

  if (res.headersSent) {
    return next(error);
  }
  if (error instanceof SyntaxError && error.status === 400 && "body" in error) {
    return res.status(400).json({
      message: "Invalid JSON body",
    });
  }
  
  const statusCode = error.statusCode || error.status || 500;

  const response = {
    message:
      statusCode === 500 && env.nodeEnv === "production"
        ? "Internal server error"
        : error.message || "Internal server error",
  };

  if (env.nodeEnv !== "production" && error.stack) {
    response.stack = error.stack;
  }

  return res.status(statusCode).json(response);
};

module.exports = errorMiddleware;

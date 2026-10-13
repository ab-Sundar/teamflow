require("dotenv").config();

const requiredVariables = ["REDIS_URL", "JWT_SECRET", "CLIENT_ORIGIN"];

if (!process.env.DATABASE_URL) {
  requiredVariables.push("DB_HOST", "DB_NAME", "DB_USER", "DB_PASSWORD");
}

for (const variable of requiredVariables) {
  if (!process.env[variable]) {
    throw new Error(`Missing required environment variable: ${variable}`);
  }
}

const env = {
  nodeEnv: process.env.NODE_ENV || "development",

  port: Number(process.env.PORT) || 3000,

  databaseUrl: process.env.DATABASE_URL || null,

  db: {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 5432,
    name: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  },

  redisUrl: process.env.REDIS_URL,

  jwtSecret: process.env.JWT_SECRET,

  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",

  clientOrigin: process.env.CLIENT_ORIGIN,
};

module.exports = env;

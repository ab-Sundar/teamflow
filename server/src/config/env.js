require("dotenv").config();

const requiredVariables = [
  "DB_HOST",
  "DB_NAME",
  "DB_USER",
  "DB_PASSWORD",
  "REDIS_URL",
  "JWT_SECRET",
  "CLIENT_ORIGIN",
];

for (const variable of requiredVariables) {
  if (!process.env[variable]) {
    throw new Error(`Missing required environment variable: ${variable}`);
  }
}

const env = {
  nodeEnv: process.env.NODE_ENV || "development",

  clientOrigin: process.env.CLIENT_ORIGIN,

  port: Number(process.env.PORT) || 3000,

  db: {
    host: process.env.DB_HOST,

    port: Number(process.env.DB_PORT) || 5432,

    name: process.env.DB_NAME,

    user: process.env.DB_USER,

    password: process.env.DB_PASSWORD,
  },

  redisUrl: process.env.REDIS_URL,

  jwtSecret: process.env.JWT_SECRET,
};

module.exports = env;

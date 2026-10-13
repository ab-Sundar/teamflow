const { Pool } = require("pg");

const env = require("../config/env");

const pool = env.databaseUrl
  ? new Pool({
      connectionString: env.databaseUrl,
      ssl: {
        rejectUnauthorized: false,
      },
    })
  : new Pool({
      host: env.db.host,
      port: env.db.port,
      database: env.db.name,
      user: env.db.user,
      password: env.db.password,
    });

module.exports = pool;

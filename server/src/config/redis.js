const { createClient } = require("redis");

const env = require("./env");

const redisClient = createClient({
  url: env.redisUrl,
});

redisClient.on("error", (error) => {
  console.error("Redis Client Error:", error);
});

const connectRedis = async () => {
  if (!redisClient.isOpen) {
    await redisClient.connect();

    console.log("Redis connected");
  }
};

const createRedisPubSubClients = async () => {
  const pubClient = createClient({
    url: env.redisUrl,
  });

  const subClient = pubClient.duplicate();

  pubClient.on("error", (error) => {
    console.error("Redis Pub Client Error:", error);
  });

  subClient.on("error", (error) => {
    console.error("Redis Sub Client Error:", error);
  });

  await pubClient.connect();
  await subClient.connect();

  console.log("Redis Pub/Sub connected");

  return {
    pubClient,
    subClient,
  };
};

module.exports = {
  redisClient,
  connectRedis,
  createRedisPubSubClients,
};

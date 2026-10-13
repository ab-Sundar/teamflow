const { redisClient } = require("../config/redis");

const getCache = async (key) => {
  try {
    const cachedValue = await redisClient.get(key);

    if (!cachedValue) {
      return null;
    }

    return JSON.parse(cachedValue);
  } catch (error) {
    console.error("Redis cache GET failed:", {
      key,
      message: error.message,
    });

    return null;
  }
};

const setCache = async (key, value, ttl = 60) => {
  try {
    await redisClient.set(key, JSON.stringify(value), {
      EX: ttl,
    });
  } catch (error) {
    console.error("Redis cache SET failed:", {
      key,
      message: error.message,
    });
  }
};

const deleteCache = async (key) => {
  try {
    await redisClient.del(key);
  } catch (error) {
    console.error("Redis cache DELETE failed:", {
      key,
      message: error.message,
    });
  }
};

module.exports = {
  getCache,
  setCache,
  deleteCache,
};

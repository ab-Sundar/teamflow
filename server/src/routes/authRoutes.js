const express = require("express");

const { register, login, me } = require("../controllers/authController");
const authMiddleware = require("../middleware/authMiddleware");
const authRateLimiter = require("../middleware/authRateLimiter");

const router = express.Router();

router.post("/register", authRateLimiter, register);
router.post("/login", authRateLimiter, login);
router.get("/me", authMiddleware, me);

module.exports = router;

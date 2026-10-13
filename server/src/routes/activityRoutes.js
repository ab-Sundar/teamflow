const express = require("express");

const {
  getActivities,
} = require("../controllers/activityController");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.get(
  "/:workspaceId/activities",
  authMiddleware,
  getActivities
);

module.exports = router;
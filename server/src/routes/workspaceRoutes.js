const express = require("express");

const authMiddleware = require("../middleware/authMiddleware");
const {
  createWorkspace,
  getUserWorkspaces,
  getWorkspaceById
} = require("../controllers/workspaceController");

const router = express.Router();

router.post(
  "/",
  authMiddleware,
  createWorkspace
);

router.get(
  "/",
  authMiddleware,
  getUserWorkspaces
);

router.get(
  "/:id",
  authMiddleware,
  getWorkspaceById
);

module.exports = router;
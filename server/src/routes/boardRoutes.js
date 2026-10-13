const express = require("express");

const {
  createBoard,
  getBoards,
  getBoard,
  updateBoard,
  deleteBoard
} = require("../controllers/boardController");

const authMiddleware = require("../middleware/authMiddleware");

const {
  requireWorkspaceRole,
} = require("../middleware/authorizeMiddleware");

const router = express.Router();


// Get all boards in a workspace
router.get(
  "/:workspaceId/boards",
  authMiddleware,
  requireWorkspaceRole("owner", "admin", "member", "viewer"),
  getBoards
);


// Get one board
router.get(
  "/:workspaceId/boards/:boardId",
  authMiddleware,
  requireWorkspaceRole("owner", "admin", "member", "viewer"),
  getBoard
);


// Create board
router.post(
  "/:workspaceId/boards",
  authMiddleware,
  requireWorkspaceRole("owner", "admin"),
  createBoard
);

router.patch(
  "/:workspaceId/boards/:boardId",
  authMiddleware,
  requireWorkspaceRole("owner", "admin"),
  updateBoard
);

router.delete(
  "/:workspaceId/boards/:boardId",
  authMiddleware,
  requireWorkspaceRole("owner", "admin"),
  deleteBoard
);

module.exports = router;
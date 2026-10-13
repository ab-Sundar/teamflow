const express = require("express");

const {
  createList,
  getLists,
  getList,
  updateList,
  deleteList,
} = require("../controllers/listController");

const authMiddleware = require("../middleware/authMiddleware");

const {
  requireBoardRole,
} = require("../middleware/boardAuthorizeMiddleware");

const router = express.Router();


// Get all lists
router.get(
  "/:boardId/lists",
  authMiddleware,
  requireBoardRole("owner", "admin", "member", "viewer"),
  getLists
);


// Get one list
router.get(
  "/:boardId/lists/:listId",
  authMiddleware,
  requireBoardRole("owner", "admin", "member", "viewer"),
  getList
);


// Create list
router.post(
  "/:boardId/lists",
  authMiddleware,
  requireBoardRole("owner", "admin", "member"),
  createList
);


// Update list
router.patch(
  "/:boardId/lists/:listId",
  authMiddleware,
  requireBoardRole("owner", "admin", "member"),
  updateList
);


// Delete list
router.delete(
  "/:boardId/lists/:listId",
  authMiddleware,
  requireBoardRole("owner", "admin", "member"),
  deleteList
);


module.exports = router;
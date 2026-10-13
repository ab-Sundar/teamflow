const express = require("express");

const {
  createComment,
  getComments,
  deleteComment,
} = require("../controllers/commentController");

const authMiddleware = require("../middleware/authMiddleware");

const {
  requireListRole,
} = require("../middleware/listAuthorizeMiddleware");

const router = express.Router();


// Get comments
router.get(
  "/:listId/cards/:cardId/comments",
  authMiddleware,
  requireListRole("owner", "admin", "member", "viewer"),
  getComments
);


// Create comment
router.post(
  "/:listId/cards/:cardId/comments",
  authMiddleware,
  requireListRole("owner", "admin", "member"),
  createComment
);


// Delete own comment
router.delete(
  "/:listId/cards/:cardId/comments/:commentId",
  authMiddleware,
  requireListRole("owner", "admin", "member"),
  deleteComment
);


module.exports = router;
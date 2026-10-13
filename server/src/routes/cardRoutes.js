const express = require("express");

const {
  createCard,
  getCards,
  getCard,
  updateCard,
  deleteCard,
  moveCard,
  assignCard,
  updateDueDate
} = require("../controllers/cardController");

const authMiddleware = require("../middleware/authMiddleware");

const {
  requireListRole,
} = require("../middleware/listAuthorizeMiddleware");

const router = express.Router();


// Get all cards in a list
router.get(
  "/:listId/cards",
  authMiddleware,
  requireListRole("owner", "admin", "member", "viewer"),
  getCards
);


// Get one card
router.get(
  "/:listId/cards/:cardId",
  authMiddleware,
  requireListRole("owner", "admin", "member", "viewer"),
  getCard
);


// Create card
router.post(
  "/:listId/cards",
  authMiddleware,
  requireListRole("owner", "admin", "member"),
  createCard
);

router.patch(
  "/:listId/cards/:cardId",
  authMiddleware,
  requireListRole("owner", "admin", "member"),
  updateCard
);

router.delete(
  "/:listId/cards/:cardId",
  authMiddleware,
  requireListRole("owner", "admin", "member"),
  deleteCard
);

router.patch(
  "/:listId/cards/:cardId/move",
  authMiddleware,
  requireListRole("owner", "admin", "member"),
  moveCard
);

router.patch(
  "/:listId/cards/:cardId/assignee",
  authMiddleware,
  requireListRole("owner", "admin", "member"),
  assignCard
);

router.patch(
  "/:listId/cards/:cardId/due-date",
  authMiddleware,
  requireListRole("owner", "admin", "member"),
  updateDueDate
);

module.exports = router;
const express = require("express");

const authMiddleware = require("../middleware/authMiddleware");

const {
  getWorkspaceMembers,
  addWorkspaceMember,
  updateMemberRole,
  removeWorkspaceMember,
} = require("../controllers/memberController");

const {
    requireWorkspaceRole,
} =require("../middleware/authorizeMiddleware")

const router = express.Router();

router.get(
  "/:id/members",
  authMiddleware,
  getWorkspaceMembers
);

router.post(
  "/:id/members",
  authMiddleware,
  requireWorkspaceRole("owner", "admin"),
  addWorkspaceMember
);

router.patch(
  "/:id/members/:userId",
  authMiddleware,
  requireWorkspaceRole("owner"),
  updateMemberRole
);

router.delete(
  "/:id/members/:userId",
  authMiddleware,
  requireWorkspaceRole("owner", "admin"),
  removeWorkspaceMember
);

module.exports = router;
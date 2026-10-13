const memberService = require("../services/memberService");

const getWorkspaceMembers = async (req, res, next) => {
  try {
    const members = await memberService.getWorkspaceMembers(req.params.id);

    res.status(200).json({
      members,
    });
  } catch (error) {
    next(error);
  }
};

const addWorkspaceMember = async (req, res, next) => {
  try {
    const member = await memberService.addWorkspaceMember({
      workspaceId: req.params.id,
      email: req.body.email,
      role: req.body.role || "member",
    });

    const io = req.app.get("io");

    io.to(`workspace:${req.params.id}`).emit("member:added", {
      member,
      addedBy: req.user.id,
    });

    res.status(201).json({
      member,
    });
  } catch (error) {
    next(error);
  }
};

const updateMemberRole = async (req, res, next) => {
  try {
    const member = await memberService.updateMemberRole({
      workspaceId: req.params.id,
      targetUserId: req.params.userId,
      newRole: req.body.role,
    });

    const io = req.app.get("io");

    io.to(`workspace:${req.params.id}`).emit("member:role-updated", {
      userId:req.params.userId,
      role:req.body.role,
      updatedBy: req.user.id,
    });

    res.status(200).json({
      member,
    });
  } catch (error) {
    next(error);
  }
};

const removeWorkspaceMember = async (req, res, next) => {
  try {
    await memberService.removeWorkspaceMember({
      workspaceId: req.params.id,
      targetUserId: req.params.userId,
    });

    const io = req.app.get("io");

    io.to(`workspace:${req.params.id}`).emit("member:removed", {
      userId: req.params.userId,
      removedBy: req.user.id,
    });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getWorkspaceMembers,
  addWorkspaceMember,
  updateMemberRole,
  removeWorkspaceMember,
};

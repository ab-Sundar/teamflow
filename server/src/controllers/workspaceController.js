const workspaceService = require("../services/workspaceService");

const createWorkspace = async (req, res, next) => {
  try {
    const workspace = await workspaceService.createWorkspace({
      name: req.body.name,
      userId: req.user.id,
    });

    res.status(201).json({
      workspace,
    });
  } catch (error) {
    next(error);
  }
};

const getUserWorkspaces = async (req, res, next) => {
  try {
    const workspaces =
      await workspaceService.getUserWorkspaces(req.user.id);

    res.status(200).json({
      workspaces,
    });
  } catch (error) {
    next(error);
  }
};

const getWorkspaceById = async (req, res, next) => {
  try {
    const workspace = await workspaceService.getWorkspaceById({
      workspaceId: req.params.id,
      userId: req.user.id,
    });

    res.status(200).json({
      workspace,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createWorkspace,
  getUserWorkspaces,
  getWorkspaceById
};
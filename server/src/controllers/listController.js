const listService = require("../services/listService");

const createList = async (req, res, next) => {
  try {
    const { boardId } = req.params;
    const { name } = req.body;

    const list = await listService.createList({
      boardId,
      name,
    });

    const io = req.app.get("io");

    io.to(`workspace:${req.workspaceId}`).emit("list:created", {
      list,
      createdBy: req.user.id,
    });

    res.status(201).json({
      message: "List created successfully",
      list,
    });
  } catch (error) {
    next(error);
  }
};

const getLists = async (req, res, next) => {
  try {
    const { boardId } = req.params;

    const lists = await listService.getLists(boardId);

    res.status(200).json({
      lists,
    });
  } catch (error) {
    next(error);
  }
};

const getList = async (req, res, next) => {
  try {
    const { boardId, listId } = req.params;

    const list = await listService.getList({
      boardId,
      listId,
    });

    if (!list) {
      return res.status(404).json({
        message: "List not found",
      });
    }

    res.status(200).json({
      list,
    });
  } catch (error) {
    next(error);
  }
};

const updateList = async (req, res, next) => {
  try {
    const { boardId, listId } = req.params;
    const { name } = req.body;

    const list = await listService.updateList({
      boardId,
      listId,
      name,
    });

    if (!list) {
      return res.status(404).json({
        message: "List not found",
      });
    }

    const io = req.app.get("io");

    io.to(`workspace:${req.workspaceId}`).emit("list:updated", {
      list,
      updatedBy: req.user.id,
    });

    res.status(200).json({
      message: "List updated successfully",
      list,
    });
  } catch (error) {
    next(error);
  }
};

const deleteList = async (req, res, next) => {
  try {
    const { boardId, listId } = req.params;

    const list = await listService.deleteList({
      boardId,
      listId,
    });

    if (!list) {
      return res.status(404).json({
        message: "List not found",
      });
    }

    const io = req.app.get("io");

    io.to(`workspace:${req.workspaceId}`).emit("list:deleted", {
      listId,
      deletedBy: req.user.id,
    });

    res.status(200).json({
      message: "List deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createList,
  getLists,
  getList,
  updateList,
  deleteList,
};

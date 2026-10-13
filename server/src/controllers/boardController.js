const boardService = require("../services/boardService");

const createBoard = async (req, res, next) => {
  try {
    const { workspaceId } = req.params;
    const { name } = req.body;

    const board = await boardService.createBoard({
      workspaceId,
      userId: req.user.id,
      name,
    });

    const io = req.app.get("io");

    io.to(`workspace:${req.params.workspaceId}`).emit("board:created", {
      board,
      createdBy: req.user.id,
    });

    res.status(201).json({
      message: "Board created successfully",
      board,
    });
  } catch (error) {
    next(error);
  }
};

const getBoards = async (req, res, next) => {
  try {
    const { workspaceId } = req.params;

    const boards = await boardService.getBoards(workspaceId);

    res.status(200).json({
      boards,
    });
  } catch (error) {
    next(error);
  }
};

const getBoard = async (req, res, next) => {
  try {
    const { workspaceId, boardId } = req.params;

    const board = await boardService.getBoard({
      workspaceId,
      boardId,
    });

    if (!board) {
      return res.status(404).json({
        message: "Board not found",
      });
    }

    res.status(200).json({
      board,
    });
  } catch (error) {
    next(error);
  }
};

const updateBoard = async (req, res, next) => {
  try {
    const { workspaceId, boardId } = req.params;
    const { name } = req.body;

    const board = await boardService.updateBoard({
      workspaceId,
      boardId,
      name,
    });

    if (!board) {
      return res.status(404).json({
        message: "Board not found",
      });
    }
    console.log("Board update WebSocket:", {
      workspaceId: req.workspaceId,
      userId: req.user.id,
    });
    const io = req.app.get("io");

    io.to(`workspace:${req.params.workspaceId}`).emit("board:updated", {
      board,
      updatedBy: req.user.id,
    });

    res.status(200).json({
      message: "Board updated successfully",
      board,
    });
  } catch (error) {
    next(error);
  }
};

const deleteBoard = async (req, res, next) => {
  try {
    const { workspaceId, boardId } = req.params;

    const board = await boardService.deleteBoard({
      workspaceId,
      boardId,
    });

    if (!board) {
      return res.status(404).json({
        message: "Board not found",
      });
    }

    const io = req.app.get("io");

    io.to(`workspace:${req.params.workspaceId}`).emit("board:deleted", {
      boardId,
      deletedBy: req.user.id,
    });

    res.status(200).json({
      message: "Board deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createBoard,
  getBoards,
  getBoard,
  updateBoard,
  deleteBoard,
};

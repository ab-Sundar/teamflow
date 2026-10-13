const commentService = require("../services/commentService");

const createComment = async (req, res, next) => {
  try {
    const { cardId } = req.params;
    const { content } = req.body;

    const comment = await commentService.createComment({
      cardId,
      userId: req.user.id,
      content,
    });

    const io = req.app.get("io");

    io.to(`workspace:${req.workspaceId}`).emit("comment:created", {
      comment,
      createdBy: req.user.id,
    });

    res.status(201).json({
      message: "Comment created successfully",
      comment,
    });
  } catch (error) {
    next(error);
  }
};

const getComments = async (req, res, next) => {
  try {
    const { cardId } = req.params;

    const comments = await commentService.getComments(cardId);

    res.status(200).json({
      comments,
    });
  } catch (error) {
    next(error);
  }
};

const deleteComment = async (req, res, next) => {
  try {
    const { cardId, commentId } = req.params;

    const comment = await commentService.deleteComment({
      cardId,
      commentId,
      userId: req.user.id,
    });

    const io = req.app.get("io");

    io.to(`workspace:${req.workspaceId}`).emit("comment:deleted", {
      commentId,
      cardId,
      deletedBy: req.user.id,
    });

    res.status(200).json({
      message: "Comment deleted successfully",
      comment,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createComment,
  getComments,
  deleteComment,
};

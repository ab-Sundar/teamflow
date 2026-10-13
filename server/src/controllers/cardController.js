const cardService = require("../services/cardService");

const createCard = async (req, res, next) => {
  try {
    const { listId } = req.params;
    const { title, description } = req.body;

    const card = await cardService.createCard({
      listId,
      userId: req.user.id,
      title,
      description,
    });

    const io = req.app.get("io");

    io.to(`workspace:${req.workspaceId}`).emit("card:created", {
      card,
      createdBy: req.user.id,
    });

    res.status(201).json({
      message: "Card created successfully",
      card,
    });
  } catch (error) {
    next(error);
  }
};

const getCards = async (req, res, next) => {
  try {
    const { listId } = req.params;

    const cards = await cardService.getCards(listId);

    res.status(200).json({
      cards,
    });
  } catch (error) {
    next(error);
  }
};

const getCard = async (req, res, next) => {
  try {
    const { listId, cardId } = req.params;

    const card = await cardService.getCard({
      listId,
      cardId,
    });

    if (!card) {
      return res.status(404).json({
        message: "Card not found",
      });
    }

    res.status(200).json({
      card,
    });
  } catch (error) {
    next(error);
  }
};

const updateCard = async (req, res, next) => {
  try {
    const { listId, cardId } = req.params;
    const { title, description } = req.body;

    const card = await cardService.updateCard({
      listId,
      cardId,
      title,
      description,
      userId: req.user.id,
    });

    if (!card) {
      return res.status(404).json({
        message: "Card not found",
      });
    }
    const io = req.app.get("io");

    io.to(`workspace:${req.workspaceId}`).emit("card:updated", {
      card,
      updatedBy: req.user.id,
    });
    res.status(200).json({
      message: "Card updated successfully",
      card,
    });
  } catch (error) {
    next(error);
  }
};

const deleteCard = async (req, res, next) => {
  try {
    const { listId, cardId } = req.params;

    const card = await cardService.deleteCard({
      listId,
      cardId,
      userId: req.user.id,
    });

    if (!card) {
      return res.status(404).json({
        message: "Card not found",
      });
    }
    const io = req.app.get("io");

    io.to(`workspace:${req.workspaceId}`).emit("card:deleted", {
      cardId,
      deletedBy: req.user.id,
    });

    res.status(200).json({
      message: "Card deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

const moveCard = async (req, res, next) => {
  try {
    const { listId, cardId } = req.params;
    const { targetListId, position } = req.body;

    const card = await cardService.moveCard({
      cardId,
      sourceListId: listId,
      targetListId,
      position,
      userId: req.user.id,
    });

    const io = req.app.get("io");

    io.to(`workspace:${req.workspaceId}`).emit("card:moved", {
      card,
      movedBy: req.user.id,
      sourceListId: listId,
      targetListId,
      position,
    });

    res.status(200).json({
      message: "Card moved successfully",
      card,
    });
  } catch (error) {
    next(error);
  }
};

const assignCard = async (req, res, next) => {
  try {
    const { listId, cardId } = req.params;

    const { userId: assignedTo } = req.body;

    const card = await cardService.assignCard({
      listId,
      cardId,
      userId: req.user.id,
      assignedTo,
    });

    /*
      Notify every connected user
      in this workspace.

      Frontend will refetch this list
      so assignee_name also stays
      synchronized correctly.
    */
    const io = req.app.get("io");

    io.to(`workspace:${req.workspaceId}`).emit("card:assignee-updated", {
      cardId,
      listId,
      assignedTo,
      updatedBy: req.user.id,
    });

    res.status(200).json({
      message: "Card assignment updated successfully",

      card,
    });
  } catch (error) {
    next(error);
  }
};

const updateDueDate = async (req, res, next) => {
  try {
    const { listId, cardId } = req.params;

    const { dueDate } = req.body;

    const card = await cardService.updateDueDate({
      listId,
      cardId,
      dueDate,
      userId: req.user.id,
    });

    if (!card) {
      return res.status(404).json({
        message: "Card not found",
      });
    }

    const io = req.app.get("io");

    io.to(`workspace:${req.workspaceId}`).emit("card:due-date-updated", {
      cardId,
      listId,
      dueDate,
      updatedBy: req.user.id,
    });

    res.status(200).json({
      message: dueDate
        ? "Due date updated successfully"
        : "Due date removed successfully",

      card,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createCard,
  getCards,
  getCard,
  updateCard,
  deleteCard,
  moveCard,
  assignCard,
  updateDueDate,
};

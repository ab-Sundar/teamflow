const activityService = require("../services/activityService");

const getActivities = async (req, res, next) => {
  try {
    const { workspaceId } = req.params;

    const limit = Number(req.query.limit) || 20;

    const cursorCreatedAt =
      req.query.cursorCreatedAt || null;

    const cursorId =
      req.query.cursorId || null;

    const activities = await activityService.getActivities({
      workspaceId,
      limit,
      cursorCreatedAt,
      cursorId,
    });

    let nextCursor = null;

    if (activities.length > 0) {
      const lastActivity =
        activities[activities.length - 1];

      nextCursor = {
        createdAt: lastActivity.created_at,
        id: lastActivity.id,
      };
    }

    res.status(200).json({
      activities,
      nextCursor,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getActivities,
};

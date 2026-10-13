const pool = require("../db/pool");

const requireListRole = (...allowedRoles) => {
  return async (req, res, next) => {
    try {
      const { listId } = req.params;
      const userId = req.user.id;

      const result = await pool.query(
        `
        SELECT
          b.workspace_id,
          wm.role
        FROM lists l
        JOIN boards b
          ON b.id = l.board_id
        JOIN workspace_members wm
          ON wm.workspace_id = b.workspace_id
        WHERE l.id = $1
          AND wm.user_id = $2
        `,
        [listId, userId]
      );

      if (result.rows.length === 0) {
        return res.status(403).json({
          message: "You do not have access to this list",
        });
      }

      const {
        workspace_id: workspaceId,
        role,
      } = result.rows[0];

      if (!allowedRoles.includes(role)) {
        return res.status(403).json({
          message: "You do not have permission for this action",
        });
      }

      req.workspaceId = workspaceId;
      req.workspaceRole = role;

      next();
    } catch (error) {
      next(error);
    }
  };
};

module.exports = {
  requireListRole,
};
const pool = require("../db/pool");

const requireWorkspaceRole = (...allowedRoles) => {
  return async (req, res, next) => {
    try {
      const workspaceId = req.params.workspaceId || req.params.id;
      const userId = req.user.id;

      const result = await pool.query(
        `
        SELECT role
        FROM workspace_members
        WHERE workspace_id = $1
          AND user_id = $2
        `,
        [workspaceId, userId]
      );

      if (result.rows.length === 0) {
        return res.status(403).json({
          message: "You are not a member of this workspace",
        });
      }

      const userRole = result.rows[0].role;

      if (!allowedRoles.includes(userRole)) {
        return res.status(403).json({
          message: "You do not have permission for this action",
        });
      }

      req.workspaceRole = userRole;

      next();
    } catch (error) {
      next(error);
    }
  };
};

module.exports = {
  requireWorkspaceRole,
};
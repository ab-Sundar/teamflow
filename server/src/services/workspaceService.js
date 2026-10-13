const pool = require("../db/pool");

const createWorkspace = async ({ name, userId }) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const workspaceResult = await client.query(
      `
      INSERT INTO workspaces (name, created_by)
      VALUES ($1, $2)
      RETURNING id, name, created_by, created_at, updated_at
      `,
      [name.trim(), userId]
    );

    const workspace = workspaceResult.rows[0];

    await client.query(
      `
      INSERT INTO workspace_members (workspace_id, user_id, role)
      VALUES ($1, $2, $3)
      `,
      [workspace.id, userId, "owner"]
    );

    await client.query("COMMIT");

    return workspace;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

//GET api/workspaces
const getUserWorkspaces = async (userId) => {
  const result = await pool.query(
    `
    SELECT
      w.id,
      w.name,
      w.created_by,
      w.created_at,
      w.updated_at,
      wm.role
    FROM workspaces w
    JOIN workspace_members wm
      ON wm.workspace_id = w.id
    WHERE wm.user_id = $1
    ORDER BY w.created_at DESC
    `,
    [userId]
  );

  return result.rows;
};

//GET api/workspaces/:id
const getWorkspaceById = async ({ workspaceId, userId }) => {
  const result = await pool.query(
    `
    SELECT
      w.id,
      w.name,
      w.created_by,
      w.created_at,
      w.updated_at,
      wm.role
    FROM workspaces w
    JOIN workspace_members wm
      ON wm.workspace_id = w.id
    WHERE w.id = $1
      AND wm.user_id = $2
    `,
    [workspaceId, userId]
  );

  if (result.rows.length === 0) {
    const error = new Error("Workspace not found");
    error.statusCode = 404;
    throw error;
  }

  return result.rows[0];
};

module.exports = {
  createWorkspace,
  getUserWorkspaces,
  getWorkspaceById
};
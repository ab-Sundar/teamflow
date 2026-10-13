const pool = require("../db/pool");

const getWorkspaceMembers = async (workspaceId) => {
  const result = await pool.query(
    `
    SELECT
      u.id,
      u.name,
      u.email,
      wm.role,
      wm.joined_at
    FROM workspace_members wm
    JOIN users u
      ON u.id = wm.user_id
    WHERE wm.workspace_id = $1
    ORDER BY wm.joined_at ASC
    `,
    [workspaceId]
  );

  return result.rows;
};

const addWorkspaceMember = async ({
  workspaceId,
  email,
  role,
}) => {
  const userResult = await pool.query(
    `
    SELECT id, name, email
    FROM users
    WHERE email = $1
    `,
    [email.trim().toLowerCase()]
  );

  if (userResult.rows.length === 0) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  const user = userResult.rows[0];

  const existingMember = await pool.query(
    `
    SELECT id
    FROM workspace_members
    WHERE workspace_id = $1
      AND user_id = $2
    `,
    [workspaceId, user.id]
  );

  if (existingMember.rows.length > 0) {
    const error = new Error("User is already a member");
    error.statusCode = 409;
    throw error;
  }

  const result = await pool.query(
    `
    INSERT INTO workspace_members
      (workspace_id, user_id, role)
    VALUES ($1, $2, $3)
    RETURNING id, workspace_id, user_id, role, joined_at
    `,
    [workspaceId, user.id, role]
  );

  return {
    ...result.rows[0],
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
    },
  };
};

const updateMemberRole = async ({
  workspaceId,
  targetUserId,
  newRole,
}) => {
  const validRoles = ["admin", "member", "viewer"];

  if (!validRoles.includes(newRole)) {
    const error = new Error("Invalid role");
    error.statusCode = 400;
    throw error;
  }

  const result = await pool.query(
    `
    SELECT
      wm.id,
      wm.role,
      u.id AS user_id,
      u.name,
      u.email
    FROM workspace_members wm
    JOIN users u
      ON u.id = wm.user_id
    WHERE wm.workspace_id = $1
      AND wm.user_id = $2
    `,
    [workspaceId, targetUserId]
  );

  if (result.rows.length === 0) {
    const error = new Error("Member not found");
    error.statusCode = 404;
    throw error;
  }

  const member = result.rows[0];

  if (member.role === "owner") {
    const error = new Error("Owner role cannot be changed");
    error.statusCode = 400;
    throw error;
  }

  const updated = await pool.query(
    `
    UPDATE workspace_members
    SET role = $1
    WHERE workspace_id = $2
      AND user_id = $3
    RETURNING id, workspace_id, user_id, role, joined_at
    `,
    [newRole, workspaceId, targetUserId]
  );

  return {
    ...updated.rows[0],
    user: {
      id: member.user_id,
      name: member.name,
      email: member.email,
    },
  };
};

const removeWorkspaceMember = async ({
  workspaceId,
  targetUserId,
}) => {
  const result = await pool.query(
    `
    SELECT role
    FROM workspace_members
    WHERE workspace_id = $1
      AND user_id = $2
    `,
    [workspaceId, targetUserId]
  );

  if (result.rows.length === 0) {
    const error = new Error("Member not found");
    error.statusCode = 404;
    throw error;
  }

  if (result.rows[0].role === "owner") {
    const error = new Error("Workspace owner cannot be removed");
    error.statusCode = 400;
    throw error;
  }

  await pool.query(
    `
    DELETE FROM workspace_members
    WHERE workspace_id = $1
      AND user_id = $2
    `,
    [workspaceId, targetUserId]
  );
};

removeWorkspaceMember
module.exports = {
  getWorkspaceMembers,
  addWorkspaceMember,
  updateMemberRole,
  removeWorkspaceMember
};
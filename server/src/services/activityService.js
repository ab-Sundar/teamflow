const pool = require("../db/pool");

const createActivity = async ({
  workspaceId,
  userId,
  action,
  entityType,
  entityId,
  metadata = null,
}) => {
  const result = await pool.query(
    `
    INSERT INTO activities (
      workspace_id,
      user_id,
      action,
      entity_type,
      entity_id,
      metadata
    )
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING
      id,
      workspace_id,
      user_id,
      action,
      entity_type,
      entity_id,
      metadata,
      created_at
    `,
    [workspaceId, userId, action, entityType, entityId, metadata],
  );

  return result.rows[0];
};

const getActivities = async ({
  workspaceId,
  limit = 20,
  cursorCreatedAt = null,
  cursorId = null,
}) => {
  let query;
  let values;

  if (cursorCreatedAt && cursorId) {
    query = `
      SELECT
        id,
        workspace_id,
        user_id,
        action,
        entity_type,
        entity_id,
        metadata,
        created_at
      FROM activities
      WHERE workspace_id = $1
        AND (created_at, id) < ($2, $3)
      ORDER BY created_at DESC, id DESC
      LIMIT $4;
    `;

    values = [
      workspaceId,
      cursorCreatedAt,
      cursorId,
      limit,
    ];
  } else {
    query = `
      SELECT
        id,
        workspace_id,
        user_id,
        action,
        entity_type,
        entity_id,
        metadata,
        created_at
      FROM activities
      WHERE workspace_id = $1
      ORDER BY created_at DESC, id DESC
      LIMIT $2;
    `;

    values = [
      workspaceId,
      limit,
    ];
  }

  const result = await pool.query(query, values);

  return result.rows;
};

module.exports = {
  createActivity,
  getActivities,
};

const pool = require("../db/pool");

const { getCache, setCache, deleteCache } = require("../utils/cache");

const createBoard = async ({ workspaceId, userId, name }) => {
  const result = await pool.query(
    `
    INSERT INTO boards (
      workspace_id,
      name,
      created_by
    )
    VALUES ($1, $2, $3)
    RETURNING
      id,
      workspace_id,
      name,
      created_by,
      created_at,
      updated_at
    `,
    [workspaceId, name, userId],
  );

  const board = result.rows[0];

  //Invalidate cached boards
  await deleteCache(`workspace:${workspaceId}:boards`);

  return board;
};

const getBoards = async (workspaceId) => {
  const cacheKey = `workspace:${workspaceId}:boards`;

  // 1. Check Redis
  const cachedBoards = await getCache(cacheKey);

  if (cachedBoards) {
    console.log("Redis cache HIT:", cacheKey);
    return cachedBoards;
  }

  console.log("Redis cache MISS:", cacheKey);

  // 2. Query PostgreSQL
  const result = await pool.query(
    `
    SELECT
      id,
      workspace_id,
      name,
      created_by,
      created_at,
      updated_at
    FROM boards
    WHERE workspace_id = $1
    ORDER BY created_at ASC
    `,
    [workspaceId],
  );

  const boards = result.rows;

  // 3. Store result in Redis
  await setCache(cacheKey, boards, 60);

  return boards;
};

const getBoard = async ({ workspaceId, boardId }) => {
  const result = await pool.query(
    `
    SELECT
      id,
      workspace_id,
      name,
      created_by,
      created_at,
      updated_at
    FROM boards
    WHERE id = $1
      AND workspace_id = $2
    `,
    [boardId, workspaceId],
  );

  return result.rows[0];
};

const updateBoard = async ({ workspaceId, boardId, name }) => {
  const result = await pool.query(
    `
    UPDATE boards
    SET
      name = $1,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $2
      AND workspace_id = $3
    RETURNING
      id,
      workspace_id,
      name,
      created_by,
      created_at,
      updated_at
    `,
    [name, boardId, workspaceId],
  );

  const board = result.rows[0];

  if (!board) {
    return null;
  }

  await deleteCache(`workspace:${workspaceId}:boards`);

  return board;
};

const deleteBoard = async ({ workspaceId, boardId }) => {
  const result = await pool.query(
    `
    DELETE FROM boards
    WHERE id = $1
      AND workspace_id = $2
    RETURNING id;
    `,
    [boardId, workspaceId],
  );

  const board = result.rows[0];

  if (!board) {
    return null;
  }

  await deleteCache(`workspace:${workspaceId}:boards`);

  return board;
};

module.exports = {
  createBoard,
  getBoards,
  getBoard,
  updateBoard,
  deleteBoard,
};

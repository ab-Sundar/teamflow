const pool = require("../db/pool");

const createList = async ({ boardId, name }) => {
  const result = await pool.query(
    `
    INSERT INTO lists (
      board_id,
      name,
      position
    )
    VALUES (
      $1,
      $2,
      COALESCE(
        (SELECT MAX(position) + 1 FROM lists WHERE board_id = $1),
        1
      )
    )
    RETURNING
      id,
      board_id,
      name,
      position,
      created_at,
      updated_at
    `,
    [boardId, name]
  );

  return result.rows[0];
};

const getLists = async (boardId) => {
  const result = await pool.query(
    `
    SELECT
      id,
      board_id,
      name,
      position,
      created_at,
      updated_at
    FROM lists
    WHERE board_id = $1
    ORDER BY position ASC, created_at ASC
    `,
    [boardId]
  );

  return result.rows;
};

const getList = async ({ boardId, listId }) => {
  const result = await pool.query(
    `
    SELECT
      id,
      board_id,
      name,
      position,
      created_at,
      updated_at
    FROM lists
    WHERE id = $1
      AND board_id = $2
    `,
    [listId, boardId]
  );

  return result.rows[0];
};

const updateList = async ({ boardId, listId, name }) => {
  const result = await pool.query(
    `
    UPDATE lists
    SET
      name = $1,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $2
      AND board_id = $3
    RETURNING
      id,
      board_id,
      name,
      position,
      created_at,
      updated_at
    `,
    [name, listId, boardId]
  );

  return result.rows[0];
};

const deleteList = async ({ boardId, listId }) => {
  const result = await pool.query(
    `
    DELETE FROM lists
    WHERE id = $1
      AND board_id = $2
    RETURNING id;
    `,
    [listId, boardId]
  );

  return result.rows[0];
};

module.exports = {
  createList,
  getLists,
  getList,
  updateList,
  deleteList,
};
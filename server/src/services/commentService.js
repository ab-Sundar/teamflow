const pool = require("../db/pool");

const createComment = async ({
  cardId,
  userId,
  content,
}) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // 1. Get card + workspace
    const cardResult = await client.query(
      `
      SELECT
        c.id,
        b.workspace_id
      FROM cards c
      JOIN lists l
        ON l.id = c.list_id
      JOIN boards b
        ON b.id = l.board_id
      WHERE c.id = $1
      `,
      [cardId]
    );

    if (cardResult.rows.length === 0) {
      throw new Error("Card not found");
    }

    const workspaceId = cardResult.rows[0].workspace_id;

    // 2. Create comment
    const commentResult = await client.query(
      `
      INSERT INTO comments (
        card_id,
        user_id,
        content
      )
      VALUES ($1, $2, $3)
      RETURNING
        id,
        card_id,
        user_id,
        content,
        created_at,
        updated_at
      `,
      [cardId, userId, content]
    );

    const comment = commentResult.rows[0];

    // 3. Create activity
    await client.query(
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
      `,
      [
        workspaceId,
        userId,
        "comment.created",
        "comment",
        comment.id,
        JSON.stringify({
          cardId,
          content: comment.content,
        }),
      ]
    );

    // 4. Commit
    await client.query("COMMIT");

    return comment;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

const getComments = async (cardId) => {
  const result = await pool.query(
    `
    SELECT
      id,
      card_id,
      user_id,
      content,
      created_at,
      updated_at
    FROM comments
    WHERE card_id = $1
    ORDER BY created_at ASC
    `,
    [cardId]
  );

  return result.rows;
};

const deleteComment = async ({
  cardId,
  commentId,
  userId,
}) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // 1. Get comment + workspace before deleting
    const commentResult = await client.query(
      `
      SELECT
        c.id,
        c.user_id,
        c.content,
        b.workspace_id
      FROM comments c
      JOIN cards ca
        ON ca.id = c.card_id
      JOIN lists l
        ON l.id = ca.list_id
      JOIN boards b
        ON b.id = l.board_id
      WHERE c.id = $1
        AND c.card_id = $2
      FOR UPDATE
      `,
      [commentId, cardId]
    );

    if (commentResult.rows.length === 0) {
      throw new Error("Comment not found");
    }

    const comment = commentResult.rows[0];

    // 2. Only the comment owner can delete it
    if (String(comment.user_id) !== String(userId)) {
      throw new Error("You can only delete your own comments");
    }

    // 3. Delete comment
    await client.query(
      `
      DELETE FROM comments
      WHERE id = $1
        AND card_id = $2
        AND user_id = $3
      `,
      [commentId, cardId, userId]
    );

    // 4. Create activity
    await client.query(
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
      `,
      [
        comment.workspace_id,
        userId,
        "comment.deleted",
        "comment",
        commentId,
        JSON.stringify({
          cardId,
          content: comment.content,
        }),
      ]
    );

    // 5. Commit
    await client.query("COMMIT");

    return {
      id: commentId,
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

module.exports = {
  createComment,
  getComments,
  deleteComment,
};
const pool = require("../db/pool");

const createCard = async ({ listId, userId, title, description }) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // 1. Get the card's workspace
    const listResult = await client.query(
      `
      SELECT
        l.id,
        b.workspace_id
      FROM lists l
      JOIN boards b
        ON b.id = l.board_id
      WHERE l.id = $1
      `,
      [listId],
    );

    if (listResult.rows.length === 0) {
      throw new Error("List not found");
    }

    const { workspace_id: workspaceId } = listResult.rows[0];

    // 2. Create the card
    const cardResult = await client.query(
      `
      INSERT INTO cards (
        list_id,
        title,
        description,
        position,
        created_by
      )
      VALUES (
        $1,
        $2,
        $3,
        COALESCE(
          (
            SELECT MAX(position) + 1
            FROM cards
            WHERE list_id = $1
          ),
          1
        ),
        $4
      )
      RETURNING
        id,
        list_id,
        title,
        description,
        position,
        assigned_to,
        created_by,
        due_date,
        created_at,
        updated_at
      `,
      [listId, title, description, userId],
    );

    const card = cardResult.rows[0];

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
        "card.created",
        "card",
        card.id,
        JSON.stringify({
          title: card.title,
          listId: card.list_id,
        }),
      ],
    );

    await client.query("COMMIT");

    return card;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

const getCards = async (listId) => {
  const result = await pool.query(
    `
    SELECT
      c.id,
      c.list_id,
      c.title,
      c.description,
      c.position,
      c.assigned_to,
      c.created_by,
      c.due_date,
      c.created_at,
      c.updated_at,

      u.id AS assignee_id,
      u.name AS assignee_name

    FROM cards c

    LEFT JOIN users u
      ON u.id = c.assigned_to

    WHERE c.list_id = $1

    ORDER BY c.position ASC;
    `,
    [listId],
  );

  return result.rows;
};

const getCard = async ({ listId, cardId }) => {
  const result = await pool.query(
    `
    SELECT
      id,
      list_id,
      title,
      description,
      position,
      created_by,
      created_at,
      updated_at
    FROM cards
    WHERE id = $1
      AND list_id = $2
    `,
    [cardId, listId],
  );

  return result.rows[0];
};

const updateCard = async ({ listId, cardId, title, description, userId }) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // 1. Get current card + workspace
    const cardResult = await client.query(
      `
      SELECT
        c.id,
        c.title,
        c.description,
        b.workspace_id
      FROM cards c
      JOIN lists l
        ON l.id = c.list_id
      JOIN boards b
        ON b.id = l.board_id
      WHERE c.id = $1
        AND c.list_id = $2
      FOR UPDATE
      `,
      [cardId, listId],
    );

    if (cardResult.rows.length === 0) {
      throw new Error("Card not found");
    }

    const oldCard = cardResult.rows[0];

    // 2. Update card
    const updateResult = await client.query(
      `
      UPDATE cards
      SET
        title = $1,
        description = $2,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
        AND list_id = $4
      RETURNING
        id,
        list_id,
        title,
        description,
        position,
        assigned_to,
        created_by,
        due_date,
        created_at,
        updated_at
      `,
      [title, description, cardId, listId],
    );

    const updatedCard = updateResult.rows[0];

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
        oldCard.workspace_id,
        userId,
        "card.updated",
        "card",
        cardId,
        JSON.stringify({
          oldTitle: oldCard.title,
          newTitle: updatedCard.title,
          oldDescription: oldCard.description,
          newDescription: updatedCard.description,
        }),
      ],
    );

    // 4. Commit
    await client.query("COMMIT");

    return updatedCard;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

const deleteCard = async ({ listId, cardId, userId }) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // 1. Get the card information before deleting it
    const cardResult = await client.query(
      `
      SELECT
        c.id,
        c.title,
        c.list_id,
        c.position,
        b.workspace_id
      FROM cards c
      JOIN lists l
        ON l.id = c.list_id
      JOIN boards b
        ON b.id = l.board_id
      WHERE c.id = $1
        AND c.list_id = $2
      FOR UPDATE
      `,
      [cardId, listId],
    );

    if (cardResult.rows.length === 0) {
      throw new Error("Card not found");
    }

    const card = cardResult.rows[0];

    // 2. Delete the card
    await client.query(
      `
      DELETE FROM cards
      WHERE id = $1
        AND list_id = $2
      `,
      [cardId, listId],
    );

    // 3. Close the position gap
    await client.query(
      `
      UPDATE cards
      SET position = position - 1
      WHERE list_id = $1
        AND position > $2
      `,
      [listId, card.position],
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
        card.workspace_id,
        userId,
        "card.deleted",
        "card",
        cardId,
        JSON.stringify({
          title: card.title,
          listId: card.list_id,
          position: card.position,
        }),
      ],
    );

    // 5. Commit everything
    await client.query("COMMIT");

    return { id: cardId };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};
// Move cards
const moveCard = async ({
  cardId,
  sourceListId,
  targetListId,
  position,
  userId,
}) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    /*
      1. Lock the card being moved and get workspace.
    */
    const cardResult = await client.query(
      `
      SELECT
        c.id,
        c.list_id,
        c.position,
        b.workspace_id
      FROM cards c
      JOIN lists l
        ON l.id = c.list_id
      JOIN boards b
        ON b.id = l.board_id
      WHERE c.id = $1
        AND c.list_id = $2
      FOR UPDATE
      `,
      [cardId, sourceListId],
    );

    if (cardResult.rows.length === 0) {
      throw new Error("Card not found");
    }

    const originalCard = cardResult.rows[0];

    const workspaceId = originalCard.workspace_id;

    const oldPosition = Number(originalCard.position);

    /*
      2. Validate target list exists
         and belongs to same workspace.
    */
    const targetListResult = await client.query(
      `
        SELECT
          l.id,
          b.workspace_id
        FROM lists l
        JOIN boards b
          ON b.id = l.board_id
        WHERE l.id = $1
        FOR UPDATE
        `,
      [targetListId],
    );

    if (targetListResult.rows.length === 0) {
      throw new Error("Target list not found");
    }

    if (String(targetListResult.rows[0].workspace_id) !== String(workspaceId)) {
      throw new Error("Cannot move card to another workspace");
    }

    /*
      3. Fetch cards from the source list
         in their CURRENT persisted order.
    */
    const sourceCardsResult = await client.query(
      `
        SELECT id
        FROM cards
        WHERE list_id = $1
        ORDER BY position ASC, id ASC
        FOR UPDATE
        `,
      [sourceListId],
    );

    let sourceCardIds = sourceCardsResult.rows.map((row) => Number(row.id));

    /*
      Remove the card being dragged.
    */
    sourceCardIds = sourceCardIds.filter((id) => id !== Number(cardId));

    let targetCardIds;

    /*
      SAME LIST
    */
    if (String(sourceListId) === String(targetListId)) {
      targetCardIds = sourceCardIds;
    } else {
      /*
        DIFFERENT LIST

        Fetch destination list order.
      */
      const targetCardsResult = await client.query(
        `
          SELECT id
          FROM cards
          WHERE list_id = $1
          ORDER BY position ASC, id ASC
          FOR UPDATE
          `,
        [targetListId],
      );

      targetCardIds = targetCardsResult.rows
        .map((row) => Number(row.id))
        .filter((id) => id !== Number(cardId));
    }

    /*
      Backend position is 1-based.

      Convert it into safe array index.
    */
    const requestedPosition = Number(position);

    const safePosition = Number.isFinite(requestedPosition)
      ? Math.max(1, Math.min(requestedPosition, targetCardIds.length + 1))
      : targetCardIds.length + 1;

    const targetIndex = safePosition - 1;

    /*
      Insert the card into its
      final destination position.
    */
    targetCardIds.splice(targetIndex, 0, Number(cardId));

    /*
      4. If lists are different,
         normalize source positions.

         Example:

         Before:
           A = 1
           B = 2
           C = 3

         Move B away:

         Source becomes:
           A = 1
           C = 2
    */
    if (String(sourceListId) !== String(targetListId)) {
      for (let index = 0; index < sourceCardIds.length; index++) {
        await client.query(
          `
          UPDATE cards
          SET position = $1
          WHERE id = $2
            AND list_id = $3
          `,
          [index + 1, sourceCardIds[index], sourceListId],
        );
      }
    }

    /*
      5. Put the moved card into
         destination list first.

         Temporary position 0 avoids
         conflicts while normalizing.
    */
    await client.query(
      `
      UPDATE cards
      SET
        list_id = $1,
        position = 0,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      `,
      [targetListId, cardId],
    );

    /*
      6. Normalize destination positions
         from 1..N.

         This guarantees:
         - no duplicate positions
         - no gaps
         - exact drag order
    */
    for (let index = 0; index < targetCardIds.length; index++) {
      await client.query(
        `
        UPDATE cards
        SET
          position = $1,
          updated_at =
            CASE
              WHEN id = $2
              THEN CURRENT_TIMESTAMP
              ELSE updated_at
            END
        WHERE id = $2
          AND list_id = $3
        `,
        [index + 1, targetCardIds[index], targetListId],
      );
    }

    /*
      7. Return the moved card.
    */
    const updatedCardResult = await client.query(
      `
        SELECT
          id,
          list_id,
          title,
          description,
          position,
          assigned_to,
          created_by,
          due_date,
          created_at,
          updated_at
        FROM cards
        WHERE id = $1
        `,
      [cardId],
    );

    const updatedCard = updatedCardResult.rows[0];

    /*
      8. Activity log.
    */
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
      VALUES (
        $1,
        $2,
        $3,
        $4,
        $5,
        $6
      )
      `,
      [
        workspaceId,
        userId,
        "card.moved",
        "card",
        cardId,
        JSON.stringify({
          fromListId: Number(sourceListId),

          toListId: Number(targetListId),

          fromPosition: oldPosition,

          toPosition: safePosition,
        }),
      ],
    );

    await client.query("COMMIT");

    return updatedCard;
  } catch (error) {
    await client.query("ROLLBACK");

    throw error;
  } finally {
    client.release();
  }
};
// assign cards to member
const assignCard = async ({ listId, cardId, userId, assignedTo }) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // 1. Get card + workspace
    const cardResult = await client.query(
      `
      SELECT
        c.id,
        c.assigned_to,
        b.workspace_id
      FROM cards c
      JOIN lists l
        ON l.id = c.list_id
      JOIN boards b
        ON b.id = l.board_id
      WHERE c.id = $1
        AND c.list_id = $2
      FOR UPDATE
      `,
      [cardId, listId],
    );

    if (cardResult.rows.length === 0) {
      throw new Error("Card not found");
    }

    const card = cardResult.rows[0];

    const oldAssignee = card.assigned_to;
    const workspaceId = card.workspace_id;

    // 2. Validate new assignee
    if (assignedTo !== null) {
      const memberResult = await client.query(
        `
        SELECT user_id
        FROM workspace_members
        WHERE workspace_id = $1
          AND user_id = $2
        `,
        [workspaceId, assignedTo],
      );

      if (memberResult.rows.length === 0) {
        throw new Error("User is not a member of this workspace");
      }
    }

    // 3. Update assignment
    const updateResult = await client.query(
      `
      UPDATE cards
      SET
        assigned_to = $1,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
        AND list_id = $3
      RETURNING
        id,
        list_id,
        title,
        description,
        position,
        assigned_to,
        created_by,
        due_date,
        created_at,
        updated_at
      `,
      [assignedTo, cardId, listId],
    );

    const updatedCard = updateResult.rows[0];

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
        workspaceId,
        userId,
        "card.assigned",
        "card",
        cardId,
        JSON.stringify({
          fromUserId: oldAssignee,
          toUserId: assignedTo,
        }),
      ],
    );

    // 5. Commit
    await client.query("COMMIT");

    return updatedCard;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};
// add due date
const updateDueDate = async ({ listId, cardId, dueDate, userId }) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // 1. Get current due date + workspace
    const cardResult = await client.query(
      `
      SELECT
        c.id,
        c.due_date,
        b.workspace_id
      FROM cards c
      JOIN lists l
        ON l.id = c.list_id
      JOIN boards b
        ON b.id = l.board_id
      WHERE c.id = $1
        AND c.list_id = $2
      FOR UPDATE
      `,
      [cardId, listId],
    );

    if (cardResult.rows.length === 0) {
      throw new Error("Card not found");
    }

    const card = cardResult.rows[0];

    // 2. Update due date
    const updateResult = await client.query(
      `
      UPDATE cards
      SET
        due_date = $1,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
        AND list_id = $3
      RETURNING
        id,
        list_id,
        title,
        description,
        position,
        assigned_to,
        created_by,
        due_date,
        created_at,
        updated_at
      `,
      [dueDate, cardId, listId],
    );

    const updatedCard = updateResult.rows[0];

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
        card.workspace_id,
        userId,
        "card.due_date_changed",
        "card",
        cardId,
        JSON.stringify({
          fromDueDate: card.due_date,
          toDueDate: dueDate,
        }),
      ],
    );

    // 4. Commit
    await client.query("COMMIT");

    return updatedCard;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
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

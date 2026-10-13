import {
    memo,
    useCallback,
    useState,
} from "react";

import {
    useDroppable,
} from "@dnd-kit/react";

import {
    CollisionPriority,
} from "@dnd-kit/abstract";

import CardItem from "./CardItem";

const ListColumn = ({
    list,
    cards,
    members,
    canManageLists,
    canManageCards,
    onCreateCard,
    onUpdateList,
    onDeleteList,
    onCardUpdated,
    onCardDeleted,
}) => {
    /*
      IMPORTANT:
  
      This ID must match the sortable
      card group exactly.
  
      Card group:
        list-5
  
      Droppable list ID:
        list-5
  
      That is what allows empty lists
      to become valid destination groups.
    */
    const listKey =
        `list-${list.id}`;

    const {
        ref: dropRef,
        isDropTarget,
    } = useDroppable({
        id: listKey,

        accept: "card",

        data: {
            listId: list.id,
        },

        /*
          Sortable cards have higher
          collision priority.
    
          The whole list acts as the
          fallback target, particularly
          when the list is empty.
        */
        collisionPriority:
            CollisionPriority.Low,
    });

    const [
        title,
        setTitle,
    ] = useState("");

    const [
        description,
        setDescription,
    ] = useState("");

    const [
        creating,
        setCreating,
    ] = useState(false);

    const [
        error,
        setError,
    ] = useState("");

    const [
        editingList,
        setEditingList,
    ] = useState(false);

    const [
        listName,
        setListName,
    ] = useState(
        list.name
    );

    const [
        savingList,
        setSavingList,
    ] = useState(false);

    const [
        deletingList,
        setDeletingList,
    ] = useState(false);

    const handleCreateCard =
        async (event) => {
            event.preventDefault();

            const trimmedTitle =
                title.trim();

            const trimmedDescription =
                description.trim();

            if (!trimmedTitle) {
                return;
            }

            try {
                setError("");
                setCreating(true);

                await onCreateCard(
                    list.id,
                    {
                        title:
                            trimmedTitle,

                        description:
                            trimmedDescription,
                    }
                );

                setTitle("");
                setDescription("");
            } catch (error) {
                setError(
                    error.response?.data
                        ?.message ||
                    "Failed to create card."
                );
            } finally {
                setCreating(false);
            }
        };
    const handleCardUpdated =
        useCallback(
            (updatedCard) => {
                onCardUpdated(
                    list.id,
                    updatedCard
                );
            },
            [
                list.id,
                onCardUpdated,
            ]
        );

    const handleCardDeleted =
        useCallback(
            (cardId) => {
                onCardDeleted(
                    list.id,
                    cardId
                );
            },
            [
                list.id,
                onCardDeleted,
            ]
        );
    const handleRenameList =
        async (event) => {
            event.preventDefault();

            const trimmedName =
                listName.trim();

            if (!trimmedName) {
                return;
            }

            try {
                setSavingList(true);
                setError("");

                await onUpdateList(
                    list,
                    trimmedName
                );

                setEditingList(false);
            } catch {
                // BoardPage already sets
                // the displayed error.
            } finally {
                setSavingList(false);
            }
        };

    const handleCancelListEdit =
        () => {
            setListName(
                list.name
            );

            setEditingList(false);
        };

    const handleDeleteListClick =
        async () => {
            try {
                setDeletingList(true);

                await onDeleteList(
                    list
                );
            } catch {
                setDeletingList(false);
            }
        };

    return (
        <div
            ref={dropRef}
            className={
                isDropTarget
                    ? "list-column list-column--drop-target"
                    : "list-column"
            }
        >
            <div className="list-column__header">
                <div className="list-column__title-area">
                    {editingList ? (
                        <form
                            className="list-title-edit"
                            onSubmit={
                                handleRenameList
                            }
                        >
                            <input
                                type="text"
                                value={
                                    listName
                                }
                                onChange={(event) =>
                                    setListName(
                                        event.target.value
                                    )
                                }
                                autoFocus
                            />

                            <div className="list-title-edit__actions">
                                <button
                                    type="submit"
                                    className="button button--small"
                                    disabled={
                                        savingList
                                    }
                                >
                                    {savingList
                                        ? "Saving..."
                                        : "Save"}
                                </button>

                                <button
                                    type="button"
                                    className="button button--secondary button--small"
                                    onClick={
                                        handleCancelListEdit
                                    }
                                    disabled={
                                        savingList
                                    }
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    ) : (
                        <>
                            <h3>
                                {list.name}
                            </h3>

                            <span className="list-card-count">
                                {cards.length}{" "}
                                {cards.length === 1
                                    ? "card"
                                    : "cards"}
                            </span>
                        </>
                    )}
                </div>

                {canManageLists &&
                    !editingList && (
                        <div className="list-column__actions">
                            <button
                                type="button"
                                className="list-action-button"
                                title="Rename list"
                                onClick={() => {
                                    setListName(
                                        list.name
                                    );

                                    setEditingList(
                                        true
                                    );
                                }}
                            >
                                Edit
                            </button>

                            <button
                                type="button"
                                className="list-action-button list-action-button--danger"
                                title="Delete list"
                                disabled={
                                    deletingList
                                }
                                onClick={
                                    handleDeleteListClick
                                }
                            >
                                {deletingList
                                    ? "..."
                                    : "Delete"}
                            </button>
                        </div>
                    )}
            </div>

            {error && (
                <div className="error-message">
                    {error}
                </div>
            )}

            <div className="list-card-stack">
                {cards.length === 0 && (
                    <div className="list-empty-state">
                        <span>
                            Drop cards here
                        </span>
                    </div>
                )}

                {cards.map(
                    (
                        card,
                        index
                    ) => (
                        <CardItem
                            key={card.id}
                            card={card}
                            index={index}
                            listId={
                                list.id
                            }
                            members={
                                members
                            }
                            canManageCards={
                                canManageCards
                            }
                            onCardUpdated={
                                handleCardUpdated
                            }
                            onCardDeleted={
                                handleCardDeleted
                            }
                        />
                    )
                )}
            </div>

            {canManageCards && (
                <form
                    className="card-create-form"
                    onSubmit={
                        handleCreateCard
                    }
                >
                    <input
                        type="text"
                        placeholder="Card title"
                        value={title}
                        onChange={(
                            event
                        ) =>
                            setTitle(
                                event.target
                                    .value
                            )
                        }
                    />

                    <textarea
                        placeholder="Description (optional)"
                        value={
                            description
                        }
                        onChange={(
                            event
                        ) =>
                            setDescription(
                                event.target
                                    .value
                            )
                        }
                    />

                    <button
                        type="submit"
                        disabled={
                            creating
                        }
                    >
                        {creating
                            ? "Adding..."
                            : "+ Add Card"}
                    </button>
                </form>
            )}
        </div>
    );
};

export default memo(ListColumn);
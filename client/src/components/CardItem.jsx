import {
    memo,
    useState,
} from "react";

import {
    useSortable,
} from "@dnd-kit/react/sortable";

import {
    assignCard,
    deleteCard,
    updateCard,
    updateCardDueDate,
} from "../services/cardApi";

import CardDetails from "./CardDetails";

const CardItem = ({
    card,
    index,
    listId,
    members,
    canManageCards,
    onCardUpdated,
    onCardDeleted,
}) => {
    const [
        isEditing,
        setIsEditing,
    ] = useState(false);

    const [
        title,
        setTitle,
    ] = useState(
        card.title
    );

    const [
        description,
        setDescription,
    ] = useState(
        card.description || ""
    );

    const [
        showDetails,
        setShowDetails,
    ] = useState(false);

    const [
        saving,
        setSaving,
    ] = useState(false);

    const [
        deleting,
        setDeleting,
    ] = useState(false);

    const [
        assigning,
        setAssigning,
    ] = useState(false);

    const [
        updatingDueDate,
        setUpdatingDueDate,
    ] = useState(false);

    const [
        error,
        setError,
    ] = useState("");

    /*
      IMPORTANT DND CONFIGURATION
  
      id:
        Must match card.id because the
        dnd-kit move helper matches
        objects using item.id.
  
      group:
        Must match ListColumn's
        droppable ID:
  
        list-5
    */
    const sortable =
        useSortable({
            id: card.id,

            index,

            group:
                `list-${listId}`,

            type: "card",

            accept: "card",

            disabled:
                !canManageCards ||
                isEditing,

            data: {
                cardId:
                    card.id,

                listId,
            },
        });

    /*
      EDIT CARD
    */
    const handleUpdate =
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
                setSaving(true);
                setError("");

                const data =
                    await updateCard(
                        listId,
                        card.id,
                        {
                            title:
                                trimmedTitle,

                            description:
                                trimmedDescription,
                        }
                    );

                onCardUpdated(
                    data.card
                );

                setIsEditing(false);
            } catch (error) {
                setError(
                    error.response?.data
                        ?.message ||
                    "Failed to update card."
                );
            } finally {
                setSaving(false);
            }
        };

    /*
      ASSIGNEE
    */
    const handleAssigneeChange =
        async (event) => {
            const value =
                event.target.value;

            const userId =
                value === ""
                    ? null
                    : Number(value);

            try {
                setAssigning(true);
                setError("");

                await assignCard(
                    listId,
                    card.id,
                    userId
                );

                const selectedMember =
                    members.find(
                        (member) =>
                            Number(
                                member.id
                            ) === userId
                    );

                onCardUpdated({
                    ...card,

                    assigned_to:
                        userId,

                    assignee_id:
                        userId,

                    assignee_name:
                        selectedMember
                            ? selectedMember.name
                            : null,
                });
            } catch (error) {
                setError(
                    error.response?.data
                        ?.message ||
                    "Failed to update assignee."
                );
            } finally {
                setAssigning(false);
            }
        };

    /*
      DELETE
    */
    const handleDelete =
        async () => {
            const confirmed =
                window.confirm(
                    `Delete "${card.title}"?`
                );

            if (!confirmed) {
                return;
            }

            try {
                setDeleting(true);
                setError("");

                await deleteCard(
                    listId,
                    card.id
                );

                onCardDeleted(
                    card.id
                );
            } catch (error) {
                setError(
                    error.response?.data
                        ?.message ||
                    "Failed to delete card."
                );

                setDeleting(false);
            }
        };

    /*
      DUE DATE
    */
    const handleDueDateChange =
        async (event) => {
            const value =
                event.target.value;

            const dueDate =
                value || null;

            try {
                setUpdatingDueDate(
                    true
                );

                setError("");

                const data =
                    await updateCardDueDate(
                        listId,
                        card.id,
                        dueDate
                    );

                onCardUpdated({
                    ...card,
                    ...data.card,

                    due_date:
                        dueDate,
                });
            } catch (error) {
                setError(
                    error.response?.data
                        ?.message ||
                    "Failed to update due date."
                );
            } finally {
                setUpdatingDueDate(
                    false
                );
            }
        };

    /*
      CANCEL EDIT
    */
    const handleCancel = () => {
        setTitle(
            card.title
        );

        setDescription(
            card.description || ""
        );

        setError("");

        setIsEditing(false);
    };

    /*
      EDIT MODE
    */
    if (isEditing) {
        return (
            <div className="task-card task-card--editing">
                <form
                    className="card-edit-form"
                    onSubmit={
                        handleUpdate
                    }
                >
                    <input
                        type="text"
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
                        value={
                            description
                        }
                        placeholder="Description"
                        onChange={(
                            event
                        ) =>
                            setDescription(
                                event.target
                                    .value
                            )
                        }
                    />

                    {error && (
                        <div className="error-message">
                            {error}
                        </div>
                    )}

                    <div className="card-edit-actions">
                        <button
                            type="submit"
                            disabled={
                                saving
                            }
                        >
                            {saving
                                ? "Saving..."
                                : "Save"}
                        </button>

                        <button
                            type="button"
                            className="button button--secondary"
                            onClick={
                                handleCancel
                            }
                            disabled={
                                saving
                            }
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        );
    }

    return (
        <article
            ref={
                sortable.ref
            }
            className={[
                "task-card",
                sortable.isDragging
                    ? "task-card--dragging"
                    : "",
                sortable.isDropTarget
                    ? "task-card--drop-target"
                    : "",
            ]
                .filter(Boolean)
                .join(" ")}
        >
            <div className="task-card__top">
                <h4>
                    {card.title}
                </h4>

                {canManageCards && (
                    <button
                        type="button"
                        ref={
                            sortable.handleRef
                        }
                        className="drag-handle"
                        aria-label={
                            `Drag ${card.title}`
                        }
                        title="Drag card"
                    >
                        ⋮⋮
                    </button>
                )}
            </div>

            {card.description && (
                <p className="task-card__description">
                    {card.description}
                </p>
            )}

            <div className="task-card__meta">
                {card.assignee_name && (
                    <div className="card-meta-chip">
                        <span className="card-meta-chip__avatar">
                            {card.assignee_name
                                ?.trim()
                                ?.charAt(0)
                                ?.toUpperCase() ||
                                "U"}
                        </span>

                        <span>
                            {card.assignee_name}
                        </span>
                    </div>
                )}

                {card.due_date && (
                    <div className="card-meta-chip card-meta-chip--date">
                        <span>
                            ◷
                        </span>

                        <span>
                            {card.due_date
                                .split("T")[0]}
                        </span>
                    </div>
                )}
            </div>

            {error && (
                <div className="error-message">
                    {error}
                </div>
            )}

            <button
                type="button"
                className="card-details-button"
                onClick={() =>
                    setShowDetails(
                        true
                    )
                }
            >
                Open Details
            </button>

            {canManageCards && (
                <div className="task-card__controls">
                    <div className="card-control-group">
                        <label>
                            Assignee
                        </label>

                        <select
                            value={
                                card.assigned_to ||
                                ""
                            }
                            onChange={
                                handleAssigneeChange
                            }
                            disabled={
                                assigning
                            }
                        >
                            <option value="">
                                Unassigned
                            </option>

                            {members.map(
                                (member) => (
                                    <option
                                        key={
                                            member.id
                                        }
                                        value={
                                            member.id
                                        }
                                    >
                                        {
                                            member.name
                                        }{" "}
                                        (
                                        {
                                            member.role
                                        }
                                        )
                                    </option>
                                )
                            )}
                        </select>
                    </div>

                    <div className="card-control-group">
                        <label>
                            Due date
                        </label>

                        <input
                            type="date"
                            value={
                                card.due_date
                                    ? card.due_date
                                        .split(
                                            "T"
                                        )[0]
                                    : ""
                            }
                            onChange={
                                handleDueDateChange
                            }
                            disabled={
                                updatingDueDate
                            }
                        />
                    </div>

                    <div className="task-card__actions">
                        <button
                            type="button"
                            className="button button--secondary button--small"
                            onClick={() =>
                                setIsEditing(
                                    true
                                )
                            }
                        >
                            Edit
                        </button>

                        <button
                            type="button"
                            className="button button--danger button--small"
                            onClick={
                                handleDelete
                            }
                            disabled={
                                deleting
                            }
                        >
                            {deleting
                                ? "Deleting..."
                                : "Delete"}
                        </button>
                    </div>
                </div>
            )}

            {showDetails && (
                <CardDetails
                    card={card}
                    listId={
                        listId
                    }
                    members={
                        members
                    }
                    canManageCards={
                        canManageCards
                    }
                    onClose={() =>
                        setShowDetails(
                            false
                        )
                    }
                />
            )}
        </article>
    );
};

export default memo(CardItem);
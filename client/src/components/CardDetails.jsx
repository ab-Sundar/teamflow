import { useEffect, useState } from "react";

import { useAuth } from "../context/AuthContext";

import {
    createComment,
    deleteComment,
    getComments,
} from "../services/commentApi";

import {
    getSocket,
} from "../services/socket";

const CardDetails = ({
    card,
    listId,
    members,
    canManageCards,
    onClose,
}) => {
    const { user } = useAuth();

    const [comments, setComments] = useState([]);
    const [content, setContent] = useState("");

    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);

    const [error, setError] = useState("");

    useEffect(() => {
        const fetchComments = async () => {
            try {
                setError("");

                const data =
                    await getComments(
                        listId,
                        card.id
                    );

                setComments(
                    data.comments
                );
            } catch (error) {
                setError(
                    error.response?.data
                        ?.message ||
                    "Failed to load comments."
                );
            } finally {
                setLoading(false);
            }
        };

        const socket =
            getSocket();

        const handleCommentCreated =
            async ({
                comment,
            }) => {
                if (
                    Number(
                        comment?.card_id
                    ) !==
                    Number(card.id)
                ) {
                    return;
                }

                try {
                    const data =
                        await getComments(
                            listId,
                            card.id
                        );

                    setComments(
                        data.comments
                    );
                } catch (error) {
                    console.error(
                        "Failed to sync created comment:",
                        error
                    );
                }
            };

        const handleCommentDeleted =
            async ({
                cardId,
            }) => {
                if (
                    Number(cardId) !==
                    Number(card.id)
                ) {
                    return;
                }

                try {
                    const data =
                        await getComments(
                            listId,
                            card.id
                        );

                    setComments(
                        data.comments
                    );
                } catch (error) {
                    console.error(
                        "Failed to sync deleted comment:",
                        error
                    );
                }
            };

        fetchComments();

        socket.on(
            "comment:created",
            handleCommentCreated
        );

        socket.on(
            "comment:deleted",
            handleCommentDeleted
        );

        return () => {
            socket.off(
                "comment:created",
                handleCommentCreated
            );

            socket.off(
                "comment:deleted",
                handleCommentDeleted
            );
        };
    }, [
        listId,
        card.id,
    ]);

    const handleCreateComment = async (event) => {
        event.preventDefault();

        const trimmedContent = content.trim();

        if (!trimmedContent) {
            return;
        }

        try {
            setCreating(true);
            setError("");

            const data = await createComment(
                listId,
                card.id,
                trimmedContent
            );

            setComments((previousComments) => [
                ...previousComments,
                data.comment,
            ]);

            setContent("");
        } catch (error) {
            setError(
                error.response?.data?.message ||
                "Failed to create comment."
            );
        } finally {
            setCreating(false);
        }
    };

    const handleDeleteComment = async (commentId) => {
        try {
            setError("");

            await deleteComment(
                listId,
                card.id,
                commentId
            );

            setComments((previousComments) =>
                previousComments.filter(
                    (comment) =>
                        comment.id !== commentId
                )
            );
        } catch (error) {
            setError(
                error.response?.data?.message ||
                "Failed to delete comment."
            );
        }
    };

    const getMemberName = (userId) => {
        const member = members.find(
            (member) =>
                String(member.id) === String(userId)
        );

        return member
            ? member.name
            : "Unknown user";
    };

    return (
        <div
            className="modal-overlay"
            onClick={onClose}
        >
            <div
                className="card-details-modal"
                onClick={(event) =>
                    event.stopPropagation()
                }
            >
                <div className="card-details-header">
                    <div>
                        <span className="eyebrow">
                            Card details
                        </span>

                        <h2>
                            {card.title}
                        </h2>
                    </div>

                    <button
                        type="button"
                        className="modal-close"
                        onClick={onClose}
                        aria-label="Close card details"
                    >
                        ×
                    </button>
                </div>

                <div className="card-details-body">
                    <section className="card-details-section">
                        <h3>
                            Overview
                        </h3>

                        {card.description ? (
                            <p className="card-details-description">
                                {card.description}
                            </p>
                        ) : (
                            <p className="card-details-muted">
                                No description added.
                            </p>
                        )}

                        <div className="card-info-grid">
                            <div className="card-info-item">
                                <span className="card-info-label">
                                    Assignee
                                </span>

                                <div className="card-info-value">
                                    {card.assignee_name ? (
                                        <>
                                            <span className="card-info-avatar">
                                                {card.assignee_name
                                                    ?.trim()
                                                    ?.charAt(0)
                                                    ?.toUpperCase() ||
                                                    "U"}
                                            </span>

                                            <span>
                                                {card.assignee_name}
                                            </span>
                                        </>
                                    ) : (
                                        <span className="card-details-muted">
                                            Unassigned
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="card-info-item">
                                <span className="card-info-label">
                                    Due date
                                </span>

                                <div className="card-info-value">
                                    {card.due_date ? (
                                        <span className="due-date-badge">
                                            {card.due_date
                                                .split("T")[0]}
                                        </span>
                                    ) : (
                                        <span className="card-details-muted">
                                            No due date
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="card-details-section">
                        <div className="comments-header">
                            <div>
                                <h3>
                                    Comments
                                </h3>

                                <p>
                                    {comments.length}{" "}
                                    {comments.length === 1
                                        ? "comment"
                                        : "comments"}
                                </p>
                            </div>
                        </div>

                        {error && (
                            <div className="error-message">
                                {error}
                            </div>
                        )}

                        {loading && (
                            <div className="comments-loading">
                                Loading comments...
                            </div>
                        )}

                        {!loading &&
                            comments.length === 0 && (
                                <div className="comments-empty">
                                    <div className="comments-empty__icon">
                                        💬
                                    </div>

                                    <h4>
                                        No comments yet
                                    </h4>

                                    <p>
                                        Start the conversation on
                                        this card.
                                    </p>
                                </div>
                            )}

                        {!loading &&
                            comments.length > 0 && (
                                <div className="comments-list">
                                    {comments.map(
                                        (comment) => {
                                            const memberName =
                                                getMemberName(
                                                    comment.user_id
                                                );

                                            const initial =
                                                memberName
                                                    ?.trim()
                                                    ?.charAt(0)
                                                    ?.toUpperCase() ||
                                                "U";

                                            const isOwnComment =
                                                String(
                                                    comment.user_id
                                                ) ===
                                                String(
                                                    user?.id
                                                );

                                            return (
                                                <div
                                                    key={
                                                        comment.id
                                                    }
                                                    className="comment"
                                                >
                                                    <div className="comment__avatar">
                                                        {initial}
                                                    </div>

                                                    <div className="comment__body">
                                                        <div className="comment__header">
                                                            <strong>
                                                                {memberName}
                                                            </strong>

                                                            {isOwnComment && (
                                                                <span className="comment__you">
                                                                    You
                                                                </span>
                                                            )}
                                                        </div>

                                                        <p>
                                                            {comment.content}
                                                        </p>

                                                        {isOwnComment && (
                                                            <button
                                                                type="button"
                                                                className="comment-delete-button"
                                                                onClick={() =>
                                                                    handleDeleteComment(
                                                                        comment.id
                                                                    )
                                                                }
                                                            >
                                                                Delete
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        }
                                    )}
                                </div>
                            )}

                        {canManageCards && (
                            <form
                                className="comment-create-form"
                                onSubmit={
                                    handleCreateComment
                                }
                            >
                                <label>
                                    Add a comment
                                </label>

                                <textarea
                                    placeholder="Write a comment..."
                                    value={content}
                                    onChange={(event) =>
                                        setContent(
                                            event.target.value
                                        )
                                    }
                                />

                                <div className="comment-create-actions">
                                    <button
                                        type="submit"
                                        disabled={
                                            creating
                                        }
                                    >
                                        {creating
                                            ? "Posting..."
                                            : "Add Comment"}
                                    </button>
                                </div>
                            </form>
                        )}
                    </section>
                </div>
            </div>
        </div>
    );

};

export default CardDetails;
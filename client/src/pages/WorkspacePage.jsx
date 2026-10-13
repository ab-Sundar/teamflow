import {
    useCallback,
    useEffect,
    useState,
} from "react";

import {
    Link,
    useParams,
} from "react-router-dom";

import AppLayout from "../components/AppLayout";
import WorkspaceMembers from "../components/WorkspaceMembers";

import {
    getWorkspaceById,
} from "../services/workspaceApi";

import {
    createBoard,
    deleteBoard,
    getBoards,
    updateBoard,
} from "../services/boardApi";

const WorkspacePage = () => {
    const {
        workspaceId,
    } = useParams();

    const [
        workspace,
        setWorkspace,
    ] = useState(null);

    const [
        boards,
        setBoards,
    ] = useState([]);

    const [
        boardName,
        setBoardName,
    ] = useState("");

    const [
        loading,
        setLoading,
    ] = useState(true);

    const [
        creatingBoard,
        setCreatingBoard,
    ] = useState(false);

    const [
        error,
        setError,
    ] = useState("");

    const fetchWorkspaceData =
        useCallback(
            async () => {
                try {
                    setError("");

                    const [
                        workspaceData,
                        boardsData,
                    ] =
                        await Promise.all([
                            getWorkspaceById(
                                workspaceId
                            ),

                            getBoards(
                                workspaceId
                            ),
                        ]);

                    setWorkspace(
                        workspaceData.workspace
                    );

                    setBoards(
                        boardsData.boards
                    );
                } catch (error) {
                    setError(
                        error.response?.data
                            ?.message ||
                        "Failed to load workspace."
                    );
                } finally {
                    setLoading(false);
                }
            },
            [
                workspaceId,
            ]
        );

    useEffect(() => {
        fetchWorkspaceData();
    }, [
        fetchWorkspaceData,
    ]);

    const handleCreateBoard =
        async (event) => {
            event.preventDefault();

            const trimmedName =
                boardName.trim();

            if (!trimmedName) {
                return;
            }

            try {
                setCreatingBoard(
                    true
                );

                setError("");

                await createBoard(
                    workspaceId,
                    {
                        name:
                            trimmedName,
                    }
                );

                setBoardName("");

                const boardsData =
                    await getBoards(
                        workspaceId
                    );

                setBoards(
                    boardsData.boards
                );
            } catch (error) {
                setError(
                    error.response?.data
                        ?.message ||
                    "Failed to create board."
                );
            } finally {
                setCreatingBoard(
                    false
                );
            }
        };

    const handleEditBoard = async (board) => {
        const newName = window.prompt(
            "Enter a new board name:",
            board.name
        );

        if (newName === null) {
            return;
        }

        const trimmedName = newName.trim();

        if (!trimmedName || trimmedName === board.name) {
            return;
        }

        try {
            setError("");

            const data = await updateBoard(
                workspaceId,
                board.id,
                {
                    name: trimmedName,
                }
            );

            setBoards((previousBoards) =>
                previousBoards.map((existingBoard) =>
                    Number(existingBoard.id) === Number(board.id)
                        ? {
                            ...existingBoard,
                            ...data.board,
                        }
                        : existingBoard
                )
            );
        } catch (error) {
            setError(
                error.response?.data?.message ||
                "Failed to update board."
            );
        }
    };

    const handleDeleteBoard = async (board) => {
        const confirmed = window.confirm(
            `Delete "${board.name}"?\n\nAll lists and cards inside this board will also be deleted.`
        );

        if (!confirmed) {
            return;
        }

        try {
            setError("");

            await deleteBoard(
                workspaceId,
                board.id
            );

            setBoards((previousBoards) =>
                previousBoards.filter(
                    (existingBoard) =>
                        Number(existingBoard.id) !==
                        Number(board.id)
                )
            );
        } catch (error) {
            setError(
                error.response?.data?.message ||
                "Failed to delete board."
            );
        }
    };
    const canManageBoards =
        workspace &&
        [
            "owner",
            "admin",
        ].includes(
            workspace.role
        );

    return (
        <AppLayout>
            <section className="workspace-page">
                <Link
                    className="back-link"
                    to="/"
                >
                    <span>←</span>
                    Back to Workspaces
                </Link>

                {loading && (
                    <div className="page-loading">
                        Loading workspace...
                    </div>
                )}

                {error && (
                    <div className="error-message">
                        {error}
                    </div>
                )}

                {!loading &&
                    workspace && (
                        <>
                            <div className="workspace-hero">
                                <div>
                                    <span className="eyebrow">
                                        Workspace
                                    </span>

                                    <div className="workspace-title-row">
                                        <h2>
                                            {
                                                workspace.name
                                            }
                                        </h2>

                                        <span
                                            className={`role-badge role-badge--${workspace.role}`}
                                        >
                                            {
                                                workspace.role
                                            }
                                        </span>
                                    </div>

                                    <p>
                                        Manage members,
                                        boards and project
                                        work from this
                                        workspace.
                                    </p>
                                </div>

                                <div className="workspace-hero__stat">
                                    <span className="workspace-hero__stat-number">
                                        {
                                            boards.length
                                        }
                                    </span>

                                    <span className="workspace-hero__stat-label">
                                        Boards
                                    </span>
                                </div>
                            </div>

                            <div className="workspace-content-grid">
                                <div className="workspace-main-column">
                                    <section className="workspace-section">
                                        <div className="workspace-section__header">
                                            <div>
                                                <h3>
                                                    Boards
                                                </h3>

                                                <p>
                                                    Organize your
                                                    project into
                                                    boards and
                                                    workflows.
                                                </p>
                                            </div>
                                        </div>

                                        {canManageBoards && (
                                            <div className="board-create-card surface">
                                                <div>
                                                    <h4>
                                                        Create a board
                                                    </h4>

                                                    <p>
                                                        Add another
                                                        board to this
                                                        workspace.
                                                    </p>
                                                </div>

                                                <form
                                                    className="board-create-form"
                                                    onSubmit={
                                                        handleCreateBoard
                                                    }
                                                >
                                                    <input
                                                        type="text"
                                                        placeholder="Board name"
                                                        value={
                                                            boardName
                                                        }
                                                        onChange={(
                                                            event
                                                        ) =>
                                                            setBoardName(
                                                                event
                                                                    .target
                                                                    .value
                                                            )
                                                        }
                                                    />

                                                    <button
                                                        type="submit"
                                                        disabled={
                                                            creatingBoard
                                                        }
                                                    >
                                                        {creatingBoard
                                                            ? "Creating..."
                                                            : "Create Board"}
                                                    </button>
                                                </form>
                                            </div>
                                        )}

                                        {boards.length ===
                                            0 ? (
                                            <div className="empty-state">
                                                <div className="empty-state__icon">
                                                    +
                                                </div>

                                                <h3>
                                                    No boards yet
                                                </h3>

                                                <p>
                                                    Create your
                                                    first board to
                                                    start organizing
                                                    cards and lists.
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="board-grid">
                                                {boards.map(
                                                    (
                                                        board
                                                    ) => (
                                                        <article
                                                            key={
                                                                board.id
                                                            }
                                                            className="board-card surface"
                                                        >
                                                            <div className="board-card__icon">
                                                                {board.name
                                                                    ?.trim()
                                                                    ?.charAt(
                                                                        0
                                                                    )
                                                                    ?.toUpperCase() ||
                                                                    "B"}
                                                            </div>

                                                            <div className="board-card__content">
                                                                <h4>
                                                                    {
                                                                        board.name
                                                                    }
                                                                </h4>

                                                                <p>
                                                                    Open this
                                                                    board to
                                                                    manage
                                                                    lists,
                                                                    cards and
                                                                    tasks.
                                                                </p>
                                                            </div>

                                                            <div className="board-card__footer">
                                                                <Link
                                                                    className="board-open-link"
                                                                    to={`/workspaces/${workspaceId}/boards/${board.id}`}
                                                                >
                                                                    Open Board
                                                                    <span>→</span>
                                                                </Link>

                                                                {canManageBoards && (
                                                                    <div className="board-card__actions">
                                                                        <button
                                                                            type="button"
                                                                            className="board-action-button"
                                                                            onClick={() =>
                                                                                handleEditBoard(board)
                                                                            }
                                                                        >
                                                                            Edit
                                                                        </button>

                                                                        <button
                                                                            type="button"
                                                                            className="board-action-button board-action-button--danger"
                                                                            onClick={() =>
                                                                                handleDeleteBoard(board)
                                                                            }
                                                                        >
                                                                            Delete
                                                                        </button>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </article>
                                                    )
                                                )}
                                            </div>
                                        )}
                                    </section>
                                </div>

                                <aside className="workspace-sidebar">
                                    <WorkspaceMembers
                                        workspaceId={
                                            workspaceId
                                        }
                                        currentUserRole={
                                            workspace.role
                                        }
                                        onWorkspaceChanged={
                                            fetchWorkspaceData
                                        }
                                    />
                                </aside>
                            </div>
                        </>
                    )}
            </section>
        </AppLayout>
    );
};

export default WorkspacePage;
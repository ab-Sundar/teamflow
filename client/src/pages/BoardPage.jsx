import {
    useCallback,
    useEffect,
    useRef,
    useState,
} from "react";

import {
    Link,
    useParams,
} from "react-router-dom";

import {
    DragDropProvider,
} from "@dnd-kit/react";


import {
    move,
} from "@dnd-kit/helpers";

import AppLayout from "../components/AppLayout";
import ListColumn from "../components/ListColumn";

import {
    getWorkspaceById,
} from "../services/workspaceApi";

import {
    getBoard,
} from "../services/boardApi";

import {
    getWorkspaceMembers,
} from "../services/memberApi";

import {
    createList,
    deleteList,
    getLists,
    updateList,
} from "../services/listApi";

import {
    createCard,
    getCards,
    moveCard,
} from "../services/cardApi";

import {
    connectSocket,
} from "../services/socket";

const getListKey = (listId) =>
    `list-${listId}`;

const getListIdFromKey = (listKey) =>
    Number(
        String(listKey).replace(
            "list-",
            ""
        )
    );

const BoardPage = () => {
    const {
        workspaceId,
        boardId,
    } = useParams();

    const [
        workspace,
        setWorkspace,
    ] = useState(null);

    const [
        board,
        setBoard,
    ] = useState(null);

    const [
        lists,
        setLists,
    ] = useState([]);

    const [
        members,
        setMembers,
    ] = useState([]);

    /*
      Example:
  
      {
        "list-1": [card1, card2],
        "list-2": [card3],
        "list-3": []
      }
    */
    const [
        cardsByList,
        setCardsByList,
    ] = useState({});

    /*
      Used to restore the board if:
      - Escape cancels dragging
      - backend move request fails
    */
    const cardsSnapshotRef =
        useRef({});
    const latestCardsRef =
        useRef({});
    const draggedCardRef =
        useRef(null);

    const [
        listName,
        setListName,
    ] = useState("");

    const [
        loading,
        setLoading,
    ] = useState(true);

    const [
        creatingList,
        setCreatingList,
    ] = useState(false);

    const [
        error,
        setError,
    ] = useState("");

    const fetchBoardData =
        async () => {
            try {
                setLoading(true);
                setError("");

                const [
                    workspaceData,
                    boardData,
                    listsData,
                    membersData,
                ] = await Promise.all([
                    getWorkspaceById(
                        workspaceId
                    ),

                    getBoard(
                        workspaceId,
                        boardId
                    ),

                    getLists(boardId),

                    getWorkspaceMembers(
                        workspaceId
                    ),
                ]);

                const loadedLists =
                    listsData.lists;

                /*
                  Load cards for every list.
                */
                const cardResults =
                    await Promise.all(
                        loadedLists.map(
                            async (list) => {
                                const data =
                                    await getCards(
                                        list.id
                                    );

                                return {
                                    listId:
                                        list.id,

                                    cards:
                                        data.cards,
                                };
                            }
                        )
                    );

                const groupedCards = {};

                cardResults.forEach(
                    ({
                        listId,
                        cards,
                    }) => {
                        groupedCards[
                            getListKey(listId)
                        ] = cards;
                    }
                );

                setWorkspace(
                    workspaceData.workspace
                );

                setBoard(
                    boardData.board
                );

                setLists(
                    loadedLists
                );

                setMembers(
                    membersData.members
                );

                setCardsByList(
                    groupedCards
                );
            } catch (error) {
                setError(
                    error.response?.data
                        ?.message ||
                    "Failed to load board."
                );
            } finally {
                setLoading(false);
            }
        };

    useEffect(() => {
        fetchBoardData();
    }, [
        workspaceId,
        boardId,
    ]);

    useEffect(() => {
        if (!workspaceId) {
            return;
        }

        const socket =
            connectSocket();

        const joinWorkspace = () => {
            socket.emit(
                "workspace:join",
                Number(workspaceId),
                (response) => {
                    if (
                        !response?.success
                    ) {
                        console.error(
                            "Workspace socket join failed:",
                            response?.message
                        );
                    }
                }
            );
        };

        const handleConnect = () => {
            joinWorkspace();
        };

        const handleConnectError =
            (error) => {
                console.error(
                    "Socket connection error:",
                    error.message
                );
            };

        /*
          LIST EVENTS
        */

        const handleListCreated = ({
            list,

        }) => {

            if (
                Number(list.board_id) !==
                Number(boardId)
            ) {
                return;
            }

            setLists(
                (previousLists) => {
                    const exists =
                        previousLists.some(
                            (existingList) =>
                                Number(
                                    existingList.id
                                ) ===
                                Number(list.id)
                        );

                    if (exists) {
                        return previousLists;
                    }

                    return [
                        ...previousLists,
                        list,
                    ];
                }
            );

            setCardsByList(
                (previousCards) => ({
                    ...previousCards,

                    [getListKey(
                        list.id
                    )]:
                        previousCards[
                        getListKey(
                            list.id
                        )
                        ] || [],
                })
            );
        };

        const handleListUpdated = ({
            list,
        }) => {
            if (
                Number(list.board_id) !==
                Number(boardId)
            ) {
                return;
            }

            setLists(
                (previousLists) =>
                    previousLists.map(
                        (
                            existingList
                        ) =>
                            Number(
                                existingList.id
                            ) ===
                                Number(list.id)
                                ? {
                                    ...existingList,
                                    ...list,
                                }
                                : existingList
                    )
            );
        };

        const handleListDeleted = ({
            listId,
        }) => {
            setLists(
                (previousLists) => {
                    const exists =
                        previousLists.some(
                            (list) =>
                                Number(
                                    list.id
                                ) ===
                                Number(
                                    listId
                                )
                        );

                    if (!exists) {
                        return previousLists;
                    }

                    return previousLists.filter(
                        (list) =>
                            Number(
                                list.id
                            ) !==
                            Number(
                                listId
                            )
                    );
                }
            );

            setCardsByList(
                (previousCards) => {
                    const listKey =
                        getListKey(
                            listId
                        );

                    if (
                        !Object.prototype
                            .hasOwnProperty.call(
                                previousCards,
                                listKey
                            )
                    ) {
                        return previousCards;
                    }

                    const nextCards = {
                        ...previousCards,
                    };

                    delete nextCards[
                        listKey
                    ];

                    return nextCards;
                }
            );
        };

        /*
          CARD EVENTS
        */

        const handleCardCreated = ({
            card,
        }) => {

            const listKey =
                getListKey(
                    card.list_id
                );

            setCardsByList(
                (previousCards) => {
                    /*
                      If this list is not part
                      of this board, ignore it.
                    */
                    if (
                        !Object.prototype
                            .hasOwnProperty.call(
                                previousCards,
                                listKey
                            )
                    ) {
                        return previousCards;
                    }

                    const existingCards =
                        previousCards[
                        listKey
                        ] || [];

                    const exists =
                        existingCards.some(
                            (
                                existingCard
                            ) =>
                                Number(
                                    existingCard.id
                                ) ===
                                Number(card.id)
                        );

                    if (exists) {
                        return previousCards;
                    }

                    return {
                        ...previousCards,

                        [listKey]: [
                            ...existingCards,
                            card,
                        ],
                    };
                }
            );
        };

        const handleCardUpdated = ({
            card,

        }) => {
            setCardsByList(
                (previousCards) => {
                    let changed = false;

                    const nextCards = {
                        ...previousCards,
                    };

                    for (
                        const listKey of
                        Object.keys(
                            nextCards
                        )
                    ) {
                        const cards =
                            nextCards[
                            listKey
                            ];

                        const cardExists =
                            cards.some(
                                (
                                    existingCard
                                ) =>
                                    Number(
                                        existingCard.id
                                    ) ===
                                    Number(
                                        card.id
                                    )
                            );

                        if (!cardExists) {
                            continue;
                        }

                        nextCards[
                            listKey
                        ] = cards.map(
                            (
                                existingCard
                            ) =>
                                Number(
                                    existingCard.id
                                ) ===
                                    Number(
                                        card.id
                                    )
                                    ? {
                                        ...existingCard,
                                        ...card,
                                    }
                                    : existingCard
                        );

                        changed = true;
                        break;
                    }

                    return changed
                        ? nextCards
                        : previousCards;
                }
            );
        };

        const handleCardDeleted = ({
            cardId,
        }) => {
            setCardsByList(
                (previousCards) => {
                    const nextCards = {};

                    for (
                        const [
                            listKey,
                            cards,
                        ] of Object.entries(
                            previousCards
                        )
                    ) {
                        nextCards[
                            listKey
                        ] = cards.filter(
                            (card) =>
                                Number(
                                    card.id
                                ) !==
                                Number(
                                    cardId
                                )
                        );
                    }

                    return nextCards;
                }
            );
        };

        const handleCardAssigneeUpdated =
            async ({
                listId,
            }) => {

                try {
                    await refreshCardsForLists(
                        listId
                    );
                } catch (error) {
                    console.error(
                        "Failed to sync card assignee:",
                        error
                    );
                }
            };

        const handleCardDueDateUpdated =
            async ({
                listId
            }) => {

                try {
                    await refreshCardsForLists(
                        listId
                    );
                } catch (error) {
                    console.error(
                        "Failed to sync card due date:",
                        error
                    );
                }
            };

        socket.on(
            "connect",
            handleConnect
        );

        socket.on(
            "connect_error",
            handleConnectError
        );

        socket.on(
            "list:created",
            handleListCreated
        );

        socket.on(
            "list:updated",
            handleListUpdated
        );

        socket.on(
            "list:deleted",
            handleListDeleted
        );

        socket.on(
            "card:created",
            handleCardCreated
        );

        socket.on(
            "card:updated",
            handleCardUpdated
        );

        socket.on(
            "card:deleted",
            handleCardDeleted
        );

        socket.on(
            "card:moved",
            handleCardMoved
        );

        socket.on(
            "card:assignee-updated",
            handleCardAssigneeUpdated
        );

        socket.on(
            "card:due-date-updated",
            handleCardDueDateUpdated
        );
        /*
          If socket was already connected
          before BoardPage mounted, the
          connect event will not fire again.
        */
        if (socket.connected) {
            joinWorkspace();
        }

        return () => {
            /*
              Critical:
              remove ONLY this page's handlers.
        
              Do not use socket.off() with
              no arguments.
            */
            socket.off(
                "connect",
                handleConnect
            );

            socket.off(
                "connect_error",
                handleConnectError
            );

            socket.off(
                "list:created",
                handleListCreated
            );

            socket.off(
                "list:updated",
                handleListUpdated
            );

            socket.off(
                "list:deleted",
                handleListDeleted
            );

            socket.off(
                "card:created",
                handleCardCreated
            );

            socket.off(
                "card:updated",
                handleCardUpdated
            );

            socket.off(
                "card:deleted",
                handleCardDeleted
            );

            socket.off(
                "card:moved",
                handleCardMoved
            );

            socket.off(
                "card:assignee-updated",
                handleCardAssigneeUpdated
            );

            socket.off(
                "card:due-date-updated",
                handleCardDueDateUpdated
            );
        };
    }, [
        workspaceId,
        boardId,
    ]);
    /*
      CREATE LIST
    */
    const handleCreateList =
        async (event) => {
            event.preventDefault();

            const trimmedName =
                listName.trim();

            if (!trimmedName) {
                return;
            }

            try {
                setError("");
                setCreatingList(true);

                const data =
                    await createList(
                        boardId,
                        {
                            name: trimmedName,
                        }
                    );

                const newList =
                    data.list;

                setLists((previousLists) => {
                    const alreadyExists =
                        previousLists.some(
                            (list) =>
                                Number(list.id) ===
                                Number(newList.id)
                        );

                    if (alreadyExists) {
                        return previousLists;
                    }

                    return [
                        ...previousLists,
                        newList,
                    ];
                });

                /*
                  New list must immediately
                  exist in DnD state even
                  though it has zero cards.
                */
                setCardsByList(
                    (previousCards) => ({
                        ...previousCards,

                        [getListKey(
                            newList.id
                        )]: [],
                    })
                );

                setListName("");
            } catch (error) {
                setError(
                    error.response?.data
                        ?.message ||
                    "Failed to create list."
                );
            } finally {
                setCreatingList(false);
            }
        };
    const handleUpdateList = useCallback(
        async (list, newName) => {
            const trimmedName = newName.trim();

            if (
                !trimmedName ||
                trimmedName === list.name
            ) {
                return;
            }

            try {
                setError("");

                const data = await updateList(
                    boardId,
                    list.id,
                    {
                        name: trimmedName,
                    }
                );

                setLists((previousLists) =>
                    previousLists.map(
                        (existingList) =>
                            Number(existingList.id) ===
                                Number(list.id)
                                ? {
                                    ...existingList,
                                    ...data.list,
                                }
                                : existingList
                    )
                );
            } catch (error) {
                setError(
                    error.response?.data?.message ||
                    "Failed to update list."
                );

                throw error;
            }
        },
        [boardId]
    );

    const handleDeleteList = useCallback(
        async (list) => {
            const confirmed = window.confirm(
                `Delete "${list.name}"?\n\nAll cards inside this list will also be deleted.`
            );

            if (!confirmed) {
                return;
            }

            try {
                setError("");

                await deleteList(
                    boardId,
                    list.id
                );

                setLists((previousLists) =>
                    previousLists.filter(
                        (existingList) =>
                            Number(existingList.id) !==
                            Number(list.id)
                    )
                );

                const listKey =
                    getListKey(list.id);

                setCardsByList(
                    (previousCards) => {
                        if (
                            !Object.prototype.hasOwnProperty.call(
                                previousCards,
                                listKey
                            )
                        ) {
                            return previousCards;
                        }

                        const nextCards = {
                            ...previousCards,
                        };

                        delete nextCards[
                            listKey
                        ];

                        return nextCards;
                    }
                );
            } catch (error) {
                setError(
                    error.response?.data?.message ||
                    "Failed to delete list."
                );

                throw error;
            }
        },
        [boardId]
    );
    /*
      CREATE CARD
    */
    const handleCreateCard =
        useCallback(
            async (
                listId,
                cardData
            ) => {
                const data =
                    await createCard(
                        listId,
                        cardData
                    );

                const listKey =
                    getListKey(listId);

                setCardsByList(
                    (previousCards) => {
                        const existingCards =
                            previousCards[
                            listKey
                            ] || [];

                        const alreadyExists =
                            existingCards.some(
                                (card) =>
                                    Number(card.id) ===
                                    Number(
                                        data.card.id
                                    )
                            );

                        if (alreadyExists) {
                            return previousCards;
                        }

                        return {
                            ...previousCards,

                            [listKey]: [
                                ...existingCards,
                                data.card,
                            ],
                        };
                    }
                );

                return data.card;
            },
            []
        );
    /*
      UPDATE CARD
    */
    const handleCardUpdated =
        useCallback(
            (
                listId,
                updatedCard
            ) => {
                const listKey =
                    getListKey(listId);

                setCardsByList(
                    (previousCards) => ({
                        ...previousCards,

                        [listKey]: (
                            previousCards[
                            listKey
                            ] || []
                        ).map((card) =>
                            Number(card.id) ===
                                Number(
                                    updatedCard.id
                                )
                                ? {
                                    ...card,
                                    ...updatedCard,
                                }
                                : card
                        ),
                    })
                );
            },
            []
        );

    /*
      DELETE CARD
    */
    const handleCardDeleted =
        useCallback(
            (
                listId,
                cardId
            ) => {
                const listKey =
                    getListKey(listId);

                setCardsByList(
                    (previousCards) => ({
                        ...previousCards,

                        [listKey]: (
                            previousCards[
                            listKey
                            ] || []
                        ).filter(
                            (card) =>
                                Number(card.id) !==
                                Number(cardId)
                        ),
                    })
                );
            },
            []
        );
    const refreshCardsForLists =
        async (...listIds) => {
            const uniqueListIds = [
                ...new Set(
                    listIds
                        .filter(Boolean)
                        .map(Number)
                ),
            ];

            const results =
                await Promise.all(
                    uniqueListIds.map(
                        async (listId) => {
                            const data =
                                await getCards(
                                    listId
                                );

                            return {
                                listId,
                                cards:
                                    data.cards,
                            };
                        }
                    )
                );

            setCardsByList(
                (previousCards) => {
                    const nextCards = {
                        ...previousCards,
                    };

                    results.forEach(
                        ({
                            listId,
                            cards,
                        }) => {
                            nextCards[
                                getListKey(
                                    listId
                                )
                            ] = cards;
                        }
                    );

                    return nextCards;
                }
            );
        };
    /*
      DROPDOWN MOVEMENT
  
    */
    const handleCardMoved =
        async ({
            sourceListId,
            targetListId,
        }) => {
            try {
                await refreshCardsForLists(
                    sourceListId,
                    targetListId
                );
            } catch (error) {
                console.error(
                    "Failed to sync moved card:",
                    error
                );
            }
        };

    /*
  =========================
  DRAG AND DROP
  =========================
*/

    /*
      Find which list currently
      contains a card.
    */
    const findCardLocation = (
        cardState,
        cardId
    ) => {
        for (
            const [
                listKey,
                cards,
            ] of Object.entries(
                cardState
            )
        ) {
            const index =
                cards.findIndex(
                    (card) =>
                        Number(
                            card.id
                        ) ===
                        Number(
                            cardId
                        )
                );

            if (index !== -1) {
                return {
                    listKey,
                    index,
                };
            }
        }

        return null;
    };


    /*
      DRAG START
    
      Save the ORIGINAL state and the
      card's ORIGINAL list.
    
      We do this ourselves instead of
      trusting dnd-kit later.
    */
    const handleDragStart = (
        event
    ) => {
        const { source } =
            event.operation;

        if (!source) {
            return;
        }

        const cardId =
            Number(
                source.data?.cardId ??
                source.id
            );

        if (!cardId) {
            return;
        }

        const snapshot =
            structuredClone(
                cardsByList
            );

        cardsSnapshotRef.current =
            snapshot;

        latestCardsRef.current =
            snapshot;

        const originalLocation =
            findCardLocation(
                snapshot,
                cardId
            );

        if (!originalLocation) {
            draggedCardRef.current =
                null;

            return;
        }

        draggedCardRef.current = {
            cardId,

            sourceListKey:
                originalLocation.listKey,

            sourceIndex:
                originalLocation.index,
        };
    };


    /*
      DRAG OVER
    
      dnd-kit handles the temporary
      visual movement.
    
      At the same time we keep an
      always-current copy in
      latestCardsRef.
    */
    const handleDragOver = (
        event
    ) => {
        const { source } =
            event.operation;

        if (
            !source ||
            source.type !== "card"
        ) {
            return;
        }

        setCardsByList(
            (currentCards) => {
                const nextCards =
                    move(
                        currentCards,
                        event
                    );

                /*
                  VERY IMPORTANT:
    
                  This is the actual state
                  we will inspect when the
                  user drops the card.
                */
                latestCardsRef.current =
                    nextCards;

                return nextCards;
            }
        );
    };


    /*
      DRAG END
    
      Do NOT use:
    
        source.group
        source.index
    
      to determine what PostgreSQL
      should store.
    
      Instead inspect our own final
      cardsByList state.
    */
    const handleDragEnd =
        async (event) => {
            /*
              Cancelled drag:
              restore exactly what existed
              before dragging.
            */
            if (event.canceled) {
                const restored =
                    cardsSnapshotRef.current;

                latestCardsRef.current =
                    restored;

                setCardsByList(
                    restored
                );

                draggedCardRef.current =
                    null;

                return;
            }

            const dragInfo =
                draggedCardRef.current;

            if (!dragInfo) {
                return;
            }

            const {
                cardId,
                sourceListKey,
                sourceIndex,
            } = dragInfo;

            /*
              This is the actual React state
              after all onDragOver moves.
            */
            const finalCards =
                latestCardsRef.current;

            const finalLocation =
                findCardLocation(
                    finalCards,
                    cardId
                );

            if (!finalLocation) {
                const restored =
                    cardsSnapshotRef.current;

                latestCardsRef.current =
                    restored;

                setCardsByList(
                    restored
                );

                draggedCardRef.current =
                    null;

                return;
            }

            const targetListKey =
                finalLocation.listKey;

            const targetIndex =
                finalLocation.index;

            /*
              Nothing moved.
            */
            if (
                sourceListKey ===
                targetListKey &&
                sourceIndex ===
                targetIndex
            ) {
                draggedCardRef.current =
                    null;

                return;
            }

            const sourceListId =
                getListIdFromKey(
                    sourceListKey
                );

            const targetListId =
                getListIdFromKey(
                    targetListKey
                );

            /*
              React index:
                0, 1, 2, 3
    
              DB position:
                1, 2, 3, 4
            */
            const position =
                targetIndex + 1;

            try {
                setError("");

                const data =
                    await moveCard(
                        sourceListId,
                        cardId,
                        {
                            targetListId,
                            position,
                        }
                    );

                /*
                  React is already in the
                  correct position.
    
                  Only merge backend-returned
                  fields into the moved card.
                */
                setCardsByList(
                    (
                        previousCards
                    ) => {
                        const updatedCards = {
                            ...previousCards,

                            [targetListKey]:
                                (
                                    previousCards[
                                    targetListKey
                                    ] || []
                                ).map(
                                    (
                                        card
                                    ) =>
                                        Number(
                                            card.id
                                        ) ===
                                            Number(
                                                cardId
                                            )
                                            ? {
                                                ...card,
                                                ...data.card,

                                                list_id:
                                                    targetListId,

                                                position,
                                            }
                                            : card
                                ),
                        };

                        latestCardsRef.current =
                            updatedCards;

                        return updatedCards;
                    }
                );
            } catch (error) {
                /*
                  Backend persistence failed.
    
                  Restore board to exactly
                  what existed before drag.
                */
                const restored =
                    cardsSnapshotRef.current;

                latestCardsRef.current =
                    restored;

                setCardsByList(
                    restored
                );

                setError(
                    error.response?.data
                        ?.message ||
                    "Failed to move card."
                );
            } finally {
                draggedCardRef.current =
                    null;
            }
        };

    const canManageLists =
        workspace &&
        [
            "owner",
            "admin",
            "member",
        ].includes(
            workspace.role
        );

    const canManageCards =
        workspace &&
        [
            "owner",
            "admin",
            "member",
        ].includes(
            workspace.role
        );

    return (
        <AppLayout>
            <section className="board-page">
                <div className="board-topbar">
                    <Link
                        className="back-link"
                        to={`/workspaces/${workspaceId}`}
                    >
                        <span>←</span>
                        Back to Workspace
                    </Link>
                </div>

                {loading && (
                    <div className="page-loading">
                        Loading board...
                    </div>
                )}

                {error && (
                    <div className="error-message">
                        {error}
                    </div>
                )}

                {!loading &&
                    board &&
                    workspace && (
                        <>
                            <div className="board-header">
                                <div>
                                    <span className="eyebrow">
                                        {workspace.name}
                                    </span>

                                    <div className="board-title-row">
                                        <h2>
                                            {board.name}
                                        </h2>

                                        <span
                                            className={`role-badge role-badge--${workspace.role}`}
                                        >
                                            {workspace.role}
                                        </span>
                                    </div>

                                    <p>
                                        Organize work across lists,
                                        assign members and move cards
                                        through your workflow.
                                    </p>
                                </div>

                                <div className="board-summary">
                                    <div className="board-summary__item">
                                        <strong>
                                            {lists.length}
                                        </strong>

                                        <span>
                                            Lists
                                        </span>
                                    </div>

                                    <div className="board-summary__divider" />

                                    <div className="board-summary__item">
                                        <strong>
                                            {Object.values(
                                                cardsByList
                                            ).reduce(
                                                (
                                                    total,
                                                    cards
                                                ) =>
                                                    total +
                                                    cards.length,
                                                0
                                            )}
                                        </strong>

                                        <span>
                                            Cards
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {canManageLists && (
                                <div className="list-create-bar surface">
                                    <div>
                                        <h4>
                                            Add another list
                                        </h4>

                                        <p>
                                            Create a new stage in your
                                            workflow.
                                        </p>
                                    </div>

                                    <form
                                        className="list-create-form"
                                        onSubmit={
                                            handleCreateList
                                        }
                                    >
                                        <input
                                            type="text"
                                            placeholder="List name"
                                            value={
                                                listName
                                            }
                                            onChange={(
                                                event
                                            ) =>
                                                setListName(
                                                    event.target
                                                        .value
                                                )
                                            }
                                        />

                                        <button
                                            type="submit"
                                            disabled={
                                                creatingList
                                            }
                                        >
                                            {creatingList
                                                ? "Creating..."
                                                : "Add List"}
                                        </button>
                                    </form>
                                </div>
                            )}

                            <DragDropProvider
                                onDragStart={
                                    handleDragStart
                                }
                                onDragOver={
                                    handleDragOver
                                }
                                onDragEnd={
                                    handleDragEnd
                                }
                            >
                                {lists.length ===
                                    0 ? (
                                    <div className="empty-state">
                                        <div className="empty-state__icon">
                                            +
                                        </div>

                                        <h3>
                                            No lists yet
                                        </h3>

                                        <p>
                                            Add your first list to
                                            start building this board.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="board-canvas">
                                        {lists.map(
                                            (list) => {
                                                const listKey =
                                                    getListKey(
                                                        list.id
                                                    );

                                                return (
                                                    <ListColumn
                                                        key={list.id}
                                                        list={list}
                                                        cards={
                                                            cardsByList[
                                                            listKey
                                                            ] || []
                                                        }
                                                        members={members}
                                                        canManageLists={
                                                            canManageLists
                                                        }
                                                        canManageCards={
                                                            canManageCards
                                                        }
                                                        onCreateCard={
                                                            handleCreateCard
                                                        }
                                                        onUpdateList={
                                                            handleUpdateList
                                                        }
                                                        onDeleteList={
                                                            handleDeleteList
                                                        }
                                                        onCardUpdated={
                                                            handleCardUpdated
                                                        }
                                                        onCardDeleted={
                                                            handleCardDeleted
                                                        }
                                                    />
                                                );
                                            }
                                        )}
                                    </div>
                                )}
                            </DragDropProvider>
                        </>
                    )}
            </section>
        </AppLayout>
    );
};

export default BoardPage;
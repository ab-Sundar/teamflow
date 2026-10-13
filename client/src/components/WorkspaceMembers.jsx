import {
    useEffect,
    useState,
} from "react";

import {
    addWorkspaceMember,
    getWorkspaceMembers,
    removeWorkspaceMember,
    updateWorkspaceMemberRole,
} from "../services/memberApi";

import {
    connectSocket,
} from "../services/socket";

const WorkspaceMembers = ({
    workspaceId,
    currentUserRole,
    onWorkspaceChanged,
}) => {
    const [
        members,
        setMembers,
    ] = useState([]);

    const [
        email,
        setEmail,
    ] = useState("");

    const [
        role,
        setRole,
    ] = useState("member");

    const [
        loading,
        setLoading,
    ] = useState(true);

    const [
        adding,
        setAdding,
    ] = useState(false);

    const [
        updatingUserId,
        setUpdatingUserId,
    ] = useState(null);

    const [
        removingUserId,
        setRemovingUserId,
    ] = useState(null);

    const [
        error,
        setError,
    ] = useState("");

    const canAddMembers = [
        "owner",
        "admin",
    ].includes(
        currentUserRole
    );

    const canChangeRoles =
        currentUserRole ===
        "owner";

    const canRemoveMembers = [
        "owner",
        "admin",
    ].includes(
        currentUserRole
    );

    const fetchMembers =
        async () => {
            try {
                setError("");

                const data =
                    await getWorkspaceMembers(
                        workspaceId
                    );

                setMembers(
                    data.members
                );
            } catch (error) {
                setError(
                    error.response?.data
                        ?.message ||
                    "Failed to load members."
                );
            } finally {
                setLoading(false);
            }
        };

    useEffect(() => {
        fetchMembers();
    }, [workspaceId]);

    useEffect(() => {
        if (!workspaceId) {
            return;
        }

        const socket =
            connectSocket();

        const joinWorkspace =
            () => {
                socket.emit(
                    "workspace:join",
                    Number(
                        workspaceId
                    ),
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

        const handleConnect =
            () => {
                joinWorkspace();
            };

        const syncMembers =
            async () => {
                try {
                    await fetchMembers();

                    if (
                        onWorkspaceChanged
                    ) {
                        await onWorkspaceChanged();
                    }
                } catch (error) {
                    console.error(
                        "Failed to sync workspace members:",
                        error
                    );
                }
            };

        const handleMemberAdded =
            async () => {
                await syncMembers();
            };

        const handleMemberRoleUpdated =
            async () => {
                await syncMembers();
            };

        const handleMemberRemoved =
            async () => {
                await syncMembers();
            };

        socket.on(
            "connect",
            handleConnect
        );

        socket.on(
            "member:added",
            handleMemberAdded
        );

        socket.on(
            "member:role-updated",
            handleMemberRoleUpdated
        );

        socket.on(
            "member:removed",
            handleMemberRemoved
        );

        if (
            socket.connected
        ) {
            joinWorkspace();
        }

        return () => {
            socket.off(
                "connect",
                handleConnect
            );

            socket.off(
                "member:added",
                handleMemberAdded
            );

            socket.off(
                "member:role-updated",
                handleMemberRoleUpdated
            );

            socket.off(
                "member:removed",
                handleMemberRemoved
            );
        };
    }, [
        workspaceId,
        onWorkspaceChanged,
    ]);

    const handleAddMember =
        async (event) => {
            event.preventDefault();

            const trimmedEmail =
                email.trim();

            if (!trimmedEmail) {
                return;
            }

            try {
                setAdding(true);
                setError("");

                await addWorkspaceMember(
                    workspaceId,
                    {
                        email:
                            trimmedEmail,

                        role,
                    }
                );

                await fetchMembers();

                setEmail("");
                setRole("member");
            } catch (error) {
                setError(
                    error.response?.data
                        ?.message ||
                    "Failed to add member."
                );
            } finally {
                setAdding(false);
            }
        };

    const handleRoleChange =
        async (
            userId,
            newRole
        ) => {
            try {
                setUpdatingUserId(
                    userId
                );

                setError("");

                await updateWorkspaceMemberRole(
                    workspaceId,
                    userId,
                    newRole
                );

                await fetchMembers();
            } catch (error) {
                setError(
                    error.response?.data
                        ?.message ||
                    "Failed to update role."
                );
            } finally {
                setUpdatingUserId(
                    null
                );
            }
        };

    const handleRemoveMember =
        async (
            member
        ) => {
            const confirmed =
                window.confirm(
                    `Remove ${member.name} from this workspace?`
                );

            if (!confirmed) {
                return;
            }

            try {
                setRemovingUserId(
                    member.id
                );

                setError("");

                await removeWorkspaceMember(
                    workspaceId,
                    member.id
                );

                await fetchMembers();
            } catch (error) {
                setError(
                    error.response?.data
                        ?.message ||
                    "Failed to remove member."
                );
            } finally {
                setRemovingUserId(
                    null
                );
            }
        };

    return (
        <section className="members-panel surface">
            <div className="members-panel__header">
                <div>
                    <h3>
                        Members
                    </h3>

                    <p>
                        {members.length}{" "}
                        {members.length ===
                            1
                            ? "member"
                            : "members"}
                    </p>
                </div>

                <div className="members-icon">
                    👥
                </div>
            </div>

            {error && (
                <div className="error-message">
                    {error}
                </div>
            )}

            {canAddMembers && (
                <form
                    className="member-add-form"
                    onSubmit={
                        handleAddMember
                    }
                >
                    <div className="member-add-form__field">
                        <label>
                            Add member
                        </label>

                        <input
                            type="email"
                            placeholder="user@example.com"
                            value={email}
                            onChange={(
                                event
                            ) =>
                                setEmail(
                                    event.target
                                        .value
                                )
                            }
                        />
                    </div>

                    <div className="member-add-form__role">
                        <label>
                            Role
                        </label>

                        <select
                            value={role}
                            onChange={(
                                event
                            ) =>
                                setRole(
                                    event.target
                                        .value
                                )
                            }
                        >
                            <option value="admin">
                                Admin
                            </option>

                            <option value="member">
                                Member
                            </option>

                            <option value="viewer">
                                Viewer
                            </option>
                        </select>
                    </div>

                    <button
                        type="submit"
                        disabled={
                            adding
                        }
                    >
                        {adding
                            ? "Adding..."
                            : "Add Member"}
                    </button>
                </form>
            )}

            <div className="members-divider" />

            {loading ? (
                <div className="members-loading">
                    Loading members...
                </div>
            ) : (
                <div className="members-list">
                    {members.map(
                        (member) => {
                            const isOwner =
                                member.role ===
                                "owner";

                            const initial =
                                member.name
                                    ?.trim()
                                    ?.charAt(0)
                                    ?.toUpperCase() ||
                                "U";

                            return (
                                <div
                                    key={
                                        member.id
                                    }
                                    className="member-row"
                                >
                                    <div className="member-row__identity">
                                        <div className="member-avatar">
                                            {
                                                initial
                                            }
                                        </div>

                                        <div className="member-row__details">
                                            <div className="member-row__name-line">
                                                <strong>
                                                    {
                                                        member.name
                                                    }
                                                </strong>

                                                <span
                                                    className={`role-badge role-badge--${member.role}`}
                                                >
                                                    {
                                                        member.role
                                                    }
                                                </span>
                                            </div>

                                            <span className="member-email">
                                                {
                                                    member.email
                                                }
                                            </span>
                                        </div>
                                    </div>

                                    {!isOwner &&
                                        (canChangeRoles ||
                                            canRemoveMembers) && (
                                            <div className="member-row__actions">
                                                {canChangeRoles && (
                                                    <select
                                                        className="member-role-select"
                                                        value={
                                                            member.role
                                                        }
                                                        disabled={
                                                            updatingUserId ===
                                                            member.id
                                                        }
                                                        onChange={(
                                                            event
                                                        ) =>
                                                            handleRoleChange(
                                                                member.id,
                                                                event
                                                                    .target
                                                                    .value
                                                            )
                                                        }
                                                    >
                                                        <option value="admin">
                                                            Admin
                                                        </option>

                                                        <option value="member">
                                                            Member
                                                        </option>

                                                        <option value="viewer">
                                                            Viewer
                                                        </option>
                                                    </select>
                                                )}

                                                {canRemoveMembers && (
                                                    <button
                                                        type="button"
                                                        className="button button--danger button--small"
                                                        disabled={
                                                            removingUserId ===
                                                            member.id
                                                        }
                                                        onClick={() =>
                                                            handleRemoveMember(
                                                                member
                                                            )
                                                        }
                                                    >
                                                        {removingUserId ===
                                                            member.id
                                                            ? "..."
                                                            : "Remove"}
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                </div>
                            );
                        }
                    )}
                </div>
            )}
        </section>
    );
};

export default WorkspaceMembers;
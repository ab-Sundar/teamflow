import {
    useEffect,
    useState,
} from "react";

import {
    Link,
} from "react-router-dom";

import AppLayout from "../components/AppLayout";

import {
    createWorkspace,
    getUserWorkspaces,
} from "../services/workspaceApi";

const Dashboard = () => {
    const [
        workspaces,
        setWorkspaces,
    ] = useState([]);

    const [
        workspaceName,
        setWorkspaceName,
    ] = useState("");

    const [
        loading,
        setLoading,
    ] = useState(true);

    const [
        creating,
        setCreating,
    ] = useState(false);

    const [
        error,
        setError,
    ] = useState("");

    const fetchWorkspaces =
        async () => {
            try {
                setError("");

                const data =
                    await getUserWorkspaces();

                setWorkspaces(
                    data.workspaces
                );
            } catch (error) {
                setError(
                    error.response?.data
                        ?.message ||
                    "Failed to load workspaces."
                );
            } finally {
                setLoading(false);
            }
        };

    useEffect(() => {
        fetchWorkspaces();
    }, []);

    const handleCreateWorkspace =
        async (event) => {
            event.preventDefault();

            const trimmedName =
                workspaceName.trim();

            if (!trimmedName) {
                return;
            }

            try {
                setError("");
                setCreating(true);

                await createWorkspace({
                    name: trimmedName,
                });

                setWorkspaceName("");

                await fetchWorkspaces();
            } catch (error) {
                setError(
                    error.response?.data
                        ?.message ||
                    "Failed to create workspace."
                );
            } finally {
                setCreating(false);
            }
        };

    const getRoleClass = (
        role
    ) => {
        return `role-badge role-badge--${role}`;
    };

    return (
        <AppLayout>
            <section className="dashboard-page">
                <div className="section-header">
                    <div className="section-header__text">
                        <span className="eyebrow">
                            Workspace overview
                        </span>

                        <h2>
                            Your Workspaces
                        </h2>

                        <p>
                            Manage your projects,
                            teams and boards from
                            one place.
                        </p>
                    </div>

                    <div className="workspace-count">
                        <span className="workspace-count__number">
                            {workspaces.length}
                        </span>

                        <span className="workspace-count__label">
                            Workspaces
                        </span>
                    </div>
                </div>

                <div className="workspace-create-card surface">
                    <div>
                        <h3>
                            Create a workspace
                        </h3>

                        <p>
                            Start a new space for
                            your team or project.
                        </p>
                    </div>

                    <form
                        className="workspace-create-form"
                        onSubmit={
                            handleCreateWorkspace
                        }
                    >
                        <input
                            type="text"
                            placeholder="Workspace name"
                            value={
                                workspaceName
                            }
                            onChange={(
                                event
                            ) =>
                                setWorkspaceName(
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
                                ? "Creating..."
                                : "Create Workspace"}
                        </button>
                    </form>
                </div>

                {error && (
                    <div className="error-message">
                        {error}
                    </div>
                )}

                {loading && (
                    <div className="dashboard-loading">
                        Loading workspaces...
                    </div>
                )}

                {!loading &&
                    workspaces.length ===
                    0 && (
                        <div className="empty-state">
                            <div className="empty-state__icon">
                                +
                            </div>

                            <h3>
                                No workspaces yet
                            </h3>

                            <p>
                                Create your first
                                workspace to start
                                building boards and
                                collaborating with
                                your team.
                            </p>
                        </div>
                    )}

                {!loading &&
                    workspaces.length >
                    0 && (
                        <div className="workspace-grid">
                            {workspaces.map(
                                (
                                    workspace
                                ) => (
                                    <article
                                        key={
                                            workspace.id
                                        }
                                        className="workspace-card surface"
                                    >
                                        <div className="workspace-card__top">
                                            <div className="workspace-card__icon">
                                                {workspace.name
                                                    ?.trim()
                                                    ?.charAt(0)
                                                    ?.toUpperCase() ||
                                                    "W"}
                                            </div>

                                            <span
                                                className={
                                                    getRoleClass(
                                                        workspace.role
                                                    )
                                                }
                                            >
                                                {
                                                    workspace.role
                                                }
                                            </span>
                                        </div>

                                        <div className="workspace-card__content">
                                            <h3>
                                                {
                                                    workspace.name
                                                }
                                            </h3>

                                            <p>
                                                Open this
                                                workspace to
                                                manage boards,
                                                members and
                                                tasks.
                                            </p>
                                        </div>

                                        <div className="workspace-card__footer">
                                            <Link
                                                className="workspace-open-link"
                                                to={`/workspaces/${workspace.id}`}
                                            >
                                                Open Workspace
                                                <span>
                                                    →
                                                </span>
                                            </Link>
                                        </div>
                                    </article>
                                )
                            )}
                        </div>
                    )}
            </section>
        </AppLayout>
    );
};

export default Dashboard;
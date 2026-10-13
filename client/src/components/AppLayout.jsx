import { useAuth } from "../context/AuthContext";

const AppLayout = ({ children }) => {
    const { user, logout } = useAuth();

    const userInitial =
        user?.name?.trim()?.charAt(0)?.toUpperCase() || "U";

    return (
        <div className="app-shell">
            <header className="app-header">
                <div className="app-header__brand">
                    <div className="brand-mark">
                        T
                    </div>

                    <div>
                        <h1 className="brand-name">
                            Teamflow
                        </h1>

                        <span className="brand-subtitle">
                            Project workspace
                        </span>
                    </div>
                </div>

                <div className="app-header__user">
                    <div className="user-avatar">
                        {userInitial}
                    </div>

                    <div className="user-info">
                        <span className="user-name">
                            {user?.name}
                        </span>

                        <span className="user-email">
                            {user?.email}
                        </span>
                    </div>

                    <button
                        type="button"
                        className="button button--secondary button--small"
                        onClick={logout}
                    >
                        Logout
                    </button>
                </div>
            </header>

            <main className="app-main">
                <div className="page-container">
                    {children}
                </div>
            </main>
        </div>
    );
};

export default AppLayout;
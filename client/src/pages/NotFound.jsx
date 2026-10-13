import { Link } from "react-router-dom";

const NotFound = () => {
    return (
        <main className="not-found-page">
            <div className="not-found-card">
                <p className="not-found-code">
                    404
                </p>

                <h1>
                    Page not found
                </h1>

                <p>
                    The page you are looking for
                    does not exist.
                </p>

                <Link
                    to="/"
                    className="primary-button"
                >
                    Back to dashboard
                </Link>
            </div>
        </main>
    );
};

export default NotFound;
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      await login(formData);
      navigate("/");
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Login failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-visual">
        <div className="auth-brand">
          <div className="brand-mark">
            T
          </div>

          <div>
            <h1>Teamflow</h1>
            <p>
              Organize projects. Collaborate in real time.
            </p>
          </div>
        </div>

        <div className="auth-visual__content">
          <span className="eyebrow">
            Project management made simple
          </span>

          <h2>
            Keep your team aligned and your work moving.
          </h2>

          <p>
            Manage workspaces, boards, tasks, members and realtime
            collaboration from one place.
          </p>

          <div className="auth-feature-list">
            <div className="auth-feature">
              <span>✓</span>
              Realtime board updates
            </div>

            <div className="auth-feature">
              <span>✓</span>
              Role-based team management
            </div>

            <div className="auth-feature">
              <span>✓</span>
              Drag-and-drop task workflows
            </div>
          </div>
        </div>
      </div>

      <div className="auth-panel">
        <div className="auth-card">
          <div className="auth-card__header">
            <span className="auth-mobile-brand">
              Teamflow
            </span>

            <h2>
              Welcome back
            </h2>

            <p>
              Sign in to continue to your workspace.
            </p>
          </div>

          <form
            className="auth-form"
            onSubmit={handleSubmit}
          >
            <div className="auth-form__group">
              <label htmlFor="login-email">
                Email
              </label>

              <input
                id="login-email"
                type="email"
                name="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="auth-form__group">
              <label htmlFor="login-password">
                Password
              </label>

              <input
                id="login-password"
                type="password"
                name="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>

            {error && (
              <div className="error-message">
                {error}
              </div>
            )}

            <button
              className="auth-submit-button"
              type="submit"
              disabled={loading}
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>

          <div className="auth-footer">
            <span>
              Don't have an account?
            </span>

            <Link to="/register">
              Create account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
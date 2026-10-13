import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
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
      await register(formData);

      navigate("/login", {
        state: {
          message: "Registration successful. Please login.",
        },
      });
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Registration failed. Please try again."
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
            Build better workflows
          </span>

          <h2>
            Bring projects, people and tasks together.
          </h2>

          <p>
            Create workspaces, organize boards and collaborate with your
            team using a single workflow.
          </p>

          <div className="auth-feature-list">
            <div className="auth-feature">
              <span>✓</span>
              Workspace-based collaboration
            </div>

            <div className="auth-feature">
              <span>✓</span>
              Owner, admin, member and viewer roles
            </div>

            <div className="auth-feature">
              <span>✓</span>
              Realtime task management
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
              Create your account
            </h2>

            <p>
              Get started with your first Teamflow workspace.
            </p>
          </div>

          <form
            className="auth-form"
            onSubmit={handleSubmit}
          >
            <div className="auth-form__group">
              <label htmlFor="register-name">
                Name
              </label>

              <input
                id="register-name"
                type="text"
                name="name"
                placeholder="Your name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="auth-form__group">
              <label htmlFor="register-email">
                Email
              </label>

              <input
                id="register-email"
                type="email"
                name="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="auth-form__group">
              <label htmlFor="register-password">
                Password
              </label>

              <input
                id="register-password"
                type="password"
                name="password"
                placeholder="Create a password"
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
              {loading ? "Creating account..." : "Create Account"}
            </button>
          </form>

          <div className="auth-footer">
            <span>
              Already have an account?
            </span>

            <Link to="/login">
              Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
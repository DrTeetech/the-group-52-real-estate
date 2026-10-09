import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { ApiError } from "../services/apiClient.js";
import { useAuth } from "../context/AuthContext.jsx";

export default function LoginPage() {
  const { isAuthenticated, user, signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (isAuthenticated && user?.role === "customer") {
    return <Navigate to="/leases" replace />;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      await signIn(email.trim(), password);
      navigate(location.state?.from?.pathname || "/leases", { replace: true });
    } catch (requestError) {
      setError(
        requestError instanceof ApiError
          ? requestError.message
          : requestError.message || "Unable to sign in. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-panel">
        <NavBrand />
        <p className="eyebrow">Your home, in view</p>
        <h1>Welcome back.</h1>
        <p className="login-intro">
          Sign in to review your lease details and payment history.
        </p>
        {location.state?.registrationSuccess && (
          <p className="form-success" role="status">
            {location.state.registrationSuccess}
          </p>
        )}
        <form className="login-form" onSubmit={handleSubmit}>
          <label htmlFor="email">Email address</label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <button
            className="button button-primary login-submit"
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Signing in..." : "Sign in"}
          </button>
        </form>
        <p className="login-note">
          Use the email and password for your existing customer account.
        </p>
        <p className="auth-switch">
          New to Homeground? <Link to="/register">Create an account</Link>
        </p>
      </section>
      <aside className="login-aside" aria-label="Homeground">
        <div className="aside-content">
          <span className="aside-tag">A better way to rent</span>
          <h2>Feel at home with the details taken care of.</h2>
          <p>Your lease and payment records, together in one calm space.</p>
        </div>
        <div className="aside-orbit orbit-one" />
        <div className="aside-orbit orbit-two" />
      </aside>
    </main>
  );
}

function NavBrand() {
  return (
    <div className="brand login-brand">
      <span className="brand-mark" aria-hidden="true">
        H
      </span>
      <span>homeground</span>
    </div>
  );
}

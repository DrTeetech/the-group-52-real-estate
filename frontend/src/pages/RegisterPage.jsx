import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { register } from "../services/authService.js";

const INITIAL_FORM = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  password: "",
  confirmPassword: "",
};

export default function RegisterPage() {
  const [form, setForm] = useState(INITIAL_FORM);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    const firstName = form.firstName.trim();
    const lastName = form.lastName.trim();
    const email = form.email.trim().toLowerCase();
    const phone = form.phone.trim();

    if (firstName.length < 2 || firstName.length > 50) {
      setError("First name must be between 2 and 50 characters.");
      return;
    }
    if (lastName.length < 2 || lastName.length > 50) {
      setError("Last name must be between 2 and 50 characters.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Enter a valid email address.");
      return;
    }
    if (!phone) {
      setError("Enter your phone number.");
      return;
    }
    if (form.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError("The passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    try {
      await register({ firstName, lastName, email, phone, password: form.password });
      setForm(INITIAL_FORM);
      navigate("/login", {
        replace: true,
        state: { registrationSuccess: "Account created. You can now log in." },
      });
    } catch (requestError) {
      setError(requestError.message || "Unable to create your account.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-panel register-panel">
        <Link className="brand login-brand" to="/login" aria-label="Homeground">
          <span className="brand-mark" aria-hidden="true">
            H
          </span>
          <span>homeground</span>
        </Link>
        <p className="eyebrow">Get started</p>
        <h1>Create your account.</h1>
        <p className="login-intro">
          Set up your customer account to access your rental information.
        </p>
        <form className="login-form register-form" onSubmit={handleSubmit}>
          <div className="form-row">
            <div>
              <label htmlFor="firstName">First name</label>
              <input
                id="firstName"
                name="firstName"
                type="text"
                autoComplete="given-name"
                minLength={2}
                maxLength={50}
                value={form.firstName}
                onChange={updateField}
                required
              />
            </div>
            <div>
              <label htmlFor="lastName">Last name</label>
              <input
                id="lastName"
                name="lastName"
                type="text"
                autoComplete="family-name"
                minLength={2}
                maxLength={50}
                value={form.lastName}
                onChange={updateField}
                required
              />
            </div>
          </div>
          <label htmlFor="email">Email address</label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            value={form.email}
            onChange={updateField}
            required
          />
          <label htmlFor="phone">Phone number</label>
          <input
            id="phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            value={form.phone}
            onChange={updateField}
            required
          />
          <label htmlFor="password">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            value={form.password}
            onChange={updateField}
            aria-describedby="password-requirement"
            required
          />
          <span id="password-requirement" className="field-hint">
            Use at least 8 characters.
          </span>
          <label htmlFor="confirmPassword">Confirm password</label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            minLength={8}
            value={form.confirmPassword}
            onChange={updateField}
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
            {isSubmitting ? "Creating account..." : "Create account"}
          </button>
        </form>
        <p className="auth-switch">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </section>
      <aside className="login-aside" aria-label="Homeground">
        <div className="aside-content">
          <span className="aside-tag">A better way to rent</span>
          <h2>Start your next chapter from home.</h2>
          <p>Create a customer account to keep your rental details close.</p>
        </div>
        <div className="aside-orbit orbit-one" />
        <div className="aside-orbit orbit-two" />
      </aside>
    </main>
  );
}

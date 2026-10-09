import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  async function submit(e) {
    e.preventDefault();
    setError("");
    try {
      const data = await api.login(form);
      login(data);
      navigate(location.state?.from || "/dashboard");
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <main className="auth-page">
      <form className="auth-card" onSubmit={submit}>
        <span className="eyebrow">WELCOME BACK</span>
        <h1>Sign in</h1>
        <p className="muted">Access your Group 52 Estates account.</p>
        {error && <div className="alert error">{error}</div>}
        <label>Email</label>
        <input required type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
        <label>Password</label>
        <input required type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} />
        <button className="btn btn-primary full">Login</button>
        <p className="auth-switch">Don't have an account? <Link to="/register">Create one</Link></p>
      </form>
    </main>
  );
}

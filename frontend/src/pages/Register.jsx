import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function Register() {
  const [form, setForm] = useState({
    firstName: "", lastName: "", email: "", phone: "", password: ""
  });
  const [error, setError] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  function change(e) {
    setForm({...form, [e.target.name]: e.target.value});
  }

  async function submit(e) {
    e.preventDefault();
    setError("");
    try {
      const data = await api.register(form);
      login(data);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <main className="auth-page">
      <form className="auth-card" onSubmit={submit}>
        <span className="eyebrow">CREATE ACCOUNT</span>
        <h1>Join Group 52 Estates</h1>
        {error && <div className="alert error">{error}</div>}
        <div className="two-col">
          <div><label>First name</label><input required name="firstName" value={form.firstName} onChange={change} /></div>
          <div><label>Last name</label><input required name="lastName" value={form.lastName} onChange={change} /></div>
        </div>
        <label>Email</label>
        <input required type="email" name="email" value={form.email} onChange={change} />
        <label>Phone</label>
        <input required name="phone" value={form.phone} onChange={change} />
        <label>Password</label>
        <input required minLength="8" type="password" name="password" value={form.password} onChange={change} />
        <button className="btn btn-primary full">Create Account</button>
        <p className="auth-switch">Already registered? <Link to="/login">Login</Link></p>
      </form>
    </main>
  );
}

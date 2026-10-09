import { useState } from 'react';
import { Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { roleDashboardPath } from '../../data/roles';
import AuthLayout from './AuthLayout';

export default function LoginPage() {
  const { user, login, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '', remember: true });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (user) {
    const redirectPath = roleDashboardPath[user.role] || '/dashboard';
    return <Navigate to={redirectPath} replace />;
  }

  function handleChange(event) {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
    }));
    setError('');
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!form.email.trim() || !form.password.trim()) {
      setError('Please enter both your email and password.');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setError('Please enter a valid email address.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const signedInUser = await login({ email: form.email, password: form.password, remember: form.remember });
      navigate(roleDashboardPath[signedInUser.role] || '/dashboard', { replace: true });
    } catch (loginError) {
      setError(loginError.message || 'Unable to log in.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to manage rents, applications, and tenants."
      footerText="Need an account?"
      footerLink="/register"
      footerLinkText="Create one"
    >
      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <div className="field-group">
          <label htmlFor="login-email">Email address</label>
          <div className="input-with-icon">
            <Mail size={16} />
            <input
              id="login-email"
              name="email"
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="field-group">
          <label htmlFor="login-password">Password</label>
          <div className="input-with-icon password-wrap">
            <Lock size={16} />
            <input
              id="login-password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter your password"
              value={form.password}
              onChange={handleChange}
            />
            <button type="button" className="password-toggle" onClick={() => setShowPassword((state) => !state)} aria-label="Toggle password visibility">
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <div className="auth-row">
          <label className="checkbox-row">
            <input type="checkbox" name="remember" checked={form.remember} onChange={handleChange} />
            <span>Remember me</span>
          </label>
          <Link to="/forgot-password">Forgot password?</Link>
        </div>

        {error && <div className="form-message error-message">{error}</div>}

        <button className="primary-button" type="submit" disabled={isSubmitting || authLoading}>
          {isSubmitting || authLoading ? 'Signing in…' : 'Sign in'}
        </button>

        <div className="demo-account-box">
          <strong>Temporary development/test accounts</strong>
          <p>tenant@keyhouse.com · manager@keyhouse.com · landlord@keyhouse.com · admin@keyhouse.com</p>
          <small>Legacy references only. Login validates against MongoDB; these accounts work only if they exist in the backend.</small>
        </div>
      </form>
    </AuthLayout>
  );
}

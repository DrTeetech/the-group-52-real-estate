import { useState } from 'react';
import { Eye, EyeOff, Lock, Mail, Phone, User } from 'lucide-react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ROLE, roleDashboardPath } from '../../data/roles';
import AuthLayout from './AuthLayout';

const roleOptions = [
  { label: 'Tenant', value: ROLE.TENANT },
];

export default function RegisterPage() {
  const { user, register, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '', role: ROLE.TENANT });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (user) {
    return <Navigate to={roleDashboardPath[user.role] || '/dashboard'} replace />;
  }

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setError('');
    setSuccess('');
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!form.name.trim() || !form.email.trim() || !form.phone.trim() || !form.password || !form.confirmPassword) {
      setError('Please complete all fields to create your account.');
      return;
    }

    if (form.name.trim().split(/\s+/).filter(Boolean).length < 2) {
      setError('Please enter both your first and last name.');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setError('Please enter a valid email address.');
      return;
    }

    if (form.password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (!/^\+?[0-9 ()-]{7,20}$/.test(form.phone.trim())) {
      setError('Please enter a valid phone number.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const registeredUser = await register({ name: form.name, email: form.email, phone: form.phone, password: form.password });
      setSuccess('Account created successfully. Redirecting to your dashboard…');
      navigate(roleDashboardPath[registeredUser.role] || '/dashboard', { replace: true });
    } catch (registerError) {
      setError(registerError.message || 'Unable to create account.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Join the Keyhouse platform and manage property operations with confidence."
      footerText="Already have an account?"
      footerLink="/login"
      footerLinkText="Sign in"
    >
      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <div className="field-group">
          <label htmlFor="register-name">Full name</label>
          <div className="input-with-icon">
            <User size={16} />
            <input id="register-name" name="name" type="text" value={form.name} placeholder="Jane Okafor" onChange={handleChange} />
          </div>
        </div>

        <div className="field-group">
          <label htmlFor="register-email">Email address</label>
          <div className="input-with-icon">
            <Mail size={16} />
            <input id="register-email" name="email" type="email" value={form.email} placeholder="you@example.com" onChange={handleChange} />
          </div>
        </div>

        <div className="field-group">
          <label htmlFor="register-phone">Phone number</label>
          <div className="input-with-icon">
            <Phone size={16} />
            <input id="register-phone" name="phone" type="tel" value={form.phone} placeholder="+234 800 000 0000" onChange={handleChange} />
          </div>
        </div>

        <div className="field-group">
          <label htmlFor="register-role">Role</label>
          <select id="register-role" name="role" className="select-field" value={form.role} onChange={handleChange}>
            {roleOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>

        <div className="field-group">
          <label htmlFor="register-password">Password</label>
          <div className="input-with-icon password-wrap">
            <Lock size={16} />
            <input
              id="register-password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              value={form.password}
              placeholder="Create a password"
              onChange={handleChange}
            />
            <button type="button" className="password-toggle" onClick={() => setShowPassword((state) => !state)} aria-label="Toggle password visibility">
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <div className="field-group">
          <label htmlFor="register-confirm-password">Confirm password</label>
          <div className="input-with-icon password-wrap">
            <Lock size={16} />
            <input
              id="register-confirm-password"
              name="confirmPassword"
              type={showPassword ? 'text' : 'password'}
              value={form.confirmPassword}
              placeholder="Confirm your password"
              onChange={handleChange}
            />
            <button type="button" className="password-toggle" onClick={() => setShowPassword((state) => !state)} aria-label="Toggle password visibility">
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {error && <div className="form-message error-message">{error}</div>}
        {success && <div className="form-message success-message">{success}</div>}

        <button className="primary-button" type="submit" disabled={isSubmitting || authLoading}>
          {isSubmitting || authLoading ? 'Creating account…' : 'Create account'}
        </button>
      </form>
    </AuthLayout>
  );
}

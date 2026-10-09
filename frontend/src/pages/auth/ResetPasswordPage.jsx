import { useState } from 'react';
import { Eye, EyeOff, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';
import AuthLayout from './AuthLayout';

export default function ResetPasswordPage() {
  const [form, setForm] = useState({ password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setError('');
    setSuccess('');
  }

  function handleSubmit(event) {
    event.preventDefault();

    if (!form.password || !form.confirmPassword) {
      setError('Please complete both password fields.');
      return;
    }

    if (form.password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError('The passwords do not match.');
      return;
    }

    setSuccess('Your password has been updated successfully.');
    setError('');
  }

  return (
    <AuthLayout
      title="Set a new password"
      subtitle="Create a secure password for your Keyhouse account."
      footerText="Return to"
      footerLink="/login"
      footerLinkText="login"
    >
      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <div className="field-group">
          <label htmlFor="reset-password">New password</label>
          <div className="input-with-icon password-wrap">
            <Lock size={16} />
            <input id="reset-password" name="password" type={showPassword ? 'text' : 'password'} value={form.password} onChange={handleChange} placeholder="New password" />
            <button type="button" className="password-toggle" onClick={() => setShowPassword((state) => !state)} aria-label="Toggle password visibility">
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <div className="field-group">
          <label htmlFor="reset-confirm-password">Confirm password</label>
          <div className="input-with-icon password-wrap">
            <Lock size={16} />
            <input id="reset-confirm-password" name="confirmPassword" type={showConfirmPassword ? 'text' : 'password'} value={form.confirmPassword} onChange={handleChange} placeholder="Confirm password" />
            <button type="button" className="password-toggle" onClick={() => setShowConfirmPassword((state) => !state)} aria-label="Toggle confirm password visibility">
              {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {error && <div className="form-message error-message">{error}</div>}
        {success && <div className="form-message success-message">{success}</div>}

        <button className="primary-button" type="submit">Update password</button>
        <Link className="secondary-link" to="/login">Back to sign in</Link>
      </form>
    </AuthLayout>
  );
}

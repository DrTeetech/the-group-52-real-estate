import { useState } from 'react';
import { Mail } from 'lucide-react';
import { Link } from 'react-router-dom';
import AuthLayout from './AuthLayout';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  function handleSubmit(event) {
    event.preventDefault();

    if (!email.trim()) {
      setError('Please enter your email address.');
      setMessage('');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address.');
      setMessage('');
      return;
    }

    setError('');
    setMessage('A password reset link has been sent to your email.');
  }

  return (
    <AuthLayout
      title="Reset your password"
      subtitle="Enter the email connected to your Keyhouse account."
      footerText="Remembered it?"
      footerLink="/login"
      footerLinkText="Back to login"
    >
      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <div className="field-group">
          <label htmlFor="forgot-email">Email address</label>
          <div className="input-with-icon">
            <Mail size={16} />
            <input id="forgot-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" />
          </div>
        </div>

        {error && <div className="form-message error-message">{error}</div>}
        {message && <div className="form-message success-message">{message}</div>}

        <button className="primary-button" type="submit">Send reset link</button>
      </form>
    </AuthLayout>
  );
}

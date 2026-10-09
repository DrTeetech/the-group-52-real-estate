import { Link } from 'react-router-dom';

export default function AuthLayout({ title, subtitle, children, footerText, footerLink, footerLinkText }) {
  return (
    <div className="auth-shell">
      <div className="auth-card-wrap">
        <div className="auth-brand-block">
          <Link to="/" className="brand auth-brand" aria-label="Keyhouse home">
            <span className="brand-mark">k.</span>
            <span>keyhouse</span>
          </Link>
          <p className="auth-kicker">Property management, made calmer.</p>
          <div className="auth-preview-card">
            <div className="mini-stat">
              <strong>One workspace</strong>
              <span>Properties, applications, and leases</span>
            </div>
            <div className="mini-stat">
              <strong>Clear records</strong>
              <span>Payments, maintenance, and updates</span>
            </div>
          </div>
        </div>
        <div className="auth-form-panel">
          <div className="auth-header">
            <p className="eyebrow">KEYHOUSE ACCESS</p>
            <h1>{title}</h1>
            {subtitle && <p className="auth-subtitle">{subtitle}</p>}
          </div>
          {children}
          {footerText && (
            <p className="auth-footer">
              {footerText}{' '}
              <Link to={footerLink}>{footerLinkText}</Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

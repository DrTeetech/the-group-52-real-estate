import { ShieldAlert } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function UnauthorizedPage() {
  return (
    <div className="auth-shell unauthorized-shell">
      <div className="auth-card-wrap unauthorized-card">
        <div className="unauthorized-icon"><ShieldAlert size={36} /></div>
        <p className="eyebrow">ACCESS DENIED</p>
        <h1>You do not have access to this dashboard.</h1>
        <p>Please return to the appropriate workspace for your user role.</p>
        <Link className="primary-button" to="/login">Return to login</Link>
      </div>
    </div>
  );
}

import { Bell, LogOut, Menu } from 'lucide-react';
import { Link } from 'react-router-dom';
import { roleLabel } from '../../data/roles';

export default function Navbar({ onMenuClick, menuOpen = false, menuButtonRef, title = 'Workspace', subtitle = 'Overview', user, onLogout, notificationCount = 0 }) {
  return (
    <header className="workspace-navbar">
      <button ref={menuButtonRef} className="icon-button mobile-menu" type="button" aria-label={menuOpen ? 'Close navigation' : 'Open navigation'} aria-expanded={menuOpen} aria-controls="workspace-sidebar" onClick={onMenuClick}>
        <Menu size={21} />
      </button>
      <div className="breadcrumb">
        <span>{title}</span>
        <span className="breadcrumb-slash">/</span>
        <strong>{subtitle}</strong>
      </div>
      <div className="navbar-actions">
        <Link className="icon-button notification-button" to="/notifications" aria-label="Notifications">
          <Bell size={19} />{notificationCount > 0 && <span className="notification-dot" aria-label={`${notificationCount} unread notifications`}>{notificationCount > 9 ? '9+' : notificationCount}</span>}
        </Link>
        <div className="navbar-user-pill">
          <span className="navbar-user-details"><strong>{user?.name}</strong><small>{roleLabel(user?.role)}</small></span>
          <Link className="navbar-avatar" to="/" aria-label="Return to Keyhouse home">{user?.avatar || 'AO'}</Link>
          {onLogout ? (
            <button type="button" className="icon-button small-logout" aria-label="Logout" onClick={onLogout}>
              <LogOut size={15} />
            </button>
          ) : null}
        </div>
      </div>
    </header>
  );
}

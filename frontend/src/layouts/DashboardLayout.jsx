import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/layout/Navbar.jsx';
import Sidebar from '../components/layout/Sidebar.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useNotifications } from '../context/NotificationContext.jsx';

export default function DashboardLayout({ title = 'Workspace', subtitle = 'Overview', navItems = [], user, children }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButtonRef = useRef(null);
  const { logout } = useAuth();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  function closeMenu() {
    setMenuOpen(false);
    menuButtonRef.current?.focus();
  }

  return (
    <div className="workspace-shell">
      <a className="skip-to-content" href="#main-content">Skip to main content</a>
      <Sidebar open={menuOpen} onClose={closeMenu} onEscape={closeMenu} items={navItems} user={user || { name: 'Guest User', avatar: 'GU', role: 'guest' }} onLogout={handleLogout} />
      <div className="workspace-main">
        <Navbar title={title} subtitle={subtitle} menuOpen={menuOpen} menuButtonRef={menuButtonRef} onMenuClick={() => menuOpen ? closeMenu() : setMenuOpen(true)} user={user || { avatar: 'GU' }} onLogout={handleLogout} notificationCount={unreadCount} />
        <main id="main-content" className="workspace-content" tabIndex="-1">
          <div className="workspace-kicker">KEYHOUSE • {title.toUpperCase()}</div>
          <h1>{title}</h1>
          {children}
        </main>
      </div>
    </div>
  );
}
